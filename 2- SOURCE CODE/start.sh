#!/bin/bash

echo "====================================="
echo "  NAPAS Simulation - Quick Start"
echo "====================================="
echo ""

echo "Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker is installed"
echo ""

echo "Starting all services..."
echo "This may take a few minutes on first run..."
echo ""

docker-compose up --build -d

echo ""
echo "Waiting for services to be ready..."
sleep 15

echo ""
echo "====================================="
echo "  Services Started Successfully!"
echo "====================================="
echo ""
echo "Service URLs:"
echo "  Auth Service:    http://localhost:5001"
echo "  NAPAS Service:   http://localhost:5002"
echo "  Bank A Service:  http://localhost:5003"
echo "  Bank B Service:  http://localhost:5004"
echo "  Bank C Service:  http://localhost:5005"
echo "  API Gateway:     http://localhost:5000"
echo "  RabbitMQ Admin:  http://localhost:15672 (guest/guest)"
echo ""
echo "Open Frontend:"
echo "  Bank A: file://$(pwd)/frontend/bank-a/index.html"
echo "  Bank B: file://$(pwd)/frontend/bank-b/index.html"
echo "  Bank C: file://$(pwd)/frontend/bank-c/index.html"
echo ""
echo "Demo Accounts:"
echo "  Bank A: user_banka / pass123"
echo "  Bank B: user_bankb / pass123"
echo "  Bank C: user_bankc / pass123"
echo ""
echo "Check logs: docker-compose logs -f [service-name]"
echo "Stop all:   docker-compose down"
echo ""
echo "====================================="
