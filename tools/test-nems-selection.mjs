import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const code = source.slice(source.indexOf('async function loadNemsMarket('), source.indexOf('async function selectNemsProduct('));
const pending = [], renders = [];
const state = { activeNemsProduct: '10', activeNemsView: 'chart', nemsLoading: false, nemsProductCache: new Map(), nemsTableCache: new Map() };
const context = vm.createContext({ state, console,
  els: { nemsMarketBody: {}, nemsRefresh: { setAttribute() {}, removeAttribute() {} } },
  nemsMarketProducts: { '10': { title: 'Realtime' }, '17': { title: 'Price range' } },
  nemsMarketConfig: { endpoint: '/api/nems/realtime' },
  setNemsView() {}, updateNemsSourceStatus() {},
  renderActiveNemsChart(record) { renders.push({ selected: state.activeNemsProduct, source: record.source }); },
  fetch(url) { return new Promise(resolve => pending.push({ url, resolve })); }
});
vm.runInContext(code, context);
const first = vm.runInContext('loadNemsMarket()', context);
state.activeNemsProduct = '17';
await vm.runInContext('loadNemsMarket()', context);
const response = source => ({ ok: true, headers: { get() { return null; } }, async json() { return { success: true, data: { data: [{ source, lastupdate: 'test' }] } }; } });
pending[0].resolve(response('10'));
await first;
assert.equal(renders.length, 0, 'old request must not render under new selection');
assert.equal(pending.length, 2, 'latest selection must be loaded after the old request finishes');
assert.match(pending[1].url, /value=17/);
pending[1].resolve(response('17'));
await new Promise(resolve => setImmediate(resolve));
assert.deepEqual(renders, [{ selected: '17', source: '17' }]);
assert.equal(state.nemsLoading, false);
console.log('PASS: rapid product switches cannot render the previous product under a new title.');
