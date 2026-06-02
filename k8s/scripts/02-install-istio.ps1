# 02-install-istio.ps1
# Instala Istio con el perfil "demo" (incluye Ingress Gateway y herramientas extra).
# Si istioctl no está en PATH, lo descarga automáticamente para Windows.

$ErrorActionPreference = "Stop"
$ISTIO_VERSION = "1.22.3"
$ISTIO_REL     = "release-1.22"

# ── 1. Verificar / descargar istioctl ─────────────────────────────────────────
if (-not (Get-Command istioctl -ErrorAction SilentlyContinue)) {
    Write-Host "==> istioctl no encontrado. Descargando v$ISTIO_VERSION para Windows..." -ForegroundColor Yellow

    $zipUrl  = "https://github.com/istio/istio/releases/download/$ISTIO_VERSION/istioctl-$ISTIO_VERSION-win.zip"
    $binDir  = "$env:USERPROFILE\.istio\bin"
    $zipPath = "$env:TEMP\istioctl.zip"

    New-Item -ItemType Directory -Force $binDir | Out-Null
    Write-Host "    Descargando desde GitHub..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
    Expand-Archive -Path $zipPath -DestinationPath $binDir -Force
    Remove-Item $zipPath

    # Agregar al PATH de la sesión actual
    $env:PATH = "$binDir;$env:PATH"

    Write-Host "    istioctl instalado en: $binDir" -ForegroundColor Green
    Write-Host "    Para hacerlo permanente ejecuta:" -ForegroundColor Cyan
    Write-Host "    [Environment]::SetEnvironmentVariable('PATH', '$binDir;' + [Environment]::GetEnvironmentVariable('PATH','User'), 'User')" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "==> istioctl encontrado: $(istioctl version --short 2>$null)" -ForegroundColor Cyan
}

# ── 2. Instalar Istio en el cluster ──────────────────────────────────────────
Write-Host "==> Instalando Istio (perfil demo, tracing 100%)..." -ForegroundColor Green
istioctl install `
  --set profile=demo `
  --set meshConfig.defaultConfig.tracing.sampling=100 `
  -y

Write-Host ""
Write-Host "==> Verificando pods de Istio..." -ForegroundColor Cyan
kubectl rollout status deploy/istiod              -n istio-system --timeout=180s
kubectl rollout status deploy/istio-ingressgateway -n istio-system --timeout=180s

# ── 3. Configurar NodePort para Kind (host:80 → nodePort:30080) ───────────────
Write-Host ""
Write-Host "==> Configurando NodePort del Ingress Gateway para Kind (80 -> 30080)..." -ForegroundColor Green

# Paso 1: cambiar tipo a NodePort (K8s auto-asigna nodePort values)
kubectl patch svc istio-ingressgateway -n istio-system --type='json' -p='[{"op":"replace","path":"/spec/type","value":"NodePort"}]'

# Paso 2: esperar a que K8s asigne los nodePort y luego fijarlos con replace
Start-Sleep -Seconds 3
$patchPorts = '[{"op":"replace","path":"/spec/ports/1/nodePort","value":30080},{"op":"replace","path":"/spec/ports/2/nodePort","value":30443}]'
kubectl patch svc istio-ingressgateway -n istio-system --type='json' -p=$patchPorts

# ── 4. Addons de observabilidad ───────────────────────────────────────────────
Write-Host ""
Write-Host "==> Instalando addons de observabilidad (Prometheus, Grafana, Jaeger, Kiali)..." -ForegroundColor Green
kubectl apply -f "https://raw.githubusercontent.com/istio/istio/$ISTIO_REL/samples/addons/prometheus.yaml"
kubectl apply -f "https://raw.githubusercontent.com/istio/istio/$ISTIO_REL/samples/addons/grafana.yaml"
kubectl apply -f "https://raw.githubusercontent.com/istio/istio/$ISTIO_REL/samples/addons/jaeger.yaml"
kubectl apply -f "https://raw.githubusercontent.com/istio/istio/$ISTIO_REL/samples/addons/kiali.yaml"

Write-Host ""
Write-Host "    Esperando a que los addons arranquen (puede tomar 1-2 min)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
kubectl rollout status deploy/kiali      -n istio-system --timeout=120s
kubectl rollout status deploy/grafana    -n istio-system --timeout=120s
kubectl rollout status deploy/prometheus -n istio-system --timeout=120s

Write-Host ""
Write-Host "==> Istio + observabilidad instalados correctamente." -ForegroundColor Green
Write-Host "    Ejecuta 05-port-forwards.ps1 para acceder a los dashboards." -ForegroundColor Cyan
