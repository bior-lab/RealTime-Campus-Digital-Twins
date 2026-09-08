(function dataHealthModule(root) {
  "use strict";

  const energyMetrics = ["electricity", "cooling", "pv"];

  function hasValue(value) {
    return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));
  }

  function buildModel({ buildings, realtimeByBuilding, coverageHints, metricCapabilities }) {
    const rows = buildings.map((building) => {
      const live = realtimeByBuilding[building.code] || null;
      const metrics = {
        electricity: hasValue(live?.electricityHourlyKwh),
        cooling: hasValue(live?.coolingHourlyKwh),
        pv: hasValue(live?.pvKw),
      };
      const expected = (metricCapabilities[building.code] || []).filter((metric) => energyMetrics.includes(metric));
      const availableCount = energyMetrics.filter((metric) => metrics[metric]).length;
      const missingExpected = expected.some((metric) => !metrics[metric]);
      let status = "mapped";
      if (!live || availableCount === 0) status = "missing";
      else if (String(coverageHints[building.code]?.coverage || "").toLowerCase() === "partial" || missingExpected) status = "partial";
      return {
        code: building.code,
        name: building.name,
        metrics,
        status,
        latest: live?.updateTime || null,
        recordCount: Array.isArray(live?.points) ? live.points.length : 0,
      };
    });
    const reporting = rows.filter((row) => row.status !== "missing").length;
    const partial = rows.filter((row) => row.status === "partial").length;
    const missing = rows.filter((row) => row.status === "missing").length;
    const mapped = rows.filter((row) => row.status === "mapped").length;
    const latest = rows.map((row) => row.latest).filter(Boolean).sort().at(-1) || null;
    return {
      rows,
      summary: {
        total: rows.length,
        reporting,
        mapped,
        partial,
        missing,
        records: rows.reduce((total, row) => total + row.recordCount, 0),
        latest,
      },
    };
  }

  function filterRows(rows, filter) {
    return filter === "all" ? rows : rows.filter((row) => row.status === filter);
  }

  function freshness(timestamp, now = Date.now(), expectedMinutes = 60) {
    const time = Date.parse(timestamp || "");
    if (!Number.isFinite(time)) return { key: "missing", label: "Unavailable", ageMinutes: null };
    const ageMinutes = Math.max(0, (now - time) / 60000);
    if (ageMinutes <= expectedMinutes * 3) return { key: "good", label: "Healthy", ageMinutes };
    if (ageMinutes <= expectedMinutes * 6) return { key: "partial", label: "Delayed", ageMinutes };
    return { key: "missing", label: "Stale", ageMinutes };
  }

  root.NUSDataHealth = { buildModel, filterRows, freshness };
})(globalThis);
