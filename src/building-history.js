// Public Buildings views use daily/monthly aggregates, never hourly charts.
(() => {
  const singaporeDay = time => new Date(time + 8 * 3600000).toISOString().slice(0, 10);
  function normalise(rows) {
    const unique = new Map();
    for (const row of rows) {
      const raw = row.v ?? row.value;
      const time = Date.parse(row.t || row.time || row.timestamp);
      if (raw === null || raw === undefined || (typeof raw !== 'number' && typeof raw !== 'string') || String(raw).trim() === '' || !Number.isFinite(Number(raw)) || !Number.isFinite(time)) continue;
      unique.set(time, { t: new Date(time).toISOString(), v: Number(raw) });
    }
    return [...unique.values()].sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
  }
  function combineComponents(rowSets) {
    if (!rowSets.length) return [];
    const components = rowSets.map(rows => new Map(normalise(rows).map(row => [row.t, row.v])));
    // PV components are additive, not aliases: do not present one missing meter as a total.
    return [...components[0]].filter(([time]) => components.every(component => component.has(time)))
      .map(([t]) => ({ t, v: components.reduce((total, component) => total + component.get(t), 0) }));
  }
  function aggregate(rows, now = Date.now()) {
    const today = singaporeDay(now);
    const valid = normalise(rows).filter(row => singaporeDay(Date.parse(row.t)) < today);
    if (!valid.length) return null;
    const daily = new Map();
    const hourlyCounts = new Map();
    for (const row of valid) {
      const date = singaporeDay(Date.parse(row.t));
      daily.set(date, (daily.get(date) || 0) + row.v);
      hourlyCounts.set(date, (hourlyCounts.get(date) || 0) + 1);
    }
    const year = today.slice(0, 4);
    const currentMonth = today.slice(0, 7);
    const availableMonths = [...new Set([...daily.keys()].map(date => date.slice(0, 7)))].sort();
    const monthProfiles = Object.fromEntries(availableMonths.map(month => {
      const [y, m] = month.split('-').map(Number);
      const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
      const labels = Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
      return [month, { labels, values: labels.map(date => daily.get(date) ?? null), reportedDays: labels.filter(date => daily.has(date)).length,
        partialDays: labels.filter(date => daily.has(date) && hourlyCounts.get(date) < 24).length }];
    }));
    const endedMonths = availableMonths.filter(month => month < currentMonth);
    const completeMonths = endedMonths.filter(month => monthProfiles[month].reportedDays === monthProfiles[month].labels.length && monthProfiles[month].partialDays === 0);
    const monthlyMonth = completeMonths.at(-1) || endedMonths.at(-1) || availableMonths.at(-1);
    const yearlyLabels = Array.from({ length: Number(today.slice(5, 7)) }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
    const yearly = yearlyLabels.map(month => {
      const values = monthProfiles[month]?.values.filter(Number.isFinite) || [];
      return values.length ? values.reduce((total, value) => total + value, 0) : null;
    });
    return { monthly: monthProfiles[monthlyMonth].values, monthlyLabels: monthProfiles[monthlyMonth].labels,
      monthlyMonth, availableMonths, monthProfiles, yearly, yearlyLabels,
      latest: valid.at(-1).t, sourceStart: valid[0].t };
  }
  globalThis.NUSBuildingHistory = { normalise, combineComponents, aggregate };
})();
