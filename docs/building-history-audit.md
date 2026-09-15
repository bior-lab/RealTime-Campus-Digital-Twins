# Buildings history audit — 7 September 2026

Read-only check at approximately 19:45 SGT. No raw meter values are stored in this report.

## Findings

- `https://buildingdt.org/realtime/latest?building` returned 106 latest point records across 16 API building groups. This is a latest-value inventory, not a time series.
- Checked 63 energy-related point histories using `/realtime/range`, `start=-365d`, `stop=now()`, `limit=20000`, with at most four concurrent requests. A one-year request does not imply one year of available data.
- Legacy `hourly_electrical_consumption` and `hourly_cooling_consumption` points stop at 22 August 2026 04:00 SGT. Canonical `Total Hourly Electrical Consumption` / `Total Hourly Cooling Consumption` points continue to 7 September 2026 19:00 SGT.
- SDE1, SDE2 and SDE4 use `Total Cooling Hourly Consumption` (different word order). SDE4 PV retains its two `solar_m*_hourly_energy` components.
- SDE3 canonical cooling and PV records with current timestamps are returned under building **E3**. This upstream attribution requires confirmation/correction by the data owner. The Campus UI retains SDE3's existing SDE3-scoped historical points; it does not silently use E3-scoped records.
- E3 and E7 exist in the API but are not in the current 16-building campus map selection. Ventus and S1A are on the map but have no configured energy histories.

## Verified current UI coverage

Dates below refer to usable histories, not continuous completeness. Charts exclude the current incomplete Singapore day. Canonical and legacy point names are not added together or silently stitched, so switching to the canonical source may change older totals and coverage.

| Campus building(s) | Electricity history | Cooling history | PV history |
| --- | --- | --- | --- |
| CELS, COM3, E3A, MD1 | Jun–Sep 2026 | Jun–Sep 2026 | Not mapped |
| E6, E8, MD2, MD6, S9, T-LAB | Jun–Sep 2026 | May–Sep 2026 | Not mapped |
| SDE1, SDE2 | Not mapped | May–Sep 2026 | Not mapped |
| SDE4 | Not mapped | May–Sep 2026 | May–Sep 2026 |
| SDE3 | Not mapped | May–Aug 2026, legacy stream | May–Aug 2026, legacy components |
| Ventus, S1A | Not mapped | Not mapped | Not mapped |

All 26 configured building/metric combinations returned usable historical values. Of these, 24 have 31 reported days in August with 24 readings per day after timestamp deduplication and component matching. SDE3's two metrics have 22 reported days in August, with the last day incomplete; the automatic monthly view uses an earlier fully reported month. Missing metrics display “No reported data”.

## Local implementation

- Buildings defaults to Yearly (month-total bars). Monthly shows daily totals on a complete 28–31-day calendar axis, with the automatically selected month stated below the chart title. The manual reporting-month selector was removed at the user's request. No Weekly/hourly view in Buildings.
- Prefer the latest ended month with complete daily reporting coverage. If none exists, show the latest ended month containing data; if only current-month data exists, show that partial month with coverage labels.
- Ignore null, empty and invalid readings; retain genuine zero values. Deduplicate timestamps. For PV sums, require every configured component at the same timestamp.
- Request only the selected metric. Reuse successful history results for up to 15 minutes; coalesce simultaneous requests. On an unsuccessful refresh, show unavailable data rather than retaining an unmarked stale chart. A refresh is triggered by the existing refresh cycle or a relevant user interaction, not a new background scheduler.
- Correct the chart grid's intrinsic-width overflow so the right-hand months are no longer clipped.

## Disclosure boundary

Daily/monthly chart aggregation is a presentation choice, **not access control**. The current frontend still obtains hourly history from the public API, and other dashboard modules may expose more detailed data. Restricting raw access requires a server-side aggregate endpoint plus appropriate access controls on the original endpoints. No production API permissions or other dashboard modules were changed in this task.

## Recheck

```powershell
node tools/test-building-history.mjs
node tools/audit-building-history.mjs
# Include individual point coverage metadata (no raw values):
node tools/audit-building-history.mjs --points
```

The audit requires network access. API results are a point-in-time snapshot; coverage may change.
