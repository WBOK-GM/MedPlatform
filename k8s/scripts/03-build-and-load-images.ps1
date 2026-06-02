# 03-build-and-load-images.ps1
# Construye las imágenes Docker de los 4 microservicios y las carga en el cluster Kind.
# IMPORTANTE: Las imágenes se crean con tag "medplatform/ms-*:latest"
#             usando imagePullPolicy: IfNotPresent para evitar pulls externos.

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

$services = @(
    @{ name = "ms-auth";        path = "ms-auth"        },
    @{ name = "ms-doctor";      path = "ms-doctor"      },
    @{ name = "ms-appointment"; path = "ms-appointment" },
    @{ name = "ms-notification"; path = "ms-notification" }
)

foreach ($svc in $services) {
    $imageName = "medplatform/$($svc.name):latest"
    $buildPath  = Join-Path $ROOT $svc.path
    Write-Host ""
    Write-Host "==> Building $imageName from $buildPath ..." -ForegroundColor Green
    docker build -t $imageName $buildPath
}

Write-Host ""
Write-Host "==> Cargando imágenes en el cluster Kind 'medplatform'..." -ForegroundColor Green
foreach ($svc in $services) {
    $imageName = "medplatform/$($svc.name):latest"
    Write-Host "    Loading $imageName ..." -ForegroundColor Cyan
    kind load docker-image $imageName --name medplatform
}

Write-Host ""
Write-Host "==> Todas las imágenes cargadas correctamente." -ForegroundColor Green
