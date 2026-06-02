# Manual de instalación y configuración

Este documento describe cómo instalar, configurar y ejecutar la plataforma "Encuentra a tu médico" en los modos de desarrollo local y Kubernetes con Istio.

---

## 1. Introducción

El proyecto está compuesto por:
- `frontend/`: aplicación Next.js.
- `ms-auth/`: microservicio de autenticación con NestJS y PostgreSQL.
- `ms-doctor/`: microservicio de perfiles médicos con Spring Boot y MongoDB.
- `ms-appointment/`: microservicio de agendamiento con FastAPI y PostgreSQL.
- `ms-notification/`: microservicio de notificaciones con FastAPI y Redis Pub/Sub.
- `k8s/`: manifests de Kubernetes e Istio para despliegue en Kind.
- `docker-compose.yml`: orquestación para desarrollo local.

---

## 2. Requisitos previos

### Requisitos comunes
- Docker 20+
- Docker Compose v2+
- Git

### Para frontend local o Docker Compose
- Node.js 18+
- npm 9+

### Para Kubernetes + Istio
- Kind
- kubectl
- istioctl
- Docker

### Para microservicios individuales
- Java 17 (para `ms-doctor`)
- Maven (para `ms-doctor`)
- Python 3.11+ (para `ms-appointment` y `ms-notification`)
- pip

---

## 3. Configuración del entorno

### 3.1 Variables obligatorias

El archivo raíz `.env` se usa para inyectar `SENDGRID_API_KEY` en `docker compose` y en otros comandos que carguen variables de entorno.

Ejemplo de `.env`:

```env
# Variables de entorno para docker-compose
# Reemplaza el valor de SENDGRID_API_KEY con tu API key real de SendGrid
SENDGRID_API_KEY=TU_SENDGRID_API_KEY_AQUI
```

> Atención: `ms-notification` usa `SENDGRID_API_KEY` en runtime. Si no configuras un valor válido, el servicio puede reportar errores de envío de correo.

### 3.2 Frontend

Crea el archivo `frontend/.env.local` con las URLs de los microservicios según el modo de ejecución.

#### Para Docker Compose local

```env
NEXT_PUBLIC_AUTH_URL=http://localhost:3001
NEXT_PUBLIC_DOCTOR_URL=http://localhost:3002
NEXT_PUBLIC_APPOINTMENT_URL=http://localhost:3003
NEXT_PUBLIC_NOMINATIM_EMAIL=tu-email@dominio.com
```

#### Para Kubernetes + Istio (Kind)

Crea `frontend/.env.k8s.local` con este contenido:

```env
NEXT_PUBLIC_AUTH_URL=http://localhost/auth
NEXT_PUBLIC_DOCTOR_URL=http://localhost/doctor
NEXT_PUBLIC_APPOINTMENT_URL=http://localhost/appointment
NEXT_PUBLIC_NOMINATIM_EMAIL=tu-email@dominio.com
```

Luego copia el archivo a `frontend/.env.local` antes de correr Next.js:

```powershell
cd frontend
copy .env.k8s.local .env.local
```

### 3.3 Variables de cada servicio

#### `ms-auth`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`

#### `ms-doctor`
- `MONGODB_URI`
- `MONGODB_DATABASE`
- `MS_AUTH_URL`
- `MS_APPOINTMENT_URL`

#### `ms-appointment`
- `DATABASE_URL`
- `REDIS_URL`

#### `ms-notification`
- `REDIS_URL`
- `SENDGRID_API_KEY`

---

## 4. Ejecución en desarrollo local con Docker Compose

### 4.1 Preparar los archivos

1. Crea el archivo raíz `.env` con tu clave de SendGrid.
2. Crea `frontend/.env.local` con las URLs de `docker compose`.

### 4.2 Levantar la plataforma

```powershell
docker compose up --build -d
```

### 4.3 Verificar estado

```powershell
docker compose ps
```

### 4.4 Abrir la aplicación

- Frontend: `http://localhost:3000`

### 4.5 Logs

```powershell
docker compose logs -f
```

### 4.6 Detener la plataforma

```powershell
docker compose down
```

---

## 5. Ejecución con Kubernetes + Istio en Kind

### 5.1 Preparar el cluster

```powershell
.
\k8s\scripts\01-create-cluster.ps1
```

### 5.2 Instalar Istio

```powershell
.
\k8s\scripts\02-install-istio.ps1
```

### 5.3 Construir y cargar imágenes

```powershell
.
\k8s\scripts\03-build-and-load-images.ps1
```

### 5.4 Aplicar recursos

```powershell
.
\k8s\scripts\04-apply-all.ps1
```

### 5.5 Puertos y observabilidad

```powershell
.
\k8s\scripts\05-port-forwards.ps1
```

### 5.6 Frontend en modo desarrollo

```powershell
cd frontend
copy .env.k8s.local .env.local
npm install
npm run dev
```

Accede al frontend en `http://localhost:3000`.

### 5.7 URLs importantes

- API vía Istio Ingress: `http://localhost`
- Kiali: `http://localhost:20001`
- Grafana: `http://localhost:3030`
- Jaeger: `http://localhost:16686`
- Prometheus: `http://localhost:9090`

---

## 6. Desarrollo híbrido: frontend local + backend en Docker

1. Levanta los servicios backend con Docker Compose:

```powershell
docker compose up -d ms-auth ms-doctor ms-appointment ms-notification postgres-users postgres-appointments mongodb redis
```

2. En otra terminal:

```powershell
cd frontend
npm install
npm run dev
```

3. Abre `http://localhost:3000`.

---

## 7. Ejecutar servicios individualmente

### 7.1 `ms-auth`

```powershell
cd ms-auth
npm install
npm run start:dev
```

### 7.2 `ms-doctor`

```powershell
cd ms-doctor
mvn spring-boot:run
```

### 7.3 `ms-appointment`

```powershell
cd ms-appointment
python -m pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 3003
```

### 7.4 `ms-notification`

```powershell
cd ms-notification
python -m pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 3004
```

---

## 8. Endpoints importantes

- Frontend: `http://localhost:3000`
- `ms-auth` API local: `http://localhost:3001`
- `ms-doctor` Swagger: `http://localhost:3002/swagger-ui.html`
- `ms-appointment` docs: `http://localhost:3003/docs`
- `ms-notification` health: `http://localhost:3004/health`

---

## 9. Consejos adicionales

- Si trabajas en Windows y usas PowerShell, ejecuta los scripts `.ps1` desde una terminal con permisos suficientes.
- Si el correo no es necesario para tu prueba local, usa una API key de prueba o un valor placeholder seguro en `.env`.
- Para cambios en el frontend, reinicia `npm run dev` si no recoge variables nuevas automáticamente.
- Para ver la comunicación entre microservicios en Kubernetes, usa Kiali y Jaeger.
