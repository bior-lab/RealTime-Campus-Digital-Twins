// Read-only public API audit. Prints coverage metadata, never raw meter values.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import '../src/building-history.js';
const base = 'https://buildingdt.org/realtime';
const latestResponse = await fetch(`${base}/latest?building`, { signal: AbortSignal.timeout(30000) });
if (!latestResponse.ok) throw new Error(`Latest HTTP ${latestResponse.status}`);
const latest = await latestResponse.json();
const candidates = latest.filter(row => /hourly.*(cool|elect|energy|generation|kwh)|cool.*hourly/i.test(row.point)
  && !/all|Act_E-Recv/i.test(row.point));
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), buildings: [...new Set(latest.map(r => r.building))], latestPoints: latest.length, historyPointsToCheck: candidates.length }));
let cursor = 0;
const history = new Map();
async function worker() {
  while (cursor < candidates.length) {
    const row = candidates[cursor++];
    const result = { building: row.building, point: row.point, latest: row.time };
    try {
      const params = new URLSearchParams({ building: row.building, point: row.point, start: '-365d', stop: 'now()', limit: '20000' });
      const response = await fetch(`${base}/range?${params}`, { signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      const rows = (payload.points || []).filter(r => r.v !== null && r.v !== undefined && r.v !== '' && Number.isFinite(Number(r.v)) && Number.isFinite(Date.parse(r.t)));
      history.set(`${row.building}:${row.point}`, rows);
      const dates = rows.map(r => new Date(Date.parse(r.t) + 8 * 3600000).toISOString().slice(0, 10)).sort();
      const months = {};
      for (const date of new Set(dates)) months[date.slice(0, 7)] = (months[date.slice(0, 7)] || 0) + 1;
      Object.assign(result, { rows: rows.length, first: dates[0], last: dates.at(-1), daysPerMonth: months });
    } catch (error) { result.error = error.message; }
    if (process.argv.includes('--points') || result.error) console.log(JSON.stringify(result));
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const mappingSource = app.slice(app.indexOf('const apiBuildingAliases'), app.indexOf('const realtimeConfig'))
  + app.slice(app.indexOf('const buildingModelDefinitions'), app.indexOf('const marketRealtimeValues'));
const mapping = vm.runInNewContext(`${mappingSource}\nJSON.stringify(buildingHistoryPointMap)`);
let failed = false;
for (const [building, metrics] of Object.entries(JSON.parse(mapping))) {
  for (const [metric, definition] of Object.entries(metrics)) {
    const points = Array.isArray(definition) ? definition : [definition];
    const apiCode = building === 'T-LAB' ? 'TLAB' : building;
    const rowSets = points.map(point => history.get(`${apiCode}:${point}`) || []);
    const data = globalThis.NUSBuildingHistory.aggregate(globalThis.NUSBuildingHistory.combineComponents(rowSets));
    if (!data) failed = true;
    console.log(JSON.stringify({ building, metric, yearlyMonths: data?.yearly.filter(Number.isFinite).length || 0,
      first: data?.sourceStart, last: data?.latest, monthly: data?.monthlyMonth,
      days: data?.monthProfiles[data.monthlyMonth].reportedDays, partialDays: data?.monthProfiles[data.monthlyMonth].partialDays,
      fullAxisDays: data?.monthly.length }));
  }
}
if (failed) process.exitCode = 1;
