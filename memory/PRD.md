# Visual Homing System - PRD

## Дата оновлення: 24.02.2026

## Оригінальна постановка задачі
Створення прошивки для Raspberry Pi Zero 2 W для використання нічної камери як оптичної стабілізації/навігації для мультикоптерного дрона на базі ArduPilot.

## Уточнені вимоги
- **Принцип роботи**: Visual Homing - запис візуальних орієнтирів під час польоту та повернення по них
- **Камера**: Caddx Thermal 256 (аналогова) + Pi Camera
- **Політний контролер**: Matek з ArduCopter 4.5.7
- **Підключення**: UART (MAVLink)
- **Компас**: Без компаса (візуальна орієнтація)
- **GPS**: З можливістю вимкнення
- **Запуск**: Автозапуск + SSH
- **Версії коду**: Python та C++

---

## ✅ Що реалізовано

### Iteration 3 (24.02.2026) — UI Redesign + MongoDB
- ✅ **Modern Dark дизайн** з glassmorphism та анімаціями
- ✅ **Історія маршрутів** — збереження в MongoDB з можливістю вимкнення
- ✅ **Покращена 3D візуалізація** — neon tube path, glow effects, particles
- ✅ **DELETE endpoint** для видалення маршрутів
- ✅ **Auto-save toggle** — можливість вмикати/вимикати збереження
- ✅ Шрифти: Chivo (headings), Inter (body), JetBrains Mono (code)
- ✅ Іконки: lucide-react

### Iteration 2 — Core Features
- ✅ Backend API для документації та прошивки
- ✅ 3D візуалізація маршруту (Three.js vanilla)
- ✅ Симуляція польоту дрона
- ✅ Keyframe маркери
- ✅ Перегляд документації та коду

### Iteration 1 — Foundation
- ✅ Python реалізація Visual Homing
- ✅ C++ реалізація Visual Homing  
- ✅ Документація (8 файлів)
- ✅ Скрипти встановлення та автозапуску

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

---

## Тестування (24.02.2026)
- ✅ Backend: **100% (15/15 тестів)**
- ✅ Frontend E2E: **100% (18/18 тестів)**

### Тестові файли
- `/app/backend/tests/test_api.py`
- `/app/tests/e2e/core-flows.spec.ts`
- `/app/tests/e2e/map-simulation.spec.ts`
- `/app/tests/e2e/route-history.spec.ts`

---

## Backlog

### P1 — Наступні кроки
- [ ] WebSocket для real-time позиції дрона
- [ ] Відеострім з камери
- [ ] Сторінка налаштувань

### P2 — Покращення
- [ ] Експорт маршрутів (JSON/KML)
- [ ] Мобільний інтерфейс
- [ ] SITL тестування

---

## Примітки
- API `/api/routes/demo/generate` повертає **MOCK** дані
- 3D компонент використовує чистий Three.js (без @react-three/drei)
- Збереження маршрутів можна вимкнути через toggle в UI
