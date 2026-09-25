# ======================================================================
# LunchUp local development - one-command startup
#
#   1. Ensures PostgreSQL is running (Windows service; Docker not required)
#   2. Ensures the `lunchup` database exists
#   3. Applies pending Prisma migrations
#   4. Seeds the database only if it is empty
#   5. Starts the LunchUp API (backend :4000) and the Next.js website (frontend :3000)
#
#   Usage:
#     powershell -ExecutionPolicy Bypass -File .\dev.ps1
#     powershell -ExecutionPolicy Bypass -File .\dev.ps1 -NoServers      # DB only
#     powershell -ExecutionPolicy Bypass -File .\dev.ps1 -SkipSeed        # keep existing data
#
#   The frontend proxies every /api/v1/* request to http://localhost:4000
#   (see frontend/website/next.config.js), so both servers work together
#   while the API session cookies stay same-origin.
# ======================================================================
[CmdletBinding()]
param(
    [switch]$NoServers,
    [switch]$SkipSeed
)
$ErrorActionPreference = 'Stop'

$Root = (Resolve-Path (Split-Path -Parent $MyInvocation.MyCommand.Path)).Path
$Backend = Join-Path $Root 'backend'
$Frontend = Join-Path $Root 'frontend\website'
$EnvFile = Join-Path $Backend '.env'

function Find-Psql {
    $fromPath = (Get-Command psql -ErrorAction SilentlyContinue).Source
    if ($fromPath) { return $fromPath }
    foreach ($base in @("$env:ProgramFiles\PostgreSQL", "${env:ProgramFiles(x86)}\PostgreSQL")) {
        $found = Get-ChildItem "$base\*\bin\psql.exe" -ErrorAction SilentlyContinue |
            Sort-Object FullName -Descending | Select-Object -First 1
        if ($found) { return $found.FullName }
    }
    throw 'psql not found. Install PostgreSQL or add its bin directory to PATH.'
}

function Get-DbUrl {
    if (-not (Test-Path $EnvFile)) {
        throw "Missing $EnvFile - copy backend/.env.example to backend/.env first."
    }
    $line = Get-Content $EnvFile | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
    if (-not $line) { throw 'DATABASE_URL is missing from backend/.env.' }
    return ($line -replace '^DATABASE_URL=', '').Trim()
}

function Ensure-Postgres {
    $services = @(Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'postgresql*' })
    if ($services.Count -eq 0) {
        Write-Host 'No PostgreSQL Windows service found. Install PostgreSQL or use the Docker option in backend/docker-compose.yml.' -ForegroundColor Yellow
        return
    }
    $stopped = $services | Where-Object { $_.Status -ne 'Running' } | Select-Object -First 1
    if ($stopped) {
        Write-Host "Starting PostgreSQL service '$($stopped.Name)'..." -ForegroundColor Cyan
        Start-Service -Name $stopped.Name
        Start-Sleep -Seconds 2
    } else {
        Write-Host "PostgreSQL is running ($($services[0].Name))." -ForegroundColor Green
    }
}

function Ensure-Database {
    $url = Get-DbUrl
    if ($url -notmatch '^postgres(ql)?://([^:]+):([^@]+)@([^:/]+)(?::(\d+))?/(\w+)') {
        throw "Could not parse DATABASE_URL: $url"
    }
    $user = $matches[2]; $pass = $matches[3]; $hostName = $matches[4]
    $port = if ($matches[5]) { $matches[5] } else { '5432' }
    $db = $matches[6]

    $psql = Find-Psql
    $env:PGPASSWORD = $pass
    $exists = & $psql -h $hostName -p $port -U $user -d postgres -tA -c "SELECT 1 FROM pg_database WHERE datname='$db'"
    if (($exists | Out-String).Trim() -ne '1') {
        Write-Host "Creating database '$db'..." -ForegroundColor Cyan
        & $psql -h $hostName -p $port -U $user -d postgres -c "CREATE DATABASE `"$db`"" | Out-Null
    } else {
        Write-Host "Database '$db' exists." -ForegroundColor Green
    }
}

function Ensure-Schema {
    Push-Location $Backend
    try {
        Write-Host 'Applying Prisma migrations...' -ForegroundColor Cyan
        npx prisma migrate deploy
        if ($LASTEXITCODE -ne 0) { throw 'prisma migrate deploy failed.' }
        if (-not $SkipSeed) {
            $url = Get-DbUrl
            if ($url -notmatch '^postgres(ql)?://([^:]+):([^@]+)@([^:/]+)(?::(\d+))?/(\w+)') {
                throw "Could not parse DATABASE_URL: $url"
            }
            $user = $matches[2]; $pass = $matches[3]; $hostName = $matches[4]
            $port = if ($matches[5]) { $matches[5] } else { '5432' }
            $db = $matches[6]
            $psql = Find-Psql
            $env:PGPASSWORD = $pass
            $users = & $psql -h $hostName -p $port -U $user -d $db -tA -c 'SELECT count(*) FROM users'
            if ((($users | Out-String).Trim()) -eq '0') {
                Write-Host 'Seeding the database...' -ForegroundColor Cyan
                npx prisma db seed
                if ($LASTEXITCODE -ne 0) { throw 'prisma db seed failed.' }
            } else {
                Write-Host 'Database already seeded (skipping).' -ForegroundColor Green
            }
        }
    } finally {
        Pop-Location
    }
}

function Test-PortInUse([int]$Port) {
    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listening -ErrorAction SilentlyContinue)
}

function Start-Server([string]$Name, [int]$Port, [string]$WorkDir, [string]$Script) {
    if (Test-PortInUse $Port) {
        Write-Host "$Name already running on :$Port - skipping." -ForegroundColor Yellow
        return
    }
    Write-Host "Starting $Name ($Script) in $WorkDir" -ForegroundColor Cyan
    Start-Process -FilePath 'npm.cmd' -ArgumentList 'run', $Script -WorkingDirectory $WorkDir
}

Write-Host 'LunchUp - dev environment' -ForegroundColor Magenta
Write-Host ('Root: ' + $Root)
Write-Host ''

Ensure-Postgres
Ensure-Database
Ensure-Schema

if (-not $NoServers) {
    Write-Host ''
    Write-Host 'Frontend (http://localhost:3000) proxies /api/v1/* -> http://localhost:4000' -ForegroundColor Green
    Start-Server 'LunchUp API' 4000 $Backend 'start:dev'
    Start-Server 'LunchUp website' 3000 $Frontend 'dev'
    Write-Host ''
    Write-Host 'Done. Each server runs in its own window - close it to stop that server.' -ForegroundColor Magenta
}