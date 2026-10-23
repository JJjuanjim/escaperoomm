import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { RegisterDto, VerifyCodeDto, LoginDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(dto: RegisterDto, origin?: string) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: cleanEmail } });

    const code = this.generateCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    let user;
    if (existing) {
      if (existing.isVerified) {
        throw new BadRequestException('Ya existe una cuenta verificada con este correo electrónico. Por favor inicia sesión.');
      }
      // Actualizar datos de registro previo no verificado
      user = await this.prisma.user.update({
        where: { email: cleanEmail },
        data: {
          password: hashedPassword,
          codename: dto.codename.trim(),
          avatar: dto.avatar || '👨‍🚀',
          rank: dto.rank || 'Recluta',
          verificationCode: code,
          verificationExpires: expires,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          codename: dto.codename.trim(),
          avatar: dto.avatar || '👨‍🚀',
          rank: dto.rank || 'Recluta',
          isVerified: false,
          verificationCode: code,
          verificationExpires: expires,
        },
      });
    }

    // Enviar código por correo electrónico (Gmail SMTP)
    const emailResult = await this.emailService.sendVerificationCode(cleanEmail, user.codename, code, origin);

    return {
      success: true,
      message: emailResult.sent
        ? `Código de verificación enviado a tu cuenta de Gmail (${cleanEmail}).`
        : `Código generado para ${cleanEmail}. (Revisa tu bandeja de entrada o usa el código de desarrollo)`,
      email: cleanEmail,
      codename: user.codename,
      // Se incluye el código en la respuesta si SMTP no está configurado para no bloquear pruebas
      devCode: !emailResult.sent ? code : undefined,
    };
  }

  async verifyCode(dto: VerifyCodeDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      throw new NotFoundException('No se encontró ninguna cuenta registrada con este correo');
    }

    if (user.isVerified) {
      return {
        success: true,
        message: 'Tu cuenta ya está verificada',
        user: this.sanitizeUser(user),
      };
    }

    if (!user.verificationCode || user.verificationCode !== dto.code.trim()) {
      throw new BadRequestException('Código de verificación incorrecto');
    }

    if (user.verificationExpires && user.verificationExpires < new Date()) {
      throw new BadRequestException('El código de verificación ha expirado. Solicita uno nuevo.');
    }

    const updated = await this.prisma.user.update({
      where: { email: cleanEmail },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationExpires: null,
      },
    });

    return {
      success: true,
      message: '¡Cuenta verificada exitosamente! Ya eres un Agente de Campo activo.',
      user: this.sanitizeUser(updated),
    };
  }

  async login(dto: LoginDto) {
    const cleanEmail = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      throw new UnauthorizedException('Correo electrónico o contraseña incorrectos');
    }

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) {
      throw new UnauthorizedException('Correo electrónico o contraseña incorrectos');
    }

    if (!user.isVerified) {
      // Reenviar código automáticamente si aún no está verificado
      const code = this.generateCode();
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      await this.prisma.user.update({
        where: { email: cleanEmail },
        data: { verificationCode: code, verificationExpires: expires },
      });
      const emailResult = await this.emailService.sendVerificationCode(cleanEmail, user.codename, code);

      return {
        success: false,
        needsVerification: true,
        message: 'Tu cuenta aún no ha sido confirmada. Te hemos enviado un nuevo código a tu correo Gmail.',
        email: cleanEmail,
        devCode: !emailResult.sent ? code : undefined,
      };
    }

    return {
      success: true,
      message: `¡Bienvenido de vuelta, ${user.rank} ${user.codename}!`,
      user: this.sanitizeUser(user),
    };
  }

  async resendCode(email: string, origin?: string) {
    const cleanEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      throw new NotFoundException('No se encontró ninguna cuenta con este correo');
    }

    if (user.isVerified) {
      return { success: true, message: 'La cuenta ya está verificada' };
    }

    const code = this.generateCode();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await this.prisma.user.update({
      where: { email: cleanEmail },
      data: { verificationCode: code, verificationExpires: expires },
    });

    const emailResult = await this.emailService.sendVerificationCode(cleanEmail, user.codename, code, origin);

    return {
      success: true,
      message: `Nuevo código enviado a ${cleanEmail}`,
      email: cleanEmail,
      devCode: !emailResult.sent ? code : undefined,
    };
  }

  async getProfile(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return this.sanitizeUser(user);
  }

  async updateXpAndStats(email: string, xpDelta: number, won: boolean = false) {
    const cleanEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) return null;

    const updated = await this.prisma.user.update({
      where: { email: cleanEmail },
      data: {
        xpPoints: { increment: xpDelta },
        missionsPlayed: { increment: 1 },
        missionsWon: won ? { increment: 1 } : undefined,
      },
    });

    return this.sanitizeUser(updated);
  }

  private sanitizeUser(user: any) {
    const { password, verificationCode, verificationExpires, ...safe } = user;
    return safe;
  }
}
