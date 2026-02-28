# Visual Homing System - PRD

## Дата оновлення: 28.02.2026

## Оригінальна постановка задачі
Створення прошивки для Raspberry Pi Zero 2 W для використання нічної камери як оптичної стабілізації/навігації для мультикоптерного дрона на базі ArduPilot.

## Уточнені вимоги
- **Принцип роботи**: Visual Homing - запис візуальних орієнтирів під час польоту та повернення по них
- **Камера**: Caddx Thermal 256 (аналогова) + Pi Camera
- **Політний контролер**: Matek H743-Slim V3 з ArduCopter 4.5.7
- **Підключення**: UART (MAVLink) + MSP (сенсори)
- **Компас**: Без компаса (візуальна орієнтація)
- **GPS**: З можливістю вимкнення
- **Сенсори**: MATEK 3901-L0X (Optical Flow), TF-Luna (LiDAR)
- **Smart RTL**: Гібридна навігація (IMU/Baro >50м + Optical Flow <50м)
- **Запуск**: Автозапуск + SSH

---

## Що реалізовано

### Iteration 5-6 (28.02.2026) — Sensors + Smart RTL + Telemetry
- MATEK 3901-L0X (Optical Flow) модуль: `sensors/optical_flow.py`
- TF-Luna LiDAR модуль: `sensors/lidar.py`
- Smart RTL логіка: `navigation/smart_rtl.py`
- Оновлена конфігурація: `config.py` (OpticalFlowConfig, LidarConfig, SmartRTLConfig)
- ArduPilot параметри для нових сенсорів: `visual_homing.param`
- Панель телеметрії з моніторингом сенсорів та Smart RTL
- API endpoints: `/api/sensors/status`, `/api/smart-rtl/status`, `/api/smart-rtl/config`
- Покращена 3D модель дрона (квадрокоптер з пропелерами, камерою, GPS)
- Оновлена документація з пінаутами (Pi Zero 2 W, H743-Slim V3, 3901-L0X, TF-Luna)
- Версія UI: v2.0

### Iteration 3-4 (24.02.2026) — UI Redesign + MongoDB
- Modern Dark дизайн з glassmorphism та анімаціями
- Історія маршрутів — збереження в MongoDB
- 3D візуалізація маршруту (Three.js)
- DELETE endpoint для видалення маршрутів
- Auto-save toggle

### Iteration 1-2 — Foundation + Core Features
- Python/C++ реалізація Visual Homing
- Документація (9 файлів)
- Скрипти встановлення та автозапуску
- Backend API для документації та прошивки
- Симуляція польоту дрона

---

## API Endpoints

| Method | Endpoint | Опис |
|--------|----------|------|
| GET | `/api/routes` | Список збережених маршрутів |
| POST | `/api/routes` | Зберегти маршрут |
| DELETE | `/api/routes/{id}` | Видалити маршрут |
| GET | `/api/routes/demo/generate` | Генерувати демо-маршрут (MOCK) |
| GET | `/api/docs/list` | Список документів |
| GET | `/api/docs/{filename}` | Вміст документа |
| GET | `/api/firmware/structure` | Структура прошивки |
| GET | `/api/sensors/status` | Статус сенсорів |
| POST | `/api/sensors/status` | Оновити статус сенсорів |
| GET | `/api/smart-rtl/status` | Статус Smart RTL |
| POST | `/api/smart-rtl/status` | Оновити статус Smart RTL |
| GET | `/api/smart-rtl/config` | Конфігурація Smart RTL |

---

## Тестування (28.02.2026)
- Backend: **100% (21/21 тестів)**
- Frontend E2E: **100% (19/19 тестів)**

### Тестові файли
- `/app/backend/tests/test_api.py`
- `/app/tests/e2e/core-flows.spec.ts`
- `/app/tests/e2e/map-simulation.spec.ts`
- `/app/tests/e2e/route-history.spec.ts`

---

## Backlog

### P1 — Наступні кроки
- [ ] Інтеграція відеострім з камери в веб-інтерфейс
- [ ] Сторінка налаштувань (конфігурація параметрів через UI)
- [ ] WebSocket для real-time позиції дрона

### P2 — Покращення
- [ ] Експорт маршрутів (JSON/KML)
- [ ] Мобільний інтерфейс
- [ ] SITL тестування

---

## Примітки
- API `/api/routes/demo/generate` повертає **MOCK** дані
- 3D компонент використовує чистий Three.js
- Збереження маршрутів можна вимкнути через toggle в UI
- Сенсори показують OFFLINE в превʼю (реальні дані тільки з Pi)
