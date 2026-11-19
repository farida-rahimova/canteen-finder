-- CanteenFinder database schema
-- Runs automatically the first time the PostGIS container starts (empty data volume).

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1) Canteens: found by the scraper on studentenwerk.sh, positions added from scraper/data/canteen-locations.json
CREATE TABLE canteens (
	id       SERIAL PRIMARY KEY,
	ort_id   INTEGER NOT NULL,                      -- location id on studentenwerk.sh (?ort=…)
	mensa_id INTEGER NOT NULL,                      -- canteen id on studentenwerk.sh (&mensa=…)
	name     TEXT NOT NULL,                         -- e.g. 'Mensa I with cafeteria and café lounge'
	city     TEXT NOT NULL,                         -- e.g. 'Kiel'
	kind     TEXT NOT NULL CHECK (kind IN ('Mensa', 'Cafeteria')),
	address  TEXT,
	geom     geometry(Point, 4326),                 -- WGS84 longitude/latitude; NULL until the position is known
	UNIQUE (ort_id, mensa_id)
);

CREATE INDEX canteens_geom_idx ON canteens USING GIST (geom);

-- 2) Meals: one row per meal per canteen per day, filled by the scraper
CREATE TABLE meals (
	id              SERIAL PRIMARY KEY,
	canteen_id      INTEGER NOT NULL REFERENCES canteens (id) ON DELETE CASCADE,
	served_on       DATE NOT NULL,
	name            TEXT NOT NULL,
	category        TEXT,                          -- 'Canteen' or 'Cafeteria' (counter inside the building)
	price_students  NUMERIC(5, 2),                 -- NULL if the page shows no price
	price_employees NUMERIC(5, 2),
	price_guests    NUMERIC(5, 2),
	labels          TEXT,                          -- e.g. 'vegetarian, vegan'
	allergens       TEXT,                          -- codes as on the website, e.g. 'GlW, So'
	scraped_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
	UNIQUE (canteen_id, served_on, name)           -- running the scraper twice creates no duplicates
);

CREATE INDEX meals_served_on_idx ON meals (served_on);

-- 3) View published by GeoServer as WFS layer:
--    one feature = one meal served today at one canteen (point = canteen location)
CREATE VIEW canteen_meals_today AS
SELECT
	m.id              AS meal_id,
	c.id              AS canteen_id,
	c.name            AS canteen_name,
	c.city,
	c.kind,
	c.address,
	m.name            AS meal_name,
	m.category,
	m.price_students,
	m.price_employees,
	m.price_guests,
	m.labels,
	m.allergens,
	to_char(m.served_on, 'YYYY-MM-DD') AS served_on, -- as text: GeoServer would shift a DATE to the previous day (UTC)
	c.geom
FROM meals AS m
JOIN canteens AS c ON c.id = m.canteen_id
WHERE m.served_on = CURRENT_DATE
	AND c.geom IS NOT NULL;
