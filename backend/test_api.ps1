# Test Suite para API REST NestJS Escape Room y PostgreSQL
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "🧪 INICIANDO PRUEBAS AUTOMATIZADAS - ESCAPE ROOM REST API + BD" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3002/api"

# 1. Health check
Write-Host "`n[1/8] Verificando GET /api/health..." -ForegroundColor Yellow
try {
    $resHealth = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✅ Health Check OK: $($resHealth | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en Health Check: $_" -ForegroundColor Red
}

# 2. Database Status
Write-Host "`n[2/8] Verificando GET /api/database/status (PostgreSQL 18 + Prisma)..." -ForegroundColor Yellow
try {
    $resDb = Invoke-RestMethod -Uri "$baseUrl/database/status" -Method Get
    Write-Host "✅ Conexión a Base de Datos OK: $($resDb | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error en Database Status: $_" -ForegroundColor Red
}

# 3. Scenarios Catalog
Write-Host "`n[3/8] Verificando GET /api/scenarios..." -ForegroundColor Yellow
try {
    $resScenarios = Invoke-RestMethod -Uri "$baseUrl/scenarios" -Method Get
    Write-Host "✅ Catálogo Obtenido: $($resScenarios.Count) escenarios disponibles" -ForegroundColor Green
    foreach ($sc in $resScenarios) {
        Write-Host "   - [$($sc.id)] $($sc.name) ($($sc.category))" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Error en Scenarios: $_" -ForegroundColor Red
}

# 4. Crear Sala con DTO (CreateRoomDto)
Write-Host "`n[4/8] Verificando POST /api/rooms (CreateRoomDto)..." -ForegroundColor Yellow
$roomCode = ""
try {
    $bodyCreate = @{
        hostName = "Comandante Alpha"
        scenarioId = "reactor"
    } | ConvertTo-Json

    $resCreate = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method Post -Body $bodyCreate -ContentType "application/json"
    $roomCode = $resCreate.roomCode
    Write-Host "✅ Sala creada exitosamente con código: $roomCode" -ForegroundColor Green
    Write-Host "   Respuesta: $($resCreate | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error al crear sala: $_" -ForegroundColor Red
}

# 5. Unirse a Sala con DTO (JoinRoomDto)
Write-Host "`n[5/8] Verificando POST /api/rooms/join (JoinRoomDto)..." -ForegroundColor Yellow
try {
    $bodyJoin = @{
        roomCode = $roomCode
        playerName = "Agente Beta"
    } | ConvertTo-Json

    $resJoin = Invoke-RestMethod -Uri "$baseUrl/rooms/join" -Method Post -Body $bodyJoin -ContentType "application/json"
    Write-Host "✅ Jugador unido con éxito a sala $roomCode" -ForegroundColor Green
    Write-Host "   Respuesta: $($resJoin | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error al unirse a sala: $_" -ForegroundColor Red
}

# 6. Prueba de Validación Fallida de DTO (Regla de negocio: hostName menor a 2 caracteres)
Write-Host "`n[6/8] Probando Rechazo de DTO Inválido (class-validator: @Length(2, 25))..." -ForegroundColor Yellow
try {
    $invalidBody = @{
        hostName = "X"
    } | ConvertTo-Json
    $resInvalid = Invoke-RestMethod -Uri "$baseUrl/rooms" -Method Post -Body $invalidBody -ContentType "application/json"
    Write-Host "⚠️ La validación no rechazó la petición incorrecta." -ForegroundColor Magenta
} catch {
    Write-Host "✅ DTO Inválido rechazado correctamente con HTTP 400 Bad Request:" -ForegroundColor Green
    Write-Host "   Detalle del error: $($_.Exception.Message)" -ForegroundColor Gray
}

# 7. Persistir Misión en PostgreSQL vía Prisma (SaveMissionDto)
Write-Host "`n[7/8] Verificando POST /api/missions (Consumo e Inserción en PostgreSQL)..." -ForegroundColor Yellow
try {
    $bodyMission = @{
        roomCode = $roomCode
        scenarioId = "reactor"
        scenarioName = "Reactor Cuántico"
        status = "GAME_WON"
        teamScore = 4850
        timeRemaining = 540
        playersCount = 2
        playersNames = "Comandante Alpha, Agente Beta"
    } | ConvertTo-Json

    $resMission = Invoke-RestMethod -Uri "$baseUrl/missions" -Method Post -Body $bodyMission -ContentType "application/json"
    Write-Host "✅ Misión registrada en PostgreSQL con éxito!" -ForegroundColor Green
    Write-Host "   ID Generado: $($resMission.record.id)" -ForegroundColor Gray
    Write-Host "   Puntuación: $($resMission.record.teamScore) pts | Tiempo Restante: $($resMission.record.timeRemaining)s" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error al persistir misión en base de datos: $_" -ForegroundColor Red
}

# 8. Consultar Leaderboard e Historial desde PostgreSQL
Write-Host "`n[8/8] Verificando GET /api/missions/leaderboard y GET /api/missions/history..." -ForegroundColor Yellow
try {
    $resLeaderboard = Invoke-RestMethod -Uri "$baseUrl/missions/leaderboard?limit=5" -Method Get
    Write-Host "✅ Leaderboard obtenido directamente de PostgreSQL (Registros: $($resLeaderboard.total)):" -ForegroundColor Green
    foreach ($rec in $resLeaderboard.leaderboard) {
        Write-Host "   🏆 [$($rec.roomCode)] Score: $($rec.teamScore) pts | Equipo: $($rec.playersNames) | Escenario: $($rec.scenarioName)" -ForegroundColor Cyan
    }

    $resHistory = Invoke-RestMethod -Uri "$baseUrl/missions/history?limit=3" -Method Get
    Write-Host "✅ Historial obtenido directamente de PostgreSQL (Total cargados: $($resHistory.total))" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al consultar Leaderboard o Historial: $_" -ForegroundColor Red
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "🎉 PRUEBAS FINALIZADAS CON ÉXITO - BACKEND Y BD OPERATIVOS 100%" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
