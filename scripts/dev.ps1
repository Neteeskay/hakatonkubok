$ErrorActionPreference = "Stop"

Write-Host "1. Start database and API"
Write-Host "   docker compose up --build"
Write-Host ""
Write-Host "2. API docs"
Write-Host "   http://localhost:8000/docs"
Write-Host ""
Write-Host "3. Recreate local DB from SQL seed"
Write-Host "   docker compose down -v; docker compose up db"

