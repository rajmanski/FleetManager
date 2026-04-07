# Fleet Management - Local Development

Instrukcja uruchomienia środowiska lokalnego od zera z użyciem Dockera.

Założenie: Docker Desktop (lub Docker Engine + Compose) jest już zainstalowany.

## 1) Start kontenerów

W katalogu głównym repo:

```bash
docker compose up -d
```

To uruchamia usługi:
- `mysql`
- `backend`
- `frontend`

## 2) Przygotowanie bazy (migracje + dane testowe)

Skrypt robi pełny flow:
1. czeka na gotowość MySQL,
2. uruchamia migracje,
3. seeduje dane testowe.

### Windows (PowerShell)

```powershell
.\scripts\seed_full_app.ps1
```

### Linux/macOS

```bash
sh scripts/seed_full_app.sh
```

## 3) Logowanie do aplikacji

Po seedzie dostępne są konta demo (hasło dla wszystkich: `Test_e14!`):
- `demo_admin`
- `demo_dispatcher`
- `demo_mechanic`

## 4) Adresy usług

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8080](http://localhost:8080)
- Healthcheck API: [http://localhost:8080/ping](http://localhost:8080/ping)

## 5) Najczęstsze problemy

- Jeśli seed wywala się na połączeniu z DB:
  - sprawdź `docker compose ps`,
  - sprawdź logi: `docker compose logs mysql --tail=200`.
- Jeśli zmieniłeś dane dostępu do DB w `.env`, ustaw zgodne env vars przed odpaleniem seeda.

## 6) Przydatne komendy

```bash
docker compose ps
docker compose logs backend --tail=200
docker compose logs mysql --tail=200
docker compose down
```
