# Конфігурація ArduPilot для Visual Homing

## 1. Базові налаштування Matek FC

### Підключення до Mission Planner/QGroundControl

1. Підключити Matek FC через USB
2. Відкрити Mission Planner → Config → Full Parameter List
3. Зберегти поточні параметри (Backup)

## 2. Налаштування UART для Pi Zero 2 W

### Визначення Serial порту

Для Matek H743/F405/F722:

| Фізичний порт | ArduPilot Serial | Параметр |
|---------------|------------------|----------|
| TX3/RX3 | SERIAL3 | SERIALx_ |
| TX4/RX4 | SERIAL4 | SERIALx_ |
| TX6/RX6 | SERIAL6 | SERIALx_ |

### Параметри для SERIAL3 (приклад)

```ini
# MAVLink до Raspberry Pi
SERIAL3_PROTOCOL = 2        # MAVLink2
SERIAL3_BAUD = 115          # 115200 baud
SERIAL3_OPTIONS = 0
```

## 3. Вимкнення компаса

```ini
# Повне вимкнення компаса
COMPASS_ENABLE = 0
COMPASS_USE = 0
COMPASS_USE2 = 0
COMPASS_USE3 = 0

# EKF без компаса
EK3_SRC1_YAW = 0            # Немає джерела yaw
# Або для GPS heading:
# EK3_SRC1_YAW = 2          # GPS якщо рухається >5м/с
```

## 4. Налаштування GPS (з можливістю вимкнення)

### GPS увімкнено (нормальний режим)

```ini
# GPS як основне джерело позиції
GPS_TYPE = 1                # Auto
GPS_TYPE2 = 0               # Без другого GPS

# EKF використовує GPS
EK3_SRC1_POSXY = 3          # GPS
EK3_SRC1_VELXY = 3          # GPS
EK3_SRC1_POSZ = 1           # Барометр
EK3_SRC1_VELZ = 0           # Немає
```

### GPS вимкнено (Visual Homing режим)

Для швидкого перемикання створити два профілі:

```ini
# Профіль без GPS (активується RC перемикачем)
GPS_TYPE = 0                # Вимкнено

# EKF без GPS
EK3_SRC1_POSXY = 6          # External Nav (від Pi)
EK3_SRC1_VELXY = 6          # External Nav
EK3_SRC1_POSZ = 1           # Барометр
```

## 5. Налаштування External Navigation (від Pi)

### Увімкнення прийому даних від Pi

```ini
# Дозволити External Navigation
VISO_TYPE = 1               # MAVLink (VISION_POSITION_ESTIMATE)

# EKF Source для Visual Homing
EK3_SRC1_POSXY = 6          # ExternalNav
EK3_SRC1_VELXY = 6          # ExternalNav
EK3_SRC1_YAW = 6            # ExternalNav (Visual Heading)

# Затримка даних (налаштувати під реальну затримку)
EK3_POS_I_GATE = 500        # Позиція innovation gate
EK3_VEL_I_GATE = 500        # Швидкість innovation gate
```

### Параметри точності

```ini
# Довіра до External Nav
VISO_POS_M_NSE = 0.1        # Шум позиції (метри)
VISO_VEL_M_NSE = 0.1        # Шум швидкості (м/с)
VISO_YAW_M_NSE = 0.1        # Шум yaw (радіани)

# Затримка обробки на Pi (типово 50-100мс)
VISO_DELAY_MS = 80
```

## 6. Режими польоту

### Рекомендовані режими для Visual Homing

```ini
# Flight Modes (приклад)
FLTMODE1 = 0                # Stabilize (ручний)
FLTMODE2 = 2                # Alt Hold (барометр)
FLTMODE3 = 5                # Loiter (потребує позиції)
FLTMODE4 = 6                # RTL (Return to Launch)
FLTMODE5 = 16               # PosHold
FLTMODE6 = 17               # Brake
```

### RTL налаштування

```ini
# Return to Launch параметри
RTL_ALT = 1500              # Висота RTL (см) = 15м
RTL_ALT_FINAL = 0           # Фінальна висота (0 = посадка)
RTL_CLIMB_MIN = 0           # Мін. підйом перед поверненням
RTL_SPEED = 500             # Швидкість повернення (см/с) = 5м/с
```

## 7. Failsafe налаштування

### GPS Failsafe (важливо для Visual Homing)

```ini
# Якщо GPS втрачено - перейти на Visual Nav
FS_GCS_ENABLE = 0           # GCS failsafe вимкнено
FS_GPS_ENABLE = 0           # GPS failsafe вимкнено (ми спеціально без GPS)

# Альтернативно - перейти в Alt Hold
# FS_GPS_ENABLE = 2         # Alt Hold при втраті GPS
```

### Battery Failsafe

```ini
# Низький заряд - повернутись
BATT_FS_LOW_ACT = 2         # RTL при низькому заряді
BATT_LOW_VOLT = 14.0        # Поріг для 4S (В)
BATT_CRT_VOLT = 13.2        # Критичний рівень
BATT_FS_CRT_ACT = 1         # Land при критичному
```

## 8. Streaming параметри (для Pi)

### Налаштування частоти повідомлень

```ini
# Stream rates для SERIAL3 (до Pi)
SR3_POSITION = 10           # Позиція 10Hz
SR3_RAW_SENS = 2            # Raw sensors 2Hz
SR3_EXT_STAT = 2            # Extended status 2Hz
SR3_RC_CHAN = 5             # RC channels 5Hz
SR3_RAW_CTRL = 1            # Raw control 1Hz
SR3_EXTRA1 = 10             # Attitude 10Hz
SR3_EXTRA2 = 5              # VFR HUD 5Hz
SR3_EXTRA3 = 2              # AHRS 2Hz
```

## 9. Повний список параметрів

### Файл параметрів для завантаження

Створити файл `visual_homing.param`:

```ini
# ═══════════════════════════════════════════════
#  VISUAL HOMING PARAMETERS
#  ArduCopter 4.5.7 + Matek FC
# ═══════════════════════════════════════════════

# --- UART для Pi Zero 2 W ---
SERIAL3_PROTOCOL,2
SERIAL3_BAUD,115

# --- Компас ВИМКНЕНО ---
COMPASS_ENABLE,0
COMPASS_USE,0
COMPASS_USE2,0
COMPASS_USE3,0

# --- GPS (з можливістю вимкнення) ---
GPS_TYPE,1

# --- External Navigation (Visual Homing) ---
VISO_TYPE,1
VISO_POS_M_NSE,0.1
VISO_VEL_M_NSE,0.1
VISO_YAW_M_NSE,0.1
VISO_DELAY_MS,80

# --- EKF Sources ---
EK3_SRC1_POSXY,6
EK3_SRC1_VELXY,6
EK3_SRC1_POSZ,1
EK3_SRC1_YAW,6
EK3_POS_I_GATE,500
EK3_VEL_I_GATE,500

# --- RTL ---
RTL_ALT,1500
RTL_SPEED,500

# --- Stream Rates ---
SR3_POSITION,10
SR3_EXTRA1,10
SR3_EXTRA2,5

# --- Failsafe ---
FS_GPS_ENABLE,0
```

### Завантаження параметрів

1. Mission Planner → Config → Full Parameter List
2. Load from file → Вибрати `visual_homing.param`
3. Write Params
4. Reboot FC

## 10. Тестування конфігурації

### Перевірка MAVLink з'єднання

На Mission Planner:
1. Підключитись до FC
2. Ctrl+F → MAVLink Inspector
3. Перевірити що приходять VISION_POSITION_ESTIMATE від Pi

### Перевірка EKF

1. Data Flash Logs → Download
2. Відкрити в Mission Planner Log Browser
3. Перевірити EKF3.INN (innovation) - має бути низьким

### Тест без польоту

```bash
# На Pi - запустити тестовий скрипт
python3 test_mavlink.py

# В Mission Planner
# Status Tab → перевірити ekf_statusflags
```
