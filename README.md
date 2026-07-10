# RealTime Campus Digital Twins

This folder contains the foundation for an AI-powered campus energy management information system (EMIS) dashboard for a general audience.

## Purpose

The project aims to present campus energy use in a form that supports:

- public understanding of campus energy demand;
- comparison across buildings and campus zones;
- explanation of drivers such as weather, occupancy, schedules, and cooling demand;
- AI-based forecasting, anomaly detection, and energy-saving recommendations;
- tracking of carbon, solar generation, and sustainability progress.

## Initial Scope

The first version should focus on structure before implementation:

- page architecture;
- data scope;
- dashboard module definitions;
- AI insight logic;
- public communication principles;
- GitHub-ready documentation.

## Folder Structure

```text
nus-campus-emis/
  index.html
  README.md
  .env.example
  docs/
    campus-dashboard-structure.md
    site-architecture.md
    data-scope.md
    ema-data-assessment.md
    mapbox-emis-integration-checklist.md
    mapbox-interaction-design.md
    migration-handoff.md
    price-module-decision.md
    urban-digital-twins-data-reuse-assessment.md
  data/
    raw/
    mapping/
      building-realtime-endpoints.json
      pi_meter_water_btu_point_samples.csv
      pi_meter_and_equipment_point_counts_by_building.csv
      pi_selected_canonical_points_no_webid.csv
    realtime/
      sde4.latest.sample.json
    processed/
      nus-campus-buildings.geojson
      nus-building-labels.geojson
      nus-campus-buildings.sample.geojson
  src/
    app.js
    styles.css
```

## Working Name

NUS AI-powered Campus Energy Use Dashboard

## Map Prototype

Open `index.html` through a local web server. No Mapbox token is committed to this repository. For local testing, pass a temporary public token with `?mapbox_token=pk...`; the browser stores it locally for later visits. The prototype uses the Mapbox building tileset for whole-campus footprint and height extrusion, a NUS campus building registry for the current 16 focus markers and building names, a Mapbox EUI reference layer, and the live SDE4 realtime endpoint.

Example:

```powershell
python -m http.server 5174
```

Then open:

```text
http://127.0.0.1:5174/
```

The prototype uses this Mapbox layer for real building footprint, height, and EUI reference:

```text
mapbox://nus-bior.7xmymq8g
source-layer: 07_buildings_energy_weekly_re-1cntpw
```

This layer does not include NUS display names or meter IDs. The campus EMIS joins it to `data/processed/nus-campus-buildings.geojson` through Mapbox `source_id` values such as `way/628774809`. The registry currently contains 256 NUS Digital Twin building entries; 256 include a Mapbox-style `way/{element_id}` join key. Live values should later come from FastAPI JSON.

Current live endpoint connected in the frontend:

```text
https://buildingdt.org/realtime/latest?building=SDE4
```

## PI Web API Point Discovery

The original desktop BIOR database includes PI Web API helpers and exported point
workbooks. Do not commit those raw folders directly because they include local
environment files and credentials. Use the sanitized helper in
`tools/pi_web_api/` instead:

```bash
python3 tools/pi_web_api/pi_web_api_client.py search \
  --building SDE4 \
  --intent water \
  --output data/raw/pi_discovery/sde4-water-candidates.csv
```

Known SDE4 water candidates extracted from `PI_Points_by_Building.xlsx` are
tracked in `data/mapping/pi_water_point_candidates.csv`. Validate those points
against PI history before exposing a public `water_m3` or `water_m3_h` field in
the realtime API.

## Integration Checklist

Use `docs/mapbox-emis-integration-checklist.md` to collect Mapbox token, style, FastAPI endpoint, CORS, update-frequency, and field-mapping requirements.

Use `docs/campus-dashboard-structure.md` for the current website structure, live endpoint, and FastAPI target contract.

Use `docs/ema-data-assessment.md` for the external EMA/data.gov.sg context-data assessment. The current downloaded context files are stored under `data/external/ema/`.

Use `docs/urban-digital-twins-data-reuse-assessment.md` to track which parts of `bior-lab/Urban-Digital-Twins` can be reused for the campus EMIS map.

Use `docs/migration-handoff.md` when moving this prototype into a new repository or cloud deployment project.
