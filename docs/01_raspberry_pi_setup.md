# Налаштування Raspberry Pi OS для Visual Homing

## 1. Завантаження образу ОС

### Рекомендована версія
- **Raspberry Pi OS Lite (64-bit)** - Bookworm або новіше
- Без графічного інтерфейсу для максимальної продуктивності

### Завантаження
1. Скачати [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Вибрати: **Raspberry Pi OS Lite (64-bit)**
3. Записати на microSD (мінімум 16GB, рекомендовано Class 10)

## 2. Початкова конфігурація (перед першим запуском)

В Raspberry Pi Imager натиснути шестерню ⚙️:

```
☑️ Set hostname: visual-homing
☑️ Enable SSH (Use password authentication)
☑️ Set username and password:
   Username: pi
   Password: [ваш_пароль]
☑️ Configure wireless LAN:
   SSID: [ваша_WiFi_мережа]
   Password: [пароль_WiFi]
   Country: UA
☑️ Set locale settings:
   Time zone: Europe/Kyiv
   Keyboard layout: us
```

## 3. Перший запуск

### Підключення по SSH
```bash
# Знайти IP адресу Pi в мережі
ping visual-homing.local

# Або сканувати мережу
nmap -sn 192.168.1.0/24

# Підключитись
ssh pi@visual-homing.local
```

### Оновлення системи
```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

## 4. Встановлення залежностей

### Системні пакети
```bash
# Основні інструменти
sudo apt install -y \
    build-essential \
    cmake \
    git \
    pkg-config \
    v4l-utils \
    python3-pip \
    python3-dev \
    python3-venv

# OpenCV залежності
sudo apt install -y \
    libopencv-dev \
    python3-opencv \
    libv4l-dev \
    libatlas-base-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev

# MAVLink/Serial
sudo apt install -y \
    libserial-dev \
    python3-serial
```

### Python бібліотеки
```bash
# Створити віртуальне середовище
python3 -m venv ~/venv
source ~/venv/bin/activate

# Встановити пакети
pip install --upgrade pip
pip install \
    numpy \
    opencv-python-headless \
    pymavlink \
    pyserial \
    flask \
    flask-socketio \
    eventlet
```

## 5. Налаштування UART

### Вимкнути консоль на UART
```bash
sudo raspi-config
```
Interface Options → Serial Port:
- Login shell over serial: **No**
- Serial port hardware enabled: **Yes**

### Редагувати /boot/firmware/config.txt
```bash
sudo nano /boot/firmware/config.txt
```

Додати в кінець:
```ini
# Увімкнути UART для MAVLink
enable_uart=1
dtoverlay=disable-bt

# Оптимізація для камери
gpu_mem=128
```

### Вимкнути Bluetooth (звільнити UART)
```bash
sudo systemctl disable hciuart
sudo systemctl disable bluetooth
```

## 6. Налаштування USB Video Capture

### Перевірка підключення
```bash
# Підключити EasyCap USB Capture
lsusb
# Має показати щось типу:
# Bus 001 Device 003: ID 1b71:3002 Fushicai USBTV007

# Перевірити V4L2 пристрій
v4l2-ctl --list-devices
# USB2.0 Video Capture (usb-3f980000.usb-1):
#     /dev/video0

# Перевірити підтримувані формати
v4l2-ctl -d /dev/video0 --list-formats-ext
```

### Тест захоплення
```bash
# Записати 10 секунд відео
ffmpeg -f v4l2 -input_format yuyv422 -video_size 720x576 -framerate 25 -i /dev/video0 -t 10 test.avi

# Або зробити фото
ffmpeg -f v4l2 -i /dev/video0 -frames:v 1 test.jpg
```

## 7. Налаштування Pi Camera (альтернатива)

### Увімкнути камеру
```bash
sudo raspi-config
```
Interface Options → Camera → Enable

### Тест камери
```bash
# Для Bookworm і новіше
rpicam-still -o test.jpg

# Або libcamera
libcamera-still -o test.jpg
```

## 8. Оптимізація продуктивності

### Збільшити swap
```bash
sudo nano /etc/dphys-swapfile
```
Змінити:
```
CONF_SWAPSIZE=512
```

```bash
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

### Оверклок (опціонально)
```bash
sudo nano /boot/firmware/config.txt
```
Додати:
```ini
# Помірний оверклок для Pi Zero 2 W
arm_freq=1200
over_voltage=2
```

### Вимкнути зайві сервіси
```bash
sudo systemctl disable avahi-daemon
sudo systemctl disable triggerhappy
sudo systemctl disable dphys-swapfile
```

## 9. Перезавантаження

```bash
sudo reboot
```

Після перезавантаження система готова до встановлення Visual Homing.
