@echo off
chcp 65001 > nul
title Subir Proyecto Completo Escape Room a GitHub
echo ====================================================================
echo    SUBIR PROYECTO COMPLETO A GITHUB (FRONTEND ANGULAR + BACKEND NESTJS)
echo ====================================================================
echo.
echo Equipo: Juan, Cinthia, Roberto y German
echo.
echo 1. Abre https://github.com/new en tu navegador.
echo 2. Escribe el nombre para tu nuevo repositorio (ej: EscapeRoom-Colaborativo).
echo 3. Dejalo VACIO (NO marques README, NO marques .gitignore).
echo 4. Haz clic en "Create repository" y copia el enlace HTTPS.
echo.
set /p REPO_URL="Pega la URL de tu nuevo repositorio de GitHub: "

if "%REPO_URL%"=="" (
    echo.
    echo [ERROR] No ingresaste ninguna URL.
    pause
    exit /b 1
)

echo.
echo [1/3] Configurando repositorio remoto 'origin'...
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo [2/3] Asegurando rama principal 'main'...
git branch -M main

echo [3/3] Subiendo proyecto completo a GitHub...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================================
    echo   ¡PROYECTO COMPLETO SUBIDO CON EXITO A GITHUB!
    echo   Ahora Cinthia, Roberto y German pueden clonarlo y trabajar juntos.
    echo ====================================================================
) else (
    echo.
    echo [ERROR] Hubo un problema al subir a GitHub.
    echo Revisa tu conexion o permisos de acceso a GitHub.
)
echo.
pause
