#!/bin/bash
# RUMI Platform - Development Monitoring Services Startup Script
# Simple development monitoring services for RUMI platform

echo " Starting RUMI Platform Monitoring Services (Development)..."
echo ""

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    echo " Error: Please run this script from the Backend directory"
    exit 1
fi

# Activate virtual environment
if [ -d "venv" ]; then
    echo " Activating virtual environment..."
    source venv/bin/activate
else
    echo " Virtual environment not found!"
    exit 1
fi

# Check system dependencies
echo " Checking monitoring dependencies..."
python -c "import psutil" 2>/dev/null || {
    echo " psutil not installed. Installing..."
    pip install psutil
}

python -c "import prometheus_client" 2>/dev/null || {
    echo " prometheus_client not installed. Installing..."
    pip install prometheus_client django-prometheus
}

# Start Django with monitoring
echo " Starting Django server with monitoring..."
python manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!

# Wait for Django to start
sleep 3

# Test monitoring endpoints
echo " Testing monitoring endpoints..."
echo ""

echo "1. Health Check:"
curl -s http://localhost:8000/health/ | python3 -m json.tool | head -5
echo ""

echo "2. Real-time Metrics:"
curl -s http://localhost:8000/health/realtime/ | python3 -m json.tool | head -5
echo ""

echo "3. Service Status:"
curl -s http://localhost:8000/health/services/ | python3 -m json.tool | head -5
echo ""

echo " All monitoring services started successfully!"
echo ""
echo " Available Monitoring Endpoints:"
echo "   • Health Check:     http://localhost:8000/health/"
echo "   • Real-time Metrics: http://localhost:8000/health/realtime/"
echo "   • Service Status:    http://localhost:8000/health/services/"
echo "   • System Metrics:    http://localhost:8000/health/system/"
echo "   • Metrics Info:      http://localhost:8000/health/info/"
echo "   • Prometheus:        http://localhost:8000/metrics/"
echo ""
echo " For Frontend Integration:"
echo "   • API Documentation: ./MONITORING_API.md"
echo "   • Frontend Guide:    ./FRONTEND_MONITORING_VISUALIZATION.md"
echo "   • Base URL: http://localhost:8000/health/"
echo ""
echo " Docker Setup:"
echo "   • Add Docker Compose for production deployment"
echo "   • Include Prometheus + Grafana stack when ready"
echo ""
echo " To stop services:"
echo "   • Django: kill $DJANGO_PID"
echo ""

# Save PIDs for cleanup
echo $DJANGO_PID > monitoring.pid
echo " Django PID saved to monitoring.pid"
