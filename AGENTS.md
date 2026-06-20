# ChatHub Backend — Contexto para Agentes de Código

## 🗂 Descripción General

**ChatHub Backend** es una API REST + WebSocket server para la plataforma **ChatHub**, una aplicación de chat en tiempo real con salas temáticas. Permite a los usuarios:

- Explorar, crear y unirse a salas de chat públicas.
- Comunicarse en tiempo real mediante texto, imágenes, audio y GIFs.
- Reportar usuarios, gestionar perfiles y favoritos.
- Administrar el contenido a través de un panel de administración.

El backend actúa como la única fuente de verdad para autenticación, datos persistentes y estado de salas de chat en tiempo real.

---

## 🏗 Arquitectura General

```
random_chat_backend/
├── src/
│   ├── index.ts              # Entry point: Express + Socket.IO + Middlewares
│   ├── config/               # Rate limiters de express-rate-limit
│   ├── controllers/          # Capa HTTP: recibe req, llama service, responde
│   ├── services/             # Lógica de negocio central
│   │   └── chat/             # Sistema de chat en tiempo real
│   │       ├── chat.service.ts       # Manejador de todos los eventos Socket.IO
│   │       └── adapters/            # Patrón Adapter para estado del chat
│   │           ├── base.adapter.ts        # Interface IChatAdapter
│   │           ├── in-memory.adapter.ts   # Singleton para desarrollo local
│   │           └── redis.adapter.ts       # Adapter para producción escalable
│   ├── repositories/         # Capa de acceso a datos (Prisma)
│   ├── middlewares/          # Express middlewares (auth, CSRF, validación, etc.)
│   ├── routes/v1/            # Definición de rutas HTTP organizadas por dominio
│   ├── lib/                  # Módulos singleton (auth, redis, prisma, supabase, etc.)
│   ├── types/                # Tipos TypeScript compartidos
│   ├── utils/                # Helpers: ApiError, asyncHandler
│   └── validations/          # Schemas de Zod para validación de request
├── prisma/
│   ├── schema.prisma         # Esquema completo de la base de datos MySQL
│   ├── seed.ts               # Seed general con datos de ejemplo
│   └── seed-admin.ts         # Seed para crear el primer usuario admin
```

### Patrón de capas

```
Request → Router → Middleware (auth/validate/rate-limit) → Controller → Service → Repository → Prisma/DB
                                                                    ↘ lib/cache (Redis o memory)
Socket.IO → ChatService → IChatAdapter (Redis o InMemory)
```

---

## 🛠 Stack Tecnológico

| Tecnología | Uso |
|---|---|
| **Node.js + TypeScript** | Runtime y lenguaje principal |
| **Express 5** | Framework HTTP |
| **Socket.IO 4** | WebSockets para chat en tiempo real |
| **Prisma 6** | ORM para MySQL |
| **MySQL** | Base de datos relacional |
| **better-auth** | Autenticación con email/password + OAuth (Google, Facebook) |
| **Redis (ioredis)** | Estado del chat distribuido + Socket.IO adapter + cache + rate limiting |
| **Supabase Storage** | Almacenamiento de imágenes (chat-images, rooms-assets) |
| **Nodemailer** | Envío de emails de verificación |
| **Helmet** | Headers de seguridad HTTP |
| **Zod** | Validación de schemas en requests |
| **Winston** | Logging estructurado |
| **sanitize-html** | Sanitización de mensajes para prevenir XSS |
| **express-rate-limit** | Rate limiting a nivel HTTP |

---

## 🗄 Modelo de Datos (Prisma)

### Entidades principales

| Modelo | Descripción |
|---|---|
| `User` | Usuario con roles (USER / MODERATOR / ADMIN), ban, hobbies, perfil |
| `Room` | Sala de chat con status (IN_REVISION / ACCEPTED / REJECTED), owner, categorías |
| `Session` / `Account` | Tablas manejadas por better-auth para sesiones y OAuth |
| `FavoriteRoom` | Relación M-M usuario-sala (pivot table) |
| `UserRoomActivity` | Historial de actividad usuario-sala (contador de interacciones) |
| `FavoriteGif` | GIFs de Giphy guardados por usuario |
| `Report` | Reportes de usuarios con contexto de chat (chatContext: JSON) |
| `Category` | Categorías de salas (M-M con Room via RoomCategory) |
| `Hobby` | Hobbies del usuario (M-M con User) |
| `GlobalSetting` | Configuraciones globales clave-valor |
| `Verification` | Tokens de verificación de email (manejado por better-auth) |

### Enums importantes

- `RoomStatus`: `IN_REVISION` → `ACCEPTED` / `REJECTED`
- `UserRole`: `USER`, `MODERATOR`, `ADMIN`
- `ReportReason`: `SPAM`, `HARASSMENT`, `INAPPROPRIATE_CONTENT`, `HATE_SPEECH`, `ANNOYING_BEHAVIOR`, `OTHER`
- `AgeRange`: `RANGE_19_24`, `RANGE_25_34`, `RANGE_35_44`, `RANGE_45_PLUS`
- `ConversationType`: `CASUAL`, `DEEP`, `LEARNING`, `SHARING_EXPERIENCES`

---

## 🔐 Autenticación

La autenticación está totalmente delegada a **better-auth** (librería).

- **Rutas**: manejadas automáticamente en `/api/auth/*` via `toNodeHandler(auth)`
- **Proveedores**: Email/password + Google OAuth + Facebook OAuth
- **Sesiones**: Cookie-based (`random-chat` prefix)
- **Plugin customSession**: extiende la sesión con `username`, `role` e `isCompleteProfile`
- **Socket.IO auth**: el middleware de Socket.IO extrae la sesión de los headers de handshake y adjunta `socket.data.user`

**Flujo para rutas protegidas:**
1. `validateSession` middleware verifica la sesión con `auth.api.getSession()`
2. Adjunta `req.user` y `req.session` al request
3. `validateAdmin` verifica que `req.user.role === 'ADMIN'`

---

## 🌐 API REST — Rutas v1

Todas las rutas tienen prefijo `/api/v1/`.

### Rooms (`/api/v1/rooms`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/` | Opcional | Listar salas paginadas (search, categoryId) |
| GET | `/my-rooms` | Requerida | Salas creadas por el usuario autenticado |
| GET | `/favorites` | Requerida | Salas favoritas del usuario |
| POST | `/` | Requerida | Crear sala (rate-limited, nombre único normalizado) |
| POST | `/:roomId/favorite` | Requerida | Toggle favorito en una sala |
| POST | `/:roomId/activity` | Requerida | Registrar actividad de usuario en sala |
| POST | `/:roomId/generate-upload-url` | Requerida | Generar URL firmada de Supabase para banner/icon |
| PATCH | `/:roomId` | Requerida | Actualizar atributo de sala (solo owner) |

### Users (`/api/v1/users`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/session` | Opcional | Verificar sesión activa (usado por el frontend middleware) |
| GET | `/:username` | No | Perfil público por username |
| PATCH | `/profile` | Requerida | Actualizar perfil del usuario |
| POST | `/profile/generate-upload-url` | Requerida | URL firmada para subir avatar |

### Admin (`/api/v1/admin`) — Solo ADMIN

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/stats` | Estadísticas globales |
| POST | `/broadcast` | Enviar mensaje global a todos los usuarios conectados |
| GET | `/rooms` | Listar salas por status para moderación |
| PATCH | `/rooms/:roomId/status` | Aprobar/rechazar sala |
| GET | `/users` | Listar usuarios con filtros |
| PATCH | `/users/:userId/ban` | Banear/desbanear usuario |
| PATCH | `/users/:userId/role` | Cambiar rol de usuario |

### Otros

| Prefijo | Descripción |
|---|---|
| `/api/v1/categories` | CRUD de categorías |
| `/api/v1/reports` | Crear reportes de usuarios |
| `/api/v1/hobbies` | Listar hobbies disponibles |
| `/api/v1/health` | Health check del servidor y dependencias |
| `/api/auth/*` | Manejado por better-auth (login, signup, OAuth, etc.) |

---

## 🔌 WebSocket — Eventos Socket.IO

La conexión Socket.IO es la columna vertebral del chat en tiempo real.

### Eventos del Cliente → Servidor

| Evento | Payload | Descripción |
|---|---|---|
| `join-room` | `(roomId, username)` | Unirse a una sala (verifica estado ACCEPTED y ban) |
| `leave-room` | — | Abandonar la sala actual |
| `get-initial-room-state` | — | Solicitar conteos de usuarios en todas las salas |
| `message` | `string \| { message, replyTo? }` | Enviar mensaje de texto |
| `image` | `{ imageUrl, description?, replyTo?, tempId? }` | Enviar imagen (URL validada contra dominios permitidos) |
| `audio` | `{ audioUrl, duration?, replyTo?, tempId? }` | Enviar nota de voz |
| `gif` | `{ gifUrl, giphyId, replyTo?, tempId? }` | Enviar GIF de Giphy |
| `request-chat-image-upload` | `{ contentType, tempId }` | Solicitar URL firmada para subir imagen al chat |
| `send_reaction` | `{ messageId, emoji }` | Enviar reacción a un mensaje |
| `start-typing` | — | Notificar que el usuario está escribiendo |
| `stop-typing` | — | Notificar que el usuario paró de escribir |
| `report-user` | `{ reportedUserId, reason, details? }` | Reportar usuario (guarda últimos 20 mensajes como evidencia) |

### Eventos Servidor → Cliente

| Evento | Descripción |
|---|---|
| `message` | Nuevo mensaje de texto |
| `image` | Nuevo mensaje de imagen |
| `audio` | Nuevo mensaje de audio |
| `gif` | Nuevo mensaje de GIF |
| `message-history` | Historial de mensajes al unirse a la sala |
| `initial-room-state` | Estado inicial: conteo de usuarios por sala |
| `user-count` | Actualización de conteo de usuarios en una sala específica |
| `room_users` | Lista de usuarios actualmente en el sub-room |
| `user-joined` | Sistema: notificación de usuario que se unió |
| `user-left` | Sistema: notificación de usuario que se fue |
| `user-started-typing` | Notificación de typing indicator |
| `user-stopped-typing` | Notificación de fin de typing |
| `reaction_update` | Actualización de reacciones a un mensaje |
| `grant-chat-image-upload` | URL firmada + pública para subir imagen |
| `global_system_message` | Mensaje broadcast a todos los usuarios (admin) |
| `report-success` | Confirmación de reporte enviado |
| `error` | Error en operación de socket |

### Concepto de Sub-Rooms

Las salas de chat usan un sistema de **sub-rooms** para manejar salas con muchos usuarios:

- Cada sala (`parentRoom`) puede tener múltiples sub-rooms (ej. `sala-gatos:0`, `sala-gatos:1`)
- El adapter distribuye usuarios entre sub-rooms según capacidad máxima
- Historial de mensajes se mantiene **por sub-room**
- Los conteos de usuarios se agregan a nivel de `parentRoom`

---

## 🔧 Módulos Clave (`src/lib/`)

| Módulo | Descripción |
|---|---|
| `auth.ts` | Configuración de better-auth con Prisma, email y social providers |
| `redis.ts` | Singleton de cliente Redis (lazy init, solo si `CHAT_ADAPTER=redis`) |
| `cache.ts` | Capa de cache abstracta: Redis (si activo) o Map en memoria. TTL configurable |
| `prisma.ts` | Singleton de Prisma Client |
| `supabase.ts` | Cliente de Supabase para Storage |
| `logger.ts` | Logger Winston con niveles configurables |
| `gracefulShutdown.ts` | Shutdown limpio del servidor HTTP y Socket.IO |
| `errorMessages.ts` | Constantes de mensajes de error |

---

## 🛡 Seguridad

| Mecanismo | Implementación |
|---|---|
| **CSRF Protection** | Middleware `csrfProtection.ts`: verifica header `Origin` vs `ALLOWED_ORIGINS` |
| **Rate Limiting HTTP** | `express-rate-limit` con backends Redis/memory: general, auth, list, createRoom |
| **Rate Limiting Socket.IO** | Rate limiting por socket con ventana deslizante en Map en memoria |
| **XSS Prevention** | `sanitize-html` en todos los mensajes del chat. Solo permite `b, i, em, strong, a` |
| **URL Validation** | `isValidMediaUrl()` valida URLs contra whitelist de dominios permitidos |
| **Helmet** | Headers de seguridad HTTP automáticos |
| **Input Validation** | Zod schemas en todos los endpoints (via middleware `validate`) |
| **Mass Assignment** | Whitelist explícita de campos permitidos en `updateRoomAttribute` |

---

## ⚙️ Variables de Entorno Importantes

```env
DATABASE_URL=          # MySQL connection string
REDIS_URL=             # Redis URL (opcional, si CHAT_ADAPTER=redis)
CHAT_ADAPTER=          # "redis" o vacío (usa InMemory)
USE_REDIS_CACHE=       # "true" para usar Redis en cache
ALLOWED_ORIGINS=       # JSON array de URLs permitidas (CORS + CSRF)
PORT=                  # Puerto del servidor (default 3001)

# better-auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Email
EMAIL_FROM=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=

# Límites
MAX_ROOMS_PER_DAY=     # Salas que un usuario puede crear por día (default 1)
MAX_MESSAGES_HISTORY=  # Mensajes de historial al unirse (default 10)
SOCKET_RATE_LIMIT=     # Mensajes por ventana por socket (default 20)
SOCKET_RATE_WINDOW_MS= # Ventana de tiempo rate limit socket (default 60000ms)
CACHE_DEFAULT_TTL_MS=  # TTL de cache (default 300000ms = 5min)
```

---

## 🚀 Scripts

```bash
npm run dev     # Desarrollo con nodemon + ts-node
npm run build   # Compilar TypeScript a dist/
npm run start   # Build + ejecutar desde dist/
npm run seed-admin  # Crear primer usuario ADMIN en la DB
```

---

## 📌 Convenciones y Patrones

### Manejo de Errores
- Todos los controllers usan `asyncHandler` para propagar errores a `errorHandler` middleware
- Los errores de negocio se lanzan con `new ApiError(statusCode, message)`
- El `errorHandler` middleware serializa y responde con el código HTTP correcto

### Repositorios
- Solo contienen queries de Prisma, sin lógica de negocio
- Los services importan el repositorio completo: `import * as RoomRepository from '...'`

### Validación de Requests
- Schemas Zod definidos en `src/validations/`
- Validados por middleware `validate(schema)` antes de llegar al controller
- Validan `body`, `params` y `query` según el schema

### Rutas Admin
- El router de admin es una función factory que recibe `chatService` como dependencia (para el broadcast)
- Toda ruta de admin aplica `validateSession + validateAdmin` a nivel de router

### Normalización de nombres de salas
- Los nombres de salas se normalizan (lowercase, sin acentos, sin caracteres especiales) para búsqueda y unicidad
- Campo `normalized_name` en DB con índice único
