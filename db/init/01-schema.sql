-- CanteenFinder database schema
-- Runs automatically the first time the PostGIS container starts.

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1) Canteens: fixed locations, entered once
CREATE TABLE canteens (
	id          SERIAL PRIMARY KEY,
	name        TEXT NOT NULL UNIQUE,              -- display name, e.g. 'Mensa I'
	source_name TEXT NOT NULL UNIQUE,              -- exact name used on studentenwerk.sh (for the scraper)
	city        TEXT NOT NULL,
	kind        TEXT NOT NULL CHECK (kind IN ('Mensa', 'Cafeteria')),
	address     TEXT,
	geom        geometry(Point, 4326) NOT NULL     -- WGS84 longitude/latitude
);

CREATE INDEX canteens_geom_idx ON canteens USING GIST (geom);

-- 2) Meals: one row per meal per canteen per day, filled by the scraper
CREATE TABLE meals (
	id              SERIAL PRIMARY KEY,
	canteen_id      INTEGER NOT NULL REFERENCES canteens (id) ON DELETE CASCADE,
	served_on       DATE NOT NULL,
	name            TEXT NOT NULL,
	price_students  NUMERIC(5, 2),                 -- NULL if the page shows no price
	price_employees NUMERIC(5, 2),
	price_guests    NUMERIC(5, 2),
	labels          TEXT,                          -- e.g. 'vegan, vegetarian'
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
	m.price_students,
	m.price_employees,
	m.price_guests,
	m.labels,
	m.served_on,
	c.geom
FROM meals AS m
JOIN canteens AS c ON c.id = m.canteen_id
WHERE m.served_on = CURRENT_DATE;
