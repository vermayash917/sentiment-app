# start_all.ps1  — starts Mongo container, inference, backend, frontend in separate windows
Write-Host "Starting Mongo container..."
docker start sentiment-mongo | Out-Null

# start FastAPI in new window
Write-Host "Starting FastAPI (uvicorn) in new window..."
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$PSScriptRoot\inference`"; `& `.venv\Scripts\Activate.ps1; uvicorn app.main:app --host 127.0.0.1 --port 8001"

# start Node backend
Write-Host "Starting Node backend in new window..."
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$PSScriptRoot\backend`"; node server.js"

# start frontend
Write-Host "Starting frontend (Vite) in new window..."
Start-Process powershell -ArgumentList "-NoExit","-Command","cd `"$PSScriptRoot\frontend`"; npm run dev"

Write-Host "All start commands issued. Check the new windows for logs."
