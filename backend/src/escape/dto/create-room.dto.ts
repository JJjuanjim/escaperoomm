import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({
    example: 'Agente Alfa',
    description: 'Nombre o alias del jugador anfitrión que crea la sala',
  })
  @IsString({ message: 'El nombre del anfitrión debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del anfitrión es obligatorio' })
  @Length(2, 25, { message: 'El nombre debe tener entre 2 y 25 caracteres' })
  hostName: string;

  @ApiPropertyOptional({
    example: 'quantum_reactor',
    description: 'Identificador del escenario temático (quantum_reactor, pharaoh_temple, space_station)',
  })
  @IsOptional()
  @IsString({ message: 'El ID del escenario debe ser una cadena de texto' })
  scenarioId?: string;
}
