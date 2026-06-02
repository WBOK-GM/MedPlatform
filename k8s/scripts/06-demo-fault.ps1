# 06-demo-fault.ps1
# Herramienta de demo para la sustentación.
# Inyecta y revierte fallos (delay / abort) en los VirtualServices de Istio.

param(
    [ValidateSet("inject-delay", "inject-abort", "revert", "status")]
    [string]$Action = "status",
    [ValidateSet("ms-auth", "ms-doctor", "ms-appointment", "ms-notification")]
    [string]$Service = "ms-appointment"
)

$ErrorActionPreference = "Stop"

function Inject-Delay {
    param([string]$svcName)
    Write-Host "==> Inyectando delay de 5s al 100% del tráfico en $svcName ..." -ForegroundColor Yellow
    $patch = @"
[{"op":"add","path":"/spec/http/0/fault","value":{"delay":{"percentage":{"value":100},"fixedDelay":"5s"}}}]
"@
    kubectl patch virtualservice "$svcName-vs" -n medplatform --type='json' -p=$patch
    Write-Host "    Fault inyectado. Haz peticiones y verifica latencia en Jaeger / Kiali." -ForegroundColor Cyan
    Write-Host "    Para revertir: .\06-demo-fault.ps1 -Action revert -Service $svcName"
}

function Inject-Abort {
    param([string]$svcName)
    Write-Host "==> Inyectando abort 503 al 50% del tráfico en $svcName ..." -ForegroundColor Yellow
    $patch = @"
[{"op":"add","path":"/spec/http/0/fault","value":{"abort":{"percentage":{"value":50},"httpStatus":503}}}]
"@
    kubectl patch virtualservice "$svcName-vs" -n medplatform --type='json' -p=$patch
    Write-Host "    Abort inyectado. Los retries de Istio compensarán el 50% de fallos." -ForegroundColor Cyan
    Write-Host "    Para revertir: .\06-demo-fault.ps1 -Action revert -Service $svcName"
}

function Revert-Fault {
    param([string]$svcName)
    Write-Host "==> Revirtiendo fault en $svcName ..." -ForegroundColor Green
    $patch = @"
[{"op":"remove","path":"/spec/http/0/fault"}]
"@
    kubectl patch virtualservice "$svcName-vs" -n medplatform --type='json' -p=$patch | Out-Null
    Write-Host "    Fault eliminado. El tráfico vuelve a la normalidad." -ForegroundColor Green
}

function Show-Status {
    Write-Host "==> Estado de VirtualServices en medplatform:" -ForegroundColor Cyan
    kubectl get virtualservices -n medplatform
    Write-Host ""
    Write-Host "==> Outlier detection stats (circuit breaker):" -ForegroundColor Cyan
    Write-Host "    Ejecuta en un pod: kubectl exec -n medplatform deploy/ms-doctor -c istio-proxy -- curl -s localhost:15000/stats | Select-String outlier"
}

switch ($Action) {
    "inject-delay" { Inject-Delay $Service }
    "inject-abort" { Inject-Abort $Service }
    "revert"       { Revert-Fault $Service }
    "status"       { Show-Status }
}
