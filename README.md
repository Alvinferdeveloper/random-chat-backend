# ⚙️ ChatHub - High Performance Backend API

Este es el núcleo lógico de **ChatHub**, una API RESTful y de tiempo real construida para gestionar interacciones sociales dinámicas, persistencia de datos segura y comunicación instantánea.

![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![Prisma](https://img.shields.io/badge/Prisma-ORM-blue)
![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-blue)

---

## 🏗️ Arquitectura del Sistema

La API sigue un patrón de **Arquitectura en Capas (Layered Architecture)** para garantizar la separación de responsabilidades y la facilidad de testing:

- **Routes**: Definición de endpoints y aplicación de middlewares.
- **Controllers**: Manejo de la lógica de entrada/salida HTTP.
- **Services**: Capa de lógica de negocio pura (donde reside la "magia").
- **Repositories**: Abstracción de la base de datos utilizando **Prisma ORM**.
- **Validations**: Validación de esquemas y tipos de datos mediante **Zod**.
- **Middlewares**: Gestión de autenticación, manejo de errores y seguridad.

---

## 🛠️ Stack Tecnológico

- **Runtime**: Node.js con TypeScript para un desarrollo robusto y tipado.
- **Base de Datos**: MySQL (Relacional) para integridad de datos de usuarios y salas.
- **ORM**: Prisma para consultas eficientes y migraciones controladas.
- **Tiempo Real**: Socket.io para la gestión de túneles de comunicación bidireccional.
- **Caché y Scoring**: **Redis** para el seguimiento de actividad y ranking de salas.
- **Autenticación**: **Better Auth** con soporte para sesiones seguras.
- **Almacenamiento**: Integración con **Supabase Storage**.

---

## 🛡️ Implementaciones Destacadas

### 🔑 Gestión de Archivos Segura (Presigned URLs)
Para evitar que el servidor procese archivos pesados y exponer credenciales, implementamos un flujo de **URLs Pre-firmadas**:
1. El backend valida la sesión del usuario.
2. Genera un token de acceso temporal mediante el SDK de Supabase.
3. El cliente sube el archivo directamente, y el backend solo confirma el registro final en la base de datos.

### 📈 Algoritmo de Scoring (Redis)
Utilizamos **Redis** para gestionar la relevancia de las salas sin penalizar el rendimiento de la base de datos principal:
- Se registran interacciones atómicas (mensajes, ingresos).
- Redis calcula la "temperatura" de actividad de la sala.
- Esto permite que la lista de salas sea dinámica y siempre muestre lo más vibrante primero.

### 🔐 Seguridad y Validación
- **Mass Assignment Protection**: Whitelisting estricto en la capa de servicios para prevenir la modificación no autorizada de campos sensibles (como `ownerId` o `verified`).
- **Zod Validation**: Validación de tipos en tiempo de ejecución para todas las entradas de la API.
- **CORS & Rate Limiting**: Protecciones configuradas para evitar abusos y accesos no autorizados.

---

## 📂 Estructura de Carpetas

```text
random_chat_backend/
├── prisma/             # Esquemas y migraciones de base de datos
├── src/
│   ├── config/         # Configuraciones globales (env, constantes)
│   ├── controllers/    # Controladores de la API
│   ├── lib/            # Clientes de terceros (Redis, Supabase, Prisma)
│   ├── middlewares/    # Lógica de interceptación (Auth, Error handling)
│   ├── repositories/   # Consultas directas a DB
│   ├── services/       # Lógica de negocio core
│   ├── routes/         # Definición de rutas v1
│   ├── validations/    # Esquemas Zod
│   └── utils/          # Funciones de ayuda y clases de error
└── tests/              # Suites de pruebas (Jest)
```

---

## 🚀 Configuración e Instalación

1. **Variables de Env**:
   Configura tu archivo `.env`:
   ```env
   DATABASE_URL="mysql://user:pass@localhost:3306/chathub"
   REDIS_URL="redis://localhost:6379"
   SUPABASE_URL="your-project-url"
   SUPABASE_SERVICE_ROLE_KEY="your-key"
   BETTER_AUTH_SECRET="your-secret"
   ```

2. **Instalación**:
   ```bash
   npm install
   ```

3. **Base de Datos**:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Ejecución**:
   ```bash
   npm run dev
   ```

---

Desarrollado con precisión técnica para **ChatHub**.

---
*Para detalles sobre la interfaz de usuario, consulta el README en el repositorio del frontend.*
