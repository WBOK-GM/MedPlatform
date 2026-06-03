# Plan: Implementación de EDA con Apache Kafka (Strimzi) como Event Bus

> Documento de implementación. Segunda arquitectura de MedPlatform (EDA) que complementa el Service Mesh con Istio ya existente.

## Contexto

MedPlatform ya corre en Kubernetes (Kind) + Istio Service Mesh con 4 microservicios heterogéneos (NestJS, Spring Boot, FastAPI x2) en arquitectura hexagonal + DDD. El **service mesh** cubre la comunicación síncrona norte-sur y este-oeste con mTLS, observabilidad y resiliencia.

Como **segunda arquitectura** exigida por el ingeniero, el grupo eligió **EDA (Event-Driven Architecture)** con un **event bus** que exponga los microservicios entre sí y a los usuarios. La especificación permite Kafka o RabbitMQ; se eligió **Apache Kafka**, desplegado con el **operador Strimzi**.

**Problema/necesidad concreta:** hoy la única mensajería asíncrona es **Redis Pub/Sub** entre `ms-appointment` → `ms-notification` (efímera, sin persistencia, sin replay, sin consumer groups). Los eventos de dominio de `ms-auth` y `ms-doctor` solo se loguean (`LoggingEventPublisher`), nunca salen del servicio. El objetivo es **migrar TODO a Kafka** y convertir el bus en un canal real cross-service con durabilidad y replay.

**Resultado esperado:** Kafka corriendo en el cluster (vía Strimzi, KRaft single-broker, fuera del mesh igual que Redis), los 4 microservicios publicando sus eventos de dominio a Kafka mediante adaptadores del puerto `EventPublisher` ya existente (sin tocar lógica de dominio), `ms-notification` consumiendo los topics relevantes vía consumer group, Redis eliminado, y el golden path (registro → email bienvenida; crear/cancelar cita → emails) funcionando contra Kafka. Demos de event bus listas (producir/consumir, ver lag, replay).

## Decisiones tomadas con el usuario

| Decisión | Elección |
|---|---|
| Redis vs Kafka | **Migrar todo a Kafka y eliminar Redis** (Kafka = único event bus) |
| Despliegue de Kafka | **Strimzi Operator** (CRDs `Kafka`, `KafkaNodePool`, `KafkaTopic`) |
| Cobertura de eventos | **Todos los eventos de dominio** (auth, doctor, appointment) + consumer cross-service en notification |
| Exposición "a usuarios" | **Email basta** (ms-notification con SendGrid); sin WebSocket/SSE |
| Versiones | **Strimzi 0.45.0 + Kafka 3.9.0** (KRaft GA, NodePools GA) |
| Topología topics | **Uno por agregado**: `auth-events`, `doctor-events`, `appointment-events` (3 particiones, 1 réplica) |
| Ubicación de Kafka | Namespace `medplatform-data`, **sin sidecar Istio** (igual que Redis) |

## Estado actual relevante (ya explorado)

Cada microservicio tiene el puerto `EventPublisher` abstraído — añadir Kafka es crear un adaptador, sin tocar dominio:

- **ms-auth** (NestJS): `EventPublisher` en `ms-auth/src/auth/domain/ports/out/event-publisher.ts`; única impl `LoggingEventPublisher`; registrada en `ms-auth/src/auth/auth.module.ts` (`{ provide: EVENT_PUBLISHER, useClass: ... }`). Eventos: `user.registered`, `auth.login-succeeded/failed`, `auth.credential-added`. `DomainEvent` con `occurredAt: Date`.
- **ms-doctor** (Spring Boot, paquete `com.encuentratumedico.msdoctor`, Java 17 / Spring Boot 3.2.5): `EventPublisherPort` en `domain/port/out/`; impl `LoggingEventPublisher` (`@Component`); **sin spring-kafka aún**. Eventos: `doctor.registered/profile-updated/rating-updated/image-added`, `review.submitted/moderated`. `DomainEvent.occurredAt()` = `Instant`.
- **ms-appointment** (FastAPI): `EventPublisherPort` con `publish_all(events, notification_payload=None)` **SÍNCRONO**, llamado dentro de un UoW síncrono; impl `RedisEventPublisher` (redis-py sync). Factory en `app/infrastructure/api/dependencies.py`, config `redis_url` en `app/config.py`.
- **ms-notification** (FastAPI, sin hexagonal): `main.py` con `blocking_redis_listener()` en hilo, despacha por **canal** Redis, envía email con SendGrid.

Infra: Redis en `k8s/20-data/redis-deploy.yaml` (medplatform-data, `sidecar.istio.io/inject: "false"`); ConfigMap `k8s/10-secrets-config/configmap-app.yaml`; apps en `k8s/30-apps/`; script `k8s/scripts/04-apply-all.ps1`.

## Convención de envelope (común a los 4 servicios)

JSON idéntico para que el consumer Python lo parsee uniforme. **Message key = `aggregateId`** (orden por agregado dentro de su partición).

```json
{
  "eventName": "appointment.created",
  "occurredAt": "2026-06-02T14:30:00.000Z",
  "aggregateId": "<uuid del agregado raíz>",
  "version": 1,
  "data": { "...campos del evento; appointment.created incluye patient_email/doctor_email" }
}
```

- `occurredAt`: ISO-8601 UTC (`Date.toISOString()` / `Instant.toString()` / `datetime.isoformat()`).
- `aggregateId`: userId / doctorId / appointmentId. Igual que la message key.
- Topic por servicio: auth→`auth-events`, doctor→`doctor-events`, appointment→`appointment-events`.

## Cambios de infraestructura (K8s)

### Archivos NUEVOS
- `k8s/15-strimzi/strimzi-cluster-operator-0.45.0.yaml` — bundle del operador de la release 0.45.0, con todas las apariciones de `namespace: myproject` reemplazadas por `namespace: medplatform-data` (vigila ese namespace).
- `k8s/20-data/kafka-cluster.yaml` — `KafkaNodePool` (rol combinado `controller`+`broker`, `replicas: 1`, `storage: persistent-claim 5Gi deleteClaim:true`, recursos acotados) + `Kafka` CR (`medplatform-kafka`, annotations `strimzi.io/node-pools: enabled` y `strimzi.io/kraft: enabled`, listener `plain` 9092 `tls:false`, todos los replication factors=1, `min.insync.replicas:1`, `auto.create.topics.enable:false`, `entityOperator.topicOperator: {}`).
- `k8s/20-data/kafka-topics.yaml` — 3 `KafkaTopic` (`auth-events`, `doctor-events`, `appointment-events`), `partitions: 3`, `replicas: 1`, retención 7 días.
- `k8s/40-istio/kafka-destinationrule.yaml` — 2 `DestinationRule` en namespace `medplatform` con `trafficPolicy.tls.mode: DISABLE` para el host bootstrap `medplatform-kafka-kafka-bootstrap.medplatform-data.svc.cluster.local` y para `*.medplatform-kafka-kafka-brokers.medplatform-data.svc.cluster.local` (evita que el sidecar intente originar mTLS hacia Kafka sin sidecar).

### Archivos a EDITAR
- `k8s/10-secrets-config/configmap-app.yaml`: añadir `KAFKA_BOOTSTRAP_SERVERS: "medplatform-kafka-kafka-bootstrap.medplatform-data.svc.cluster.local:9092"`; quitar `REDIS_URL`.
- `k8s/30-apps/ms-appointment.yaml` y `k8s/30-apps/ms-notification.yaml`: cambiar env `REDIS_URL` → `KAFKA_BOOTSTRAP_SERVERS` (configMapKeyRef). En notification, actualizar el comentario de `replicas: 1` (con consumer groups, escalar ya NO duplica; el tope útil = nº particiones = 3).
- `k8s/30-apps/ms-auth.yaml` y `k8s/30-apps/ms-doctor.yaml`: **añadir** env `KAFKA_BOOTSTRAP_SERVERS`.
- **Eliminar** `k8s/20-data/redis-deploy.yaml`.
- `k8s/scripts/04-apply-all.ps1`: insertar bloque Strimzi y `kubectl wait kafka Ready`; quitar `rollout status deploy/redis`.

### Orden de despliegue (crítico)
1. Namespaces → 2. Secrets+ConfigMap (ya con `KAFKA_BOOTSTRAP_SERVERS`) → 3. **Operador Strimzi + CRDs** (`kubectl rollout status deploy/strimzi-cluster-operator -n medplatform-data`) → 4. Datos (Postgres x2, Mongo, **kafka-cluster.yaml**) + `kubectl wait kafka/medplatform-kafka --for=condition=Ready --timeout=300s -n medplatform-data` → 5. **kafka-topics.yaml** (tras Ready) → 6. Apps (`30-apps`) → 7. Istio (`40-istio`, incl. DestinationRules de Kafka).

Snippet para `04-apply-all.ps1`:
```powershell
kubectl apply -f "$K8S\15-strimzi" -n medplatform-data
kubectl rollout status deploy/strimzi-cluster-operator -n medplatform-data --timeout=180s
# ...aplicar 20-data (incluye kafka-cluster.yaml)...
kubectl wait kafka/medplatform-kafka --for=condition=Ready --timeout=300s -n medplatform-data
kubectl apply -f "$K8S\20-data\kafka-topics.yaml"
```

### docker-compose.yml (dev local)
Reemplazar servicio `redis` por `apache/kafka:3.9.0` (KRaft single-broker: `KAFKA_PROCESS_ROLES=broker,controller`, listeners PLAINTEXT 9092 + CONTROLLER 9093, `KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092`, replication factors=1). Cambiar `REDIS_URL=...` → `KAFKA_BOOTSTRAP_SERVERS=kafka:9092` en appointment/notification y añadirlo a auth/doctor. Cambiar `depends_on`. Quitar volumen `redis_data`. Dejar `auto.create.topics.enable` ON en dev (sin Topic Operator local).

## Cambios de código por microservicio (adaptadores del puerto existente)

### ms-auth (NestJS) — `kafkajs`
- `package.json`: añadir `kafkajs` (quitar `ioredis` no usado).
- Nuevo `ms-auth/src/auth/infrastructure/messaging/kafka-event-publisher.ts`: `KafkaEventPublisher implements EventPublisher, OnModuleInit, OnModuleDestroy`. Producer conectado en `onModuleInit`, `disconnect` en `onModuleDestroy`. `publishAll` mapea cada evento a envelope (con `eventName`, `occurredAt.toISOString()`, `aggregateId = userId ?? email`, `data = {...event}`), key=aggregateId, topic `auth-events`. **Mantener log** dentro del publisher (conserva observabilidad). Leer broker de `ConfigService` (`KAFKA_BOOTSTRAP_SERVERS`).
- `auth.module.ts`: cambiar provider a `{ provide: EVENT_PUBLISHER, useClass: KafkaEventPublisher }`. Verificar `ConfigModule` global.

### ms-doctor (Spring Boot) — `spring-kafka`
- `pom.xml`: añadir `org.springframework.kafka:spring-kafka` (versión por el parent 3.2.5).
- `application.yml`: bloque `spring.kafka` (`bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}`, key/value `StringSerializer`).
- Nuevo `.../infrastructure/messaging/KafkaEventPublisher.java`: `implements EventPublisherPort`, usa `KafkaTemplate<String,String>` + el `ObjectMapper` **inyectado de Spring** (trae JSR310 para `Instant`). Envelope con key=aggregateId (doctorId/reviewId vía `instanceof`), topic `doctor-events`. Loguea cada evento.
- Hacerlo bean activo: anotar Kafka con `@Primary` **y quitar `@Component` de `LoggingEventPublisher`** (evita `NoUniqueBeanDefinitionException`).

### ms-appointment (FastAPI) — `kafka-python` (síncrono)
- `requirements.txt`: añadir `kafka-python==2.0.2`; quitar `redis==5.0.4`.
- Nuevo `app/infrastructure/messaging/kafka_event_publisher.py`: `KafkaEventPublisher(EventPublisherPort)` espejo del Redis. **Preservar contrato**: para `AppointmentCreated`, `data = notification_payload` (lleva `patient_email`/`doctor_email`); para `AppointmentCancelled`, mezclar `notification_payload` si existe. Envelope estándar, key=appointment_id, topic `appointment-events`. `producer.flush()` al final de `publish_all` (semántica síncrona dentro del UoW).
- `config.py`: `kafka_bootstrap_servers` (env `KAFKA_BOOTSTRAP_SERVERS`); quitar `redis_url`.
- `dependencies.py`: factory `get_kafka_producer()` con `@lru_cache` (singleton `KafkaProducer(acks="all", retries=3, linger_ms=5)`); `get_event_publisher()` lo inyecta.
- **Fix necesario para el golden path de cancelación**: `app/application/use_cases/cancel_appointment.py` hoy NO pasa `notification_payload`, así que el email de cancelación nunca lleva `patient_email`. Construir `notification_payload` con el email del paciente (verificar que `CancelAppointmentCommand` lo traiga; si no, añadirlo). Independiente de Kafka pero bloquea el paso 3.

### ms-notification (FastAPI) — `kafka-python` consumer
- `requirements.txt`: añadir `kafka-python==2.0.2`; quitar `redis==5.0.4`.
- `main.py`: reemplazar `blocking_redis_listener` por `blocking_kafka_listener` (mismo patrón de hilo en executor): `KafkaConsumer("appointment-events","auth-events", group_id="ms-notification", auto_offset_reset="latest", value_deserializer=json)`. Adaptar `handle_notification` para despachar por **`eventName`** del envelope: `appointment.created`/`appointment.cancelled` → emails actuales; `user.registered` → email de bienvenida (`data.email`). Resto se ignora.

## Conectividad mesh ↔ Kafka

Funciona igual que Redis hoy: clientes en `medplatform` (con sidecar/mTLS STRICT) → Kafka en `medplatform-data` (sin sidecar). El tráfico saliente del sidecar hacia un destino sin sidecar sale plaintext (PERMISSIVE). Salvaguardas baratas: las 2 `DestinationRule` con `tls: DISABLE` (arriba). Strimzi nombra el puerto del Service `tcp-*`, así Istio no hace HTTP-sniffing sobre 9092. No se necesita `ServiceEntry` (Kafka es Service interno). Los pods de Kafka quedan sin sidecar automáticamente porque `medplatform-data` no tiene `istio-injection`.

## Verificación end-to-end

1. **Kafka Ready + topics**: `kubectl wait kafka/medplatform-kafka --for=condition=Ready ...`; `kubectl get kafka,kafkanodepool,kafkatopic -n medplatform-data`; pod `medplatform-kafka-combined-0` + entity-operator corriendo.
2. **Producir/consumir manual** con pod efímero `quay.io/strimzi/kafka:0.45.0-kafka-3.9.0` (`kafka-topics.sh --list`, `kafka-console-consumer.sh --topic appointment-events --from-beginning`, `kafka-console-producer.sh`).
3. **Golden path** (vía Ingress):
   - `POST /auth/register` → log ms-auth `user.registered -> auth-events`; log ms-notification `event=user.registered` + `Email enviado` (bienvenida).
   - `POST /appointments` → log ms-appointment `appointment.created -> appointment-events`; log ms-notification emails paciente+médico.
   - Cancelar cita → `appointment.cancelled` + email cancelación (requiere fix `cancel_appointment.py`).
4. **Lag del consumer** = 0: `kafka-consumer-groups.sh --group ms-notification --describe`.
5. **Replay** (demo EDA, ventaja vs Redis): consumir `--from-beginning` muestra eventos históricos persistidos.
6. Logs: `kubectl logs -n medplatform deploy/ms-{auth,doctor,appointment,notification} -f | Select-String "DomainEvents|-events"`.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Pod Kafka `Pending` por recursos en Kind | Bajar `requests` o usar `storage: ephemeral` |
| Kind sin default StorageClass → PVC Pending | Usar `storage: ephemeral` en el NodePool |
| Imágenes Strimzi/Kafka no en Kind (offline) | Bajan de quay.io en runtime; si offline, `kind load docker-image` |
| `version` de Kafka no soportada por el operador | Fijar `Kafka.spec.kafka.version: 3.9.0` (soportada por 0.45) |
| Istio rompe protocolo Kafka por sniffing | Strimzi usa puerto `tcp-*` + DestinationRules `tls: DISABLE` |
| `NoUniqueBeanDefinitionException` en ms-doctor | Quitar `@Component` de `LoggingEventPublisher`, `@Primary` en Kafka |
| Email de cancelación vacío | Fix `cancel_appointment.py` para pasar `notification_payload` con email |
| Consumer reprocesa histórico y manda emails masivos al arrancar | `auto_offset_reset="latest"` |
| Jackson falla con `Instant` en ms-doctor | Inyectar el `ObjectMapper` de Spring (JSR310) |

## Archivos críticos
- Nuevos: `k8s/15-strimzi/strimzi-cluster-operator-0.45.0.yaml`, `k8s/20-data/kafka-cluster.yaml`, `k8s/20-data/kafka-topics.yaml`, `k8s/40-istio/kafka-destinationrule.yaml`, adaptadores Kafka en los 4 micros.
- Editar: `k8s/10-secrets-config/configmap-app.yaml`, `k8s/30-apps/` (4 manifiestos), `k8s/scripts/04-apply-all.ps1`, `docker-compose.yml`, `ms-auth/src/auth/auth.module.ts`, `ms-doctor/pom.xml`, `ms-doctor/.../application.yml`, `ms-appointment/app/config.py`, `ms-appointment/.../dependencies.py`, `ms-appointment/app/application/use_cases/cancel_appointment.py`, `ms-notification/main.py`, `requirements.txt` (x2).
- Eliminar: `k8s/20-data/redis-deploy.yaml`.
- Documentar: añadir sección "EDA / Event Bus (Kafka)" al README (diagrama antes/después Redis→Kafka, topics, envelope, comandos de demo y replay).
