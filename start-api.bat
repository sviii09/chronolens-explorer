@echo off
REM Government Schemes Policy Retriever - API Server Startup
REM This script starts the Flask backend API server

cd /d "%~dp0"

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║  Government Schemes Policy Retriever - Backend API    ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo ⚠️  Virtual environment not found. Creating...
    python -m venv venv
    echo ✅ Virtual environment created
)

REM Activate virtual environment
call venv\Scripts\activate.bat

echo 📦 Installing dependencies...
pip install -r requirements-api.txt

echo.
echo 🚀 Starting Policy Retriever API Server...
echo 📍 Server will run on http://localhost:5000
echo 📚 API Documentation: http://localhost:5000/api/docs (when swagger is added)
echo.
echo Press Ctrl+C to stop the server
echo.

REM Set debug mode and start
set FLASK_DEBUG=True
set FLASK_ENV=development
python policy_retriever_api.py

pause
