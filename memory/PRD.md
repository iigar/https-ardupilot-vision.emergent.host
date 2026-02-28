# Visual Homing System - PRD

## Дата оновлення: 28.02.2026

## Оригінальна постановка задачі
Прошивка для Raspberry Pi Zero 2 W для оптичної навігації мультикоптерного дрона на базі ArduPilot (Matek H743-Slim V3).

## Апаратне забезпечення
- Raspberry Pi Zero 2 W, Matek H743-Slim V3 (ArduCopter 4.5.7)
- MATEK 3901-L0X (Optical Flow + VL53L0X), Benewake TF-Luna LiDAR
- Caddx Thermal 256 / Pi Camera, EasyCap USB Capture

---

## Що реалізовано

### v2.1.1 (28.02.2026) — Bug Fix + C++ + Installer
- **Bug fix**: Smart RTL null reference crash при перемиканні під час симуляції
- **Колір дрона**: #D3D3D3 (LightGray)
- **C++ v2.1**: optical_flow.cpp, lidar.cpp, smart_rtl.hpp — повна підтримка сенсорів
- **Unified Installer**: `/app/scripts/install.sh` — один скрипт для встановлення всього
- **Документація оновлена**: повні інструкції Pi Zero 2W, реальні фото (Pi pinout, H743-Slim, 3901-L0X, TF-Luna)
- Тестування: 100% (21/21 backend, 24/24 frontend)

### v2.1 — Smart RTL Simulation + UI
- Smart RTL симуляція з фазами (RECORD→HIGH_ALT→DESCENT→LOW_ALT→LANDING)
- Повзунок швидкості (x0.1—x5.0), HUD overlay (висота, швидкість, фаза, прогрес)

### v2.0 — Sensors + Telemetry
- Модулі сенсорів: MATEK 3901-L0X, TF-Luna LiDAR
- Smart RTL логіка, панель телеметрії, API endpoints

### v1.0 — Foundation
- FastAPI backend + React + MongoDB, 3D візуалізація, CRUD маршрутів

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
