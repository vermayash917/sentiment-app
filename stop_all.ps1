# stop_all.ps1  — stops processes started above (only stops Mongo container)
Write-Host "Stopping Mongo container..."
docker stop sentiment-mongo | Out-Null
Write-Host "Mongo container stopped."

Write-Host "Note: Close any PowerShell windows opened by start_all.ps1 to stop backend, inference and frontend servers."
