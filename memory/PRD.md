# Visual Homing System - PRD

## Оновлено: 28.02.2026

## Опис
Прошивка для Raspberry Pi Zero 2 W для оптичної навігації дрона на базі ArduPilot.

## Обладнання
- Pi Zero 2 W, Matek H743-Slim V3, MATEK 3901-L0X, TF-Luna LiDAR
- Caddx Thermal 256 / Pi Camera, EasyCap USB Capture

---

## Реліз-ноти

### v2.2 (28.02.2026) — Full Feature Release
- **Settings page**: конфігурація камери, MAVLink, сенсорів, Smart RTL через UI
- **Video stream**: плейсхолдер в Телеметрії (MJPEG на Pi)
- **WebSocket**: `/ws/telemetry` для real-time оновлень
- **Route export**: JSON + KML (Google Earth) з кнопками в Історії
- **Mobile responsive**: компактні таби, scrollable nav, touch targets
- **SITL документація**: повний гайд по тестуванню в симуляторі
- Тести: 100% (29 backend, 32 frontend)

### v2.1.1 — Bug Fix + C++ + Installer
- Fix: Smart RTL null crash, колір дрона #D3D3D3
- C++ v2.1 з сенсорами, Unified Installer

### v2.1 — Smart RTL Simulation
- Симуляція фаз, повзунок швидкості, HUD overlay

### v2.0 — Sensors + Telemetry
- MATEK 3901-L0X, TF-Luna, Smart RTL, телеметрія

### v1.0 — Foundation
- FastAPI + React + MongoDB, 3D карта, документація

---

## Тестування
- Backend: **29/29 (100%)**
- Frontend: **32/32 (100%)**
- Iterations: 10

## Backlog (все реалізовано)
- [x] Sensors (MATEK 3901-L0X, TF-Luna)
- [x] Smart RTL logic + simulation
- [x] Telemetry dashboard
- [x] Video stream integration
- [x] Settings page
- [x] WebSocket real-time
- [x] Route export (JSON/KML)
- [x] Mobile responsive
- [x] SITL documentation
- [x] C++ update
- [x] Unified installer
