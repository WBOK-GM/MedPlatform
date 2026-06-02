# Plan: Implementación de Service Mesh con Istio sobre MedPlatform

## Contexto

MedPlatform es una plataforma universitaria de citas médicas con 4 microservicios heterogéneos (NestJS, Spring Boot, FastAPI) ya convertidos a DDD + Arquitectura Hexagonal en la iteración anterior. Como parte del segundo corte de Software II, el grupo eligió **Service Mesh** entre las arquitecturas adicionales a implementar. La especificación del ingeniero exige:

- Sidecar proxy (Envoy) interceptando el tráfico
- Data plane + Control plane separados
- mTLS entre servicios
- Observabilidad (métricas, logs, trazas distribuidas)
- Resiliencia (retries, timeouts, circuit breakers)
- Control de tráfico con reglas de enrutamiento
- Descubrimiento automático de servicios
- Separación de lógica de negocio y de comunicación (ya parcialmente cumplido por hexagonal)

**Esta iteración** migra MedPlatform de `docker-compose` a **Kubernetes (Kind)** con **Istio Service Mesh**, eliminando Eureka y `ms-gateway` (reemplazados por K8s DNS + Istio Ingress Gateway), conservando los stacks de aplicación y la persistencia.

**Resultado esperado:** stack corriendo en Kind con los 4 microservicios + DBs + Redis, todos los flujos del frontend funcionando contra el Istio Ingress, mTLS STRICT activo entre micros, métricas y trazas visibles en Kiali / Grafana / Jaeger / Prometheus, y demos preparadas para retries / timeouts / circuit breaker / fault injection.

---

## Decisiones tomadas con el usuario

| Decisión | Elección |
|---|---|
| Distribución K8s | **Kind** (Kubernetes in Docker) |
| Eureka | **Eliminar completamente** — K8s DNS + Istio service discovery lo reemplazan |
| ms-gateway | **Eliminar** — Istio Ingress Gateway lo reemplaza |
| Observabilidad | **Kiali + Prometheus + Grafana + Jaeger** (stack completo, addons oficiales) |
| Redis | **Fuera del mesh** — Pub/Sub TCP no se beneficia de mTLS Istio sin complejidad extra |
| DBs (Postgres x2, Mongo) | **Dentro del cluster** (StatefulSets + PVCs) pero **fuera del mesh** |
| Resiliencia | Implementar las **4 demos**: retries 5xx, timeouts, circuit breaker (outlierDetection), fault injection |

---

## Mapeo de comunicación entre microservicios (a documentar en README)

| Origen | Destino | Protocolo | Endpoint / Channel | Estado actual |
|---|---|---|---|---|
| Frontend | `ms-gateway:8080` | HTTP | `/auth/**`, `/doctor/**`, `/appointment/**` | Activo |
| `ms-gateway` | `ms-auth/doctor/appointment/notification` | HTTP vía Eureka `lb://` | Ruteo path-based | Activo |
| `ms-appointment` | Redis | TCP Pub/Sub | `appointment:created`, `appointment:cancelled` | Activo (async) |
| `ms-notification` | Redis | TCP Pub/Sub | subscriber de los 2 canales | Activo (async) |
| `ms-doctor` | `ms-auth`, `ms-appointment` | HTTP | `MS_AUTH_URL`, `MS_APPOINTMENT_URL` | **Configurado pero no usado** |
| Todos los micros | `ms-eureka:8761` | HTTP | `/eureka/apps` registration + discovery | Activo |

**Tras la migración a Istio:**
- Frontend → **Istio Ingress Gateway** (puerto 80 en host, mapeado por Kind) → VirtualService → servicio K8s.
- Llamadas inter-servicio (si se activan en el futuro): pasan por el sidecar Envoy con mTLS automático.
- Redis Pub/Sub queda igual, sin sidecar.
- Eureka desaparece; descubrimiento por DNS (`ms-auth.medplatform.svc.cluster.local` o `ms-auth` en mismo namespace).

---

## Estructura de manifests

```
MedPlatform/
└── k8s/
    ├── kind/
    │   └── kind-config.yaml                # cluster 1 cp + 2 workers, extraPortMappings 80,443
    ├── 00-namespace/
    │   ├── namespace-medplatform.yaml      # label istio-injection=enabled
    │   └── namespace-data.yaml             # SIN label (BDs + Redis)
    ├── 10-secrets-config/
    │   ├── secret-postgres.yaml
    │   ├── secret-mongo.yaml
    │   ├── secret-jwt.yaml                 # JWT_SECRET de ms-auth
    │   ├── secret-sendgrid.yaml            # SENDGRID_API_KEY de ms-notification
    │   └── configmap-app.yaml              # MS_AUTH_URL, MS_APPOINTMENT_URL, REDIS_URL
    ├── 20-data/
    │   ├── postgres-users-sts.yaml         # StatefulSet + headless Service + PVC 5Gi
    │   ├── postgres-appointments-sts.yaml  # idem
    │   ├── mongodb-sts.yaml                # idem
    │   └── redis-deploy.yaml               # Deployment + Service (sin sidecar)
    ├── 30-apps/
    │   ├── ms-auth.yaml                    # Deployment (replicas:2) + Service
    │   ├── ms-doctor.yaml
    │   ├── ms-appointment.yaml
    │   └── ms-notification.yaml            # replicas:1 (consumer único de Redis)
    ├── 40-istio/
    │   ├── gateway.yaml                    # Gateway medplatform-gw :80
    │   ├── virtualservice-ingress.yaml     # routing externo + rewrite paths
    │   ├── peerauthentication-strict.yaml  # mTLS STRICT en namespace
    │   ├── destinationrules.yaml           # 4 DRs con ISTIO_MUTUAL + outlierDetection
    │   ├── virtualservices-internal.yaml   # retries + timeouts internos
    │   └── authorizationpolicy.yaml        # (opcional) allow-list inter-svc
    ├── 50-observability/
    │   └── README.md                       # comandos kubectl apply de addons Istio
    └── scripts/
        ├── 01-create-cluster.ps1
        ├── 02-install-istio.ps1
        ├── 03-build-and-load-images.ps1
        ├── 04-apply-all.ps1
        ├── 05-port-forwards.ps1            # kiali/grafana/jaeger/prometheus
        └── 06-demo-fault.ps1               # inyecta fault y revierte
```

---

## Cambios de código por microservicio (eliminar Eureka)

### ms-auth (NestJS)
- `package.json`: quitar `eureka-js-client`, `@types/eureka-js-client`.
- `src/main.ts`: borrar import `Eureka` y todo el bloque `new Eureka({...}) + eureka.start(...)`. Conservar solo `app.listen(...)`.
- Env irrelevantes: `EUREKA_HOST`, `EUREKA_PORT`.

### ms-doctor (Spring Boot)
- `pom.xml`: quitar `spring-cloud-starter-netflix-eureka-client`. Si Spring Cloud no se usa para nada más, quitar también el bloque `dependencyManagement` de `spring-cloud-dependencies`.
- `MsDoctorApplication.java`: quitar `@EnableDiscoveryClient`.
- `src/main/resources/application.yml`: borrar bloque `eureka:`. Mantener `ms-auth.internal-url` y `ms-appointment.internal-url` pero ahora apuntan a DNS K8s (`http://ms-auth:3001`, `http://ms-appointment:3003`).
- Env irrelevante: `EUREKA_URL`.

### ms-appointment (FastAPI)
- `requirements.txt`: quitar `py_eureka_client`.
- `app/infrastructure/discovery/eureka.py`: eliminar archivo (y carpeta `discovery/` si queda vacía).
- `main.py`: quitar import y la llamada `await register_with_eureka()` en `lifespan`.
- `app/config.py`: quitar `eureka_server` del `Settings`.
- Env irrelevante: `EUREKA_SERVER`.

### ms-notification (FastAPI)
- `requirements.txt`: quitar `py_eureka_client`.
- `main.py`: quitar import `py_eureka_client.eureka_client` y la llamada `eureka_client.init_async(...)` en `lifespan`.
- Env irrelevante: `EUREKA_SERVER`.

### Eliminar carpetas y limpiar compose
- Borrar `ms-eureka/` y `ms-gateway/`.
- En `docker-compose.yml`: quitar servicios `ms-eureka` y `ms-gateway` y todas las `depends_on` correspondientes. Docker-compose seguirá útil para dev sin K8s.

**Validación previa al deploy K8s**: `grep -r -i eureka` en cada repo no debe matchear nada.

---

## Manifests Kubernetes (patrón)

### Deployment + Service por microservicio (ejemplo ms-auth)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: ms-auth, namespace: medplatform }
spec:
  replicas: 2
  selector: { matchLabels: { app: ms-auth } }
  template:
    metadata:
      labels: { app: ms-auth, version: v1 }      # version requerido por Kiali
    spec:
      containers:
      - name: ms-auth
        image: medplatform/ms-auth:latest
        imagePullPolicy: IfNotPresent
        ports: [{ containerPort: 3001 }]
        envFrom:
          - configMapRef: { name: medplatform-config }
          - secretRef:    { name: jwt-secret }
        env:
          - name: DB_HOST
            value: postgres-users.medplatform-data.svc.cluster.local
          - name: DB_PASSWORD
            valueFrom: { secretKeyRef: { name: postgres-secret, key: password } }
        readinessProbe: { httpGet: { path: /api, port: 3001 }, initialDelaySeconds: 10 }
        livenessProbe:  { httpGet: { path: /api, port: 3001 }, initialDelaySeconds: 30 }
        resources:
          requests: { cpu: 100m, memory: 256Mi }
          limits:   { cpu: 500m, memory: 512Mi }
---
apiVersion: v1
kind: Service
metadata: { name: ms-auth, namespace: medplatform }
spec:
  selector: { app: ms-auth }
  ports:
  - name: http                                   # nombre 'http' obligatorio para que Istio haga L7
    port: 3001
    targetPort: 3001
```

**Probes por servicio**:
- ms-auth: `GET /api` (Swagger Nest responde 200).
- ms-doctor: `GET /actuator/health` añadiendo `spring-boot-starter-actuator`, o `/doctors?page=0&size=1`.
- ms-appointment: `GET /docs` (Swagger FastAPI) o `/appointments?limit=1`.
- ms-notification: `GET /health` (ya existe).

**StatefulSets DB**: namespace `medplatform-data` (sin label de inyección), PVC 5Gi cada uno, Service headless. Igual patrón para `postgres-users`, `postgres-appointments`, `mongodb`.

**Redis**: Deployment + Service en `medplatform-data`. La ausencia del label `istio-injection` ya garantiza que no se inyecta sidecar.

---

## Recursos Istio

### Namespace + mTLS STRICT

```yaml
# 00-namespace/namespace-medplatform.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: medplatform
  labels: { istio-injection: enabled }
---
# 40-istio/peerauthentication-strict.yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata: { name: default, namespace: medplatform }
spec: { mtls: { mode: STRICT } }
```

### Ingress Gateway + VirtualService externo (reemplaza ms-gateway)

```yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata: { name: medplatform-gw, namespace: medplatform }
spec:
  selector: { istio: ingressgateway }
  servers:
  - port: { number: 80, name: http, protocol: HTTP }
    hosts: ["*"]
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata: { name: medplatform-ingress, namespace: medplatform }
spec:
  hosts: ["*"]
  gateways: [medplatform-gw]
  http:
  - match: [{ uri: { prefix: /auth } }]
    rewrite: { uri: /auth }
    route: [{ destination: { host: ms-auth, port: { number: 3001 } } }]
  - match: [{ uri: { prefix: /doctor } }]
    rewrite: { uri: /doctors }                   # corrige el mismatch existente
    route: [{ destination: { host: ms-doctor, port: { number: 3002 } } }]
  - match: [{ uri: { prefix: /appointment } }]
    rewrite: { uri: / }                          # appointments expone rutas sin prefijo
    route: [{ destination: { host: ms-appointment, port: { number: 3003 } } }]
    timeout: 10s
    retries: { attempts: 3, perTryTimeout: 2s, retryOn: 5xx,reset,connect-failure }
```

> **Nota:** el frontend actualmente pega a `/doctor` y `/appointment`, pero los backends exponen `/doctors` y `/appointments`. El Spring Cloud Gateway viejo funcionaba "por casualidad" sin StripPrefix. Aquí se corrige con `rewrite` en el VirtualService.

### DestinationRule por servicio (mTLS interno + circuit breaker)

Patrón único, repetido para los 4 micros:

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata: { name: ms-doctor-dr, namespace: medplatform }
spec:
  host: ms-doctor
  trafficPolicy:
    tls: { mode: ISTIO_MUTUAL }
    connectionPool:
      tcp:  { maxConnections: 50 }
      http: { http1MaxPendingRequests: 20, maxRequestsPerConnection: 10 }
    outlierDetection:
      consecutive5xxErrors: 3
      interval: 10s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
```

Para DBs/Redis (que viven en `medplatform-data` sin sidecar) los micros llaman vía DNS sin que aplique DR; el sidecar deja pasar el tráfico TCP.

### VirtualService interno con retries + timeouts (1 por servicio)

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata: { name: ms-doctor-vs, namespace: medplatform }
spec:
  hosts: [ms-doctor]
  http:
  - timeout: 5s
    retries: { attempts: 3, perTryTimeout: 2s, retryOn: gateway-error,connect-failure,refused-stream,5xx }
    # fault: { delay: { percentage: { value: 30 }, fixedDelay: 5s } }  # para demo
    route: [{ destination: { host: ms-doctor } }]
```

### AuthorizationPolicy (opcional, refuerzo de demo)

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata: { name: ms-appointment-allow, namespace: medplatform }
spec:
  selector: { matchLabels: { app: ms-appointment } }
  rules:
  - from:
    - source: { principals:
        ["cluster.local/ns/istio-system/sa/istio-ingressgateway-service-account",
         "cluster.local/ns/medplatform/sa/default"] }
```

---

## Stack de observabilidad

Tras `istioctl install --set profile=demo --set meshConfig.defaultConfig.tracing.sampling=100 -y`:

```powershell
$ISTIO_REL = "release-1.22"
kubectl apply -f https://raw.githubusercontent.com/istio/istio/$ISTIO_REL/samples/addons/prometheus.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/$ISTIO_REL/samples/addons/grafana.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/$ISTIO_REL/samples/addons/jaeger.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/$ISTIO_REL/samples/addons/kiali.yaml
```

`scripts/05-port-forwards.ps1` levanta los 4 paneles en localhost:
- Kiali: 20001 → mapa del mesh + tráfico en tiempo real.
- Grafana: 3001 → dashboards Istio (mesh, service, workload).
- Jaeger: 16686 → trazas distribuidas.
- Prometheus: 9090 → métricas crudas.

Alternativa atajo: `istioctl dashboard kiali | grafana | jaeger`.

---

## Levantar Kind + Istio

`k8s/kind/kind-config.yaml`:

```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - { containerPort: 30080, hostPort: 80,  protocol: TCP }
  - { containerPort: 30443, hostPort: 443, protocol: TCP }
- role: worker
- role: worker
```

`scripts/01-create-cluster.ps1`:
```powershell
kind create cluster --name medplatform --config k8s/kind/kind-config.yaml
```

`scripts/02-install-istio.ps1`:
```powershell
istioctl install --set profile=demo --set meshConfig.defaultConfig.tracing.sampling=100 -y
kubectl patch svc istio-ingressgateway -n istio-system --type='json' -p='[
  {"op":"replace","path":"/spec/type","value":"NodePort"},
  {"op":"replace","path":"/spec/ports/1/nodePort","value":30080},
  {"op":"replace","path":"/spec/ports/2/nodePort","value":30443}
]'
```

`scripts/03-build-and-load-images.ps1`:
```powershell
docker build -t medplatform/ms-auth:latest        ./ms-auth
docker build -t medplatform/ms-doctor:latest      ./ms-doctor
docker build -t medplatform/ms-appointment:latest ./ms-appointment
docker build -t medplatform/ms-notification:latest ./ms-notification
kind load docker-image medplatform/ms-auth:latest medplatform/ms-doctor:latest `
                       medplatform/ms-appointment:latest medplatform/ms-notification:latest `
                       --name medplatform
```

`scripts/04-apply-all.ps1`:
```powershell
kubectl apply -f k8s/00-namespace/
kubectl apply -f k8s/10-secrets-config/
kubectl apply -f k8s/20-data/
kubectl rollout status sts/postgres-users        -n medplatform-data
kubectl rollout status sts/postgres-appointments -n medplatform-data
kubectl rollout status sts/mongodb               -n medplatform-data
kubectl apply -f k8s/30-apps/
kubectl rollout status deploy/ms-auth         -n medplatform
kubectl rollout status deploy/ms-doctor       -n medplatform
kubectl rollout status deploy/ms-appointment  -n medplatform
kubectl rollout status deploy/ms-notification -n medplatform
kubectl apply -f k8s/40-istio/
```

---

## Frontend

**Recomendación**: dejar el frontend **fuera del cluster** (sigue corriendo en `npm run dev` o un docker aparte). Razón: la sustentación se enfoca en el mesh; meter el frontend al cluster solo añadiría ruido al mapa Kiali.

Cambio en `.env.local` del frontend:
```
NEXT_PUBLIC_AUTH_URL=http://localhost/auth
NEXT_PUBLIC_DOCTOR_URL=http://localhost/doctor
NEXT_PUBLIC_APPOINTMENT_URL=http://localhost/appointment
```
(puerto 80 implícito, Kind mapea 80→30080 del NodePort del Ingress Gateway).

---

## Demos para sustentación

| Feature | Comando demo |
|---|---|
| **mTLS STRICT** | `istioctl authn tls-check <pod>.medplatform ms-auth.medplatform.svc.cluster.local` — esperar `STATUS=OK, MODE=STRICT`. |
| **Retries** | Aplicar VS con `fault.abort.percentage=50, httpStatus=503` y lanzar `curl` en loop. Ver `kubectl logs deploy/ms-auth -c istio-proxy \| Select-String retry`. |
| **Circuit breaker** | `kubectl run fortio --image=fortio/fortio -n medplatform -- load -c 20 -qps 0 -t 30s http://ms-doctor:3002/doctors` y `kubectl exec deploy/ms-doctor -c istio-proxy -- curl -s localhost:15000/stats \| Select-String outlier`. |
| **Trazas distribuidas** | Hacer POST `/auth/login`, GET `/doctor`, POST `/appointment`. Abrir Jaeger en `localhost:16686` y ver el trace cruzando los 4 micros. |
| **Mapa Kiali** | Localhost:20001 → Graph → namespace `medplatform` → Versioned app graph; mostrar request rate / errores / p99 por edge. |
| **Fault injection** | `scripts/06-demo-fault.ps1` aplica un VS con `fault.delay` 100% 5s sobre ms-appointment y luego lo revierte; mostrar en Jaeger el salto de latencia. |

---

## Documentar en README

Añadir al `README.md` raíz (o crear `docs/service-mesh.md`):

1. **Diagrama de comunicación**: el mapeo de la sección anterior + diagrama ASCII o draw.io del antes/después (Eureka + ms-gateway → Istio Ingress + DNS K8s + sidecars).
2. **Qué hace Istio**: una sección "Service Mesh" explicando cada feature con su recurso CRD (Gateway, VS, DR, PA, AP) y dónde está aplicado.
3. **Cómo levantar el stack**: bloque copy-paste con `scripts/01..05`.
4. **Demos**: tabla anterior reproducida con comandos.
5. **Troubleshooting**: errores comunes (sidecar no inyectado, mTLS rompe DB, 404 por rewrite mal hecho).

---

## Orden de ejecución

1. **Limpiar código Eureka** en los 4 micros (`ms-auth/src/main.ts`, `ms-doctor/MsDoctorApplication.java` + `application.yml`, `ms-appointment/main.py` + `config.py`, `ms-notification/main.py`). Verificar con `grep -ri eureka`.
2. **Eliminar** `ms-eureka/`, `ms-gateway/` y limpiar `docker-compose.yml`.
3. **Probar con docker-compose** que los 4 micros arrancan sin Eureka (golden path: register/login/search/createAppointment).
4. **Crear scripts y manifests** en `k8s/` siguiendo la estructura definida.
5. **Crear cluster Kind** (`scripts/01`).
6. **Instalar Istio + addons** (`scripts/02` + comandos de observabilidad).
7. **Construir y cargar imágenes** (`scripts/03`).
8. **Aplicar manifests** (`scripts/04`).
9. `kubectl get pods -n medplatform` — verificar `2/2 Running` por pod (app + istio-proxy).
10. `curl http://localhost/auth/login -d ...` → respuesta esperada (401 o 200).
11. Lanzar frontend con nuevas env vars y validar los flujos completos.
12. Probar mTLS, retries, circuit breaker, trazas, mapa Kiali (sección Demos).
13. Documentar todo en el README.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Bootstrap Eureka residual rompe arranque | `grep -ri eureka` antes de buildear; smoke-test en docker-compose |
| mTLS STRICT rompe llamadas a DB | `medplatform-data` SIN label `istio-injection` (verificar con `kubectl get ns --show-labels`) |
| Puerto sin nombre `http` cae a TCP | Todos los `Service.spec.ports[].name = http` |
| Mismatch `/doctor` vs `/doctors` da 404 | `rewrite` en VirtualService de ingress; validar con `curl -v http://localhost/doctor` |
| `ErrImagePull` en pods | `imagePullPolicy: IfNotPresent` + `kind load docker-image` script |
| Outlier ejecta todos los endpoints | `replicas: 2` mínimo y `maxEjectionPercent: 50` |
| `SENDGRID_API_KEY` vacío crashea ms-notification al primer mensaje | Inyectar como Secret real con valor placeholder si no se tiene |
| Trazas distribuidas no propagan | Verificar que los micros propaguen headers `x-request-id`, `x-b3-traceid`, etc. (Spring Boot lo hace nativo; NestJS y FastAPI requieren middleware si no aparecen spans correlacionados) |

---

## Verificación end-to-end

1. **Pods**: `kubectl get pods -n medplatform` → todos `2/2 Running`. `kubectl get pods -n medplatform-data` → todos `1/1 Running` (sin sidecar).
2. **mTLS**: `istioctl authn tls-check <pod>.medplatform ms-auth.medplatform.svc.cluster.local` muestra `MODE=STRICT`, `STATUS=OK`.
3. **Ingress**: `curl -v http://localhost/auth/login -H "Content-Type: application/json" -d '{...}'` responde JSON (no `connection refused`).
4. **Flujos del frontend** (con env actualizado): registro, login, búsqueda de doctor, creación y cancelación de cita.
5. **Eventos Redis** (sigue async): `kubectl logs deploy/ms-notification` muestra mensajes recibidos.
6. **Domain Events** (heredados de la iteración anterior): `kubectl logs deploy/ms-auth` muestra `user.registered`, `auth.login-succeeded`.
7. **Observabilidad**:
   - Kiali → grafo con 4 nodos backend + ingress + 3 nodos data (sin sidecar) y edges con request rate.
   - Jaeger → trace de un `createAppointment` mostrando span de ingress → ms-appointment → Redis.
   - Grafana → dashboards "Istio Mesh Dashboard", "Istio Service Dashboard" con datos.
8. **Resiliencia**:
   - Retries: aplicar VS con `fault.abort 50%`, verificar que el cliente externo ve menos errores que la tasa aplicada (gracias a retries internos).
   - Circuit breaker: `fortio` con 20 conexiones por 30s + verificar `outlier_detection.ejections_active > 0` en stats Envoy.
   - Fault injection: VS con `fault.delay 5s 100%`, Jaeger muestra latencia +5s y al revertir vuelve a normal.

---

## Archivos críticos a modificar

- [docker-compose.yml](docker-compose.yml) — eliminar `ms-eureka` y `ms-gateway`
- [ms-auth/src/main.ts](ms-auth/src/main.ts) — eliminar bloque Eureka
- [ms-auth/package.json](ms-auth/package.json) — quitar dep `eureka-js-client`
- [ms-doctor/src/main/java/com/encuentratumedico/msdoctor/MsDoctorApplication.java](ms-doctor/src/main/java/com/encuentratumedico/msdoctor/MsDoctorApplication.java) — quitar `@EnableDiscoveryClient`
- [ms-doctor/pom.xml](ms-doctor/pom.xml) — quitar dependencia Eureka
- [ms-doctor/src/main/resources/application.yml](ms-doctor/src/main/resources/application.yml) — borrar bloque `eureka:`
- [ms-appointment/main.py](ms-appointment/main.py) — quitar registro Eureka del lifespan
- [ms-appointment/app/infrastructure/discovery/eureka.py](ms-appointment/app/infrastructure/discovery/eureka.py) — eliminar
- [ms-appointment/app/config.py](ms-appointment/app/config.py) — quitar `eureka_server`
- [ms-appointment/requirements.txt](ms-appointment/requirements.txt) — quitar `py_eureka_client`
- [ms-notification/main.py](ms-notification/main.py) — quitar registro Eureka del lifespan
- [ms-notification/requirements.txt](ms-notification/requirements.txt) — quitar `py_eureka_client`
- Borrar carpetas: [ms-eureka/](ms-eureka/), [ms-gateway/](ms-gateway/)
- Crear toda la jerarquía nueva en `k8s/` descrita arriba
- [README.md](README.md) — añadir sección Service Mesh con diagrama, comandos y demos
