# 🌧️ RainStop • Hyperlocal Doppler Weather & Human Soak Simulator

> **"Will I get soaked walking right now, or should I wait 15 minutes for 1 chai?"**

RainStop is a real-time, zero-watermark, physics-grounded weather nowcaster and commute planner. It answers the one question standard weather apps fail to address: **relatable human wetness consequences**.

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

1. **⏱️ The Chai Rule & 60-Minute Rain Stop Countdown**:
   - Calculates exact clearance window down to the minute using high-resolution 15-minute Doppler radar profiles.
   - Tells commuters whether waiting for "1 Chai" (~15–20m) achieves a **Tier 0 Bone Dry** arrival.

2. **🧍 Interactive 5-Zone Human Anatomy Visualizer**:
   - Biophysical wetness calculation across 5 independent body zones: **Head & Hair**, **Torso**, **Backpack & Laptop**, **Jeans/Legs**, and **Shoes**.
   - Hover tooltips explain exact moisture transfer, puddle splash height, and water penetration risk.

3. **🚗 Multi-Modal Transit Physics**:
   - **🚗 Cab / Car**: Full cabin enclosure simulation. Automatically disables inapplicable gear (umbrellas/raincoats) and guarantees 100% dry arrival.
   - **🛵 2-Wheeler / Scooter**: Simulates 25–30 km/h wind-driven road spray. Equips full-face motorcycle helmet and enforces raincoat usage (locking out dangerous umbrellas).
   - **🚶 Pedestrian Walk**: Toggles umbrella and raincoat with mutual exclusivity and footwear puddle splash tracking.

4. **🗺️ Dynamic Route Radar & Leaflet Map Engine**:
   - OpenStreetMap dark tiles with zero external API key requirements.
   - Along-path precipitation ribbon showing exact rainfall rates at origin, midpoint, and destination.
   - Photon OpenStreetMap geocoder providing instant autocomplete for any place on Earth.

5. **🛡️ 5-Layer Resilient Weather Nowcasting Architecture**:
   - **48-Hour Rolling Window (`forecast_days=2`)**: Prevents midnight wrap-around boundaries.
   - **Epoch Millisecond Alignment**: Accurately synchronizes live weather with the current minute.
   - **Multi-Signal Consensus Engine**: Cross-references WMO station codes (51–99), high-res 15m radar, and hourly NWP models.
   - **Background Polling Heartbeat**: Auto-refreshes radar every 2.5 minutes and on screen unlock.
   - **Sanity Payload Audit**: Rejects contradictory weather states before UI rendering.

6. **📱 Progressive Web App (PWA) & Offline Resiliency**:
   - Service Worker v4 with Network-First caching strategy.
   - Installable on iOS Safari and Android Chrome as a native standalone app.

---

## 🛠️ Tech Stack

- **Core**: Vanilla HTML5, CSS3 (Obsidian Glassmorphism), and ES6+ JavaScript.
- **Maps & Routing**: Leaflet.js, OpenStreetMap Carto Tiles, OSRM Routing Engine.
- **Geocoding**: Photon Geocoder API (Powered by Komoot & OpenStreetMap).
- **Weather API**: Open-Meteo High-Resolution Global Doppler Radar (ECMWF / DWD ICON).
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
node test_rainstop.js
node test_route.js
node test_live_verification.js
```

---

## 📄 License

MIT © [Kshitij Kumar](https://github.com/kshtjkumar)
