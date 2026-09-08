import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context = vm.createContext({ Intl, Date, URLSearchParams, AbortSignal });
vm.runInContext(readFileSync(new URL('../src/station-weather.js', import.meta.url), 'utf8'), context);
const api = context.NUSStationWeather;
const now = Date.parse('2026-09-07T14:00:00Z');
const input = [
  { t: '2026-09-07T01:00:00Z', v: 383.87738 },
  { t: '2026-09-07T04:00:00Z', v: 0.0306873936 },
  { t: '2026-09-07T07:00:00Z', v: null },
  { t: '2026-09-07T08:00:00Z', v: '' },
  { t: '2026-09-07T09:00:00Z', v: { Name: 'No Data' } },
  { t: '2026-09-07T10:00:00Z', v: 0 },
  { t: '2026-09-08T01:00:00Z', v: 900 },
];
const rows = api.normalise(input, now);
assert.equal(rows.length, 3);
assert.equal(rows[0].v, 383.87738, 'Generic normalisation does not infer a conversion');
assert.equal(rows[1].v, 0.0306873936, 'Generic normalisation keeps source values');
assert.equal(rows[2].v, 0, 'Keep legitimate zero');
const weekly = api.aggregate(rows, '7d', now);
assert.equal(weekly.filter(r => r.v !== null).length, 3);
assert.equal(weekly.find(r => r.t === Date.parse('2026-09-07T07:00:00Z')).v, null);
const monthly = api.aggregate(rows, '30d', now);
assert.equal(monthly.length, 30);
assert.equal(monthly.at(-1).n, 3);
assert.equal(monthly.at(-1).v, (383.87738 + 0.0306873936) / 3);
const yearly = api.aggregate(rows, 'yearly', now);
assert.equal(yearly.length, 9);
assert.equal(yearly[0].v, null);
assert.equal(yearly.at(-1).n, 3);
const midnight = api.normalise([{ t: '2026-08-31T16:00:00Z', v: 10 }], now);
assert.equal(api.aggregate(midnight, 'yearly', now)[8].v, 10, 'Bucket in SGT, not UTC');
assert.equal(api.normalise([input[0], { ...input[0], v: 42 }], now).length, 1);
assert.ok(Math.abs(api.wrapDegrees(383.87738) - 23.87738) < 1e-9);
assert.equal(api.wrapDegrees(-10), 350);
assert.ok(Math.abs(api.humidityPercent(0.0306873936) - 0.306873936) < 1e-9);
assert.equal(api.humidityPercent(10), 100);
assert.equal(api.humidityPercent(100), 100, 'Clamp out-of-range source values to the physical display range');
assert.ok(Math.abs(api.circularMean([350, 10])) < 1e-9, 'Circular mean crosses north instead of returning 180');
assert.ok(Math.abs(api.aggregate([{ t: Date.parse('2026-09-07T01:00:00Z'), v: 350 }, { t: Date.parse('2026-09-07T02:00:00Z'), v: 10 }], '30d', now, 'circular').at(-1).v) < 1e-9);
console.log('PASS: station values, gaps, SGT buckets, sampling and diagnostic aggregates.');

// Exercise the source switch while four real-shaped requests are in flight.
const nodes = new Map();
const node = key => {
  if (!nodes.has(key)) nodes.set(key, { innerHTML: '', textContent: '', hidden: false,
    setAttribute() {}, append() {}, addEventListener() {}, classList: { toggle() {} },
    querySelector: selector => node(selector), querySelectorAll: () => [] });
  return nodes.get(key);
};
const requests = [];
const uiContext = vm.createContext({ Intl, Date, URLSearchParams, AbortSignal,
  document: { querySelector: selector => node(selector), getElementById: id => node(id), createElement: () => node('panel') },
  fetch: url => new Promise(resolve => requests.push({ url, resolve })) });
vm.runInContext(readFileSync(new URL('../src/station-weather.js', import.meta.url), 'utf8'), uiContext);
const ui = uiContext.NUSStationWeather;
ui.select('sde4');
const load = ui.load('7d');
ui.load('yearly');
assert.equal(requests.length, 4, 'Period switching shares in-flight range requests');
ui.select('kent-ridge');
for (const [i, request] of requests.entries()) {
  request.resolve(i === 1 ? { ok: false, status: 503 } : { ok: true, json: async () => ({
    building: 'SDE4', point: new URL(request.url).searchParams.get('point'),
    points: [{ t: new Date().toISOString(), v: 42 }] }) });
}
await new Promise(resolve => setImmediate(resolve));
assert.equal(requests.length, 5, 'A failed point is retried once');
requests[4].resolve({ ok: false, status: 503 });
await load;
assert.equal(node('weatherSourceStatus').textContent, 'Open-Meteo · loading', 'Late station responses cannot overwrite Kent Ridge');
ui.select('sde4');
await ui.load('yearly');
assert.equal(requests.length, 5, 'Cached station history reused');
assert.match(node('panel').innerHTML, /Air Temperature · Yearly/);
assert.match(node('panel').innerHTML, /Station data unavailable/, 'One failed point has its own failure state');
assert.match(node('panel').innerHTML, /Solar Irradiance · Yearly/);
assert.match(node('panel').innerHTML, /Relative Humidity · Yearly/);
assert.match(node('panel').innerHTML, /weather-axis-unit/, 'SDE4 charts use the same in-plot series label as Kent Ridge');
assert.match(node('panel').innerHTML, /weather-chart-tooltip/, 'SDE4 charts use the Kent Ridge floating tooltip component');
assert.match(node('panel').innerHTML, /data-station-hit/, 'SDE4 chart points expose accessible tooltip hit areas');
assert.doesNotMatch(node('panel').innerHTML, /station-readout/, 'The old inline readout is removed');
assert.doesNotMatch(node('panel').innerHTML, /Not converted|Invalid source signal|diagnostic/);
console.log('PASS: request deduplication, source-switch isolation, period switching and partial failure.');
