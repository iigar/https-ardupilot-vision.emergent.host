"""
Visual Homing Configuration
Конфігурація системи візуальної навігації
"""
import os
from dataclasses import dataclass
from enum import Enum


class CameraType(Enum):
    USB_CAPTURE = "usb"      # EasyCap USB (Caddx Thermal)
    PI_CAMERA = "picamera"   # Raspberry Pi Camera CSI


class SystemState(Enum):
    IDLE = "idle"
    RECORDING = "recording"
    RETURNING = "returning"
    ERROR = "error"


@dataclass
class CameraConfig:
    type: CameraType = CameraType.USB_CAPTURE
    device: str = "/dev/video0"
    width: int = 720
    height: int = 576
    fps: int = 25
    # Pi Camera specific
    pi_width: int = 1280
    pi_height: int = 720
    pi_fps: int = 30


@dataclass
class VisionConfig:
    # ORB Feature Detector
    orb_features: int = 500
    orb_scale_factor: float = 1.2
    orb_nlevels: int = 8
    
    # Feature Matching
    match_threshold: float = 30.0
    min_matches: int = 10
    
    # Keyframe Settings
    keyframe_distance: float = 2.0    # meters
    keyframe_angle: float = 15.0      # degrees
    keyframe_min_features: int = 50
    
    # Visual Odometry
    vo_min_displacement: float = 0.1  # meters


@dataclass
class NavigationConfig:
    # Return Navigation
    return_speed: float = 2.0         # m/s
    approach_threshold: float = 1.0   # meters to keyframe
    heading_tolerance: float = 10.0   # degrees
    
    # Position Estimation
    position_smoothing: float = 0.8
    max_position_jump: float = 5.0    # meters


@dataclass
class MAVLinkConfig:
    serial_port: str = "/dev/serial0"
    baudrate: int = 115200
    source_system: int = 1
    source_component: int = 191  # MAV_COMP_ID_VISUAL_INERTIAL_ODOMETRY
    
    # Message rates
    position_rate_hz: float = 20.0
    heartbeat_rate_hz: float = 1.0
    
    # External Navigation
    viso_delay_ms: int = 80


@dataclass
class WebConfig:
    host: str = "0.0.0.0"
    port: int = 5000
    debug: bool = False
    enable_video_stream: bool = True
    video_quality: int = 50  # JPEG quality


@dataclass
class Config:
    camera: CameraConfig = None
    vision: VisionConfig = None
    navigation: NavigationConfig = None
    mavlink: MAVLinkConfig = None
    web: WebConfig = None
    
    # Data paths
    data_dir: str = "/home/pi/visual_homing/data"
    route_dir: str = "/home/pi/visual_homing/routes"
    log_dir: str = "/home/pi/visual_homing/logs"
    
    # System
    autostart: bool = False
    test_mode: bool = False
    
    def __post_init__(self):
        if self.camera is None:
            self.camera = CameraConfig()
        if self.vision is None:
            self.vision = VisionConfig()
        if self.navigation is None:
            self.navigation = NavigationConfig()
        if self.mavlink is None:
            self.mavlink = MAVLinkConfig()
        if self.web is None:
            self.web = WebConfig()
    
    @classmethod
    def from_env(cls) -> 'Config':
        """Load configuration from environment variables"""
        config = cls()
        
        # Camera
        if os.environ.get('CAMERA_TYPE') == 'picamera':
            config.camera.type = CameraType.PI_CAMERA
        if os.environ.get('CAMERA_DEVICE'):
            config.camera.device = os.environ['CAMERA_DEVICE']
        
        # MAVLink
        if os.environ.get('MAVLINK_PORT'):
            config.mavlink.serial_port = os.environ['MAVLINK_PORT']
        if os.environ.get('MAVLINK_BAUD'):
            config.mavlink.baudrate = int(os.environ['MAVLINK_BAUD'])
        
        # Web
        if os.environ.get('WEB_PORT'):
            config.web.port = int(os.environ['WEB_PORT'])
        
        return config


# Default configuration instance
default_config = Config()
