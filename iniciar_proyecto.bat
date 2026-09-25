@echo off
title Iniciar Escape Room Digital Colaborativo
cls
echo ==============================================================================
echo    INICIANDO PROYECTO ESCAPE ROOM DIGITAL COLABORATIVO
echo ==============================================================================
echo.

set BASE_DIR=%~dp0

:: 1. Verificar dependencias del Backend
echo [1/3] Verificando dependencias del Backend...
if not exist "%BASE_DIR%backend\node_modules" (
    echo Instalando paquetes del Backend...
    cd /d "%BASE_DIR%backend"
    call npm install
)

:: 2. Iniciar Backend en una ventana separada
echo [2/3] Iniciando Servidor WebSocket (NestJS 11 + Socket.io + Prisma ORM en http://0.0.0.0:3002)...
start "Escape Room - Backend (NestJS + Prisma Puerto 3002)" cmd /k "cd /d "%BASE_DIR%backend" && echo Servidor NestJS Escape Room con Prisma ORM en puerto 3002 && npm run dev"

:: 3. Verificar dependencias del Frontend
echo [3/3] Verificando dependencias del Frontend e iniciando Angular en red local...
if not exist "%BASE_DIR%frontend\node_modules" (
    echo Instalando paquetes del Frontend...
    cd /d "%BASE_DIR%frontend"
    call npm install
)

:: 4. Iniciar Frontend en una ventana separada
start "Escape Room - Frontend (Angular)" cmd /k "cd /d "%BASE_DIR%frontend" && echo Compilando Angular accesible en red local... && npm start"

echo.
echo ==============================================================================
echo    SERVICIOS INICIADOS CON SOPORTE PARA WI-FI Y CELULARES
echo ==============================================================================
echo - En tu propia PC: http://localhost:4200
echo - Backend Socket:   http://localhost:3002
echo.
echo Esperando compilacion y abriendo el navegador (10 segundos)...
timeout /t 10 /nobreak >nul
start http://localhost:4200

echo.
echo Para detener todos los servicios, ejecuta 'detener_proyecto.bat'
echo Presiona cualquier tecla para cerrar esta ventana informativa.
pause >nul
