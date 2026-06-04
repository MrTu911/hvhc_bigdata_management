# HVHC BigData - Dev Environment Startup Script
# Run this script ONCE per session when starting development
# Requires Administrator if WSL2 PostgreSQL is used (for port proxy)

param(
    [switch]$SkipPortProxy,
    [switch]$Help
)

if ($Help) {
    Write-Host @"
Usage: .\start-dev.ps1 [-SkipPortProxy]

This script starts the HVHC BigData local dev environment:
  - WSL2 Docker: PostgreSQL 15 with pgvector (port 5433 via proxy)
  - Windows native: Redis (port 6379)
  - Windows native: MinIO (port 9000)

Options:
  -SkipPortProxy    Skip netsh portproxy (if already set or running as non-admin)
"@
    exit 0
}

$ErrorActionPreference = "Continue"

Write-Host "=== HVHC BigData Dev Startup ===" -ForegroundColor Cyan
Write-Host ""

# ─── Step 1: Start WSL2 Docker services ────────────────────────────────────
Write-Host "[1/4] Starting Docker services in WSL2..." -ForegroundColor Yellow
wsl -d Ubuntu-24.04 -- bash -c @"
sudo systemctl start docker 2>/dev/null
sleep 2
cd /mnt/d/hvhc_bigdata_management
docker compose -f docker-compose.dev.yml up -d postgres 2>&1 | grep -E 'Started|Running|Error'
"@
Write-Host "  PostgreSQL (pgvector) started in WSL2" -ForegroundColor Green

# ─── Step 2: Setup port forwarding (requires admin) ─────────────────────────
if (-not $SkipPortProxy) {
    Write-Host ""
    Write-Host "[2/4] Setting up port forwarding localhost:5433 -> WSL2:5433..." -ForegroundColor Yellow

    $wsl2IP = ((wsl -d Ubuntu-24.04 -- bash -c "hostname -I") -split '\s+' | Where-Object {$_ -match '^\d+\.\d+\.\d+\.\d+$'} | Select-Object -First 1).Trim()
    Write-Host "  WSL2 IP: $wsl2IP"

    # Remove old rule if exists
    netsh interface portproxy delete v4tov4 listenport=5433 listenaddress=127.0.0.1 2>$null | Out-Null

    # Add new rule
    $result = netsh interface portproxy add v4tov4 listenport=5433 listenaddress=127.0.0.1 connectport=5433 connectaddress=$wsl2IP 2>&1

    if ($result -match "elevation|administrator") {
        Write-Host "  [!] Port proxy needs admin rights. Run as Administrator or use -SkipPortProxy" -ForegroundColor Red
        Write-Host "  [!] Using WSL2 IP directly in .env.local instead..." -ForegroundColor Yellow

        # Create .env.local with WSL2 IP
        $envContent = "DATABASE_URL=`"postgresql://ductuking:Hv%402026@${wsl2IP}:5433/hvhc_bigdata_89?schema=public`""
        Set-Content -Path "D:\hvhc_bigdata_management\nextjs_space\.env.local" -Value $envContent
        Write-Host "  Created .env.local with WSL2 IP ($wsl2IP)" -ForegroundColor Green
    } else {
        Write-Host "  Port proxy configured successfully" -ForegroundColor Green
    }
} else {
    Write-Host "[2/4] Skipping port proxy setup" -ForegroundColor Gray
}

# ─── Step 3: Start Redis (native Windows) ───────────────────────────────────
Write-Host ""
Write-Host "[3/4] Starting Redis..." -ForegroundColor Yellow
$redisRunning = & "C:\Program Files\Redis\redis-cli.exe" ping 2>&1
if ($redisRunning -eq "PONG") {
    Write-Host "  Redis already running" -ForegroundColor Green
} else {
    Start-Process -FilePath "C:\Program Files\Redis\redis-server.exe" -WindowStyle Hidden
    Start-Sleep -Seconds 2
    $check = & "C:\Program Files\Redis\redis-cli.exe" ping 2>&1
    if ($check -eq "PONG") {
        Write-Host "  Redis started" -ForegroundColor Green
    } else {
        Write-Host "  [!] Redis failed to start" -ForegroundColor Red
    }
}

# ─── Step 4: Start MinIO (native Windows) ───────────────────────────────────
Write-Host ""
Write-Host "[4/4] Starting MinIO..." -ForegroundColor Yellow
$minioRunning = (netstat -ano 2>$null | Select-String ":9000") -ne $null
if ($minioRunning) {
    Write-Host "  MinIO already running on port 9000" -ForegroundColor Green
} else {
    $minioDataDir = "C:\minio\data"
    New-Item -ItemType Directory -Force -Path $minioDataDir | Out-Null
    $env:MINIO_ROOT_USER = "minio_admin"
    $env:MINIO_ROOT_PASSWORD = "minio_secure_2024"
    Start-Process -FilePath "C:\minio\minio.exe" `
        -ArgumentList "server", $minioDataDir, "--console-address", ":9001" `
        -WindowStyle Hidden
    Start-Sleep -Seconds 2
    Write-Host "  MinIO started (API: http://localhost:9000, Console: http://localhost:9001)" -ForegroundColor Green
}

# ─── Summary ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=== Services Ready ===" -ForegroundColor Cyan
Write-Host "  PostgreSQL:  localhost:5433 (ductuking / Hv@2026 / hvhc_bigdata_89)"
Write-Host "  Redis:       localhost:6379 (no password)"
Write-Host "  MinIO:       localhost:9000 (minio_admin / minio_secure_2024)"
Write-Host "  MinIO UI:    http://localhost:9001"
Write-Host ""
Write-Host "Start Next.js:" -ForegroundColor Yellow
Write-Host "  cd nextjs_space && npm run dev"
