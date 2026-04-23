@echo off
REM ChronoLens Backend Startup Script with RAG Integration
REM This script starts the Flask backend with RAG engine properly configured

setlocal enabledelayedexpansion

echo.
echo ========================================================================
echo  ChronoLens Backend Startup
echo ========================================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Set working directory
cd /d "%~dp0"

echo Checking required files...
if not exist "rag_engine.py" (
    echo ERROR: rag_engine.py not found!
    pause
    exit /b 1
)

if not exist "app.py" (
    echo ERROR: app.py not found!
    pause
    exit /b 1
)

if not exist "src\updated_data.csv" (
    echo ERROR: Dataset not found at src\updated_data.csv
    pause
    exit /b 1
)

echo.
echo Select startup mode:
echo.
echo 1. FAST (Skip LLM, embeddings only, testing/demo)
echo 2. FULL (With LLM, production-grade, requires 16GB+ RAM)
echo.

set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Starting ChronoLens Backend in FAST mode (LLM disabled)...
    echo.
    set CHRONOLENS_SKIP_LLM=1
    echo Backend will be available at: http://localhost:5000
    echo.
    python app.py
) else if "%choice%"=="2" (
    echo.
    echo Starting ChronoLens Backend in FULL mode (with LLM)...
    echo WARNING: This requires 16GB+ RAM!
    echo.
    echo Backend will be available at: http://localhost:5000
    echo.
    python app.py
) else (
    echo Invalid choice. Please run the script again.
    pause
    exit /b 1
)

pause
