// India-wide model layers (wind arrows, isobars, model L/H centres), GDACS cyclones, the
// pressure metric, layer persistence / failure states and static guards.
// Loads the real app.js in a sandbox (same harness as test_map_layers.js).
// Run: node test_india_layers.js
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
const SW_SRC = fs.readFileSync(path.join(__dirname, 'sw.js'), 'utf8');

// Forgiving Proxy DOM (no document.body / createElementNS / matchMedia), as in test_map_layers.
const el = () => new Proxy(function () {}, {
  get: (t, k) => {
    if (k === 'style' || k === 'dataset') return {};
    if (k === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
    if (k === 'querySelectorAll') return () => [];
    if (typeof k === 'string' && /^(textContent|value|title|className)$/.test(k)) return '';
    return el();
  },
  set: () => true,
  apply: () => el()
});

// Plain element (records text / children / attributes) for checking what was rendered.
function mkEl(id = '') {
  return {
    id, textContent: '', style: {}, hidden: false, children: [], attrs: {},
    classList: { _c: new Set(), add(c) { this._c.add(c); }, remove(c) { this._c.delete(c); }, toggle(c, f) { (f === undefined ? !this._c.has(c) : f) ? this._c.add(c) : this._c.delete(c); }, contains(c) { return this._c.has(c); } },
    addEventListener() {}, dispatchEvent() {}, querySelector() { return null; }, querySelectorAll() { return []; },
    setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : ''; },
    appendChild(c) { this.children.push(c); return c; }, removeChild() {}, contains() { return false; }, focus() {}
  };
}
const textOf = n => (n ? (n.textContent || '') + (n.children || []).map(textOf).join('') : '');

const EXPORTS = `;this.X = { buildIndiaGridSpec, indiaGridUrl, parseIndiaField, indiaHourIndex, smoothField, upsampleBilinear,
  marchingSquares, joinSegments, gridToLatLon, buildIsobars, findPressureCentres, maxWindNear, classifyLow,
  windArrowVector, windBin, windArrowSegments, WIND_BINS, gdacsListUrl, parseGdacsEvents, parseGdacsGeometry,
  decimateRing, cycloneProximity, bearingDeg, appState, updateUI, refreshIndiaField, refreshCyclones,
  renderIndiaLayers, renderCycloneLayers, renderCycloneAlert, setMapLayer, layerStatusText, updateLayerStatus,
  buildLayerToggles, parseMetrics, metricCards, showIndiaView, rebuildTimeline, timelineState, onMapZoomEnd,
  buildTimelineFrames, layerToggleInputs, readJsonWithTimeout, focusNewTrip, addIndiaLegendControl, updateIndiaLegend,
  sheetState, setMap: (m) => { mapInstance = m; } };`;

function loadApp(opts = {}) {
  const store = opts.store || {};
  const ctx = {
    console: { log() {}, warn() {}, error: console.error },
    fetch: opts.fetch || (async () => { throw new Error('offline'); }),
    AbortController, setTimeout, clearTimeout, setInterval() {}, Date, Math, JSON, Number, Array, Object, String, Promise, URLSearchParams, Map, Set,
    document: opts.document || { getElementById: () => el(), querySelector: () => el(), querySelectorAll: () => [], addEventListener() {}, createElement: () => el(), createTextNode: () => el(), hidden: false },
    window: { addEventListener() {} }, navigator: {},
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    requestAnimationFrame() {},
    ...(opts.extra || {})
  };
  vm.createContext(ctx);
  vm.runInContext(APP_SRC + EXPORTS, ctx);
  ctx.X.__ctx = ctx; // lets a test wrap a top-level function (e.g. count showFrame calls)
  return ctx.X;
}

// Fake Leaflet with layer groups / vectors / markers and a zoomable map.
function richLeaflet(zoom) {
  const made = [];
  const layer = (kind, latlngs, opts) => {
    const l = { kind, latlngs, opts: opts || {}, addTo(target) { (target._layers || target._set).add(this); return this; }, bindPopup(c) { this.popup = c; return this; } };
    made.push(l);
    return l;
  };
  const L = {
    layerGroup: () => ({ _layers: new Set(), clearLayers() { this._layers.clear(); }, addTo(m) { m._set.add(this); return this; } }),
    polyline: (ll, o) => layer('polyline', ll, o),
    polygon: (ll, o) => layer('polygon', ll, o),
    marker: (ll, o) => layer('marker', ll, o),
    divIcon: (o) => ({ divIcon: true, ...o }),
    tileLayer: (u, o) => layer('tile', u, o),
    imageOverlay: (u, b, o) => layer('image', u, o),
    control: () => ({ addTo() {} }),
    DomUtil: { create: () => el() },
    DomEvent: { disableClickPropagation() {}, disableScrollPropagation() {} }
  };
  const panes = {};
  const map = {
    _set: new Set(), _zoom: zoom, fitCalls: [],
    hasLayer(l) { return this._set.has(l); }, removeLayer(l) { this._set.delete(l); },
    createPane(n) { panes[n] = { style: {} }; return panes[n]; }, getPane(n) { return panes[n]; },
    getZoom() { return this._zoom; }, fitBounds(b, o) { this.fitCalls.push([b, o]); }, setView() {}, invalidateSize() {}, on() {}
  };
  return { L, map, made };
}

const A = loadApp();
const SPEC = A.buildIndiaGridSpec();
const N = SPEC.points.length;

// Synthetic Open-Meteo multi-point response (hours from t0, hourly).
function fakeIndiaJson(t0, fn) {
  const times = Array.from({ length: 8 }, (_, h) => t0 + h * 3600);
  return SPEC.points.map((pt, i) => {
    const v = fn(pt, i);
    return {
      latitude: pt.lat, longitude: pt.lon, elevation: v.elev !== undefined ? v.elev : 100,
      hourly: { time: times, wind_speed_10m: times.map(() => v.ws), wind_direction_10m: times.map(() => v.wd), pressure_msl: times.map(() => v.p) }
    };
  });
}

// ---------------------------------------------------------------------------
console.log('\n[1] India grid spec + request URL');
assert(N === 289 && SPEC.nr === 17 && SPEC.nc === 17, '17 × 17 = 289 points', [N, SPEC.nr, SPEC.nc]);
assert(SPEC.points[0].lat === 38 && SPEC.points[0].lon === 66 && SPEC.points[N - 1].lat === 6 && SPEC.points[N - 1].lon === 98, 'first (38°N, 66°E), last (6°N, 98°E)', [SPEC.points[0], SPEC.points[N - 1]]);
assert(SPEC.points[1].lon === 68 && SPEC.points[17].lat === 36 && SPEC.points.every(p => Number.isInteger(p.lat) && Number.isInteger(p.lon)), 'rows N → S, cols W → E, integer degrees');
const URL_ = A.indiaGridUrl(SPEC);
assert(URL_.length < 2500, `URL under 2.5 KB (${URL_.length} chars)`, URL_.length);
assert(/forecast_hours=8/.test(URL_) && /hourly=wind_speed_10m,wind_direction_10m,pressure_msl/.test(URL_) && /timeformat=unixtime/.test(URL_), 'hourly wind + MSL pressure, 8 h, unixtime');
assert(!/precipitation/.test(URL_) && !/models=/.test(URL_), 'no precipitation (and no models=, so test mocks still route)');

// ---------------------------------------------------------------------------
console.log('\n[2] parseIndiaField');
const T0 = 1800000000;
const rawJ = fakeIndiaJson(T0, (pt, i) => ({ ws: i === 5 ? null : 12, wd: 270, p: 1008 + pt.lat / 10, elev: i === 7 ? null : 250 }));
const fld = A.parseIndiaField(rawJ, SPEC);
assert(fld.times.length === 8 && fld.times[0] === T0 && fld.ws.length === 8 && fld.ws[0].length === 289 && fld.p[3].length === 289 && fld.wd[7].length === 289, 'shapes [8 h][289 points]', [fld.times.length, fld.ws[0].length]);
assert(Number.isNaN(fld.ws[0][5]) && fld.ws[0][4] === 12, 'null → NaN', fld.ws[0][5]);
assert(fld.elev.length === 289 && fld.elev[0] === 250 && Number.isNaN(fld.elev[7]), 'elevation per point (missing → NaN)', [fld.elev[0], fld.elev[7]]);
assert(Math.abs(fld.p[0][0] - (1008 + 3.8)) < 1e-9, 'pressure mapped to the right point', fld.p[0][0]);
let threw = null;
try { A.parseIndiaField(rawJ.slice(0, 288), SPEC); } catch (e) { threw = e.message; }
assert(!!threw && /289/.test(threw), 'length mismatch throws', threw);
threw = null;
try { A.parseIndiaField({ hourly: {} }, SPEC); } catch (e) { threw = e.message; }
assert(!!threw, 'non-array response throws', threw);
assert(A.indiaHourIndex(fld, T0 + 2 * 3600 + 1000) === 2 && A.indiaHourIndex(fld, T0 - 5000) === 0 && A.indiaHourIndex(fld, T0 + 7 * 3600 + 6000) === -1, 'nearest model hour within 90 min, else −1');

// ---------------------------------------------------------------------------
console.log('\n[3] smoothing + bilinear upsampling');
const flat = new Array(289).fill(1012);
assert(A.smoothField(flat, 17, 17).every(v => Math.abs(v - 1012) < 1e-9), 'constant field stays constant after smoothing');
const withNaN = flat.slice(); withNaN[100] = NaN;
const sm = A.smoothField(withNaN, 17, 17);
assert(Number.isNaN(sm[100]) && sm.filter(Number.isFinite).every(v => Math.abs(v - 1012) < 1e-9), 'NaN-aware: NaN cell stays NaN, neighbours unaffected');
const lin = SPEC.points.map(p => p.row * 2 + p.col);
const up = A.upsampleBilinear(lin, 17, 17, 4);
assert(up.nr === 65 && up.nc === 65 && up.v.length === 65 * 65, '×4 → 65 × 65', [up.nr, up.nc]);
assert(up.v[0] === 0 && up.v[64] === 16 && up.v[64 * 65] === 32 && up.v[65 * 65 - 1] === 48, 'corners preserved', [up.v[0], up.v[64], up.v[64 * 65], up.v[65 * 65 - 1]]);
assert(Math.abs(up.v[2 * 65 + 2] - (0.5 * 2 + 0.5)) < 1e-9, 'bilinear midpoint of a linear field', up.v[2 * 65 + 2]);
assert(A.upsampleBilinear(flat, 17, 17, 2).v.every(v => v === 1012), 'constant field upsamples to constant');

// ---------------------------------------------------------------------------
console.log('\n[4] marching squares + segment joining');
const bowl = [];
for (let r = 0; r < 17; r++) for (let c = 0; c < 17; c++) bowl.push(1000 + 0.5 * ((r - 8) ** 2 + (c - 8) ** 2));
const ring = A.joinSegments(A.marchingSquares(bowl, 17, 17, 1004));
assert(ring.length === 1 && ring[0].closed, 'p = 1000 + 0.5·d²: level 1004 → one closed ring', ring.map(r => [r.pts.length, r.closed]));
const radii = ring[0].pts.map(([r, c]) => Math.hypot(r - 8, c - 8));
const meanR = radii.reduce((a, b) => a + b, 0) / radii.length;
assert(Math.abs(meanR - Math.sqrt(8)) < 0.15 && radii.every(x => Math.abs(x - Math.sqrt(8)) < 0.35), `ring radius ≈ √8 cells (${meanR.toFixed(3)})`, meanR);
assert(A.marchingSquares(bowl, 17, 17, 2000).length === 0 && A.marchingSquares(bowl, 17, 17, 990).length === 0, 'level outside the field → no segments');
const saddle = [1, 0, 0, 1]; // tl=1 tr=0 / bl=0 br=1
const s1 = JSON.stringify(A.marchingSquares(saddle, 2, 2, 0.5));
assert(s1 === JSON.stringify(A.marchingSquares(saddle, 2, 2, 0.5)) && JSON.parse(s1).length === 2, 'saddle cell → 2 segments, deterministic', s1);
assert(s1 !== JSON.stringify(A.marchingSquares(saddle, 2, 2, 0.4)), 'saddle pairing follows the cell-centre mean');
const holed = bowl.slice(); holed[8 * 17 + 10] = NaN;
const segsHoled = A.marchingSquares(holed, 17, 17, 1004);
assert(segsHoled.length < A.marchingSquares(bowl, 17, 17, 1004).length && segsHoled.every(s => s.every(pt => pt.every(Number.isFinite))), 'cells touching NaN are skipped (fewer segments, all finite)', segsHoled.length);
assert(A.joinSegments([[[0, 0], [0, 0]]]).length === 0, 'zero-length segments dropped');
const open = A.joinSegments([[[0, 0], [0, 1]], [[0, 2], [0, 1]], [[0, 2], [0, 3]]]);
assert(open.length === 1 && open[0].pts.length === 4 && !open[0].closed, 'segments in any orientation chain into one open line', open);

// ---------------------------------------------------------------------------
console.log('\n[5] isobars');
const lowField = SPEC.points.map(p => 1004 + 0.12 * ((p.row - 8) ** 2 + (p.col - 8) ** 2));
const iso = A.buildIsobars(lowField, SPEC);
const pMin = Math.min(...lowField), pMax = Math.max(...lowField);
assert(iso.length > 3 && iso.every(i => i.level % 2 === 0 && i.level >= pMin && i.level <= pMax), 'levels every 2 hPa inside the field range', iso.map(i => i.level));
assert(iso.every(i => i.major === (i.level % 4 === 0)), 'major isobar every 4 hPa');
const allPts = iso.flatMap(i => i.lines.flat());
assert(allPts.length > 0 && allPts.every(([la, lo]) => la >= 6 - 1e-9 && la <= 38 + 1e-9 && lo >= 66 - 1e-9 && lo <= 98 + 1e-9), 'all isobar points inside the India box');
const labels = iso.filter(i => i.labelAt);
assert(labels.length >= 1 && labels.length <= 16 && labels.every(i => i.labelAt[0] >= 6 && i.labelAt[0] <= 38 && i.labelAt[1] >= 66 && i.labelAt[1] <= 98), 'labels (≤ 16) placed inside the box', labels.length);
assert(A.buildIsobars(flat, SPEC).length === 0 || A.buildIsobars(flat, SPEC).every(i => i.lines.length === 0), 'flat field → no isobars');
assert(A.buildIsobars(new Array(10).fill(1000), SPEC).length === 0, 'wrong-size input → []');

// ---------------------------------------------------------------------------
console.log('\n[6] model low / high centres');
const gauss = (pt, r0, c0, amp, s = 1.2) => amp * Math.exp(-((pt.row - r0) ** 2 + (pt.col - c0) ** 2) / (2 * s * s));
const elev100 = new Array(289).fill(100);
const lowC = A.findPressureCentres(SPEC.points.map(p => 1010 - gauss(p, 8, 8, 8)), SPEC, elev100);
const L1 = lowC.filter(c => c.kind === 'L');
assert(L1.length === 1 && Math.abs(L1[0].lat - 22) < 0.6 && Math.abs(L1[0].lon - 82) < 0.6 && L1[0].hPa < 1006 && L1[0].depth >= 1, 'synthetic low found at 22°N 82°E (depth ≥ 1 hPa)', lowC);
assert(A.findPressureCentres(flat, SPEC, elev100).length === 0, 'flat field → no centres');
const edge = A.findPressureCentres(SPEC.points.map(p => 1010 - gauss(p, 0, 8, 8)), SPEC, elev100);
assert(edge.filter(c => c.kind === 'L').length === 0, 'low on the grid edge ignored', edge);
const hi = A.findPressureCentres(SPEC.points.map(p => 1010 + gauss(p, 6, 10, 8)), SPEC, elev100);
assert(hi.length === 1 && hi[0].kind === 'H' && Math.abs(hi[0].lat - 26) < 0.6 && Math.abs(hi[0].lon - 86) < 0.6, 'synthetic high found', hi);
const highTerrain = elev100.slice(); highTerrain[8 * 17 + 8] = 2500;
assert(A.findPressureCentres(SPEC.points.map(p => 1010 - gauss(p, 8, 8, 8)), SPEC, highTerrain).length === 0, 'centre over > 1000 m terrain dropped');
const twin = A.findPressureCentres(SPEC.points.map(p => 1010 - gauss(p, 8, 8, 8) - gauss(p, 9, 9, 8)), SPEC, elev100);
assert(twin.filter(c => c.kind === 'L').length <= 1, 'two lows within 3° → at most one centre', twin);
const many = A.findPressureCentres(SPEC.points.map(p => 1010 - [[3, 3], [3, 8], [3, 13], [8, 3], [8, 13], [13, 3], [13, 8], [13, 13]].reduce((a, [r, c]) => a + gauss(p, r, c, 8), 0)), SPEC, elev100);
assert(many.filter(c => c.kind === 'L').length <= 4, 'at most 4 lows kept', many.length);

// ---------------------------------------------------------------------------
console.log('\n[7] low classification + nearby wind');
const cl = v => A.classifyLow(v).cls;
assert(cl(30.9) === 'low' && cl(31) === 'depression' && cl(49.9) === 'depression' && cl(50) === 'deep' && cl(61.9) === 'deep' && cl(62) === 'cs' && cl(150) === 'cs' && cl(null) === 'low', 'IMD-threshold boundaries 31 / 50 / 62 km/h', [30.9, 31, 49.9, 50, 61.9, 62, 150, null].map(cl));
assert([0, 31, 50, 62].every(v => /model est\., not IMD/.test(A.classifyLow(v).label)), 'every label says "model est., not IMD"', A.classifyLow(62).label);
assert(!/cyclone\b/i.test(A.classifyLow(200).label.replace(/Cyclonic-storm-strength/, '')), 'never labels a model low a cyclone', A.classifyLow(200).label);
const windF = A.parseIndiaField(fakeIndiaJson(T0, (pt) => ({ ws: pt.lat === 20 && pt.lon === 80 ? 80 : 5, wd: 0, p: 1010 })), SPEC);
assert(A.maxWindNear(windF, 0, 20, 82, 300) === 80, 'maxWindNear: 80 km/h point ~209 km away counts at 300 km');
assert(A.maxWindNear(windF, 0, 20, 82, 100) === 5, 'maxWindNear: not at 100 km');
assert(A.maxWindNear(null, 0, 20, 82) === null && A.maxWindNear(windF, 9, 20, 82) === null, 'maxWindNear: no field / hour → null');

// ---------------------------------------------------------------------------
console.log('\n[8] wind arrow geometry + speed bins');
const v0 = A.windArrowVector(0, 20, 5, 20);
assert(v0.dLat < 0 && Math.abs(v0.dLon) < 1e-9, 'wind FROM north → arrow points south', v0);
assert(A.windArrowVector(90, 20, 5, 20).dLon < 0 && A.windArrowVector(270, 20, 5, 20).dLon > 0 && A.windArrowVector(180, 20, 5, 20).dLat > 0, 'from E → west, from W → east, from S → north');
const merc = (lat, lon, z) => {
  const s = 256 * Math.pow(2, z);
  return [(lon + 180) / 360 * s, (1 - Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)) / Math.PI) / 2 * s];
};
const pxLen = (lat, from) => {
  const v = A.windArrowVector(from, 20, 5, lat);
  const a = merc(lat, 80, 5), b = merc(lat + v.dLat, 80 + v.dLon, 5);
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
};
assert([0, 45, 90, 200].every(d => Math.abs(pxLen(8, d) - 20) < 0.3 && Math.abs(pxLen(35, d) - 20) < 0.3), 'same 20 px on screen at 8°N and 35°N (any direction)', [pxLen(8, 0), pxLen(35, 0), pxLen(8, 90), pxLen(35, 45)]);
const wb = A.windBin;
assert(wb(0) === 0 && wb(9.99) === 0 && wb(10) === 1 && wb(19.9) === 1 && wb(20) === 2 && wb(30.9) === 2 && wb(31) === 3 && wb(49.9) === 3 && wb(50) === 4 && wb(61.9) === 4 && wb(62) === 5 && wb(88.9) === 5 && wb(89) === 6 && wb(300) === 6 && wb(NaN) === -1, 'windBin boundaries 10/20/31/50/62/89', [0, 9.99, 10, 31, 62, 89, NaN].map(wb));
assert(A.WIND_BINS.length === 7 && A.WIND_BINS[6].color === '#d946ef' && A.WIND_BINS[0].color === '#9ca3af', '7 colour bins');

// ---------------------------------------------------------------------------
console.log('\n[9] wind arrow segments');
const uni = A.parseIndiaField(fakeIndiaJson(T0, (pt, i) => ({ ws: i === 0 ? 2 : i === 1 ? null : i < 40 ? 55 : 15, wd: 270, p: 1010 })), SPEC);
const seg5 = A.windArrowSegments(uni, 0, 5, SPEC);
const arrows5 = seg5.reduce((a, b) => a + b.lines.length / 2, 0);
assert(arrows5 === 287, 'one arrow per point, < 3 km/h and NaN skipped (287)', arrows5);
assert(seg5.length === 2 && seg5.find(b => b.bin === 1).color === '#67e8f9' && seg5.find(b => b.bin === 4).color === '#fb923c', 'grouped by speed bin with bin colours', seg5.map(b => [b.bin, b.color, b.lines.length]));
assert(seg5.every(b => b.lines.every(l => (l.length === 2 || l.length === 3) && l.every(p => p.every(Number.isFinite)))), 'shaft (2 pts) + head (3 pts) polylines, finite');
const seg3 = A.windArrowSegments(uni, 0, 3, SPEC);
const arrows3 = seg3.reduce((a, b) => a + b.lines.length / 2, 0);
assert(arrows3 === 80, 'zoom ≤ 3: every 2nd row/col (81 − 1 skipped)', arrows3);
const shaft = seg5.find(b => b.bin === 1).lines[0];
assert(shaft[1][1] > shaft[0][1] && Math.abs(shaft[1][0] - shaft[0][0]) < 1e-9, 'westerly wind → shaft tip east of tail', shaft);
assert(A.windArrowSegments(null, 0, 5, SPEC).length === 0 && A.windArrowSegments(uni, 0, NaN, SPEC).length === 0, 'no field / no zoom → []');

// ---------------------------------------------------------------------------
console.log('\n[10] GDACS event list');
const gFeat = (name, id, alert, cur, todate, coords, sev) => ({
  type: 'Feature', geometry: { type: 'Point', coordinates: coords },
  properties: {
    eventtype: 'TC', eventid: id, episodeid: 10, eventname: name, name: `Tropical Cyclone ${name}`, alertlevel: alert, iscurrent: cur,
    fromdate: '2026-11-01T00:00:00', todate, country: 'India',
    severitydata: { severity: sev, severitytext: `max wind ${Math.round(sev)} km/h`, severityunit: 'km/h' },
    url: { geometry: `https://www.gdacs.org/gdacsapi/api/polygons/getgeometry?eventtype=TC&eventid=${id}&episodeid=10`, report: `https://www.gdacs.org/report.aspx?eventid=${id}&episodeid=10&eventtype=TC`, details: 'x' }
  }
});
const GLIST = { type: 'FeatureCollection', features: [
  gFeat('MURASU-26', 1001346, 'Red', 'true', '2026-11-03T06:00:00', [80.2, 15.8], 157.4064),
  gFeat('ARNAB-26', 1001345, 'Red', 'false', '2026-10-28T06:00:00', [81.8, 16.4], 222.2208),
  gFeat('CHAMPI-26', 1001338, 'Red', 'true', '2026-10-25T18:00:00', [127.4, 31.2], 296.2944)
] };
const NOW_TC = Date.parse('2026-11-04T11:00:00Z');
const evs = A.parseGdacsEvents(GLIST, NOW_TC);
assert(evs.length === 1 && evs[0].name === 'MURASU-26' && evs[0].alert === 'Red', 'only the current storm inside the N Indian Ocean box is kept', evs.map(e => e.name));
assert(evs[0].lat === 15.8 && evs[0].lon === 80.2 && evs[0].maxKmh === 157 && evs[0].id === '1001346' && evs[0].episode === '10', 'position [lon, lat] → lat/lon, max wind km/h, ids', evs[0]);
assert(evs[0].ageH === 29 && evs[0].stale === false, 'advisory age from todate (UTC) — 29 h, not stale', [evs[0].ageH, evs[0].stale]);
assert(A.parseGdacsEvents(GLIST, NOW_TC + 3 * 86400000)[0].stale === true, 'still "current" but > 48 h since last advisory → stale');
assert(/^https:\/\/www\.gdacs\.org\/report\.aspx/.test(evs[0].reportUrl) && /getgeometry/.test(evs[0].geomUrl), 'report + geometry URLs kept (gdacs.org https only)');
const boolCur = { type: 'FeatureCollection', features: [gFeat('X-26', 1, 'Orange', true, '2026-11-04T00:00:00', [88, 18], 90)] };
assert(A.parseGdacsEvents(boolCur, NOW_TC).length === 1, 'boolean iscurrent accepted');
const evil = { type: 'FeatureCollection', features: [gFeat('Y-26', 2, 'Purple', 'true', '2026-11-04T00:00:00', [88, 18], 90)] };
evil.features[0].properties.url.report = 'javascript:alert(1)';
const ev2 = A.parseGdacsEvents(evil, NOW_TC)[0];
assert(ev2.reportUrl === null && ev2.alert === 'Green', 'non-gdacs report link dropped, unknown alert → Green', ev2);
const junk = { type: 'FeatureCollection', features: [null, {}, { geometry: { type: 'Point', coordinates: ['a', 'b'] }, properties: { iscurrent: 'true', eventid: 3 } }, gFeat('Z-26', 4, 'Red', 'true', 'x', [85, 15], 100)] };
assert(A.parseGdacsEvents(junk, NOW_TC).length === 1, 'malformed features skipped, not fatal');
['garbage', null, {}, [], { type: 'Feature' }, { current: { time: 1 }, minutely_15: {} }].forEach((bad, i) => {
  let t = null;
  try { A.parseGdacsEvents(bad, NOW_TC); } catch (e) { t = e.message; }
  assert(!!t, `non-GeoJSON input #${i} throws`, t);
});
const lu = A.gdacsListUrl(Date.parse('2026-11-04T05:00:00Z'));
assert(/eventlist=TC&fromdate=2026-10-28&todate=2026-11-04$/.test(lu) && lu.startsWith('https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?'), 'list URL: last 7 days (UTC dates)', lu);

// ---------------------------------------------------------------------------
console.log('\n[11] GDACS geometry');
const sq = (lon, lat, d) => [[lon, lat], [lon + d, lat], [lon + d, lat + d], [lon, lat + d], [lon, lat]];
const bigRing = Array.from({ length: 1000 }, (_, i) => [80 + Math.cos(i / 1000 * 2 * Math.PI), 15 + Math.sin(i / 1000 * 2 * Math.PI)]);
bigRing.push(bigRing[0]);
const GGEO = { type: 'FeatureCollection', features: [
  { type: 'Feature', properties: { Class: 'Poly_Red', polygonlabel: '120 km/h' }, geometry: { type: 'Polygon', coordinates: [sq(80, 15, 1)] } },
  { type: 'Feature', properties: { Class: 'Poly_Green', polygonlabel: '60 km/h' }, geometry: { type: 'Polygon', coordinates: [bigRing] } },
  { type: 'Feature', properties: { Class: 'Poly_Orange', polygonlabel: '90 km/h' }, geometry: { type: 'MultiPolygon', coordinates: [[sq(79, 14, 2)], [sq(85, 20, 1)]] } },
  { type: 'Feature', properties: { Class: 'Poly_Red', polygonlabel: '03/11 06:00' }, geometry: { type: 'Polygon', coordinates: [sq(70, 10, 1)] } },
  { type: 'Feature', properties: { Class: 'Poly_Cones', polygonlabel: 'Uncertainty Cones' }, geometry: { type: 'Polygon', coordinates: [sq(78, 13, 4)] } },
  { type: 'Feature', properties: { Class: 'Line_Line_0', polygonlabel: 'HU', forecast: false }, geometry: { type: 'LineString', coordinates: [[82, 14], [81, 15], [80.2, 15.8]] } },
  { type: 'Feature', properties: { Class: 'Line_Line_1', polygonlabel: 'TD', forecast: true }, geometry: { type: 'LineString', coordinates: [[80.2, 15.8], [79.5, 17]] } },
  { type: 'Feature', properties: { Class: 'Line_Line_2', polygonlabel: 'TS', forecast: 'true' }, geometry: { type: 'LineString', coordinates: [[83, 13], [82, 14]] } },
  { type: 'Feature', properties: { Class: 'Point_Centroid', polygonlabel: '' }, geometry: { type: 'Point', coordinates: [80.2, 15.8] } },
  { type: 'Feature', properties: { Class: 'Point_Polygon_Point_0', polygonlabel: '' }, geometry: { type: 'Polygon', coordinates: [sq(60, 5, 1)] } }
] };
const gg = A.parseGdacsGeometry(GGEO);
assert(gg.zones.length === 3 && gg.zones.map(z => z.level).join() === 'Green,Orange,Red', '3 overall wind zones (date-labelled + point polygons ignored), Red drawn last', gg.zones.map(z => [z.level, z.label]));
assert(gg.zones[2].rings[0][0][0][0] === 15 && gg.zones[2].rings[0][0][0][1] === 80, '[lon, lat] swapped to [lat, lon]', gg.zones[2].rings[0][0][0]);
assert(gg.zones[1].rings.length === 2, 'MultiPolygon → 2 polygons', gg.zones[1].rings.length);
const gRing = gg.zones[0].rings[0][0];
assert(gRing.length <= 300 && gRing[0][0] === gRing[gRing.length - 1][0] && gRing[0][1] === gRing[gRing.length - 1][1], `ring decimated to ≤ 300 points and stays closed (${gRing.length})`, gRing.length);
assert(gg.cone && gg.cone.length === 1 && gg.cone[0][0].length === 5, 'uncertainty cone kept');
assert(gg.track.length === 3 && gg.track[0].cat === 'HU' && gg.track[1].cat === 'TD' && gg.track[0].pts[2][0] === 15.8, 'track segments with category (TD/TS/HU)', gg.track.map(t => t.cat));
assert(gg.track.map(t => t.forecast).join() === 'false,true,false', 'per-segment forecast flag (only boolean true counts)', gg.track.map(t => t.forecast));
assert(gg.centroid && gg.centroid[0] === 15.8 && gg.centroid[1] === 80.2, 'centroid', gg.centroid);
assert(A.decimateRing(Array.from({ length: 50 }, (_, i) => [i, i]), 300).length === 50, 'short rings untouched');
threw = null;
try { A.parseGdacsGeometry({ hourly: {} }); } catch (e) { threw = e.message; }
assert(!!threw, 'non-GeoJSON geometry throws', threw);

// ---------------------------------------------------------------------------
console.log('\n[12] cyclone proximity');
const kanpur = { lat: 26.51, lon: 80.23 }, vizag = { lat: 17.69, lon: 83.22 };
assert(A.cycloneProximity(evs, {}, kanpur, 800) === null, 'Kanpur ~1190 km from MURASU → no banner');
const hit = A.cycloneProximity(evs, {}, vizag, 800);
assert(hit && Math.abs(hit.km - 380) < 25 && /^(SW|WSW|SSW)$/.test(hit.dir) && hit.ev.name === 'MURASU-26', `Visakhapatnam ~380 km, storm to the SW (${hit && Math.round(hit.km)} km ${hit && hit.dir})`, hit && { km: hit.km, dir: hit.dir });
const kolkata = { lat: 22.57, lon: 88.36 };
assert(A.cycloneProximity(evs, {}, kolkata, 800) === null, 'Kolkata ~1150 km from the position alone → none');
const geomK = { '1001346:10': { track: [{ cat: 'TS', forecast: true, pts: [[15.8, 80.2], [19.5, 86.5]] }] } };
const viaTrack = A.cycloneProximity(evs, geomK, kolkata, 800);
assert(viaTrack && viaTrack.km < 800 && viaTrack.forecast === true && /^(SW|SSW|WSW)$/.test(viaTrack.dir), `a FORECAST track vertex within 800 km triggers (forecast: true, ${viaTrack && Math.round(viaTrack.km)} km ${viaTrack && viaTrack.dir})`, viaTrack && { km: viaTrack.km, f: viaTrack.forecast });
const geomPast = { '1001346:10': { track: [{ cat: 'TS', forecast: false, pts: [[19.5, 86.5], [15.8, 80.2]] }] } };
assert(A.cycloneProximity(evs, geomPast, kolkata, 800) === null, 'past-track vertices ignored (storm already left)');
assert(A.cycloneProximity(evs, { '1001346:10': { track: [{ cat: 'TS', pts: [[19.5, 86.5]] }] } }, kolkata, 800) === null, 'segment without a forecast flag (old cache) ignored');
assert(hit.forecast === false, 'current position nearest → forecast: false');
const geomTie = { '1001346:10': { track: [{ cat: 'TS', forecast: true, pts: [[15.8, 80.2], [10, 75]] }] } };
const tie = A.cycloneProximity(evs, geomTie, vizag, 800);
assert(tie && tie.forecast === false && Math.abs(tie.km - hit.km) < 1e-9, 'forecast track starting at the storm (tie) → current-position wording');
assert(A.cycloneProximity(evs, { '1001346:10': { track: [{ forecast: true, pts: [null, ['a', 'b'], [19.5, 86.5]] }] } }, kolkata, 800).forecast === true, 'malformed track points skipped');
assert(A.cycloneProximity(evs.map(e => ({ ...e, stale: true })), {}, vizag, 800) === null, 'stale storms excluded');
const two = [{ ...evs[0], id: 'a', name: 'FAR' }, { ...evs[0], id: 'b', name: 'NEAR', lat: 18.5, lon: 84.5 }];
assert(A.cycloneProximity(two, {}, vizag, 800).ev.name === 'NEAR', 'nearest of two storms');
assert(Math.abs(A.bearingDeg(20, 80, 21, 80)) < 1e-6 && Math.abs(A.bearingDeg(20, 80, 20, 81) - 90) < 0.5, 'bearingDeg N = 0°, E ≈ 90°');

// ---------------------------------------------------------------------------
console.log('\n[13] layer persistence');
const D0 = loadApp();
assert(D0.appState.layers.wind === false && D0.appState.layers.pressure === false && D0.appState.layers.cyclones === true && D0.appState.layers.radar === true, 'defaults: wind / pressure off, cyclones on', D0.appState.layers);
const store = {};
const D1 = loadApp({ store });
D1.setMapLayer('wind', true);
D1.setMapLayer('cyclones', false);
const D2 = loadApp({ store });
assert(D2.appState.layers.wind === true && D2.appState.layers.cyclones === false && D2.appState.layers.pressure === false, 'round trip through rainstop_layers_v1', D2.appState.layers);
const D3 = loadApp({ store: { rainstop_layers_v1: JSON.stringify({ wind: 'yes', pressure: 1, cyclones: null, radar: false }) } });
assert(D3.appState.layers.wind === false && D3.appState.layers.pressure === false && D3.appState.layers.cyclones === true && D3.appState.layers.radar === false, 'non-boolean saved values ignored', D3.appState.layers);
assert(loadApp({ store: { rainstop_layers_v1: '{bad json' } }).appState.layers.cyclones === true, 'corrupt saved value → defaults');

// ---------------------------------------------------------------------------
(async () => {
  console.log('\n[14] failure states (rate limit, feed down, non-live)');
  // India 429 → rate-limited back-off: the second call must not fetch.
  let indiaCalls = 0;
  const RL = richLeaflet(5);
  const docRL = { getElementById: () => el(), querySelector: () => el(), querySelectorAll: () => [], addEventListener() {}, createElement: () => mkEl(), createTextNode: () => mkEl() };
  const E = loadApp({ document: docRL, extra: { L: RL.L }, fetch: async (url) => {
    if (url.includes('wind_speed_10m,wind_direction_10m')) { indiaCalls++; return { ok: false, status: 429, json: async () => ({}) }; }
    throw new Error('down');
  } });
  E.setMap(RL.map);
  const panel = mkEl('panel');
  E.buildLayerToggles(panel);
  E.appState.layers.wind = true;
  await E.refreshIndiaField();
  assert(indiaCalls === 1 && E.appState.india.failure && E.appState.india.failure.rateLimited === true && E.appState.india.failed === true, 'HTTP 429 → rate-limited failure recorded', E.appState.india.failure);
  await E.refreshIndiaField();
  assert(indiaCalls === 1, 'no refetch during the rate-limit back-off', indiaCalls);
  const windRow = E.layerToggleInputs.find(t => t.key === 'wind');
  assert(windRow && windRow.sub.textContent === 'India model map unavailable', 'Wind toggle sub-line says the India map is unavailable', windRow && windRow.sub.textContent);
  RL.map._zoom = 10;
  E.appState.india.failed = false;
  E.updateLayerStatus();
  assert(windRow.sub.textContent === 'Zoom out or tap India to view', 'zoomed in → "Zoom out or tap India to view"', windRow.sub.textContent);
  await E.refreshIndiaField();
  assert(indiaCalls === 1, 'no India fetch when zoomed in past 7');

  // GDACS network error → feed unavailable
  let gdacsCalls = 0;
  const G = loadApp({ fetch: async (url) => { if (url.includes('gdacs')) gdacsCalls++; throw new Error('network down'); } });
  let gThrew = null;
  try { await G.refreshCyclones(); } catch (e) { gThrew = e.message; }
  assert(!gThrew && gdacsCalls === 1 && G.appState.cyclones.failed === true, 'GDACS network error → failed, never throws', { gThrew, gdacsCalls });
  assert(G.layerStatusText('cyclones', 'x') === 'Cyclone feed unavailable', 'Cyclones sub-line: "Cyclone feed unavailable"');
  await G.refreshCyclones();
  assert(gdacsCalls === 1, 'GDACS back-off after a failure');
  // Non-GeoJSON (e.g. a test mock routing every URL to the A0 payload) → failed
  const Gb = loadApp({ fetch: async () => ({ ok: true, json: async () => ({ current: { time: 1 }, minutely_15: { time: [] } }) }) });
  await Gb.refreshCyclones();
  assert(Gb.appState.cyclones.failed === true && Gb.appState.cyclones.events.length === 0, 'non-GeoJSON response rejected → failed');
  // Offline with a recent cache → events shown "as of" the cache time
  const cacheStore = { rainstop_cyclones_v2: JSON.stringify({ fetchedAt: Date.now() - 2 * 3600000, events: evs, geom: {} }) };
  const Gc = loadApp({ store: cacheStore });
  await Gc.refreshCyclones();
  assert(Gc.appState.cyclones.events.length === 1 && Gc.appState.cyclones.asOf > 0 && Gc.appState.cyclones.failed === false && /as of/.test(Gc.layerStatusText('cyclones', 'x')), 'offline → ≤ 6 h cache shown "as of"', Gc.layerStatusText('cyclones', 'x'));
  // Success path: list + geometry fetched once, cached
  let geoCalls = 0;
  const realList = { type: 'FeatureCollection', features: [gFeat('MURASU-26', 1001346, 'Red', 'true', new Date(Date.now() - 6 * 3600000).toISOString().slice(0, 19), [80.2, 15.8], 157.4)] };
  const okStore = {};
  const Gd = loadApp({ store: okStore, fetch: async (url) => {
    if (url.includes('geteventlist')) return { ok: true, json: async () => realList };
    if (url.includes('getgeometry')) { geoCalls++; return { ok: true, json: async () => GGEO }; }
    throw new Error('down');
  } });
  await Gd.refreshCyclones();
  assert(Gd.appState.cyclones.events.length === 1 && geoCalls === 1 && Gd.appState.cyclones.geom['1001346:10'].zones.length === 3, 'list + geometry for the new storm', { geoCalls, n: Gd.appState.cyclones.events.length });
  assert(/1 active · GDACS/.test(Gd.layerStatusText('cyclones', 'x')) && !!okStore.rainstop_cyclones_v2, 'sub-line "1 active · GDACS", cache written');
  const Ge = loadApp({ fetch: async () => ({ ok: true, json: async () => ({ type: 'FeatureCollection', features: [] }) }) });
  await Ge.refreshCyclones();
  assert(Ge.layerStatusText('cyclones', 'x') === 'No active cyclones in region', 'empty list → "No active cyclones in region"');
  const Gv1 = loadApp({ store: { rainstop_cyclones_v1: JSON.stringify({ fetchedAt: Date.now() - 2 * 3600000, events: evs, geom: {} }) } });
  await Gv1.refreshCyclones();
  assert(Gv1.appState.cyclones.events.length === 0 && Gv1.appState.cyclones.failed === true, 'v1 cache (no track forecast flags) ignored');
  // HTTP 204 / empty body = no storms (GDACS on quiet days): success, old storm cleared
  const noJson = async () => { throw new SyntaxError('Unexpected end of JSON input'); };
  const quiet = [
    ['HTTP 204, empty body', { ok: true, status: 204, json: noJson, text: async () => '' }],
    ['HTTP 200, empty body', { ok: true, status: 200, json: noJson, text: async () => '' }],
    ['HTTP 200, whitespace body', { ok: true, status: 200, json: noJson, text: async () => ' \n' }],
    ['HTTP 204 (mock without text())', { ok: true, status: 204, json: noJson }]
  ];
  for (const [label, resp] of quiet) {
    const qStore = {};
    let qGeo = 0;
    const Q0 = loadApp({ store: qStore, fetch: async (url) => { if (url.includes('getgeometry')) { qGeo++; return { ok: true, json: async () => GGEO }; } return resp; } });
    Object.assign(Q0.appState.cyclones, { events: evs.map(e => ({ ...e })), geom: { '1001346:10': gg }, fetchedAt: Date.now() - 31 * 60000 });
    await Q0.refreshCyclones();
    const qs = Q0.appState.cyclones;
    const cached = JSON.parse(qStore.rainstop_cyclones_v2 || 'null');
    assert(qs.events.length === 0 && Object.keys(qs.geom).length === 0 && qs.failed === false && !qs.failure && qGeo === 0 && cached && cached.events.length === 0 && Q0.layerStatusText('cyclones', 'x') === 'No active cyclones in region',
      `${label} → no storms (old storm + geometry cleared, cache updated, "No active cyclones")`, { n: qs.events.length, failed: qs.failed, status: Q0.layerStatusText('cyclones', 'x') });
  }
  const Gbad = loadApp({ fetch: async () => ({ ok: true, status: 200, json: noJson, text: async () => '<html>busy</html>' }) });
  await Gbad.refreshCyclones();
  assert(Gbad.appState.cyclones.failed === true, 'non-empty non-JSON body → failed');
  const Gtxt = loadApp({ fetch: async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ current: { time: 1 } }) }) });
  await Gtxt.refreshCyclones();
  assert(Gtxt.appState.cyclones.failed === true, 'non-GeoJSON JSON body (via text()) still rejected');
  const Gtxt2 = loadApp({ fetch: async (url) => (url.includes('geteventlist') ? { ok: true, status: 200, text: async () => JSON.stringify(realList) } : { ok: true, json: async () => GGEO }) });
  await Gtxt2.refreshCyclones();
  assert(Gtxt2.appState.cyclones.events.length === 1 && Gtxt2.appState.cyclones.geom['1001346:10'].track.some(t => t.forecast), 'GeoJSON body read via text() → storm + geometry with forecast track');

  // India body read bounded (fetchWithTimeout only covers the headers)
  let bodyErr = null;
  const tB = Date.now();
  try { await A.readJsonWithTimeout({ json: () => new Promise(() => {}) }, 40); } catch (e) { bodyErr = e.message; }
  assert(/timed out/.test(String(bodyErr)) && Date.now() - tB < 1000, 'readJsonWithTimeout: stalled body → rejects after the timeout', bodyErr);
  assert((await A.readJsonWithTimeout({ json: async () => ({ a: 1 }) }, 40)).a === 1, 'readJsonWithTimeout: normal body passes through');
  let syncErr = null;
  try { await A.readJsonWithTimeout({ json: () => { throw new Error('sync boom'); } }, 40); } catch (e) { syncErr = e.message; }
  assert(syncErr === 'sync boom', 'readJsonWithTimeout: synchronous json() throw → rejection', syncErr);
  assert(/parseIndiaField\(await readJsonWithTimeout\(res, \d+\), spec\)/.test(APP_SRC), 'refreshIndiaField reads the body through readJsonWithTimeout');
  let iCalls = 0;
  const RLb = richLeaflet(5);
  const Ib = loadApp({ extra: { L: RLb.L }, fetch: async (url) => {
    if (url.includes('wind_speed_10m,wind_direction_10m')) { iCalls++; return { ok: true, status: 200, json: async () => { throw new Error('body aborted'); } }; }
    throw new Error('down');
  } });
  Ib.setMap(RLb.map);
  Ib.appState.layers.wind = true;
  await Ib.refreshIndiaField();
  Ib.appState.india.failure = null; // skip the back-off: the in-flight flag must have been cleared
  await Ib.refreshIndiaField();
  assert(iCalls === 2 && Ib.appState.india.failed === true, 'body-read failure → failed, in-flight flag cleared (next call fetches again)', iCalls);

  // Non-live: nothing fetched
  let anyCalls = 0;
  const RL2 = richLeaflet(5);
  const H = loadApp({ extra: { L: RL2.L }, fetch: async () => { anyCalls++; throw new Error('x'); } });
  H.setMap(RL2.map);
  H.appState.activeScenario = 'monsoon';
  H.appState.layers.wind = true;
  await H.refreshCyclones();
  await H.refreshIndiaField();
  assert(anyCalls === 0, 'simulation mode → no India / GDACS fetch', anyCalls);

  // -------------------------------------------------------------------------
  console.log('\n[15] rendering in limited sandboxes');
  // Proxy DOM + a storm near the user → updateUI ok
  const P = loadApp();
  P.appState.originCoords = { lat: 17.69, lon: 83.22 };
  P.appState.cyclones.events = evs.map(e => ({ ...e }));
  P.appState.cyclones.fetchedAt = Date.now();
  threw = null;
  try { P.updateUI(); P.renderCycloneLayers(); P.renderIndiaLayers(null); } catch (e) { threw = e.message; }
  assert(!threw, 'Proxy DOM: updateUI with a cyclone in state, no map → ok', threw);

  // Live-deployment-style mock: appendChild returns undefined, limited L, no map
  const elements = {};
  const liveEl = (id = '') => ({ id, textContent: '', style: {}, value: '', children: [], attrs: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, addEventListener() {}, dispatchEvent() {}, querySelector() { return liveEl(); }, querySelectorAll() { return [liveEl()]; }, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(a) { return a === 'data-mode' ? 'walk' : ''; }, appendChild(c) { this.children.push(c); }, removeChild() {}, contains() { return false; }, focus() {} });
  const sandbox = {
    document: { getElementById(id) { return elements[id] || (elements[id] = liveEl(id)); }, querySelector() { return liveEl(); }, querySelectorAll() { return [liveEl()]; }, createElement() { return liveEl(); }, createTextNode(t) { const n = liveEl(); n.textContent = t; return n; }, addEventListener() {} },
    window: { location: { origin: 'https://x', pathname: '/', search: '' }, addEventListener() {} },
    navigator: { geolocation: { getCurrentPosition() {} } },
    localStorage: { getItem() { return null; }, setItem() {} },
    setTimeout, clearTimeout, setInterval, clearInterval, console: { log() {}, warn() {}, error: console.error }, Date, Math, JSON,
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
    L: { map: () => ({ setView() {}, on() {}, fitBounds() {}, removeLayer() {} }), tileLayer: () => ({ addTo() {} }), marker: () => ({ addTo() { return { bindPopup() { return {}; }, setLatLng() {} }; } }), polyline: () => ({ addTo() {} }), geoJSON: () => ({ addTo() { return { getBounds() { return {}; } }; } }), divIcon: () => ({}) }
  };
  vm.createContext(sandbox);
  threw = null;
  try {
    vm.runInContext(APP_SRC, sandbox);
    sandbox.__evs = evs;
    vm.runInContext('appState.originCoords = { lat: 17.69, lon: 83.22 }; appState.cyclones.events = __evs.map(e => Object.assign({}, e)); updateUI(); renderCycloneLayers(); renderIndiaLayers(null);', sandbox);
  } catch (e) { threw = e.message; }
  assert(!threw, 'live-deployment mock (appendChild returns undefined) → updateUI ok', threw);
  const box = elements.cycloneAlert;
  assert(box && box.hidden === false && box.attrs['data-alert'] === 'Red' && /Cyclone MURASU-26 ~3[6-9]0 km (SW|WSW|SSW) of you · GDACS Red · max wind 157 km\/h( \(last advisory \d+ h ago — may have weakened\))?\. Not an official warning — follow IMD\./.test(textOf(box)), 'cyclone banner text + alert level (+ age when ≥ 12 h)', box && textOf(box));
  const links = box ? box.children.filter(c => c.attrs && c.attrs.href) : [];
  assert(links.length === 2 && links.some(a => /mausam\.imd\.gov\.in/.test(a.attrs.href)) && links.every(a => a.attrs.target === '_blank' && a.attrs.rel === 'noopener'), 'GDACS + IMD links (new tab, noopener)', links.map(a => a.attrs));
  const peek = elements.mPeekAlert;
  assert(peek && peek.hidden === false && /^🌀 MURASU-26 · 3[6-9]0 km (SW|WSW|SSW) · Red( · \d+ h old)?$/.test(peek.textContent), 'phone peek one-liner', peek && peek.textContent);
  vm.runInContext('appState.originCoords = { lat: 26.51, lon: 80.23 }; updateUI();', sandbox);
  assert(box.hidden === true && peek.hidden === true, 'far from the storm → banner hidden');
  vm.runInContext('appState.activeScenario = "monsoon"; appState.originCoords = { lat: 17.69, lon: 83.22 }; updateUI();', sandbox);
  assert(box.hidden === true, 'simulation → no cyclone banner');
  sandbox.__geomK = geomK;
  box.children.length = 0;
  vm.runInContext('appState.activeScenario = "live"; appState.cyclones.geom = __geomK; appState.originCoords = { lat: 22.57, lon: 88.36 }; updateUI();', sandbox);
  assert(box.hidden === false && /Cyclone MURASU-26 forecast track passes ~\d+ km (SW|SSW|WSW) of you · GDACS Red/.test(textOf(box)), 'nearest point on the forecast track → "forecast track passes ~N km DIR of you"', textOf(box));
  assert(/^🌀 MURASU-26 · track \d+ km (SW|SSW|WSW) · Red/.test(peek.textContent), 'phone peek says "track"', peek.textContent);
  box.children.length = 0; // the mock's textContent = '' does not drop children
  vm.runInContext('appState.originCoords = { lat: 17.69, lon: 83.22 }; updateUI();', sandbox);
  assert(/Cyclone MURASU-26 ~3[6-9]0 km (SW|WSW|SSW) of you/.test(textOf(box)) && !/forecast track/.test(textOf(box)), 'current position nearest → position wording');

  // Fake Leaflet of test_map_layers [7] (no layerGroup, map without getZoom): nothing drawn
  const F7 = { L: { tileLayer: () => ({}), imageOverlay: () => ({}), control: () => ({ addTo() {} }), DomUtil: { create: () => el() }, DomEvent: { disableClickPropagation() {}, disableScrollPropagation() {} } } };
  const M7 = { _layers: new Set(), hasLayer(l) { return this._layers.has(l); }, removeLayer(l) { this._layers.delete(l); }, createPane() { return { style: {} }; }, getPane() { return null; }, fitBounds() {}, setView() {}, invalidateSize() {}, on() {} };
  const Q = loadApp({ extra: { L: F7.L } });
  Q.setMap(M7);
  Q.appState.layers.wind = true;
  Q.appState.layers.pressure = true;
  Q.appState.india.field = uni;
  threw = null;
  try { Q.renderIndiaLayers(null); Q.renderCycloneLayers(); Q.rebuildTimeline(); Q.setMapLayer('pressure', true); Q.onMapZoomEnd(); } catch (e) { threw = e.message; }
  assert(!threw && M7._layers.size === 0, 'limited fake Leaflet (no layerGroup / getZoom) → no throw, nothing drawn', threw);

  // Rich fake Leaflet at zoom 5 with a real-time field: arrows, isobars, labels, centres
  const R = richLeaflet(5);
  const W = loadApp({ extra: { L: R.L }, document: docRL });
  W.setMap(R.map);
  W.appState.layers.wind = true;
  W.appState.layers.pressure = true;
  const nowH = Math.floor(Date.now() / 3600000) * 3600;
  W.appState.india.field = W.parseIndiaField(fakeIndiaJson(nowH, (pt) => ({ ws: 12 + pt.col, wd: 250, p: 1010 - gauss(pt, 9, 8, 8) })), SPEC);
  W.renderIndiaLayers(null);
  const polys = R.made.filter(l => l.kind === 'polyline');
  const windPolys = polys.filter(l => l.opts.pane === 'rsWind');
  const isoPolys = polys.filter(l => l.opts.pane === 'rsIsobar');
  const labelMarkers = R.made.filter(l => l.kind === 'marker' && l.opts.pane === 'rsMapLabel');
  assert(windPolys.length >= 2 && windPolys.length <= 7 && windPolys.every(l => l.opts.interactive === false && l.opts.weight === 2 && Array.isArray(l.latlngs[0][0])), 'wind: ≤ 7 multi-polylines (one per bin), non-interactive', windPolys.length);
  assert(isoPolys.length >= 2 && isoPolys.length <= 16 && isoPolys.every(l => l.opts.color === '#ffffff' && l.opts.interactive === false), 'isobars: one multi-polyline per level (≤ 16)', isoPolys.length);
  assert(labelMarkers.length >= 2 && labelMarkers.every(m => m.opts.interactive === false && m.opts.keyboard === false && m.opts.icon.html && m.opts.icon.className === 'rs-divicon'), 'labels / centres: non-interactive divIcon markers built from elements', labelMarkers.length);
  const lowMarker = labelMarkers.find(m => /rs-pcentre-L/.test(m.opts.icon.html.className));
  assert(lowMarker && /model est\., not IMD/.test(textOf(lowMarker.opts.icon.html)), 'model low marker "L" with "model est., not IMD" tag', lowMarker && textOf(lowMarker.opts.icon.html));
  const groupsOn = [...R.map._set].filter(l => l._layers).length;
  R.made.length = 0;
  W.renderIndiaLayers(null);
  assert(R.made.length === 0 && groupsOn === 3, 'same hour + zoom → memoised, no rebuild', R.made.length);
  R.map._zoom = 9;
  W.onMapZoomEnd();
  assert([...R.map._set].filter(l => l._layers).length === 0, 'zoom 9 → India layers removed', [...R.map._set].length);
  R.map._zoom = 4;
  W.onMapZoomEnd();
  assert(R.made.some(l => l.opts.pane === 'rsWind') && W.timelineState.frames.some(f => f.kind === 'model' && f.src === 'india'), 'zoom back to India → redrawn; timeline gets India model hours', W.timelineState.frames.map(f => f.src || f.kind));
  W.setMapLayer('wind', false);
  W.setMapLayer('pressure', false);
  assert([...R.map._set].filter(l => l._layers && l._layers.size).length === 0, 'both layers off → nothing drawn');
  R.map._zoom = 12;
  W.setMapLayer('wind', true);
  assert(R.map.fitCalls.length === 1 && W.appState.mapFocus === 'india' && R.map.fitCalls[0][1].maxZoom === 5, 'turning Wind on while zoomed in → fits all India (maxZoom 5)', R.map.fitCalls);
  // Cyclone layers on the rich map
  W.appState.cyclones.events = evs.map(e => ({ ...e }));
  W.appState.cyclones.geom = { '1001346:10': gg };
  W.appState.cyclones.fetchedAt = Date.now();
  R.made.length = 0;
  W.renderCycloneLayers();
  const tcPolys = R.made.filter(l => l.kind === 'polygon');
  const tcMarker = R.made.find(l => l.kind === 'marker');
  assert(tcPolys.length === 4 && tcPolys.every(p => p.opts.pane === 'rsCyclone' && p.opts.interactive === false), '3 wind zones + cone in the rsCyclone pane', tcPolys.length);
  assert(tcPolys.find(p => p.opts.dashArray) && tcPolys.find(p => p.opts.dashArray).opts.fill === false, 'cone dashed, no fill');
  assert(R.made.filter(l => l.kind === 'polyline' && l.opts.pane === 'rsCyclone').map(l => l.opts.color).join() === '#ef4444,#7dd3fc,#facc15', 'track coloured by category (HU red, TD blue, TS yellow)');
  assert(tcMarker && tcMarker.opts.pane === undefined && tcMarker.popup && /IMD/.test(textOf(tcMarker.popup)) && /Max wind ~157 km\/h/.test(textOf(tcMarker.popup)), 'clickable storm marker (markerPane) with popup: wind + IMD', tcMarker && textOf(tcMarker.popup));
  W.setMapLayer('cyclones', false);
  assert([...R.map._set].filter(l => l._layers && [...l._layers].some(x => x.kind === 'polygon')).length === 0, 'Cyclones layer off → storm layers removed');

  // Zoom 6 ↔ 7 stays in the India bucket but toggles the local rain grid → showFrame again
  const Rz = richLeaflet(6);
  const Z = loadApp({ extra: { L: Rz.L }, document: docRL });
  Z.setMap(Rz.map);
  Z.appState.layers.wind = true;
  Z.appState.india.field = Z.parseIndiaField(fakeIndiaJson(nowH, () => ({ ws: 12, wd: 250, p: 1008 })), SPEC);
  Z.onMapZoomEnd();
  const realShow = Z.__ctx.showFrame;
  let shows = 0;
  Z.__ctx.showFrame = (i) => { shows++; return realShow(i); };
  Rz.map._zoom = 7; Z.onMapZoomEnd();
  const s7 = shows;
  Z.onMapZoomEnd();
  const s7b = shows;
  Rz.map._zoom = 6; Z.onMapZoomEnd();
  assert(Z.timelineState.frames.length > 0 && s7 === 1 && s7b === 1 && shows === 2, 'zoom 6 → 7 → 7 → 6: showFrame on each local-grid visibility change only', [s7, s7b, shows]);
  Z.__ctx.showFrame = realShow;

  // Memo key includes the phone layout (arrow weight 2 desktop / 1.6 phone)
  const Rm = richLeaflet(5);
  const docM = { ...docRL };
  const Mo = loadApp({ extra: { L: Rm.L }, document: docM });
  Mo.setMap(Rm.map);
  Mo.appState.layers.wind = true;
  Mo.appState.india.field = Mo.parseIndiaField(fakeIndiaJson(nowH, (pt) => ({ ws: 12 + pt.col, wd: 250, p: 1008 })), SPEC);
  Mo.renderIndiaLayers(null);
  const wDesk = Rm.made.filter(l => l.opts.pane === 'rsWind').map(l => l.opts.weight);
  Rm.made.length = 0;
  docM.body = { classList: { contains: c => c === 'm-map' } };
  Mo.renderIndiaLayers(null);
  const wPhone = Rm.made.filter(l => l.opts.pane === 'rsWind').map(l => l.opts.weight);
  assert(wDesk.length && wDesk.every(w => w === 2) && wPhone.length && wPhone.every(w => w === 1.6), 'desktop → phone layout switch rebuilds arrows (weight 2 → 1.6)', [wDesk[0], wPhone[0]]);

  // Legend only with a usable field (a stale field = nothing drawn)
  const Rl = richLeaflet(5);
  Rl.L.control = () => { const c = { addTo(m) { c.el = c.onAdd(m); return c; } }; return c; };
  const Lg = loadApp({ extra: { L: Rl.L }, document: docRL });
  Lg.setMap(Rl.map);
  Lg.appState.layers.wind = true;
  Lg.appState.india.field = Lg.parseIndiaField(fakeIndiaJson(nowH - 30 * 3600, () => ({ ws: 12, wd: 250, p: 1008 })), SPEC);
  let legendDiv = null;
  const realCreate = docRL.createElement;
  docRL.createElement = () => { const e = mkEl(); if (!legendDiv) legendDiv = e; return e; };
  Lg.addIndiaLegendControl();
  docRL.createElement = realCreate;
  Lg.updateIndiaLegend();
  const staleHidden = legendDiv && legendDiv.hidden;
  Lg.appState.india.field = Lg.parseIndiaField(fakeIndiaJson(nowH, () => ({ ws: 12, wd: 250, p: 1008 })), SPEC);
  Lg.updateIndiaLegend();
  assert(legendDiv && staleHidden === true && legendDiv.hidden === false, 'legend hidden for a stale field, shown for a usable one', [staleHidden, legendDiv && legendDiv.hidden]);

  // Phone India view: sheet collapsed to peek first, bottom padding ≤ 50 % of the map height
  const Rp = richLeaflet(12);
  const docP = { ...docRL, body: { classList: { contains: c => c === 'm-map' } }, documentElement: { style: { setProperty() {} } }, getElementById: () => mkEl() };
  const Ph = loadApp({ extra: { L: Rp.L }, document: docP });
  Ph.setMap(Rp.map);
  Object.assign(Ph.sheetState, { snaps: { peek: 150, half: 420, full: 700 }, snap: 'full', visible: 700 });
  Rp.map.getSize = () => ({ x: 390, y: 800 });
  Ph.showIndiaView();
  const padA = Rp.map.fitCalls[0][1].paddingBottomRight[1];
  assert(Ph.sheetState.snap === 'peek' && padA === 162 && Ph.appState.mapFocus === 'india', 'full sheet → snapped to peek, padding = peek + 12', [Ph.sheetState.snap, padA]);
  Object.assign(Ph.sheetState, { snaps: null, visible: 700 });
  Rp.map.getSize = () => ({ x: 390, y: 600 });
  Ph.showIndiaView();
  assert(Rp.map.fitCalls[1][1].paddingBottomRight[1] === 300, 'no sheet snaps: padding clamped to 50 % of map height (300 of 600)', Rp.map.fitCalls[1][1]);
  delete Rp.map.getSize;
  Ph.sheetState.visible = 120;
  Ph.showIndiaView();
  assert(Rp.map.fitCalls[2][1].paddingBottomRight[1] === 132, 'map without getSize → unclamped padding (guarded)', Rp.map.fitCalls[2][1]);
  Rp.map.getSize = () => ({ x: NaN, y: NaN });
  Ph.showIndiaView();
  assert(Rp.map.fitCalls[3][1].paddingBottomRight[1] === 132, 'NaN map size → unclamped padding', Rp.map.fitCalls[3][1]);

  // New trip picked → leave the all-India view (desktop refits the route, phone → radar)
  const Fd = loadApp();
  Fd.appState.mapFocus = 'india'; Fd.focusNewTrip();
  const fdA = Fd.appState.mapFocus;
  Fd.appState.mapFocus = 'radar'; Fd.focusNewTrip();
  assert(fdA === 'route' && Fd.appState.mapFocus === 'route', 'desktop: new origin / destination → route focus', [fdA, Fd.appState.mapFocus]);
  const Fp = loadApp({ document: { ...docRL, body: { classList: { contains: c => c === 'm-map' } } } });
  Fp.appState.mapFocus = 'india'; Fp.focusNewTrip();
  const fpA = Fp.appState.mapFocus;
  Fp.appState.mapFocus = 'route'; Fp.focusNewTrip();
  assert(fpA === 'radar' && Fp.appState.mapFocus === 'route', 'phone: India → radar; route focus kept', [fpA, Fp.appState.mapFocus]);
  assert((APP_SRC.match(/focusNewTrip\(\);\s*fetchAndDrawRoute\(\);/g) || []).length === 3, 'focusNewTrip before fetchAndDrawRoute in autocomplete pick, route chip and swap');

  // GPS tap leaves the India view; a background fix keeps it
  const gpsRun = async (userTap, mobile) => {
    const Rg = richLeaflet(5);
    const views = [];
    Rg.map.setView = (c, z) => views.push([c, z]);
    const docG = mobile ? { ...docRL, body: { classList: { contains: c => c === 'm-map' } } } : docRL;
    const Gp = loadApp({ document: docG, extra: { L: Rg.L, navigator: { geolocation: { getCurrentPosition(ok) { ok({ coords: { latitude: 17.69, longitude: 83.22 } }); } } } } });
    Gp.setMap(Rg.map);
    Gp.appState.mapFocus = 'india';
    await Gp.__ctx.detectLocationWithFallback(userTap);
    await new Promise(r => setTimeout(r, 20));
    return { views, focus: Gp.appState.mapFocus };
  };
  const gDesk = await gpsRun(true, false);
  const gPhone = await gpsRun(true, true);
  const gBg = await gpsRun(false, false);
  assert(gDesk.views.length === 1 && gDesk.views[0][1] === 14 && gDesk.focus === 'route', 'desktop GPS tap in India view → street zoom, route focus', gDesk);
  assert(gPhone.views.length === 1 && gPhone.views[0][1] === 9 && gPhone.focus === 'radar', 'phone GPS tap in India view → radar zoom 9, radar focus', gPhone);
  assert(gBg.views.length === 0 && gBg.focus === 'india', 'background location fix keeps the India view', gBg);

  // -------------------------------------------------------------------------
  console.log('\n[16] pressure metric');
  const NOWP = 1800000000;
  const hT = Array.from({ length: 48 }, (_, i) => NOWP - 10 * 3600 + i * 3600);
  const pSeries = hT.map((t, i) => 1010 - 0.7 * i);
  const mp = A.parseMetrics({ current: { time: NOWP, pressure_msl: 1003.2 }, hourly: { time: hT, pressure_msl: pSeries } }, NOWP);
  assert(mp.pressureHpa === 1003.2, 'current MSL pressure parsed', mp.pressureHpa);
  assert(Math.abs(mp.pressureTrend3h - (-2.1)) < 1e-9, '3-h tendency = p(latest hour ≤ now) − p(3 h before)', mp.pressureTrend3h);
  const cardsP = A.metricCards(mp, null, NOWP);
  const pc = cardsP.find(c => c.id === 'pressure');
  assert(cardsP.length === 9 && cardsP[7].id === 'pressure' && cardsP[8].id === 'radar', '9 cards, pressure before radar', cardsP.map(c => c.id));
  assert(pc.value === '1003 hPa' && pc.sub === 'falling 2.1 hPa / 3 h' && pc.tone === 'neutral', 'value + "falling 2.1 hPa / 3 h"', pc);
  const fast = A.metricCards({ ...mp, pressureTrend3h: -4.2 }, null, NOWP).find(c => c.id === 'pressure');
  assert(fast.tone === 'warn' && /falling 4\.2/.test(fast.sub), 'falling ≥ 4 hPa / 3 h → warn', fast);
  assert(A.metricCards({ ...mp, pressureTrend3h: 0.6 }, null, NOWP).find(c => c.id === 'pressure').sub === 'steady', '|Δ| < 1 → "steady"');
  assert(/^rising 1\.5/.test(A.metricCards({ ...mp, pressureTrend3h: 1.5 }, null, NOWP).find(c => c.id === 'pressure').sub), 'rising');
  assert(A.metricCards(null, null, NOWP).find(c => c.id === 'pressure').value === '–', 'no metrics → "–"');
  const early = A.parseMetrics({ current: { pressure_msl: 1000 }, hourly: { time: hT.slice(9), pressure_msl: pSeries.slice(9) } }, NOWP);
  assert(early.pressureTrend3h === null, 'series shorter than 3 h before now → no tendency', early.pressureTrend3h);
  assert(A.parseMetrics({ current: {} }, NOWP).pressureHpa === null, 'missing pressure → null');
  // past_hours=3: just after local midnight the series still reaches 3 h back
  const midT = Array.from({ length: 51 }, (_, i) => NOWP - 4 * 3600 + i * 3600);
  const midM = A.parseMetrics({ current: { pressure_msl: 1000 }, hourly: { time: midT, pressure_msl: midT.map((_, i) => 1006 - i), precipitation: midT.map((_, i) => i), precipitation_probability: midT.map(() => 5), temperature_2m: midT.map(() => 20), weather_code: midT.map(() => 0) } }, NOWP + 600);
  assert(midM.pressureTrend3h === -3, 'series starting 4 h back → tendency available', midM.pressureTrend3h);
  assert(midM.hourly.length === 12 && midM.hourly[0].t === NOWP + 3600 && midM.hourly[0].mm === 5, 'past hours never leak into the hourly list (selected by time)', midM.hourly[0]);
  const a0Url = (APP_SRC.match(/const url = `https:\/\/api\.open-meteo\.com\/v1\/forecast\?latitude=\$\{lat\}&longitude=\$\{lon\}&current=[^`]+`/) || [''])[0];
  assert(/&past_hours=3&/.test(a0Url) && /&forecast_hours=48&/.test(a0Url) && /&forecast_days=2&/.test(a0Url), 'A0 URL: past_hours=3 + forecast_hours=48 (bounded, not 16 days)', a0Url.slice(-140));

  // -------------------------------------------------------------------------
  console.log('\n[17] static guards');
  const count = (APP_SRC.match(/innerHTML/g) || []).length;
  assert(count <= 25, `innerHTML occurrences not increased (${count} ≤ 25)`, count);
  const newJs = APP_SRC.slice(APP_SRC.indexOf('8.65 INDIA MODEL LAYERS'), APP_SRC.indexOf('8.7 CONDITIONS METRICS'));
  assert(newJs.length > 5000 && !/innerHTML|\.append\(|\.replaceChildren\(|\.remove\(\)|insertAdjacentHTML|outerHTML/.test(newJs), 'new India / cyclone code builds DOM with createElement only');
  const cssSec = CSS_SRC.slice(CSS_SRC.indexOf('INDIA WEATHER LAYERS'), CSS_SRC.indexOf('MAP-FIRST MOBILE')).replace(/^[\s\S]*?\*\//, '').replace(/\/\*[\s\S]*?\*\//g, '');
  assert(cssSec.length > 1000 && !/infinite/.test(cssSec) && !/backdrop-filter/.test(cssSec) && !/animation/.test(cssSec), 'INDIA WEATHER LAYERS CSS: no animation / infinite / backdrop-filter', cssSec.length);
  const fontDecls = (cssSec.match(/font(-family)?:[^;]+;/g) || []);
  assert(fontDecls.length > 3 && fontDecls.every(d => !/font-family/.test(d) || /var\(--font-(sans|mono)\)/.test(d)) && fontDecls.filter(d => /^font:/.test(d)).every(d => /var\(--font-(sans|mono)\)/.test(d)), 'fonts via var(--font-sans) / var(--font-mono) only', fontDecls.filter(d => !/var\(--font/.test(d) && !/font-size|font-weight|font-variant/.test(d)));
  assert(/\.rs-india-legend\[hidden\]/.test(cssSec) && /\.rs-cyclone-alert\[hidden\]/.test(cssSec), '[hidden] beats display rules for legend / banner');
  assert(/gdacs\\\.org/.test(SW_SRC) && SW_SRC.includes('rainstop-cache-v13'), 'sw.js: GDACS never cached, cache v13');
  ['mBtnIndia', 'cycloneAlert', 'mPeekAlert'].forEach(id => assert(HTML_SRC.includes(`id="${id}"`), `HTML contains id="${id}"`));
  assert(HTML_SRC.includes('style.css?v=8.3') && HTML_SRC.includes('app.js?v=8.3'), 'asset cache-buster v8.3');
  assert(/<div class="rs-cyclone-alert" id="cycloneAlert" role="status" hidden><\/div>/.test(HTML_SRC), 'banner is a hidden role=status region');
  const mapFirst = CSS_SRC.slice(CSS_SRC.indexOf('MAP-FIRST MOBILE'), CSS_SRC.indexOf('@media (prefers-reduced-motion'));
  assert(/body\.m-map \.metric-card\[data-metric="radar"\] \{\s*grid-column: 1 \/ -1;/.test(mapFirst), 'phone: radar card spans the last row (9 cards in 2 columns)');
  assert(APP_SRC.includes("appState.mapFocus === 'route') fitRouteBounds()") && !APP_SRC.includes("mapFocus !== 'radar') fitRouteBounds()"), 'route refit only in route focus (India / radar views stay put)');

  console.log(`\n==========================================\n🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED\n==========================================`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('❌ test harness error', e); process.exit(1); });
