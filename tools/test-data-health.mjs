import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const context = vm.createContext({ Date });
vm.runInContext(readFileSync(new URL("../src/data-health.js", import.meta.url), "utf8"), context);
const api = context.NUSDataHealth;
const buildings = [
  { code: "FULL", name: "Full" },
  { code: "PART", name: "Partial" },
  { code: "NONE", name: "None" },
];
const realtimeByBuilding = {
  FULL: { electricityHourlyKwh: 1, coolingHourlyKwh: 2, pvKw: null, updateTime: "2026-09-08T10:00:00+08:00", points: [{}, {}] },
  PART: { electricityHourlyKwh: null, coolingHourlyKwh: 2, pvKw: 0, updateTime: "2026-09-08T09:00:00+08:00", points: [{}] },
};
const model = api.buildModel({
  buildings,
  realtimeByBuilding,
  coverageHints: { FULL: { coverage: "Mapped" }, PART: { coverage: "Partial" } },
  metricCapabilities: { FULL: ["electricity", "cooling"], PART: ["cooling", "pv"] },
});
assert.deepEqual(JSON.parse(JSON.stringify(model.summary)), {
  total: 3, reporting: 2, mapped: 1, partial: 1, missing: 1, records: 3,
  latest: "2026-09-08T10:00:00+08:00",
});
assert.equal(api.filterRows(model.rows, "all").length, 3);
assert.equal(api.filterRows(model.rows, "partial")[0].code, "PART");
assert.equal(api.filterRows(model.rows, "missing")[0].code, "NONE");
assert.equal(api.freshness("2026-09-08T10:00:00+08:00", Date.parse("2026-09-08T11:00:00+08:00")).key, "good");
assert.equal(api.freshness("2026-09-08T04:00:00+08:00", Date.parse("2026-09-08T11:00:00+08:00")).key, "missing");
assert.equal(api.freshness(null).key, "missing");
console.log("PASS: live data-health model, filters, record totals and freshness states.");
