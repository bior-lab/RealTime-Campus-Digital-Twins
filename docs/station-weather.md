# SDE4 weather station display

The Reference location selector switches between the existing Kent Ridge Open-Meteo
view and four SDE4 station charts. No station data is substituted with Open-Meteo.
The station variant reuses dashboard cards, teal lines, outlined dots, field controls,
status tags and existing typography. Points support hover, keyboard focus and tap.
Each failed range request is retried once before its chart receives an error state.

Source: Building DT `/realtime/range`, four exact SDE4 Weather Station point names.
Each visit fetches at most four ranges, with shared in-flight requests and a 15-minute
memory cache. Refresh explicitly reloads. Failed points have individual retryable
empty states. Data older than three hours is marked delayed per chart, not called live.

- Weekly: current and previous six Singapore calendar days, samples at 00:00,
  03:00, …, 21:00 SGT; missing samples remain gaps.
- Monthly: current and previous 29 Singapore calendar days, available-hour daily means.
- Yearly: current calendar year to date, available-hour monthly means. No future months.
- Zero is retained; null, blank, nonnumeric, invalid and future timestamps are excluded.
- Daily/monthly means are not completeness-weighted estimates; today's/current month's
  buckets are partial and each point reports the number of contributing observations.

PI metadata supplied by the user on 7 September 2026 declares temperature in °C
(Pt100 descriptor), humidity in %RH and solar irradiance in W/m². Wind engineering
units are empty. No signal is rescaled. Unit declarations do not validate calibration.
For presentation, relative humidity uses the Grafana-observed 0–10 signal mapping to
0–100% (`value × 10`) and is clamped to the physical display range. The upstream hourly
history also contains 0/100 switching, so this conversion is a display convention and
does not establish sensor calibration. Wind is normalized to `[0, 360)` using modulo 360, supported by the PI descriptor and
the supplied Grafana comparison between raw direction near 380–400 and mean direction
near 20 degrees. Daily and monthly wind values use circular means, so values around
north do not incorrectly average to 180 degrees. The public UI presents these as normal
weather series without engineering diagnostic paragraphs.
Public history does not expose PI quality flags; this UI does not claim to verify them.

The Kent Ridge view uses the same current-condition strip and full-width chart-card
pattern. In addition to the combined temperature/RH chart, it includes Estimated WBGT
and Wind Direction for Weekly, Monthly and Yearly periods. Yearly values use Open-Meteo
ERA5 mean wet-bulb temperature and dominant 10 m wind direction; monthly wind direction
is combined with a circular mean.

Tests: `node tools/test-station-weather.mjs`.
