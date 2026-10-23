import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser una dirección válida' })
  email!: string;

  @IsString()
  @MinLength(4, { message: 'La contraseña debe tener al menos 4 caracteres' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre en clave es obligatorio' })
  codename!: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  rank?: string;
}

export class VerifyCodeDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser una dirección válida' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'El código de verificación es obligatorio' })
  code!: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser una dirección válida' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password!: string;
}

export class ResendCodeDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser una dirección válida' })
  email!: string;
}
