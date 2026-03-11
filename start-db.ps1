# Démarre PostgreSQL si pas déjà en cours
$port5432 = netstat -an | Select-String ":5432"
if ($port5432) {
    Write-Host "PostgreSQL déjà démarré sur le port 5432." -ForegroundColor Green
} else {
    $dataDir = "C:\Program Files\PostgreSQL\17\data"
    Start-Process -FilePath "C:\Program Files\PostgreSQL\17\bin\postgres.exe" `
        -ArgumentList @("-D", "`"$dataDir`"") `
        -WindowStyle Hidden
    Start-Sleep -Seconds 3
    $check = netstat -an | Select-String ":5432"
    if ($check) {
        Write-Host "PostgreSQL démarré avec succès sur le port 5432." -ForegroundColor Green
    } else {
        Write-Host "Échec du démarrage PostgreSQL. Consultez les logs dans $dataDir\pg_log2.txt" -ForegroundColor Red
    }
}
