# Python реалізація Visual Homing

## Архітектура системи

```
┌─────────────────────────────────────────────────────────┐
│                   Visual Homing System                   │
│                       (Python)                            │
└─────────────────────────────────────────────────────────┘
         │              │               │
         ▼              ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Camera     │ │  Feature    │ │  MAVLink    │
│  Module     │ │  Tracker    │ │  Interface  │
└─────────────┘ └─────────────┘ └─────────────┘
     │              │               │
     ▼              ▼               ▼
┌─────────────────────────────────────────────┐
│              Пам'ять маршруту                │
│   (keyframes, features, positions)          │
└─────────────────────────────────────────────┘
```

## Структура файлів

```
visual_homing/
├── main.py                 # Головний запуск
├── config.py               # Конфігурація
├── camera/
│   ├── __init__.py
│   ├── usb_capture.py      # USB аналогова камера
│   └── pi_camera.py        # Pi Camera CSI
├── vision/
│   ├── __init__.py
│   ├── feature_detector.py # ORB/SIFT детектор
│   ├── matcher.py          # Feature matching
│   └── visual_odometry.py  # Візуальна одометрія
├── navigation/
│   ├── __init__.py
│   ├── route_recorder.py   # Запис маршруту
│   ├── route_follower.py   # Повернення по маршруту
│   └── position_estimator.py
├── mavlink/
│   ├── __init__.py
│   └── ardupilot.py        # MAVLink комунікація
└── web/
    ├── __init__.py
    └── server.py           # Flask веб-сервер
```

## Файли імплементації

Дивіться код у директорії `/firmware/python/`
