# 05-port-forwards.ps1
# Abre los paneles de observabilidad en ventanas PowerShell separadas.

Write-Host "==> Abriendo dashboards de observabilidad..." -ForegroundColor Green
Write-Host "    Kiali:      http://localhost:20001" -ForegroundColor Cyan
Write-Host "    Grafana:    http://localhost:3030" -ForegroundColor Cyan
Write-Host "    Jaeger:     http://localhost:16686" -ForegroundColor Cyan
Write-Host "    Prometheus: http://localhost:9090" -ForegroundColor Cyan
Write-Host ""

$forwards = @(
    @{ label = "Kiali";      cmd = "kubectl port-forward -n istio-system svc/kiali 20001:20001" },
    @{ label = "Grafana";    cmd = "kubectl port-forward -n istio-system svc/grafana 3030:3000" },
    @{ label = "Jaeger";     cmd = "kubectl port-forward -n istio-system svc/tracing 16686:80" },
    @{ label = "Prometheus"; cmd = "kubectl port-forward -n istio-system svc/prometheus 9090:9090" }
)

foreach ($fwd in $forwards) {
    $script = "Write-Host '$($fwd.label) listo' -ForegroundColor Cyan; $($fwd.cmd)"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $script
}

Write-Host "==> 4 ventanas abiertas. Presiona Ctrl+C en cada una para cerrar los port-forwards." -ForegroundColor Yellow
