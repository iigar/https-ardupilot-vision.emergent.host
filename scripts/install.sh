#!/bin/bash
# =============================================================================
# Visual Homing System - Unified Installer
# Один скрипт для встановлення всього на Raspberry Pi Zero 2 W
# =============================================================================
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

INSTALL_DIR="/home/pi/visual_homing"
VENV_DIR="/home/pi/venv"
LOG_FILE="/tmp/visual_homing_install.log"

log() { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $1"; }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "=============================================="
echo "  Visual Homing System - Installer v2.1"
echo "  Raspberry Pi Zero 2 W"
echo "=============================================="
echo ""

# --- 1. System Update ---
log "Оновлення системи..."
sudo apt update -qq && sudo apt upgrade -y -qq >> "$LOG_FILE" 2>&1
ok "Систему оновлено"

# --- 2. System Dependencies ---
log "Встановлення системних пакетів..."
sudo apt install -y -qq \
  python3-pip python3-venv python3-dev \
  python3-opencv python3-numpy \
  libopencv-dev \
  git cmake build-essential \
  v4l-utils ffmpeg \
  libatlas-base-dev libhdf5-dev \
  libjpeg-dev libpng-dev libtiff-dev \
  libxml2-dev libxslt1-dev \
  screen htop >> "$LOG_FILE" 2>&1
ok "Системні пакети встановлено"

# --- 3. Python Virtual Environment ---
log "Налаштування Python venv..."
if [ ! -d "$VENV_DIR" ]; then
  python3 -m venv "$VENV_DIR" --system-site-packages
  echo 'source ~/venv/bin/activate' >> ~/.bashrc
fi
source "$VENV_DIR/bin/activate"
ok "Python venv готовий"

# --- 4. Python Dependencies ---
log "Встановлення Python бібліотек..."
pip install --upgrade pip setuptools wheel >> "$LOG_FILE" 2>&1
pip install pymavlink pyserial flask flask-cors opencv-python-headless numpy requests >> "$LOG_FILE" 2>&1
ok "Python бібліотеки встановлено"

# --- 5. Create Project Directory ---
log "Створення директорій проекту..."
mkdir -p "$INSTALL_DIR"/{camera,vision,navigation,sensors,mavlink,web,data,routes,logs}
ok "Директорії створено"

# --- 6. Copy/Download Firmware Files ---
log "Копіювання файлів прошивки..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# If running from the project directory, copy files
if [ -f "$SCRIPT_DIR/firmware/python/main.py" ]; then
  cp -r "$SCRIPT_DIR/firmware/python/"* "$INSTALL_DIR/"
  cp -r "$SCRIPT_DIR/firmware/config" "$INSTALL_DIR/config"
  ok "Файли скопійовано з локальної директорії"
else
  warn "Файли прошивки не знайдено локально. Скопіюйте вручну або клонуйте репозиторій."
fi

# --- 7. Configure UART ---
log "Налаштування UART..."
CONFIG_FILE="/boot/firmware/config.txt"
if [ ! -f "$CONFIG_FILE" ]; then
  CONFIG_FILE="/boot/config.txt"
fi

# Check if UART already configured
if ! grep -q "enable_uart=1" "$CONFIG_FILE" 2>/dev/null; then
  sudo tee -a "$CONFIG_FILE" > /dev/null << 'UARTEOF'

# === Visual Homing UART Configuration ===
enable_uart=1
dtoverlay=disable-bt
dtoverlay=uart2
dtoverlay=uart3
gpu_mem=128
start_x=1
dtparam=i2c_arm=on
UARTEOF
  ok "UART налаштовано в $CONFIG_FILE"
else
  ok "UART вже налаштовано"
fi

# --- 8. User Permissions ---
log "Налаштування дозволів..."
sudo usermod -a -G dialout,video,i2c pi 2>/dev/null || true
ok "Дозволи налаштовано (dialout, video, i2c)"

# --- 9. Swap Configuration ---
log "Налаштування swap..."
if [ "$(cat /etc/dphys-swapfile | grep 'CONF_SWAPSIZE=' | cut -d'=' -f2)" -lt 1024 ] 2>/dev/null; then
  sudo dphys-swapfile swapoff
  sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=1024/' /etc/dphys-swapfile
  sudo dphys-swapfile setup >> "$LOG_FILE" 2>&1
  sudo dphys-swapfile swapon
  ok "Swap збільшено до 1GB"
else
  ok "Swap вже налаштовано"
fi

# --- 10. Disable Unnecessary Services ---
log "Оптимізація системи..."
sudo systemctl disable bluetooth 2>/dev/null || true
sudo systemctl disable hciuart 2>/dev/null || true
ok "Непотрібні сервіси вимкнено"

# --- 11. Create Systemd Service ---
log "Створення systemd сервісу..."
sudo tee /etc/systemd/system/visual-homing.service > /dev/null << EOF
[Unit]
Description=Visual Homing Navigation System
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=$INSTALL_DIR
Environment=PATH=$VENV_DIR/bin:/usr/bin:/bin
ExecStart=$VENV_DIR/bin/python3 main.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable visual-homing
ok "Systemd сервіс створено та увімкнено"

# --- 12. Verify Installation ---
echo ""
echo "=============================================="
echo "  Перевірка встановлення"
echo "=============================================="
echo ""

ERRORS=0

# Python
python3 -c "import cv2; print(f'  OpenCV: {cv2.__version__}')" 2>/dev/null || { err "OpenCV не знайдено"; ERRORS=$((ERRORS+1)); }
python3 -c "from pymavlink import mavutil; print('  pymavlink: OK')" 2>/dev/null || { err "pymavlink не знайдено"; ERRORS=$((ERRORS+1)); }
python3 -c "import serial; print('  pyserial: OK')" 2>/dev/null || { err "pyserial не знайдено"; ERRORS=$((ERRORS+1)); }
python3 -c "import flask; print(f'  Flask: {flask.__version__}')" 2>/dev/null || { err "Flask не знайдено"; ERRORS=$((ERRORS+1)); }

# UART
if [ -e /dev/serial0 ]; then
  ok "UART serial0 доступний"
else
  warn "UART serial0 не знайдено (потрібен reboot)"
fi

# Camera
if [ -e /dev/video0 ]; then
  ok "Камера /dev/video0 доступна"
else
  warn "Камера не знайдена (підключити після reboot)"
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}=============================================="
  echo "  Встановлення завершено успішно!"
  echo "==============================================${NC}"
else
  echo -e "${RED}=============================================="
  echo "  Встановлення завершено з $ERRORS помилками"
  echo "==============================================${NC}"
fi

echo ""
echo "Наступні кроки:"
echo "  1. sudo reboot   (для застосування UART)"
echo "  2. Підключити сенсори (MATEK 3901-L0X, TF-Luna)"
echo "  3. Підключити камеру"
echo "  4. Завантажити параметри ArduPilot: $INSTALL_DIR/config/visual_homing.param"
echo "  5. Запустити: sudo systemctl start visual-homing"
echo ""
echo "Логи: journalctl -u visual-homing -f"
echo "Повний лог встановлення: $LOG_FILE"
echo ""
