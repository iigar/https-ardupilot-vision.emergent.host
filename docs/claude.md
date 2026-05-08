# Visual Homing System — Повна технічна документація

## Опис проекту

**Visual Homing** — система оптичної навігації для мультикоптерів на базі ArduPilot, що забезпечує точне повернення додому (RTL) без GPS, використовуючи комп'ютерний зір.

**Основна ідея:** Під час польоту система записує траєкторію за допомогою камери (Visual Odometry), а при поверненні — слідує по записаному маршруту у зворотному напрямку.

---

## Архітектура системи

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         VISUAL HOMING SYSTEM                            │
│                    Оптична навігація для ArduPilot                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐    MAVLink/UART    ┌──────────────────┐              │
│  │   ArduPilot  │◄──────────────────►│  Raspberry Pi    │              │
│  │    (FC)      │   VISION_POSITION  │  Zero 2W/4B/5    │              │
│  │  Matek H743  │   ESTIMATE         │                  │              │
│  └──────────────┘                    │  ┌────────────┐  │              │
│         │                            │  │  Camera    │  │              │
│         │                            │  │  Module    │  │              │
│         │                            │  └────────────┘  │              │
│         ▼                            │        │         │              │
│  ┌──────────────┐                    │        ▼         │              │
│  │   Sensors    │                    │  ┌────────────┐  │              │
│  │  - IMU       │                    │  │  Visual    │  │              │
│  │  - Baro      │                    │  │ Odometry   │  │              │
│  │  - Compass   │                    │  └────────────┘  │              │
│  └──────────────┘                    └──────────────────┘              │
│                                              │                          │
│                                              │ HTTP/WebSocket           │
│                                              ▼                          │
│                                      ┌──────────────────┐              │
│                                      │   Web Interface  │              │
│                                      │   (Browser/App)  │              │
│                                      └──────────────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Апаратне забезпечення

### Підтримувані платформи

| Пристрій | RAM | CPU | Статус |
|----------|-----|-----|--------|
| Raspberry Pi Zero 2 W | 512MB | ARM Cortex-A53 1GHz | ✅ Основна платформа |
| Raspberry Pi 4B | 2-8GB | ARM Cortex-A72 1.5GHz | ✅ Підтримується |
| Raspberry Pi 5 | 4-8GB | ARM Cortex-A76 2.4GHz | ✅ Підтримується |

### Сумісні політні контролери

- Matek H743-Slim (рекомендовано)
- Pixhawk 4/5/6
- Будь-який FC з підтримкою ArduPilot та вільним UART

### Камери

| Тип | Інтерфейс | Роздільна здатність | Примітки |
|-----|-----------|---------------------|----------|
| Pi Camera v2/v3 | CSI | 1280x720 @ 30fps | Рекомендовано |
| USB камера | USB | 640x480+ | Підтримується |
| Аналогова (Caddx) | USB EasyCap | 720x576 @ 25fps | Через карту захоплення |

### Схема підключення UART

```
Raspberry Pi              Flight Controller (Matek H743)
─────────────             ─────────────────────────────
GPIO 14 (TX) ────────────► RX3 (SERIAL3)
GPIO 15 (RX) ◄──────────── TX3 (SERIAL3)
GND ─────────────────────── GND
```

**Важливо:** TX→RX, RX→TX (перехресне підключення)

---

## Структура коду

```
/home/pi/visual_homing/
├── main.py                     # Головний модуль, точка входу
├── config.py                   # Конфігурація системи (dataclasses)
│
├── camera/
│   ├── __init__.py
│   ├── pi_camera.py            # Драйвер Pi Camera (picamera2)
│   └── usb_capture.py          # Драйвер USB камери (OpenCV)
│
├── vision/
│   ├── __init__.py
│   ├── visual_odometry.py      # Візуальна одометрія
│   ├── feature_detector.py     # Детектор особливостей (ORB)
│   └── matcher.py              # Зіставлення особливостей (BFMatcher)
│
├── mavlink/
│   ├── __init__.py
│   └── ardupilot.py            # MAVLink інтерфейс (pymavlink)
│
├── navigation/
│   ├── __init__.py
│   ├── route_recorder.py       # Запис маршруту
│   ├── route_follower.py       # Слідування маршруту
│   └── smart_rtl.py            # Алгоритм Smart RTL
│
├── sensors/
│   ├── __init__.py
│   ├── optical_flow.py         # MATEK 3901-L0X
│   └── lidar.py                # TF-Luna LiDAR
│
├── web/
│   ├── __init__.py
│   └── server.py               # Flask веб-сервер + Socket.IO
│
├── diagnostics/
│   └── mavlink_diag.py         # Діагностика MAVLink
│
└── config/
    └── visual_homing.param     # Параметри ArduPilot
```

---

## Алгоритми

### Visual Odometry (Візуальна одометрія)

**Мета:** Оцінка переміщення дрона на основі послідовних зображень з камери.

**Алгоритм:**
```
1. Захоплення кадру з камери (30 FPS)
2. Конвертація в grayscale
3. Детекція особливостей (ORB - 500 точок)
4. Зіставлення з попереднім кадром (BFMatcher + Hamming)
5. Фільтрація викидів (RANSAC)
6. Обчислення гомографії
7. Декомпозиція → dx, dy, dyaw
8. Масштабування за висотою (з барометра)
9. Фільтрація дрейфу (поріг 5мм)
10. Оновлення глобальної позиції
```

**Чому ORB?**
- Швидкий (працює на Pi Zero 2W)
- Інваріантний до повороту та масштабу
- Безкоштовний (SIFT/SURF запатентовані)
- Бінарні дескриптори → швидке зіставлення

**Код (спрощено):**
```python
class VisualOdometry:
    def __init__(self):
        self.detector = cv2.ORB_create(nfeatures=500)
        self.matcher = cv2.BFMatcher(cv2.NORM_HAMMING)
        self._pose = Pose(x=0, y=0, z=0, yaw=0)
        
    def process_frame(self, frame, altitude):
        # Detect features
        kp, desc = self.detector.detectAndCompute(frame, None)
        
        # Match with previous
        matches = self.matcher.knnMatch(self._prev_desc, desc, k=2)
        
        # Ratio test
        good = [m for m,n in matches if m.distance < 0.75*n.distance]
        
        # Compute homography
        H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC)
        
        # Decompose to get motion
        dx, dy, dyaw = self._decompose_homography(H, altitude)
        
        # Update pose with drift filter
        if abs(dx) > 0.005:  # 5mm threshold
            self._pose.x += dx
        if abs(dy) > 0.005:
            self._pose.y += dy
            
        return self._pose
```

### Smart RTL (Інтелектуальне повернення)

**Логіка:**
```
ВИСОТА > 50м:
    → Використати IMU + барометр
    → Груба навігація до останньої точки

ВИСОТА 5-50м:
    → Візуальна одометрія
    → Зіставлення з записаними keyframes
    → Слідування по маршруту

ВИСОТА < 5м:
    → Precision Landing
    → Optical Flow + LiDAR
    → Максимальна точність
```

### Route Recording (Запис маршруту)

**Структура Keyframe:**
```python
@dataclass
class Keyframe:
    id: int
    timestamp: float
    position: Tuple[float, float, float]  # x, y, z
    orientation: float                     # yaw
    features: np.ndarray                   # ORB дескриптори
    altitude: float
```

**Критерії додавання keyframe:**
- Відстань від попереднього > 1м
- Зміна yaw > 15°
- Мінімум 10 keyframes/хвилину

---

## MAVLink інтеграція

### Відправка даних до ArduPilot

```python
def send_vision_position(self, x, y, z, roll, pitch, yaw):
    """
    Відправляє VISION_POSITION_ESTIMATE (msg_id=102)
    ArduPilot EKF3 використовує це як ExternalNav
    """
    self._connection.mav.vision_position_estimate_send(
        int(time.time() * 1e6),  # timestamp_usec
        x, y, z,                  # position NED (meters)
        roll, pitch, yaw          # orientation (radians)
    )
```

### Отримання даних від ArduPilot

```python
def _process_message(self, msg):
    if msg.get_type() == 'HEARTBEAT':
        self._armed = msg.base_mode & MAV_MODE_FLAG_SAFETY_ARMED
        
    elif msg.get_type() == 'ATTITUDE':
        self._attitude = {
            'roll': msg.roll,    # радіани
            'pitch': msg.pitch,
            'yaw': msg.yaw
        }
        
    elif msg.get_type() == 'GLOBAL_POSITION_INT':
        self._altitude = msg.relative_alt / 1000.0  # мм → м
```

### Необхідні параметри ArduPilot

```ini
# Visual Odometry
VISO_TYPE = 1              # 1 = MAVLink
VISO_ORIENT = 0            # 0 = Forward
VISO_DELAY_MS = 50         # Компенсація затримки

# EKF3 джерела навігації
EK3_SRC1_POSXY = 6         # 6 = ExternalNav
EK3_SRC1_VELXY = 6         # 6 = ExternalNav  
EK3_SRC1_POSZ = 1          # 1 = Barometer
EK3_SRC1_YAW = 1           # 1 = Compass

# SERIAL3 (TX3/RX3 на Matek H743)
SERIAL3_PROTOCOL = 2       # MAVLink2
SERIAL3_BAUD = 115         # 115200
```

---

## Веб-інтерфейс

### Backend (Flask + Socket.IO)

**Endpoints:**
```
GET  /                      # HTML інтерфейс
GET  /video_feed            # MJPEG стрім камери

POST /api/recording/start   # Почати запис маршруту
POST /api/stop              # Зупинити
POST /api/return/start      # Почати повернення

GET  /api/status            # JSON статус системи
GET  /api/routes            # Список маршрутів
GET  /api/routes/<id>       # Деталі маршруту

WebSocket /socket.io        # Real-time телеметрія
```

**WebSocket події:**
```javascript
// Сервер → Клієнт
socket.emit('status', {
    state: 'recording',      // idle | recording | returning
    pose: {x, y, yaw},
    altitude: 10.5,
    keyframes: 42,
    attitude: {roll, pitch, yaw},
    mavlink_connected: true
});

// Клієнт → Сервер
socket.emit('start_recording');
socket.emit('stop');
socket.emit('start_return', {route_id: 'route_001'});
```

### MJPEG Streaming

```python
def generate_frames():
    while True:
        frame = camera.get_frame()
        
        # Накласти оверлей з точками VO
        if features:
            for pt in features:
                cv2.circle(frame, pt, 3, (0, 255, 0), -1)
        
        # Кодувати в JPEG
        _, buffer = cv2.imencode('.jpg', frame, 
            [cv2.IMWRITE_JPEG_QUALITY, 70])
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + 
               buffer.tobytes() + b'\r\n')
```

---

## Встановлення

### Автоматичне встановлення

```bash
# На Raspberry Pi:
wget https://drone-return-home.preview.emergentagent.com/api/scripts/download/install.sh -O install.sh
chmod +x install.sh
./install.sh
sudo reboot
```

### Ручне встановлення

```bash
# 1. Оновити систему
sudo apt update && sudo apt upgrade -y

# 2. Встановити залежності
sudo apt install -y python3-pip python3-venv python3-opencv \
    python3-picamera2 libatlas-base-dev

# 3. Створити venv
python3 -m venv ~/venv
source ~/venv/bin/activate

# 4. Встановити Python пакети
pip install pymavlink pyserial flask flask-cors flask-socketio \
    opencv-python-headless numpy

# 5. Налаштувати UART
sudo nano /boot/firmware/config.txt
# Додати:
# enable_uart=1
# dtoverlay=disable-bt

# 6. Перезавантажити
sudo reboot
```

### Systemd сервіс

```ini
# /etc/systemd/system/visual-homing.service
[Unit]
Description=Visual Homing Navigation System
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/visual_homing
Environment=PATH=/home/pi/venv/bin
ExecStart=/home/pi/venv/bin/python3 main.py --web
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**Команди:**
```bash
sudo systemctl enable visual-homing   # Автозапуск
sudo systemctl start visual-homing    # Запустити
sudo systemctl status visual-homing   # Статус
sudo systemctl restart visual-homing  # Перезапустити
journalctl -u visual-homing -f        # Логи
```

---

## Потік даних

```
Camera (30 FPS)
    │
    ▼
┌─────────────────┐
│ Frame Capture   │
│ (720p YUV)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ORB Detection   │──────────────────────┐
│ (500 features)  │                      │
└────────┬────────┘                      │
         │                               │
         ▼                               │
┌─────────────────┐                      │
│ BF Matching     │                      │
│ (Hamming)       │                      │
└────────┬────────┘                      │
         │                               │
         ▼                               │
┌─────────────────┐                      │
│ Homography      │                      │
│ (RANSAC)        │                      │
└────────┬────────┘                      │
         │                               │
         ▼                               │
┌─────────────────┐    ┌────────────┐    │
│ Pose Estimation │◄───│ Barometer  │    │
│ (dx, dy, dyaw)  │    │ (altitude) │    │
└────────┬────────┘    └────────────┘    │
         │                               │
         ├───────────────────────────────┤
         │                               │
         ▼                               ▼
┌─────────────────┐            ┌─────────────────┐
│ MAVLink TX      │            │ Web Interface   │
│ VISION_POSITION │            │ (Socket.IO)     │
│ ESTIMATE        │            │                 │
└────────┬────────┘            └─────────────────┘
         │
         ▼
┌─────────────────┐
│ ArduPilot EKF3  │
│ (Sensor Fusion) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Flight Control  │
│ (PID loops)     │
└─────────────────┘
```

---

## Залежності

### Python (requirements.txt)
```
opencv-python-headless==4.8.0
numpy>=1.24.0
pymavlink>=2.4.40
Flask>=3.0.0
Flask-SocketIO>=5.3.0
Flask-Cors>=4.0.0
pyserial>=3.5
picamera2>=0.3.12
```

### Системні пакети
```
python3-opencv
python3-picamera2
libatlas-base-dev
```

---

## Діагностика та усунення несправностей

### Проблема: VisOdom: not healthy

**Причини:**
1. MAVLink не підключено
2. Неправильні параметри ArduPilot
3. Дані не відправляються

**Рішення:**
```bash
# 1. Перевірити логи
journalctl -u visual-homing -f | grep -i "send\|mavlink"

# 2. Перевірити параметри
# В Mission Planner: VISO_TYPE=1, SERIAL3_PROTOCOL=2

# 3. Запустити діагностику
cd ~/visual_homing
python diagnostics/mavlink_diag.py
```

### Проблема: Камера не працює

```bash
# Перевірити наявність камери
ls /dev/video*

# Для Pi Camera
libcamera-hello --list-cameras

# Для USB камери
v4l2-ctl --list-devices
```

### Проблема: Веб-інтерфейс недоступний

```bash
# Перевірити статус сервісу
sudo systemctl status visual-homing

# Перевірити порт
ss -tlnp | grep 5000

# Перевірити firewall
sudo ufw status
```

### Проблема: Дрейф позиції (X/Y збільшуються)

**Причини:**
- Шум камери
- Недостатнє освітлення
- Розмита картинка

**Рішення:**
- Додано фільтр дрейфу (поріг 5мм)
- Покращити освітлення
- Очистити об'єктив камери

---

## API Reference

### Клас VisualOdometry

```python
class VisualOdometry:
    def __init__(self, n_features=500, min_displacement=0.1):
        """
        n_features: кількість ORB точок
        min_displacement: мінімальний зсув для keyframe (м)
        """
    
    def process_frame(self, frame: np.ndarray, timestamp: float) -> Tuple[Pose, Velocity]:
        """Обробити кадр та повернути позицію і швидкість"""
    
    def set_altitude(self, altitude: float):
        """Встановити поточну висоту для масштабування"""
    
    def reset(self):
        """Скинути позицію в (0, 0, 0)"""
```

### Клас ArduPilotInterface

```python
class ArduPilotInterface:
    def __init__(self, serial_port='/dev/serial0', baudrate=115200):
        """Ініціалізація MAVLink з'єднання"""
    
    def connect(self, timeout=10.0) -> bool:
        """Підключитись та чекати heartbeat"""
    
    def send_vision_position(self, x, y, z, roll=0, pitch=0, yaw=0):
        """Відправити VISION_POSITION_ESTIMATE"""
    
    def send_vision_speed(self, vx, vy, vz):
        """Відправити VISION_SPEED_ESTIMATE"""
    
    @property
    def is_connected(self) -> bool:
        """Статус підключення"""
    
    @property
    def attitude(self) -> dict:
        """Поточний attitude {roll, pitch, yaw}"""
    
    @property
    def altitude(self) -> float:
        """Поточна висота (м)"""
```

### Клас RouteRecorder

```python
class RouteRecorder:
    def start(self, route_id: str = None) -> str:
        """Почати запис, повертає route_id"""
    
    def stop(self) -> str:
        """Зупинити запис, зберегти маршрут"""
    
    def add_keyframe(self, pose: Pose, features: np.ndarray):
        """Додати keyframe якщо потрібно"""
    
    @property
    def keyframe_count(self) -> int:
        """Кількість записаних keyframes"""
```

---

## Корисні команди

```bash
# Статус системи
sudo systemctl status visual-homing

# Логи в реальному часі
journalctl -u visual-homing -f

# Перезапустити сервіс
sudo systemctl restart visual-homing

# Перевірити MAVLink
python ~/visual_homing/diagnostics/mavlink_diag.py

# Оновити прошивку
cd ~
wget https://drone-return-home.preview.emergentagent.com/api/firmware/download/zip -O firmware.zip
unzip -o firmware.zip -d visual_homing
sudo systemctl restart visual-homing

# Переглянути параметри ArduPilot
cat ~/visual_homing/config/visual_homing.param
```

---

## URL та посилання

- **Preview UI:** https://drone-return-home.preview.emergentagent.com
- **API:** https://drone-return-home.preview.emergentagent.com/api
- **Firmware ZIP:** https://drone-return-home.preview.emergentagent.com/api/firmware/download/zip
- **Install Script:** https://drone-return-home.preview.emergentagent.com/api/scripts/download/install.sh
- **Pi Web Interface:** http://visual-homing.local:5000

---

## Версії та оновлення

### v2.2.3 (03.03.2026)
- Виправлено URL-адреси в документації
- Додано фільтр дрейфу VO (5мм поріг)
- Yaw тепер береться з FC attitude
- Виправлено ZIP архів (додано config/)

### v2.2.2 (01.03.2026)
- Виправлено TypeError в pymavlink
- Додано request data streams від FC
- Виправлено HTTP 415 на /api/return/start

### v2.2.0 (28.02.2026)
- Додано Smart RTL алгоритм
- 3D візуалізація маршруту
- WebSocket телеметрія
- Експорт маршрутів JSON/KML

---

## Автор та ліцензія

Проект розроблено для особистого використання.
Система Visual Homing для ArduPilot мультикоптерів.
