# Stack de Observabilidad — Istio Addons

Después de instalar Istio (ver `scripts/02-install-istio.ps1`), instala los 4 addons oficiales:

```powershell
$ISTIO_REL = "release-1.22"
kubectl apply -f "https://raw.githubusercontent.com/istio/istio/$ISTIO_REL/samples/addons/prometheus.yaml"
kubectl apply -f "https://raw.githubusercontent.com/istio/istio/$ISTIO_REL/samples/addons/grafana.yaml"
kubectl apply -f "https://raw.githubusercontent.com/istio/istio/$ISTIO_REL/samples/addons/jaeger.yaml"
kubectl apply -f "https://raw.githubusercontent.com/istio/istio/$ISTIO_REL/samples/addons/kiali.yaml"

# Esperar a que estén listos
kubectl rollout status deploy/kiali -n istio-system
kubectl rollout status deploy/grafana -n istio-system
kubectl rollout status deploy/jaeger -n istio-system
kubectl rollout status deploy/prometheus -n istio-system
```

## Acceder a los paneles

Usa `scripts/05-port-forwards.ps1` o los siguientes comandos:

```powershell
# Kiali — mapa del mesh en tiempo real
Start-Process powershell -ArgumentList "kubectl port-forward -n istio-system svc/kiali 20001:20001"
# Abre: http://localhost:20001

# Grafana — dashboards de métricas
Start-Process powershell -ArgumentList "kubectl port-forward -n istio-system svc/grafana 3000:3000"
# Abre: http://localhost:3000

# Jaeger — trazas distribuidas
Start-Process powershell -ArgumentList "kubectl port-forward -n istio-system svc/tracing 16686:80"
# Abre: http://localhost:16686

# Prometheus — métricas crudas
Start-Process powershell -ArgumentList "kubectl port-forward -n istio-system svc/prometheus 9090:9090"
# Abre: http://localhost:9090
```

O con el atajo de istioctl:
```powershell
istioctl dashboard kiali
istioctl dashboard grafana
istioctl dashboard jaeger
istioctl dashboard prometheus
```

## Dashboards recomendados en Grafana

Una vez dentro de Grafana → Dashboards → Browse → Buscar "Istio":
- **Istio Mesh Dashboard** — visión global: request rate, error rate, p50/p99 latencia
- **Istio Service Dashboard** — métricas por servicio (seleccionar ms-auth, ms-doctor, etc.)
- **Istio Workload Dashboard** — métricas por pod
