# Налаштування Raspberry Pi Zero 2 W для Visual Homing

## 1. Необхідне обладнання

- Raspberry Pi Zero 2 W (з Wi-Fi)
- Micro SD карта (мінімум 16 ГБ, рекомендовано 32 ГБ, Class 10)
- Адаптер живлення 5V 2.5A (Micro USB)
- USB OTG кабель (Micro USB -> USB-A)
- USB хаб (якщо потрібно кілька USB пристроїв)
- EasyCap USB Capture (для аналогової камери)
- Caddx Thermal 256 або Pi Camera v2/v3
- Провідники для UART (3 шт: TX, RX, GND)

## 2. Встановлення ОС

### Завантаження Raspberry Pi Imager

На комп'ютері:
```bash
# Linux
sudo apt install rpi-imager

# macOS
brew install raspberry-pi-imager

# Windows: скачати з https://www.raspberrypi.com/software/
```

### Запис образу на SD карту

1. Запустити Raspberry Pi Imager
2. Вибрати: **Raspberry Pi Zero 2 W**
3. ОС: **Raspberry Pi OS Lite (64-bit)** (Bookworm)
4. SD карта: Вибрати вашу карту
5. Натиснути шестірню (Advanced options):

### Попередні налаштування (ОБОВ'ЯЗКОВО!)

```
[x] Set hostname: visual-homing
[x] Enable SSH: Use password authentication
[x] Set username and password:
    Username: pi
    Password: <ваш пароль>
[x] Configure wireless LAN:
    SSID: <назва вашої мережі>
    Password: <пароль Wi-Fi>
    Country: UA
[x] Set locale settings:
    Time zone: Europe/Kyiv
    Keyboard layout: us
```

6. Записати (Write)
7. Вставити SD карту в Pi та увімкнути

## 3. Перше підключення (SSH)

### Знайти IP адресу Pi

```bash
# Варіант 1: Через роутер
# Перевірити список підключених пристроїв у налаштуваннях роутера

# Варіант 2: mDNS
ping visual-homing.local

# Варіант 3: Сканування мережі
nmap -sn 192.168.1.0/24 | grep -B 2 "Raspberry"
```

### Підключення

```bash
ssh pi@visual-homing.local
# або
ssh pi@<IP_адреса>
```

## 4. Оновлення системи

```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

Після перезавантаження підключитись знову:
```bash
ssh pi@visual-homing.local
```

## 5. Налаштування UART

### Увімкнення UART та додаткових портів

```bash
sudo raspi-config
```

Меню:
1. **Interface Options** → **Serial Port**
   - "Would you like a login shell to be accessible over serial?" → **No**
   - "Would you like the serial port hardware to be enabled?" → **Yes**
2. Finish → Reboot

### Конфігурація /boot/firmware/config.txt

```bash
sudo nano /boot/firmware/config.txt
```

Додати в кінець:
```ini
# UART для MAVLink (Pi <-> FC)
enable_uart=1
dtoverlay=disable-bt

# Додаткові UART для сенсорів
# UART2 (GPIO0/GPIO1) для MATEK 3901-L0X (якщо через Pi)
dtoverlay=uart2
# UART3 (GPIO4/GPIO5) для TF-Luna (якщо через Pi)
dtoverlay=uart3

# Камера
gpu_mem=128
start_x=1

# I2C (якщо потрібно)
dtparam=i2c_arm=on
```

```bash
sudo reboot
```

### Перевірка UART

```bash
ls -la /dev/serial*
# Повинно показати: /dev/serial0 -> ttyS0
# Якщо додаткові UART увімкнені:
# /dev/ttyAMA1, /dev/ttyAMA2, etc.
```

## 6. Встановлення залежностей

### Системні пакети

```bash
sudo apt install -y \
  python3-pip python3-venv python3-dev \
  python3-opencv python3-numpy \
  libopencv-dev \
  git cmake build-essential \
  v4l-utils ffmpeg \
  libatlas-base-dev libhdf5-dev \
  libjpeg-dev libpng-dev libtiff-dev \
  libxml2-dev libxslt1-dev \
  screen htop
```

### Python Virtual Environment

```bash
# Створити віртуальне середовище
python3 -m venv ~/venv --system-site-packages
echo 'source ~/venv/bin/activate' >> ~/.bashrc
source ~/venv/bin/activate
```

### Python бібліотеки

```bash
pip install --upgrade pip setuptools wheel

# MAVLink комунікація
pip install pymavlink

# Serial комунікація (для MATEK 3901-L0X, TF-Luna)
pip install pyserial

# Веб-сервер
pip install flask flask-cors

# OpenCV (якщо не встановився з apt)
pip install opencv-python-headless

# Додаткові
pip install numpy requests
```

### Перевірка установки

```bash
python3 -c "import cv2; print(f'OpenCV: {cv2.__version__}')"
python3 -c "from pymavlink import mavutil; print('pymavlink OK')"
python3 -c "import serial; print('pyserial OK')"
python3 -c "import flask; print(f'Flask: {flask.__version__}')"
```

## 7. Клонування проекту

```bash
cd ~
git clone <url_вашого_репозиторію> visual_homing
cd visual_homing
```

### Або завантажити та розпакувати

```bash
cd ~
# Скопіювати файли з комп'ютера
scp -r /шлях/до/firmware/python pi@visual-homing.local:~/visual_homing/

# Або використати установочний скрипт
wget <url>/install.sh && chmod +x install.sh && ./install.sh
```

## 8. Налаштування камери

### Pi Camera (CSI)

```bash
# Перевірити камеру
libcamera-hello --timeout 2000

# Якщо помилка - перевірити шлейф та /boot/firmware/config.txt
```

### Аналогова камера (EasyCap USB)

```bash
# Підключити EasyCap
lsusb | grep -i video
# Має показати: ... Syntek Semiconductor ...

# Перевірити пристрій
ls /dev/video*
# Має бути: /dev/video0

# Тест захоплення
ffmpeg -f v4l2 -i /dev/video0 -frames:v 1 test.jpg
```

## 9. Тест підключень

### Тест UART (MAVLink до FC)

```bash
python3 -c "
from pymavlink import mavutil
import sys

print('Connecting to FC via /dev/serial0...')
try:
    m = mavutil.mavlink_connection('/dev/serial0', baud=115200, wait_ready=True)
    m.wait_heartbeat(timeout=10)
    print(f'Connected! System: {m.target_system}, Component: {m.target_component}')
    print(f'Mode: {m.flightmode}')
except Exception as e:
    print(f'Error: {e}')
    print('Check: UART wiring (TX->RX, RX->TX), FC powered, SERIAL3_PROTOCOL=2')
"
```

### Тест MATEK 3901-L0X

```bash
python3 -c "
import serial, time

print('Testing MATEK 3901-L0X on /dev/serial1...')
try:
    ser = serial.Serial('/dev/serial1', 115200, timeout=2)
    time.sleep(1)
    data = ser.read(64)
    print(f'Received {len(data)} bytes')
    if len(data) > 0:
        # Check for MSP header
        for i in range(len(data)-1):
            if data[i] == ord('\$') and data[i+1] == ord('X'):
                print('MSP V2 header found - sensor OK!')
                break
    else:
        print('No data - check wiring and power')
    ser.close()
except Exception as e:
    print(f'Error: {e}')
    print('Check: UART2 overlay enabled, wiring correct, sensor powered')
"
```

### Тест TF-Luna

```bash
python3 -c "
import serial, time

print('Testing TF-Luna on /dev/serial2...')
try:
    ser = serial.Serial('/dev/serial2', 115200, timeout=2)
    time.sleep(1)
    for i in range(5):
        data = ser.read(9)
        if len(data) >= 9 and data[0] == 0x59 and data[1] == 0x59:
            dist = data[2] | (data[3] << 8)
            strength = data[4] | (data[5] << 8)
            print(f'  Distance: {dist}cm ({dist/100:.2f}m), Signal: {strength}')
        time.sleep(0.1)
    ser.close()
except Exception as e:
    print(f'Error: {e}')
    print('Check: UART3 overlay enabled, wiring (TXD->RX, RXD->TX), power 5V')
"
```

## 10. Налаштування автозапуску

### Створення systemd сервісу

```bash
sudo tee /etc/systemd/system/visual-homing.service << 'EOF'
[Unit]
Description=Visual Homing Navigation System
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/visual_homing
Environment=PATH=/home/pi/venv/bin:/usr/bin:/bin
ExecStart=/home/pi/venv/bin/python3 main.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable visual-homing
sudo systemctl start visual-homing
```

### Перевірка

```bash
sudo systemctl status visual-homing
journalctl -u visual-homing -f
```

## 11. Типові проблеми та рішення

| Проблема | Рішення |
|----------|---------|
| `Permission denied: /dev/serial0` | `sudo usermod -a -G dialout pi && reboot` |
| `No module named 'cv2'` | `sudo apt install python3-opencv` |
| `Camera not detected` | Перевірити шлейф, `gpu_mem=128` в config.txt |
| `No heartbeat from FC` | Перевірити TX→RX, RX→TX, `SERIAL3_PROTOCOL=2` |
| `MATEK 3901-L0X no data` | Перевірити `dtoverlay=uart2`, живлення 5V |
| `TF-Luna no data` | Перевірити `dtoverlay=uart3`, PIN5(CFG) не підключений |
| `pip install fails` | Використовувати venv: `source ~/venv/bin/activate` |
| `Out of memory` | Додати swap: `sudo dphys-swapfile swapoff && sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=1024/' /etc/dphys-swapfile && sudo dphys-swapfile setup && sudo dphys-swapfile swapon` |

## 12. Оптимізація для Pi Zero 2 W

```bash
# Вимкнути зайві сервіси
sudo systemctl disable bluetooth
sudo systemctl disable hciuart
sudo systemctl disable avahi-daemon

# Збільшити swap (для компіляції)
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=1024/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# GPU memory (вже в config.txt)
# gpu_mem=128
```
