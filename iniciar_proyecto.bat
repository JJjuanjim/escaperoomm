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
echo Esperando a que Angular compile y se conecte a la base de datos...
echo (La primera vez toma alrededor de 25-35 segundos, por favor no cierres las ventanas negras)
echo.
timeout /t 25 /nobreak >nul
start http://localhost:4200

echo.
echo ==============================================================================
echo    SISTEMA EN LINEA
echo ==============================================================================
echo - En tu PC abre:          http://localhost:4200
echo - Para otros en el Wi-Fi: http://10.75.29.73:4200
echo - Swagger API Backend:    http://localhost:3002/api/docs
echo.
echo NOTA: Manten abiertas las dos ventanas negras minimizadas mientras juegues.
echo Para detener todo, ejecuta 'detener_proyecto.bat'.
echo.
pause

