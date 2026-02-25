"""
Flask Web Server for Visual Homing
Веб-інтерфейс моніторингу
"""
import cv2
import json
import time
import logging
import threading
from flask import Flask, Response, render_template_string, jsonify, request
from flask_socketio import SocketIO, emit
import numpy as np

logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'visual_homing_secret'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Global reference to visual homing system
_system = None
_web_config = None


HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Homing - Моніторинг</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', sans-serif;
            background: #0a0a0f;
            color: #e0e0e0;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 0;
            border-bottom: 1px solid #2a2a35;
            margin-bottom: 30px;
        }
        h1 {
            color: #4ecdc4;
            font-size: 24px;
            font-weight: 600;
        }
        .status-badge {
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }
        .status-idle { background: #2a2a35; color: #888; }
        .status-recording { background: #ff4444; color: white; }
        .status-returning { background: #44ff44; color: black; }
        
        .grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 30px;
        }
        
        .video-panel {
            background: #12121a;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #2a2a35;
        }
        .video-panel img {
            width: 100%;
            display: block;
        }
        .video-header {
            padding: 15px 20px;
            border-bottom: 1px solid #2a2a35;
            display: flex;
            justify-content: space-between;
        }
        
        .controls-panel {
            background: #12121a;
            border-radius: 12px;
            padding: 25px;
            border: 1px solid #2a2a35;
        }
        .control-group {
            margin-bottom: 25px;
        }
        .control-group h3 {
            color: #4ecdc4;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }
        
        button {
            width: 100%;
            padding: 15px 20px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            margin-bottom: 10px;
        }
        .btn-record {
            background: linear-gradient(135deg, #ff4444, #cc0000);
            color: white;
        }
        .btn-return {
            background: linear-gradient(135deg, #44ff44, #00cc00);
            color: black;
        }
        .btn-stop {
            background: linear-gradient(135deg, #666, #444);
            color: white;
        }
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .stat-box {
            background: #1a1a25;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: #4ecdc4;
        }
        .stat-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-top: 5px;
        }
        
        .telemetry {
            margin-top: 20px;
            font-family: monospace;
            background: #0a0a0f;
            padding: 15px;
            border-radius: 8px;
            font-size: 12px;
        }
        .telemetry-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #1a1a25;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .recording-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            background: #ff4444;
            border-radius: 50%;
            margin-right: 10px;
            animation: pulse 1s infinite;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🛩️ Visual Homing</h1>
            <span class="status-badge" id="statusBadge">IDLE</span>
        </header>
        
        <div class="grid">
            <div class="video-panel">
                <div class="video-header">
                    <span>📹 Камера</span>
                    <span id="fps">0 FPS</span>
                </div>
                <img src="/video_feed" id="videoFeed" alt="Camera Feed">
            </div>
            
            <div class="controls-panel">
                <div class="control-group">
                    <h3>Керування</h3>
                    <button class="btn-record" onclick="startRecording()">
                        ● Почати запис
                    </button>
                    <button class="btn-return" onclick="startReturn()">
                        ↩ Повернення
                    </button>
                    <button class="btn-stop" onclick="stopAll()">
                        ■ Стоп
                    </button>
                </div>
                
                <div class="control-group">
                    <h3>Статистика</h3>
                    <div class="stats-grid">
                        <div class="stat-box">
                            <div class="stat-value" id="keyframes">0</div>
                            <div class="stat-label">Keyframes</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value" id="altitude">0.0m</div>
                            <div class="stat-label">Висота</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value" id="features">0</div>
                            <div class="stat-label">Фічі</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value" id="progress">0%</div>
                            <div class="stat-label">Прогрес</div>
                        </div>
                    </div>
                </div>
                
                <div class="control-group">
                    <h3>Телеметрія</h3>
                    <div class="telemetry">
                        <div class="telemetry-row">
                            <span>Position X:</span>
                            <span id="posX">0.00 m</span>
                        </div>
                        <div class="telemetry-row">
                            <span>Position Y:</span>
                            <span id="posY">0.00 m</span>
                        </div>
                        <div class="telemetry-row">
                            <span>Heading:</span>
                            <span id="heading">0.0°</span>
                        </div>
                        <div class="telemetry-row">
                            <span>MAVLink:</span>
                            <span id="mavlink">Disconnected</span>
                        </div>
                        <div class="telemetry-row">
                            <span>GPS:</span>
                            <span id="gps">N/A</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>
    <script>
        const socket = io();
        
        socket.on('status', function(data) {
            // Update status badge
            const badge = document.getElementById('statusBadge');
            badge.textContent = data.state.toUpperCase();
            badge.className = 'status-badge status-' + data.state;
            
            // Update stats
            document.getElementById('keyframes').textContent = data.keyframes || 0;
            document.getElementById('altitude').textContent = (data.altitude || 0).toFixed(1) + 'm';
            document.getElementById('features').textContent = data.features || 0;
            document.getElementById('progress').textContent = (data.progress || 0).toFixed(0) + '%';
            
            // Update telemetry
            document.getElementById('posX').textContent = (data.pose?.x || 0).toFixed(2) + ' m';
            document.getElementById('posY').textContent = (data.pose?.y || 0).toFixed(2) + ' m';
            document.getElementById('heading').textContent = ((data.pose?.yaw || 0) * 180 / Math.PI).toFixed(1) + '°';
            document.getElementById('mavlink').textContent = data.mavlink_connected ? 'Connected' : 'Disconnected';
            document.getElementById('gps').textContent = data.gps_fix ? 'Fix: ' + data.gps_fix : 'N/A';
        });
        
        function startRecording() {
            fetch('/api/recording/start', {method: 'POST'})
                .then(r => r.json())
                .then(d => console.log('Recording:', d));
        }
        
        function startReturn() {
            fetch('/api/return/start', {method: 'POST'})
                .then(r => r.json())
                .then(d => console.log('Return:', d));
        }
        
        function stopAll() {
            fetch('/api/stop', {method: 'POST'})
                .then(r => r.json())
                .then(d => console.log('Stopped:', d));
        }
    </script>
</body>
</html>
'''


@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)


@app.route('/video_feed')
def video_feed():
    """MJPEG video stream"""
    def generate():
        while True:
            if _system and _system.camera:
                frame, info = _system.camera.get_frame()
                if frame is not None:
                    # Draw features if available
                    if hasattr(_system, 'vo') and _system.vo._prev_features:
                        frame = _system.vo.detector.draw_features(
                            frame, _system.vo._prev_features
                        )
                    
                    # Encode frame
                    quality = _web_config.video_quality if _web_config else 50
                    ret, jpeg = cv2.imencode('.jpg', frame, 
                                            [cv2.IMWRITE_JPEG_QUALITY, quality])
                    if ret:
                        yield (b'--frame\r\n'
                               b'Content-Type: image/jpeg\r\n\r\n' + 
                               jpeg.tobytes() + b'\r\n')
            time.sleep(0.05)  # ~20 FPS
    
    return Response(generate(), 
                   mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/api/status')
def get_status():
    """Get current system status"""
    if not _system:
        return jsonify({'error': 'System not initialized'})
    
    return jsonify({
        'state': _system.state.value,
        'keyframes': _system.route_recorder.keyframe_count,
        'altitude': _system._current_altitude,
        'pose': {
            'x': _system._current_pose.x,
            'y': _system._current_pose.y,
            'z': _system._current_pose.z,
            'yaw': _system._current_pose.yaw
        },
        'mavlink_connected': _system.mavlink.is_connected if _system.mavlink else False,
        'progress': _system.route_follower.progress if _system.route_follower.is_active else 0
    })


@app.route('/api/recording/start', methods=['POST'])
def start_recording():
    """Start route recording"""
    if not _system:
        return jsonify({'error': 'System not initialized'}), 500
    
    route_id = _system.start_recording()
    if route_id:
        return jsonify({'success': True, 'route_id': route_id})
    return jsonify({'success': False})


@app.route('/api/recording/stop', methods=['POST'])
def stop_recording():
    """Stop route recording"""
    if not _system:
        return jsonify({'error': 'System not initialized'}), 500
    
    route = _system.stop_recording()
    if route:
        return jsonify({'success': True, 'route_id': route.id})
    return jsonify({'success': False})


@app.route('/api/return/start', methods=['POST'])
def start_return():
    """Start return to home"""
    if not _system:
        return jsonify({'error': 'System not initialized'}), 500
    
    data = request.get_json() or {}
    route_id = data.get('route_id')
    
    if _system.start_return(route_id):
        return jsonify({'success': True})
    return jsonify({'success': False})


@app.route('/api/return/stop', methods=['POST'])
def stop_return():
    """Stop return to home"""
    if not _system:
        return jsonify({'error': 'System not initialized'}), 500
    
    _system.stop_return()
    return jsonify({'success': True})


@app.route('/api/stop', methods=['POST'])
def stop_all():
    """Stop all operations"""
    if _system:
        if _system.route_recorder.is_recording:
            _system.stop_recording()
        if _system.route_follower.is_active:
            _system.stop_return()
    return jsonify({'success': True})


@app.route('/api/routes')
def list_routes():
    """List saved routes"""
    if not _system:
        return jsonify({'error': 'System not initialized'}), 500
    
    routes = _system.route_recorder.list_routes()
    return jsonify({'routes': routes})


def status_broadcast_loop():
    """Broadcast status updates via WebSocket"""
    while True:
        if _system:
            try:
                status = {
                    'state': _system.state.value,
                    'keyframes': _system.route_recorder.keyframe_count,
                    'altitude': _system._current_altitude,
                    'pose': {
                        'x': _system._current_pose.x,
                        'y': _system._current_pose.y,
                        'z': _system._current_pose.z,
                        'yaw': _system._current_pose.yaw
                    },
                    'mavlink_connected': _system.mavlink.is_connected,
                    'progress': _system.route_follower.progress if _system.route_follower.is_active else 0,
                    'features': _system.vo._prev_features.count if _system.vo._prev_features else 0
                }
                socketio.emit('status', status)
            except Exception as e:
                logger.error(f"Status broadcast error: {e}")
        time.sleep(0.5)


def start_web_server(system, config):
    """Start web server in background thread"""
    global _system, _web_config
    _system = system
    _web_config = config
    
    # Start status broadcast thread
    broadcast_thread = threading.Thread(target=status_broadcast_loop, daemon=True)
    broadcast_thread.start()
    
    # Start Flask in background
    server_thread = threading.Thread(
        target=lambda: socketio.run(
            app, 
            host=config.host, 
            port=config.port, 
            debug=False,
            use_reloader=False,
            allow_unsafe_werkzeug=True
        ),
        daemon=True
    )
    server_thread.start()
    
    logger.info(f"Web server started on http://{config.host}:{config.port}")
