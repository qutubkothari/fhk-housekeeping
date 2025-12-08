# FHK Housekeeping - Quick Deployment Script
# Uploads built files to production server

param(
    [string]$KeyPath = "path/to/your/key.pem",
    [string]$ServerIP = "13.234.30.197",
    [string]$ServerUser = "ubuntu"
)

$ErrorActionPreference = "Stop"

Write-Host "=== FHK Housekeeping Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check if builds exist
if (-not (Test-Path "apps/admin-web/dist")) {
    Write-Host "Error: Admin web build not found. Run: npm run build in apps/admin-web" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "apps/staff-pwa/dist")) {
    Write-Host "Error: Staff PWA build not found. Run: npm run build in apps/staff-pwa" -ForegroundColor Red
    exit 1
}

Write-Host "Build files found:" -ForegroundColor Green
Write-Host "  Admin Web: apps/admin-web/dist/" -ForegroundColor White
Write-Host "  Staff PWA: apps/staff-pwa/dist/" -ForegroundColor White
Write-Host ""

# Confirm deployment
$confirm = Read-Host "Deploy to $ServerIP? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

# Create backup on server
Write-Host ""
Write-Host "Step 1: Creating backup on server..." -ForegroundColor Cyan
ssh -i $KeyPath "$ServerUser@$ServerIP" "sudo mkdir -p /var/www/fhk/backups && sudo cp -r /var/www/fhk/admin /var/www/fhk/backups/admin-`$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo 'No previous admin build' && sudo cp -r /var/www/fhk/staff /var/www/fhk/backups/staff-`$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo 'No previous staff build'"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Backup created successfully" -ForegroundColor Green
} else {
    Write-Host "  Warning: Backup failed (may be first deployment)" -ForegroundColor Yellow
}

# Upload Admin Web
Write-Host ""
Write-Host "Step 2: Uploading Admin Web..." -ForegroundColor Cyan
scp -i $KeyPath -r "apps/admin-web/dist/*" "$ServerUser@$ServerIP`:/tmp/admin-web/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Admin Web uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "  Error: Admin Web upload failed" -ForegroundColor Red
    exit 1
}

# Upload Staff PWA
Write-Host ""
Write-Host "Step 3: Uploading Staff PWA..." -ForegroundColor Cyan
scp -i $KeyPath -r "apps/staff-pwa/dist/*" "$ServerUser@$ServerIP`:/tmp/staff-pwa/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Staff PWA uploaded successfully" -ForegroundColor Green
} else {
    Write-Host "  Error: Staff PWA upload failed" -ForegroundColor Red
    exit 1
}

# Move files and restart nginx
Write-Host ""
Write-Host "Step 4: Moving files and restarting services..." -ForegroundColor Cyan
ssh -i $KeyPath "$ServerUser@$ServerIP" @"
    sudo mkdir -p /var/www/fhk/admin
    sudo mkdir -p /var/www/fhk/staff
    sudo rm -rf /var/www/fhk/admin/*
    sudo rm -rf /var/www/fhk/staff/*
    sudo mv /tmp/admin-web/* /var/www/fhk/admin/
    sudo mv /tmp/staff-pwa/* /var/www/fhk/staff/
    sudo chown -R www-data:www-data /var/www/fhk
    sudo systemctl reload nginx
    echo 'Deployment complete!'
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "  Services restarted successfully" -ForegroundColor Green
} else {
    Write-Host "  Error: Service restart failed" -ForegroundColor Red
    exit 1
}

# Verify deployment
Write-Host ""
Write-Host "Step 5: Verifying deployment..." -ForegroundColor Cyan
$response = ssh -i $KeyPath "$ServerUser@$ServerIP" "curl -s -o /dev/null -w '%{http_code}' http://localhost/admin/"

if ($response -eq "200") {
    Write-Host "  Admin Web is responding (HTTP 200)" -ForegroundColor Green
} else {
    Write-Host "  Warning: Admin Web returned HTTP $response" -ForegroundColor Yellow
}

$responsePwa = ssh -i $KeyPath "$ServerUser@$ServerIP" "curl -s -o /dev/null -w '%{http_code}' http://localhost/staff/"

if ($responsePwa -eq "200") {
    Write-Host "  Staff PWA is responding (HTTP 200)" -ForegroundColor Green
} else {
    Write-Host "  Warning: Staff PWA returned HTTP $responsePwa" -ForegroundColor Yellow
}

# Get server IP for final URLs
Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Application URLs:" -ForegroundColor Cyan
Write-Host "  Admin Web: http://$ServerIP/admin/" -ForegroundColor White
Write-Host "  Staff PWA: http://$ServerIP/staff/" -ForegroundColor White
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
