# ==============================================================================
# Script de Parada de Escape Room Digital para PowerShell
# ==============================================================================

Write-Host "==============================================================================" -ForegroundColor Yellow
Write-Host "   DETENIENDO SERVICIOS DEL PROYECTO ESCAPE ROOM" -ForegroundColor Yellow
Write-Host "==============================================================================" -ForegroundColor Yellow
Write-Host ""

$ports = @(3002, 4200)

foreach ($port in $ports) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                $pidToKill = $conn.OwningProcess
                Write-Host "Liberando puerto $port (PID: $pidToKill)..." -ForegroundColor Magenta
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            }
            Write-Host "Puerto $port liberado exitosamente." -ForegroundColor Green
        } else {
            Write-Host "Puerto $port ya se encuentra libre." -ForegroundColor Gray
        }
    } catch {
        Write-Host "Aviso al procesar puerto $port : $($_.Exception.Message)" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "Servicios detenidos con éxito." -ForegroundColor Green
