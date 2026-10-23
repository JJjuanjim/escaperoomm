# ==============================================================================
# Script de Inicio de Escape Room Digital (Backend & Frontend) para PowerShell
# ==============================================================================

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "   INICIANDO PROYECTO ESCAPE ROOM DIGITAL COLABORATIVO" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Iniciar Backend en nueva ventana de PowerShell
Write-Host "[1/2] Iniciando Servidor WebSocket (Node.js + Socket.io en http://localhost:3002)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectDir\backend'; Write-Host '🔐 Backend Escape Room corriendo en http://localhost:3002' -ForegroundColor Green; npm run dev"

# 2. Iniciar Frontend en nueva ventana de PowerShell
Write-Host "[2/2] Iniciando Servidor Frontend (Angular en http://localhost:4200)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectDir\frontend'; Write-Host '🚀 Frontend Angular compilando en http://localhost:4200' -ForegroundColor Green; npm start"

Write-Host ""
Write-Host "Servicios iniciados en segundo plano." -ForegroundColor Green
Write-Host "Compilando Angular y conectando a PostgreSQL (esto puede tardar 20-30 segundos la primera vez)..." -ForegroundColor Cyan

$ready = $false
$maxSeconds = 60
$elapsed = 0

while (-not $ready -and $elapsed -lt $maxSeconds) {
    Start-Sleep -Seconds 2
    $elapsed += 2
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:4200" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($res.StatusCode -eq 200) {
            $ready = $true
        }
    } catch {}
    Write-Host "   Esperando compilación de Angular... ($elapsed s)" -ForegroundColor Gray
}

if ($ready) {
    Write-Host "¡Todo listo! Abriendo navegador..." -ForegroundColor Green
    Start-Process "http://localhost:4200"
} else {
    Write-Host "El servidor tardó más de lo esperado. Abriendo de todas formas..." -ForegroundColor Yellow
    Start-Process "http://localhost:4200"
}

Write-Host ""
Write-Host "Para detener el proyecto ejecuta: .\detener_proyecto.ps1" -ForegroundColor Gray

