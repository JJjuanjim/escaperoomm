import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ValidatePuzzleDto {
  @ApiProperty({
    example: 'ABCD',
    description: 'Código de la sala de juego activa',
  })
  @IsString({ message: 'El código de sala debe ser texto' })
  @IsNotEmpty({ message: 'El código de sala es obligatorio' })
  @Length(4, 4, { message: 'El código de sala debe tener exactamente 4 caracteres' })
  @Matches(/^[A-Z0-9]{4}$/i, { message: 'El código solo puede contener letras y números' })
  roomCode: string;

  @ApiProperty({
    example: 'riddle',
    description: 'Tipo de enigma (riddle, keypad, cables, ascii, valves, master)',
  })
  @IsString({ message: 'El tipo de enigma debe ser texto' })
  @IsNotEmpty({ message: 'El tipo de enigma es obligatorio' })
  puzzleType: string;

  @ApiProperty({
    example: '7412',
    description: 'Respuesta ingresada por el equipo para verificación',
  })
  @IsNotEmpty({ message: 'La respuesta es obligatoria' })
  answer: any;

  @ApiProperty({
    example: 'player-1',
    description: 'ID o alias del jugador que somete la respuesta',
  })
  @IsString({ message: 'El ID del jugador debe ser texto' })
  @IsNotEmpty({ message: 'El ID del jugador es obligatorio' })
  playerId: string;
}
