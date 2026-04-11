# MedPlatform — Plataforma de Citas Médicas

Sistema de gestión de citas médicas basado en microservicios con frontend en Next.js.

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                     medical_network (Docker)                 │
│                                                              │
│  ┌─────────┐  ┌──────────┐  ┌─────────────┐  ┌──────────┐  │
│  │ ms-auth │  │ms-doctor │  │ms-appointment│  │ms-notif. │  │
│  │ NestJS  │  │Spring Boot│  │  FastAPI    │  │ FastAPI  │  │
│  │ :3001  │  │  :3002   │  │   :3003     │  │  :3004   │  │
│  └────┬────┘  └────┬─────┘  └──────┬──────┘  └────┬─────┘  │
│       │            │               │               │         │
│  ┌────┴────┐  ┌────┴─────┐  ┌─────┴──────┐  ┌────┴─────┐  │
│  │Postgres │  │ MongoDB  │  │  Postgres  │  │  Redis   │  │
│  │users_db │  │doctor_db │  │appoint._db │  │  Pub/Sub │  │
│  │  :5432  │  │ :27017   │  │   :5433    │  │  :6379   │  │
│  └─────────┘  └──────────┘  └────────────┘  └──────────┘  │
└──────────────────────────────────────────────────────────────┘
         ▲
    ┌────┴─────┐
    │ Frontend │  Next.js  :3000
    └──────────┘
```

---

## Puertos expuestos

| Servicio              | Puerto host | Descripción                         |
|-----------------------|-------------|-------------------------------------|
| **Frontend**          | `3000`      | Aplicación web Next.js              |
| **ms-auth**           | `3001`      | Autenticación JWT (NestJS)          |
| **ms-doctor**         | `3002`      | Perfiles médicos (Spring Boot)      |
| **ms-appointment**    | `3003`      | Citas médicas (FastAPI)             |
| **ms-notification**   | `3004`      | Notificaciones Redis (FastAPI)      |
| **PostgreSQL** (users)| `5432`      | BD de usuarios                      |
| **PostgreSQL** (apts) | `5433`      | BD de citas                        |
| **MongoDB**           | `27017`     | BD de perfiles médicos              |
| **Redis**             | `6379`      | Cola de eventos Pub/Sub             |

---

## Cómo correr el proyecto

### Opción 1 — Stack completo con Docker Compose (recomendado)

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd Taller_2_50

# 2. Levantar todos los servicios
docker compose up --build -d

# 3. Verificar que todo esté corriendo
docker compose ps

# 4. Abrir la aplicación
# → http://localhost:3000
```

Para ver los logs en tiempo real:
```bash
docker compose logs -f
```

Para detener todo:
```bash
docker compose down
```

---

### Opción 2 — Desarrollo frontend con hot-reload

Útil cuando se edita el frontend y se quiere ver los cambios de inmediato sin reconstruir la imagen.

```bash
# 1. Levantar los microservicios en background
docker compose up -d ms-auth ms-doctor ms-appointment ms-notification \
                     postgres-users postgres-appointments mongodb redis

# 2. En otra terminal, correr el frontend con hot-reload
cd frontend
npm install        # solo la primera vez
npm run dev

# → http://localhost:3000
```

---

## Base de datos — Esquema automático

> **No es necesario ejecutar scripts SQL manualmente.** Cada microservicio crea sus tablas/colecciones automáticamente al iniciar:

| Servicio        | Motor      | Mecanismo de creación                              |
|-----------------|------------|----------------------------------------------------|
| `ms-auth`       | PostgreSQL | TypeORM `synchronize: true` crea tablas            |
| `ms-doctor`     | MongoDB    | Spring Data MongoDB crea colecciones automáticamente|
| `ms-appointment`| PostgreSQL | SQLAlchemy `create_all()` crea tablas              |

Los datos persisten en volúmenes Docker nombrados (`pg_users_data`, `pg_appointments_data`, `mongo_data`, `redis_data`). Si quieres **limpiar los datos** y empezar de cero:

```bash
docker compose down -v   # -v elimina los volúmenes
docker compose up --build -d
```

---

## APIs disponibles (Swagger / Docs)

| Servicio         | Documentación                          |
|------------------|----------------------------------------|
| ms-auth          | http://localhost:3001/api              |
| ms-doctor        | http://localhost:3002/swagger-ui.html  |
| ms-appointment   | http://localhost:3003/docs             |

---

## Variables de entorno

Las variables de entorno ya están configuradas en `docker-compose.yml`. Para desarrollo local fuera de Docker, crear un archivo `.env` en cada microservicio siguiendo el template `.env.example` (si existe).

Variables importantes del frontend (`frontend/.env.local` para dev local):

```env
NEXT_PUBLIC_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_DOCTOR_URL=http://localhost:3002
NEXT_PUBLIC_APPOINTMENT_URL=http://localhost:3003
```

---

## Estructura del proyecto

```
Taller_2_50/
├── ms-auth/              # NestJS — Autenticación JWT + roles
├── ms-doctor/            # Spring Boot — Perfiles médicos
├── ms-appointment/       # FastAPI — Citas y disponibilidad
├── ms-notification/      # FastAPI — Notificaciones Redis Pub/Sub
├── frontend/             # Next.js — Interfaz de usuario
└── docker-compose.yml    # Orquestación completa
```

---

## Flujo de uso

### Como Paciente
1. Registrarse en `/register` (rol `PATIENT`)
2. Explorar médicos en `/doctors`
3. Seleccionar médico → agendar cita con fecha y hora disponible
4. Ver y cancelar citas en `/dashboard`

### Como Médico
1. Registrarse en `/register` (rol `DOCTOR`) o en `/register-doctor`
2. Agregar disponibilidad (fecha + hora de inicio/fin) en `/doctor/dashboard`
3. Ver citas agendadas con nombre del paciente y horario
4. Revisar historial completo en `/doctor/history`

---

## Requisitos previos

- [Docker](https://docs.docker.com/get-docker/) 20+
- [Docker Compose](https://docs.docker.com/compose/) v2+
- (Solo para dev local) Node.js 18+, npm 9+
