import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class JoinRoomDto {
  @ApiProperty({
    example: 'ABCD',
    description: 'Código alfanumérico único de la sala (4 caracteres en mayúscula)',
  })
  @IsString({ message: 'El código de sala debe ser texto' })
  @IsNotEmpty({ message: 'El código de sala es obligatorio' })
  @Length(4, 4, { message: 'El código de sala debe tener exactamente 4 caracteres' })
  @Matches(/^[A-Z0-9]{4}$/i, { message: 'El código solo puede contener letras y números' })
  roomCode: string;

  @ApiProperty({
    example: 'Agente Beta',
    description: 'Nombre o alias del jugador que desea unirse',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del jugador es obligatorio' })
  @Length(2, 25, { message: 'El nombre debe tener entre 2 y 25 caracteres' })
  playerName: string;
}
