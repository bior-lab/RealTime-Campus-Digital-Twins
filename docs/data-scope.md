# Data Scope

## Core Data

The dashboard should start with data that can support public understanding and building comparison.

| Data group | Examples | Use |
| --- | --- | --- |
| Electricity | kW, kWh, peak demand | load trend, building comparison, forecast |
| Cooling | chilled water load, cooling energy | tropical campus analysis |
| Water | water use, daily trend | resource dashboard |
| Carbon | emissions factor, Scope 1 and Scope 2 | sustainability progress |
| Solar | PV output, daily generation | renewable contribution |
| Weather | temperature, humidity, solar radiation, rainfall | demand explanation and forecasting |
| Building metadata | area, type, zone, faculty, use | normalization and comparison |
| Calendar | semester, holiday, exam period, event | occupancy proxy |
| Meter status | data latency, missing values, meter coverage | data trust |

## Derived Indicators

- Energy use intensity: kWh per square metre.
- Peak demand: maximum demand within a period.
- Load factor: average load divided by peak load.
- Baseline deviation: difference between observed use and expected use.
- Carbon emissions: energy use multiplied by carbon factor.
- Solar share: solar generation divided by total electricity use.
- Forecast error: difference between forecasted and observed demand.

## AI Data Requirements

AI modules should use transparent inputs:

- historical energy use;
- weather;
- time of day;
- day of week;
- semester calendar;
- building type;
- operating schedule;
- previous anomalies.

## Data Governance Notes

- Public pages should avoid exposing security-sensitive meter details.
- Building-level data can be aggregated when required.
- All forecasts should show uncertainty or confidence.
- Missing or delayed data should be marked in the interface.
- Data methods should be documented on a public page.

