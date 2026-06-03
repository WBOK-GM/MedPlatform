# Plan: Documentación Swagger/OpenAPI de los 4 microservicios + exposición vía Istio Ingress

## Contexto

MedPlatform corre en Kubernetes (Kind) + Istio con 4 microservicios heterogéneos (NestJS, Spring Boot, FastAPI x2) en arquitectura hexagonal + DDD, ya migrados a un event bus Kafka. Falta una pieza de **calidad/entrega académica**: documentación de API navegable por endpoint.

La buena noticia es que **la infraestructura Swagger ya está casi toda montada** — el trabajo es enriquecer el contenido y hacer las UIs accesibles desde el Ingress, no instalar desde cero:

- **ms-auth**: `@nestjs/swagger` 7.3.1 instalado, UI en `/api`, ya hay `@ApiTags`/`@ApiOperation`.
- **ms-doctor**: `springdoc-openapi` 2.3.0 en `pom.xml`, `springdoc` configurado en `application.yml`, ya hay `@Tag`/`@Operation` en los 9 endpoints.
- **ms-appointment / ms-notification**: FastAPI auto-genera `/docs` y `/openapi.json`; ya tienen `title`/`description`.

**Decisiones del usuario:**
1. **Profundidad = Intermedia**: `summary` + `description` (en español) por endpoint y descripciones de campos en cada DTO/schema. Sin documentar exhaustivamente todos los códigos de error ni ejemplos por campo.
2. **Acceso = Exponer vía Ingress**: cada Swagger UI accesible por `http://localhost/<servicio>/...`.

**Resultado esperado:** cada microservicio expone su Swagger UI navegable a través del Ingress, con todos los endpoints descritos y los campos de los DTOs explicados.

## Esquema de exposición vía Ingress (clave del plan)

El reto: el VirtualService de Istio reescribe prefijos distinto por servicio. La solución se adapta a cada framework — **solo ms-doctor requiere editar el VirtualService**.

| Servicio | Ruta Istio actual | UI accesible en | Mecanismo |
|---|---|---|---|
| ms-auth | `/auth` (sin rewrite, pasa intacto) | `http://localhost/auth/docs` | Montar Swagger en `auth/docs` (queda bajo el prefijo `/auth`). Sin tocar VirtualService. |
| ms-appointment | `/appointment/` → rewrite `/` | `http://localhost/appointment/docs` | `FastAPI(root_path="/appointment")`. Sin tocar VirtualService. |
| ms-notification | `/notification/` → rewrite `/` | `http://localhost/notification/docs` | `FastAPI(root_path="/notification")`. Sin tocar VirtualService. |
| ms-doctor | `/doctor/` → rewrite `/` | `http://localhost/doctor/swagger-ui.html` | `X-Forwarded-Prefix: /doctor` + `server.forward-headers-strategy: framework`. **Edita VirtualService.** |

**Por qué funciona cada uno:**
- **FastAPI `root_path`**: tras el rewrite la app recibe `/docs` y `/openapi.json`; `root_path` solo prefija las URLs que la UI genera (`/appointment/openapi.json`), que el browser re-pide y el Ingress vuelve a reescribir. No afecta el matching de rutas reales (la app sigue sirviendo `/appointments`). Leer de env `ROOT_PATH` (default `""`) deja docker-compose sirviendo docs en la raíz sin cambios.
- **ms-auth**: como `/auth` pasa intacto, montar la UI en `auth/docs` la hace alcanzable; el JSON queda en `/auth/docs-json` (también bajo `/auth`).
- **ms-doctor / springdoc**: con `X-Forwarded-Prefix: /doctor` y `forward-headers-strategy: framework`, springdoc prefija el redirect de swagger-ui, el `configUrl` y la URL de `api-docs` con `/doctor`. El browser pide `/doctor/swagger-ui/...` y `/doctor/api-docs`, que el rewrite a `/` resuelve a los paths reales que springdoc sirve. No se cambia el context-path (controllers `/doctors` y readiness probe `/doctors?page=0&size=1` quedan intactos; ms-doctor no tiene llamadores internos).

## Cambios por microservicio

### ms-auth (NestJS) — `summary`/`description` + `@ApiProperty`
- [ms-auth/src/main.ts](ms-auth/src/main.ts): cambiar `SwaggerModule.setup('api', ...)` → `SwaggerModule.setup('auth/docs', ...)`. Mantener `addBearerAuth`.
- [ms-auth/src/auth/infrastructure/http/auth.controller.ts](ms-auth/src/auth/infrastructure/http/auth.controller.ts): a cada endpoint, completar `@ApiOperation({ summary, description })` y añadir la respuesta tipada principal (`@ApiOkResponse`/`@ApiCreatedResponse` con `type: UserView`/`AuthTokenView`). Los 4 endpoints: `POST /auth/register`, `POST /auth/login`, `GET /auth/users/:id`, `GET /auth/validate-token`.
- DTOs de request — añadir `@ApiProperty({ description, example })` a cada campo:
  - [ms-auth/src/auth/infrastructure/http/dto/register.dto.ts](ms-auth/src/auth/infrastructure/http/dto/register.dto.ts) (`email`, `password`, `name`, `role?`)
  - [ms-auth/src/auth/infrastructure/http/dto/login.dto.ts](ms-auth/src/auth/infrastructure/http/dto/login.dto.ts) (`email`, `password`)
- Views de response — añadir `@ApiProperty` a las propiedades para que aparezcan en el schema:
  - [ms-auth/src/auth/application/views/user.view.ts](ms-auth/src/auth/application/views/user.view.ts), [ms-auth/src/auth/application/views/auth-token.view.ts](ms-auth/src/auth/application/views/auth-token.view.ts)

### ms-appointment (FastAPI) — `root_path` + `summary`/`description` + `Field`
- [ms-appointment/main.py](ms-appointment/main.py): `import os`; `FastAPI(title=..., description=..., version="1.0.0", root_path=os.getenv("ROOT_PATH", ""))`.
- [ms-appointment/app/infrastructure/api/appointments_router.py](ms-appointment/app/infrastructure/api/appointments_router.py) y [schedules_router.py](ms-appointment/app/infrastructure/api/schedules_router.py): a cada decorador de ruta añadir `summary=`, `description=` y `status_code=201` en los POST de creación (los 10 endpoints: 7 appointments + 3 schedules).
- [ms-appointment/app/infrastructure/api/schemas.py](ms-appointment/app/infrastructure/api/schemas.py): añadir `Field(..., description="...")` a los campos de los modelos de request/response (`AppointmentCreate`, `AppointmentResponse`, `TimeBlockCreate`, `TimeBlockResponse`, `AppointmentStatusUpdate`, `AppointmentNotesUpdate`).

### ms-notification (FastAPI) — `root_path` + pulir `/health` + documentar eventos
- [ms-notification/main.py](ms-notification/main.py): `root_path=os.getenv("ROOT_PATH", "")`, `version="1.0.0"`. Ampliar el `description=` de `FastAPI(...)` con una nota markdown de que es event-driven y lista los eventos Kafka consumidos (`appointment.created`, `appointment.cancelled`, `user.registered`). Añadir `summary`/`description`/`tags=["Health"]` y un `response_model` simple al `GET /health`.

### ms-doctor (Spring Boot) — `@Schema` + `description` + reverse-proxy
- [ms-doctor/src/main/resources/application.yml](ms-doctor/src/main/resources/application.yml): añadir bajo `server:` la clave `forward-headers-strategy: framework`.
- DTOs — añadir `@Schema(description=..., example=...)` a los campos:
  - `infrastructure/web/dto/DoctorRequestDTO.java`, `ReviewRequestDTO.java`, `embedded/LocationRequest.java`.
- Controllers — completar `@Operation(summary=, description=)` y añadir `@Parameter(description=)` a `@PathVariable`/`@RequestParam`:
  - `infrastructure/web/controller/DoctorController.java` (6 endpoints), `ReviewController.java` (3 endpoints).
- Nuevo `infrastructure/config/OpenApiConfig.java`: `@Configuration` con un `@Bean OpenAPI` (info: título "Doctor Microservice", versión, descripción). Mantiene consistencia con los otros servicios.

## Cambios de infraestructura

- [k8s/40-istio/virtualservice-ingress.yaml](k8s/40-istio/virtualservice-ingress.yaml): en la ruta `/doctor/`, añadir inyección de header de request:
  ```yaml
  headers:
    request:
      set:
        x-forwarded-prefix: /doctor
  ```
- [k8s/30-apps/ms-appointment.yaml](k8s/30-apps/ms-appointment.yaml): añadir al `env:` `- name: ROOT_PATH` / `value: "/appointment"`.
- [k8s/30-apps/ms-notification.yaml](k8s/30-apps/ms-notification.yaml): añadir `- name: ROOT_PATH` / `value: "/notification"`.
- (auth y doctor no necesitan env nuevo.) docker-compose.yml no requiere cambios: sin `ROOT_PATH`, FastAPI sirve docs en la raíz y ms-auth en `:3001/auth/docs`.

## Rebuild y despliegue

Reconstruir las 4 imágenes (cambios de código en todos), recargar en Kind y reiniciar:
```powershell
# por servicio: docker build → kind load → rollout restart
kubectl apply -f k8s/40-istio/virtualservice-ingress.yaml
kubectl apply -f k8s/30-apps/ms-appointment.yaml -f k8s/30-apps/ms-notification.yaml
kubectl rollout restart deploy/ms-auth deploy/ms-doctor deploy/ms-appointment deploy/ms-notification -n medplatform
```

## Verificación

Con el cluster arriba, abrir en el navegador:
- `http://localhost/auth/docs` — UI de ms-auth con los 4 endpoints descritos y schemas de Register/Login/UserView.
- `http://localhost/doctor/swagger-ui.html` — UI de ms-doctor; los 9 endpoints con `description` y los DTOs con `@Schema`. Confirmar que la spec carga (no 404 en `api-docs`).
- `http://localhost/appointment/docs` — UI de ms-appointment; los 10 endpoints con summary/description; confirmar que `openapi.json` carga (prueba del `root_path`).
- `http://localhost/notification/docs` — UI de ms-notification con `/health` documentado y la descripción de eventos Kafka.

Comprobaciones puntuales:
- Probar un endpoint desde la propia UI (p. ej. `GET /auth/users/{id}`) para confirmar que el "Try it out" pega bien contra el Ingress.
- Fallback si springdoc no resolviera el prefijo: `kubectl port-forward svc/ms-doctor 3002:3002 -n medplatform` → `http://localhost:3002/swagger-ui.html`.
- Local (docker-compose): `http://localhost:3001/auth/docs`, `http://localhost:3002/swagger-ui.html`, `http://localhost:3003/docs`, `http://localhost:3004/docs`.

## Archivos

- **Editar (código):** `ms-auth/src/main.ts`, `auth.controller.ts`, 2 DTOs, 2 views; `ms-appointment/main.py`, 2 routers, `schemas.py`; `ms-notification/main.py`; `ms-doctor/.../application.yml`, 3 DTOs, 2 controllers.
- **Nuevo:** `ms-doctor/.../infrastructure/config/OpenApiConfig.java`.
- **Editar (infra):** `k8s/40-istio/virtualservice-ingress.yaml`, `k8s/30-apps/ms-appointment.yaml`, `k8s/30-apps/ms-notification.yaml`.
