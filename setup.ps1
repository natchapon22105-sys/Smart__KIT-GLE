# Install the whole KIT-GLE project (Windows PowerShell). ASCII only on purpose
# (Windows PowerShell 5.1 misreads Thai text in .ps1 files without a BOM).
# Usage: open PowerShell in the kit-gle folder (the one containing frontend and backend), then run:
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "== [1/3] Frontend: clean install ==" -ForegroundColor Green
Set-Location "$root\frontend"
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "Retrying with --legacy-peer-deps"; npm install --legacy-peer-deps }

Write-Host "== [2/3] Frontend: align package versions with Expo ==" -ForegroundColor Green
npx expo install --fix

Write-Host "== [3/3] Backend: install ==" -ForegroundColor Green
Set-Location "$root\backend"
if (-not (Test-Path ".env")) { Copy-Item ".env.example" ".env" }
npm install

Set-Location $root
Write-Host ""
Write-Host "Done. Next:" -ForegroundColor Cyan
Write-Host "  1) Edit backend\.env (DB_PASSWORD, JWT_SECRET) and frontend\.env (EXPO_PUBLIC_API_URL)"
Write-Host "  2) Backend:  cd backend;  npm run dev"
Write-Host "  3) Frontend: cd frontend; npm run web   (or: npx expo start --go -c  for the phone)"
Write-Host "NEVER run: npm audit fix --force" -ForegroundColor Yellow
