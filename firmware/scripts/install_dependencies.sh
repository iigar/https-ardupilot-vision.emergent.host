#!/bin/bash
# Install dependencies for Visual Homing on Raspberry Pi Zero 2 W

set -e

echo "=== Visual Homing Installation ==="
echo ""

# Update system
echo "[1/6] Оновлення системи..."
sudo apt update && sudo apt upgrade -y

# Install system packages
echo "[2/6] Встановлення системних пакетів..."
sudo apt install -y \
    build-essential \
    cmake \
    git \
    pkg-config \
    v4l-utils \
    python3-pip \
    python3-dev \
    python3-venv \
    libopencv-dev \
    python3-opencv \
    libv4l-dev \
    libatlas-base-dev \
    libjpeg-dev \
    libpng-dev \
    libtiff-dev \
    libserial-dev \
    python3-serial

# Create virtual environment
echo "[3/6] Створення Python середовища..."
cd ~
python3 -m venv venv
source ~/venv/bin/activate

# Install Python packages
echo "[4/6] Встановлення Python бібліотек..."
pip install --upgrade pip
pip install \
    numpy \
    opencv-python-headless \
    pymavlink \
    pyserial \
    flask \
    flask-socketio \
    eventlet

# Create directories
echo "[5/6] Створення директорій..."
mkdir -p ~/visual_homing/data
mkdir -p ~/visual_homing/routes
mkdir -p ~/visual_homing/logs

# Copy files (assuming they are in current directory)
echo "[6/6] Копіювання файлів..."
if [ -d "./python" ]; then
    cp -r ./python/* ~/visual_homing/
fi

echo ""
echo "=== Встановлення завершено! ==="
echo ""
echo "Для запуску:"
echo "  cd ~/visual_homing"
echo "  source ~/venv/bin/activate"
echo "  python main.py --web"
echo ""
echo "Для налаштування автозапуску:"
echo "  ./scripts/setup_autostart.sh"
