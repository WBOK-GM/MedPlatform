# 04-apply-all.ps1
# Aplica todos los manifests en el orden correcto:
# 1. Namespaces
# 2. Secrets y ConfigMaps
# 3. Strimzi Operator (descarga + aplica)
# 4. Infraestructura (BDs + Kafka cluster)
# 5. Kafka Topics (tras cluster Ready)
# 6. Aplicaciones (micros)
# 7. Recursos Istio

$ErrorActionPreference = "Stop"
$K8S = Split-Path -Parent $PSScriptRoot

function Apply-Dir($dir, $label) {
    Write-Host ""
    Write-Host "==> Aplicando: $label ..." -ForegroundColor Green
    kubectl apply -f $dir
}

Apply-Dir "$K8S\00-namespace"         "Namespaces"
Apply-Dir "$K8S\10-secrets-config"    "Secrets y ConfigMaps"

# Limpiar recursos de intentos anteriores con Strimzi (si existen)
Write-Host ""
Write-Host "==> Limpiando Strimzi Operator (reemplazado por StatefulSet directo) ..." -ForegroundColor Green
kubectl delete deploy/strimzi-cluster-operator -n medplatform-data --ignore-not-found=true
kubectl delete deploy/redis                    -n medplatform-data --ignore-not-found=true
# Eliminar los DestinationRules viejos de Strimzi (nombres distintos al nuevo)
kubectl delete destinationrule/kafka-bootstrap-plaintext -n medplatform --ignore-not-found=true
kubectl delete destinationrule/kafka-brokers-plaintext   -n medplatform --ignore-not-found=true

Write-Host ""
Write-Host "==> Aplicando: Infraestructura (BDs + Kafka StatefulSet) ..." -ForegroundColor Green
kubectl apply -f "$K8S\20-data"

Write-Host "    Esperando a que las BDs estén listas (puede tomar 2-3 min)..." -ForegroundColor Yellow
kubectl rollout status statefulset/postgres-users        -n medplatform-data --timeout=180s
kubectl rollout status statefulset/postgres-appointments -n medplatform-data --timeout=180s
kubectl rollout status statefulset/mongodb               -n medplatform-data --timeout=180s

Write-Host "    Esperando a que Kafka esté listo..." -ForegroundColor Yellow
kubectl rollout status statefulset/kafka -n medplatform-data --timeout=180s
Write-Host "    Kafka listo." -ForegroundColor Gray

Write-Host ""
Write-Host "==> Aplicando: Microservicios ..." -ForegroundColor Green
kubectl apply -f "$K8S\30-apps"

Write-Host "    Esperando a que los micros arranquen (puede tomar 2-3 min)..." -ForegroundColor Yellow
kubectl rollout status deploy/ms-auth         -n medplatform --timeout=180s
kubectl rollout status deploy/ms-doctor       -n medplatform --timeout=180s
kubectl rollout status deploy/ms-appointment  -n medplatform --timeout=180s
kubectl rollout status deploy/ms-notification -n medplatform --timeout=120s

Apply-Dir "$K8S\40-istio" "Recursos Istio (Gateway, VirtualServices, DestinationRules, PeerAuthentication, Kafka DR)"

Write-Host ""
Write-Host "==> Stack completo desplegado." -ForegroundColor Green
Write-Host ""
Write-Host "Verificando pods en el namespace medplatform:" -ForegroundColor Cyan
kubectl get pods -n medplatform
Write-Host ""
Write-Host "Verificando pods en el namespace medplatform-data:" -ForegroundColor Cyan
kubectl get pods -n medplatform-data
Write-Host ""
Write-Host "==> Prueba rápida del Ingress:" -ForegroundColor Cyan
Write-Host "    curl http://localhost/auth/login -X POST -H 'Content-Type: application/json' -d '{\"email\":\"test@test.com\",\"password\":\"secret\"}'"
