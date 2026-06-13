# Quiniela Mundial 2026

Webapp familiar para pronosticar marcadores de la fase de grupos del Mundial 2026.

## Stack

- Frontend: React + Vite + TailwindCSS.
- Backend: Node.js + Express + TypeScript.
- Base de datos: MySQL.
- Deploy recomendado: Cloud Run + Cloud SQL en GCP.

## Funcionalidad

- Entrada con nombre y año de nacimiento.
- Pronósticos por marcador exacto.
- Cierre de picks validado por el servidor con hora UTC.
- Tabla con desempates: puntos, exactos, resultados, alias.
- Panel admin con PIN para:
  - capturar resultados oficiales,
  - editar picks de cualquier jugador aunque el partido esté cerrado,
  - agregar jugadores que mandaron picks por WhatsApp.

## Desarrollo local

```bash
cp .env.example .env
npm install
npm run db:reset
npm run dev
```

La app queda en:

```bash
http://localhost:5173
```

La API queda en:

```bash
http://localhost:8080/api/health
```

## Variables

```bash
PORT=8080
APP_ORIGIN=http://localhost:5173
JWT_SECRET=change-this-long-random-secret
ADMIN_PIN=2026
DB_HOST=127.0.0.1
DB_SOCKET=
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=quiniela_mundial_2026
AUTO_SETUP=false
```

## Base de datos

Para levantar MySQL local con Docker:

```bash
docker compose up -d mysql
```

Y usar:

```bash
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=root
```

Crear tablas:

```bash
npm run db:schema
```

Sembrar equipos y 72 partidos:

```bash
npm run db:seed
```

Ambos comandos son idempotentes.

## Deploy GCP

1. Crear Cloud SQL MySQL.
2. Crear la base `quiniela_mundial_2026`.
3. Configurar secrets para `JWT_SECRET`, `ADMIN_PIN`, `DB_PASSWORD`.
4. Construir y desplegar a Cloud Run:

```bash
gcloud run deploy quiniela-mundial-2026 \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,PORT=8080,DB_HOST=TU_HOST,DB_PORT=3306,DB_USER=TU_USUARIO,DB_NAME=quiniela_mundial_2026,APP_ORIGIN=*
```

Para Cloud SQL con conector de Cloud Run, usar `DB_SOCKET=/cloudsql/PROJECT:REGION:INSTANCE` y habilitar la conexión de Cloud SQL en el servicio.

## Pruebas rápidas

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/matches
curl -X POST http://localhost:8080/api/login \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Ricardo","anio":"1985"}'
```

Para admin:

```bash
curl http://localhost:8080/api/admin/players -H 'x-admin-pin: 2026'
```
