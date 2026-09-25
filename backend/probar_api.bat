@echo off
chcp 65001 > nul
title Probando API REST y PostgreSQL - Escape Room Backend
echo =====================================================================
echo  EJECUTANDO SUITE DE PRUEBAS DE LA API REST Y BASE DE DATOS (POSTGRESQL)
echo =====================================================================
powershell -ExecutionPolicy Bypass -File "%~dp0test_api.ps1"
echo.
pause
