# Автозапуск системи

## Опис

Автозапуск дозволяє Visual Homing стартувати автоматично при включенні Pi Zero 2 W, без потреби підключатися по SSH.

## Метод 1: systemd (рекомендовано)

### Створення сервісу

```bash
sudo nano /etc/systemd/system/visual-homing.service
```

Вміст:

```ini
[Unit]
Description=Visual Homing Navigation System
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/visual_homing
Environment=PATH=/home/pi/venv/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/home/pi/venv/bin/python main.py --autostart
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

# Чекати на камеру та UART
ExecStartPre=/bin/sleep 10

[Install]
WantedBy=multi-user.target
```

### Активація

```bash
# Перезавантажити systemd
sudo systemctl daemon-reload

# Увімкнути автозапуск
sudo systemctl enable visual-homing.service

# Запустити зараз
sudo systemctl start visual-homing.service

# Перевірити статус
sudo systemctl status visual-homing.service
```

### Корисні команди

```bash
# Переглянути логи
journalctl -u visual-homing.service -f

# Зупинити
sudo systemctl stop visual-homing.service

# Перезапустити
sudo systemctl restart visual-homing.service

# Вимкнути автозапуск
sudo systemctl disable visual-homing.service
```

## Метод 2: rc.local (простіший)

```bash
sudo nano /etc/rc.local
```

Додати перед `exit 0`:

```bash
# Чекати на завантаження
sleep 15

# Запустити Visual Homing
su - pi -c '/home/pi/venv/bin/python /home/pi/visual_homing/main.py --autostart &'
```

## C++ версія

### systemd сервіс

```bash
sudo nano /etc/systemd/system/visual-homing-cpp.service
```

```ini
[Unit]
Description=Visual Homing (C++)
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/visual_homing_cpp/build
ExecStart=/home/pi/visual_homing_cpp/build/visual_homing
Restart=on-failure
RestartSec=5
ExecStartPre=/bin/sleep 10

[Install]
WantedBy=multi-user.target
```

## Перемикання між версіями

```bash
# Використовувати Python
sudo systemctl disable visual-homing-cpp.service
sudo systemctl enable visual-homing.service

# Використовувати C++
sudo systemctl disable visual-homing.service
sudo systemctl enable visual-homing-cpp.service

sudo reboot
```

## Перевірка автозапуску

```bash
# Перезавантажити Pi
sudo reboot

# Через 30 секунд перевірити:
# 1. Веб-інтерфейс на http://visual-homing.local:5000
# 2. Або SSH:
ssh pi@visual-homing.local
sudo systemctl status visual-homing.service
```

## Діагностика

### Сервіс не стартує

```bash
# Перевірити логи
journalctl -u visual-homing.service -n 50

# Ручний запуск для діагностики
cd /home/pi/visual_homing
source ~/venv/bin/activate
python main.py --autostart
```

### USB камера не знайдена

```bash
# Перевірити підключення
lsusb
v4l2-ctl --list-devices

# Збільшити затримку в сервісі
# ExecStartPre=/bin/sleep 20
```

### UART не працює

```bash
# Перевірити права
ls -la /dev/serial0
sudo usermod -a -G dialout pi
```
