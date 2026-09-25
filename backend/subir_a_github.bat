@echo off
chcp 65001 > nul
title Subir Backend Escape Room a GitHub
echo ====================================================================
echo        SUBIR BACKEND DE ESCAPE ROOM A GITHUB (NESTJS 11 + BD)
echo ====================================================================
echo.
echo 1. Cree un repositorio VACÍO en GitHub (sin README, sin .gitignore).
echo 2. Copie la URL de clonación HTTPS o SSH.
echo.
set /p REPO_URL="Pegue la URL del repositorio de GitHub: "

if "%REPO_URL%"=="" (
    echo.
    echo [ERROR] No se especificó ninguna URL.
    pause
    exit /b 1
)

echo.
echo [1/3] Configurando repositorio remoto 'origin'...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo [2/3] Asegurando rama principal 'main'...
git branch -M main

echo [3/3] Subiendo código a GitHub (git push -u origin main)...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================================
    echo   ¡REPOSITORIO SUBIDO EXITOSAMENTE A GITHUB!
    echo ====================================================================
) else (
    echo.
    echo [ERROR] Hubo un problema al subir a GitHub.
    echo Verifique sus credenciales de GitHub o permisos de acceso.
)
echo.
pause
