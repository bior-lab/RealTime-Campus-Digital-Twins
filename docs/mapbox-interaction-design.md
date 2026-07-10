# Mapbox Interaction Design

## Purpose

The campus EMIS should use Mapbox as a primary interface, not only as a background map. The map should support public exploration and building-level energy interpretation.

## Map Scale

The first version should focus on campus scale:

- campus zones;
- buildings;
- outdoor public spaces;
- energy meters aggregated to building or zone level;
- solar PV areas;
- cooling and utility infrastructure when public disclosure is allowed.

## Core Interactions

### Building Selection

Users click a building to open:

- building name;
- zone;
- building type;
- current demand;
- energy use intensity;
- daily carbon emissions;
- estimated cost;
- AI status;
- recommended action.

### Metric Switching

The same building layer can be styled by:

- current electricity demand;
- energy use intensity;
- carbon emissions;
- estimated cost.

### Layer Toggles

Recommended first-layer controls:

- energy buildings;
- solar potential or PV output;
- AI anomaly flags;
- cooling demand;
- meter coverage.

### Filtering

Recommended filters:

- building type;
- campus zone;
- faculty or department;
- meter status;
- anomaly status;
- public visibility.

### AI Interaction

Mapbox should connect spatial location with AI interpretation:

- anomaly flags appear on buildings;
- forecasted peak buildings can be highlighted;
- side panel explains probable drivers;
- user can compare nearby or same-type buildings.

## Data Model

Each map feature should connect GIS data with EMIS data.

Required fields:

- building identifier;
- building name;
- campus zone;
- building type;
- geometry;
- floor area;
- current demand;
- daily energy use;
- energy use intensity;
- carbon emissions;
- solar generation;
- estimated cost;
- anomaly score;
- forecasted peak;
- AI explanation;
- suggested action.

## Prototype Status

The current Mapbox prototype uses sample geometry and sample meter values. It is designed to test interaction structure. It should not be used for formal reporting.

## Implementation Notes

- Use Mapbox GL JS for the frontend map.
- Use GeoJSON for early prototype data.
- Move to vector tiles or a spatial database if building geometry becomes large.
- Keep sensitive meter identifiers out of public layers.
- Show data quality and update time on production pages.

