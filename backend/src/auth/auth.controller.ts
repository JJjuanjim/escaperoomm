import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, VerifyCodeDto, LoginDto, ResendCodeDto } from './dto/auth.dto';

@ApiTags('Autenticación & Cuentas de Agente (Gmail)')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo agente con correo Gmail y enviar código de confirmación' })
  @ApiResponse({ status: 201, description: 'Código de verificación enviado al correo' })
  async register(@Body() dto: RegisterDto, @Req() req: any) {
    const origin = req.headers?.origin || (req.headers?.host ? `http://${req.headers.host.replace(':3002', ':4200')}` : 'http://localhost:4200');
    return this.authService.register(dto, origin);
  }

  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar código de 6 dígitos enviado por correo' })
  @ApiResponse({ status: 200, description: 'Cuenta verificada con éxito' })
  async verifyCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con correo Gmail y contraseña' })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('resend-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenviar código de verificación al correo' })
  async resendCode(@Body() dto: ResendCodeDto, @Req() req: any) {
    const origin = req.headers?.origin || (req.headers?.host ? `http://${req.headers.host.replace(':3002', ':4200')}` : 'http://localhost:4200');
    return this.authService.resendCode(dto.email, origin);
  }

  @Get('users')
  @ApiOperation({ summary: 'Listar todos los agentes registrados para carga rápida en pantalla de login' })
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Post('load-agent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cargar perfil de agente registrado por ID' })
  async loadAgent(@Body('id') id: number) {
    return this.authService.loadAgent(id);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Obtener perfil del agente autenticado por email' })
  async getProfile(@Query('email') email: string) {
    return this.authService.getProfile(email);
  }
}
