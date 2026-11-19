#!/bin/bash
# Configures GeoServer for CanteenFinder through its REST API.
# Creates (only if missing):
#   - workspace  "canteenfinder"
#   - data store "postgis"            → the PostGIS database, with the READ-ONLY user
#   - layer      "canteen_meals_today" → one point per meal served today (used as WFS)
#   - layer      "canteens"            → all canteens (used as WMS, with the style "canteen")
# Run from the project folder:  ./geoserver/setup.sh
# Running it twice is safe: existing parts are skipped.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
set -a
# shellcheck source=/dev/null
source "$ROOT/.env"
set +a

GS="${GEOSERVER_URL:-http://localhost:8080/geoserver}"
REST="$GS/rest"
AUTH="$GEOSERVER_ADMIN_USER:$GEOSERVER_ADMIN_PASSWORD"
WS="canteenfinder"
STORE="postgis"

# Bounding box of Schleswig-Holstein (WGS84). Set by hand, so a layer can be published even when it has no data (e.g. on Sundays).
BBOX='{"minx": 7.8, "maxx": 11.6, "miny": 53.3, "maxy": 55.1, "crs": "EPSG:4326"}'

# HTTP status code of a GET request (200 = exists, 404 = missing)
status () {
	curl -s -o /dev/null -w "%{http_code}" -u "$AUTH" "$1"
}

# Sends data to GeoServer and stops the script with the error message if GeoServer refuses it
send () {
	local method="$1" url="$2" type="$3" data="$4"
	curl -sS --fail-with-body -u "$AUTH" -X "$method" -H "Content-Type: $type" --data-binary "$data" "$url" > /dev/null
}

echo "Waiting for GeoServer at $GS ..."
for _ in $(seq 1 60); do
	if [ "$(status "$REST/about/version.json")" = "200" ]; then
		break
	fi
	sleep 3
done
if [ "$(status "$REST/about/version.json")" != "200" ]; then
	echo "GeoServer is not reachable or the admin login in .env is wrong." >&2
	exit 1
fi

# 1) Workspace
if [ "$(status "$REST/workspaces/$WS.json")" = "200" ]; then
	echo "✔ workspace '$WS' exists"
else
	send POST "$REST/workspaces" application/json "{\"workspace\": {\"name\": \"$WS\"}}"
	echo "✚ workspace '$WS' created"
fi

# 2) Data store: PostGIS, reached by its Docker service name "postgis", with the read-only user
if [ "$(status "$REST/workspaces/$WS/datastores/$STORE.json")" = "200" ]; then
	echo "✔ data store '$STORE' exists"
else
	send POST "$REST/workspaces/$WS/datastores" application/json "{
		\"dataStore\": {
			\"name\": \"$STORE\",
			\"description\": \"CanteenFinder PostGIS database (read-only user)\",
			\"enabled\": true,
			\"connectionParameters\": {\"entry\": [
				{\"@key\": \"dbtype\", \"\$\": \"postgis\"},
				{\"@key\": \"host\", \"\$\": \"postgis\"},
				{\"@key\": \"port\", \"\$\": \"5432\"},
				{\"@key\": \"database\", \"\$\": \"$POSTGRES_DB\"},
				{\"@key\": \"schema\", \"\$\": \"public\"},
				{\"@key\": \"user\", \"\$\": \"$GEOSERVER_DB_USER\"},
				{\"@key\": \"passwd\", \"\$\": \"$GEOSERVER_DB_PASSWORD\"}
			]}
		}
	}"
	echo "✚ data store '$STORE' created"
fi

# 3) Layers (feature types)
publish () {
	local name="$1" title="$2" abstract="$3"
	if [ "$(status "$REST/workspaces/$WS/datastores/$STORE/featuretypes/$name.json")" = "200" ]; then
		echo "✔ layer '$WS:$name' exists"
	else
		send POST "$REST/workspaces/$WS/datastores/$STORE/featuretypes" application/json "{
			\"featureType\": {
				\"name\": \"$name\",
				\"nativeName\": \"$name\",
				\"title\": \"$title\",
				\"abstract\": \"$abstract\",
				\"srs\": \"EPSG:4326\",
				\"projectionPolicy\": \"FORCE_DECLARED\",
				\"nativeBoundingBox\": $BBOX,
				\"latLonBoundingBox\": $BBOX
			}
		}"
		echo "✚ layer '$WS:$name' created"
	fi
}

publish canteen_meals_today "Meals served today" "One point per meal served today, at the position of its canteen. Source: studentenwerk.sh"
publish canteens "Canteens of the Studentenwerk Schleswig-Holstein" "All canteens (Mensa/Cafeteria) with a known position."

# 4) Style for the WMS layer "canteens"
if [ "$(status "$REST/workspaces/$WS/styles/canteen.json")" = "200" ]; then
	echo "✔ style 'canteen' exists"
else
	curl -sS --fail-with-body -u "$AUTH" -X POST -H "Content-Type: application/vnd.ogc.sld+xml" \
		--data-binary "@$ROOT/geoserver/canteen.sld" "$REST/workspaces/$WS/styles?name=canteen" > /dev/null
	echo "✚ style 'canteen' created"
fi
send PUT "$REST/layers/$WS:canteens" application/json "{\"layer\": {\"defaultStyle\": {\"name\": \"canteen\", \"workspace\": \"$WS\"}}}"
echo "✔ style 'canteen' set as default for '$WS:canteens'"

echo
echo "Done. Test in the browser:"
echo "  WFS: $GS/$WS/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=$WS:canteen_meals_today&outputFormat=application/json"
echo "  WMS: $GS/$WS/wms?service=WMS&version=1.1.1&request=GetMap&layers=$WS:canteens&bbox=7.8,53.3,11.6,55.1&width=600&height=300&srs=EPSG:4326&format=image/png"
