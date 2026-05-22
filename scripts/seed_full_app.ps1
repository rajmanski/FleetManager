$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$TemplateSql = Join-Path $RootDir "scripts\seed_full_app_template.sql"

$MysqlService = if ($env:MYSQL_SERVICE) { $env:MYSQL_SERVICE } else { "mysql" }
$GoImage = if ($env:GO_IMAGE) { $env:GO_IMAGE } else { "golang:1.25-alpine" }

$DbName = if ($env:DB_NAME) { $env:DB_NAME } else { "fleet_management" }
$DbUser = if ($env:DB_USER) { $env:DB_USER } else { "fleet_user" }
$DbPassword = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "changeme-password" }
$MigrateDbHost = if ($env:MIGRATE_DB_HOST) { $env:MIGRATE_DB_HOST } else { "mysql" }
$DbPort = if ($env:DB_PORT) { $env:DB_PORT } else { "3306" }
$EncryptionKey = if ($env:ENCRYPTION_KEY) { $env:ENCRYPTION_KEY } else { "0123456789abcdef0123456789abcdef" }
$PasswordHash = if ($env:PASSWORD_HASH) { $env:PASSWORD_HASH } else { '$2a$10$gkzPYmNx6hqxSHWa9DgNnOJAwhup9KUPDo2BIzZ0wlAjfu6LtnEju' }

if (!(Test-Path $TemplateSql)) { throw "Template not found: $TemplateSql" }
if ($EncryptionKey.Length -ne 32) { throw "ENCRYPTION_KEY must be 32 bytes (current: $($EncryptionKey.Length))" }

Write-Host "Waiting for MySQL in $MysqlService..."
$ready = $false
for ($i = 0; $i -lt 90; $i++) {
  & docker compose exec -T -e "MYSQL_PWD=$DbPassword" $MysqlService mysqladmin "-u$DbUser" ping -h localhost *> $null
  if ($LASTEXITCODE -eq 0) { $ready = $true; break }
  Start-Sleep -Seconds 1
}
if (-not $ready) { throw "MySQL is not ready in service $MysqlService" }

Write-Host "Running migrations via $GoImage container..."
$mysqlCid = (& docker compose ps -q $MysqlService).Trim()
if ([string]::IsNullOrWhiteSpace($mysqlCid)) { throw "Cannot detect container ID for service $MysqlService" }
$networkName = (& docker inspect -f "{{range `$k, `$_ := .NetworkSettings.Networks}}{{println `$k}}{{end}}" $mysqlCid).Trim()
if ([string]::IsNullOrWhiteSpace($networkName)) { throw "Cannot detect Docker network for service $MysqlService" }
& docker run --rm --network $networkName -v "${RootDir}\backend:/app" -w /app -e "ENCRYPTION_KEY=$EncryptionKey" -e "DB_HOST=$MigrateDbHost" -e "DB_PORT=$DbPort" -e "DB_USER=$DbUser" -e "DB_PASSWORD=$DbPassword" -e "DB_NAME=$DbName" $GoImage go run ./cmd/migrate -direction up
if ($LASTEXITCODE -ne 0) { throw "Migration failed" }

Write-Host "Seeding database $DbName..."

$rawSql = Get-Content $TemplateSql -Raw -Encoding UTF8
$rawSql = $rawSql.Replace("__PASSWORD_HASH__", $PasswordHash)

$tempFile = [System.IO.Path]::GetTempFileName()
$utf8 = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($tempFile, $rawSql, $utf8)

Write-Host "Copying SQL to container..."
docker cp $tempFile "${mysqlCid}:/tmp/seed.sql"
if ($LASTEXITCODE -ne 0) { Remove-Item $tempFile; throw "docker cp failed" }

Write-Host "Running seed..."
docker compose exec -T -e "MYSQL_PWD=$DbPassword" $MysqlService mysql "-u$DbUser" "--default-character-set=utf8mb4" $DbName -e "source /tmp/seed.sql"
$exit = $LASTEXITCODE

docker compose exec -T $MysqlService rm -f /tmp/seed.sql 2>$null
Remove-Item $tempFile

if ($exit -ne 0) { throw "Seeding failed" }

Write-Host ""
Write-Host "Seed completed."
Write-Host "Demo accounts (password: Test_e14!):"
Write-Host "  - demo_admin"
Write-Host "  - demo_dispatcher"
Write-Host "  - demo_mechanic"
