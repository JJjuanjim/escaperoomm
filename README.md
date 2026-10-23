# 🔐 Escape Room Digital Cooperativo (UMG 2026)

> **Universidad Mariano Gálvez de Guatemala**  
> **Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computación**  
> **Curso:** Desarrollo Web — 10mo Semestre  
> **Proyecto:** Escape Room Digital Cooperativo en Tiempo Real (Angular 22 + NestJS 11 + PostgreSQL)

---

## 👥 Equipo de Desarrollo y Módulos de Trabajo

| Integrante | Rol en el Proyecto | Módulo / Responsabilidad Técnica |
| :--- | :--- | :--- |
| **Juan** | **Líder de Proyecto & Backend Core** | Arquitectura del servidor NestJS, WebSocket Gateway en tiempo real, agentes autónomos cooperativos y scripts de automatización. |
| **Cinthia** | **Frontend UI / UX & Diseño** | Componentes y vistas interactivas en Angular 22, diseño Glassmorphism, paneles de acertijos y adaptación responsiva. |
| **Roberto** | **Backend & Base de Datos** | Lógica de negocio, validaciones automáticas con DTOs (`class-validator`), modelos relacionales en Prisma ORM y persistencia en PostgreSQL 18. |
| **German** | **Frontend Logic & Audio API** | Lógica reactiva en Angular, cliente WebSockets Socket.IO y sintetizador procedural de sonido con Web Audio API. |

---

## 🎮 Concepto del Sistema

Un entorno colaborativo asimétrico donde 2 a 4 agentes deben sincronizarse en tiempo real para resolver tres sectores temáticos con un límite de tiempo de 15 minutos:
1. **El Reactor Cuántico** (Fuga Nuclear y calibración de válvulas / cables).
2. **El Templo Faraónico** (Criptografía, jeroglíficos y mecanismos solares).
3. **La Estación Espacial Internacional** (Desvío de fusibles y soporte vital).

---

## 🚀 Inicio Rápido del Proyecto

### 1. Iniciar el Sistema Completo (Backend + Frontend)
Haz doble clic sobre el script de automatización:
👉 `iniciar_proyecto.bat` (o en PowerShell: `.\iniciar_proyecto.ps1`)

* **Backend NestJS**: `http://localhost:3002` (Swagger UI: `http://localhost:3002/api/docs`)
* **Frontend Angular**: `http://localhost:4200`

### 2. Detener el Sistema
Haz doble clic en:
👉 `detener_proyecto.bat` (o en PowerShell: `.\detener_proyecto.ps1`)
