# Data Inventory for CA-TCC Future Work Mapping

Generated from local files under `C:/Users/Administrator/Desktop/bior_database` and `Agent-Online-FDD`.

## Key Findings

- PI metadata discovery contains **105 AHU candidates** across **9 building groups**.
- **59 AHU candidates** are metadata-level pilot-ready; **61** are minimal-ready.
- Current validated historical PI replay is concentrated on **SDE4 PAHU-L2-01**. `field_p1_canonical.csv` has **8640 rows** and 9 canonical points at 15-min interval.
- Processed PAHU audit data has **25,921 rows**, 26 columns, and 5-min interval over 90 days.
- The PI discovery workbook contains point classes for AHU/PAHU, VAV/FCU, BTU, CHW, cooling, energy, water, flow, and weather-related support.
- Local public AFDD datasets contain labelled `Fault Detection Ground Truth` for quantitative limited-label evaluation.

## Generated Tables

| File | Purpose |
| --- | --- |
| `pi_ahu_coverage_by_building.csv` | AHU candidate count and canonical point coverage by building |
| `pi_ahu_top_candidates.csv` | Top AHU candidates for history retrieval |
| `pi_selected_canonical_points_no_webid.csv` | Canonical AHU point mapping without WebIds |
| `pi_meter_and_equipment_point_counts_by_building.csv` | Meter/BTU/CHW/water/equipment point count by PI workbook sheet |
| `pi_meter_water_btu_point_samples.csv` | Sample meter/BTU/CHW/water points by building sheet |
| `pulled_timeseries_inventory.csv` | Local pulled time-series files from PI exports |
| `future_work_data_support_matrix.csv` | Mapping from CA-TCC future work to current data support |

## Interpretation

The current data supports a deployment-aware time-series representation learning study if the main claim is restricted to unlabeled or weakly-labelled BAS representation, online adaptation, sensor/point robustness, and physics-residual guidance. The data do not yet support confirmed campus root-cause diagnosis or cross-building fault classification without additional PI history pulls and labels.
