@echo off
REM Clean build script for Sadoksan Proforma System

echo.
echo ============================================================================
echo   Sadoksan - Clean Build & Fresh Start
echo ============================================================================
echo.

REM Step 1: Stop and remove all containers
echo [1/5] Stopping Docker services...
docker compose -f docker-compose.dev.yml down -v

REM Step 2: Delete dist folders
echo [2/5] Cleaning dist folders...
if exist "apps\storefront\dist" rmdir /s /q "apps\storefront\dist"
if exist "apps\storefront\.nuxt" rmdir /s /q "apps\storefront\.nuxt"
if exist "apps\storefront\.output" rmdir /s /q "apps\storefront\.output"

if exist "apps\admin\dist" rmdir /s /q "apps\admin\dist"
if exist "apps\admin\.nuxt" rmdir /s /q "apps\admin\.nuxt"
if exist "apps\admin\.output" rmdir /s /q "apps\admin\.output"

if exist "apps\api\dist" rmdir /s /q "apps\api\dist"

echo [2/5] Cleaned all dist folders

REM Step 3: Clean Docker images
echo [3/5] Pruning Docker images...
docker image prune -f

REM Step 4: Reinstall dependencies
echo [4/5] Reinstalling dependencies...
call pnpm install --frozen-lockfile

REM Step 5: Build fresh
echo [5/5] Building Docker images...
docker compose -f docker-compose.dev.yml build --no-cache

REM Step 6: Start services
echo.
echo Starting services...
docker compose -f docker-compose.dev.yml up

echo.
echo ============================================================================
echo   All services running!
echo   - Storefront: http://localhost:3000
echo   - Admin: http://localhost:3002/dealer/proforma
echo   - API: http://localhost:3001
echo   - Python: http://localhost:5000
echo ============================================================================
echo.
