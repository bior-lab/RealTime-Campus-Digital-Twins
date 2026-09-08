import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const code = app.slice(app.indexOf('function circularDirectionMean'), app.indexOf('function weatherRowsForPeriod'));
const context = vm.createContext({ Math, Number });
vm.runInContext(code, context);
assert.ok(Math.abs(context.circularDirectionMean([350, 10])) < 1e-9);
assert.ok(Math.abs(context.circularDirectionMean([80, 100]) - 90) < 1e-9);
assert.equal(context.circularDirectionMean([]), null);
assert.match(app, /wet_bulb_temperature_2m_mean,wind_direction_10m_dominant/);
for (const id of ['weatherHeatChart', 'weatherWindChart', 'weatherHeatTitle', 'weatherWindTitle']) {
  assert.match(html, new RegExp(`id="${id}"`));
}
console.log('PASS: Kent Ridge WBGT/wind series, yearly variables and circular direction mean.');
