# 01-create-cluster.ps1
# Crea el cluster Kind con el perfil de medplatform.
# Requiere: kind CLI instalado (https://kind.sigs.k8s.io/)

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$KIND_CONFIG = Join-Path $ROOT "k8s\kind\kind-config.yaml"

Write-Host "==> Verificando si el cluster 'medplatform' ya existe..." -ForegroundColor Cyan
# kind get clusters imprime en stderr "No kind clusters found." cuando no hay clusters.
# PowerShell 5.1 convierte stderr de nativos en ErrorRecord, así que atrapamos el error.
$clusters = $null
try { $clusters = kind get clusters } catch { $clusters = @() }
if ($clusters -contains "medplatform") {
    Write-Host "El cluster 'medplatform' ya existe. Para recrearlo: kind delete cluster --name medplatform" -ForegroundColor Yellow
    exit 0
}

Write-Host "==> Creando cluster Kind 'medplatform'..." -ForegroundColor Green
kind create cluster --name medplatform --config $KIND_CONFIG

Write-Host ""
Write-Host "Cluster creado. Contexto activo:" -ForegroundColor Green
kubectl config current-context
