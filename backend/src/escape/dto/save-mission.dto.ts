import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsString, Length, Matches, Min } from 'class-validator';

export enum MissionStatus {
  GAME_WON = 'GAME_WON',
  GAME_OVER = 'GAME_OVER',
}

export class SaveMissionDto {
  @ApiProperty({
    example: 'ABCD',
    description: 'Código único de la sala de juego finalizada',
  })
  @IsString({ message: 'El código de sala debe ser texto' })
  @IsNotEmpty({ message: 'El código de sala es obligatorio' })
  @Length(4, 4, { message: 'El código de sala debe tener exactamente 4 caracteres' })
  @Matches(/^[A-Z0-9]{4}$/i, { message: 'El código solo puede contener letras y números' })
  roomCode: string;

  @ApiProperty({
    example: 'quantum_reactor',
    description: 'Identificador del escenario temático',
  })
  @IsString({ message: 'El ID del escenario es obligatorio' })
  @IsNotEmpty()
  scenarioId: string;

  @ApiProperty({
    example: 'El Reactor Cuántico',
    description: 'Nombre del escenario temático',
  })
  @IsString({ message: 'El nombre del escenario es obligatorio' })
  @IsNotEmpty()
  scenarioName: string;

  @ApiProperty({
    enum: MissionStatus,
    example: MissionStatus.GAME_WON,
    description: 'Estado de finalización de la partida (GAME_WON o GAME_OVER)',
  })
  @IsEnum(MissionStatus, { message: 'El estado debe ser GAME_WON o GAME_OVER' })
  status: MissionStatus;

  @ApiProperty({
    example: 850,
    description: 'Puntuación total obtenida por el equipo',
  })
  @Type(() => Number)
  @IsInt({ message: 'La puntuación debe ser un número entero' })
  @Min(0, { message: 'La puntuación no puede ser negativa' })
  teamScore: number;

  @ApiProperty({
    example: 420,
    description: 'Segundos restantes en el cronómetro al finalizar la misión',
  })
  @Type(() => Number)
  @IsInt({ message: 'El tiempo restante debe ser un número entero' })
  @Min(0, { message: 'El tiempo restante no puede ser negativo' })
  timeRemaining: number;

  @ApiProperty({
    example: 3,
    description: 'Cantidad de agentes que participaron en la misión',
  })
  @Type(() => Number)
  @IsInt({ message: 'La cantidad de jugadores debe ser un número entero' })
  @Min(1, { message: 'Debe haber al menos 1 jugador' })
  playersCount: number;

  @ApiProperty({
    example: 'Agente Alfa, Agente Beta, Agente Gamma',
    description: 'Nombres de los agentes participantes',
  })
  @IsString({ message: 'Los nombres de los jugadores deben ser texto' })
  @IsNotEmpty()
  playersNames: string;
}
