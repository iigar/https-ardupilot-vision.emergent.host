# Visual Homing System - PRD

## Дата оновлення: 28.02.2026

## Оригінальна постановка задачі
Створення прошивки для Raspberry Pi Zero 2 W для використання нічної камери як оптичної навігації для мультикоптерного дрона на базі ArduPilot (Matek H743-Slim V3).

## Апаратне забезпечення
- Raspberry Pi Zero 2 W
- Matek H743-Slim V3 (ArduCopter 4.5.7)
- MATEK 3901-L0X (Optical Flow + VL53L0X)
- Benewake TF-Luna LiDAR (0.2-8m)
- Caddx Thermal 256 / Pi Camera
- EasyCap USB Capture (для аналогової камери)

---

## Що реалізовано

### v2.1 (28.02.2026) — Smart RTL Simulation + UI Improvements
- Smart RTL симуляція в 3D карті з фазами (RECORD→HIGH_ALT→DESCENT→LOW_ALT→LANDING)
- Повзунок швидкості (x0.1 — x5.0) для контролю симуляції
- HUD overlay: висота, швидкість, фаза, прогрес
- Кнопка "Smart RTL" з кольоровою індикацією фаз
- Світло-сірий дрон (видимий на темному фоні)
- Реальні фото пристроїв в документації (H743-Slim V3, 3901-L0X, TF-Luna)
- Стилізація зображень в документації (prose-img)
- Тестування: 100% (21/21 backend, 24/24 frontend)

### v2.0 (28.02.2026) — Sensors + Smart RTL + Telemetry
- Модулі сенсорів: MATEK 3901-L0X, TF-Luna LiDAR
- Smart RTL логіка (firmware/python/navigation/smart_rtl.py)
- Панель телеметрії з моніторингом сенсорів
- API endpoints для сенсорів та Smart RTL
- Детальна 3D модель квадрокоптера
- Оновлені ArduPilot параметри та документація

### v1.0 — Foundation + UI + DB
- Flask→FastAPI backend з MongoDB
- Modern Dark UI з glassmorphism
- 3D візуалізація маршрутів (Three.js)
- CRUD маршрутів
- Документація (9 файлів)
- Python/C++ реалізація Visual Homing
- Автозапуск на Pi

---

## Тестування (актуальне)
- Backend: **100% (21/21)**
- Frontend E2E: **100% (24/24)**
- Файли: `/app/test_reports/iteration_7.json`

---

## Backlog

### P1
- [ ] Інтеграція відеострім в Телеметрію
- [ ] Сторінка налаштувань (конфігурація через UI)
- [ ] WebSocket для real-time позиції

### P2
- [ ] Експорт маршрутів (JSON/KML)
- [ ] Мобільний інтерфейс
- [ ] SITL тестування
