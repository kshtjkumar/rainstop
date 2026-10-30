# 🌧️ RainStop • When Can I Leave? Rain Leave-Time Planner & Human Soak Simulator

> **"Will I get soaked walking right now, or should I wait for 1 chai — and until when?"**

RainStop is a commute planner that tells you **when you can leave** and how wet you'll get. Instead of one weather model's guess, it checks many forecasts over your *whole trip* and gives a departure time with a probability, e.g. **"Leave ~20:10 • 85% chance your 24-min walk stays dry enough"**.

[![Live Public Deployment](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-38bdf8?style=for-the-badge&logo=github)](https://kshtjkumar.github.io/rainstop/)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)
[![Zero API Keys](https://img.shields.io/badge/100%25%20Free-Zero%20API%20Keys-f59e0b?style=for-the-badge)]()

---

## 🚀 Live Demo & Sharable Links

- **Worldwide Deployment**: [https://kshtjkumar.github.io/rainstop/](https://kshtjkumar.github.io/rainstop/)
- **Custom Location Link**: Open and share any city or landmark via URL parameters:
  - `https://kshtjkumar.github.io/rainstop/?lat=19.076&lon=72.877&q=Mumbai`
  - `https://kshtjkumar.github.io/rainstop/?lat=28.6139&lon=77.209&q=New%20Delhi`
  - `https://kshtjkumar.github.io/rainstop/?lat=26.5123&lon=80.2329&q=IIT%20Kanpur`

---

## ✨ Key Features

1. **⏱️ When Can I Leave? (leave-time engine)**:
   - For every departure time over the next 6 hours (5-min steps), checks rain over the whole trip window, not just the moment you step out.
   - "Dry enough" depends on your mode and gear (car ignores rain; scooter without raincoat tolerates none). Optional **"Damp socks OK"** toggle allows more windows.
   - Recommends **leave now**, **wait until HH:MM**, or **waiting won't help** — with a probability and a confidence label (models disagree, single model, etc.).
   - See [How the leave time is computed](#-how-the-leave-time-is-computed).

2. **🧍 Interactive 5-Zone Human Anatomy Visualizer**:
   - Biophysical wetness calculation across 5 independent body zones: **Head & Hair**, **Torso**, **Backpack & Laptop**, **Jeans/Legs**, and **Shoes**.
   - Hover tooltips explain exact moisture transfer, puddle splash height, and water penetration risk.

3. **🚗 Multi-Modal Transit Physics**:
   - **🚗 Cab / Car**: Full cabin enclosure simulation. Automatically disables inapplicable gear (umbrellas/raincoats) and guarantees 100% dry arrival.
   - **🛵 2-Wheeler / Scooter**: Simulates 25–30 km/h wind-driven road spray. Equips full-face motorcycle helmet and enforces raincoat usage (locking out dangerous umbrellas).
   - **🚶 Pedestrian Walk**: Toggles umbrella and raincoat with mutual exclusivity and footwear puddle splash tracking.

4. **🗺️ Map-First Phone Layout + Rain Map**:
   - **Phones (≤ 768 px)**: full-screen dark map (CARTO dark basemap) with a **draggable bottom sheet** (peek → half → full). The peek shows when to leave; drag up for conditions, advice, trip and avatar. Map taps don't move the A/B pins on phones (drag the pins or use the Trip inputs); the **Trip** button fits the route.
   - **Radar loop**: the last ~2 h of RainViewer frames (−2 h … now) with play/scrub, on phones and under the desktop map.
   - **Forecast model map (experimental)**: +1 … +6 h hourly rain from a 7 × 7 Open-Meteo grid (~13 km spacing, model resolution ~10–25 km), continuing the same timeline and always labelled **FORECAST MODEL**, never radar.
   - **Satellite IR clouds** (NASA GIBS, JMA Himawari, ~1–2 h old) as an optional layer.
   - **Layer toggles**: radar, forecast rain, satellite clouds, trip route (remembered per browser).
   - Desktop keeps OpenStreetMap tiles with the dark filter; overlays sit in their own map panes so the filter never recolours radar.
   - Along-path ribbon: forecast rain (median across models) at the time you pass origin, midpoint and destination. Weather is fetched for the origin point.
   - Photon OpenStreetMap geocoder providing instant autocomplete for any place on Earth.

5. **🌡️ Conditions Card**:
   - Feels-like (+ actual) temperature, rain chance + amount for the next hour, wind with compass direction and gusts, humidity, UV now/max with level, cloud cover, sunrise/sunset (next one highlighted) and radar status.
   - **Next 12 hours chart**: rain chance bars (coloured by amount) with a temperature line.

6. **🛡️ Resilient Data Pipeline**:
   - Four sources load in parallel and fail independently; the app degrades gracefully (see table below).
   - Unix-time alignment (timezone-proof), forecast cached in localStorage (multi-model 10 min, ensemble 30 min).
   - Auto-refresh every 2.5 minutes and on screen unlock.
   - **Rain Here / Dry Here** buttons: your ground report adjusts the next ~30 min only; the forecast still drives the rest.

7. **📱 Progressive Web App (PWA) & Offline Resiliency**:
   - Service Worker (v10) with Network-First caching for app files; weather, radar, satellite and map tiles are never cached by the service worker.
   - Installable on iOS Safari and Android Chrome as a native standalone app.

---

## 🧮 How the Leave Time Is Computed

**Data sources** (all free, no API keys):

| Source | What | Resolution |
|---|---|---|
| [Open-Meteo](https://open-meteo.com/) forecast, 4 models (ECMWF IFS, GFS, ICON, JMA) | Rain timing | 15 min* |
| [Open-Meteo Ensemble](https://open-meteo.com/en/docs/ensemble-api) (ECMWF 51 + GEFS 31 + ICON-EPS 40 runs) | Uncertainty | 1 hour |
| [RainViewer](https://www.rainviewer.com/) radar (latest frame, ≤ 20 min old) | Rain observed *right now* | ~1 km |
| Your **Rain Here / Dry Here** report | Ground truth now | — |

**Map-only sources** (not used by the leave-time maths):

| Source | What | Refresh |
|---|---|---|
| RainViewer radar frames | Map loop, last ~2 h (13 × 10 min) | 5 min |
| Open-Meteo forecast grid (49 points, one request) | Experimental forecast rain map, +1 … +6 h | 30 min (cached 45 min) |
| [NASA GIBS](https://earthdata.nasa.gov/gibs) Himawari AHI band 13 | Satellite IR clouds, ~1–2 h old | on view |
| [CARTO](https://carto.com/attributions) dark basemap (© OpenStreetMap contributors) | Phone basemap | on view |

\* Outside Central Europe / North America, Open-Meteo's 15-minute data is interpolated from hourly model output.

**Method**
1. Trip duration = route distance ÷ mode speed (walk 4.5, scooter 25, car 18 km/h).
2. Tolerance τ (mm/h) = the highest rain rate the avatar's wetness model keeps at Tier ≤ 1 (or ≤ 2 with *Damp socks OK*) for your mode + gear — so advice and avatar always agree.
3. For each departure (every 5 min, next 6 h), each model/ensemble run says "OK" if rain stays ≤ τ for the **whole trip** (ensemble hourly means ×1.5 to allow for short bursts).
4. Probability = ½ × share of the 4 models OK + ½ × average over the 3 ensemble systems (each system weighted equally), lightly smoothed and capped to 3–97%.
5. Radar echo at your location (or a *Rain Here* report) caps the chance for the next ~30–60 min, fading with time. *No* echo is ignored: radar coverage over India is patchy.
6. Recommendation: leave now if ≥ 80%; wait for the first ≥ 80% window if it is ≤ 30 min away or improves the chance by ≥ 15 points; otherwise leave now if ≥ 60% ("waiting barely helps"); otherwise best bet / "waiting won't help" with a gear suggestion.

**When sources fail**

| Available | Result |
|---|---|
| Models + ensemble | Full blend |
| Models only | 15-min timing, "no ensemble" note |
| Ensemble only | Hourly timing, "hourly resolution" note |
| Single best-match model only | Confidence capped at Low |
| Nothing | Falls back to "Forecast Unavailable" + manual Rain/Dry buttons |

**Limits**: forecasts in India are hourly-model based; there is no radar nowcast (RainViewer discontinued it); weather is fetched for the start point only; probabilities are model agreement, not calibrated against observations. The forecast rain map is a coarse **model** field (not radar) and its colours are approximate; satellite clouds are ~1–2 h old.

---

## 🛠️ Tech Stack

- **Core**: Vanilla HTML5, CSS3 (Obsidian Glassmorphism), and ES6+ JavaScript.
- **Maps & Routing**: Leaflet.js, OpenStreetMap Carto Tiles, OSRM Routing Engine.
- **Geocoding**: Photon Geocoder API (Powered by Komoot & OpenStreetMap).
- **Weather**: Open-Meteo forecast + ensemble APIs (CC BY 4.0), RainViewer radar tiles (attribution required, non-commercial).
- **Audio Synthesizer**: Web Audio API (Harmonic C-major chime when rain clears).

---

## 🏃 Local Development

```bash
# Clone the repository
git clone https://github.com/kshtjkumar/rainstop.git
cd rainstop

# Run with any static HTTP server or open directly
open index.html

# Or with Node
npx serve .
```

---

## 🧪 Test Suite

Run automated unit and physics verification tests:

```bash
node test_leave_engine.js   # leave-time engine, failure matrix (offline, mocked APIs)
node test_map_layers.js     # rain map timeline, forecast grid, metrics, chart, sheet snapping
node test_rainstop.js
node test_route.js
node test_transport_mode.js
node test_live_verification.js
```

---

## 📄 License

MIT © [Kshitij Kumar](https://github.com/kshtjkumar)
