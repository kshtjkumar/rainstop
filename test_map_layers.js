// Map-first redesign tests: forecast grid, radar/model timeline, rain colours, metrics,
// hourly chart, sheet snapping, sandbox safety of updateUI() and static guards.
// Loads the real app.js in a sandbox (same harness as test_leave_engine.js).
// Run: node test_map_layers.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passed = 0;
let failed = 0;
function assert(cond, name, detail) {
  if (cond) { passed++; console.log(`✅ PASS: ${name}`); }
  else { failed++; console.error(`❌ FAIL: ${name}${detail !== undefined ? ' — ' + JSON.stringify(detail) : ''}`); }
}

const APP_SRC = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const CSS_SRC = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
const HTML_SRC = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Minimal DOM: every element is a forgiving proxy (no document.body / createElementNS / matchMedia).
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

function loadApp(fetchImpl, extra) {
  const store = {};
  const ctx = {
    console: { log() {}, warn() {}, error: console.error },
    fetch: fetchImpl || (async () => { throw new Error('offline'); }),
    AbortController, setTimeout, clearTimeout, setInterval() {}, Date, Math, JSON, Number, Array, Object, String, Promise, URLSearchParams, Map, Set,
    document: { getElementById: () => el(), querySelector: () => el(), querySelectorAll: () => [], addEventListener() {}, createElement: () => el(), hidden: false },
    window: { addEventListener() {} }, navigator: {},
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    requestAnimationFrame() {},
    ...(extra || {})
  };
  vm.createContext(ctx);
  vm.runInContext(APP_SRC + `;this.X = { buildGridPoints, parseGridResponse, buildTimelineFrames, rainColor, RAIN_SCALE,
    parseMetrics, fmtTemp, fmtWindDir, uvLevel, metricCards, nextSunEvent, buildHourlyChartModel, snapSheetTarget,
    sheetSnapsFor, isMobileMap, appState, updateUI, fetchLiveOpenMeteo, rebuildTimeline, showFrame, setMapLayer,
    timelineState, radarFrameLayers: () => radarFrameLayers, gridOverlay: () => gridOverlay, setMap: (m) => { mapInstance = m; } };`, ctx);
  return ctx.X;
}

const A = loadApp();
const NOW = 1800000000;

// ---------------------------------------------------------------------------
console.log('\n[1] Forecast grid points + response parsing');
const spec = A.buildGridPoints(26.5123, 80.2329);
assert(spec.points.length === 49 && spec.n === 7, '7 × 7 = 49 grid points', spec.points.length);
assert(Math.abs(spec.lat0 - 26.52) < 1e-9 && Math.abs(spec.lon0 - 80.28) < 1e-9, 'centre snapped to the 0.12° lattice', [spec.lat0, spec.lon0]);
assert(spec.points[0].lat > spec.points[48].lat && spec.points[0].lon < spec.points[6].lon, 'rows run north → south, columns west → east', [spec.points[0], spec.points[6], spec.points[48]]);
assert(Math.abs(spec.points[24].lat - spec.lat0) < 1e-9 && Math.abs(spec.points[24].lon - spec.lon0) < 1e-9, 'middle point is the snapped centre', spec.points[24]);
const spec2 = A.buildGridPoints(26.5125, 80.2331);
assert(spec2.lat0 === spec.lat0 && spec2.lon0 === spec.lon0, 'nearby start points share the same grid (cache key)');

const hours = Array.from({ length: 7 }, (_, i) => NOW - 1200 + i * 3600); // first hour already ended
const point = (k) => ({ hourly: { time: hours, precipitation: hours.map((_, i) => (i === 2 ? null : k * 0.1 + i)), precipitation_probability: hours.map(() => 40) } });
const gridJson = spec.points.map((_, k) => point(k));
const g = A.parseGridResponse(gridJson, spec, NOW);
assert(g.times.length === 6 && g.times.every(t => t > NOW), 'only future hours kept (max 6)', g.times.length);
assert(g.precip.length === 6 && g.precip[0].length === 49 && g.prob[0][0] === 40, 'precip/prob shaped [hour][row*n+col]', [g.precip.length, g.precip[0].length]);
assert(Number.isNaN(g.precip[1][0]), 'null precipitation → NaN (drawn transparent)', g.precip[1][0]);
assert(g.precip[0][5] === 5 * 0.1 + 1, 'values map to the right cell + hour', g.precip[0][5]);
let threw = null;
try { A.parseGridResponse(gridJson.slice(0, 48), spec, NOW); } catch (e) { threw = e.message; }
assert(!!threw, 'length mismatch throws', threw);
threw = null;
try { A.parseGridResponse(spec.points.map(() => ({ hourly: {} })), spec, NOW); } catch (e) { threw = e.message; }
assert(!!threw && /time axis/.test(threw), 'missing time axis throws', threw);
const one = A.buildGridPoints(26.5, 80.2, 1);
const g1 = A.parseGridResponse(point(0), one, NOW);
assert(one.points.length === 1 && g1.precip[0].length === 1, 'single-object response accepted for n = 1', g1.precip[0]);

// ---------------------------------------------------------------------------
console.log('\n[2] Radar + model timeline');
const radarMeta = { host: 'https://h', frames: Array.from({ length: 13 }, (_, i) => ({ time: NOW - 1800 - (12 - i) * 600, path: `/v2/radar/${i}` })) };
const grid = { times: [NOW - 3600, NOW - 600, ...Array.from({ length: 7 }, (_, i) => NOW + (i + 1) * 3600)] };
let tl = A.buildTimelineFrames(radarMeta, grid, NOW);
assert(tl.frames.length === 19 && tl.frames.filter(f => f.kind === 'model').length === 6, '13 radar + 6 model frames (capped)', tl.frames.length);
assert(tl.frames.every((f, i) => i === 0 || f.t > tl.frames[i - 1].t), 'frames ordered by time');
assert(tl.defaultIndex === 12 && tl.frames[12].rel === 'now' && tl.frames[12].kind === 'radar', 'default = latest radar frame ("now")', tl.frames[tl.defaultIndex]);
assert(tl.frames[0].rel === '−120 min' && tl.frames[13].rel.startsWith('+'), 'relative labels −120 min … +N h', [tl.frames[0].rel, tl.frames[13].rel]);
assert(tl.frames.filter(f => f.kind === 'model').every(f => f.t > radarMeta.frames[12].time), 'model hours ≤ last radar frame dropped');
const m0 = tl.frames.find(f => f.kind === 'model');
assert(m0.hourIdx === 2, 'model frame keeps its grid hour index', m0.hourIdx);
tl = A.buildTimelineFrames(radarMeta, null, NOW);
assert(tl.frames.length === 13 && tl.defaultIndex === 12, 'radar only', tl.frames.length);
tl = A.buildTimelineFrames(null, grid, NOW);
assert(tl.frames.length === 6 && tl.defaultIndex === 0 && tl.frames[0].kind === 'model', 'model only → default first model hour', tl.defaultIndex);
tl = A.buildTimelineFrames(null, null, NOW);
assert(tl.frames.length === 0 && tl.defaultIndex === -1, 'no data → empty timeline');
tl = A.buildTimelineFrames({ frames: [{ time: NOW - 300, path: '/x' }] }, null, NOW);
assert(tl.frames.length === 1 && tl.defaultIndex === 0 && tl.frames[0].rel === 'now', 'single radar frame works (test mock case)');
const lateRadar = { frames: [{ time: NOW + 3 * 3600, path: '/late' }] };
tl = A.buildTimelineFrames(lateRadar, grid, NOW);
assert(tl.frames.filter(f => f.kind === 'model').every(f => f.t > NOW + 3 * 3600), 'model hours at/before last radar frame are dropped', tl.frames.map(f => f.kind));

// ---------------------------------------------------------------------------
console.log('\n[3] Rain colour scale');
assert(A.rainColor(0)[3] === 0 && A.rainColor(0.05)[3] === 0 && A.rainColor(NaN)[3] === 0 && A.rainColor(null)[3] === 0, 'transparent below 0.1 mm/h / NaN');
assert(A.rainColor(0.1)[3] > 0, 'visible from 0.1 mm/h');
const rates = [0.1, 0.5, 1, 2, 2.5, 4, 6, 8, 12, 16, 25, 30, 40, 50, 80];
const alphas = rates.map(r => A.rainColor(r)[3]);
assert(alphas.every((a, i) => i === 0 || a >= alphas[i - 1]), 'alpha non-decreasing with rain rate', alphas);
assert(A.RAIN_SCALE.every((s, i) => i === 0 || s.mm > A.RAIN_SCALE[i - 1].mm), 'scale stops strictly increasing');
const c30 = A.rainColor(30), c80 = A.rainColor(80);
assert(c30[0] === 220 && c30[1] === 38 && c80[0] === 217 && c80[2] === 239, '30 mm/h red → 50+ mm/h magenta', [c30, c80]);
assert(A.rainColor(5).every(Number.isFinite), 'interpolated colours are finite numbers', A.rainColor(5));

// ---------------------------------------------------------------------------
console.log('\n[4] Metrics parsing + cards');
const hT = Array.from({ length: 48 }, (_, i) => NOW - 7200 + i * 3600);
const full = {
  current: { time: NOW - 300, temperature_2m: 31.4, apparent_temperature: 36.2, relative_humidity_2m: 78, wind_speed_10m: 12.6, wind_gusts_10m: 41, wind_direction_10m: 225, uv_index: 6.4, cloud_cover: 64, is_day: 1, weather_code: 3 },
  hourly: { time: hT, precipitation: hT.map((_, i) => i * 0.1), precipitation_probability: hT.map((_, i) => i * 2), temperature_2m: hT.map(() => 30), weather_code: hT.map(() => 3) },
  daily: { sunrise: [NOW - 20000, NOW + 66000], sunset: [NOW + 9000, NOW + 95000], uv_index_max: [9.1, 8] }
};
const met = A.parseMetrics(full, NOW);
assert(met.tempC === 31.4 && met.feelsC === 36.2 && met.humidity === 78 && met.gustKmh === 41 && met.windDirDeg === 225, 'current fields parsed', met);
assert(met.uv === 6.4 && met.uvMax === 9.1 && met.cloudPct === 64 && met.isDay === true, 'UV / cloud / day parsed', [met.uv, met.uvMax, met.cloudPct, met.isDay]);
assert(met.hourly.length === 12 && met.hourly[0].t > NOW && met.hourly[0].t - NOW <= 3600, '12 hourly entries starting with the hour in progress', met.hourly.length);
assert(met.hourly[0].prob === 6 && Math.abs(met.hourly[0].mm - 0.3) < 1e-9, 'hourly prob/mm aligned to time', met.hourly[0]);
assert(met.sunrise === NOW - 20000 && met.sunset === NOW + 9000 && met.sunriseNext === NOW + 66000, 'sunrise/sunset parsed (today + tomorrow)');
// Existing A0 mock payload (test_leave_engine) lacks all new fields
const legacy = A.parseMetrics({ current: { weather_code: 61, wind_speed_10m: 5, temperature_2m: 25, precipitation: 0.5 }, hourly: { time: hT, precipitation: hT.map(() => 0), weather_code: hT.map(() => 0), temperature_2m: hT.map(() => 25) } }, NOW);
assert(legacy && legacy.tempC === 25 && legacy.feelsC === null && legacy.uv === null && legacy.sunrise === null && legacy.hourly[0].prob === null, 'legacy payload → missing fields are null, no throw', legacy);
assert(A.parseMetrics(null) === null && A.parseMetrics('x') === null, 'non-object input → null');
assert(A.parseMetrics({}, NOW).hourly.length === 0, 'empty object → empty hourly list');

assert(A.fmtWindDir(0) === 'N' && A.fmtWindDir(90) === 'E' && A.fmtWindDir(225) === 'SW' && A.fmtWindDir(359) === 'N' && A.fmtWindDir(-90) === 'W', '16-point compass', [0, 90, 225, 359, -90].map(A.fmtWindDir));
assert(A.fmtTemp(24.6) === '25°' && A.fmtTemp(null) === '–', 'fmtTemp rounds / dashes');
const lv = v => A.uvLevel(v) && A.uvLevel(v).label;
assert(lv(0) === 'Low' && lv(2.4) === 'Low' && lv(3) === 'Moderate' && lv(5) === 'Moderate' && lv(6) === 'High' && lv(7) === 'High' && lv(8) === 'Very high' && lv(10) === 'Very high' && lv(11) === 'Extreme' && A.uvLevel(null) === null, 'UV level boundaries', [0, 2.4, 3, 5, 6, 7, 8, 10, 11].map(lv));

const cards = A.metricCards(met, { status: 'none', nearby: true, frameTime: NOW - 900 }, NOW);
assert(cards.map(c => c.id).join() === 'feels,rain,wind,humidity,uv,cloud,sun,radar', 'metric card ids', cards.map(c => c.id));
const byId = Object.fromEntries(cards.map(c => [c.id, c]));
assert(byId.feels.value === '36°' && byId.feels.sub === 'Actual 31°', 'feels-like card', byId.feels);
assert(byId.wind.arrowDeg === 45 && /SW/.test(byId.wind.sub) && /gusts 41/.test(byId.wind.sub), 'wind card: compass, gusts, arrow = direction + 180°', byId.wind);
assert(byId.rain.value === '6%' && /0\.3 mm/.test(byId.rain.sub), 'rain next hour card', byId.rain);
assert(byId.uv.value === '6' && /High/.test(byId.uv.sub) && /max 9/.test(byId.uv.sub), 'UV card now/max/level', byId.uv);
assert(byId.sun.label === 'Sunset' && byId.sun.next === 'sunset' && /Sunrise/.test(byId.sun.sub), 'sun card highlights the next event (sunset)', byId.sun);
assert(byId.radar.value === 'Rain nearby' && /15 min old/.test(byId.radar.sub), 'radar card: nearby + frame age', byId.radar);
const evening = A.nextSunEvent(met, NOW + 10000);
assert(evening && evening.kind === 'sunrise' && evening.t === NOW + 66000, 'after sunset the next event is tomorrow\'s sunrise', evening);
const empty = A.metricCards(null, null, NOW);
assert(empty.length === 8 && empty.every(c => typeof c.value === 'string') && empty.find(c => c.id === 'radar').value === 'Loading…', 'no metrics → 8 placeholder cards', empty.map(c => c.value));
assert(A.metricCards(met, { status: 'echo', frameTime: NOW - 300 }, NOW)[7].value === 'Rain here', 'radar echo → "Rain here"');
assert(/patchy/.test(A.metricCards(met, { status: 'none', frameTime: NOW - 300 }, NOW)[7].sub), 'no echo flagged as patchy coverage (never "dry")');

// ---------------------------------------------------------------------------
console.log('\n[5] Hourly chart model');
const hourly = met.hourly.map((h, i) => ({ ...h, tempC: i === 4 ? null : 25 + i, prob: i * 8 }));
const cm = A.buildHourlyChartModel(hourly, { w: 336, h: 120 });
assert(cm.bars.length === 12, '12 bars', cm.bars.length);
const ratio = cm.bars.filter(b => b.prob > 0).map(b => b.h / b.prob);
assert(ratio.every(r => Math.abs(r - ratio[0]) < 0.02) && cm.bars[0].h === 0, 'bar height ∝ rain chance', ratio);
assert(!/NaN|undefined/.test(cm.tempPath) && cm.tempPath.startsWith('M') && (cm.tempPath.match(/M/g) || []).length === 2, 'temperature path has no NaN and breaks at the gap', cm.tempPath);
assert(cm.ticks.length === 4, 'a tick every 3 h (12 h → 4 ticks)', cm.ticks.length);
assert(cm.temps.every(t => t.y >= 0 && t.y <= cm.plotH * 0.3 + 1), 'temperature line stays in the top 30% band', cm.temps.map(t => t.y));
assert(cm.bars.every(b => b.y + b.h <= cm.plotH + 0.01 && /^rgba\(/.test(b.fill)), 'bars sit on the baseline with rgba fills');
assert(cm.bars[5].mmLabel === hourly[5].mm.toFixed(1) && cm.bars[0].mmLabel === (hourly[0].mm >= 0.1 ? hourly[0].mm.toFixed(1) : ''), 'mm label only from 0.1 mm');
const cmEmpty = A.buildHourlyChartModel([], {});
assert(cmEmpty.bars.length === 0 && cmEmpty.tempPath === '' && cmEmpty.ticks.length === 0, 'empty input → empty model');

// ---------------------------------------------------------------------------
console.log('\n[6] Bottom-sheet snapping');
const snaps = A.sheetSnapsFor(800, 44, 34);
assert(snaps.peek === 182 && snaps.half === 416 && snaps.full === 692, 'snap heights from viewport + safe areas', snaps);
assert(A.snapSheetTarget(200, 0.9, snaps) === 'half' && A.snapSheetTarget(420, 0.9, snaps) === 'full', 'fling up → next snap up', [A.snapSheetTarget(200, 0.9, snaps), A.snapSheetTarget(420, 0.9, snaps)]);
assert(A.snapSheetTarget(600, -0.9, snaps) === 'half' && A.snapSheetTarget(400, -0.9, snaps) === 'peek', 'fling down → next snap down');
assert(A.snapSheetTarget(300, 0.2, snaps) === 'half' && A.snapSheetTarget(250, -0.1, snaps) === 'peek' && A.snapSheetTarget(640, 0, snaps) === 'full', 'slow release → nearest snap');
assert(A.snapSheetTarget(692, 2, snaps) === 'full' && A.snapSheetTarget(182, -2, snaps) === 'peek', 'fling past the ends clamps');
const measured = A.sheetSnapsFor(800, 44, 34, 170);
assert(measured.peek === 170 + 34, 'peek grows to fit measured head + timeline', measured);
const tiny = A.sheetSnapsFor(420, 0, 0);
assert(tiny.peek < tiny.half && tiny.half < tiny.full, 'snaps stay ordered on short screens', tiny);

// ---------------------------------------------------------------------------
console.log('\n[7] Timeline + layers with a fake Leaflet map');
function fakeLeaflet() {
  const mk = (kind, url, opts) => ({ kind, url, opts: opts || {}, opacity: opts && opts.opacity, setOpacity(o) { this.opacity = o; }, setUrl(u) { this.url = u; }, isLoading() { return false; }, addTo(m) { m._layers.add(this); return this; } });
  const L = { tileLayer: (u, o) => mk('tile', u, o), imageOverlay: (u, b, o) => mk('image', u, o), control: () => ({ addTo() {} }), DomUtil: { create: () => el() }, DomEvent: { disableClickPropagation() {}, disableScrollPropagation() {} } };
  const panes = {};
  const map = { _layers: new Set(), hasLayer(l) { return this._layers.has(l); }, removeLayer(l) { this._layers.delete(l); }, createPane(n) { panes[n] = { style: {} }; return panes[n]; }, getPane(n) { return panes[n]; }, fitBounds() {}, setView() {}, invalidateSize() {}, on() {} };
  return { L, map, panes };
}
const F = fakeLeaflet();
const B = loadApp(undefined, { L: F.L });
B.setMap(F.map);
// Real clock here: the timeline drops model hours that are already in the past.
const REAL = Math.floor(Date.now() / 1000);
const realRadar = Array.from({ length: 13 }, (_, i) => ({ time: REAL - 300 - (12 - i) * 600, path: `/v2/radar/${i}` }));
B.appState.radarMeta = { host: 'https://h', frame: realRadar[12], frames: realRadar };
const gspec = B.buildGridPoints(B.appState.originCoords.lat, B.appState.originCoords.lon);
B.appState.grid = { ...B.parseGridResponse(gridJson, spec, Date.now() / 1000 - 999999), key: `${gspec.lat0.toFixed(2)},${gspec.lon0.toFixed(2)}`, fetchedAt: Date.now() };
B.appState.grid.times = Array.from({ length: 6 }, (_, i) => REAL + (i + 1) * 3600);
B.appState.grid.dataUrls = B.appState.grid.times.map((_, i) => `data:image/png;base64,h${i}`);
// radar frames are "old" relative to the real clock, model hours are in the future
B.rebuildTimeline();
const T = B.timelineState;
assert(T.frames.length === 19 && T.index === 12, 'rebuild: 19 frames, positioned on "now"', [T.frames.length, T.index]);
const layersNow = [...B.radarFrameLayers().values()];
assert(layersNow.length === 1 && layersNow[0].opacity === 0.6 && layersNow[0].opts.pane === 'rsRadar' && layersNow[0].opts.maxNativeZoom === 7, 'only the "now" radar layer is created (lazy), in the rsRadar pane', layersNow.map(l => [l.opacity, l.opts.pane]));
B.showFrame(14);
assert(B.gridOverlay() && B.gridOverlay().url === 'data:image/png;base64,h1' && B.gridOverlay().opts.pane === 'rsGrid' && F.map.hasLayer(B.gridOverlay()), 'model frame shows the grid image for that hour', B.gridOverlay() && B.gridOverlay().url);
assert([...B.radarFrameLayers().values()].every(l => l.opacity === 0), 'model frame hides every radar frame');
B.showFrame(3);
assert(!F.map.hasLayer(B.gridOverlay()) && B.radarFrameLayers().get('/v2/radar/3').opacity === 0.6, 'radar frame hides the grid and shows its own layer');
B.appState.radarMeta = { ...B.appState.radarMeta, frames: realRadar.slice(2) };
B.rebuildTimeline();
assert(T.frames[T.index].t === realRadar[3].time, 'new radar list keeps the user on the same frame (not on "now")', T.frames[T.index]);
assert(!B.radarFrameLayers().has('/v2/radar/0'), 'stale radar layers are dropped');
B.setMapLayer('radar', false);
assert(T.frames.every(f => f.kind === 'model') && [...B.radarFrameLayers().values()].every(l => !F.map.hasLayer(l)), 'radar layer off → model-only timeline, radar tiles removed');
B.setMapLayer('satellite', true);
const sat = [...F.map._layers].find(l => /gibs\.earthdata\.nasa\.gov/.test(l.url || ''));
assert(sat && sat.opts.pane === 'rsSat' && sat.opts.maxNativeZoom === 6 && /\{y\}\/\{x\}/.test(sat.url), 'satellite layer: GIBS tiles (y before x) in rsSat pane', sat && sat.opts);
B.setMapLayer('grid', false);
assert(T.frames.length === 0 && T.index === -1, 'radar + forecast off → empty timeline');
assert(F.panes.rsRadar === undefined || F.panes.rsRadar.style, 'panes untouched until the layout init');

// ---------------------------------------------------------------------------
console.log('\n[8] updateUI() in limited sandboxes');
const C = loadApp();
C.appState.metrics = { ...met, lat: C.appState.originCoords.lat, lon: C.appState.originCoords.lon };
threw = null;
try { C.updateUI(); C.appState.activeScenario = 'monsoon'; C.appState.currentScenarioData = { ...C.appState.currentScenarioData, stopMinutes: 10 }; C.updateUI(); } catch (e) { threw = e.message; }
assert(!threw, 'Proxy DOM (no body / createElementNS / matchMedia) → updateUI ok with metrics', threw);
assert(C.isMobileMap() === false, 'isMobileMap() false without document.body');

// Live-deployment style mock: plain elements with appendChild only, limited L
function liveMockSandbox() {
  const elements = {};
  const mk = (id = '') => ({
    id, textContent: '', innerHTML: '', style: {}, value: '', hidden: false,
    classList: { _c: new Set(), add(c) { this._c.add(c); }, remove(c) { this._c.delete(c); }, toggle(c, f) { (f === undefined ? !this._c.has(c) : f) ? this._c.add(c) : this._c.delete(c); }, contains(c) { return this._c.has(c); } },
    children: [], addEventListener() {}, dispatchEvent() {}, querySelector() { return mk(); }, querySelectorAll() { return [mk()]; },
    setAttribute() {}, getAttribute(a) { return a === 'data-mode' ? 'walk' : ''; }, appendChild(c) { this.children.push(c); return c; }, removeChild() {}, contains() { return false; }, focus() {}
  });
  const sandbox = {
    document: { getElementById(id) { return elements[id] || (elements[id] = mk(id)); }, querySelector() { return mk(); }, querySelectorAll() { return [mk()]; }, createElement() { return mk(); }, addEventListener() {} },
    window: { location: { origin: 'https://x', pathname: '/', search: '' }, addEventListener() {} },
    navigator: { geolocation: { getCurrentPosition() {} } },
    localStorage: { getItem() { return null; }, setItem() {} },
    setTimeout, clearTimeout, setInterval, clearInterval, console: { log() {}, warn() {}, error: console.error }, Date, Math, JSON,
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    L: { map: () => ({ setView() {}, on() {}, fitBounds() {}, removeLayer() {} }), tileLayer: () => ({ addTo() {} }), marker: () => ({ addTo() { return {}; } }), polyline: () => ({ addTo() {} }), geoJSON: () => ({ addTo() { return { getBounds() { return {}; } }; } }), divIcon: () => ({}) }
  };
  vm.createContext(sandbox);
  vm.runInContext(APP_SRC, sandbox);
  return { sandbox, elements };
}
const LM = liveMockSandbox();
threw = null;
try {
  LM.sandbox.__met = met;
  vm.runInContext('appState.metrics = Object.assign({}, __met, { lat: appState.originCoords.lat, lon: appState.originCoords.lon }); updateUI(); appState.radar = { status: "echo", frameTime: Date.now() / 1000 - 300 }; updateUI();', LM.sandbox);
} catch (e) { threw = e.message; }
assert(!threw, 'live-mock sandbox (appendChild-only elements, limited L) → updateUI ok', threw);
assert(LM.elements.metricsGrid && LM.elements.metricsGrid.children.length >= 8, 'metrics grid filled through appendChild', LM.elements.metricsGrid && LM.elements.metricsGrid.children.length);
assert(LM.elements.mTemp && LM.elements.mTemp.textContent === '31°', 'phone top bar temperature filled', LM.elements.mTemp && LM.elements.mTemp.textContent);

// Full mocked live pipeline: A0 response carries the new metric fields
(async () => {
  const nowSec = Math.floor(Date.now() / 1000);
  const base = nowSec - (nowSec % 900);
  const t15 = Array.from({ length: 192 }, (_, i) => base + i * 900);
  const tH = Array.from({ length: 48 }, (_, i) => base - (base % 3600) + i * 3600);
  let a0Url = '';
  const D = loadApp(async (url) => {
    const ok = (json) => ({ ok: true, json: async () => json });
    if (url.includes('ensemble-api') || url.includes('models=') || url.includes('rainviewer')) throw new Error('down');
    a0Url = url;
    return ok({
      current: { time: nowSec, temperature_2m: 28, apparent_temperature: 33, relative_humidity_2m: 70, wind_speed_10m: 9, wind_gusts_10m: 20, wind_direction_10m: 90, uv_index: 4, cloud_cover: 50, is_day: 1, weather_code: 3 },
      minutely_15: { time: t15, precipitation: t15.map(() => 0), weather_code: t15.map(() => 0) },
      hourly: { time: tH, precipitation: tH.map(() => 0), weather_code: tH.map(() => 0), temperature_2m: tH.map(() => 28), precipitation_probability: tH.map(() => 10) },
      daily: { sunrise: [nowSec - 3600, nowSec + 80000], sunset: [nowSec + 3600, nowSec + 90000], uv_index_max: [7, 7] }
    });
  });
  D.appState.originCoords = { lat: 26.5, lon: 80.2 };
  await D.fetchLiveOpenMeteo(26.5, 80.2, 'Test');
  await new Promise(r => setTimeout(r, 30));
  const dm = D.appState.metrics;
  assert(dm && dm.feelsC === 33 && dm.windDirDeg === 90 && dm.uvMax === 7 && dm.lat === 26.5, 'live fetch stores parsed metrics (+ location)', dm && { feels: dm.feelsC, lat: dm.lat });
  assert(/apparent_temperature/.test(a0Url) && /precipitation_probability/.test(a0Url) && /daily=sunrise,sunset,uv_index_max/.test(a0Url) && /timezone=auto/.test(a0Url) && !/models=/.test(a0Url), 'A0 URL requests the new fields (no models= so mocks still route)', a0Url);

  // ---------------------------------------------------------------------------
  console.log('\n[9] Static guards');
  const baseline = 25; // innerHTML occurrences in app.js before the map-first redesign
  const count = (APP_SRC.match(/innerHTML/g) || []).length;
  assert(count <= baseline, `innerHTML occurrences not increased (${count} ≤ ${baseline})`, count);
  const sec = CSS_SRC.slice(CSS_SRC.indexOf('MAP-FIRST MOBILE'), CSS_SRC.indexOf('@media (prefers-reduced-motion'));
  assert(sec.length > 1000, 'CSS has a MAP-FIRST MOBILE section', sec.length);
  assert(!/backdrop-filter/.test(sec) && !/infinite/.test(sec), 'MAP-FIRST section: no backdrop-filter, no infinite animation');
  assert(!/infinite/.test(CSS_SRC.slice(CSS_SRC.indexOf('@keyframes rsRise') - 200, CSS_SRC.indexOf('@keyframes rsRise') + 200)), 'rsRise is one-shot');
  const cssNoComments = CSS_SRC.replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0, minDepth = 0;
  for (const ch of cssNoComments) { if (ch === '{') depth++; else if (ch === '}') { depth--; minDepth = Math.min(minDepth, depth); } }
  assert(depth === 0 && minDepth === 0, 'style.css braces balanced', { depth, minDepth });
  ['mapStage', 'mSheet', 'mSheetHead', 'mSheetScroll', 'mActionsRow', 'mTopBar', 'mLayersPanel', 'metricsCard', 'metricsGrid', 'hourlyChart'].forEach(id => {
    assert(HTML_SRC.includes(`id="${id}"`), `HTML contains id="${id}"`);
  });
  assert(APP_SRC.includes("'rsTimeline'") && APP_SRC.includes('initMapFirstLayout'), 'app.js builds #rsTimeline and the map-first layout');
  assert(!/\.append\(|\.replaceChildren\(|\.remove\(\)/.test(APP_SRC.slice(APP_SRC.indexOf('8.6 RAIN MAP'), APP_SRC.indexOf('9. WEB AUDIO'))), 'new code avoids append()/replaceChildren()/remove()');
  const fonts = (CSS_SRC.match(/font-family:[^;]+;/g) || []).concat(CSS_SRC.match(/font:[^;]+;/g) || []).join(' ');
  assert(!/(Roboto Mono|Space|Poppins|Helvetica Neue)/.test(sec) && /var\(--font-mono\)/.test(sec), 'MAP-FIRST section uses the Inter / JetBrains Mono tokens', fonts.length);
  assert(HTML_SRC.includes('style.css?v=8.2') && HTML_SRC.includes('app.js?v=8.2'), 'asset cache-buster bumped to v8.2');
  const sw = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');
  assert(sw.includes('rainstop-cache-v12') && /gibs\\\.earthdata/.test(sw) && /tile\\\.openstreetmap/.test(sw) && !/cartocdn/.test(sw), 'sw.js v12 skips caching map/satellite tiles');
  assert(/@media \(max-width: 768px\)[\s\S]*input\[type="text"\][\s\S]*font-size: 16px !important/.test(CSS_SRC), 'phone text fields are 16px (no iOS focus zoom)');
  assert(!/cartocdn/.test(APP_SRC), 'no CARTO tiles (they now require an API key)');

  console.log(`\n==========================================\n🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED\n==========================================`);
  process.exit(failed ? 1 : 0);
})();
