<style>
  body, p, h1, h2, h3, h4, h5, h6, table, tr, th, td, div, span, li, ul, ol, strong, em, b, i {
    color: #000000 !important;
    font-family: 'Times New Roman', Times, serif;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 20px 0;
    border-top: 2px solid #000000;
    border-bottom: 2px solid #000000;
  }
  th {
    border-bottom: 1px solid #000000;
    padding: 8px;
    text-align: left;
    font-weight: bold;
    color: #000000 !important;
  }
  td {
    padding: 8px;
    border-top: 1px solid #000000;
    border-bottom: 1px solid #000000;
    color: #000000 !important;
  }
</style>

# UNIVERSIDAD MARIANO GÁLVEZ DE GUATEMALA
## FACULTAD DE INGENIERÍA EN SISTEMAS DE INFORMACIÓN Y CIENCIAS DE LA COMPUTACIÓN
### LICENCIATURA EN INGENIERÍA EN SISTEMAS DE INFORMACIÓN
### CURSO: DESARROLLO WEB — DÉCIMO SEMESTRE

---

<br>

<div align="center">

# SISTEMA DE ESCAPE ROOM DIGITAL COOPERATIVO Y COMPETITIVO EN TIEMPO REAL: ARQUITECTURA INTEGRAL FULLSTACK (ANGULAR 22, NESTJS 11, WEBSOCKETS, AUTENTICACIÓN SMTP, PRISMA ORM Y POSTGRESQL)

### INFORME TÉCNICO Y DOCUMENTACIÓN FORMAL DE SOFTWARE BAJO NORMAS APA (7MA EDICIÓN)

<br>

**Autor:** Estudiante de Ingeniería en Sistemas de Información  
**Líder de Proyecto:** Juan  
**Curso:** Desarrollo Web (Décimo Semestre)  
**Catedrático:** Ing. Catedrático del Curso de Desarrollo Web  
**Guatemala, Octubre de 2026**

</div>

<br>

---

## Resumen

El presente documento técnico y académico expone la ingeniería, especificación funcional, arquitectura de software e implementación de una plataforma integral de **Escape Room Digital Multijugador en Tiempo Real**. El sistema fue concebido para operar bajo una arquitectura desacoplada de alto rendimiento, compuesta por un **Frontend Reactivo en Angular 22** y un **Backend Modular en NestJS 11** sobre **Node.js**, orquestados a través del protocolo bidireccional **WebSockets (Socket.IO)** y respaldados por una base de datos relacional **PostgreSQL 18** gestionada mediante el Object-Relational Mapping **Prisma ORM**. La solución tecnológica ofrece una experiencia lúdica asimétrica y competitiva con sincronización de estado distribuido, soporte para 2 a 4 agentes concurrentes, agentes de inteligencia artificial cooperativa autónoma (*Bots*), síntesis procedural de sonido mediante la Web Audio API, y reproducción sincronizada de pistas sonoras temáticas. Asimismo, se incorpora un subsistema de seguridad y autenticación perimetral que incluye registro de agentes con encriptación unidireccional de contraseñas con **Bcrypt**, generación de tokens criptográficos temporales y despacho automatizado de códigos de 6 dígitos y enlaces mágicos de activación directa mediante **Nodemailer** a través del protocolo SMTP de Gmail con cifrado TLS. La persistencia relacional garantiza el almacenamiento inmutable de las partidas, el cálculo dinámico de puntuaciones individuales y la exhibición del Salón de la Fama (*Leaderboard*). Todo el marco metodológico, estructura capitular y presentación de datos se adecúan rigurosamente a las directrices de las **Normas APA (7ma edición)**, empleando una presentación tipográfica y tabular monocromática formal en color negro estricto.

**Palabras clave:** *Angular 22, NestJS 11, WebSockets, Socket.IO, Prisma ORM, PostgreSQL, TypeScript, Autenticación SMTP, Escape Room Digital, Normas APA.*

---

## Abstract

This technical and academic report presents the comprehensive software engineering, functional specifications, architectural patterns, and full-stack implementation of a real-time **Collaborative and Competitive Digital Escape Room** platform. The system operates on a high-throughput decoupled architecture comprising a reactive **Angular 22** client and an enterprise **NestJS 11** backend on **Node.js**, synchronized via bi-directional **WebSockets (Socket.IO)** and backed by a **PostgreSQL 18** relational database engine managed through **Prisma ORM**. The platform supports asymmetric cooperative gameplay and parallel speed challenges for 2 to 4 concurrent players, featuring autonomous cooperative AI bots, procedural audio synthesis with the Web Audio API, and synchronized scenario music playback. Furthermore, a robust authentication and security layer is implemented, utilizing **Bcrypt** password hashing, temporary cryptographic code generation, and automated verification dispatch via **Nodemailer** using Gmail SMTP with TLS encryption. Relational persistence provides auditability of match histories, individual player scores, and an all-time Hall of Fame leaderboard. All documentation chapters, data dictionaries, and structural representations are formally aligned with the **APA 7th Edition** formatting standards, adhering strictly to monochromatic black text and academic tables.

**Keywords:** *Angular 22, NestJS 11, WebSockets, Socket.IO, Prisma ORM, PostgreSQL, TypeScript, SMTP Authentication, Digital Escape Room, APA Standards.*

---

## Tabla de Contenidos

1. [Introducción y Contexto del Proyecto](#1-introducción-y-contexto-del-proyecto)
2. [Planteamiento del Problema, Justificación y Objetivos](#2-planteamiento-del-problema-justificación-y-objetivos)
3. [Arquitectura del Sistema y Patrones de Diseño](#3-arquitectura-del-sistema-y-patrones-de-diseño)
4. [Ecosistema Tecnológico, Lenguajes y Herramientas](#4-ecosistema-tecnológico-lenguajes-y-herramientas)
5. [Frontend y Plantillas HTML: Interfaz de Usuario y Vistas](#5-frontend-y-plantillas-html-interfaz-de-usuario-y-vistas)
6. [Backend y Lógica de Negocio: Microservicios y WebSockets](#6-backend-y-lógica-de-negocio-microservicios-y-websockets)
7. [Módulo de Seguridad, Autenticación y Verificación por Correo](#7-módulo-de-seguridad-autenticación-y-verificación-por-correo)
8. [Modelo Relacional de Datos y Persistencia con Prisma ORM](#8-modelo-relacional-de-datos-y-persistencia-con-prisma-orm)
9. [Entorno de Ejecución, Automatización y Despliegue](#9-entorno-de-ejecución-automatización-y-despliegue)
10. [Conclusiones y Recomendaciones](#10-conclusiones-y-recomendaciones)
11. [Referencias Bibliográficas](#11-referencias-bibliográficas)

---

## 1. Introducción y Contexto del Proyecto

En el ámbito de las ciencias de la computación y el desarrollo web contemporáneo, las aplicaciones interactivas han evolucionado desde interfaces estáticas basadas en el modelo de solicitud-respuesta HTTP sincrónico hacia sistemas hiperreactivos distribuidos de comunicación bidireccional. Este paradigma cobra especial relevancia en experiencias lúdicas y formativas como los *Escape Rooms* (salas de escape), donde múltiples agentes humanos deben coordinar habilidades cognitivas, deducción lógica y comunicación asertiva bajo presión de tiempo.

El proyecto de **Escape Room Digital** desarrollado en la Universidad Mariano Gálvez de Guatemala como trabajo integrador del curso de Desarrollo Web (10mo semestre), tiene como propósito fundamental materializar una solución fullstack escalable, modular y mantenible. El sistema traslada la experiencia física de un escape room a un entorno web inmersivo, en el cual los participantes se conectan a salas de misiones temáticas (El Reactor Cuántico, El Templo Perdido y La Estación Espacial Internacional). En este ecosistema, los jugadores experimentan asimetría de información (cada usuario observa fragmentos o manuales exclusivos que debe dictar a sus compañeros) o bien compiten a toda velocidad en carreras paralelas para ensamblar rompecabezas tácticos, conectar fusibles de plasma y disputar duelos cibernéticos.

El presente documento técnico tiene por finalidad registrar de manera integral y rigurosa la totalidad de las tecnologías, herramientas, lenguajes de programación, plantillas de interfaz de usuario (HTML/CSS), controladores, servicios, modelos de datos, protocolos de seguridad y scripts de automatización que conforman la plataforma.

---

## 2. Planteamiento del Problema, Justificación y Objetivos

### 2.1 Planteamiento del Problema
Tradicionalmente, las aplicaciones web lúdicas o pedagógicas adolecen de tres limitaciones estructurales:
1. **Pérdida de Reactividad y Desincronización**: El uso de polling HTTP genera sobrecarga en la red, latencias perceptibles y estados desincronizados entre los clientes conectados, deteriorando la jugabilidad.
2. **Volatilidad de la Información y Falta de Auditoría**: La gestión de puntuaciones y usuarios exclusivamente en memoria volátil (RAM) impide guardar el progreso, reconocer el desempeño individual en tablas de clasificación y auditar eventos pasados cuando el servidor se reinicia.
3. **Vulnerabilidades en Autenticación y Carga de Datos**: El envío de parámetros no tipados o sin validación rigurosa en el backend expone el servidor a fallos catastróficos, desbordamientos de datos e inyecciones de código. Asimismo, la ausencia de un mecanismo de validación de identidad permite el registro de cuentas fraudulentas sin verificación de correo real.

### 2.2 Justificación
La adopción de una arquitectura empresarial desacoplada basada en **NestJS** y **Angular** con **PostgreSQL** y **Prisma ORM** subsana de raíz estas problemáticas. La capa de WebSockets permite la difusión instantánea de eventos con latencia submétrica; la validación estricta con DTOs y tuberías globales intercepta cargas útiles anómalas; el servicio SMTP asegura la autenticidad del jugador mediante tokens criptográficos de un solo uso; y el motor relacional PostgreSQL garantiza la atomicidad, consistencia, aislamiento y durabilidad (ACID) de los registros y puntuaciones.

### 2.3 Objetivos del Proyecto

#### Objetivo General
Diseñar, desarrollar e implementar una plataforma web de Escape Room Digital Cooperativo y Competitivo en Tiempo Real, estructurada en una arquitectura desacoplada con Angular 22, NestJS 11, WebSockets, Prisma ORM y PostgreSQL, asegurando alta concurrencia, asimetría de datos, autenticación segura y persistencia histórica.

#### Objetivos Específicos
1. Implementar un servidor WebSocket Gateway en NestJS con capacidad de orquestación de salas privadas, temporizadores globales sincronizados, chat en vivo y distribución asimétrica de pistas.
2. Construir una interfaz reactiva y responsiva en Angular 22 con diseño visual Glassmorphism, soporte para dispositivos móviles, síntesis procedural de audio mediante Web Audio API y renderizado dinámico de 8 enigmas interactivos.
3. Desarrollar un subsistema de autenticación y seguridad que gestione el ciclo de vida del usuario con contraseñas encriptadas en Bcrypt, tokens JWT y verificación por correo electrónico mediante Nodemailer y SMTP de Gmail.
4. Diseñar un esquema relacional normalizado en PostgreSQL con Prisma ORM para el registro inmutable de misiones, cálculo del Salón de la Fama (*Leaderboard*) y acumulación de experiencia (XP) por jugador.
5. Elaborar scripts de automatización multiplataforma (`.bat` y `.ps1`) que permitan la ejecución simultánea y el despliegue del sistema completo con un solo comando en redes locales.

---

## 3. Arquitectura del Sistema y Patrones de Diseño

El sistema se estructura siguiendo el principio de **Separación de Responsabilidades (Separation of Concerns - SoC)** y el patrón arquitectónico en capas empresariales, permitiendo que la capa de presentación (Frontend), la capa lógica y de comunicación (Backend) y la capa de almacenamiento (Base de Datos) operen de forma independiente y coordinada.

### 3.1 Diagrama de Arquitectura de la Solución

```
+-------------------------------------------------------------------------------+
|                       CAPA DE CLIENTE / FRONTEND (ANGULAR 22)                 |
|  +-------------------------------------------------------------------------+  |
|  | - Standalone Component (App)         - Web Audio API Procedural         |  |
|  | - Socket.IO Client (WebSockets)      - CSS Glassmorphism Responsivo     |  |
|  | - Router y Gestor de Estados         - Formulario Reactivo y Modales    |  |
|  +-------------------------------------------------------------------------+  |
+---------------------------------------+---------------------------------------+
                                        |  HTTP/REST & WebSockets (Port 3002)
                                        v
+-------------------------------------------------------------------------------+
|                       CAPA DE SERVIDOR / BACKEND (NESTJS 11)                  |
|  +-----------------------------+ +-----------------------------------------+  |
|  | REST API CONTROLLERS        | | WEBSOCKET GATEWAY (Socket.IO)           |  |
|  | - AuthController (/api/auth)| | - EscapeGateway (Eventos en tiempo real)|  |
|  | - EscapeController (/api)   | | - Sincronización de Música y Estados   |  |
|  +--------------+--------------+ +--------------------+--------------------+  |
|                 |                                     |                       |
|                 v                                     v                       |
|  +-------------------------------------------------------------------------+  |
|  | SERVICIOS DE NEGOCIO (LOGIC SERVICES)                                   |  |
|  | - AuthService (Bcrypt, JWT)         - BotEscapeService (IA Cooperativa) |  |
|  | - EmailService (Nodemailer SMTP)    - DatabaseService (Leaderboard)     |  |
|  | - EscapeService (Salas, Puzzles, Carreras, Temporizadores y Puntos)     |  |
|  +-------------------------------------------------------------------------+  |
|                                       |                                       |
|                                       v                                       |
|  +-------------------------------------------------------------------------+  |
|  | CAPA DE ACCESO A DATOS (PRISMA ORM 6)                                   |  |
|  | - PrismaService (Client Pool)       - DTOs & ValidationPipe (Pipes)     |  |
|  +-------------------------------------------------------------------------+  |
+---------------------------------------+---------------------------------------+
                                        |  SQL Protocol / TCP Port 5432
                                        v
+-------------------------------------------------------------------------------+
|                   CAPA DE PERSISTENCIA (POSTGRESQL 18)                         |
|  - Esquema: "escaperoom"                                                      |
|  - Tabla "users": Usuarios, credenciales cifradas, tokens y experiencia (XP) |
|  - Tabla "escape_missions": Historial de salas, puntuaciones y auditoría       |
+-------------------------------------------------------------------------------+
```

### 3.2 Patrones de Diseño Implementados
- **Inyección de Dependencias (Dependency Injection)**: Utilizado transversalmente en NestJS y Angular para garantizar bajo acoplamiento y alta capacidad de prueba (*testability*).
- **Controlador-Servicio (Controller-Service Pattern)**: Los controladores HTTP se limitan a recibir la petición y delegar la lógica de negocio a los servicios.
- **Objeto de Transferencia de Datos (DTO Pattern)**: Encapsulación estricta de las cargas útiles de entrada (`CreateRoomDto`, `RegisterDto`, `SaveMissionDto`) con validadores decorativos.
- **Data Mapper / ORM**: Abstracción relacional provista por Prisma para mapear modelos tipados de TypeScript con tablas de PostgreSQL.
- **Publicador-Suscriptor (Pub-Sub / Event-Driven)**: El WebSocket Gateway emite cambios a salas específicas de Socket.IO (`server.to(roomCode).emit(...)`), garantizando entrega focalizada sin inundación de broadcast.

---

## 4. Ecosistema Tecnológico, Lenguajes y Herramientas

En la siguiente tabla formal se describen las tecnologías, librerías y herramientas utilizadas en la construcción del sistema.

### Tabla 1
*Resumen del Ecosistema Tecnológico y Herramientas Empleadas*

| Categoría | Tecnología / Herramienta | Versión | Rol y Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **Lenguaje Base** | TypeScript | v5.x / v6.x | Tipado estático robusto, prevención de errores en compilación tanto en cliente como en servidor. |
| **Entorno de Ejecución** | Node.js | v24.19.0 | Motor de ejecución JavaScript asíncrono y de alto rendimiento basado en V8. |
| **Gestor de Paquetes** | npm | v11.17.0 | Administración de dependencias, scripts de construcción y ejecución del proyecto. |
| **Framework Frontend** | Angular | v22.1.0 | Framework SPA reactivo con arquitectura de Standalone Components y detección de cambios dinámica. |
| **Framework Backend** | NestJS | v11.x | Framework empresarial progresivo para Node.js, estructurado en módulos, controladores y servicios. |
| **Comunicación en Tiempo Real** | Socket.IO | v4.8.3 | Protocolo WebSocket bidireccional con reconexión automática y manejo de salas (*rooms*). |
| **Base de Datos Relacional** | PostgreSQL | v18.3 | Motor de base de datos relacional ACID de alto rendimiento y confiabilidad. |
| **ORM / Acceso a Datos** | Prisma ORM | v6.x | Mapeo objeto-relacional seguro contra tipos, migraciones estructuradas y consultas optimizadas. |
| **Cifrado de Contraseñas** | Bcryptjs | v2.4.3 | Algoritmo de hash de contraseñas de una vía basado en Blowfish con salt rounds configurables. |
| **Tokens de Sesión** | JSON Web Token (JWT) | v9.0.2 | Generación de firmas digitales compactas y seguras para autorización de peticiones HTTP. |
| **Servicio de Correo** | Nodemailer | v6.10.x | Módulo para despacho de correos electrónicos transaccionales vía protocolo SMTP sobre TLS. |
| **Validación de Cargas** | class-validator & class-transformer | v0.14.x | Validación automática de DTOs mediante decoradores en tuberías de ejecución (*Pipes*). |
| **Documentación de API** | Swagger / OpenAPI | v8.x | Generación interactiva de la especificación de endpoints RESTful accesible en `/api/docs`. |
| **Audio Web** | Web Audio API | W3C Standard | Generador de audio procedural para sintetizar efectos sonoros en tiempo real sin archivos pesados. |
| **Control de Versiones** | Git & GitHub | v2.x | Gestión de control de código fuente distribuido y repositorios de colaboración. |

---

## 5. Frontend y Plantillas HTML: Interfaz de Usuario y Vistas

El cliente web fue desarrollado bajo **Angular 22** como una aplicación de página única (*Single Page Application*). La vista principal y única reside en `frontend/src/app/app.html`, respaldada por el componente reactivo `frontend/src/app/app.ts` y la hoja de estilos `frontend/src/app/app.css`.

### 5.1 Estructura Modular de la Plantilla HTML (`app.html`)
La plantilla HTML organiza la experiencia del usuario mediante renderizado condicional estructurado (`*ngIf`), dividido en las siguientes secciones lógicas:

#### 1. Encabezado Táctico Superior (HUD Navbar)
- **Identidad del Sistema**: Logotipo, estado de conexión WebSocket con indicador de latencia, selector de sonido general (mutear/activar audio).
- **Panel de Usuario Autenticado**: Muestra el avatar del agente, nombre en clave (*codename*), rango táctico (Recluta, Teniente, Comandante), puntos de experiencia acumulados (XP) y botón de cierre de sesión.

#### 2. Pantalla de Bienvenida y Autenticación de Agentes
Si el usuario no ha iniciado sesión, la plantilla despliega:
- **Formulario de Inicio de Sesión**: Correo electrónico y contraseña con validación reactiva en tiempo real.
- **Formulario de Registro**: Campos de correo, contraseña, nombre en clave y selector interactivo de avatares espaciales (`👨‍🚀`, `👩‍🚀`, `🤖`, `👾`, `🕵️`).
- **Modal de Activación y Verificación de Cuenta**: Diálogo que se activa automáticamente al registrarse o al abrir un enlace de correo con parámetros `?verifyEmail=...&verifyCode=...`. Permite ingresar el código numérico de 6 dígitos enviado por SMTP y botón de reenvío de código.

#### 3. Lobby y Sala de Espera Táctica
Cuando el agente ingresa o crea una sala privada:
- **Selector de Escenario Temático**: Tres tarjetas interactivas correspondientes a:
  1. *El Reactor Cuántico (Fuga Nuclear)* — Color temático verde neón.
  2. *El Templo Perdido y la Tumba del Faraón* — Color temático ámbar dorado.
  3. *La Estación Espacial Internacional* — Color temático púrpura estelar.
- **Controlador de Música Sincronizada**: Reproductor embebido de YouTube que sincroniza la pista sonora oficial de cada escenario al momento en que el anfitrión inicia la partida.
- **Insignia del Código de Sala**: Código de 4 caracteres alfanuméricos con botón de copiado rápido al portapapeles.
- **Lista de Agentes y Control de Bots**: Visualización de tarjetas de jugadores conectados y botones para añadir o retirar Inteligencias Artificiales cooperativas (*Bots*).

#### 4. HUD de Juego y Panel Asimétrico Clasificado
Durante la partida (`status === 'PLAYING'`), la plantilla renderiza:
- **Barra de Temporizador y Estado**: Cuenta regresiva de 15 minutos en tiempo real, puntuación grupal y botón para solicitar pistas a la base HQ (máximo 3 pistas por partida, con penalizaciones).
- **Panel Asimétrico Exclusivo**: Caja de seguridad donde cada agente visualiza únicamente su información clasificada (fragmentos de números, manuales técnicos de cables, secuencias binarias o palabras maestras).

#### 5. Módulo de Enigmas y Rompecabezas Interactivos
La plantilla renderiza dinámicamente el componente de acertijo según el tipo (`currentPuzzle.type`):
- **Rompecabezas Táctico de Colocación (JIGSAW_PLACEMENT)**: 
  - Tablero de ensamblaje de 3x3 casillas.
  - Bandeja inferior de piezas disponibles.
  - Soporte de colocación en dos vías: clic en pieza y luego clic en casilla, o selección previa de casilla y clic en pieza.
  - Botón de colocación rápida *"⚡ Colocar"* y soporte de doble clic.
  - Píldoras de progreso en vivo que comparan el avance del jugador (*"Tu Progreso: X/9"*) frente a los rivales de la sala.
- **Duelo de Fusibles de Plasma (CABLE_SEQUENCE)**: 
  - Cuadrícula con los 4 botones de fusibles (`AZUL`, `AMARILLO`, `ROJO`, `VERDE`) accesibles para todos los jugadores.
  - Ranuras de inserción del orden táctico (1 al 4) con opción de eliminación individual o borrado total.
  - Botón de transmisión individual: *"⚡ TRANSMITIR MI SECUENCIA Y GANAR EL RETO"*.
- **Teclado Numérico Asimétrico (ASYNC_KEYPAD)**: Teclado virtual numérico (0-9) con botones de limpiar y enviar solución.
- **Decodificador Binario / ASCII (DECODER)**: Campo de texto alfanumérico para ingresar la palabra traducida.
- **Frase Maestra de Autorización (MASTER_PHRASE)**: Campo para introducir la contraseña combinada del equipo.
- **Calibración de Válvulas de Presión (VALVES)**: Controles deslizantes para ajustar la presión de las tuberías en conjunto.
- **Duelo Cibernético de Tres en Raya (TICTACTOE_VS)**: Tablero clásico de 3x3 con turnos interactivos entre agentes humanos o contra la IA centinela.
- **Duelo de Piedra, Papel o Tijera (RPS_DUEL)**: Selección táctica oculta (Piedra, Papel, Tijera) con resolución simultánea al mejor de 3 rondas.

#### 6. Salón de la Fama y Chat Táctico
- **Pestaña de Historial de Partidas**: Misiones registradas en PostgreSQL con escenario, tiempo remanente y nombres de agentes.
- **Pestaña de Ranking de Agentes**: Clasificación individual persistente por experiencia (XP) y misiones ganadas.
- **Consola de Chat Bidireccional**: Envío y recepción de mensajes de texto, notificaciones del sistema con alertas sonoras y consejos provistos por bots cooperativos.

---

## 6. Backend y Lógica de Negocio: Microservicios y WebSockets

El servidor fue construido utilizando el framework empresarial **NestJS 11** en TypeScript. La lógica de negocio está totalmente desacoplada de la capa de transporte.

### 6.1 Módulos del Backend
1. **`AppModule`**: Módulo raíz que importa y orquesta `PrismaModule`, `DatabaseModule`, `AuthModule` y `EscapeModule`.
2. **`AuthModule`**: Centraliza la autenticación, emitiendo controladores REST y servicios para registro, login, generación de códigos temporales y despacho SMTP.
3. **`EscapeModule`**: Agrupa el `EscapeController`, el `EscapeGateway` (WebSockets) y el `EscapeService`.
4. **`DatabaseModule`**: Provee servicios de alto nivel para consultas analíticas sobre PostgreSQL.
5. **`PrismaModule`**: Gestiona el ciclo de vida de la conexión del cliente `@prisma/client`.

### 6.2 Controladores RESTful
El `EscapeController` y el `AuthController` exponen los siguientes puntos de entrada documentados bajo OpenAPI/Swagger:

### Tabla 2
*Catálogo de Endpoints RESTful del Backend*

| Método | Ruta HTTP | Descripción | Parámetros / DTO |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Verificación de estado y salud del servidor. | Ninguno. |
| `GET` | `/api/database/status` | Estado de la conexión física con PostgreSQL. | Ninguno. |
| `GET` | `/api/scenarios` | Catálogo de los 3 escenarios con sus niveles y pistas. | Ninguno. |
| `POST` | `/api/rooms` | Creación de sala privada mediante petición REST. | `CreateRoomDto` |
| `POST` | `/api/rooms/join` | Incorporación de un jugador a una sala existente. | `JoinRoomDto` |
| `POST` | `/api/missions` | Persistencia manual de una misión finalizada en BD. | `SaveMissionDto` |
| `GET` | `/api/missions/leaderboard` | Consulta de las mejores partidas históricas. | `?limit=N` |
| `GET` | `/api/missions/users-leaderboard` | Ranking de usuarios individuales por XP en PostgreSQL. | Ninguno. |
| `GET` | `/api/missions/history` | Historial cronológico de misiones registradas. | `?limit=N` |
| `POST` | `/api/auth/register` | Registro de nuevo usuario y despacho de correo con código. | `RegisterDto` |
| `POST` | `/api/auth/verify-code` | Validación del código de 6 dígitos y activación de cuenta. | `VerifyCodeDto` |
| `POST` | `/api/auth/login` | Autenticación de credenciales y retorno de token JWT. | `LoginDto` |
| `POST` | `/api/auth/resend-code` | Regeneración y reenvío de código de activación. | `{ email: string }` |
| `GET` | `/api/auth/profile` | Retorno de datos del usuario autenticado con JWT. | Header `Authorization: Bearer <token>` |

### 6.3 Gateway de WebSockets (`EscapeGateway`)
El componente `EscapeGateway` implementa `@WebSocketGateway` sobre Socket.IO. Gobierna la comunicación bidireccional en tiempo real:

- **Manejo de Salas**: Cuando un cliente emite `create_room` o `join_room`, el socket se une a un canal privado (`client.join(roomCode)`).
- **Sanitización Asimétrica del Estado**: Mediante `getSanitizedRoomState(room, playerId)`, cada jugador recibe un estado personalizado en el evento `room_state_update`, conteniendo exclusivamente la información y fragmentos que le corresponden según su rol.
- **Sincronización de Música**: El evento `sync_mission_music` difunde a todos los clientes de la sala el identificador del video de YouTube y la marca de tiempo de inicio para que la música comience exactamente en el mismo segundo en todos los navegadores.
- **Temporizador Global Asíncrono**: Un intervalo de servidor decrementa `timeRemaining` segundo a segundo y emite `timer_tick`. Si el tiempo llega a cero, el servidor finaliza la partida (`GAME_OVER`), persiste el fallo en PostgreSQL y notifica a los jugadores.

---

## 7. Módulo de Seguridad, Autenticación y Verificación por Correo

El subsistema de autenticación fue concebido para garantizar integridad de cuentas y prevenir registros automatizados (*bots* no autorizados) mediante verificación de doble factor en el registro.

### 7.1 Flujo Criptográfico y de Activación por Correo

```
[Usuario en Angular]
        |
        |  1. POST /api/auth/register { email, password, codename, avatar }
        v
[AuthService en NestJS]
        |
        |-- Cifra contraseña con Bcrypt (Salt rounds = 10)
        |-- Genera código numérico aleatorio de 6 dígitos (ej: 849201)
        |-- Establece tiempo de expiración (Date.now() + 15 minutos)
        |-- Guarda usuario inactivo (is_verified = false) en PostgreSQL
        |
        v
[EmailService (Nodemailer SMTP)]
        |
        |  2. Despacha correo con plantilla HTML segura vía Gmail SMTP (TLS 587)
        v
[Bandeja de Entrada del Usuario]
        |
        |-- Contiene el Código: [ 849201 ]
        |-- Contiene Enlace Directo: http://localhost:4200/?verifyEmail=...&verifyCode=849201
        |
        v
[Activación de Cuenta]
        |
        |  3. POST /api/auth/verify-code
        v
[Base de Datos PostgreSQL]
        |
        |-- Valida código y vigencia temporal
        |-- Actualiza: is_verified = true, verification_code = null
        |-- Otorga bonificación inicial de bienvenida (+100 XP)
        v
[Usuario Activado y Listo para Iniciar Sesión]
```

### 7.2 Implementación del Servicio de Correo (`EmailService`)
Ubicado en `backend/src/auth/email.service.ts`, implementa:
- Configuración flexible mediante variables de entorno (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
- Plantilla HTML responsiva con diseño temático de agencia espacial / escape room.
- Generación de hipervínculo seguro de verificación inmediata codificado con `encodeURIComponent`.

---

## 8. Modelo Relacional de Datos y Persistencia con Prisma ORM

La persistencia del sistema está gobernada por **PostgreSQL 18**, configurado bajo el esquema dedicado `escaperoom`. La interacción de lectura y escritura se realiza a través de **Prisma ORM 6**.

### 8.1 Archivo de Definición del Esquema (`backend/prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model EscapeMission {
  id            Int      @id @default(autoincrement())
  roomCode      String   @map("room_code")
  scenarioId    String   @map("scenario_id")
  scenarioName  String   @map("scenario_name")
  status        String
  teamScore     Int      @map("team_score")
  timeRemaining Int      @map("time_remaining")
  playersCount  Int      @map("players_count")
  playersNames  String   @map("players_names")
  completedAt   DateTime @default(now()) @map("completed_at")

  @@map("escape_missions")
}

model User {
  id                  Int       @id @default(autoincrement())
  email               String    @unique
  password            String
  codename            String
  avatar              String    @default("👨‍🚀")
  rank                String    @default("Recluta")
  isVerified          Boolean   @default(false) @map("is_verified")
  verificationCode    String?   @map("verification_code")
  verificationExpires DateTime? @map("verification_expires")
  xpPoints            Int       @default(100) @map("xp_points")
  missionsPlayed      Int       @default(0) @map("missions_played")
  missionsWon         Int       @default(0) @map("missions_won")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  @@map("users")
}
```

### 8.2 Diccionario de Datos

### Tabla 3
*Diccionario de Datos: Entidad "users" (Agentes del Sistema)*

| Nombre del Campo | Tipo de Dato | Nulo | Clave | Valor por Defecto | Descripción Técnica |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `SERIAL` (INT) | No | PK | Autoincremental | Identificador primario único del usuario. |
| `email` | `VARCHAR(255)` | No | UQ | Ninguno | Correo electrónico institucional o personal del agente. |
| `password` | `VARCHAR(255)` | No | Ninguna | Ninguno | Contraseña encriptada en formato hash Bcrypt. |
| `codename` | `VARCHAR(100)` | No | Ninguna | Ninguno | Nombre en clave táctico visible en salas y clasificaciones. |
| `avatar` | `VARCHAR(50)` | No | Ninguna | `'👨‍🚀'` | Emoji o identificador gráfico del avatar del agente. |
| `rank` | `VARCHAR(50)` | No | Ninguna | `'Recluta'` | Rango militar o táctico asignado según su nivel de XP. |
| `is_verified` | `BOOLEAN` | No | Ninguna | `false` | Bandera de activación tras verificar el código de correo. |
| `verification_code` | `VARCHAR(10)` | Sí | Ninguna | `NULL` | Código numérico de 6 dígitos de uso único. |
| `verification_expires`| `TIMESTAMP` | Sí | Ninguna | `NULL` | Marca de tiempo límite para la vigencia del código. |
| `xp_points` | `INT` | No | Ninguna | `100` | Puntos de experiencia globales acumulados en misiones. |
| `missions_played` | `INT` | No | Ninguna | `0` | Contador histórico de partidas disputadas. |
| `missions_won` | `INT` | No | Ninguna | `0` | Contador histórico de misiones completadas exitosamente. |
| `created_at` | `TIMESTAMP` | No | Ninguna | `CURRENT_TIMESTAMP`| Fecha y hora de creación de la cuenta de usuario. |
| `updated_at` | `TIMESTAMP` | No | Ninguna | `CURRENT_TIMESTAMP`| Fecha y hora de la última modificación del registro. |

### Tabla 4
*Diccionario de Datos: Entidad "escape_missions" (Auditoría de Partidas)*

| Nombre del Campo | Tipo de Dato | Nulo | Clave | Valor por Defecto | Descripción Técnica |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `SERIAL` (INT) | No | PK | Autoincremental | Identificador primario de la misión concluida. |
| `room_code` | `VARCHAR(10)` | No | Ninguna | Ninguno | Código alfanumérico de 4 letras de la sala de juego. |
| `scenario_id` | `VARCHAR(50)` | No | Ninguna | Ninguno | Identificador textual del escenario temático resuelto. |
| `scenario_name` | `VARCHAR(100)`| No | Ninguna | Ninguno | Nombre formal del escenario descriptivo. |
| `status` | `VARCHAR(20)` | No | Ninguna | Ninguno | Estado de culminación (`GAME_WON` o `GAME_OVER`). |
| `team_score` | `INT` | No | Ninguna | `0` | Puntuación total acumulada por el equipo de agentes. |
| `time_remaining` | `INT` | No | Ninguna | `0` | Segundos restantes en el cronómetro al finalizar. |
| `players_count` | `INT` | No | Ninguna | `0` | Cantidad total de agentes participantes en la sala. |
| `players_names` | `TEXT` | No | Ninguna | Ninguno | Cadena concatenada con los nombres de los agentes. |
| `completed_at` | `TIMESTAMP` | No | Ninguna | `CURRENT_TIMESTAMP`| Marca de tiempo exacta en que la misión concluyó. |

---

## 9. Entorno de Ejecución, Automatización y Despliegue

Para garantizar una puesta en marcha inmediata sin configuraciones complejas, el proyecto dispone de scripts de automatización para sistemas operativos Windows mediante Batch y PowerShell.

### 9.1 Scripts de Inicialización Concurrente
- **`iniciar_proyecto.bat` / `iniciar_proyecto.ps1`**:
  1. Verifica la existencia de `backend/node_modules`; si no existen, ejecuta `npm install`.
  2. Inicia el servidor NestJS 11 con Prisma ORM en el puerto `3002` en una consola dedicada.
  3. Verifica la existencia de `frontend/node_modules`; si no existen, ejecuta `npm install`.
  4. Compila y sirve la aplicación Angular 22 en el puerto `4200` exponiéndola en `0.0.0.0` para acceso en red local Wi-Fi desde computadoras o celulares.
  5. Abre automáticamente el navegador predeterminado en `http://localhost:4200`.

- **`detener_proyecto.bat` / `detener_proyecto.ps1`**:
  Termina limpiamente todos los procesos de Node.js asociados a los puertos 3002 y 4200, liberando los recursos de red y memoria del sistema operativo.

- **`abrir_prisma_studio.bat`**:
  Ejecuta `npx prisma studio` en el puerto `5555`, brindando una interfaz visual para explorar, editar y auditar los registros de PostgreSQL directamente en el navegador.

---

## 10. Conclusiones y Recomendaciones

### 10.1 Conclusiones
1. La arquitectura desacoplada basada en **NestJS** y **Angular** demostró ser una solución de alta fidelidad para videojuegos web en tiempo real. La separación estricta entre controladores RESTful y gateways de WebSockets permitió mantener un código modular y fácil de mantener.
2. El uso de **WebSockets con Socket.IO** resolvió eficazmente los problemas de latencia y desincronización que aquejan a las arquitecturas tradicionales basadas en sondeo HTTP. Cada movimiento en los rompecabezas, duelos de tres en raya y calibraciones de presión se propaga de manera instantánea y asimétrica a todos los participantes.
3. La implementación de **Prisma ORM** sobre **PostgreSQL 18** otorgó seguridad de tipos (*Type Safety*) de extremo a extremo, eliminando discrepancias entre las estructuras de datos de TypeScript y las tablas de la base de datos relacional.
4. El subsistema de seguridad y verificación por correo mediante **Bcrypt**, **JWT** y **Nodemailer (SMTP)** dotó al proyecto de robustez profesional, asegurando que las identidades y puntuaciones de los jugadores permanezcan resguardadas de forma verídica y auditable.

### 10.2 Recomendaciones
1. **Despliegue Productivo con Contenedores**: Se recomienda empaquetar el backend de NestJS y la base de datos PostgreSQL utilizando Docker Compose, facilitando su migración a servidores en la nube como AWS, Render o DigitalOcean.
2. **Caché en Memoria para Salas Activas**: Para escalar a cientos de salas simultáneas, se sugiere incorporar una capa de almacenamiento en memoria con Redis (mediante `@socket.io/redis-adapter`), permitiendo compartir estados entre múltiples instancias distribuidas del backend.
3. **Internacionalización (i18n)**: Se sugiere implementar diccionarios de internacionalización en Angular para permitir que las misiones y pistas puedan resolverse en múltiples idiomas (español, inglés, portugués).

---

## 11. Referencias Bibliográficas

American Psychological Association. (2020). *Publication manual of the American Psychological Association* (7th ed.). https://doi.org/10.1037/0000165-000

Angular Development Team. (2026). *Angular: The modern web developer's platform*. Google Open Source. https://angular.dev

Freeman, A. (2023). *Pro Angular 16: Build powerful and dynamic web applications* (6th ed.). Apress.

NestJS Core Team. (2026). *NestJS: A progressive Node.js framework for building efficient, reliable and scalable server-side applications*. https://docs.nestjs.com

Nodemailer Project. (2026). *Nodemailer: Send emails from Node.js with ease*. https://nodemailer.com

PostgreSQL Global Development Group. (2026). *PostgreSQL 18: The world's most advanced open source database*. https://www.postgresql.org/docs/

Prisma Data Inc. (2026). *Prisma ORM documentation: Next-generation Node.js and TypeScript ORM*. https://www.prisma.io/docs/

Socket.IO Community. (2026). *Socket.IO: Bidirectional and low-latency communication for every platform*. https://socket.io/docs/v4/
