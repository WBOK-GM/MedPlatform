# Encuentra a tu medico — Plataforma de Citas Médicas

Sistema de gestión de citas médicas basado en microservicios con frontend en Next.js.  
Arquitectura: **DDD + Hexagonal + Service Mesh (Istio)** sobre Kubernetes.

---

## Arquitectura

### Modo desarrollo local (docker-compose)
```
[Frontend :3000]
      │ HTTP directo a cada micro
      ▼
  ms-auth :3001   ms-doctor :3002   ms-appointment :3003   ms-notification :3004
      │                                    │                       ▲
  Postgres                           Postgres + Redis Pub ────────┘
  users_db                           appoint._db
                   MongoDB
                   doctors_db
```

### Modo Kubernetes + Istio Service Mesh
```
[Frontend (dev local)]
      │ http://localhost/auth|/doctor|/appointment
      ▼
[Istio Ingress Gateway :80 (Kind NodePort 30080)]
      │ VirtualService: path rewrite + retries + timeout
      ▼
┌─────────────────────────── namespace: medplatform ──────────────────────────┐
│   ┌──────────┐  mTLS   ┌──────────┐  mTLS   ┌────────────┐  mTLS           │
│   │ ms-auth  │◄───────►│ ms-doctor│◄───────►│ms-appointment│◄──────────►   │
│   │[Envoy]   │         │ [Envoy]  │         │  [Envoy]    │  ms-notification│
│   └──────────┘         └──────────┘         └──────┬──────┘  [Envoy]        │
│   Istio Control Plane (istiod): mTLS certs,         │                        │
│   service discovery, telemetría                     │                        │
└─────────────────────────────────────────────────────┼────────────────────────┘
                                                       │ Redis Pub/Sub (TCP, sin mesh)
┌─────────────────────────── namespace: medplatform-data ─────────────────────┐
│   postgres-users   postgres-appointments   mongodb   redis (sin sidecar)     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Mapeo de comunicación entre microservicios

| Origen | Destino | Protocolo | Endpoint / Channel | Tipo |
|---|---|---|---|---|
| Frontend | Istio Ingress | HTTP | `/auth/**`, `/doctor/**`, `/appointment/**` | Síncrono |
| Istio Ingress | ms-auth | HTTP/mTLS | `/auth` → `:3001` | Síncrono |
| Istio Ingress | ms-doctor | HTTP/mTLS | `/doctor` → `/doctors` `:3002` | Síncrono |
| Istio Ingress | ms-appointment | HTTP/mTLS | `/appointment` → `:3003` | Síncrono |
| ms-appointment | Redis | TCP Pub/Sub | `appointment:created`, `appointment:cancelled` | Asíncrono |
| ms-notification | Redis | TCP Pub/Sub | subscriber de los 2 canales | Asíncrono |
| ms-doctor | ms-auth / ms-appointment | HTTP/mTLS | `MS_AUTH_URL`, `MS_APPOINTMENT_URL` | Configurado (no activo) |

---

## Cómo correr el proyecto

### Opción 1 — Kubernetes + Istio Service Mesh (producción / sustentación)

**Prerrequisitos**: `kind`, `kubectl`, `istioctl`, `docker`.

```powershell
# Paso 1 — Crear cluster Kind con puertos 80/443 expuestos al host
.\k8s\scripts\01-create-cluster.ps1

# Paso 2 — Instalar Istio + addons de observabilidad (Kiali, Grafana, Jaeger, Prometheus)
.\k8s\scripts\02-install-istio.ps1

# Paso 3 — Construir imágenes Docker y cargarlas en el cluster Kind
.\k8s\scripts\03-build-and-load-images.ps1

# Paso 4 — Aplicar todos los manifests (BDs, micros, Istio resources)
.\k8s\scripts\04-apply-all.ps1

# Paso 5 — Abrir dashboards de observabilidad
.\k8s\scripts\05-port-forwards.ps1

# Abrir el frontend con las URLs del Istio Ingress (puerto 80)
cd frontend
copy .env.k8s.local .env.local   # URLs apuntan a http://localhost/...
npm run dev
# → http://localhost:3000
```

**URLs tras el despliegue:**
- API (vía Istio Ingress): `http://localhost`
- Kiali (mapa del mesh): `http://localhost:20001`
- Grafana (métricas): `http://localhost:3030` (port-forward — 3000 lo usa el frontend Next.js)
- Jaeger (trazas): `http://localhost:16686`
- Prometheus: `http://localhost:9090`

---

### Opción 2 — Stack completo con Docker Compose (desarrollo local)

```bash
# 1. Levantar todos los servicios (sin Eureka ni ms-gateway, ya eliminados)
docker compose up --build -d

# 2. Verificar que todo esté corriendo
docker compose ps

# 3. Abrir la aplicación
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

### Opción 3 — Desarrollo frontend con hot-reload

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

## Service Mesh — Istio

### Recursos desplegados

| CRD | Archivo | Propósito |
|---|---|---|
| `PeerAuthentication` | `40-istio/peerauthentication-strict.yaml` | mTLS STRICT en todo el namespace `medplatform` |
| `Gateway` | `40-istio/gateway.yaml` | Punto de entrada HTTP en puerto 80 |
| `VirtualService` (ingress) | `40-istio/virtualservice-ingress.yaml` | Ruteo externo: `/auth`, `/doctor`, `/appointment`, `/notification` con rewrite + retries |
| `VirtualService` (internos) | `40-istio/virtualservices-internal.yaml` | Retries, timeouts y fault injection para tráfico east-west |
| `DestinationRule` (x4) | `40-istio/destinationrules.yaml` | mTLS ISTIO_MUTUAL + circuit breaker (outlierDetection) por servicio |
| `AuthorizationPolicy` (x4) | `40-istio/authorizationpolicy.yaml` | Control de acceso por service account |

### Demos para la sustentación

```powershell
# 1. mTLS STRICT — verificar que el tráfico entre micros usa mTLS
istioctl authn tls-check $(kubectl get pod -n medplatform -l app=ms-auth -o jsonpath='{.items[0].metadata.name}').medplatform ms-doctor.medplatform.svc.cluster.local
# → Esperar: STATUS=OK, MODE=STRICT

# 2. Fault injection — delay de 5s al 100% del tráfico a ms-appointment
.\k8s\scripts\06-demo-fault.ps1 -Action inject-delay -Service ms-appointment
# Hacer requests y ver latencia en Jaeger (http://localhost:16686)
# Revertir:
.\k8s\scripts\06-demo-fault.ps1 -Action revert -Service ms-appointment

# 3. Retries — abortar 50% del tráfico y ver que los retries compensan
.\k8s\scripts\06-demo-fault.ps1 -Action inject-abort -Service ms-doctor
# Ver en Kiali: request rate OK pese a 50% abort (http://localhost:20001)
.\k8s\scripts\06-demo-fault.ps1 -Action revert -Service ms-doctor

# 4. Circuit breaker — bombardear con fortio y ver eyección en stats Envoy
kubectl run fortio --image=fortio/fortio -n medplatform --restart=Never -- load -c 20 -qps 0 -t 30s http://ms-doctor:3002/doctors
kubectl exec -n medplatform deploy/ms-doctor -c istio-proxy -- curl -s localhost:15000/stats | grep "outlier_detection.ejections_active"

# 5. Trazas distribuidas — hacer un POST de cita y ver el trace en Jaeger
# http://localhost:16686 → Service: ms-appointment.medplatform → Find Traces
```

---

## Base de datos — Esquema automático

> **No es necesario ejecutar scripts SQL manualmente.** Cada microservicio crea sus tablas/colecciones automáticamente al iniciar:

| Servicio        | Motor      | Mecanismo de creación                              |
|-----------------|------------|----------------------------------------------------|
| `ms-auth`       | PostgreSQL | TypeORM `synchronize: true` crea tablas            |
| `ms-doctor`     | MongoDB    | Spring Data MongoDB crea colecciones automáticamente|
| `ms-appointment`| PostgreSQL | SQLAlchemy `create_all()` crea tablas              |

---

## APIs disponibles (Swagger / Docs)

| Servicio         | Docker Compose | Kubernetes (via Ingress) |
|------------------|----------------|--------------------------|
| ms-auth          | http://localhost:3001/api | http://localhost/auth/api |
| ms-doctor        | http://localhost:3002/swagger-ui.html | http://localhost/doctor/swagger-ui.html |
| ms-appointment   | http://localhost:3003/docs | http://localhost/appointment/docs |

---

## Estructura del proyecto

```
MedPlatform/
├── ms-auth/              # NestJS — Autenticación JWT + roles (DDD + Hexagonal)
├── ms-doctor/            # Spring Boot — Perfiles médicos (DDD + Hexagonal)
├── ms-appointment/       # FastAPI — Citas y disponibilidad (DDD + Hexagonal)
├── ms-notification/      # FastAPI — Notificaciones Redis Pub/Sub
├── frontend/             # Next.js — Interfaz de usuario
│   ├── .env.local        # URLs para docker-compose (desarrollo local)
│   └── .env.k8s.local    # URLs para Kubernetes + Istio (copiar como .env.local)
├── k8s/                  # Manifests Kubernetes + recursos Istio
│   ├── kind/             # Configuración del cluster Kind (3 nodos, NodePort 80/443)
│   ├── 00-namespace/     # Namespaces: medplatform (mesh) y medplatform-data (sin mesh)
│   ├── 10-secrets-config/# Secrets y ConfigMaps (BDs, JWT, SendGrid)
│   ├── 20-data/          # StatefulSets para Postgres x2, MongoDB + Deployment Redis
│   ├── 30-apps/          # Deployments de los 4 microservicios (replicas:2, probes)
│   ├── 40-istio/         # Gateway, VirtualServices, DestinationRules, PeerAuthentication
│   ├── 50-observability/ # Instrucciones de los addons Istio (Kiali, Grafana, Jaeger)
│   └── scripts/          # Scripts PowerShell de despliegue y demos de resiliencia
├── docker-compose.yml    # Orquestación para desarrollo local (sin Eureka/ms-Gateway)
└── plan.md               # Plan detallado de la implementación del Service Mesh
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
- **Para K8s + Istio:** `kind`, `kubectl`, `istioctl` en PATH
- (Solo para dev local) Node.js 18+, npm 9+
