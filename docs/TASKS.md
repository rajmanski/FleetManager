# Tasks - System zarządzania flotą pojazdów ciężarowych

## E0: Setup środowiska deweloperskiego

### E0.1: Struktura projektu i Docker Compose
- [x] Utworzenie głównej struktury katalogów projektu
  ```
  fleet-management/
  ├── backend/
  ├── frontend/
  ├── docker-compose.yml
  ├── .env.example
  └── README.md
  ```
- [x] Utworzenie pliku docker-compose.yml z 3 serwisami: mysql, backend, frontend
- [x] Konfiguracja sieci Docker (network) dla komunikacji między kontenerami
- [x] Konfiguracja volumes Docker dla persystencji danych MySQL

**Dane wyjściowe:**
- Działający `docker-compose up` uruchamiający wszystkie 3 kontenery
- Komunikacja między kontenerami przez Docker network

**Edge cases:**
- Konflikt portów (3000 dla React, 8080 dla Go, 3306 dla MySQL)
- Brak upr Awnień do Docker socket

---

### E0.2: Konfiguracja MySQL container
- [x] Konfiguracja serwisu MySQL z użyciem oficjalnego obrazu `mysql:8.0` (bez własnego Dockerfile)
- [x] Konfiguracja serwisu mysql w docker-compose.yml:
  ```yaml
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
  ```
- [x] Utworzenie .env.example z przykładowymi zmiennymi środowiskowymi
- [x] Weryfikacja działania: połączenie do MySQL z hosta

**Dane wyjściowe:**
- Działająca baza MySQL dostępna na localhost:3306
- Healthcheck pokazujący "healthy"

---

### E0.3: Struktura backendu Go
- [x] Utworzenie struktury katalogów zgodnie z Go standards:
  ```
  backend/
  ├── cmd/
  │   └── server/
  │       └── main.go
  ├── internal/
  │   ├── config/
  │   ├── controller/
  │   ├── service/
  │   ├── repository/
  │   ├── middleware/
  │   └── model/
  ├── pkg/
  ├── migrations/
  ├── queries/
  ├── sqlc.yaml
  ├── go.mod
  ├── go.sum
  ├── .air.toml
  └── Dockerfile
  ```
- [x] Inicjalizacja modułu Go: `go mod init github.com/username/fleet-management-backend`

**Edge cases:**
- Naming convention dla internal packages

---

### E0.4: Konfiguracja Go packages (Gin, Air, sqlc, migrate)
- [x] Instalacja Gin framework: `go get github.com/gin-gonic/gin`
- [x] Instalacja golang-migrate: `go get -u github.com/golang-migrate/migrate/v4`
- [x] Instalacja sqlc: 
  - Pobranie binary z https://github.com/sqlc-dev/sqlc/releases
  - Lub: `go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest`
- [x] Instalacja Air (hot reload):
  - `go install github.com/air-verse/air@latest`
  - Utworzenie .air.toml z konfiguracją
- [x] Konfiguracja sqlc.yaml:
  ```yaml
  version: "2"
  sql:
    - engine: "mysql"
      queries: "queries/"
      schema: "migrations/"
      gen:
        go:
          package: "db"
          out: "internal/repository/db"
          emit_json_tags: true
          emit_prepared_queries: false
          emit_interface: true
  ```

**Dane wyjściowe:**
- go.mod z wszystkimi zależnościami
- Działający `air` dla hot reload

---

### E0.5: Dockerfile i docker-compose dla backendu Go
- [x] Utworzenie backend/Dockerfile (multi-stage build):
  ```dockerfile
  # Build stage
  FROM golang:1.21-alpine AS builder
  WORKDIR /app
  COPY go.mod go.sum ./
  RUN go mod download
  COPY . .
  RUN go build -o main cmd/server/main.go
  
  # Run stage
  FROM alpine:latest
  WORKDIR /root/
  COPY --from=builder /app/main .
  COPY --from=builder /app/.env .
  EXPOSE 8080
  CMD ["./main"]
  ```
- [x] Konfiguracja serwisu backend w docker-compose.yml:
  ```yaml
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
    depends_on:
      mysql:
        condition: service_healthy
    volumes:
      - ./backend:/app  # dla Air hot reload
    command: air
  ```
- [x] Konfiguracja .air.toml dla development z hot reload

**Dane wyjściowe:**
- Backend startuje automatycznie po uruchomieniu `docker-compose up`
- Hot reload działa - zmiany w kodzie Go automatycznie restartują serwer

---

### E0.6: Podstawowa konfiguracja Gin server
- [x] Utworzenie cmd/server/main.go z podstawowym Gin server:
  ```go
  package main
  
  import (
      "github.com/gin-gonic/gin"
      "log"
  )
  
  func main() {
      r := gin.Default()
      
      r.GET("/ping", func(c *gin.Context) {
          c.JSON(200, gin.H{
              "message": "pong",
          })
      })
      
      log.Fatal(r.Run(":8080"))
  }
  ```
- [x] Utworzenie internal/config/config.go dla konfiguracji środowiskowej
- [x] Dodanie middleware CORS dla komunikacji z frontendem
- [x] Dodanie middleware logger (Gin wbudowany)

**Weryfikacja:**
- `curl http://localhost:8080/ping` zwraca `{"message":"pong"}`

---

### E0.7: Konfiguracja golang-migrate
- [x] Utworzenie katalogu `migrations/`
- [x] Utworzenie pierwszej migracji (init schema):
  ```bash
  migrate create -ext sql -dir migrations -seq init_schema
  ```
- [x] Implementacja polecenia migracji w main.go lub osobny plik cmd/migrate/main.go
- [x] Konfiguracja połączenia do bazy: `mysql://user:pass@tcp(mysql:3306)/dbname`
- [x] Uruchomienie migracji: `migrate -path migrations -database "mysql://..." up`

**Dane wyjściowe:**
- Tabele Roles i Users utworzone w bazie danych (pierwsza migracja)
- Tabela schema_migrations śledząca wersję migracji

---

### E0.8: Struktura frontendu React
- [x] Utworzenie projektu React (Vite recommended):
  ```bash
  npm create vite@latest frontend -- --template react-ts
  ```
- [x] Struktura katalogów:
  ```
  frontend/
  ├── src/
  │   ├── components/
  │   ├── hooks/
  │   ├── services/
  │   ├── utils/
  │   ├── pages/
  │   ├── context/
  │   ├── types/
  │   ├── App.tsx
  │   └── main.tsx
  ├── public/
  ├── package.json
  ├── tsconfig.json
  ├── vite.config.ts
  └── Dockerfile
  ```

---

### E0.9: Instalacja React packages (TanStack Query, Router, etc.)
- [ ] Instalacja TanStack Query: `npm install @tanstack/react-query`
- [ ] Instalacja React Router: `npm install react-router-dom`
- [ ] Instalacja Axios (dla HTTP requests): `npm install axios`
- [ ] Instalacja UI library (według projektu Figma - w folderze /prototype)
- [ ] Konfiguracja TanStack Query provider w App.tsx:
  ```tsx
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
  
  const queryClient = new QueryClient()
  
  function App() {
    return (
      <QueryClientProvider client={queryClient}>
        {/* app content */}
      </QueryClientProvider>
    )
  }
  ```

---

### E0.10: Dockerfile i docker-compose dla frontendu React
- [ ] Utworzenie frontend/Dockerfile:
  ```dockerfile
  FROM node:18-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm install
  COPY . .
  EXPOSE 3000
  CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
  ```
- [ ] Konfiguracja serwisu frontend w docker-compose.yml:
  ```yaml
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules  # prevent overwriting
    environment:
      - VITE_API_URL=http://localhost:8080
  ```

**Dane wyjściowe:**
- React app dostępny na http://localhost:3000
- Hot reload działa (Vite HMR)

---

### E0.11: Konfiguracja axios service dla API calls
- [ ] Utworzenie src/services/api.ts:
  ```ts
  import axios from 'axios'
  
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  // Request interceptor (dodawanie JWT token)
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
  
  export default api
  ```

---

### E0.12: Weryfikacja end-to-end setup
- [ ] Test połączenia Frontend → Backend:
  - Utworzenie endpointu GET /api/v1/health w backen dzie
  - Utworzenie przycisku w React który wywołuje ten endpoint przez TanStack Query
  - Weryfikacja odpowiedzi w UI
- [ ] Test połączenia Backend → Database:
  - Endpoint GET /api/v1/db-check który wykonuje SELECT 1
  - Weryfikacja działania przez Postman/curl
- [ ] Weryfikacja hot reload w obu środowiskach:
  - Zmiana w Go - automatyczny restart
  - Zmiana w React - automatyczne przeładowanie (HMR)

**Kryteria akceptacji:**
- `docker-compose up` uruchamia wszystkie 3 serwisy bez błędów
- Frontend (React) dostępny na http://localhost:3000
- Backend (Go) dostępny na http://localhost:8080
- MySQL dostępny na localhost:3306
- Komunikacja Frontend → Backend działa
- Hot reload działa w obu środowiskach
- Migracje są gotowe do uruchomienia

---

## E1: Uwierzytelnianie i zarządzanie użytkownikami

### E1.1: Projektowanie schematu bazy dla użytkowników
- [ ] Utworzenie tabeli `users` (id, login, password_hash, role, email, created_at, updated_at)
- [ ] Utworzenie tabeli `roles` (id, name, description) - OPCJONALNE jeśli role są hardcoded
- [ ] Dodanie indeksów (unique na login, index na role)
- [ ] Dodanie constraints (NOT NULL, check dla role ENUM)

**API:** N/A (tylko DB)  
**Dane wejściowe:** Schemat DB  
**Dane wyjściowe:** Utworzone tabele  
**Edge cases:** Migracja danych jeśli istnieją już użytkownicy  

---

### E1.2: Implementacja hashowania haseł (bcrypt)
- [ ] Utworzenie funkcji do hashowania hasła przy rejestracji
- [ ] Utworzenie funkcji do weryfikacji hasła przy logowaniu
- [ ] Użycie bcrypt z odpowiednim cost factor (min. 10)

**API:** Wewnętrzne funkcje backendu  
**Dane wejściowe:** Hasło w plaintext  
**Dane wyjściowe:** Hash bcrypt  
**Edge cases:** Bardzo długie hasła, znaki specjalne  

---

### E1.3: Endpoint logowania
- [ ] Utworzenie POST /api/v1/auth/login
- [ ] Walidacja danych wejściowych (login + hasło niepuste)
- [ ] Weryfikacja credentials w bazie danych
- [ ] Implementacja blokady konta po 3 nieudanych próbach (REQ-AUTH-003)

**API:** `POST /api/v1/auth/login`  
**Dane wejściowe:**  
```json
{
  "login": "string",
  "password": "string"
}
```
**Dane wyjściowe (sukces):**  
```json
{
  "token": "JWT_token_string",
  "user": {
    "id": 1,
    "login": "admin",
    "role": "Administrator"
  }
}
```
**Dane wyjściowe (błąd):**  
- 401: Nieprawidłowe credentials
- 403: Konto zablokowane
**Edge cases:** 
- Blokada konta - jak odblokować? (ręcznie przez admina w DB?)
- Czy login jest case-sensitive?

---

### E1.4: Implementacja JWT
- [ ] Utworzenie funkcji generującej JWT (payload: userID, role, exp)
- [ ] Utworzenie middleware weryfikującego JWT przy każdym zapytaniu
- [ ] Obsługa wygasłych tokenów (401 Unauthorized)
- [ ] Określenie czasu ważności tokenu (BRAKUJĄCA DECYZJA - domyślnie 24h?)

**API:** Middleware dla wszystkich chronionych endpointów  
**Dane wejściowe:** Token w header: `Authorization: Bearer <token>`  
**Dane wyjściowe:** User context (userID, role) LUB 401  
**Edge cases:**  
- Token wygasł w trakcie długiej sesji użytkownika
- Refresh token? (brak w wymaganiach - DECYZJA)

---

### E1.4b: Implementacja JWT Refresh Token
- [ ] Generowanie refresh token (JWT z dłuższym czasem ważności: 7 dni)
- [ ] Przechowywanie refresh token w httpOnly cookie
- [ ] Endpoint POST /api/v1/auth/refresh (odświeżanie access token)
  - Odczyt refresh token z cookie
  - Walidacja refresh token
  - Generowanie nowego access token
  - Zwrócenie nowego access token (ten sam refresh token)

**Dane wyjściowe:**
```json
{
  "access_token": "eyJhbGc...",
  "expires_in": 86400
}
```

**Security:**
- Refresh token w httpOnly cookie (nie dostępny z JavaScript)
- SameSite=Strict dla CSRF protection
- Secure flag w production (HTTPS only)

**Edge cases:**
- Refresh token wygasły (401, wymaga re-login)
- Refresh token invalid (401)
- Refresh token rotacja (optional v2.0)

---

### E1.4c: Frontend - automatyczne odświeżanie tokenu
- [ ] Axios interceptor dla 401 Unauthorized:
  - Wywołanie POST /api/v1/auth/refresh
  - Jeśli sukces: retry original request z nowym tokenem
  - Jeśli fail: redirect do /login
- [ ] Timer dla proaktywnego odświeżania (5 min przed wygaśnięciem)
- [ ] Wyświetlenie komunikatu przy wylogowaniu z powodu wygasłej sesji

---

### E1.5b: Backend API - logika blokowania konta
- [ ] W endpoint POST /api/v1/auth/login dodać:
  - Sprawdzenie locked_until przed walidacją hasła
  - Jeśli locked_until > NOW(): błąd 403 "Account locked until {time}"
  - Po błędnym haśle:
    - failed_login_attempts++
    - IF failed_login_attempts >= 3: locked_until = NOW() + 30 minutes
  - Po poprawnym logowaniu:
    - failed_login_attempts = 0
    - locked_until = NULL

**Komunikaty błędów:**
- "Account is locked until {timestamp}. Try again later or contact administrator."
- "Invalid credentials. X attempts remaining before account lock."

---

### E1.6b: Backend API - odblokowanie konta przez administratora
- [ ] Endpoint PUT /api/v1/users/{id}/unlock (tylko Administrator)
- [ ] Ustawienie:
  - failed_login_attempts = 0
  - locked_until = NULL
- [ ] Log w Changelogger: "Account manually unlocked by admin"

**Autoryzacja:** Tylko Administrator

---

### E1.8b: Frontend - zarządzanie użytkownikami - odblokowanie
- [ ] W liście użytkowników (E1.8) dodać kolumnę "Status"
- [ ] Ikona 🔒 dla zablokowanych kont (locked_until > NOW())
- [ ] Tooltip pokazujący "Locked until {timestamp}"
- [ ] Przycisk "Odblokuj" dla Administratora (wywołanie E1.6b)
- [ ] Confirmation dialog przed odblokowaniem

---

### E1.5: Middleware autoryzacji RBAC
- [ ] Utworzenie middleware sprawdzającego uprawnienia na podstawie roli
- [ ] Implementacja macierzy uprawnień zgodnie z tabelą 5.1
- [ ] Zwracanie 403 Forbidden przy braku uprawnień

**API:** Middleware dla wszystkich endpointów wymagających autoryzacji  
**Dane wejściowe:** User role z tokenu JWT, endpoint path  
**Dane wyjściowe:** Pass LUB 403 Forbidden  
**Edge cases:**  
- Zmiana roli użytkownika podczas aktywnej sesji (wymagany re-login?)

---

### E1.6: CRUD użytkowników (tylko Administrator)
- [ ] GET /api/v1/admin/users (lista wszystkich użytkowników)
- [ ] GET /api/v1/admin/users/{id} (szczegóły użytkownika)
- [ ] POST /api/v1/admin/users (utworzenie nowego użytkownika)
- [ ] PUT /api/v1/admin/users/{id} (edycja użytkownika)
- [ ] DELETE /api/v1/admin/users/{id} (usunięcie użytkownika - soft delete?)

**API:** Endpoints opisane powyżej  
**Autoryzacja:** Tylko rola Administrator  
**Edge cases:**  
- Czy można usunąć samego siebie?
- Soft delete czy hard delete?
- Czy można zmienić hasło innego użytkownika?

---

### E1.7: Frontend - strona logowania
- [ ] Formularz logowania (login, hasło)
- [ ] Obsługa błędów (nieprawidłowe credentials, konto zablokowane)
- [ ] Zapisanie tokenu JWT w localStorage/sessionStorage
- [ ] Przekierowanie po zalogowaniu

**Edge cases:**  
- XSS protection (sanityzacja inputów)
- Co jeśli localStorage nie działa?

---

### E1.8: Frontend - zarządzanie użytkownikami (tylko Admin)
- [ ] Strona z listą użytkowników
- [ ] Formularz dodawania użytkownika
- [ ] Formularz edycji użytkownika
- [ ] Potwierdzenie przed usunięciem użytkownika

---

## E2: Zarządzanie flotą pojazdów

### E2.1: Projektowanie schematu bazy dla pojazdów
- [ ] Utworzenie tabeli `vehicles` (id, vin, make, model, year, mileage, status, created_at, updated_at)
- [ ] Dodanie unique constraint na VIN
- [ ] Dodanie ENUM dla status (Available, In_Use, In_Service, Decommissioned - ZAŁOŻENIE)
- [ ] Dodanie indeksów (unique na VIN, index na status)

**Edge cases:**  
- Jakie dokładnie statusy pojazdu? (dokumentacja nie precyzuje)

---

### E2.2: Walidacja numeru VIN
- [ ] Implementacja funkcji walidującej strukturę VIN (17 znaków, checksum)
- [ ] Walidacja przy dodawaniu/edycji pojazdu

**Dane wejściowe:** VIN string  
**Dane wyjściowe:** true/false  
**Edge cases:**  
- VIN zawiera litery nieakceptowane (I, O, Q)
- Historyczne pojazdy z VIN < 17 znaków?

---

### E2.3: Backend API - CRUD pojazdów
- [ ] GET /api/v1/vehicles (lista pojazdów z filtrowaniem i paginacją)
- [ ] GET /api/v1/vehicles/{id} (szczegóły pojazdu)
- [ ] POST /api/v1/vehicles (utworzenie pojazdu)
- [ ] PUT /api/v1/vehicles/{id} (edycja pojazdu)
- [ ] DELETE /api/v1/vehicles/{id} (usunięcie pojazdu)

**Autoryzacja:**  
- Administrator, Mechanik: R/W
- Spedytor: R
**Edge cases:**  
- Czy można usunąć pojazd z historią zleceń?
- Soft delete czy hard delete?

---

### E2.4: Backend API - zmiana statusu pojazdu
- [ ] PATCH /api/v1/vehicles/{id}/status (zmiana statusu np. "In_Service")
- [ ] Walidacja przejść między statusami (BRAK SPECYFIKACJI - ZAŁOŻENIE: dowolne)

**Dane wejściowe:**  
```json
{
  "status": "In_Service"
}
```
**Edge cases:**  
- Czy można zmienić status pojazdu, który ma aktywne zlecenie?

---


### E2.4b: Backend API - soft delete pojazdu
- [ ] Modyfikacja DELETE /api/v1/vehicles/{id}:
  - Zamiast DELETE FROM Vehicles: UPDATE Vehicles SET deleted_at = NOW() WHERE vehicle_id = ...
  - Sprawdzenie czy pojazd nie ma aktywnego Trip (status IN ('Scheduled', 'Active'))
  - Jeśli ma aktywny Trip: 403 Forbidden "Cannot delete vehicle with active trips"
- [ ] Logika w service layer:
  - CheckActiveTrips(vehicle_id) bool
  - SoftDeleteVehicle(vehicle_id) error

**Edge cases:**
- Pojazd ma aktywny Trip (błąd 403)
- Pojazd ma zaplanowany Trip w przyszłości (dozwolone, soft delete)
- Pojazd już usunięty (404 Not Found)

---

### E2.5b: Backend API - restore usuniętego pojazdu
- [ ] Endpoint PUT /api/v1/vehicles/{id}/restore (tylko Administrator)
- [ ] Ustawienie deleted_at = NULL
- [ ] Sprawdzenie czy VIN nie koliduje z innym active vehicle

**Autoryzacja:** Tylko Administrator

---

### E2.5c: Frontend - filtrowanie usuniętych pojazdów
- [ ] W liście pojazdów (E2.5) dodać checkbox "Pokaż usunięte" (tylko Administrator)
- [ ] Domyślnie: WHERE deleted_at IS NULL
- [ ] Jeśli zaznaczone: pokazuj wszystkie
- [ ] Oznaczenie usuniętych (szary kolor, ikona 🗑️)
- [ ] Przycisk "Przywróć" dla usuniętych (tylko Administrator)

---

### E2.5: Frontend - lista pojazdów
- [ ] Tabela z listą pojazdów (VIN, marka, model, przebieg, status)
- [ ] Filtrowanie po statusie
- [ ] Wyszukiwanie po VIN/marce
- [ ] Paginacja

---

### E2.6: Frontend - formularz dodawania/edycji pojazdu
- [ ] Pola: VIN, marka, model, rok produkcji, przebieg
- [ ] Walidacja VIN po stronie frontendu
- [ ] Obsługa błędów (duplikat VIN, nieprawidłowa walidacja)

---

### E2.7: Frontend - widok szczegółów pojazdu
- [ ] Wyświetlenie wszystkich danych pojazdu
- [ ] Historia przebiegu (jeśli dostępna)
- [ ] Przyciski edycji/usunięcia (z uwzględnieniem uprawnień)

---

## E3: Zarządzanie kierowcami

### E3.1: Projektowanie schematu bazy dla kierowców
- [ ] Utworzenie tabeli `drivers` (id, first_name, last_name, pesel, phone, email, status, created_at, updated_at)
- [ ] Dodanie unique constraint na PESEL
- [ ] Dodanie ENUM dla status (Active, Archived - ZAŁOŻENIE)
- [ ] Szyfrowanie kolumny PESEL (RODO)

**Edge cases:**  
- Jak dokładnie szyfrować PESEL? (AES_ENCRYPT?)
- Co oznacza "archiwizacja kierowcy"? (status=Archived? soft delete?)

---

### E3.2: Walidacja PESEL
- [ ] Implementacja funkcji walidującej PESEL (11 cyfr + checksum)
- [ ] Walidacja przy dodawaniu/edycji kierowcy

**Dane wejściowe:** PESEL string  
**Dane wyjściowe:** true/false  
**Edge cases:**  
- Cudzoziemcy bez PESEL?

---

### E3.3: Backend API - CRUD kierowców
- [ ] GET /api/v1/drivers (lista kierowców)
- [ ] GET /api/v1/drivers/{id} (szczegóły kierowcy)
- [ ] POST /api/v1/drivers (utworzenie kierowcy)
- [ ] PUT /api/v1/drivers/{id} (edycja kierowcy)
- [ ] DELETE /api/v1/drivers/{id} (archiwizacja kierowcy?)

**Autoryzacja:**  
- Administrator, Mechanik: R/W
- Spedytor: R
**Edge cases:**  
- Czy można usunąć kierowcę z historią zleceń?
- DELETE = archiwizacja (status=Archived) czy hard delete?

---

### E3.2b: Implementacja szyfrowania PESEL (AES-256)
- [ ] Utworzenie pakietu internal/crypto z funkcjami:
  - `EncryptPESEL(pesel string, key []byte) (string, error)` - zwraca base64
  - `DecryptPESEL(encrypted string, key []byte) (string, error)` - zwraca PESEL
- [ ] Konfiguracja klucza szyfrowania:
  - Environment variable: ENCRYPTION_KEY (32 bajty dla AES-256)
  - W config.go: odczyt i walidacja długości klucza
- [ ] Użycie w repository layer:
  - Przed INSERT/UPDATE: automatyczne szyfrowanie
  - Po SELECT: automatyczne deszyfrowanie

**Algorytm:**
```go
// AES-256-GCM
key := []byte(os.Getenv("ENCRYPTION_KEY")) // 32 bytes
block, _ := aes.NewCipher(key)
gcm, _ := cipher.NewGCM(block)
nonce := make([]byte, gcm.NonceSize())
ciphertext := gcm.Seal(nonce, nonce, []byte(pesel), nil)
return base64.StdEncoding.EncodeToString(ciphertext)
```

**Edge cases:**
- Brak klucza w .env (panic at startup)
- Klucz nieprawidłowej długości (panic)
- Błąd deszyfrowania (corrupted data - log error, zwróć masked value "***")

---

### E3.2c: Wyszukiwanie po PESEL
- [ ] Query builder dla wyszukiwania:
  - SELECT wszystkie rekordy WHERE deleted_at IS NULL
  - Deszyfrowanie PESEL w aplikacji (loop)
  - Filtrowanie w pamięci (pesel == search_term)
- [ ] Dla małej liczby rekordów (<1000) akceptowalne
- [ ] Opcjonalnie: cache w pamięci (TTL 5 min)

**Uwaga:** To nie jest optymalne dla dużej liczby rekordów, ale akceptowalne dla MVP (kilkudziesięciu kierowców).

---

### E3.3b: Backend API - soft delete kierowcy
- [ ] Modyfikacja DELETE /api/v1/drivers/{id}:
  - Zamiast DELETE FROM Drivers: UPDATE Drivers SET deleted_at = NOW()
  - Sprawdzenie czy kierowca nie ma aktywnego Trip (status='Active' lub 'Scheduled')
  - Jeśli ma aktywny Trip: 403 Forbidden "Cannot delete driver with active trips"

---

### E3.3c: Backend API - odzyskiwanie usuniętego kierowcy
- [ ] Endpoint PUT /api/v1/drivers/{id}/restore (tylko Administrator)
- [ ] Ustawienie deleted_at = NULL
- [ ] Sprawdzenie czy PESEL nie koliduje z innym active driver

---

### E3.5b: Frontend - filtrowanie usuniętych kierowców
- [ ] W liście kierowców (E3.5) dodać checkbox "Pokaż usunięte"
- [ ] Domyślnie: pokazuj tylko WHERE deleted_at IS NULL
- [ ] Jeśli checkbox zaznaczony: pokazuj wszystkie
- [ ] Oznaczenie usuniętych (szary kolor, ikona 🗑️)
- [ ] Przycisk "Przywróć" dla usuniętych (tylko Administrator)

---

### E3.4: Backend API - sprawdzanie dostępności kierowcy
- [ ] GET /api/v1/drivers/{id}/availability?date=YYYY-MM-DD
- [ ] Sprawdzenie czy kierowca ma przypisane zlecenie w danym okresie

**Dane wyjściowe:**  
```json
{
  "driver_id": 1,
  "date": "2026-02-15",
  "available": false,
  "reason": "Assigned to order #123"
}
```
**Edge cases:**  
- Kierowca na urlopie (brak w wymaganiach)
- Kierowca z ważnymi uprawnieniami ale archiwizowany

---

### E3.5: Frontend - lista kierowców
- [ ] Tabela z listą kierowców (imię, nazwisko, PESEL zaszyfrowany?, status)
- [ ] Filtrowanie po statusie
- [ ] Wyszukiwanie po imieniu/nazwisku

---

### E3.6: Frontend - formularz dodawania/edycji kierowcy
- [ ] Pola: imię, nazwisko, PESEL, telefon, email
- [ ] Walidacja PESEL po stronie frontendu
- [ ] Obsługa błędów (duplikat PESEL)

---

## E4: Zarządzanie uprawnieniami kierowców

**UWAGA:** Zgodnie z DATABASE_SCHEMA.md, NIE MA osobnej tabeli Certifications. Certyfikaty są przechowywane jako pola w tabeli Drivers.

### E4.1: Dodanie kolumn dla certyfikatów do tabeli Drivers
- [ ] Sprawdzenie czy kolumny już istnieją w Drivers (powinny być z migracji init):
  - `license_number VARCHAR(50)` - numer prawa jazdy
  - `license_expiry_date DATE NULL` - data ważności prawa jazdy
  - `adr_certified TINYINT(1) DEFAULT 0` - czy ma certyfikat ADR
  - `adr_expiry_date DATE NULL` - data ważności ADR
- [ ] Jeśli brakuje, dodać przez migrację

**Dane wyjściowe:** Drivers ma wszystkie kolumny dla certyfikatów

---

### E4.2: Backend API - aktualizacja danych certyfikatów kierowcy
- [ ] Rozszerzenie PUT /api/v1/drivers/{id} o możliwość edycji pól certyfikatów
- [ ] Walidacja dat (expiry_date >= current_date przy ustawianiu)
- [ ] Walidacja że adr_expiry_date może być ustawiona tylko gdy adr_certified=1

**Dane wejściowe (przykład):**
```json
{
  "license_number": "ABC123456",
  "license_expiry_date": "2027-12-31",
  "adr_certified": true,
  "adr_expiry_date": "2026-06-30"
}
```

**Edge cases:**
- Próba ustawienia adr_expiry_date gdy adr_certified=0 (błąd 400)
- Data w przeszłości (warning, ale nie błąd - może być już wygasłe)

---

### E4.3: Backend API - weryfikacja uprawnień ADR
- [ ] Funkcja service layer: `CanDriverTransportHazardousCargo(driver_id, order_id) bool`
- [ ] Sprawdzenie czy kierowca ma adr_certified=1
- [ ] Sprawdzenie czy adr_expiry_date >= NOW() lub IS NULL (akceptujemy brak daty)
- [ ] Sprawdzenie czy zlecenie zawiera ładunek typu Hazardous (JOIN z Cargo)
- [ ] Użycie tej funkcji w E7 (Trips) przed przypisaniem

**Dane wyjściowe:**
```json
{
  "can_transport": false,
  "reason": "Driver's ADR certificate expired on 2025-12-31"
}
```

**Edge cases:**
- Kierowca bez ADR próbuje wziąć Hazardous cargo (403 Forbidden)
- ADR wygasło wczoraj (403)
- Zlecenie ma mix General + Hazardous cargo (wymaga ADR)

---

### E4.4: Backend service - sprawdzanie wygasających certyfikatów
- [ ] Funkcja wywoływana przez scheduler (E14): `CheckExpiringCertificates()`
- [ ] SELECT na Drivers WHERE:
  - `license_expiry_date BETWEEN NOW() AND NOW() + INTERVAL 30 DAY` OR
  - `adr_expiry_date BETWEEN NOW() AND NOW() + INTERVAL 30 DAY`
- [ ] Dla każdego znalezionego kierowcy:
  - Pobranie powiązanego vehicle_id z Assignments (WHERE assigned_to IS NULL)
  - Utworzenie Alert dla pojazdu (jeśli kierowca przypisany) lub ogólnego alertu
  - alert_type: 'driver_license_expiry' lub 'driver_adr_expiry'

**Dane wyjściowe:**
Lista utworzonych alertów

---

### E4.5: Frontend - wyświetlanie statusu certyfikatów
- [ ] W formularzu kierowcy (E3.6) dodać sekcję "Uprawnienia":
  - Input: Numer prawa jazdy
  - DatePicker: Data ważności prawa jazdy
  - Checkbox: Certyfikat ADR
  - DatePicker: Data ważności ADR (enabled tylko gdy checkbox zaznaczony)
- [ ] Walidacja po stronie frontendu:
  - Data nie może być w dalekiej przeszłości (> 10 lat)
  - Jeśli data < NOW(), pokazać warning "Certyfikat wygasł"

---

### E4.6: Frontend - oznaczanie kierowców z wygasłymi certyfikatami
- [ ] W liście kierowców (E3.5) dodać kolumnę "Status uprawnień"
- [ ] Ikony/kolory:
  - ✅ Zielony: Wszystkie certyfikaty ważne
  - ⚠️ Żółty: Certyfikat wygasa w ciągu 30 dni
  - ❌ Czerwony: Certyfikat wygasły
- [ ] Tooltip pokazujący szczegóły (która data, kiedy wygasa)
- [ ] Filtr: "Pokaż tylko kierowców z ważnymi certyfikatami"

---

### E4.7: Frontend - walidacja przy przypisywaniu kierowcy do Hazardous cargo
- [ ] W formularzu tworzenia Trip (E7.8):
  - Sprawdzenie typu ładunków w zleceniu (API call do /api/v1/orders/{id}/cargo)
  - Jeśli zawiera Hazardous:
    - Filtrowanie listy kierowców (tylko ci z adr_certified=1 i ważnym ADR)
    - Komunikat jeśli brak dostępnych kierowców z ADR
  - Podświetlenie kierowców z ADR (badge "ADR")

**Edge cases:**
- Wszystkie kierowcy z ADR są zajęci (komunikat, sugestia zmiany terminu)
- Kierowca miał ADR przy tworzeniu Trip, ale wygasło przed rozpoczęciem (sprawdzenie przy start)

---


## E5: Planowanie tras i integracja z Google Maps

### E5.1: Konfiguracja Google Maps API
- [ ] Uzyskanie API key
- [ ] Konfiguracja dozwolonych domen
- [ ] Ustawienie limitów zapytań (monitoring kosztów)

**Edge cases:**  
- Przekroczenie limitu zapytań API
- Awaria Google Maps API

---

### E5.2: Backend API - geocoding adresu
- [ ] POST /api/v1/routes/geocode
- [ ] Wywołanie Google Maps Geocoding API
- [ ] Zwrócenie współrzędnych (lat, lng)

**Dane wejściowe:**  
```json
{
  "address": "Warszawa, Plac Defilad 1"
}
```
**Dane wyjściowe:**  
```json
{
  "address": "Warszawa, Plac Defilad 1",
  "latitude": 52.2297,
  "longitude": 21.0122
}
```
**Edge cases:**  
- Adres niejednoznaczny (wiele wyników)
- Adres nie znaleziony

---

### E5.3: Backend API - kalkulacja trasy
- [ ] POST /api/v1/routes/calculate
- [ ] Wywołanie Google Maps Directions API
- [ ] Obliczenie dystansu, czasu przejazdu
- [ ] Obsługa waypoints (punkty pośrednie)

**Dane wejściowe:**  
```json
{
  "origin": {"lat": 52.2297, "lng": 21.0122},
  "destination": {"lat": 50.0647, "lng": 19.9450},
  "waypoints": [
    {"lat": 51.7592, "lng": 19.4560}
  ]
}
```
**Dane wyjściowe:**  
```json
{
  "distance_km": 350.5,
  "duration_minutes": 240,
  "polyline": "encoded_polyline_string"
}
```
**Edge cases:**  
- Brak trasy między punktami
- Zbyt wiele waypoints (limit Google Maps?)

---

### E5.4: Frontend - mapa interaktywna
- [ ] Integracja Google Maps JavaScript API
- [ ] Wyświetlenie mapy
- [ ] Oznaczenie punktów (załadunek, rozładunek, waypoints)
- [ ] Rysowanie trasy (polyline)

---

### E5.5: Frontend - formularz planowania trasy
- [ ] Pole adres załadunku (autocomplete z Google Places)
- [ ] Pole adres rozładunku
- [ ] Możliwość dodania waypoints (dynamiczna lista)
- [ ] Przycisk "Oblicz trasę"
- [ ] Wyświetlenie wyniku (dystans, czas)

---

### E5.6: Backend API - CRUD RouteWaypoints
- [ ] GET /api/v1/routes/{route_id}/waypoints (lista waypoints dla trasy)
- [ ] POST /api/v1/routes/{route_id}/waypoints (dodanie waypoint)
- [ ] PUT /api/v1/waypoints/{id} (edycja waypoint - adres, kolejność)
- [ ] DELETE /api/v1/waypoints/{id} (usunięcie waypoint)
- [ ] PATCH /api/v1/waypoints/reorder (zmiana kolejności - bulk update sequence_order)

**Dane wejściowe (POST):**
```json
{
  "sequence_order": 1,
  "address": "ul. Długa 5, Warszawa",
  "latitude": 52.2297,
  "longitude": 21.0122,
  "action_type": "Pickup"
}
```

**Dane wyjściowe:**
```json
{
  "waypoint_id": 15,
  "route_id": 8,
  "sequence_order": 1,
  "address": "ul. Długa 5, Warszawa",
  "latitude": 52.2297,
  "longitude": 21.0122,
  "action_type": "Pickup"
}
```

**Walidacja:**
- sequence_order musi być ciągły (1,2,3... bez luk)
- Limit 10 waypoints na trasę (walidacja w POST)
- action_type: tylko 'Pickup', 'Dropoff', 'Stopover'
- latitude/longitude: validacja zakresu (-90 to 90, -180 to 180)

**Edge cases:**
- Usunięcie waypoint powoduje przesunięcie sequence_order (auto-renumber)
- Czy można edytować waypoints gdy Trip jest Active? (403 Forbidden)

---

### E5.7: Backend API - automatyczne renumerowanie waypoints
- [ ] Trigger lub service function po DELETE waypoint:
  - UPDATE RouteWaypoints SET sequence_order = sequence_order - 1 WHERE route_id=... AND sequence_order > deleted_sequence
- [ ] Walidacja ciągłości przy INSERT/UPDATE

---

### E5.8: Frontend - zarządzanie waypoints z drag-and-drop
- [ ] W formularzu planowania trasy (E5.5) dodać sekcję "Punkty pośrednie"
- [ ] Lista waypoints z możliwością:
  - Drag-and-drop do zmiany kolejności (react-beautiful-dnd lub podobny)
  - Kliknięcie na mapie aby dodać waypoint
  - Edycja adresu (z autocomplete Google Places)
  - Wybór typu akcji (Pickup/Dropoff/Stopover)
  - Usunięcie waypoint (ikona X)
- [ ] Walidacja: max 10 waypoints
- [ ] Numeracja automatyczna (1, 2, 3...)
- [ ] Przycisk "Dodaj punkt pośredni"

**UI/UX:**
- Waypoints pokazane jako lista z ikonami drag handle
- Mapa pokazuje route z numerowanymi pinezkami
- Linia łącząca waypoints w kolejności

---

### E5.9: Frontend - przypisywanie ładunków do waypoints
- [ ] W formularzu ładunku (E6.9) dodać select "Punkt rozładunku"
- [ ] Lista waypoints z trasy (tylko te z action_type='Dropoff' lub 'Stopover')
- [ ] Opcja "Brak konkretnego punktu" (destination_waypoint_id = NULL)
- [ ] Pokazanie na mapie które ładunki jadą do którego waypoint (kolory?)

---


## E6: Zarządzanie zleceniami transportowymi

### E6.1: Projektowanie schematu bazy dla zleceń
- [ ] Utworzenie tabeli `orders` (id, client_id, cargo_type, cargo_weight_kg, cargo_volume_m3, price, status, created_at, updated_at)
- [ ] Dodanie foreign key do `clients` (BRAK W WYMAGANIACH - ZAŁOŻENIE: trzeba dodać tabelę clients)
- [ ] Dodanie ENUM dla status (Created, In_Progress, Completed, Cancelled - ZAŁOŻENIE)

**Edge cases:**  
- Brak tabeli `clients` w dokumentacji - czy tworzymy?

---

### E6.2: Backend API - CRUD klientów
- [ ] GET /api/v1/clients (lista klientów z paginacją)
- [ ] GET /api/v1/clients/{id} (szczegóły klienta)
- [ ] POST /api/v1/clients (utworzenie klienta)
- [ ] PUT /api/v1/clients/{id} (edycja klienta)
- [ ] DELETE /api/v1/clients/{id} (soft delete - ustawienie deleted_at)

**Dane wejściowe (POST):**
```json
{
  "company_name": "Firma Transportowa Sp. z o.o.",
  "nip": "1234567890",
  "address": "ul. Kwiatowa 10, Kraków",
  "contact_email": "kontakt@firma.pl"
}
```

**Walidacja:**
- NIP: dokładnie 10 cyfr
- NIP: unikalny (nie może być duplikatów wśród active clients)
- company_name: min 3 znaki
- contact_email: validacja formatu email

**Autoryzacja:** Spedytor (R/W), Administrator (R/W)

**Edge cases:**
- Próba usunięcia klienta który ma zlecenia (soft delete OK, ale wyświetlić warning)
- Duplikat NIP (400 Bad Request z komunikatem)

---

### E6.3: Backend API - walidacja NIP
- [ ] Funkcja `ValidateNIP(nip string) (bool, error)`
- [ ] Sprawdzenie długości (10 cyfr)
- [ ] Sprawdzenie czy tylko cyfry
- [ ] Walidacja checksum NIP (algorytm REGON/NIP)
- [ ] Użycie w POST i PUT /api/v1/clients

**Walidacja checksum NIP:**
```
Wagi: 6,5,7,2,3,4,5,6,7
Suma: (nip[0]*6 + nip[1]*5 + ... + nip[8]*7) % 11
Checksum: nip[9] == suma
```

---

### E6.4: Backend service - odzyskiwanie usuniętych klientów
- [ ] PUT /api/v1/clients/{id}/restore (tylko Administrator)
- [ ] Ustawienie deleted_at = NULL
- [ ] Sprawdzenie czy NIP nie koliduje z innym active client

**Autoryzacja:** Tylko Administrator

---

### E6.5: Frontend - lista klientów
- [ ] Tabela z kolumnami:
  - Nazwa firmy
  - NIP
  - Adres
  - Email kontaktowy
  - Akcje (Edytuj, Usuń)
- [ ] Wyszukiwanie po nazwie lub NIP
- [ ] Paginacja (50 per page)
- [ ] Filtr: "Pokaż usunięte" (tylko Administrator)

---

### E6.6: Frontend - formularz klienta
- [ ] Pola:
  - Input: Nazwa firmy
  - Input: NIP (10 cyfr, formatowanie: XXX-XXX-XX-XX)
  - Textarea: Adres
  - Input: Email kontaktowy
- [ ] Walidacja po stronie frontu:
  - NIP: tylko cyfry, 10 znaków
  - Email: format email
  - Nazwa: min 3 znaki
- [ ] Przycisk "Zapisz"

**Auto-formatowanie NIP:**
- Podczas wpisywania: automatyczne dodawanie kresek
- Przed wysłaniem: usunięcie kresek (backend otrzymuje same cyfry)

---

### E6.7: Frontend - autocomplete klienta w zleceniu
- [ ] W formularzu zlecenia (E6.11) pole wyboru klienta
- [ ] Autocomplete z wyszukiwaniem (debounce 300ms):
  - GET /api/v1/clients?search={query}&limit=10
  - Wyszukiwanie po company_name i NIP
- [ ] Wyświetlanie: "Nazwa firmy (NIP: XXX-XXX-XX-XX)"
- [ ] Możliwość szybkiego dodania nowego klienta (przycisk "+", modal)

---



### E6.2: Projektowanie schematu bazy dla klientów (ZAŁOŻENIE)
- [ ] Utworzenie tabeli `clients` (id, name, nip, address, phone, email, created_at)
- [ ] Dodanie unique constraint na NIP

**UWAGA:** Moduł zarządzania klientami nie jest opisany w dokumentacji - to ZAŁOŻENIE.

---

### E6.3: Backend API - CRUD zleceń
- [ ] GET /api/v1/orders (lista zleceń z filtrowaniem)
- [ ] GET /api/v1/orders/{id} (szczegóły zlecenia)
- [ ] POST /api/v1/orders (utworzenie zlecenia)
- [ ] PUT /api/v1/orders/{id} (edycja zlecenia)
- [ ] DELETE /api/v1/orders/{id} (usunięcie/anulowanie zlecenia)

**Autoryzacja:** Spedytor (R/W), Administrator (R/W)  

---

### E6.4: Backend API - wybór klienta
- [ ] GET /api/v1/clients (lista klientów - autocomplete)
- [ ] GET /api/v1/clients/{id} (szczegóły klienta)

**UWAGA:** CRUD klientów nie jest w zakresie? (brak w dokumentacji)

---

### E6.5: Frontend - lista zleceń
- [ ] Tabela z listą zleceń (ID, klient, typ ładunku, status)
- [ ] Filtrowanie po statusie
- [ ] Wyszukiwanie po kliencie

---

### E6.6: Frontend - formularz tworzenia zlecenia
- [ ] Wybór klienta (autocomplete)
- [ ] Pola: typ ładunku, waga, objętość, cena
- [ ] Przycisk "Utwórz zlecenie"


### E6.7: Backend API - CRUD ładunków (Cargo)
- [ ] GET /api/v1/orders/{order_id}/cargo (lista ładunków dla zlecenia)
- [ ] POST /api/v1/orders/{order_id}/cargo (dodanie ładunku do zlecenia)
- [ ] PUT /api/v1/cargo/{id} (edycja ładunku)
- [ ] DELETE /api/v1/cargo/{id} (usunięcie ładunku ze zlecenia)

**Dane wejściowe (POST):**
```json
{
  "description": "Palety z elektroniką",
  "weight_kg": 1500.50,
  "volume_m3": 12.5,
  "cargo_type": "General",
  "destination_waypoint_id": null
}
```

**Autoryzacja:** Spedytor (R/W), Administrator (R/W)

**Edge cases:**
- Usunięcie ładunku gdy zlecenie jest InProgress (403 Forbidden)
- Suma wag przekracza capacity_kg pojazdu (validation przy Trip creation)

---

### E6.8: Backend API - przypisanie ładunku do waypoint
- [ ] PUT /api/v1/cargo/{id}/assign-waypoint
- [ ] Walidacja że waypoint_id należy do trasy tego zlecenia
- [ ] Ustawienie destination_waypoint_id w Cargo

**Dane wejściowe:**
```json
{
  "destination_waypoint_id": 5
}
```

**Edge cases:**
- Waypoint należy do innej trasy (400 Bad Request)
- Waypoint typu "Pickup" jako destination (warning, ale dozwolone)

---

### E6.9: Frontend - zarządzanie ładunkami w zleceniu
- [ ] W formularzu zlecenia (E6.6) dodać sekcję "Ładunki"
- [ ] Lista ładunków z możliwością dodania/usunięcia
- [ ] Dla każdego ładunku:
  - Input: Opis
  - Input: Waga (kg)
  - Input: Objętość (m³)
  - Select: Typ (General/Refrigerated/Hazardous)
  - Select: Punkt rozładunku (opcjonalny, z waypoints)
- [ ] Przycisk "+ Dodaj ładunek"
- [ ] Suma wag na dole (pomocnicze)

**Walidacja:**
- Waga > 0
- Objętość > 0
- Jeśli Hazardous, pokazać ostrzeżenie "Wymaga kierowcy z ADR"

---

### E6.10: Backend API - walidacja capacity przy tworzeniu Trip
- [ ] W service layer przy CREATE Trip:
  - SELECT SUM(weight_kg) FROM Cargo WHERE order_id = ...
  - SELECT capacity_kg FROM Vehicles WHERE vehicle_id = ...
  - IF suma > capacity THEN błąd 400
- [ ] Komunikat błędu: "Total cargo weight (X kg) exceeds vehicle capacity (Y kg)"

---

---

## E7: Przypisywanie zasobów (Assignments) i zarządzanie przejazdami (Trips)

**UWAGA:** Zgodnie z DATABASE_SCHEMA.md, są DWA rodzaje przypisań:
1. **Assignments** - długoterminowe przypisania kierowca↔pojazd (miesiące/lata)
2. **Trips** - krótkoterminowe przejazdy realizujące zlecenia (dni/tygodnie)

---

### E7.1: Backend API - CRUD Assignments (długoterminowe)
- [ ] GET /api/v1/assignments (lista wszystkich przypisań)
- [ ] GET /api/v1/assignments?active=true (tylko aktywne, WHERE assigned_to IS NULL)
- [ ] POST /api/v1/assignments (przypisanie kierowcy do pojazdu)
- [ ] PUT /api/v1/assignments/{id}/end (zakończenie przypisania, ustawienie assigned_to)

**Dane wejściowe (POST):**
```json
{
  "vehicle_id": 5,
  "driver_id": 12,
  "assigned_from": "2026-02-01T00:00:00Z"
}
```

**Dane wyjściowe:**
```json
{
  "assignment_id": 100,
  "vehicle_id": 5,
  "driver_id": 12,
  "assigned_from": "2026-02-01T00:00:00Z",
  "assigned_to": null
}
```

**Walidacja:**
- Kierowca nie może być przypisany do 2 pojazdów jednocześnie (sprawdź overlapping dates)
- assigned_from nie może być w przeszłości (> 30 dni)

**Autoryzacja:** Administrator, Mechanik (R/W)

---

### E7.2: Backend API - historia przypisań
- [ ] GET /api/v1/vehicles/{id}/assignment-history (historia przypisań pojazdu)
- [ ] GET /api/v1/drivers/{id}/assignment-history (historia przypisań kierowcy)

**Dane wyjściowe:**
```json
[
  {
    "assignment_id": 95,
    "driver": {"id": 10, "name": "Jan Kowalski"},
    "vehicle": {"id": 3, "vin": "ABC123..."},
    "assigned_from": "2025-01-01",
    "assigned_to": "2025-12-31"
  }
]
```

---

### E7.3: Backend API - sprawdzanie dostępności pojazdu dla Trip
- [ ] GET /api/v1/vehicles/{id}/availability?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
- [ ] Sprawdzenie statusu pojazdu (Available, nie Service ani Inactive)
- [ ] Sprawdzenie czy pojazd nie ma aktywnego Trip w tym okresie
  - SELECT FROM Trips WHERE vehicle_id=... AND status IN ('Scheduled','Active') AND (start_time between ... OR end_time between ...)

**Dane wyjściowe:**
```json
{
  "vehicle_id": 5,
  "available": false,
  "reason": "Vehicle already assigned to Trip #45 (2026-02-10 to 2026-02-15)",
  "status": "InRoute"
}
```

---

### E7.4: Backend API - sprawdzanie dostępności kierowcy dla Trip
- [ ] GET /api/v1/drivers/{id}/availability?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
- [ ] Sprawdzenie statusu kierowcy (Available, nie OnLeave)
- [ ] Sprawdzenie czy kierowca nie ma aktywnego Trip
  - SELECT FROM Trips WHERE driver_id=... AND status IN ('Scheduled','Active') AND (start_time between ... OR end_time between ...)

**Dane wyjściowe:**
```json
{
  "driver_id": 12,
  "available": true,
  "current_assignment": {"vehicle_id": 5, "vehicle_vin": "ABC..."}
}
```

---

### E7.5: Backend API - CRUD Trips (przejazdy)
- [ ] GET /api/v1/trips (lista wszystkich przejazdów)
- [ ] GET /api/v1/trips?status=Active (filtrowanie po statusie)
- [ ] GET /api/v1/trips/{id} (szczegóły przejazdu)
- [ ] POST /api/v1/trips (utworzenie przejazdu)
- [ ] PATCH /api/v1/trips/{id}/start (rozpoczęcie przejazdu)
- [ ] PATCH /api/v1/trips/{id}/finish (zakończenie przejazdu)
- [ ] PATCH /api/v1/trips/{id}/abort (przerwanie przejazdu)

**Dane wejściowe (POST):**
```json
{
  "order_id": 50,
  "vehicle_id": 5,
  "driver_id": 12,
  "start_time": "2026-02-15T08:00:00Z"
}
```

**Walidacja przy CREATE:**
1. Sprawdzenie dostępności pojazdu (E7.3)
2. Sprawdzenie dostępności kierowcy (E7.4)
3. Sprawdzenie uprawnień ADR (E4.3) jeśli zlecenie ma Hazardous cargo
4. Sprawdzenie capacity (E6.10) - suma wag vs ładowność

**Automatyczne akcje przy CREATE:**
- UPDATE Vehicles SET status='InRoute' WHERE vehicle_id=...
- UPDATE Drivers SET status='InRoute' WHERE driver_id=...
- UPDATE Orders SET status='InProgress' WHERE order_id=...

**Autoryzacja:** Spedytor (R/W), Administrator (R/W)

---

### E7.6: Backend API - START Trip
- [ ] PATCH /api/v1/trips/{id}/start
- [ ] Walidacja że status='Scheduled'
- [ ] Ustawienie start_time=NOW()
- [ ] Zmiana status='Active'

**Automatyczne akcje:**
- UPDATE Vehicles SET status='InRoute'
- UPDATE Drivers SET status='InRoute'
- UPDATE Orders SET status='InProgress'

---

### E7.7: Backend API - FINISH Trip
- [ ] PATCH /api/v1/trips/{id}/finish
- [ ] Walidacja że status='Active'
- [ ] Ustawienie end_time=NOW()
- [ ] Zmiana status='Finished'
- [ ] Wymagane: actual_distance_km (z body)

**Dane wejściowe:**
```json
{
  "actual_distance_km": 450,
  "notes": "Opóźnienie 2h z powodu korka"
}
```

**Automatyczne akcje:**
- UPDATE Vehicles SET status='Available'
- UPDATE Drivers SET status='Available'
- UPDATE Orders SET status='Completed' (jeśli to ostatni Trip dla tego Order)

---

### E7.8: Frontend - formularz tworzenia Trip
- [ ] Modal/strona "Utwórz przejazd" dla zlecenia
- [ ] Wybór pojazdu:
  - Lista dostępnych pojazdów (status=Available, capacity >= suma wag cargo)
  - Real-time sprawdzanie dostępności (API E7.3)
  - Pokazanie aktualnego przejazdu jeśli zajęty
- [ ] Wybór kierowcy:
  - Lista dostępnych kierowców (status=Available lub OnLeave)
  - Real-time sprawdzanie dostępności (API E7.4)
  - Badge "ADR" dla kierowców z certyfikatem
  - Filtrowanie jeśli cargo Hazardous (tylko ADR)
- [ ] DateTimePicker: Planowany start
- [ ] Podsumowanie:
  - Trasa (start → waypoints → end)
  - Ładunki (lista)
  - Suma wag vs capacity
- [ ] Przycisk "Utwórz przejazd"

**Walidacja front-end:**
- Pojazd musi być wybrany
- Kierowca musi być wybrany
- Start_time musi być w przyszłości lub max 1h wstecz
- Jeśli Hazardous cargo, kierowca musi mieć ADR

---

### E7.9: Frontend - lista przejazdów
- [ ] Tabela z kolumnami:
  - ID Trip
  - Zlecenie (order_number)
  - Klient
  - Pojazd (VIN, marka)
  - Kierowca (imię nazwisko)
  - Status (Scheduled/Active/Finished/Aborted)
  - Start/End time
  - Dystans (planned vs actual)
- [ ] Filtrowanie po statusie
- [ ] Wyszukiwanie po VIN / nazwisku kierowcy / order_number
- [ ] Sortowanie po dacie

---

### E7.10: Frontend - szczegóły Trip i akcje
- [ ] Widok szczegółów Trip (modal lub strona)
- [ ] Sekcje:
  - Informacje podstawowe (status, czasy, pojazd, kierowca)
  - Zlecenie (link do Order, lista cargo)
  - Trasa (mapa z waypoints)
  - Historia (logi zmian statusu)
- [ ] Przyciski akcji (zależne od statusu):
  - "Rozpocznij przejazd" (jeśli Scheduled) → wywołanie E7.6
  - "Zakończ przejazd" (jeśli Active) → modal z formularzem (actual_distance_km) → E7.7
  - "Przerwij przejazd" (jeśli Scheduled/Active) → confirmation → PATCH abort

---

### E7.11: Frontend - przypisywanie kierowcy do pojazdu (Assignments)
- [ ] Strona/modal "Przypisania długoterminowe"
- [ ] Lista aktywnych przypisań (Assignment WHERE assigned_to IS NULL)
- [ ] Formularz dodawania:
  - Select: Pojazd
  - Select: Kierowca
  - DatePicker: Data rozpoczęcia (domyślnie dzisiaj)
- [ ] Lista historycznych przypisań (opcjonalnie, rozwijana sekcja)
- [ ] Przycisk "Zakończ przypisanie" (ustawia assigned_to=NOW())

**Autoryzacja widoku:** Administrator, Mechanik

---

## E8: Zarządzanie serwisem i naprawami

### E8.1: Projektowanie schematu bazy dla serwisu
- [ ] Utworzenie tabeli `maintenance` (id, vehicle_id, type, status, scheduled_date, completion_date, parts_cost, labor_cost, description, created_at, updated_at)
- [ ] Dodanie foreign key do vehicles
- [ ] Dodanie ENUM dla type (Periodic_Inspection, Repair - ZAŁOŻENIE)
- [ ] Dodanie ENUM dla status (Scheduled, In_Progress, Completed, Cancelled)

---

### E8.2: Backend API - CRUD napraw
- [ ] GET /api/v1/maintenance (lista napraw z filtrowaniem po vehicle_id, status)
- [ ] GET /api/v1/maintenance/{id} (szczegóły naprawy)
- [ ] POST /api/v1/maintenance (utworzenie naprawy)
- [ ] PUT /api/v1/maintenance/{id} (edycja naprawy)
- [ ] PATCH /api/v1/maintenance/{id}/status (zmiana statusu)

**Autoryzacja:** Mechanik (R/W), Administrator (R/W), Spedytor (R)  

---

### E8.3: Backend API - aktualizacja daty następnego przeglądu
- [ ] Automatyczne obliczenie daty następnego przeglądu po zakończeniu (status=Completed)
- [ ] UPDATE w tabeli vehicles (next_inspection_date - NOWA KOLUMNA)

**Trigger w DB:**  
```sql
AFTER UPDATE ON maintenance
WHEN NEW.status = 'Completed' AND NEW.type = 'Periodic_Inspection'
UPDATE vehicles SET next_inspection_date = ...
```

---

### E8.4: Frontend - lista napraw
- [ ] Tabela z listą napraw (pojazd, typ, status, data)
- [ ] Filtrowanie po statusie
- [ ] Filtrowanie po pojeździe

---

### E8.5: Frontend - formularz dodawania naprawy
- [ ] Wybór pojazdu
- [ ] Typ naprawy (przegląd/naprawa)
- [ ] Data zaplanowania
- [ ] Opis
- [ ] Koszty (części + robocizna)

---


### E8.6: Backend API - historia napraw pojazdu
- [ ] GET /api/v1/vehicles/{id}/maintenance-history (lista wszystkich napraw)
- [ ] Sortowanie od najnowszych
- [ ] Filtrowanie po typie naprawy (Routine, Repair, TireChange)
- [ ] Filtrowanie po statusie (Completed, InProgress)

**Dane wyjściowe:**
```json
[
  {
    "maintenance_id": 15,
    "type": "Repair",
    "status": "Completed",
    "start_date": "2026-01-15",
    "end_date": "2026-01-17",
    "parts_cost_pln": 1500.00,
    "labor_cost_pln": 800.00,
    "total_cost_pln": 2300.00,
    "description": "Wymiana sprzęgła"
  }
]
```

**Autoryzacja:** Administrator, Mechanik (R), Spedytor (R)

---

### E8.7: Frontend - wyświetlanie historii napraw
- [ ] W widoku szczegółów pojazdu (E2.7) dodać sekcję "Historia napraw"
- [ ] Tabela z kolumnami:
  - Data (start_date - end_date)
  - Typ naprawy
  - Status
  - Koszt całkowity
  - Opis
- [ ] Ikony dla typów: 🔧 Repair, ⚙️ Routine, 🚗 TireChange
- [ ] Filtrowanie po typie i statusie
- [ ] Suma kosztów na dole (Total maintenance costs)

---

## E9: Zarządzanie polisami ubezpieczeniowymi

### E9.1: Projektowanie schematu bazy dla polis
- [ ] Utworzenie tabeli `insurance_policies` (id, vehicle_id, type, policy_number, insurer, start_date, end_date, cost, created_at, updated_at)
- [ ] Dodanie foreign key do vehicles
- [ ] Dodanie ENUM dla type (OC, AC)

---

### E9.2: Backend API - CRUD polis
- [ ] GET /api/v1/insurance (lista polis)
- [ ] GET /api/v1/insurance/{id} (szczegóły polisy)
- [ ] POST /api/v1/insurance (utworzenie polisy)
- [ ] PUT /api/v1/insurance/{id} (edycja polisy)
- [ ] DELETE /api/v1/insurance/{id} (usunięcie polisy)

**Autoryzacja:** Mechanik (R/W), Administrator (R/W), Spedytor (R)  

---

### E9.3: Frontend - lista polis
- [ ] Tabela z listą polis (pojazd, typ, numer polisy, data ważności)
- [ ] Oznaczenie polis wygasających w ciągu 30 dni (kolor żółty - ZAŁOŻENIE)
- [ ] Oznaczenie polis przeterminowanych (kolor czerwony)

---

### E9.4: Frontend - formularz dodawania polisy
- [ ] Wybór pojazdu
- [ ] Typ polisy (OC/AC)
- [ ] Numer polisy, ubezpieczyciel
- [ ] Daty (start, koniec)
- [ ] Koszt

---

## E10: Ewidencja tankowań i kosztów paliwa

### E10.1: Projektowanie schematu bazy dla tankowań
- [ ] Utworzenie tabeli `fuel_logs` (id, vehicle_id, date, liters, price_per_liter, total_cost, mileage, location, created_at)
- [ ] Dodanie foreign key do vehicles
- [ ] Dodanie indeksu na (vehicle_id, date)

---

### E10.2: Backend API - dodanie tankowania
- [ ] POST /api/v1/fuel
- [ ] Walidacja danych (mileage >= poprzedni mileage)
- [ ] UPDATE mileage w tabeli vehicles
- [ ] Obliczenie zużycia paliwa (liters / (mileage - previous_mileage) * 100)
- [ ] Porównanie z "normą" (BRAK DEFINICJI - ZAŁOŻENIE: średnia z ostatnich 10 tankowań?)
- [ ] Jeśli odchylenie > 20%: generowanie alertu

**Dane wejściowe:**  
```json
{
  "vehicle_id": 5,
  "date": "2026-02-08",
  "liters": 250,
  "price_per_liter": 6.50,
  "mileage": 125000,
  "location": "Shell, Warszawa"
}
```
**Dane wyjściowe:**  
```json
{
  "fuel_log_id": 200,
  "total_cost": 1625.00,
  "consumption_per_100km": 28.5,
  "alert": {
    "type": "high_consumption",
    "message": "Zużycie o 25% wyższe niż norma"
  }
}
```
**Edge cases:**  
- Mileage mniejszy niż poprzedni (błąd użytkownika, kradzież licznika?)
- Jak obliczana jest "norma"?

---

### E10.3: Backend API - lista tankowań
- [ ] GET /api/v1/fuel (lista tankowań z filtrowaniem po vehicle_id, date_from, date_to)

---

### E10.4: Frontend - lista tankowań
- [ ] Tabela z listą tankowań (pojazd, data, litry, koszt, przebieg)
- [ ] Filtrowanie po pojeździe i dacie
- [ ] Oznaczenie tankowań z alertami (ikona ostrzeżenia)

---

### E10.5: Frontend - formularz dodawania tankowania
- [ ] Wybór pojazdu
- [ ] Data
- [ ] Ilość litrów, cena za litr
- [ ] Przebieg (auto-uzupełniony z ostatniego znanego przebiegu + możliwość edycji)
- [ ] Lokalizacja

---


### E10.6: Backend API - wykrywanie anomalii spalania
- [ ] Procedura składowana sp_detect_fuel_anomaly(log_id INT)
  - Obliczenie current_consumption = (liters / (odometer_reading - prev_odometer)) * 100
  - Pobranie AVG(consumption) dla vehicle_id z ostatnich 10 tankowań
  - Obliczenie odchylenia: ABS(current - avg) / avg * 100
  - Jeśli odchylenie > 20%: UPDATE FuelLogs SET is_anomaly=1, INSERT Alert
- [ ] Trigger AFTER INSERT ON FuelLogs:
  - Wywołanie sp_detect_fuel_anomaly(NEW.log_id)
- [ ] Alert z informacją: "Abnormal fuel consumption detected: X l/100km (avg: Y l/100km, +Z%)"

**Dane w Alert:**
```json
{
  "alert_type": "fuel_anomaly",
  "vehicle_id": 5,
  "message": "Abnormal consumption: 35.5 l/100km (avg: 28.0 l/100km, +26.8%)",
  "is_resolved": 0
}
```

---

### E10.7: Frontend - oznaczanie anomalii spalania
- [ ] W liście tankowań (E10.5) dodać kolumnę "Spalanie"
- [ ] Obliczenie spalania na liście (liters / km * 100)
- [ ] Oznaczenie anomalnych wierszy:
  - Czerwony kolor tła dla is_anomaly=1
  - Ikona ⚠️
  - Tooltip: "Spalanie: X l/100km (średnia: Y l/100km, odchylenie: +Z%)"
- [ ] Filtr: "Pokaż tylko anomalie"
- [ ] Badge z liczbą anomalii w nagłówku

---

## E11: Ewidencja kosztów operacyjnych

### E11.1: Projektowanie schematu bazy dla kosztów
- [ ] Utworzenie tabeli `costs` (id, vehicle_id, category, amount, date, description, invoice_number, created_at)
- [ ] Dodanie foreign key do vehicles
- [ ] Dodanie ENUM dla category (Fuel, Maintenance, Tolls, Insurance, Other - ZAŁOŻENIE)

**UWAGA:** Czy fuel_logs i maintenance to osobne kategorie, czy duplikujemy koszty w `costs`?  
**DECYZJA:** costs to dodatkowe koszty (Tolls, Other). Fuel i Maintenance mają swoje dedykowane tabele.

---

### E11.2: Backend API - CRUD kosztów
- [ ] GET /api/v1/costs (lista kosztów)
- [ ] POST /api/v1/costs (dodanie kosztu)
- [ ] PUT /api/v1/costs/{id} (edycja kosztu)
- [ ] DELETE /api/v1/costs/{id} (usunięcie kosztu)

**Autoryzacja:** Mechanik (R/W), Administrator (R/W), Spedytor (R)  

---

### E11.3: Frontend - lista kosztów
- [ ] Tabela z listą kosztów (pojazd, kategoria, kwota, data)
- [ ] Filtrowanie po kategorii i pojeździe

---

### E11.4: Frontend - formularz dodawania kosztu
- [ ] Wybór pojazdu
- [ ] Kategoria (opłata drogowa, inne)
- [ ] Kwota, data, opis, numer faktury

---

## E12: Generowanie raportów finansowych

### E12.1: Backend API - Raport rentowności pojazdu
- [ ] GET /api/v1/reports/vehicle-profitability?vehicle_id=X&month=YYYY-MM
- [ ] Agregacja przychodów (SELECT SUM(price) FROM orders WHERE vehicle_id=X AND month=...)
- [ ] Agregacja kosztów paliwa (SELECT SUM(total_cost) FROM fuel_logs WHERE ...)
- [ ] Agregacja kosztów serwisu (SELECT SUM(parts_cost + labor_cost) FROM maintenance WHERE ...)
- [ ] Agregacja kosztów ubezpieczeń (proporcjonalnie do miesiąca - ZAŁOŻENIE)
- [ ] Agregacja kosztów opłat drogowych (SELECT SUM(amount) FROM costs WHERE category='Tolls' AND ...)
- [ ] Obliczenie bilansu (przychody - koszty)

**Dane wyjściowe:**  
```json
{
  "vehicle_id": 5,
  "month": "2026-01",
  "revenue": 50000.00,
  "costs": {
    "fuel": 15000.00,
    "maintenance": 5000.00,
    "insurance": 1000.00,
    "tolls": 2000.00,
    "total": 23000.00
  },
  "profit": 27000.00
}
```

---

### E12.2: Backend API - Raport przebiegu kierowców
- [ ] GET /api/v1/reports/driver-mileage?driver_id=X&date_from=...&date_to=...
- [ ] Suma kilometrów z przypisanych zleceń (JOIN assignments + routes)

**Dane wyjściowe:**  
```json
{
  "driver_id": 12,
  "period": "2026-01-01 to 2026-01-31",
  "total_km": 5500,
  "orders_count": 8
}
```

---

### E12.3: Backend API - Globalny raport kosztów
- [ ] GET /api/v1/reports/global-costs?date_from=...&date_to=...
- [ ] Agregacja wszystkich kosztów z podziałem na kategorie

**Dane wyjściowe:**  
```json
{
  "period": "2026-01-01 to 2026-01-31",
  "costs_by_category": {
    "Fuel": 50000.00,
    "Maintenance": 15000.00,
    "Insurance": 8000.00,
    "Tolls": 5000.00,
    "Other": 2000.00
  },
  "total": 80000.00
}
```

---

### E12.4: Backend API - eksport raportów do Excel
- [ ] GET /api/v1/reports/vehicle-profitability/export?vehicle_id=X&month=...
- [ ] Generowanie pliku .xlsx przy użyciu biblioteki (np. excelize dla Go)
- [ ] Zwrócenie pliku do pobrania (Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

**Edge cases:**  
- Brak danych dla danego okresu (pusty raport)

---

### E12.5: Frontend - wybór typu raportu
- [ ] Strona z formularzem wyboru raportu
- [ ] Dropdown: Rentowność pojazdu / Przebieg kierowców / Globalny raport kosztów
- [ ] Dynamiczne pola w zależności od typu (pojazd, kierowca, okres)

---

### E12.6: Frontend - wyświetlenie raportu
- [ ] Tabela/wykres z danymi raportu
- [ ] Przycisk "Eksportuj do Excel"

---

## E13: Dashboard zarządczy

### E13.1: Backend API - KPI dla dashboardu
- [ ] GET /api/v1/dashboard/kpi
- [ ] Obliczenie wskaźników:
  - Liczba aktywnych zleceń
  - Liczba pojazdów w serwisie
  - Całkowity koszt w bieżącym miesiącu
  - Przychód w bieżącym miesiącu
  - Alerty (przeglądy, polisy, certyfikaty wygasające w ciągu 30 dni)

**Dane wyjściowe:**  
```json
{
  "active_orders": 15,
  "vehicles_in_service": 2,
  "current_month_costs": 80000.00,
  "current_month_revenue": 150000.00,
  "alerts": [
    {
      "type": "insurance_expiry",
      "message": "Polisa OC pojazdu ABC123 wygasa 2026-03-01"
    },
    {
      "type": "inspection_due",
      "message": "Przegląd pojazdu XYZ789 zaplanowany na 2026-02-15"
    }
  ]
}
```

---

### E13.2: Frontend - dashboard
- [ ] Wyświetlenie KPI w kafelkach (card components)
- [ ] Wykresy (opcjonalnie - np. przychody vs koszty)
- [ ] Lista alertów z linkami do szczegółów

---

## E14: System powiadomień i alertów

### E14.1: Projektowanie schematu bazy dla powiadomień
- [ ] Utworzenie tabeli `notifications` (id, user_id, type, message, is_read, created_at)
- [ ] Dodanie foreign key do users
- [ ] Dodanie ENUM dla type (Insurance_Expiry, Inspection_Due, Certificate_Expiry, Fuel_Anomaly - ZAŁOŻENIE)

---

### E14.2: Backend - funkcja generowania powiadomienia
- [ ] Funkcja createNotification(user_id, type, message)
- [ ] INSERT do tabeli notifications

---

### E14.3: Backend - scheduler weryfikujący terminy
- [ ] Cron job uruchamiany codziennie (np. o 6:00 rano - ZAŁOŻENIE)
- [ ] Sprawdzenie polis wygasających w ciągu X dni (domyślnie 30 - ZAŁOŻENIE)
- [ ] Sprawdzenie przeglądów zaplanowanych w ciągu X dni
- [ ] Sprawdzenie certyfikatów wygasających w ciągu X dni
- [ ] Generowanie powiadomień dla Mechanika (user_id z rolą Mechanik)

**Edge cases:**  
- Co jeśli scheduler się nie uruchomi? (brak retry mechanism?)
- Jak często powiadamiać? (raz dziennie do czasu rozwiązania?)

---

### E14.4: Backend API - pobieranie powiadomień
- [ ] GET /api/v1/notifications (lista powiadomień dla zalogowanego użytkownika)
- [ ] PATCH /api/v1/notifications/{id}/read (oznaczenie jako przeczytane)

---

### E14.5: Frontend - ikona powiadomień
- [ ] Ikona dzwonka w górnym menu z licznikiem nieprzeczytanych
- [ ] Dropdown z listą powiadomień po kliknięciu
- [ ] Oznaczenie przeczytanych vs nieprzeczytanych

---

### E14.6: Frontend - strona wszystkich powiadomień
- [ ] Lista wszystkich powiadomień użytkownika
- [ ] Filtrowanie po typie
- [ ] Oznaczanie jako przeczytane

---


### E14.5: Backend service - scheduler infrastructure
- [ ] Package internal/scheduler
- [ ] Użycie biblioteki robfig/cron (go get github.com/robfig/cron/v3)
- [ ] Rejestracja jobs w main.go podczas startup
- [ ] Graceful shutdown schedulera

**Struktura:**
```go
// internal/scheduler/scheduler.go
type Scheduler struct {
    cron *cron.Cron
    // services
}

func (s *Scheduler) Start() {
    s.cron = cron.New()
    s.RegisterJobs()
    s.cron.Start()
}

func (s *Scheduler) RegisterJobs() {
    // Codziennie o 6:00
    s.cron.AddFunc("0 6 * * *", s.CheckExpiringCertificates)
    s.cron.AddFunc("0 6 * * *", s.CheckExpiringInsurance)
    s.cron.AddFunc("0 6 * * *", s.CheckMaintenanceDue)
}
```

**Konfiguracja:**
- Environment variable: SCHEDULER_ENABLED=true/false
- Cron expressions w .env (opcjonalnie)

---

### E14.6: Backend jobs - sprawdzanie wygasających certyfikatów i polis
- [ ] Job: CheckExpiringCertificates()
  - Wywołanie service z E4.4
  - SELECT Drivers WHERE license_expiry_date/adr_expiry_date BETWEEN NOW() AND NOW() + 30 DAYS
  - Dla każdego: CREATE Alert
  - Logging: "Checked X drivers, created Y alerts"
- [ ] Job: CheckExpiringInsurance()
  - SELECT Insurance WHERE valid_to BETWEEN NOW() AND NOW() + 30 DAYS AND deleted_at IS NULL
  - Dla każdej polisy: CREATE Alert
  - alert_type: 'insurance_expiry'
- [ ] Job: CheckMaintenanceDue()
  - SELECT Vehicles WHERE last_maintenance_date + maintenance_interval < NOW() + 30 DAYS
  - CREATE Alert dla każdego pojazdu
  - alert_type: 'maintenance_due'

**Logging:**
- Timestamp każdego uruchomienia
- Liczba sprawdzonych rekordów
- Liczba utworzonych alertów
- Błędy (jeśli wystąpiły)

---

## E15: Dziennik zmian (Changelog/Audit)

### E15.1: Projektowanie schematu bazy dla changelog
- [ ] Utworzenie tabeli `changelog` (id, user_id, table_name, record_id, operation, old_data, new_data, timestamp)
- [ ] Dodanie foreign key do users
- [ ] Dodanie ENUM dla operation (INSERT, UPDATE, DELETE)
- [ ] Kolumny old_data i new_data jako JSON

---

### E15.2: Database - triggery dla automatycznej rejestracji
- [ ] Trigger AFTER INSERT na kluczowych tabelach (vehicles, drivers, orders, assignments, maintenance, fuel_logs, insurance_policies, costs)
- [ ] Trigger AFTER UPDATE na tych samych tabelach
- [ ] Trigger AFTER DELETE na tych samych tabelach
- [ ] Każdy trigger zapisuje wpis w changelog

**Przykład triggera:**  
```sql
CREATE TRIGGER log_vehicle_insert
AFTER INSERT ON vehicles
FOR EACH ROW
BEGIN
  INSERT INTO changelog (user_id, table_name, record_id, operation, new_data, timestamp)
  VALUES (
    @current_user_id,  -- z session variable
    'vehicles',
    NEW.id,
    'INSERT',
    JSON_OBJECT('vin', NEW.vin, 'make', NEW.make, ...),
    NOW()
  );
END;
```

**UWAGA:** Skąd wziąć current_user_id w triggerze? (session variable ustawiona przez backend - ZAŁOŻENIE)

---

### E15.3: Backend - ustawianie session variable dla user_id
- [ ] Przed każdą operacją DB: SET @current_user_id = X (z JWT)

---

### E15.4: Backend API - pobieranie changelog (tylko Admin)
- [ ] GET /api/v1/admin/changelog (lista wpisów z paginacją)
- [ ] Filtrowanie po: user_id, table_name, operation, date_from, date_to

**Autoryzacja:** Tylko Administrator  

---

### E15.5: Frontend - strona changelog (tylko Admin)
- [ ] Tabela z listą wpisów (timestamp, użytkownik, tabela, operacja)
- [ ] Możliwość rozwinięcia szczegółów (old_data, new_data w JSON)
- [ ] Filtrowanie

---


### E15.3: Lista tabel wymagających triggerów
- [ ] Identyfikacja wszystkich business tables wymagających audit trail:
  - **Core entities:** Users, Drivers, Vehicles, Clients
  - **Operations:** Orders, Routes, RouteWaypoints, Cargo, Trips, Assignments
  - **Financials:** FuelLogs, Maintenance, Insurance
  - **Alerts:** Alerts (opcjonalnie, ale rekomendowane)
- [ ] Łącznie: ~13 tabel
- [ ] Dla każdej tabeli: 3 triggery (INSERT, UPDATE, DELETE)
- [ ] Łącznie: ~39 triggerów

**Lista tabel:**
1. Users
2. Drivers
3. Vehicles
4. Clients
5. Orders
6. Routes
7. RouteWaypoints
8. Cargo
9. Trips
10. Assignments
11. FuelLogs
12. Maintenance
13. Insurance
14. Alerts (optional)

---

### E15.4: Template triggerów i generowanie
- [ ] Utworzenie template triggera dla INSERT:
```sql
DELIMITER $$
CREATE TRIGGER trg_{table_name}_audit_insert
AFTER INSERT ON {TableName}
FOR EACH ROW
BEGIN
    INSERT INTO Changelogger (user_id, table_name, record_id, action, old_value, new_value, changed_at)
    VALUES (
        @current_user_id,
        '{TableName}',
        NEW.{primary_key},
        'INSERT',
        NULL,
        JSON_OBJECT({column_list}),
        NOW()
    );
END$$
DELIMITER ;
```

- [ ] Template dla UPDATE (z old_value i new_value)
- [ ] Template dla DELETE
- [ ] Skrypt generujący triggery dla wszystkich tabel (Python/Bash)
- [ ] Migracja zawierająca wszystkie 39 triggerów

**Przykład wygenerowany:**
```sql
-- Trigger dla Vehicles INSERT
CREATE TRIGGER trg_vehicles_audit_insert
AFTER INSERT ON Vehicles
FOR EACH ROW
BEGIN
    INSERT INTO Changelogger (user_id, table_name, record_id, action, old_value, new_value, changed_at)
    VALUES (
        @current_user_id,
        'Vehicles',
        NEW.vehicle_id,
        'INSERT',
        NULL,
        JSON_OBJECT(
            'vin', NEW.vin,
            'brand', NEW.brand,
            'model', NEW.model,
            'status', NEW.status
            -- wszystkie kolumny
        ),
        NOW()
    );
END;
```

---

### E15.5: Middleware ustawiający @current_user_id
- [ ] Middleware w Gin (przed każdym authenticated request):
  - Pobranie user_id z JWT claims
  - Wykonanie SQL: SET @current_user_id = ?
  - Defer: SET @current_user_id = NULL (cleanup)
- [ ] Dla requestów bez autentykacji: @current_user_id = NULL (system action)

**Implementacja:**
```go
func AuditMiddleware(db *sql.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetInt("user_id") // z JWT middleware
        
        if userID > 0 {
            db.Exec("SET @current_user_id = ?", userID)
            defer db.Exec("SET @current_user_id = NULL")
        }
        
        c.Next()
    }
}
```

**Edge cases:**
- Request bez JWT (publiczne endpointy): user_id = NULL w Changelogger
- Błąd SET variable: logować warning, ale nie blokować request

---

### E15.6: Frontend - historia zmian dla rekordu
- [ ] Modal/strona "Historia zmian"
- [ ] Endpoint: GET /api/v1/changelog?table_name={table}&record_id={id}
  - Sortowanie od najnowszych (ORDER BY changed_at DESC)
  - Limit 100 rekordów (lub paginacja)
- [ ] Wyświetlenie w modal:
  - Timeline z datami
  - User (kto zmienił) - JOIN z Users
  - Akcja (INSERT/UPDATE/DELETE)
  - Diff viewer (old_value vs new_value):
    - Zielony: wartości dodane
    - Czerwony: wartości usunięte
    - Żółty: wartości zmienione
- [ ] Przycisk "Historia" w widokach szczegółów:
  - Szczegóły pojazdu → Historia zmian pojazdu
  - Szczegóły kierowcy → Historia zmian kierowcy
  - Szczegóły zlecenia → Historia zmian zlecenia

**UI components:**
- React-diff-viewer lub podobny dla JSON diff
- Timeline component (react-vertical-timeline)

**Autoryzacja:** Tylko Administrator może zobaczyć pełną historię

---

## E16: Zarządzanie słownikami systemowymi

### E16.1: Projektowanie schematu bazy dla słowników
- [ ] Utworzenie tabeli `dictionaries` (id, category, key, value, created_at)
- [ ] Kategorie: cargo_types, vehicle_statuses, maintenance_types itp. (ZAŁOŻENIE)

**UWAGA:** Czy słowniki są w bazie czy hardcoded w kodzie? Dokumentacja nie precyzuje.

---

### E16.2: Backend API - CRUD słowników
- [ ] GET /api/v1/admin/dictionaries?category=cargo_types
- [ ] POST /api/v1/admin/dictionaries
- [ ] PUT /api/v1/admin/dictionaries/{id}
- [ ] DELETE /api/v1/admin/dictionaries/{id}

**Autoryzacja:** Tylko Administrator  

---

### E16.3: Frontend - zarządzanie słownikami
- [ ] Strona z listą kategorii słowników
- [ ] Dla każdej kategorii: lista wartości
- [ ] Możliwość dodania/edycji/usunięcia wartości

---

## E17: Implementacja RODO

### E17.1: Szyfrowanie danych osobowych w bazie
- [ ] Identyfikacja kolumn z danymi osobowymi (PESEL, imiona, nazwiska, adresy - ZAŁOŻENIE)
- [ ] Implementacja szyfrowania na poziomie aplikacji (Go) PRZED zapisem do DB
- [ ] Użycie AES-256 (ZAŁOŻENIE)
- [ ] Zarządzanie kluczem szyfrującym (environment variable, secure vault - DECYZJA)

**Edge cases:**  
- Rotacja kluczy szyfrujących?
- Jak wyszukiwać po zaszyfrowanych danych? (hash dla PESEL?)

---

### E17.2: Backend API - "prawo do zapomnienia"
- [ ] DELETE /api/v1/admin/gdpr/forget-driver/{id}
- [ ] Anonimizacja danych kierowcy (imię → "Anonimowy", PESEL → NULL, email → NULL itp.)
- [ ] OPCJONALNIE: całkowite usunięcie (hard delete) jeśli nie ma powiązanych zleceń

**UWAGA:** Co z danymi w changelog? (czy też anonimizować? dokumentacja nie precyzuje)

---

### E17.3: Kontrola dostępu do danych osobowych
- [ ] Weryfikacja w middleware RBAC
- [ ] Tylko Administrator i Mechanik mogą odczytywać/modyfikować dane kierowców

---

### E17.4: Frontend - funkcja "zapomnij kierowcę"
- [ ] Przycisk "Zapomnij dane" w widoku szczegółów kierowcy (tylko Admin)
- [ ] Potwierdzenie przed wykonaniem operacji
- [ ] Wyświetlenie komunikatu o sukcesie

---

## Podsumowanie tasków

**Łączna liczba tasków:** ~100+

**Rozbicie po epicach:**
- E1: 8 tasków
- E2: 7 tasków
- E3: 6 tasków
- E4: 6 tasków
- E5: 5 tasków
- E6: 6 tasków
- E7: 5 tasków
- E8: 5 tasków
- E9: 4 tasków
- E10: 5 tasków
- E11: 4 tasków
- E12: 6 tasków
- E13: 2 taski
- E14: 6 tasków
- E15: 5 tasków
- E16: 3 taski
- E17: 4 taski

**Uwagi:**
- Większość tasków wymaga zarówno pracy backendowej (API + logika) jak i frontendowej (UI)
- Wiele tasków ma ZAŁOŻENIA, które wymagają doprecyzowania przed implementacją
- Edge cases zostały zidentyfikowane dla kluczowych funkcjonalności
- Brakujące decyzje są oznaczone jako DECYZJA lub BRAK SPECYFIKACJI
