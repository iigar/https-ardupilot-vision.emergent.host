# AGENTS.md — Налаштування AI агентів для Visual Homing

> Цей файл містить конфігурацію та інструкції для AI агентів, що працюють над проектом.
> Використовується для збереження контексту між сесіями.

---

## 🤖 Основний агент (E1 / Claude)

### Роль
Повноцінний full-stack розробник для системи Visual Homing.

### Мова спілкування
**Українська** — завжди відповідай українською мовою.

### Контекстні файли
Перед початком роботи прочитай:
1. `/app/CLAUDE.md` — технічний контекст проекту
2. `/app/memory/PRD.md` — вимоги до продукту
3. `/app/docs/README.md` — індекс документації

### Ключові обмеження
```yaml
urls:
  правильно: "*.preview.emergentagent.com"
  неправильно: "*.emergent.host"
  
порти:
  backend: 8001
  frontend: 3000
  pi_web: 5000
  
пакетні_менеджери:
  frontend: yarn (не npm!)
  backend: pip
  
системні_папки:
  не_видаляти:
    - .git
    - .emergent
```

---

## 🧪 Testing Agent (T2)

### Коли викликати
- Після реалізації нової функції
- Після виправлення критичного багу
- Перед завершенням великої задачі

### Формат виклику
```json
{
  "original_problem_statement_and_user_choices_inputs": "опис задачі",
  "mode": "generate | update",
  "features_or_bugs_to_test": ["список функцій"],
  "backend_files_of_reference": ["список файлів бекенду"],
  "frontend_files_of_reference": ["список файлів фронтенду"],
  "required_credentials": [],
  "agent_to_agent_context_note": {
    "description": "додатковий контекст"
  },
  "mocked_api": {
    "has_mocked_apis": false,
    "mocked_apis_list": []
  }
}
```

### Режими
- `generate` — створення нових тестів
- `update` — оновлення існуючих після змін коду

### Файли тестів
- Backend: `/app/backend/tests/`
- Frontend E2E: `/app/tests/e2e/`
- Звіти: `/app/test_reports/iteration_{N}.json`

---

## 🔧 Troubleshoot Agent

### Коли викликати
- Після 2+ невдалих спроб виправити баг
- При незрозумілих помилках
- При проблемах з інтеграцією

### Формат виклику
```
ISSUE: [опис проблеми]
COMPONENT: [Frontend/Backend/Firmware]
ERROR_MESSAGES: [текст помилок]
RECENT_ACTIONS: [що робилось]
PREVIOUS_FIX_ATTEMPTS: [що вже пробували]
RELEVANT_FILES: [список файлів]
```

---

## 📚 Integration Playbook Expert

### Коли викликати
- При інтеграції сторонніх сервісів
- При роботі з новими API
- При оновленні SDK/бібліотек

### Поточні інтеграції проекту
| Сервіс | Статус | Примітки |
|--------|--------|----------|
| OpenCV | ✅ Активна | Visual Odometry |
| Pymavlink | ✅ Активна | MAVLink протокол |
| Flask-SocketIO | ✅ Активна | WebSocket на Pi |
| picamera2 | ✅ Активна | Pi Camera драйвер |
| MongoDB | ⚠️ Опціонально | Для Preview бекенду |

---

## 📱 Design Agent

### Коли викликати
- При створенні нових UI компонентів
- При редизайні інтерфейсу
- При адаптації для мобільних пристроїв

### UI Стек проекту
- **Preview UI:** React + Tailwind + Three.js
- **Pi UI:** Vanilla HTML/JS + Bootstrap
- **Android:** WebView (тимчасово)

---

## 🚀 Deployment Agent

### Коли викликати
- При проблемах з деплойментом
- При помилках Kubernetes
- При проблемах зі змінними середовища

### Середовища
| Середовище | URL | Порт |
|------------|-----|------|
| Preview | `*.preview.emergentagent.com` | 443 |
| Raspberry Pi | `visual-homing.local` | 5000 |
| Локальний React | `localhost` | 3000 |

---

## 📝 Робочий процес агента

### 1. Початок сесії
```
1. Прочитати CLAUDE.md
2. Прочитати PRD.md
3. Перевірити test_reports/
4. Запитати користувача про пріоритети
```

### 2. Перед змінами коду
```
1. Переглянути файл перед редагуванням
2. Використовувати search_replace для існуючих файлів
3. create_file тільки для нових файлів
4. Паралельні виклики для незалежних операцій
```

### 3. Після змін
```
1. Запустити lint (python/javascript)
2. Перевірити curl для API
3. Зробити screenshot для UI
4. Викликати testing_agent для великих змін
```

### 4. Завершення задачі
```
1. Оновити PRD.md
2. Викликати finish tool
3. Запропонувати оновити прошивку на Pi
```

---

## 🔑 Специфіка проекту Visual Homing

### Raspberry Pi
```yaml
os: Debian 13 (Trixie)
model: Zero 2W / 4B / 5
camera: USB EasyCap або Pi Camera
uart: /dev/serial0 (GPIO 14/15)
service: visual-homing.service
```

### ArduPilot
```yaml
fc: Matek H743-Slim
firmware: ArduCopter V4.3.6
mavlink_version: 2.0
baudrate: 115200
key_params:
  - VISO_TYPE=1
  - EK3_SRC1_POSXY=6
  - EK3_SRC1_VELXY=6
  - SERIAL3_PROTOCOL=2
```

### MAVLink повідомлення
```yaml
відправляємо:
  - VISION_POSITION_ESTIMATE (102)
  - VISION_SPEED_ESTIMATE (103)
  
отримуємо:
  - HEARTBEAT (0)
  - ATTITUDE (30)
  - GLOBAL_POSITION_INT (33)
```

---

## ⚡ Швидкі команди

### Оновити прошивку на Pi
```bash
cd ~ && \
wget https://drone-return-home.preview.emergentagent.com/api/firmware/download/zip -O firmware.zip && \
unzip -o firmware.zip -d visual_homing && \
sudo systemctl restart visual-homing && \
journalctl -u visual-homing -f
```

### Перевірити статус
```bash
# Preview API
curl https://drone-return-home.preview.emergentagent.com/api/health

# Pi локально
curl http://visual-homing.local:5000/api/status
```

### Логи на Pi
```bash
journalctl -u visual-homing -f
```

---

## 🐛 Відомі проблеми

### Вирішені
- [x] VisOdom: not healthy — виправлено налаштуваннями EK3_SRC
- [x] HTTP 415 на /api/return/start — додано silent=True
- [x] Дрейф X/Y — фільтр 5мм в visual_odometry.py

### Активні
- [ ] Android Jetpack Compose — проблеми з JDK на ПК користувача
- [ ] Локальний React — потрібна Node.js 18/20 LTS

---

## 📞 Контакт з користувачем

- **Мова:** Українська
- **Рівень:** Технічний (може читати код)
- **Середовище:** Windows + Raspberry Pi
- **Основна ціль:** Надійна система RTL без GPS

---

*Останнє оновлення: 03.03.2026*
