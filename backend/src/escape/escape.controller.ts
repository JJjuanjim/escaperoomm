import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { SaveMissionDto } from './dto/save-mission.dto';
import { ValidatePuzzleDto } from './dto/validate-puzzle.dto';
import { EscapeService } from './escape.service';

@ApiTags('Escape Room Digital (API REST & Persistencia)')
@Controller('api')
export class EscapeController {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly escapeService: EscapeService,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: 'Estado de salud del sistema y base de datos',
    description: 'Comprueba la conexión en vivo con PostgreSQL y el estado del servidor NestJS.',
  })
  @ApiOkResponse({ description: 'Servidor y base de datos en línea' })
  getHealth() {
    return {
      status: 'online',
      system: 'Escape Room Digital Colaborativo (NestJS 11 + Angular 22)',
      databaseEngine: 'PostgreSQL 18.3 (Prisma ORM)',
      databaseStatus: this.dbService.isDbConnected() ? 'CONNECTED' : 'DISCONNECTED',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('database/status')
  @ApiOperation({
    summary: 'Monitoreo de conexión a PostgreSQL',
    description: 'Retorna información técnica de la base de datos PostgreSQL, tabla de misiones y conteo de registros.',
  })
  async getDatabaseStatus() {
    const history = await this.dbService.getHistory(1);
    const leaderboard = await this.dbService.getLeaderboard(1);

    return {
      engine: 'PostgreSQL 18.3 (Prisma Client ORM)',
      schema: 'escaperoom',
      status: 'CONNECTED',
      tables: [
        {
          name: 'escape_missions',
          description: 'Registro histórico y ranking de misiones completadas',
          totalSampleLoaded: history.length,
        },
      ],
      leaderboardSampleAvailable: leaderboard.length > 0,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('scenarios')
  @ApiOperation({
    summary: 'Catálogo de escenarios temáticos del Escape Room',
    description: 'Devuelve los 3 mundos: Reactor Cuántico, Templo Faraónico y Estación Espacial Internacional.',
  })
  @ApiOkResponse({ description: 'Catálogo de escenarios obtenido con éxito' })
  getScenarios() {
    return this.escapeService.getScenariosCatalog();
  }

  @Post('rooms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva sala de Escape Room con DTO',
    description: 'Genera un código único de 4 caracteres y asigna el anfitrión y escenario.',
  })
  @ApiCreatedResponse({ description: 'Sala creada exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos del DTO inválidos' })
  createRoom(@Body() dto: CreateRoomDto) {
    const hostPlayer = {
      id: `agent-${Date.now().toString(36)}`,
      name: dto.hostName.trim(),
      isHost: true,
      role: 'commander',
      isReady: true,
    };
    const room = this.escapeService.createRoom(hostPlayer, dto.scenarioId || null);
    return {
      success: true,
      message: `Sala ${room.code} creada con éxito`,
      roomCode: room.code,
      scenario: room.scenario.name,
      hostPlayer,
    };
  }

  @Post('rooms/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unirse a una sala con validación de código DTO',
    description: 'Valida existencia de sala, capacidad máxima (4 agentes) y asigna un nuevo rol.',
  })
  @ApiOkResponse({ description: 'Unión a la sala exitosa' })
  @ApiNotFoundResponse({ description: 'La sala no existe' })
  @ApiBadRequestResponse({ description: 'Sala llena o datos inválidos' })
  joinRoom(@Body() dto: JoinRoomDto) {
    const player = {
      id: `agent-${Date.now().toString(36)}`,
      name: dto.playerName.trim(),
      isHost: false,
      role: 'specialist',
      isReady: true,
    };
    const result = this.escapeService.joinRoom(dto.roomCode, player);
    if (result.error) {
      if (result.error.includes('no existe')) {
        throw new NotFoundException(result.error);
      }
      throw new BadRequestException(result.error);
    }
    return {
      success: true,
      message: `El agente ${dto.playerName} se unió exitosamente a la sala ${dto.roomCode}`,
      roomCode: dto.roomCode.toUpperCase(),
      player,
    };
  }

  @Post('rooms/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar enigma de la sala mediante DTO y reglas de negocio',
    description: 'Aplica penalizaciones automáticas (-15s) en caso de fallo y desbloquea el siguiente nivel si es correcto.',
  })
  validatePuzzle(@Body() dto: ValidatePuzzleDto) {
    const room = this.escapeService.getRoom(dto.roomCode);
    if (!room) {
      throw new NotFoundException(`La sala "${dto.roomCode}" no existe.`);
    }

    const result = this.escapeService.validatePuzzleSubmission(
      dto.roomCode,
      dto.puzzleType,
      dto.answer,
      dto.playerId,
    );

    return {
      success: result.success,
      message: result.message,
      penaltyApplied: result.penaltyApplied ? 15 : 0,
      timeRemaining: room.timeRemaining,
      isLevelCompleted: result.isLevelCompleted || false,
    };
  }

  @Post('missions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Guardar resultado de misión en PostgreSQL (Prisma ORM)',
    description: 'Persiste en la base de datos relacional el resultado final de la partida y actualiza el Leaderboard.',
  })
  @ApiCreatedResponse({ description: 'Misión guardada en base de datos PostgreSQL' })
  @ApiBadRequestResponse({ description: 'Datos de la misión inválidos' })
  async saveMission(@Body() dto: SaveMissionDto) {
    const saved = await this.dbService.saveMission({
      roomCode: dto.roomCode.toUpperCase(),
      scenarioId: dto.scenarioId,
      scenarioName: dto.scenarioName,
      status: dto.status,
      teamScore: dto.teamScore,
      timeRemaining: dto.timeRemaining,
      playersCount: dto.playersCount,
      playersNames: dto.playersNames,
    });

    if (!saved) {
      throw new BadRequestException('No se pudo persistir la misión en la base de datos PostgreSQL.');
    }

    return {
      success: true,
      message: `Misión ${dto.roomCode} guardada exitosamente en PostgreSQL`,
      record: saved,
    };
  }

  @Get('missions/leaderboard')
  @ApiOperation({
    summary: 'Consultar Leaderboard de PostgreSQL',
    description: 'Retorna el ranking de las mejores misiones exitosas ordenadas por puntuación y tiempo restante.',
  })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiOkResponse({ description: 'Tabla de clasificación obtenida directamente de PostgreSQL' })
  async getLeaderboard(@Query('limit') limit?: number) {
    const lim = Math.max(1, Math.min(50, Number(limit) || 10));
    const records = await this.dbService.getLeaderboard(lim);
    return {
      success: true,
      total: records.length,
      leaderboard: records,
    };
  }

  @Get('missions/history')
  @ApiOperation({
    summary: 'Consultar historial completo de misiones en PostgreSQL',
    description: 'Historial de todas las partidas jugadas ordenadas cronológicamente.',
  })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({ description: 'Historial obtenido de PostgreSQL' })
  async getHistory(@Query('limit') limit?: number) {
    const lim = Math.max(1, Math.min(50, Number(limit) || 20));
    const records = await this.dbService.getHistory(lim);
    return {
      success: true,
      total: records.length,
      history: records,
    };
  }
}
