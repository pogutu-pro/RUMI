#!/bin/bash
# RUMI Platform - Service Startup Script
# This script helps start all required services for development

echo "Starting RUMI Platform Services..."
echo ""

# Check if Redis is installed
if ! command -v redis-server &> /dev/null; then
    echo "Redis is not installed!"
    echo "Install with: sudo apt-get install redis-server (Ubuntu/Debian)"
    echo "           or: brew install redis (macOS)"
    exit 1
fi

# Check if Celery is installed
if ! python3 -c "import celery" &> /dev/null; then
    echo "Celery is not installed!"
    echo "Install with: pip install celery redis"
    exit 1
fi

# Start Redis Server
echo "Starting Redis Server..."
if pgrep -x "redis-server" > /dev/null; then
    echo " Redis is already running"
else
    redis-server --daemonize yes
    if [ $? -eq 0 ]; then
        echo "Redis started successfully"
    else
        echo "Failed to start Redis"
        exit 1
    fi
fi

# Wait a moment for Redis to be ready
sleep 1

# Start Celery Worker
echo "Starting Celery Worker..."
if pgrep -f "celery -A rumi worker" > /dev/null; then
    echo "    Celery worker is already running"
    echo "   To restart, run: pkill -f 'celery worker' && celery -A rumi worker -l info"
else
    echo "   Starting Celery in detached mode..."
    celery -A rumi worker -l info --detach --pidfile=celery.pid --logfile=logs/celery.log
    if [ $? -eq 0 ]; then
        echo "    Celery worker started successfully"
        echo "   Logs: logs/celery.log"
    else
        echo "    Failed to start Celery worker"
        exit 1
    fi
fi

echo ""
echo " All services started successfully!"
echo ""
echo " Service Status:"
echo "   - Redis:  Running on localhost:6379"
echo "   - Celery: Running (check logs/celery.log)"
echo ""
echo " To stop services:"
echo "   Redis:  redis-cli shutdown"
echo "   Celery: pkill -f 'celery worker'"
echo ""
echo " You can now run:"
echo "   Terminal 1: python3 manage.py runserver"
echo "   Terminal 2: cd frontend && npm run dev"
echo ""