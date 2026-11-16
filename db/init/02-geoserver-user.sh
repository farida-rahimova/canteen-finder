#!/bin/bash
# Creates a READ-ONLY database user for GeoServer.
# GeoServer only needs to read data, so it gets no write rights (principle of least privilege).
set -euo pipefail

psql -v ON_ERROR_STOP=1 \
	--username "$POSTGRES_USER" \
	--dbname "$POSTGRES_DB" \
	--set reader="$GEOSERVER_DB_USER" \
	--set reader_pw="$GEOSERVER_DB_PASSWORD" \
	--set db="$POSTGRES_DB" <<'SQL'
CREATE ROLE :"reader" LOGIN PASSWORD :'reader_pw';
GRANT CONNECT ON DATABASE :"db" TO :"reader";
GRANT USAGE ON SCHEMA public TO :"reader";
GRANT SELECT ON ALL TABLES IN SCHEMA public TO :"reader";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO :"reader";
SQL
