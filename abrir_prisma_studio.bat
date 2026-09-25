@echo off
title Prisma Studio - Explorador Visual de Base de Datos
cls
echo ==============================================================================
echo       ABRIENDO PRISMA STUDIO (EXPLORADOR VISUAL DE POSTGRESQL)
echo ==============================================================================
echo.
echo Base de Datos: postgresql://localhost:5432/postgres (Schema: escaperoom)
echo Abriendo interfaz web interactiva en: http://localhost:5555 ...
echo.
cd /d "%~dp0backend"
call npx prisma studio
pause
