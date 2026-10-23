import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER?.trim()?.replace(/^["']|["']$/g, '');
    const pass = process.env.SMTP_PASS?.trim()?.replace(/^["']|["']$/g, '');

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`📧 Servicio de correo SMTP configurado para: ${user} (${host}:${port})`);
    } else {
      this.logger.warn(
        '⚠️ Variables SMTP_USER y SMTP_PASS no definidas en backend/.env. Modo de prueba activo (los códigos se mostrarán en consola y en la respuesta).'
      );
    }
  }

  async sendVerificationCode(email: string, codename: string, code: string, hostUrl?: string): Promise<{ sent: boolean; previewUrl?: string }> {
    const baseUrl = hostUrl || process.env.FRONTEND_URL || 'http://localhost:4200';
    const verifyLink = `${baseUrl}/?verifyEmail=${encodeURIComponent(email)}&verifyCode=${code}`;

    const subject = `🔐 [ESCAPE PROTOCOL 2026] Código de Verificación: ${code}`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #050b14; color: #e6f1ff; padding: 30px; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid #00f3ff; box-shadow: 0 0 30px rgba(0, 243, 255, 0.2);">
        <div style="text-align: center; border-bottom: 1px solid rgba(0, 243, 255, 0.2); padding-bottom: 20px; margin-bottom: 24px;">
          <span style="font-size: 42px;">🛰️</span>
          <h1 style="color: #00f3ff; margin: 10px 0 5px; font-size: 24px; letter-spacing: 0.05em;">COMANDO CENTRAL ESCAPE ROOM</h1>
          <p style="color: #94a3b8; margin: 0; font-size: 13px;">PROTOCOLO DE SEGURIDAD Y REGISTRO DE AGENTES</p>
        </div>

        <p style="font-size: 16px; line-height: 1.5;">Hola, Agente <strong style="color: #ffb800;">${codename}</strong>:</p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
          Has iniciado el proceso de vinculación de tu cuenta de correo electrónico (<strong style="color: #fff;">${email}</strong>) a la red de misiones tácticas asimétricas.
        </p>

        <div style="background: rgba(0, 243, 255, 0.08); border: 2px dashed #00f3ff; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
          <span style="display: block; font-size: 12px; color: #94a3b8; letter-spacing: 0.1em; text-transform: uppercase;">Tu Clave de Confirmación Cuántica</span>
          <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #00ff88; margin: 10px 0; font-family: monospace;">${code}</div>
          <span style="font-size: 12px; color: #ff0055;">⏱️ Expira en 15 minutos. No compartas esta clave con nadie.</span>
        </div>

        <!-- Botón de Inicio de Sesión y Activación Directa -->
        <div style="text-align: center; margin: 25px 0 15px;">
          <a href="${verifyLink}" target="_blank" style="background: linear-gradient(135deg, #00f3ff, #00ff88); color: #050b14; text-decoration: none; font-weight: 900; font-size: 15px; padding: 14px 28px; border-radius: 8px; display: inline-block; box-shadow: 0 0 20px rgba(0, 243, 255, 0.4); text-transform: uppercase; letter-spacing: 0.05em;">
            🚀 Iniciar Sesión y Activar Cuenta
          </a>
        </div>

        <p style="text-align: center; font-size: 12px; color: #94a3b8; margin: 15px 0 20px;">
          O abre directamente este enlace en tu navegador:<br/>
          <a href="${verifyLink}" style="color: #00f3ff; word-break: break-all; font-size: 12px;">${verifyLink}</a>
        </p>

        <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
          También puedes ingresar el código manual de 6 dígitos en la ventana de verificación del juego.
        </p>

        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: 30px; padding-top: 15px; text-align: center; font-size: 11px; color: #64748b;">
          Escape Protocol 2026 • Sistema de Misiones Asimétricas en Tiempo Real<br/>
          Si no solicitaste este registro, puedes desestimar este mensaje de forma segura.
        </div>
      </div>
    `;

    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: `"Escape Room HQ" <${process.env.SMTP_USER || 'no-reply@escaperoom.local'}>`,
          to: email,
          subject,
          html,
        });
        this.logger.log(`📨 Correo de verificación enviado con éxito a ${email} (MessageID: ${info.messageId})`);
        return { sent: true };
      } catch (err: any) {
        this.logger.error(`❌ Error al enviar correo SMTP a ${email}: ${err.message}`);
      }
    }

    // Modo de respaldo / simulación si no hay credenciales SMTP configuradas
    this.logger.log(`\n=============================================================`);
    this.logger.log(`📬 [NOTIFICACIÓN DE EMAIL SIMULADA] Destinatario: ${email}`);
    this.logger.log(`🔑 Agente: ${codename} | CÓDIGO DE VERIFICACIÓN: [ ${code} ]`);
    this.logger.log(`=============================================================\n`);

    return { sent: false, previewUrl: undefined };
  }
}
