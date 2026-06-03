# 07-install-strimzi.ps1
# Descarga el bundle del Strimzi Cluster Operator 0.45.0,
# reemplaza el namespace 'myproject' por 'medplatform-data' y lo aplica.
# Requiere acceso a internet (github.com).

$ErrorActionPreference = "Stop"

$STRIMZI_VERSION = "0.45.0"
$K8S = Split-Path -Parent $PSScriptRoot
$OUTPUT_DIR = "$K8S\15-strimzi"
$OUTPUT_FILE = "$OUTPUT_DIR\strimzi-cluster-operator-$STRIMZI_VERSION.yaml"

if (-not (Test-Path $OUTPUT_DIR)) {
    New-Item -ItemType Directory -Path $OUTPUT_DIR -Force | Out-Null
}

$url = "https://github.com/strimzi/strimzi-kafka-operator/releases/download/$STRIMZI_VERSION/strimzi-cluster-operator-$STRIMZI_VERSION.yaml"

if (-not (Test-Path $OUTPUT_FILE)) {
    Write-Host "==> Descargando Strimzi $STRIMZI_VERSION desde GitHub ..." -ForegroundColor Green
    try {
        # -OutFile garantiza escritura binaria correcta aunque GitHub sirva
        # el asset como application/octet-stream (evita que .Content sea byte[]).
        $tempFile = [System.IO.Path]::GetTempFileName()
        Invoke-WebRequest -Uri $url -UseBasicParsing -OutFile $tempFile
        $content = [System.IO.File]::ReadAllText($tempFile)
        Remove-Item $tempFile -ErrorAction SilentlyContinue

        $patched = $content -replace 'namespace: myproject', 'namespace: medplatform-data'
        # UTF-8 sin BOM (PS 5.1 Out-File añade BOM)
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($OUTPUT_FILE, $patched, $utf8NoBom)
        Write-Host "    Guardado en: $OUTPUT_FILE" -ForegroundColor Gray
    } catch {
        Write-Host "ERROR al descargar Strimzi: $_" -ForegroundColor Red
        Write-Host "Descarga manualmente desde: $url" -ForegroundColor Yellow
        Write-Host "Reemplaza 'namespace: myproject' por 'namespace: medplatform-data' y guarda en: $OUTPUT_FILE" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "==> Strimzi ya descargado: $OUTPUT_FILE" -ForegroundColor Gray
}

Write-Host "==> Aplicando CRDs + Strimzi Operator en medplatform-data ..." -ForegroundColor Green
# --validate=false es necesario con Strimzi: su bundle contiene objetos que
# la validación cliente de kubectl no reconoce (p.ej. OpenAPI v3 schemas en CRDs).
kubectl apply --validate=false -f $OUTPUT_FILE -n medplatform-data
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: kubectl apply del operador Strimzi falló (exit $LASTEXITCODE)" -ForegroundColor Red
    exit 1
}

Write-Host "    Esperando a que el operador esté listo..." -ForegroundColor Yellow
kubectl rollout status deploy/strimzi-cluster-operator -n medplatform-data --timeout=180s
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: el operador Strimzi no arrancó en 180 s" -ForegroundColor Red
    exit 1
}
Write-Host "==> Strimzi Operator listo." -ForegroundColor Green
