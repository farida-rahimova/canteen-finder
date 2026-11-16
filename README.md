# CanteenFinder

CanteenFinder shows all canteens (Mensa/Cafeteria) of the **Studentenwerk Schleswig-Holstein** on a map.
It lists every meal served **today** across all canteens. When you select a meal, the map shows the canteens that offer it.

Project for the course *Geographical Web Applications* (WiSe 26/27), HAW Kiel.

## Architecture

```
studentenwerk.sh ──(scraper, daily)──► PostGIS ──► GeoServer (WFS + WMS) ──► Vue 3 + OpenLayers app
```

| Part | Technology | Folder |
|---|---|---|
| Database | PostgreSQL 16 + PostGIS 3.4 | `db/` |
| Map server | GeoServer 2.26 | (Docker) |
| Scraper | TypeScript / Node.js | `scraper/` *(Day 2)* |
| Web app | Vue 3, TypeScript, OpenLayers, Vite | `frontend/` |

## Requirements

- Docker Desktop
- Node.js 20 or newer

## Build and run

```bash
# 1. Configuration (then change the passwords in .env)
cp .env.example .env

# 2. Start PostGIS and GeoServer
docker compose up -d

# 3. Start the web app
cd frontend
npm install
npm run dev
```

- Web app: http://localhost:5173
- GeoServer: http://localhost:8080/geoserver

## Code quality

```bash
cd frontend
npm run lint        # ESLint with @dataport/eslint-config-geodev
npm run typecheck   # TypeScript type check
npm run build       # production build
```
