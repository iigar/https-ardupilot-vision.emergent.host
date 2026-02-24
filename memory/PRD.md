# Visual Homing System - PRD

## Дата: 24.02.2026

## Оригінальна постановка задачі
Створення прошивки для Raspberry Pi Zero 2 W для використання нічної камери як оптичної стабілізації/навігації для мультикоптерного дрона на базі ArduPilot.

## Уточнені вимоги
- **Принцип роботи**: Visual Homing - запис візуальних орієнтирів під час польоту та повернення по них (як оптична мишка)
- **Камера**: Caddx Thermal 256 (аналогова) + альтернатива Pi Camera
- **Політний контролер**: Matek з ArduCopter 4.5.7
- **Підключення**: UART (MAVLink)
- **Компас**: Без компаса (візуальна орієнтація)
- **GPS**: З можливістю вимкнення (захист від спуфінгу)
- **Запуск**: Автозапуск + SSH
- **Версії коду**: Python та C++

## User Personas
1. **Оператор дрона** - потребує простого інтерфейсу для запису/повернення
2. **Розробник** - потребує документації та коду для кастомізації
3. **Технік** - потребує схем підключення та калібрування

## Що реалізовано (Iteration 2)

### Документація (/app/docs/)
- ✅ README.md - огляд проекту
- ✅ 01_raspberry_pi_setup.md - налаштування Pi OS
- ✅ 02_wiring_diagrams.md - схеми підключення (ASCII)
- ✅ 03_ardupilot_config.md - параметри ArduPilot
- ✅ 04_python_implementation.md - опис Python версії
- ✅ 05_cpp_implementation.md - опис C++ версії
- ✅ 06_web_interface.md - веб-моніторинг
- ✅ 07_autostart.md - systemd автозапуск
- ✅ 08_testing.md - тестування та калібрування

### Python версія (/app/firmware/python/)
- ✅ config.py - конфігурація системи
- ✅ camera/usb_capture.py - USB Video Capture (EasyCap)
- ✅ camera/pi_camera.py - Pi Camera (CSI)
- ✅ vision/feature_detector.py - ORB детекція фічей
- ✅ vision/matcher.py - матчування фічей
- ✅ vision/visual_odometry.py - візуальна одометрія
- ✅ navigation/route_recorder.py - запис маршруту
- ✅ navigation/route_follower.py - повернення по маршруту
- ✅ mavlink/ardupilot.py - MAVLink інтерфейс
- ✅ web/server.py - Flask веб-сервер
- ✅ main.py - головний файл запуску

### C++ версія (/app/firmware/cpp/)
- ✅ CMakeLists.txt - система збірки
- ✅ src/camera.cpp/hpp - захоплення відео
- ✅ src/feature_tracker.cpp/hpp - ORB трекер
- ✅ src/visual_odometry.cpp/hpp - одометрія
- ✅ src/route_memory.cpp/hpp - пам'ять маршруту
- ✅ src/mavlink_interface.cpp/hpp - MAVLink
- ✅ src/main.cpp - точка входу

### Скрипти та конфіги (/app/firmware/)
- ✅ scripts/install_dependencies.sh - встановлення залежностей
- ✅ scripts/setup_autostart.sh - налаштування автозапуску
- ✅ scripts/build_cpp.sh - збірка C++ версії
- ✅ config/visual_homing.param - параметри ArduPilot

### Веб-інтерфейс документації та 3D карта
- ✅ Backend API для перегляду документації
- ✅ Backend API для перегляду коду прошивки
- ✅ **NEW: Backend API для 3D маршрутів** (/api/routes/demo/generate)
- ✅ **NEW: Backend API для позиції дрона** (/api/position)
- ✅ React frontend з навігацією
- ✅ Перегляд Markdown документів
- ✅ Перегляд вихідного коду
- ✅ **NEW: 3D візуалізація маршруту** (Three.js)
- ✅ **NEW: Симуляція повернення** з анімацією дрона
- ✅ **NEW: Keyframe маркери** на 3D карті
- ✅ Сторінка "Про проект"

## Backlog (P0/P1/P2)

### P1 - Наступні кроки
- [ ] WebSocket для real-time позиції дрона з Pi
- [ ] Калібрування камери
- [ ] Підтримка лідара (rangefinder)

### P2 - Покращення
- [ ] Запис реальних маршрутів у БД
- [ ] Мобільний інтерфейс
- [ ] SITL тестування

## Тестування (24.02.2026)
- ✅ Backend API: **100% (13/13 тестів)**
- ✅ Frontend E2E: **100% (11/11 тестів)**
- ✅ 3D Map: Three.js (vanilla) - працює (виправлено R3F/drei сумісність)
- ✅ Preview Environment: **ПРАЦЮЄ**

### Тестові файли
- `/app/backend/tests/test_api.py` - pytest тести API
- `/app/tests/e2e/core-flows.spec.ts` - Playwright тести UI
- `/app/tests/e2e/map-simulation.spec.ts` - Playwright тести 3D карти

## Примітки
- API `/api/routes/demo/generate` повертає **MOCK** дані (статичний демо-маршрут)
- 3D компонент переписано на чистий Three.js для уникнення проблем з @react-three/drei
