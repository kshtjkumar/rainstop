// Leave-time engine tests: loads the real app.js in a sandbox with a stubbed DOM and a
// mocked network, then checks the planning maths and failure handling.
// Run: node test_leave_engine.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passed = 0;
let failed = 0;
function assert(cond, name, detail) {
  if (cond) { passed++; console.log(`✅ PASS: ${name}`); }
  else { failed++; console.error(`❌ FAIL: ${name}${detail !== undefined ? ' — ' + JSON.stringify(detail) : ''}`); }
}

// Minimal DOM: every element is a forgiving proxy.
const el = () => new Proxy(function () {}, {
  get: (t, k) => {
    if (k === 'style' || k === 'dataset') return {};
    if (k === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
    if (k === 'querySelectorAll') return () => [];
    if (typeof k === 'string' && /^(textContent|innerHTML|value|title|className)$/.test(k)) return '';
    return el();
  },
  set: () => true,
  apply: () => el()
});

function loadApp(fetchImpl) {
  const store = {};
  const ctx = {
    console: { log() {}, warn() {}, error: console.error },
    fetch: fetchImpl || (async () => { throw new Error('offline'); }),
    AbortController, setTimeout, clearTimeout, setInterval() {}, Date, Math, JSON, Number, Array, Object, String, Promise, URLSearchParams,
    document: { getElementById: () => el(), querySelector: () => el(), querySelectorAll: () => [], addEventListener() {}, createElement: () => el(), hidden: false },
    window: { addEventListener() {} }, navigator: {},
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    requestAnimationFrame() {}
  };
  vm.createContext(ctx);
  const src = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
  vm.runInContext(src + `;this.X = { computeLeavePlan, toleranceRateFor, computeWetness, rateAt, latLonToTilePixel,
    seriesFromScenario, fetchLiveOpenMeteo, SCENARIOS, appState, computeLeavePlanForState, applyGroundReport,
    activeGroundReport, updateUI, GOOD_P, tripMinutes };`, ctx);
  return ctx.X;
}

// Series helper: `rates` (mm/h) per step starting at startSec.
function series(group, system, stepSec, startSec, rates) {
  return { group, system, stepSec, endTimes: rates.map((_, i) => startSec + (i + 1) * stepSec), rates };
}
const NOW = 1800000000; // multiple of 300 s: bucket b covers (NOW + 300b, NOW + 300(b+1)]
const fill = (n, v) => new Array(n).fill(v);

const A = loadApp();

// ---------------------------------------------------------------------------
console.log('\n[1] Tolerance derived from the wetness model');
const noGear = { umbrella: false, raincoat: false, shoeCovers: false, bagCover: false };
const tolWalk = A.toleranceRateFor('walk', noGear, 5, 1);
const tolWalkCoat = A.toleranceRateFor('walk', { ...noGear, raincoat: true, shoeCovers: true }, 5, 1);
const tolScooter = A.toleranceRateFor('scooter', noGear, 5, 1);
const tolCar = A.toleranceRateFor('car', noGear, 5, 1);
const tolWalkRelaxed = A.toleranceRateFor('walk', noGear, 5, 2);
assert(tolCar === Infinity, 'car tolerates any rain', tolCar);
assert(tolScooter === 0, 'scooter without gear tolerates no rain', tolScooter);
assert(tolWalkCoat > tolWalk, 'raincoat + boots raise walking tolerance', [tolWalk, tolWalkCoat]);
assert(tolWalkRelaxed >= tolWalk, '"damp socks OK" never lowers tolerance', [tolWalk, tolWalkRelaxed]);
for (const r of [0.1, 0.5, 1, 3, 8]) {
  const tier = A.computeWetness(r, { mode: 'walk', gear: noGear, windSpeed: 5, puddleHigh: r > 4 }).tier;
  assert((r <= tolWalk) === (tier <= 1), `tolerance agrees with avatar tier at ${r} mm/h`, { tolWalk, tier });
}

// ---------------------------------------------------------------------------
console.log('\n[2] Leave-time maths');
const four = (rates, step = 300) => ['ecmwf', 'gfs', 'icon', 'jma'].map(m => series('det', m, step, NOW, rates));

let p = A.computeLeavePlan(four(fill(100, 0)), { nowSec: NOW, tripMin: 20, tol: 0 });
assert(p.leaveNowOk && p.candidates[0].pOk >= 0.9 && p.candidates[0].pOk <= 0.97, 'all dry → leave now, high but never 100%', p.candidates[0]);

p = A.computeLeavePlan(four([...fill(6, 2), ...fill(94, 0)]), { nowSec: NOW, tripMin: 20, tol: 0.5 });
assert(p.earliestGood && p.earliestGood.offsetMin === 30, 'rain until +30 min → leave at +30 (trip must fit after rain)', p.earliestGood);

const gap = [...fill(6, 2), ...fill(3, 0), ...fill(91, 2)]; // 15-min dry gap at +30..+45
p = A.computeLeavePlan(four(gap), { nowSec: NOW, tripMin: 20, tol: 0 });
assert(!p.earliestGood && p.beyondHorizon, '20-min walk cannot use a 15-min gap', p.earliestGood);
p = A.computeLeavePlan(four(gap), { nowSec: NOW, tripMin: 10, tol: 0 });
assert(p.earliestGood && p.earliestGood.offsetMin === 30, '10-min trip uses the 15-min gap at +30', p.earliestGood);
assert(p.windows.length === 1 && p.windows[0].startMin === 30 && p.windows[0].endMin === 40, 'gap window reported as +30..+40 departures', p.windows);

p = A.computeLeavePlan(four(fill(100, 0.4)), { nowSec: NOW, tripMin: 20, tol: tolWalk });
const pScoot = A.computeLeavePlan(four(fill(100, 0.4)), { nowSec: NOW, tripMin: 5, tol: tolScooter });
const pCar = A.computeLeavePlan(four(fill(100, 0.4)), { nowSec: NOW, tripMin: 8, tol: tolCar });
assert(p.leaveNowOk === (0.4 <= tolWalk), 'steady 0.4 mm/h drizzle vs walker tolerance', { tolWalk });
assert(!pScoot.leaveNowOk && pCar.leaveNowOk, 'drizzle: scooter without gear waits, car goes', [pScoot.leaveNowOk, pCar.leaveNowOk]);

// Ensemble: systems weighted equally, not by member count.
const ens = [
  ...Array.from({ length: 51 }, (_, i) => series('ens', 'ecmwf_ens', 3600, NOW, fill(8, 3))),
  ...Array.from({ length: 31 }, (_, i) => series('ens', 'gefs', 3600, NOW, fill(8, 0))),
  ...Array.from({ length: 40 }, (_, i) => series('ens', 'icon_eps', 3600, NOW, fill(8, 0)))
];
p = A.computeLeavePlan(ens, { nowSec: NOW, tripMin: 20, tol: 0.5 });
assert(Math.abs(p.candidates[0].pEns - 0.66) < 0.03, 'ensemble averaged per system (≈ 2/3, not 71/122)', p.candidates[0].pEns);
assert(p.notes.includes('hourly resolution'), 'ensemble-only plan flagged as hourly resolution', p.notes);

// Disagreement: 3 of 4 models wet, ensemble dry.
const det = [series('det', 'a', 300, NOW, fill(100, 2)), series('det', 'b', 300, NOW, fill(100, 2)), series('det', 'c', 300, NOW, fill(100, 2)), series('det', 'd', 300, NOW, fill(100, 0))];
const ensDry = Array.from({ length: 10 }, () => series('ens', 'x', 3600, NOW, fill(8, 0)));
p = A.computeLeavePlan([...det, ...ensDry], { nowSec: NOW, tripMin: 10, tol: 0.5 });
assert(p.notes.includes('models disagree'), 'large model/ensemble disagreement is flagged', p.notes);

// Recommendation: a fair chance now beats waiting hours for a few points.
const oneWet = (n) => [series('det', 'a', 300, NOW, [...fill(n, 2), ...fill(100, 0)]), ...['b', 'c', 'd'].map(m => series('det', m, 300, NOW, fill(n + 100, 0)))];
const ens30 = Array.from({ length: 10 }, (_, i) => series('ens', 'y', 3600, NOW, fill(10, i < 3 ? 2 : 0)));
p = A.computeLeavePlan([...oneWet(60), ...ens30], { nowSec: NOW, tripMin: 20, tol: 0.5 });
assert(p.recommended.kind === 'now-fair' && p.recommended.offsetMin === 0, 'fair now + small gain hours later → leave now', { rec: p.recommended, good: p.earliestGood, now: p.candidates[0].pOk });
p = A.computeLeavePlan(oneWet(60), { nowSec: NOW, tripMin: 20, tol: 0.5 });
assert(p.recommended.kind === 'wait' && p.recommended.offsetMin === 300, 'clear gain later → wait', p.recommended);
p = A.computeLeavePlan(four([...fill(4, 2), ...fill(96, 0)]), { nowSec: NOW, tripMin: 10, tol: 0 });
assert(p.recommended.kind === 'wait' && p.recommended.offsetMin === 20, 'short wait for a good window → wait', p.recommended);
p = A.computeLeavePlan(four(fill(100, 3)), { nowSec: NOW, tripMin: 10, tol: 0.5 });
assert(p.recommended.kind === 'no-better' && p.recommended.offsetMin === 0, 'rain all day → "waiting won\'t help"', p.recommended);

// Observations
p = A.computeLeavePlan(four(fill(100, 0)), { nowSec: NOW, tripMin: 10, tol: 0.5, obs: { rainTau: 20, source: 'radar' } });
assert(p.candidates[0].pOk <= 0.2, 'radar rain at location overrides dry models now', p.candidates[0].pOk);
assert(p.candidates[8].pOk >= A.GOOD_P, 'radar influence fades by +40 min', p.candidates[8].pOk);
const wetPlan = A.computeLeavePlan(four(fill(100, 2)), { nowSec: NOW, tripMin: 10, tol: 0.5 });
p = A.computeLeavePlan(four(fill(100, 2)), { nowSec: NOW, tripMin: 10, tol: 0.5, obs: { dry: true } });
assert(p.candidates[0].pOk > wetPlan.candidates[0].pOk, '"Dry here" report raises near-term chance', [wetPlan.candidates[0].pOk, p.candidates[0].pOk]);
assert(p.candidates[12].pOk === wetPlan.candidates[12].pOk, '"Dry here" report does not change +60 min', [wetPlan.candidates[12].pOk, p.candidates[12].pOk]);

// Horizon / nulls / long trips
p = A.computeLeavePlan(four(fill(12, 2)), { nowSec: NOW, tripMin: 10, tol: 0 });
assert(p.horizonMin <= 60 && p.beyondHorizon, 'short wet series → horizon cut, no fake window', { h: p.horizonMin });
p = A.computeLeavePlan(four([...fill(6, 0), null, null, ...fill(50, 0)]), { nowSec: NOW, tripMin: 5, tol: 0 });
assert(p.candidates.length === 6 && p.candidates[0].leaveNowOk !== false, 'null values end the usable horizon instead of counting as dry', p.candidates.length);
p = A.computeLeavePlan(four(fill(200, 0)), { nowSec: NOW, tripMin: 193, tol: 0 });
assert(p && p.candidates.every(c => Number.isFinite(c.pOk)), 'very long trip (193 min) → finite results', p && p.candidates.length);
assert(A.computeLeavePlan([], { nowSec: NOW, tripMin: 10, tol: 0 }) === null, 'no data → null plan');

// Review regressions
let threw = null;
try { p = A.computeLeavePlan([series('det', 'z', 300, NOW, [...fill(8, 0), 5, 5, null, null, ...fill(80, 0)])], { nowSec: NOW, tripMin: 30, tol: 0.5 }); } catch (e) { threw = e.message; }
assert(!threw && p && p.candidates.length === 5 && p.candidates.every(c => Number.isFinite(c.expRate)), 'wet + missing buckets in one window → no crash, horizon stops at the gap', threw || (p && p.candidates.length));
const fresh = A.computeLeavePlan(four(fill(100, 0)), { nowSec: NOW, tripMin: 10, tol: 0.5, obs: { rainTau: 25, source: 'report', ageMin: 0 } });
const aged = A.computeLeavePlan(four(fill(100, 0)), { nowSec: NOW, tripMin: 10, tol: 0.5, obs: { rainTau: 25, source: 'report', ageMin: 25 } });
assert(aged.candidates[0].pOk > fresh.candidates[0].pOk, 'older rain report weighs less than a fresh one', [fresh.candidates[0].pOk, aged.candidates[0].pOk]);
p = A.computeLeavePlan(four(fill(100, 0)), { nowSec: NOW, tripMin: 10, tol: 0.5, dataAgeMin: 120 });
assert(p.confidence === 'Low' && p.notes.some(n => n.includes('min old')), 'forecast data 2 h old → Low confidence + age note', { c: p.confidence, n: p.notes });
p = A.computeLeavePlan([...oneWet(100), ...ens30], { nowSec: NOW, tripMin: 20, tol: 0.5 });
assert(p.candidates[0].expRate > 0, 'tier uses blended members: some models wet → non-zero expected rate', p.candidates[0].expRate);

// Hourly slot semantics: value at T covers (T-1h, T]
const hourly = series('det', 'h', 3600, NOW, [0, 5, 0, 0, 0, 0, 0]);
assert(A.rateAt(hourly, NOW + 1800) === 0 && A.rateAt(hourly, NOW + 3600 + 1) === 5 && A.rateAt(hourly, NOW + 7200) === 5 && A.rateAt(hourly, NOW + 7201) === 0, 'rateAt respects (T-step, T] intervals');

// ---------------------------------------------------------------------------
console.log('\n[3] Radar tile maths');
const t = A.latLonToTilePixel(26.5123, 80.2329, 6);
assert(t.x === 46 && t.y === 27 && t.px === 67 && t.py === 27, 'Kanpur → z6 tile 46/27 pixel 67,27', t);

// ---------------------------------------------------------------------------
console.log('\n[4] Ground reports');
const B = loadApp();
B.appState.groundReport = { type: 'rain', at: Date.now() };
const rp = B.applyGroundReport({ rainProfile: fill(12, 0), stopMinutes: 0, rainIntensity: 'dry_now' });
assert(rp.rainProfile[0] >= 1 && rp.stopMinutes !== 45 && rp.rainIntensity !== 'dry_now', 'Rain Here marks now as raining without inventing a 45-min storm', rp);
B.appState.groundReport = { type: 'rain', at: Date.now() - 31 * 60000 };
assert(B.activeGroundReport() === null, 'ground report expires after 30 min');

// ---------------------------------------------------------------------------
console.log('\n[5] Live pipeline with mocked APIs + failure matrix');
function mockFetch(fail) {
  const nowSec = Math.floor(Date.now() / 1000);
  const base = nowSec - (nowSec % 900);
  const times15 = Array.from({ length: 192 }, (_, i) => base + i * 900);
  const timesH = Array.from({ length: 48 }, (_, i) => base - (base % 3600) + i * 3600);
  const wet15 = times15.map((_, i) => (i < 4 ? 0.5 : 0)); // rain for ~1 h then dry
  const ok = (json) => ({ ok: true, json: async () => json });
  return async (url) => {
    if (url.includes('ensemble-api')) {
      if (fail.ens) throw new Error('ens down');
      const hourly = { time: timesH };
      for (let m = 0; m < 10; m++) hourly[`precipitation_member${String(m).padStart(2, '0')}_gfs025`] = timesH.map((_, i) => (i < 1 ? 1 : 0));
      return ok({ hourly });
    }
    if (url.includes('models=')) {
      if (fail.det) throw new Error('det down');
      const m = { time: times15 };
      ['ecmwf_ifs025', 'gfs_seamless', 'icon_seamless', 'jma_seamless'].forEach(k => { m[`precipitation_${k}`] = wet15; });
      return ok({ minutely_15: m });
    }
    if (url.includes('rainviewer')) {
      if (fail.rv) throw new Error('rv down');
      return ok({ host: 'https://tilecache.rainviewer.com', radar: { past: [{ time: nowSec - 300, path: '/v2/radar/x' }], nowcast: [] } });
    }
    if (fail.a0) throw new Error('a0 down');
    return ok({
      current: { weather_code: 61, wind_speed_10m: 5, temperature_2m: 25, precipitation: 0.5 },
      minutely_15: { time: times15, precipitation: wet15, weather_code: times15.map(() => 61) },
      hourly: { time: timesH, precipitation: timesH.map(() => 0), weather_code: timesH.map(() => 0), temperature_2m: timesH.map(() => 25) }
    });
  };
}
const settle = () => new Promise(r => setTimeout(r, 50));
(async () => {
  const combos = [{}, { ens: 1 }, { det: 1 }, { rv: 1 }, { det: 1, ens: 1 }, { a0: 1 }, { a0: 1, det: 1, ens: 1, rv: 1 }];
  for (const fail of combos) {
    const C = loadApp(mockFetch(fail));
    C.appState.originCoords = { lat: 26.5, lon: 80.2 };
    let threw = null;
    try {
      await C.fetchLiveOpenMeteo(26.5, 80.2, 'Test');
      await settle();
      C.updateUI();
    } catch (e) { threw = e.message; }
    const plan = C.appState.leavePlan;
    const label = Object.keys(fail).join('+') || 'none';
    assert(!threw, `failures [${label}] → no exception`, threw);
    if (fail.a0 && fail.det && fail.ens) {
      assert(plan === null, 'all forecast sources down → no plan (UI falls back)', plan && plan.sources);
    } else {
      assert(!!plan && plan.candidates.length > 0, `failures [${label}] → plan still computed`, plan && plan.sources);
      if (plan) {
        const expectDet = fail.det ? (fail.a0 ? 0 : 1) : 4;
        assert(plan.sources.det === expectDet, `failures [${label}] → ${expectDet} deterministic source(s)`, plan.sources);
        assert(!plan.leaveNowOk && plan.earliestGood && plan.earliestGood.offsetMin > 0, `failures [${label}] → waits out the rain`, plan.earliestGood);
      }
    }
  }

  // Switching Labs → Live uses live data again (not the simulation path)
  const D = loadApp(mockFetch({}));
  D.appState.originCoords = { lat: 26.5, lon: 80.2 };
  await D.fetchLiveOpenMeteo(26.5, 80.2, 'Test'); await settle();
  D.appState.activeScenario = 'monsoon'; D.appState.currentScenarioData = D.SCENARIOS.monsoon;
  await D.fetchLiveOpenMeteo(26.5, 80.2, 'Test'); await settle();
  assert(D.appState.currentScenarioData === D.SCENARIOS.monsoon, 'live refresh does not overwrite an open simulation');
  D.appState.activeScenario = 'live'; D.appState.currentScenarioData = D.SCENARIOS.live; D.updateUI();
  assert(D.appState.leavePlan && D.appState.leavePlan.sources.det === 4, 'back on Live → plan uses all live models', D.appState.leavePlan && D.appState.leavePlan.sources);
  // Stale response for an old location is ignored
  const E = loadApp(mockFetch({}));
  E.appState.originCoords = { lat: 10, lon: 10 };
  await E.fetchLiveOpenMeteo(26.5, 80.2, 'Old spot'); await settle();
  assert(!E.appState.forecastBundle || !E.appState.forecastBundle.a0, 'response for a location the user left is dropped');

  // Lab scenarios use the same engine
  const S = loadApp();
  S.appState.activeScenario = 'monsoon';
  S.appState.currentScenarioData = S.SCENARIOS.monsoon;
  const sp = S.computeLeavePlanForState();
  assert(sp && !sp.leaveNowOk && sp.earliestGood, 'monsoon simulation → wait, then leave', sp && sp.earliestGood);

  console.log(`\n==========================================\n🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED\n==========================================`);
  process.exit(failed ? 1 : 0);
})();
