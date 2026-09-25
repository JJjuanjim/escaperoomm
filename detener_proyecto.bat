@echo off
title Detener Escape Room Digital
cls
echo ==============================================================================
echo    DETENIENDO SERVICIOS DEL PROYECTO ESCAPE ROOM
echo ==============================================================================
echo.

:: 1. Detener procesos escuchando en el puerto 3002 (Backend Escape Room)
echo [1/2] Liberando puerto 3002 (Backend Socket.io)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002 ^| findstr LISTENING') do (
    echo Finalizando proceso con PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

:: 2. Detener procesos escuchando en el puerto 4200 (Frontend Angular)
echo [2/2] Liberando puerto 4200 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4200 ^| findstr LISTENING') do (
    echo Finalizando proceso con PID %%a...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo ==============================================================================
echo    SERVICIOS DETENIDOS CON ÉXITO
echo ==============================================================================
echo Los puertos 3002 y 4200 han quedado libres.
echo.
timeout /t 3
