# Mapbox and EMIS API Integration Checklist

## Purpose

This document lists the information needed to connect the campus-scale Mapbox interface with the EMIS data pipeline.

Current data pipeline:

```text
InfluxDB -> FastAPI JSON -> cloud server endpoint -> campus EMIS frontend
```

## Part A. Mapbox Information Needed

### 1. Public Access Token

Provide one Mapbox public token for browser-side Mapbox GL JS.

Required token type:

- public token;
- starts with `pk.`;
- restricted by URL before production deployment;
- not a secret token.

Do not provide a token that starts with `sk.`.

### 2. Allowed Domains

For token restrictions, prepare the frontend domains:

- local development: `http://127.0.0.1:5174/*`;
- local development: `http://localhost:5174/*`;
- current migrated local server: `http://127.0.0.1:5175/*`;
- current migrated local server: `http://localhost:5175/*`;
- staging domain, if available;
- production domain, if available.

### 3. Map Style

Choose one option:

- use default Mapbox style: `mapbox://styles/mapbox/light-v11`;
- create a custom NUS campus style in Mapbox Studio and provide the style URL.

If a custom style is used, provide:

- style URL;
- whether the style is published;
- intended visual tone: light, satellite, standard, or custom campus map.

### 4. Optional Mapbox Assets

Provide only if available:

- custom building footprints;
- campus boundary polygon;
- campus zone polygons;
- road and walkway layer;
- solar PV roof polygons;
- utility or cooling infrastructure layer allowed for public use.

Preferred formats:

- GeoJSON for early prototype;
- vector tiles for large production layers.

## Part B. EMIS FastAPI Information Needed

### 1. Base API URL

Provide the public or VPN-accessible base URL.

Example:

```text
https://your-cloud-domain.example.com/api
```

### 2. Endpoint List

Provide the available endpoint paths and their purpose.

Recommended endpoints:

| Endpoint | Purpose |
| --- | --- |
| `/buildings` | building metadata and GIS geometry |
| `/building-status` | current building energy status |
| `/timeseries` | historical time series |
| `/forecast` | predicted demand |
| `/anomalies` | anomaly score and explanation |
| `/campus-summary` | aggregate campus indicators |
| `/tariff` | electricity price assumptions |

### 3. Sample JSON

Provide one sample response for each endpoint. Use a short time range and 2-3 buildings.

Remove or mask:

- internal server IPs;
- passwords;
- private meter identifiers if not public;
- API keys;
- personal data.

### 4. Authentication

State which method is used:

- no authentication for public data;
- API key in request header;
- bearer token;
- session cookie;
- VPN-only access;
- reverse proxy with public read-only endpoint.

If authentication is needed, do not send a production secret in chat. Provide the header name and a temporary development key through a secure channel.

### 5. CORS

The FastAPI server must allow the frontend domain.

For local testing, allow:

```text
http://127.0.0.1:5174
http://localhost:5174
```

For deployment, allow the final website domain.

### 6. Update Frequency

Provide the data update interval:

- real-time meter data interval;
- FastAPI cache interval;
- dashboard refresh interval;
- forecast update interval.

Example:

```text
meter: 5 minutes
api cache: 1 minute
frontend refresh: 60 seconds
forecast: hourly
```

## Part C. Required Data Fields

### Building Metadata

Required fields:

- `building_id`;
- `name`;
- `short_name`;
- `zone`;
- `type`;
- `area_m2`;
- `geometry`;
- `public_visibility`.

### Current Energy Status

Required fields:

- `building_id`;
- `timestamp`;
- `electricity_kw`;
- `electricity_kwh_today`;
- `cooling_kw`;
- `water_m3_today`;
- `solar_kw`;
- `carbon_kg_today`;
- `estimated_cost_sgd_today`;
- `data_quality`.

### Forecast

Required fields:

- `building_id`;
- `forecast_timestamp`;
- `horizon`;
- `predicted_kw`;
- `lower_kw`;
- `upper_kw`;
- `model_version`.

### Anomaly

Required fields:

- `building_id`;
- `timestamp`;
- `anomaly_score`;
- `severity`;
- `baseline_kw`;
- `observed_kw`;
- `explanation`;
- `suggested_action`.

### Tariff or Price

Required fields:

- `tariff_name`;
- `currency`;
- `energy_rate_sgd_per_kwh`;
- `demand_charge_sgd_per_kw`;
- `time_of_use_period`;
- `effective_date`;
- `source_note`.

Use estimated cost labels if billing data is not verified.

## Part D. Integration Sequence

### Step 1. Mapbox Token

Create a public Mapbox token and test it locally in the prototype.

### Step 2. Campus Geometry

Provide building footprint GeoJSON or a building metadata endpoint with geometry.

### Step 3. Building ID Mapping

Create a mapping between:

- GIS building ID;
- EMIS building ID;
- meter ID or meter group;
- public building name.

### Step 4. Current Status Endpoint

Connect current electricity demand and basic indicators to the map.

### Step 5. Time Series Endpoint

Connect building profile charts.

### Step 6. Forecast and Anomaly Endpoints

Connect AI insights, anomaly flags, and forecasted peak indicators.

### Step 7. Price Module

Connect tariff assumptions and cost calculations after the core energy indicators are stable.

### Step 8. Deployment

Restrict the Mapbox token to the production domain and restrict API CORS to approved frontend domains.

## Part E. What to Send to the Developer

Send the following first:

1. Mapbox public token starting with `pk.`.
2. Mapbox style URL, if you created a custom style.
3. FastAPI base URL.
4. Endpoint list.
5. Sample JSON for `/buildings` and `/building-status`.
6. Authentication method, without sending production secrets.
7. CORS status.
8. Update frequency.

After that, send:

1. Sample JSON for `/timeseries`.
2. Sample JSON for `/forecast`.
3. Sample JSON for `/anomalies`.
4. Tariff or price assumptions.
5. Building ID mapping table.
