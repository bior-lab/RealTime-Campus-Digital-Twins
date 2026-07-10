# NUS Campus EMIS Migration Handoff

## Project Goal

Build a campus-scale NUS AI-powered EMIS dashboard for public use and research demonstration.

The dashboard should support:

- Mapbox-based campus building interaction;
- building-level energy status;
- EMIS data from InfluxDB through FastAPI JSON;
- AI forecast and anomaly explanation;
- carbon, solar, and price interpretation;
- later deployment through the lab GitHub and cloud server.

## Current Project Location

```text
C:\Users\Administrator\Desktop\Agent-Online-FDD\nus-campus-emis
```

## Current Implementation Status

The current version is a static Mapbox GL JS prototype.

Implemented:

- Mapbox map page;
- campus building sample GeoJSON;
- building click popup;
- side building profile panel;
- demand, EUI, carbon, and cost map metric switch;
- building type filter;
- solar layer toggle;
- anomaly flag toggle;
- building search;
- AI insight list;
- local token input flow;
- documentation for page structure, data scope, price module, and Mapbox/EMIS integration.

Not implemented yet:

- real NUS building geometry;
- NUS campus boundary;
- building-to-EMIS meter mapping;
- live FastAPI connection;
- time-series charts;
- forecast model endpoint;
- anomaly model endpoint;
- production deployment config.

## Files to Migrate

Copy this folder into the new project:

```text
nus-campus-emis/
```

Minimum files needed for the current prototype:

```text
index.html
src/app.js
src/styles.css
data/processed/nus-campus-buildings.sample.geojson
.env.example
.gitignore
README.md
docs/
```

## Files and Values Not to Commit

Do not commit:

- Mapbox secret token starting with `sk.`;
- production API keys;
- FastAPI bearer tokens;
- server passwords;
- raw InfluxDB exports with sensitive meter IDs;
- internal IP addresses;
- private billing records;
- `.env` files.

The Mapbox browser token must be a public token starting with:

```text
pk.
```

## Recommended New Project Structure

For the new project, use this structure:

```text
nus-campus-emis/
  README.md
  index.html
  .env.example
  docs/
  data/
    processed/
      nus-campus-buildings.sample.geojson
    raw/
  src/
    app.js
    styles.css
```

If the new project uses a framework later, keep the same data contracts:

```text
public/data/
src/map/
src/api/
src/components/
src/config/
```

## Mapbox Information Needed

Required:

```text
Mapbox public token: pk...
Mapbox style URL: mapbox://styles/mapbox/light-v11 or custom style
Token restriction: http://localhost:5174/
Production restriction: https://your-domain/*
```

Current known Urban Digital Twins tilesets:

```text
buildings:        mapbox://nus-bior.7xmymq8g
grid:             mapbox://nus-bior.0siwr5r9
weather:          mapbox://nus-bior.7x1jhs36
buildingOverview: mapbox://nus-bior.coxvspif
```

Use these as optional Singapore context layers, not as the final NUS campus EMIS layer.

## Building Model Needed

The campus EMIS needs a separate NUS building layer.

Required fields:

```text
map_building_id
nus_building_name
short_name
zone
building_type
area_m2
geometry
height_m
gfa_m2
public_visibility
```

Geometry options:

1. Use NUS GIS building footprints if available.
2. Extract NUS buildings from the Singapore-scale Mapbox building layer.
3. Manually prepare a campus GeoJSON for the first version.
4. Replace sample GeoJSON after the ID mapping is validated.

## EMIS API Needed

Current data pipeline:

```text
InfluxDB -> FastAPI JSON -> cloud endpoint -> frontend map
```

Required API information:

```text
FastAPI base URL
endpoint list
sample JSON
authentication method
CORS configuration
update frequency
data quality rules
```

Recommended endpoints:

```text
/buildings
/building-status
/timeseries
/forecast
/anomalies
/campus-summary
/tariff
```

## Building-to-Meter Mapping Needed

Create a mapping table:

```text
map_building_id
emis_building_id
meter_group_id
meter_name
nus_building_name
zone
building_type
area_m2
public_visibility
notes
```

This mapping is the key connection between Mapbox geometry and live EMIS data.

## AI Model Information Needed

For the AI-powered part, provide model outputs through API endpoints.

Forecast fields:

```text
building_id
forecast_timestamp
horizon
predicted_kw
lower_kw
upper_kw
model_version
```

Anomaly fields:

```text
building_id
timestamp
anomaly_score
severity
baseline_kw
observed_kw
explanation
suggested_action
model_version
```

Recommended first AI functions:

1. 24-hour demand forecast.
2. Building anomaly score.
3. Peak demand warning.
4. Cost impact estimate.
5. Public-facing explanation.

## Deployment Path

### Local Development

Run from the project root:

```powershell
python -m http.server 5174
```

Open:

```text
http://localhost:5174/
```

### GitHub

Recommended:

1. Create a new repository for `nus-campus-emis`.
2. Commit only frontend code, documentation, and sample data.
3. Do not commit production API credentials.
4. Keep `.env.example`, not `.env`.

### Cloud Server

Recommended:

1. Pull the GitHub repository to the cloud server.
2. Serve the frontend with Nginx or static hosting.
3. Proxy FastAPI under the same domain if possible.
4. Configure FastAPI CORS for the frontend domain.
5. Add the production domain to Mapbox token restrictions.

Example:

```text
frontend: https://emis.your-lab-domain.com
api:      https://emis.your-lab-domain.com/api
```

## Migration Sequence

Use this order:

1. Create new project repository.
2. Copy current `nus-campus-emis` files.
3. Test static map with Mapbox public token.
4. Add optional Singapore context layers from Urban Digital Twins.
5. Prepare NUS campus boundary and building footprints.
6. Create building-to-meter mapping.
7. Connect `/building-status`.
8. Connect `/timeseries`.
9. Connect `/forecast` and `/anomalies`.
10. Add price and carbon calculation.
11. Deploy to cloud server.
12. Restrict Mapbox token to the production domain.

## Main Design Decision

Keep the NUS campus EMIS as a separate website.

Use Urban Digital Twins as:

- Singapore context layer;
- Mapbox tileset reference;
- upload workflow reference;
- spatial metadata pattern.

Do not merge the campus EMIS directly into the Singapore-scale Urban Digital Twins website.

