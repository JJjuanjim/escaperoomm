# 🚀 Escape Room Digital Backend (NestJS 11 + PostgreSQL + Prisma ORM)

Backend corporativo de alta concurrencia para la plataforma **Escape Room Digital Cooperativo Multijugador**. Desarrollado con **NestJS 11**, **TypeScript**, **WebSockets (Socket.IO)** y **PostgreSQL 18.3** mediante el ORM tipado **Prisma**.

Diseñado bajo el patrón arquitectónico riguroso:  
**"Controladores, Servicios de Negocio, DTOs con validaciones automáticas y Persistencia Activa en Base de Datos"**.

---

## 🏛️ Arquitectura del Sistema

```
src/
├── app.module.ts              # Módulo raíz de la aplicación
├── main.ts                    # Bootstrap, CORS, ValidationPipe y Swagger UI (/api/docs)
├── database/
│   ├── database.module.ts     # Módulo de persistencia y consumo a BD
│   └── database.service.ts    # Servicio de operaciones sobre PostgreSQL vía Prisma
├── escape/
│   ├── dto/                   # Contratos de transferencia fuertemente tipados
│   │   ├── create-room.dto.ts     # DTO para instanciación de salas (@Length, @IsString)
│   │   ├── join-room.dto.ts       # DTO para unión a sala (@Matches 4 caracteres)
│   │   ├── validate-puzzle.dto.ts # DTO para resolución y penalizaciones
│   │   └── save-mission.dto.ts    # DTO para persistencia en PostgreSQL
│   ├── escape.controller.ts   # Endpoints RESTful con OpenAPI / Swagger
│   ├── escape.service.ts      # Reglas de negocio del juego y penalizaciones (-15s)
│   ├── escape.gateway.ts      # Comunicación bidireccional en tiempo real (WebSockets)
│   ├── bot-escape.service.ts  # Agentes autónomos para juego cooperativo asistido
│   └── escape.module.ts       # Configuración modular del dominio
└── prisma/
    ├── schema.prisma          # Esquema declarativo de base de datos relacional
    └── prisma.service.ts      # Ciclo de vida y conexión viva a PostgreSQL
```

---

## 📋 Requisitos Previos

- **Node.js** 20.x o superior.
- **npm** 10.x o superior.
- **PostgreSQL** 15+ (Verificado en PostgreSQL 18.3).

---

## ⚙️ Configuración del Entorno (.env)

Cree un archivo `.env` en la raíz de la carpeta `backend` basándose en `.env.example`:

```env
DATABASE_URL="postgresql://postgres:12345678@localhost:5432/postgres?schema=escaperoom"
PORT=3002
```

---

## 🛠️ Instalación y Puesta en Marcha

### 1. Instalar dependencias:
```bash
npm install
```

### 2. Generar cliente de Prisma y sincronizar base de datos:
```bash
npx prisma db push
```

### 3. Compilar el proyecto:
```bash
npm run build
```

### 4. Iniciar en modo desarrollo:
```bash
npm run start:dev
```

### 5. Iniciar en producción:
```bash
npm run start:prod
```

El servidor estará escuchando en: `http://localhost:3002`

---

## 📖 Documentación Interactiva de la API (Swagger UI)

Con el servidor en ejecución, acceda en su navegador a:
👉 **[http://localhost:3002/api/docs](http://localhost:3002/api/docs)**

Permite explorar y probar interactivamente todos los endpoints REST, esquemas de DTOs y respuestas JSON.

---

## 🧪 Pruebas Automatizadas y Consumo a Base de Datos

Se incluye una suite de pruebas para verificar el ciclo completo de validaciones DTO y la persistencia en PostgreSQL:

- **En PowerShell:**
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\test_api.ps1
  ```
- **Con un clic en Windows:**
  Doble clic sobre el archivo `probar_api.bat`.

---

## 📑 Documentación Académica en Normas APA (7ma Edición)

El informe técnico-académico formal con marco teórico, justificación, diagramas de arquitectura (Mermaid), diccionario de datos y conclusiones se encuentra en:
📄 **[DOCUMENTACION_ESCAPEROOM_NORMAS_APA.md](./DOCUMENTACION_ESCAPEROOM_NORMAS_APA.md)**

---

## 👥 Integración con el Frontend (Angular 22)

Este backend se comunica con el frontend desarrollado en **Angular 22** ubicado en `../frontend`:
- **WebSockets:** Eventos bidireccionales en tiempo real en el puerto `3002`.
- **REST API:** Consumo de escenarios, estadísticas y Leaderboard global persistente.
