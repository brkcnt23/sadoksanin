@echo off
REM ============================================================================
REM Sadoksan Proforma System - Quick Start Script (Windows)
REM ============================================================================
REM This script builds and starts the full development stack locally
REM All services will be available at:
REM   - Storefront: http://localhost:3000
REM   - Admin Panel: http://localhost:3002
REM   - API: http://localhost:3001
REM   - Python Service: http://localhost:5000
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo   Sadoksan Proforma System - Quick Start
echo ============================================================================
echo.

REM Step 1: Check Docker
echo [1/5] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)
echo OK - Docker is installed
echo.

REM Step 2: Clean previous build
echo [2/5] Cleaning previous build...
echo   - Stopping containers...
docker compose -f docker-compose.dev.yml down -v >nul 2>&1
if exist "apps\storefront\dist" rmdir /s /q "apps\storefront\dist" >nul 2>&1
if exist "apps\admin\dist" rmdir /s /q "apps\admin\dist" >nul 2>&1
if exist "apps\api\dist" rmdir /s /q "apps\api\dist" >nul 2>&1
echo OK - Clean complete
echo.

REM Step 3: Install dependencies
echo [3/5] Installing dependencies...
where pnpm >nul 2>&1
if errorlevel 1 (
    echo   - Installing pnpm...
    npm install -g pnpm@8.15.0
)
echo   - Running pnpm install...
call pnpm install --frozen-lockfile
if errorlevel 1 call pnpm install
echo OK - Dependencies installed
echo.

REM Step 4: Build Docker images
echo [4/5] Building Docker images (this may take 2-3 minutes)...
docker compose -f docker-compose.dev.yml build --no-cache
echo OK - Docker images built
echo.

REM Step 5: Start services
echo [5/5] Starting services...
docker compose -f docker-compose.dev.yml up -d
echo.
echo WAITING for services to be ready... ^(This may take 1-2 minutes^)
timeout /t 15 /nobreak
echo.

REM Show access information
echo ============================================================================
echo   *** SYSTEM READY ***
echo ============================================================================
echo.
echo ACCESS POINTS:
echo   - Storefront (B2C):      http://localhost:3000
echo   - Admin Panel (Dealer):  http://localhost:3002/dealer/proforma
echo   - API Backend:           http://localhost:3001
echo   - Python Service:        http://localhost:5000
echo.
echo QUICK TEST:
echo   1. Open http://localhost:3002/dealer/proforma
echo   2. Fill the 6-step wizard form
echo   3. Click "PDF indir" to download the PDF
echo   4. Verify Turkish characters render correctly
echo.
echo VIEW LOGS:
echo   docker compose -f docker-compose.dev.yml logs -f api
echo   docker compose -f docker-compose.dev.yml logs -f python-service
echo.
echo STOP SERVICES:
echo   docker compose -f docker-compose.dev.yml down
echo.
echo ============================================================================
echo.
