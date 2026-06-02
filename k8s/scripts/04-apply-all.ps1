# 04-apply-all.ps1
# Aplica todos los manifests en el orden correcto:
# 1. Namespaces
# 2. Secrets y ConfigMaps
# 3. Infraestructura (BDs, Redis)
# 4. Aplicaciones (micros)
# 5. Recursos Istio

$ErrorActionPreference = "Stop"
$K8S = Split-Path -Parent $PSScriptRoot

function Apply-Dir($dir, $label) {
    Write-Host ""
    Write-Host "==> Aplicando: $label ..." -ForegroundColor Green
    kubectl apply -f $dir
}

Apply-Dir "$K8S\00-namespace"         "Namespaces"
Apply-Dir "$K8S\10-secrets-config"    "Secrets y ConfigMaps"

Write-Host ""
Write-Host "==> Aplicando: Infraestructura (BDs + Redis) ..." -ForegroundColor Green
kubectl apply -f "$K8S\20-data"

Write-Host "    Esperando a que las BDs estén listas (puede tomar 2-3 min)..." -ForegroundColor Yellow
kubectl rollout status statefulset/postgres-users        -n medplatform-data --timeout=180s
kubectl rollout status statefulset/postgres-appointments -n medplatform-data --timeout=180s
kubectl rollout status statefulset/mongodb               -n medplatform-data --timeout=180s
kubectl rollout status deploy/redis                      -n medplatform-data --timeout=60s

Write-Host ""
Write-Host "==> Aplicando: Microservicios ..." -ForegroundColor Green
kubectl apply -f "$K8S\30-apps"

Write-Host "    Esperando a que los micros arranquen (puede tomar 2-3 min)..." -ForegroundColor Yellow
kubectl rollout status deploy/ms-auth         -n medplatform --timeout=180s
kubectl rollout status deploy/ms-doctor       -n medplatform --timeout=180s
kubectl rollout status deploy/ms-appointment  -n medplatform --timeout=180s
kubectl rollout status deploy/ms-notification -n medplatform --timeout=120s

Apply-Dir "$K8S\40-istio" "Recursos Istio (Gateway, VirtualServices, DestinationRules, PeerAuthentication)"

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
