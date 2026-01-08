# FHK Housekeeping - Quick Deployment Script
# Uploads built files to production server

param(
    [string]$KeyPath = "fhk-hk.pem",
    [string]$ServerIP = "13.234.30.197",
    [string]$ServerUser = "ubuntu",
    [switch]$DeployAdminWeb = $false,
    [switch]$DeployStaffPwa = $true,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$sshOptions = @('-o', 'StrictHostKeyChecking=accept-new')

function Invoke-Ssh([string]$command) {
    & ssh @sshOptions -i $KeyPath "$ServerUser@$ServerIP" $command
}

function Invoke-Scp([string]$source, [string]$dest) {
    & scp @sshOptions -i $KeyPath -r $source $dest
}

Write-Host "=== FHK Housekeeping Deployment ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $KeyPath)) {
    Write-Host "Error: SSH key not found at: $KeyPath" -ForegroundColor Red
    exit 1
}

if ($DeployAdminWeb -and (-not (Test-Path "apps/admin-web/dist"))) {
    Write-Host "Error: Admin web build not found at apps/admin-web/dist" -ForegroundColor Red
    Write-Host "Tip: This repo may only include staff-pwa. Run without -DeployAdminWeb." -ForegroundColor Yellow
    exit 1
}

if ($DeployStaffPwa -and (-not (Test-Path "apps/staff-pwa/dist"))) {
    Write-Host "Error: Staff PWA build not found at apps/staff-pwa/dist" -ForegroundColor Red
    exit 1
}

Write-Host "Build files found:" -ForegroundColor Green
if ($DeployAdminWeb) { Write-Host "  Admin Web: apps/admin-web/dist/" -ForegroundColor White }
if ($DeployStaffPwa) { Write-Host "  Staff PWA: apps/staff-pwa/dist/" -ForegroundColor White }
Write-Host ""

# Confirm deployment
if (-not $Force) {
    $confirm = Read-Host "Deploy to $ServerIP? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Create backup on server
Write-Host ""
Write-Host "Step 1: Creating backup on server..." -ForegroundColor Cyan
Invoke-Ssh "sudo mkdir -p /var/www/fhk/backups && (sudo cp -r /var/www/fhk/admin-web /var/www/fhk/backups/admin-web-`$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo 'No previous admin-web build') && (sudo cp -r /var/www/fhk/staff-pwa /var/www/fhk/backups/staff-pwa-`$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo 'No previous staff-pwa build')"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Backup created successfully" -ForegroundColor Green
} else {
    Write-Host "  Warning: Backup failed (may be first deployment)" -ForegroundColor Yellow
}

if ($DeployAdminWeb) {
    Write-Host ""
    Write-Host "Step 2: Uploading Admin Web..." -ForegroundColor Cyan
    Invoke-Ssh "rm -rf /tmp/admin-web && mkdir -p /tmp/admin-web"
    Invoke-Scp "apps/admin-web/dist/*" "$ServerUser@$ServerIP`:/tmp/admin-web/"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Admin Web uploaded successfully" -ForegroundColor Green
    } else {
        Write-Host "  Error: Admin Web upload failed" -ForegroundColor Red
        exit 1
    }
}

if ($DeployStaffPwa) {
    Write-Host ""
    Write-Host "Step 3: Uploading Staff PWA..." -ForegroundColor Cyan
    Invoke-Ssh "rm -rf /tmp/staff-pwa && mkdir -p /tmp/staff-pwa"
    Invoke-Scp "apps/staff-pwa/dist/*" "$ServerUser@$ServerIP`:/tmp/staff-pwa/"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Staff PWA uploaded successfully" -ForegroundColor Green
    } else {
        Write-Host "  Error: Staff PWA upload failed" -ForegroundColor Red
        exit 1
    }
}

# Move files and restart nginx
Write-Host ""
Write-Host "Step 4: Moving files and restarting services..." -ForegroundColor Cyan
$remoteSteps = @(
    'sudo mkdir -p /var/www/fhk/admin-web /var/www/fhk/staff-pwa'
)

if ($DeployAdminWeb) {
    $remoteSteps += 'sudo rm -rf /var/www/fhk/admin-web/*'
    $remoteSteps += 'sudo mv /tmp/admin-web/* /var/www/fhk/admin-web/'
}

if ($DeployStaffPwa) {
    $remoteSteps += 'sudo rm -rf /var/www/fhk/staff-pwa/*'
    $remoteSteps += 'sudo mv /tmp/staff-pwa/* /var/www/fhk/staff-pwa/'
}

$remoteSteps += 'sudo chown -R www-data:www-data /var/www/fhk'
$remoteSteps += 'sudo systemctl reload nginx'
$remoteSteps += "echo 'Deployment complete!'"

$remoteCommand = ($remoteSteps -join ' && ')
Invoke-Ssh $remoteCommand

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Services restarted successfully" -ForegroundColor Green
} else {
    Write-Host "  Error: Service restart failed" -ForegroundColor Red
    exit 1
}

# Verify deployment
Write-Host ""
Write-Host "Step 5: Verifying deployment..." -ForegroundColor Cyan
if ($DeployAdminWeb) {
    $response = Invoke-Ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost/"
    if ($response -eq "200") {
        Write-Host "  Admin Web is responding (HTTP 200)" -ForegroundColor Green
    } else {
        Write-Host "  Warning: Admin Web returned HTTP $response" -ForegroundColor Yellow
    }
}

if ($DeployStaffPwa) {
    $responsePwa = Invoke-Ssh "curl -s -o /dev/null -w '%{http_code}' http://localhost/unified/"
    if ($responsePwa -eq "200") {
        Write-Host "  Staff PWA is responding (HTTP 200)" -ForegroundColor Green
    } else {
        Write-Host "  Warning: Staff PWA returned HTTP $responsePwa" -ForegroundColor Yellow
    }
}

# Get server IP for final URLs
Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Application URLs:" -ForegroundColor Cyan
if ($DeployAdminWeb) { Write-Host "  Admin Web: http://$ServerIP/" -ForegroundColor White }
if ($DeployStaffPwa) { Write-Host "  Staff PWA: http://$ServerIP/unified/" -ForegroundColor White }
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Test both applications in browser" -ForegroundColor White
Write-Host "  2. Verify new features (inspection, timer, breakdowns, live board)" -ForegroundColor White
Write-Host "  3. Check database migrations applied" -ForegroundColor White
Write-Host "  4. Run TESTING_CHECKLIST.md scenarios" -ForegroundColor White
Write-Host "  5. Get client sign-off" -ForegroundColor White
Write-Host ""
Write-Host "Rollback command (if needed):" -ForegroundColor Red
Write-Host "  ssh -i $KeyPath $ServerUser@$ServerIP 'sudo cp -r /var/www/fhk/backups/admin-* /var/www/fhk/admin/ && sudo systemctl reload nginx'" -ForegroundColor Gray
Write-Host ""
