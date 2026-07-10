# EMA Data Assessment for NUS Campus EMIS

Current date checked: 2026-06-13.

## Recommendation

Use Energy Market Authority (EMA) and data.gov.sg datasets as an external context layer, not as building-level EMIS data.

The PI Web API remains the source of record for real-time NUS building electricity, cooling, water, PV, and indoor environmental data. EMA data can support benchmarking, policy context, grid-demand annotation, tariff context, and PV deployment comparison.

## Downloaded Local Context Files

The current frontend reads the following local files through the `Context` tab `External Energy Context` controls. Selecting a dataset updates the inline external-context analysis area in the left board:

| Local file | Source dataset | Current UI role | Latest period in local file |
| --- | --- | --- | --- |
| `data/external/ema/electricity-annual.json` | Electricity generation and consumption, annual | National electricity consumption and generation baseline | Consumption: 2024; generation: 2025 |
| `data/external/ema/system-demand-context.json` | Electricity generation, monthly | Grid context proxy until half-hourly system demand is wired | 2026-02 |
| `data/external/ema/solar-pv-regional.json` | Solar PV installations by URA planning region | PV deployment benchmark and regional comparison | 2021 |
| `data/external/ema/manifest.json` | Local provenance manifest | Dataset source URLs and retrieval timestamp | Retrieved 2026-06-13 |

Frontend treatment:

- clicking `Electricity consumption` shows national annual consumption/generation KPIs and a trend chart;
- clicking `System demand` shows monthly generation context as a temporary grid-demand proxy;
- clicking `Solar PV deployment` shows Singapore PV capacity KPIs, annual trend, and latest planning-region comparison.

The dashboard labels the system-demand card as context because the current local file is monthly generation. The production version should replace or supplement this with EMA half-hourly system demand before using it for peak-period annotation.

## Datasets Worth Adding

| Data source | Current availability | EMIS use | Integration priority |
| --- | --- | --- | --- |
| EMA half-hourly system demand | EMA statistics page, PDF/XLSX download. Historical electricity system demand every half-hour in MW. | Annotate campus demand against Singapore grid peak periods. | High |
| Singapore Energy Statistics annual publication | EMA annual online publication with downloadable tabular and tidy data. | National context for electricity consumption, prices, solar, and energy balance. | High |
| Electricity generation and consumption, annual | data.gov.sg dataset sourced from EMA, annual data from 1975 to 2025. API endpoint available through `datastore_search`. | Long-term national electricity baseline. | Medium |
| Electricity generation, monthly | data.gov.sg dataset sourced from EMA, monthly update. | Monthly national electricity context. | Medium |
| Solar PV installations by URA planning region | data.gov.sg EMA dataset, 2008 to 2021. | PV adoption comparison by planning region. | Low |
| Installed capacity of grid-connected solar PV systems | EMA Singapore Energy Statistics Chapter 6. 1H 2025 total installed capacity: 1,775 MWp. | Singapore-level PV capacity context for campus PV narrative. | Medium |
| USEP / energy prices | EMA Singapore Energy Statistics Chapter 5. USEP is half-hourly wholesale electricity price; SES provides monthly average context. | Cost and grid-price context; not direct NUS billing unless tariff contract is known. | Medium |

## Implementation Boundary

Do not merge EMA values into building-level live metrics. Recommended frontend treatment:

- `Context` tab: compact external context controls with inline board charts;
- `Overview` tab: optional grid context badge, such as system demand percentile;
- map layer: optional planning-area or regional context, not building extrusion color;
- backend: separate namespace, for example `/external/ema/system-demand/latest` and `/external/ema/solar-capacity`.

## Candidate API / Download Endpoints

- data.gov.sg datastore API pattern:
  `https://data.gov.sg/api/action/datastore_search?resource_id={dataset_id}`
- Annual electricity generation and consumption:
  `https://data.gov.sg/datasets/d_3745e3aa98ff3c4bcfcb8e1f6dffef42/view`
- Monthly electricity generation:
  `https://data.gov.sg/datasets/d_ae4afbaf5bc96bde19d8ce85810ab9f4/view`
- Solar PV installations by URA planning region:
  `https://data.gov.sg/datasets/d_cd4f91f7a1ebb2b7ceb1a70c0dbb706d/view`
- EMA half-hourly system demand:
  `https://ema.gov.sg/resources/statistics/half-hourly-system-demand-data`
- EMA Singapore Energy Statistics:
  `https://ema.gov.sg/resources/singapore-energy-statistics`

## Next Step

Add a small FastAPI external-data module after the core PI meter mapping is stable:

```text
app/external/ema.py
/external/ema/system-demand
/external/ema/electricity-generation-monthly
/external/ema/solar-capacity
/external/ema/usep-monthly
```

Cache these datasets daily or monthly depending on source update frequency. Do not request them on every frontend page load.
