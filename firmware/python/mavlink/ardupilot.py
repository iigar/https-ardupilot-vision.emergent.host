"""
ArduPilot MAVLink Interface
MAVLink комунікація з політним контролером ArduPilot
"""
import threading
import time
import logging
from typing import Optional, Callable, Dict
from dataclasses import dataclass
import struct

# Try to import pymavlink
try:
    from pymavlink import mavutil
    MAVLINK_AVAILABLE = True
except ImportError:
    MAVLINK_AVAILABLE = False

logger = logging.getLogger(__name__)


@dataclass
class VehicleState:
    """Current state from flight controller"""
    armed: bool = False
    mode: str = "UNKNOWN"
    altitude: float = 0.0        # meters (barometer)
    altitude_rel: float = 0.0    # meters above home
    heading: float = 0.0         # degrees
    groundspeed: float = 0.0     # m/s
    lat: float = 0.0
    lon: float = 0.0
    gps_fix: int = 0
    battery_voltage: float = 0.0
    battery_remaining: int = 100
    timestamp: float = 0.0


class ArduPilotInterface:
    """
    MAVLink interface for ArduPilot/ArduCopter
    Sends visual navigation data and receives telemetry
    """
    
    def __init__(
        self,
        serial_port: str = "/dev/serial0",
        baudrate: int = 115200,
        source_system: int = 1,
        source_component: int = 191
    ):
        self.serial_port = serial_port
        self.baudrate = baudrate
        self.source_system = source_system
        self.source_component = source_component
        
        self._connection = None
        self._connected = False
        self._running = False
        self._recv_thread: Optional[threading.Thread] = None
        self._heartbeat_thread: Optional[threading.Thread] = None
        
        self._vehicle_state = VehicleState()
        self._state_lock = threading.Lock()
        self._callbacks: Dict[str, list] = {}
    
    def connect(self, timeout: float = 10.0) -> bool:
        """
        Connect to flight controller via MAVLink
        
        Returns:
            True if connection successful
        """
        if not MAVLINK_AVAILABLE:
            logger.error("pymavlink not available")
            return False
        
        try:
            logger.info(f"Connecting to {self.serial_port} at {self.baudrate}")
            
            self._connection = mavutil.mavlink_connection(
                self.serial_port,
                baud=self.baudrate,
                source_system=self.source_system,
                source_component=self.source_component
            )
            
            # Wait for heartbeat
            logger.info("Waiting for heartbeat...")
            self._connection.wait_heartbeat(timeout=timeout)
            
            logger.info(f"Connected to system {self._connection.target_system}")
            
            self._connected = True
            self._running = True
            
            # Start receive thread
            self._recv_thread = threading.Thread(
                target=self._receive_loop,
                daemon=True
            )
            self._recv_thread.start()
            
            # Start heartbeat thread
            self._heartbeat_thread = threading.Thread(
                target=self._heartbeat_loop,
                daemon=True
            )
            self._heartbeat_thread.start()
            
            return True
            
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            self._connected = False
            return False
    
    def disconnect(self):
        """Disconnect from flight controller"""
        self._running = False
        self._connected = False
        
        if self._recv_thread:
            self._recv_thread.join(timeout=2.0)
        
        if self._heartbeat_thread:
            self._heartbeat_thread.join(timeout=2.0)
        
        if self._connection:
            self._connection.close()
            self._connection = None
        
        logger.info("Disconnected from MAVLink")
    
    def _receive_loop(self):
        """Receive messages from flight controller"""
        while self._running:
            try:
                msg = self._connection.recv_match(blocking=True, timeout=1.0)
                
                if msg is not None:
                    self._process_message(msg)
                    
            except Exception as e:
                logger.error(f"Receive error: {e}")
                time.sleep(0.1)
    
    def _heartbeat_loop(self):
        """Send periodic heartbeats"""
        while self._running:
            try:
                self._connection.mav.heartbeat_send(
                    mavutil.mavlink.MAV_TYPE_ONBOARD_CONTROLLER,
                    mavutil.mavlink.MAV_AUTOPILOT_INVALID,
                    0, 0, 0
                )
                time.sleep(1.0)
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
                time.sleep(1.0)
    
    def _process_message(self, msg):
        """Process received MAVLink message"""
        msg_type = msg.get_type()
        
        with self._state_lock:
            if msg_type == 'HEARTBEAT':
                self._vehicle_state.armed = msg.base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED
                self._vehicle_state.mode = mavutil.mode_string_v10(msg)
                
            elif msg_type == 'GLOBAL_POSITION_INT':
                self._vehicle_state.lat = msg.lat / 1e7
                self._vehicle_state.lon = msg.lon / 1e7
                self._vehicle_state.altitude = msg.alt / 1000.0
                self._vehicle_state.altitude_rel = msg.relative_alt / 1000.0
                self._vehicle_state.heading = msg.hdg / 100.0
                self._vehicle_state.timestamp = time.time()
                
            elif msg_type == 'VFR_HUD':
                self._vehicle_state.groundspeed = msg.groundspeed
                self._vehicle_state.altitude = msg.alt
                
            elif msg_type == 'GPS_RAW_INT':
                self._vehicle_state.gps_fix = msg.fix_type
                
            elif msg_type == 'BATTERY_STATUS':
                if msg.voltages[0] != 65535:
                    self._vehicle_state.battery_voltage = msg.voltages[0] / 1000.0
                self._vehicle_state.battery_remaining = msg.battery_remaining
        
        # Call registered callbacks
        if msg_type in self._callbacks:
            for callback in self._callbacks[msg_type]:
                try:
                    callback(msg)
                except Exception as e:
                    logger.error(f"Callback error: {e}")
    
    def send_vision_position(
        self,
        x: float,
        y: float,
        z: float,
        roll: float = 0.0,
        pitch: float = 0.0,
        yaw: float = 0.0,
        confidence: float = 0.95
    ):
        """
        Send vision position estimate to ArduPilot
        Uses VISION_POSITION_ESTIMATE message
        
        Args:
            x, y, z: Position in NED frame (meters)
            roll, pitch, yaw: Attitude (radians)
            confidence: Confidence level (0-1)
        """
        if not self._connected:
            return
        
        try:
            # Calculate covariance based on confidence
            # Lower confidence = higher covariance (less trust)
            pos_cov = (1.0 - confidence) * 10.0 + 0.01
            ang_cov = (1.0 - confidence) * 1.0 + 0.001
            
            # Covariance matrix (upper right triangle)
            covariance = [
                pos_cov, 0, 0, 0, 0, 0,
                pos_cov, 0, 0, 0, 0,
                pos_cov, 0, 0, 0,
                ang_cov, 0, 0,
                ang_cov, 0,
                ang_cov
            ]
            
            self._connection.mav.vision_position_estimate_send(
                int(time.time() * 1e6),  # usec timestamp
                x, y, z,
                roll, pitch, yaw,
                covariance,
                0  # reset_counter
            )
            
        except Exception as e:
            logger.error(f"Send vision position error: {e}")
    
    def send_vision_speed(
        self,
        vx: float,
        vy: float,
        vz: float,
        confidence: float = 0.95
    ):
        """
        Send vision speed estimate to ArduPilot
        Uses VISION_SPEED_ESTIMATE message
        """
        if not self._connected:
            return
        
        try:
            cov = (1.0 - confidence) * 5.0 + 0.01
            covariance = [cov, 0, 0, cov, 0, cov]  # diagonal
            
            self._connection.mav.vision_speed_estimate_send(
                int(time.time() * 1e6),
                vx, vy, vz,
                covariance,
                0
            )
        except Exception as e:
            logger.error(f"Send vision speed error: {e}")
    
    def send_velocity_command(
        self,
        vx: float,
        vy: float,
        vz: float,
        yaw_rate: float = 0.0
    ):
        """
        Send velocity command to ArduPilot (guided mode)
        Uses SET_POSITION_TARGET_LOCAL_NED
        """
        if not self._connected:
            return
        
        try:
            # Type mask: ignore position, use velocity
            type_mask = (
                mavutil.mavlink.POSITION_TARGET_TYPEMASK_X_IGNORE |
                mavutil.mavlink.POSITION_TARGET_TYPEMASK_Y_IGNORE |
                mavutil.mavlink.POSITION_TARGET_TYPEMASK_Z_IGNORE |
                mavutil.mavlink.POSITION_TARGET_TYPEMASK_AX_IGNORE |
                mavutil.mavlink.POSITION_TARGET_TYPEMASK_AY_IGNORE |
                mavutil.mavlink.POSITION_TARGET_TYPEMASK_AZ_IGNORE |
                mavutil.mavlink.POSITION_TARGET_TYPEMASK_YAW_IGNORE
            )
            
            self._connection.mav.set_position_target_local_ned_send(
                0,  # time_boot_ms
                self._connection.target_system,
                self._connection.target_component,
                mavutil.mavlink.MAV_FRAME_BODY_NED,
                type_mask,
                0, 0, 0,      # position (ignored)
                vx, vy, vz,   # velocity
                0, 0, 0,      # acceleration (ignored)
                0,            # yaw (ignored)
                yaw_rate      # yaw_rate
            )
        except Exception as e:
            logger.error(f"Send velocity command error: {e}")
    
    def register_callback(self, msg_type: str, callback: Callable):
        """Register callback for specific message type"""
        if msg_type not in self._callbacks:
            self._callbacks[msg_type] = []
        self._callbacks[msg_type].append(callback)
    
    @property
    def vehicle_state(self) -> VehicleState:
        """Get current vehicle state"""
        with self._state_lock:
            return self._vehicle_state
    
    @property
    def is_connected(self) -> bool:
        return self._connected
    
    @property
    def altitude(self) -> float:
        """Get current altitude (meters)"""
        with self._state_lock:
            return self._vehicle_state.altitude_rel
