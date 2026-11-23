# CanteenFinder

CanteenFinder shows which canteens of the **Studentenwerk Schleswig-Holstein** serve a chosen meal **today**.
It lists every meal served today across all canteens. When you select a meal, the map highlights the canteens that offer it, and cards below the map show address, prices and labels.

Project for the course *Geographical Web Applications* (WiSe 26/27), HAW Kiel – Farida Rahimova.

## How it works

```
studentenwerk.sh ──► Scraper ──► PostGIS ──► GeoServer ──► Vue 3 + OpenLayers app
 (menu pages)      (TypeScript)  (database)  (WFS + WMS)    (localhost:5173)
```

1. **Scraper** (`scraper/`): reads the English menu pages of studentenwerk.sh. It finds all locations and canteens by itself (11 canteens in 5 cities), keeps only **today's** meals and saves them in PostGIS.
2. **PostGIS** (`db/`): stores the canteens (as points, WGS84) and the meals. The view `canteen_meals_today` contains one row per meal served today, at the position of its canteen.
3. **GeoServer** (`geoserver/`): publishes the data as OGC services:
   - **WFS** `canteenfinder:canteen_meals_today` – today's meals as GeoJSON (meal list, filter, highlighted canteens, cards)
   - **WMS** `canteenfinder:canteens` – all canteens as a map image, styled with `geoserver/canteen.sld`
4. **App** (`frontend/`): Vue 3 + TypeScript + OpenLayers. Base map: OpenStreetMap. The Vite dev server forwards `/geoserver` to GeoServer, so there are no CORS problems.

The positions of the canteens are not on the website. They are stored in `scraper/data/canteen-locations.json` (addresses geocoded with OpenStreetMap Nominatim and checked by hand).

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with Docker Compose)
- [Node.js](https://nodejs.org/) 22.18 or newer
- Git and a bash shell (macOS/Linux terminal; on **Windows use Git Bash** for `geoserver/setup.sh`)

## Build and run

All commands start in the project folder.

### 1. Configuration

```bash
cp .env.example .env
```

Open `.env` and set your own passwords. `.env` is listed in `.gitignore` and is never committed.

### 2. Start PostGIS and GeoServer

```bash
docker compose up -d
docker compose ps
```

Wait until both containers are `healthy` (GeoServer needs about one minute).
On the first start, the database runs `db/init/` and creates the tables, the view and a **read-only** user for GeoServer.

> **If `docker.osgeo.org` is not reachable** (it was down with HTTP 502 during development), build the official GeoServer image from the GeoServer project's own Dockerfile and give it the same name. Compose then uses the local image:
>
> ```bash
> git clone https://github.com/geoserver/docker.git geoserver-official-recipe
> cd geoserver-official-recipe
> git checkout ac2c46da3f5c2316eaadff625f06cb057d7a0c9e   # "Bump GeoServer version from 2.26.1 to 2.26.2"
> docker build -t docker.osgeo.org/geoserver:2.26.2 .
> ```

### 3. Configure GeoServer (once)

```bash
./geoserver/setup.sh
```

The script uses the GeoServer REST API to create the workspace `canteenfinder`, the PostGIS data store (read-only user), both layers and the style. Running it again is safe: existing parts are skipped. At the end it prints a WFS and a WMS test link.

GeoServer admin: http://localhost:8080/geoserver (user and password from `.env`).

### 4. Load today's meals

```bash
cd scraper
npm install
npm run scrape
```

Run `npm run scrape` once per day: the app always shows **today's** meals.

**Weekends, public holidays and semester break:** the canteens are closed, so there are no meals and the app says so. To try the app on such a day, load clearly labelled sample meals instead:

```bash
npm run demo
```

The app then shows a "Demo data" notice. `npm run scrape` on a weekday replaces the sample meals with the real menu.

### 5. Start the app

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

Production build: `npm run build`, then `npm run preview` (http://localhost:4173).

## Code quality

| Command | Folder | What it checks |
| --- | --- | --- |
| `npm run lint` | `frontend`, `scraper` | ESLint with the shared config `@dataport/eslint-config-geodev` |
| `npm run typecheck` | `frontend`, `scraper` | TypeScript (strict, no `any`) |
| `npm run build` | `frontend` | Type check + production build |

## Accessibility

- Lighthouse accessibility: **100** (desktop and mobile)
- Usable with the keyboard only: skip link, search box, meal list (radio buttons, arrow keys), map (focus with Tab, move with the arrow keys, zoom with + / −), zoom buttons
- Tested with the screen reader VoiceOver: labelled controls, results are announced automatically (`aria-live`), and the canteens on the map are also listed as text below the map
- Responsive: tested on a phone (portrait and landscape) and on a laptop

## Project structure

```
canteen-finder/
├── docker-compose.yml        PostGIS + GeoServer
├── .env.example              settings and passwords (copy to .env)
├── db/init/                  schema, view, read-only GeoServer user
├── geoserver/
│   ├── setup.sh              configures GeoServer via REST API
│   └── canteen.sld           WMS style for the canteens layer
├── scraper/                  TypeScript scraper (scrape, demo, discover, geocode)
│   └── data/canteen-locations.json
└── frontend/                 Vue 3 + OpenLayers app
```

## Other scraper commands

| Command | Purpose |
| --- | --- |
| `npm run discover` | Lists all canteens found on studentenwerk.sh with their key (`ort-mensa`) |
| `npm run geocode` | Adds coordinates for new addresses in `canteen-locations.json` |

## Data sources

- Menus: [Studentenwerk Schleswig-Holstein](https://studentenwerk.sh/en/food-overview). Meal names are kept exactly as published.
- Base map and geocoding: © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
