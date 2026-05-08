# CLAUDE.md — Контекст проекту для AI агента

> Цей файл містить критичну інформацію про проект Visual Homing.
> Прочитай його на початку кожної сесії для розуміння контексту.

---

## 🎯 Про проект

**Visual Homing** — система оптичної навігації для мультикоптерів ArduPilot.
Працює на Raspberry Pi Zero 2W/4B/5 з камерою.
Забезпечує повернення додому (RTL) без GPS через Visual Odometry.

**Користувач:** Українськомовний, використовує Windows для розробки, Raspberry Pi Zero 2W для польотів.

---

## 📁 Структура проекту

```
/app/
├── backend/                 # FastAPI бекенд (Preview/Cloud)
│   └── server.py           # Головний файл сервера
├── frontend/               # React фронтенд (Preview/Cloud)
│   └── src/App.js
├── firmware/               # Код для Raspberry Pi
│   ├── python/             # Python версія (основна)
│   │   ├── main.py         # Точка входу
│   │   ├── config.py       # Конфігурація
│   │   ├── camera/         # Драйвери камер
│   │   ├── vision/         # Visual Odometry
│   │   ├── mavlink/        # MAVLink інтерфейс
│   │   ├── navigation/     # Smart RTL, запис маршрутів
│   │   ├── web/            # Flask веб-сервер для Pi
│   │   └── diagnostics/    # Діагностичні скрипти
│   └── config/
│       └── visual_homing.param  # Параметри ArduPilot
├── scripts/
│   └── install.sh          # Інсталяційний скрипт для Pi
├── docs/                   # Документація
├── android/                # Android додаток (в розробці)
└── memory/
    └── PRD.md              # Product Requirements
```

---

## ⚠️ КРИТИЧНІ ПРАВИЛА

### URL-адреси
```
✅ ПРАВИЛЬНО: https://drone-return-home.preview.emergentagent.com
❌ НЕПРАВИЛЬНО: https://optical-rtl.emergent.host (не існує!)
```
**Завжди використовуй `preview.emergentagent.com`!**

### Raspberry Pi
- **Веб-інтерфейс Pi:** `http://visual-homing.local:5000`
- **UART порт:** `/dev/serial0` (GPIO 14/15)
- **Камера:** USB EasyCap або Pi Camera
- **Systemd сервіс:** `visual-homing.service`

### ArduPilot
- **FC:** Matek H743-Slim
- **Версія:** ArduCopter V4.3.6
- **UART:** TX3/RX3 (SERIAL3)
- **Параметри:** `VISO_TYPE=1`, `SERIAL3_PROTOCOL=2`, `EK3_SRC1_POSXY=6`

### MAVLink
- **Повідомлення:** `VISION_POSITION_ESTIMATE` (msg_id=102)
- **Baudrate:** 115200
- **Попередження:** `msg_id 271` — ігнорувати (різниця MAVLink v1/v2)

---

## 🔧 Часті проблеми та рішення

### 1. VisOdom: not healthy
```
Причина: FC не отримує VISION_POSITION_ESTIMATE
Рішення:
1. Перевірити SERIAL3_PROTOCOL=2
2. Перевірити VISO_TYPE=1
3. Перезавантажити FC
```

### 2. Дрейф X/Y при нерухомості
```
Причина: Шум камери
Рішення: Фільтр дрейфу 5мм в visual_odometry.py
```

### 3. Roll/Pitch/Yaw = 0 на Pi UI
```
Причина: FC не надсилає ATTITUDE
Рішення: _request_data_streams() в ardupilot.py
```

### 4. HTTP 415 на /api/return/start
```
Причина: request.get_json() без silent=True
Рішення: request.get_json(silent=True) or {}
```

---

## 📡 API Endpoints

### Backend (Preview)
```
GET  /api/health                    # Health check
GET  /api/firmware/download/zip     # Завантажити прошивку
GET  /api/scripts/download/{name}   # Завантажити скрипт
```

### Pi Web Server
```
GET  /                      # HTML інтерфейс
GET  /video_feed            # MJPEG стрім
POST /api/recording/start   # Почати запис
POST /api/stop              # Зупинити
POST /api/return/start      # Повернення
GET  /api/status            # JSON статус
WebSocket /socket.io        # Real-time
```

---

## 🧪 Тестування

### Оновити прошивку на Pi
```bash
cd ~
wget https://drone-return-home.preview.emergentagent.com/api/firmware/download/zip -O firmware.zip
unzip -o firmware.zip -d visual_homing
sudo systemctl restart visual-homing
journalctl -u visual-homing -f
```

### Перевірити MAVLink
```bash
python ~/visual_homing/diagnostics/mavlink_diag.py
```

### Curl тести
```bash
# Health check
curl https://drone-return-home.preview.emergentagent.com/api/health

# Статус Pi (з локальної мережі)
curl http://visual-homing.local:5000/api/status
```

---

## 📦 Ключові файли для редагування

| Файл | Опис |
|------|------|
| `/app/firmware/python/main.py` | Головна логіка, state machine |
| `/app/firmware/python/mavlink/ardupilot.py` | MAVLink комунікація |
| `/app/firmware/python/vision/visual_odometry.py` | VO алгоритм |
| `/app/firmware/python/web/server.py` | Pi веб-інтерфейс |
| `/app/backend/server.py` | Preview API сервер |
| `/app/scripts/install.sh` | Інсталяційний скрипт |

---

## 🚫 НЕ РОБИ

1. **НЕ використовуй** `emergent.host` URLs
2. **НЕ видаляй** `.git` та `.emergent` папки
3. **НЕ змінюй** порти (backend: 8001, frontend: 3000, Pi: 5000)
4. **НЕ використовуй** npm (тільки yarn для frontend)
5. **НЕ ігноруй** помилку `_id` в MongoDB (виключай в projection)

---

## ✅ РОБИ

1. **Завжди** перевіряй URL перед відправкою користувачу
2. **Завжди** тестуй curl після змін API
3. **Завжди** оновлюй PRD.md при завершенні задачі
4. **Завжди** відповідай українською
5. **Завжди** пропонуй оновити прошивку на Pi після змін

---

## 📊 Поточний статус

- ✅ Visual Odometry працює
- ✅ MAVLink підключення працює
- ✅ EKF3 використовує ExternalNav
- ✅ Веб-інтерфейс на Pi працює
- ⚠️ Android додаток — проблеми зі збіркою
- ⚠️ Локальний React UI — проблеми з Node.js версією

---

## 🔗 Корисні посилання

- **Preview:** https://drone-return-home.preview.emergentagent.com
- **Firmware ZIP:** https://drone-return-home.preview.emergentagent.com/api/firmware/download/zip
- **Install Script:** https://drone-return-home.preview.emergentagent.com/api/scripts/download/install.sh
- **Pi Interface:** http://visual-homing.local:5000

---

*Останнє оновлення: 03.03.2026*
