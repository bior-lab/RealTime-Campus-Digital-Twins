# NUS Campus EMIS Dashboard Structure

## Scope

The website is a NUS campus energy dashboard. The map should show the campus first, not a Singapore digital twin demo.

Primary functions:

- focus the map on NUS campus;
- mark the current 16 focus buildings with compact building-code labels;
- show building-level electricity, cooling, water, PV, and EUI;
- connect live SDE4 data now;
- prepare the FastAPI JSON contract for all mapped buildings.

Current layout structure:

- left rail: primary navigation for `Overview`, `Buildings`, `Context`, `AI`, and `Layers`;
- left board: current task panel, metrics, lists, external context charts, and AI evidence;
- right workspace: live Mapbox campus map, 3D building layer, region markers, popups, and map legend.

Current board tabs:

- `Overview`: campus status KPIs, region cards, and short AI triage;
- `Buildings`: search, 16 focus building list, selected building detail, and collapsed raw realtime points;
- `Context`: EMA/data.gov.sg external energy context controls and inline board charts;
- `AI`: evidence-first AI insights, diagnosis, and action recommendations;
- `Layers`: map color mode and layer controls.

Current 16 focus buildings:

```text
SDE4, Ventus, SDE3, E3A, T-LAB, E8, E6, SDE1, SDE2, COM3, S1A, S9, CELS, MD1, MD2, MD6
```

## Frontend Structure

Current implementation:

```text
index.html
src/app.js
src/styles.css
data/processed/nus-campus-buildings.sample.geojson
data/processed/nus-building-labels.geojson
data/processed/nus-campus-buildings.geojson
data/mapping/building-realtime-endpoints.json
data/mapping/pi_meter_water_btu_point_samples.csv
data/mapping/pi_meter_and_equipment_point_counts_by_building.csv
data/mapping/pi_selected_canonical_points_no_webid.csv
data/realtime/sde4.latest.sample.json
data/external/ema/electricity-annual.json
data/external/ema/system-demand-context.json
data/external/ema/solar-pv-regional.json
data/external/ema/manifest.json
```

## Map Layers

### Mapbox Building Geometry

Source:

```text
mapbox://nus-bior.7xmymq8g
source-layer: 07_buildings_energy_weekly_re-1cntpw
```

Role:

- real building footprint rendering;
- height-based 3D extrusion through `height_m`;
- EUI reference through `eui_2023`;
- building type reference through `building_type`.

This layer does not contain NUS display names or EMIS meter IDs. It contains `source_id`, which can be joined to the current NUS building registry when the registry `element_id` is formatted as `way/{element_id}`.

The current frontend renders all matched NUS campus Mapbox building geometries. The 15-building focus filter applies only to name markers, the building list, region clusters, and current EMIS interaction targets.

### NUS Campus Building Registry

Source:

```text
data/processed/nus-campus-buildings.geojson
```

Role:

- building name markers;
- building-code selection;
- live endpoint linkage;
- Mapbox `source_id` filter for campus-only building geometry;
- first building-to-EMIS mapping surface.

Current status:

- 256 building entries derived from the public NUS Digital Twin frontend registry;
- 256 entries include a Mapbox-style `source_id`;
- browser verification rendered 240 unique matched Mapbox building `source_id` values in the current campus viewport;
- SDE4 uses `source_id=way/628774809`;
- E4 uses `source_id=way/139970613`.

This file is a development identity layer. It should be replaced by official NUS GIS centroids or a project-owned Mapbox tileset before production release.

### Historical Draft Label Layer

Source:

```text
data/processed/nus-building-labels.geojson
```

Role:

- retained as the earlier manually checked 11-building draft;
- no longer used as the primary marker layer.

### Historical Sample Footprints

Source:

```text
data/processed/nus-campus-buildings.sample.geojson
```

Role:

- retained as early prototype data;
- no longer used as the primary map building geometry.

### Mapbox EUI Layer

Source:

```text
mapbox://nus-bior.7xmymq8g
source-layer: 07_buildings_energy_weekly_re-1cntpw
```

Role:

- EUI reference layer;
- optional background for comparison;
- same Mapbox building source used by the current 3D building model;
- not the live EMIS meter layer.

The UI labels this as `Mapbox EUI layer`, not `UDT model`. It uses the same campus `source_id` filter as the main building layer.

## Mapbox and Google Data Position

Mapbox currently provides usable building geometry, height, EUI, and archetype fields. It does not provide the NUS building display names needed by the EMIS dashboard.

Google Maps can be used only through Google Maps Platform APIs, such as Places API, under Google's API terms and attribution rules. The project should not scrape Google Maps labels into the dashboard. If Google Places is required for validation, the team needs a Google API key and a documented reconciliation table.

Current working approach:

```text
Mapbox vector footprint.source_id
  -> NUS Digital Twin registry source_id
  -> NUS display name / address / short_name
  -> EMIS building code and meter mapping
```

## Realtime Data

Current live endpoint:

```text
https://buildingdt.org/realtime/latest?building=SDE4
```

Browser-side CORS is currently available from the local frontend.

Current SDE4 groups exposed by the endpoint:

- hourly electricity points;
- Beehub temperature, humidity, CO2, and thermostat setpoints;
- VAV airflow points;
- PV total kW points;
- hourly cooling consumption.

Current SDE4 groups not exposed in the latest endpoint:

- water meter value;
- whole-building instantaneous electricity kW.

COM3 has local PI point samples in `data/mapping/pi_meter_water_btu_point_samples.csv`, including electricity and cooling consumption points. The public latest endpoint currently returns `404` for `building=COM3`, so COM3 should stay catalogued until the FastAPI building-code contract exposes it.

COM3 uses Mapbox `source_id=relation/15780831`. Mapbox Tilequery against `nus-bior.7xmymq8g` returns this relation at the COM3 centroid; using `way/15780831` filters out the actual footprint.

## Realtime Visualization

The Buildings tab now separates latest values from historical visualization:

- `Realtime Points` remains a raw latest-point list for SDE4;
- `Realtime Trends` appears when a live building is selected;
- `View` opens a modal with history charts for selected Beehub points;
- CO2, temperature, and humidity use 7-day hourly-mean line charts;
- VAV-L3-01 airflow uses a 24-hour hourly-mean bar chart.

Current history endpoint pattern:

```text
https://buildingdt.org/history/beehub?point=SDE4%20Beehub%20CO2&from=-7d&to=now()
```

The history endpoint returns `points: [{ "t": timestamp, "v": value }]`. The frontend aggregates raw minute-level samples before charting. Electricity and cooling history currently return `404` from this public history endpoint, so these remain latest-value KPIs until a history endpoint is exposed for energy meters and cooling meters.

## PI Web API Position

The historical scripts in `C:\Users\Administrator\Desktop\Agent-Online-FDD\scripts` show direct PI Web API retrieval with local credentials. These scripts should not be copied with credentials.

The current project copies only sanitized outputs:

- PI meter, water, and BTU point samples;
- point counts by building;
- canonical point mapping without WebIds;
- current SDE4 public realtime sample.

## Target API Contract

The frontend should later consume FastAPI JSON instead of direct PI Web API calls:

```text
/buildings
/building-status
/building-latest?building=SDE4
/timeseries
/forecast
/anomalies
/tariff
```

Recommended `/building-status` fields:

```json
{
  "building_id": "sde4",
  "building_code": "SDE4",
  "timestamp": "2026-06-12T10:05:00Z",
  "electricity_kw": null,
  "electricity_kwh_latest_hour": 0.0,
  "cooling_kwh_latest_hour": 30.7933,
  "water_m3_today": null,
  "pv_kw": 27.9718,
  "indoor_temperature_c": 24.3,
  "indoor_humidity_pct": 62.3,
  "indoor_co2_ppm": 443.0,
  "data_quality": "partial"
}
```

## Design Rule

Use Mapbox for spatial navigation and 3D building geometry. Use `nus-campus-buildings.geojson` or an official NUS GIS layer for building identity. Use FastAPI for live EMIS values. Use Mapbox EUI fields only as reference attributes until the NUS building-to-meter mapping is verified.

## External Energy Context

The `Context` tab contains compact controls and inline charts for EMA/data.gov.sg datasets in the left board. This module is for baseline interpretation and policy/grid context, not building-level live metering.

Current local datasets:

- `electricity-annual.json`: annual Singapore electricity generation and consumption;
- `system-demand-context.json`: monthly electricity generation used as a temporary grid context proxy;
- `solar-pv-regional.json`: solar PV installation count and installed capacity by URA planning region.

Current interaction:

- selecting `Electricity consumption` shows annual national KPIs and a generation/consumption trend in the board;
- selecting `System demand` shows the latest monthly generation proxy and the last 24 months in the board;
- selecting `Solar PV deployment` shows national PV installed capacity, yearly trend, and regional comparison in the board.

Implementation boundary:

- PI/FastAPI remains the source for NUS building electricity, cooling, water, PV, and indoor environmental data;
- EMA/data.gov.sg remains an external context namespace for benchmarking, peak-period annotation, policy context, tariff context, and PV deployment comparison;
- the monthly generation proxy should be replaced or supplemented with EMA half-hourly system demand before operational peak annotations are shown as AI evidence.

## Label Strategy

The campus map uses zoom-based label density:

- campus overview to zoom 15.58: semi-transparent region areas and cluster markers, `Design and Engineering (9)`, `Computing (1)`, `Science (2)`, and `Medicine (4)`;
- clicking a region cluster zooms into that region and reveals the building-code markers;
- zoom 15.35 to 15.8: priority building markers and building codes;
- zoom 15.8 and above: full building code markers;
- zoom 17.35 and above: full building names.

The marker layer also uses parent-building grouping. Block-level footprints remain in the 3D Mapbox layer, but repeated block labels are grouped into one display marker and one list item. Examples:

- `Sheares Block A-E` -> `Sheares Hall`;
- `Kent Ridge Hall Block A-E` -> `Kent Ridge Hall`;
- `Temasek Hall Block A-E` -> `Temasek Hall`;
- `PGP Residence 1 Block 1-4` -> `PGP Residence 1`.

Map labels use compact building numbers or codes through `map_label`. Full building names and block lists are shown in the side panel, not as map labels. This follows the building-number style used in campus microclimate map interfaces such as BEAM deck.gl.

This avoids showing all focus building labels at campus overview scale. It also reduces overlap under 3D pitch, where projected screen distance between nearby buildings is compressed.

## Required Materials for Final Alignment

Required for production accuracy:

- official NUS building footprint GeoJSON or shapefile;
- official NUS building centroid table if footprint release is not available;
- building code, full name, address, zone, and public display name;
- mapping from building code to EMIS building ID;
- mapping from EMIS building ID to meter group IDs;
- PV meter mapping by building;
- water meter mapping by building;
- cooling or BTU meter mapping by building;
- rule for buildings that share one meter group.

Without these materials, the current registry remains a development identity layer. The Mapbox building geometry is spatially aligned for matched `source_id` values, but final production accuracy still requires official NUS GIS or an approved project-owned tileset.
