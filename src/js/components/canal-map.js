/**
 * JalMitra AI - GIS Canal Distribution Map & Village/Gate Lookup (Requirement 13)
 * Implements interactive Leaflet OpenStreetMap GIS layer with canal path,
 * gates 1 to 6, farmer plots, flow telemetry, shortage markers, and SVG schematic fallback.
 */

import { store } from "../store.js";

export function renderCanalMap(container) {
  const state = store.getState();

  container.innerHTML = `
    <div class="card animate-fadeIn">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <div class="card-title"><span>🗺️</span> GIS Canal Distribution Map & Telemetry (Requirement 13)</div>
          <div class="card-subtitle">
            Godavari Left Bank Canal (GLBC) 40 km Command Area • Leaflet OpenStreetMap & Hydraulic Line Network
          </div>
        </div>
        
        <!-- View Toggle: Leaflet GIS vs SVG Schematic -->
        <div style="display: flex; gap: 0.4rem;">
          <button id="btn-toggle-gis" class="btn btn-teal btn-sm" style="font-weight: 700;">
            🗺️ Interactive GIS Map
          </button>
          <button id="btn-toggle-schematic" class="btn btn-secondary btn-sm">
            📐 Hydraulic Schematic
          </button>
        </div>
      </div>

      <!-- Village & Gate Search Tool -->
      <div style="background: var(--surface-alt); padding: 1rem 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--surface-border); margin-bottom: 1.25rem;">
        <div style="font-weight: 700; color: var(--primary); font-size: 0.88rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
          <span>🔍</span> Search Canal Network & Distributary Gates:
        </div>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <input type="text" id="map-lookup-input" class="form-input" style="max-width: 320px;" placeholder="Search village (Niphad, Sukene) or Gate (Gate-1)...">
          <button id="btn-map-lookup" class="btn btn-teal btn-sm">Search Network</button>
          <button id="btn-map-reset" class="btn btn-secondary btn-sm">Reset View</button>
        </div>
        <div id="lookup-result-box" style="margin-top: 0.75rem; font-size: 0.85rem; display: none;"></div>
      </div>

      <!-- GIS Layer Controls Strip -->
      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; background: white; padding: 0.65rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--surface-border); margin-bottom: 0.75rem; font-size: 0.82rem;">
        <span style="font-weight: 700; color: var(--primary);">GIS Layers:</span>
        <label style="display: flex; align-items: center; gap: 0.35rem; cursor: pointer;">
          <input type="checkbox" id="layer-chk-canal" checked> 🌊 Canal Network (GLBC)
        </label>
        <label style="display: flex; align-items: center; gap: 0.35rem; cursor: pointer;">
          <input type="checkbox" id="layer-chk-gates" checked> 🚪 Sluice Gates (1-6)
        </label>
        <label style="display: flex; align-items: center; gap: 0.35rem; cursor: pointer;">
          <input type="checkbox" id="layer-chk-farmers" checked> 👨‍🌾 Farmer Plots
        </label>
        <label style="display: flex; align-items: center; gap: 0.35rem; cursor: pointer;">
          <input type="checkbox" id="layer-chk-cadastral" checked> 📐 Cadastral Boundaries (Demo Geometry)
        </label>
        <label style="display: flex; align-items: center; gap: 0.35rem; cursor: pointer;">
          <input type="checkbox" id="layer-chk-disputes" checked> 🚨 Active Disputes
        </label>
      </div>

      <!-- Container 1: Leaflet GIS Map Container -->
      <div id="gis-map-view" style="margin-bottom: 1.5rem;">
        <div id="leaflet-canal-map" style="height: 480px; width: 100%; border-radius: var(--radius-lg); border: 1.5px solid var(--surface-border); box-shadow: var(--shadow-sm); z-index: 1;"></div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; font-size: 0.75rem; color: #64748b; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            🔵 <strong>Head Reach (KM 0-12)</strong> • 🟢 <strong>Middle Reach (KM 12-25)</strong> • 🟠 <strong>Tail Reach (KM 25-40)</strong> • ⚠️ <strong>Starvation Warning</strong>
          </div>
          <div>
            Map Data © OpenStreetMap contributors | Leaflet GIS Engine
          </div>
        </div>
      </div>

      <!-- Container 2: Hydraulic SVG Line Schematic (Fallback & Technical View) -->
      <div id="schematic-map-view" style="background: white; border: 1px solid var(--surface-border); border-radius: var(--radius-lg); padding: 1.5rem; overflow-x: auto; margin-bottom: 1.5rem; display: none;">
        <h4 style="color: var(--primary); margin-bottom: 1rem; text-align: center;">
          Godavari Left Bank Canal Hydraulic Line Diagram (40 km Chainage)
        </h4>

        <svg viewBox="0 0 1000 320" style="width: 100%; min-width: 800px; height: auto;">
          <defs>
            <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#0284c7" />
              <stop offset="60%" stop-color="#0d9488" />
              <stop offset="100%" stop-color="#f59e0b" />
            </linearGradient>
            <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.15" />
            </filter>
          </defs>

          <!-- Reservoir Headworks -->
          <rect x="20" y="90" width="130" height="120" rx="12" fill="#0369a1" filter="url(#shadow)" />
          <text x="85" y="130" fill="white" font-weight="800" font-size="14" text-anchor="middle">WAGHAD DAM</text>
          <text x="85" y="150" fill="#bae6fd" font-size="11" text-anchor="middle">142.5 Mcft</text>
          <text x="85" y="170" fill="#bae6fd" font-size="11" text-anchor="middle">74.2% Capacity</text>
          <text x="85" y="195" fill="#fef08a" font-weight="700" font-size="11" text-anchor="middle">115 cusecs Flow</text>

          <!-- Main Canal Spine -->
          <path d="M 150 150 L 920 150" stroke="url(#waterGrad)" stroke-width="14" stroke-linecap="round" />
          
          <polygon points="260,145 270,150 260,155" fill="white" />
          <polygon points="500,145 510,150 500,155" fill="white" />
          <polygon points="740,145 750,150 740,155" fill="white" />

          <!-- Reach Zone Labels -->
          <text x="240" y="65" fill="#0369a1" font-weight="700" font-size="12" text-anchor="middle">HEAD REACH (0-12 km)</text>
          <text x="520" y="65" fill="#0d9488" font-weight="700" font-size="12" text-anchor="middle">MIDDLE REACH (12-25 km)</text>
          <text x="800" y="65" fill="#b45309" font-weight="700" font-size="12" text-anchor="middle">TAIL REACH (25-40 km)</text>

          <!-- Gate 1 (Sukene) -->
          <line x1="220" y1="150" x2="220" y2="230" stroke="#0284c7" stroke-width="5" />
          <circle cx="220" cy="150" r="9" fill="#0284c7" stroke="white" stroke-width="3" />
          <rect x="165" y="230" width="110" height="65" rx="8" fill="#f0f9ff" stroke="#bae6fd" stroke-width="2" />
          <text x="220" y="250" fill="#0369a1" font-weight="700" font-size="12" text-anchor="middle">Gate-1: Sukene</text>
          <text x="220" y="267" fill="#64748b" font-size="10" text-anchor="middle">KM 4.5 • 28 cusecs</text>
          <text x="220" y="283" fill="#0284c7" font-weight="600" font-size="10" text-anchor="middle">Cotton (S. Shinde)</text>

          <!-- Gate 2 (Ozar) -->
          <line x1="320" y1="150" x2="320" y2="90" stroke="#0284c7" stroke-width="4" />
          <circle cx="320" cy="150" r="8" fill="#0284c7" stroke="white" stroke-width="2" />
          <rect x="270" y="25" width="100" height="55" rx="8" fill="#f0f9ff" stroke="#bae6fd" stroke-width="2" />
          <text x="320" y="45" fill="#0369a1" font-weight="700" font-size="11" text-anchor="middle">Gate-2: Ozar</text>
          <text x="320" y="62" fill="#64748b" font-size="10" text-anchor="middle">KM 9.2 • 24 cusecs</text>

          <!-- Gate 3 (Pimpalgaon A) -->
          <line x1="470" y1="150" x2="470" y2="230" stroke="#0d9488" stroke-width="5" />
          <circle cx="470" cy="150" r="9" fill="#0d9488" stroke="white" stroke-width="3" />
          <rect x="415" y="230" width="115" height="65" rx="8" fill="#f0fdfa" stroke="#99f6e4" stroke-width="2" />
          <text x="472" y="250" fill="#0f766e" font-weight="700" font-size="12" text-anchor="middle">Gate-3: Pimpalgaon A</text>
          <text x="472" y="267" fill="#64748b" font-size="10" text-anchor="middle">KM 16.8 • 20 cusecs</text>
          <text x="472" y="283" fill="#0d9488" font-weight="600" font-size="10" text-anchor="middle">Onion (S. Gaikwad)</text>

          <!-- Gate 4 (Pimpalgaon B) -->
          <line x1="590" y1="150" x2="590" y2="90" stroke="#f59e0b" stroke-width="4" />
          <circle cx="590" cy="150" r="8" fill="#f59e0b" stroke="white" stroke-width="2" />
          <rect x="535" y="25" width="120" height="58" rx="8" fill="#fffbeb" stroke="#fde68a" stroke-width="2" />
          <text x="595" y="43" fill="#b45309" font-weight="700" font-size="11" text-anchor="middle">Gate-4: Pimpalgaon B</text>
          <text x="595" y="58" fill="#64748b" font-size="10" text-anchor="middle">KM 22.4 • 18 cusecs</text>
          <text x="595" y="73" fill="#d97706" font-weight="600" font-size="9" text-anchor="middle">⚠️ Seepage Alert</text>

          <!-- Gate 5 (Niphad - Starvation Risk) -->
          <line x1="740" y1="150" x2="740" y2="230" stroke="#ef4444" stroke-width="5" />
          <circle cx="740" cy="150" r="10" fill="#ef4444" stroke="white" stroke-width="3" />
          <rect x="680" y="230" width="120" height="70" rx="8" fill="#fef2f2" stroke="#fca5a5" stroke-width="2" />
          <text x="740" y="250" fill="#991b1b" font-weight="700" font-size="12" text-anchor="middle">Gate-5: Niphad</text>
          <text x="740" y="267" fill="#64748b" font-size="10" text-anchor="middle">KM 31.0 • 12 cusecs</text>
          <text x="740" y="283" fill="#ef4444" font-weight="700" font-size="10" text-anchor="middle">⚠️ LOW PRESSURE (R. Patil)</text>

          <!-- Gate 6 (Chandori Tail) -->
          <line x1="880" y1="150" x2="880" y2="90" stroke="#f59e0b" stroke-width="4" />
          <circle cx="880" cy="150" r="8" fill="#f59e0b" stroke="white" stroke-width="2" />
          <rect x="830" y="25" width="100" height="55" rx="8" fill="#fffbeb" stroke="#fde68a" stroke-width="2" />
          <text x="880" y="45" fill="#b45309" font-weight="700" font-size="11" text-anchor="middle">Gate-6: Chandori</text>
          <text x="880" y="62" fill="#64748b" font-size="10" text-anchor="middle">KM 38.5 • 8 cusecs</text>
        </svg>
      </div>

      <!-- Selected Sluice Gate Information Cards Strip -->
      <div class="grid-3" style="gap: 1rem;">
        ${state.gates.map(gate => `
          <div style="border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1rem; background: var(--surface-alt); border-left: 4px solid ${gate.reach === 'Head' ? '#0284c7' : (gate.reach === 'Middle' ? '#0d9488' : '#f59e0b')};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <strong style="color: var(--primary); font-size: 0.95rem;">${gate.name}</strong>
              <span class="badge ${gate.anomaly ? 'badge-warning' : 'badge-success'}">${gate.id}</span>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.5;">
              <div>Reach: <strong>${gate.reach} Reach</strong> (KM ${gate.distance_km})</div>
              <div>Discharge Flow: <strong>${gate.flow_cusecs} cusecs</strong></div>
              <div>Status: <span style="font-weight: 600; color: ${gate.status === 'Open' ? '#059669' : '#dc2626'};">${gate.status}</span></div>
            </div>
            ${gate.anomaly ? `
              <div style="margin-top: 0.5rem; background: #fffbeb; border: 1px solid #fde68a; color: #b45309; padding: 0.35rem; border-radius: 4px; font-size: 0.75rem;">
                ⚠️ ${gate.anomaly_note || 'Hydraulic flow anomaly recorded'}
              </div>
            ` : ""}
          </div>
        `).join("")}
      </div>
    </div>
  `;

  // Toggle buttons
  const gisView = container.querySelector("#gis-map-view");
  const schView = container.querySelector("#schematic-map-view");
  const btnGis = container.querySelector("#btn-toggle-gis");
  const btnSch = container.querySelector("#btn-toggle-schematic");

  btnGis?.addEventListener("click", () => {
    gisView.style.display = "block";
    schView.style.display = "none";
    btnGis.className = "btn btn-teal btn-sm";
    btnSch.className = "btn btn-secondary btn-sm";
  });

  btnSch?.addEventListener("click", () => {
    gisView.style.display = "none";
    schView.style.display = "block";
    btnSch.className = "btn btn-teal btn-sm";
    btnGis.className = "btn btn-secondary btn-sm";
  });

  // Search Lookup logic
  const searchInput = container.querySelector("#map-lookup-input");
  const searchBtn = container.querySelector("#btn-map-lookup");
  const resetBtn = container.querySelector("#btn-map-reset");
  const resultBox = container.querySelector("#lookup-result-box");

  const runSearch = () => {
    const query = searchInput?.value?.trim().toLowerCase();
    if (!query) return;

    const matchedGate = state.gates.find(g => g.name.toLowerCase().includes(query) || g.id.toLowerCase().includes(query));
    const matchedFarmer = state.farmers.find(f => f.village.toLowerCase().includes(query) || f.name.toLowerCase().includes(query));

    if (resultBox) {
      resultBox.style.display = "block";
      if (matchedGate) {
        resultBox.innerHTML = `
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 0.65rem 1rem; border-radius: 6px; color: #065f46;">
            📍 <strong>Found Canal Gate:</strong> ${matchedGate.name} (${matchedGate.id}) • ${matchedGate.reach} Reach at KM ${matchedGate.distance_km}. Current flow: <strong>${matchedGate.flow_cusecs} cusecs</strong>.
          </div>
        `;
        if (window.leafletMapInstance && matchedGate.lat && matchedGate.lng) {
          window.leafletMapInstance.setView([matchedGate.lat, matchedGate.lng], 13);
        }
      } else if (matchedFarmer) {
        resultBox.innerHTML = `
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 0.65rem 1rem; border-radius: 6px; color: #065f46;">
            📍 <strong>Found Village / Farmer:</strong> ${matchedFarmer.name} in <strong>${matchedFarmer.village}</strong> (Gat No. ${matchedFarmer.gat_no}) • Connected to <strong>${matchedFarmer.gate_id}</strong> (${matchedFarmer.reach} Reach).
          </div>
        `;
        if (window.leafletMapInstance && matchedFarmer.lat && matchedFarmer.lng) {
          window.leafletMapInstance.setView([matchedFarmer.lat, matchedFarmer.lng], 13);
        }
      } else {
        resultBox.innerHTML = `
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 0.65rem 1rem; border-radius: 6px; color: #991b1b;">
            ⚠️ No exact gate or village match found for "${query}". Try "Niphad", "Sukene", or "Gate-5".
          </div>
        `;
      }
    }
  };

  searchBtn?.addEventListener("click", runSearch);
  searchInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") runSearch(); });
  resetBtn?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (resultBox) resultBox.style.display = "none";
    if (window.leafletMapInstance) {
      window.leafletMapInstance.setView([20.06, 74.05], 11);
    }
  });

  // Initialize Leaflet Map
  initLeafletCanalMap(state);
}

function initLeafletCanalMap(state) {
  const mapElement = document.getElementById("leaflet-canal-map");
  if (!mapElement) return;

  // Check if Leaflet is available
  if (typeof L === "undefined") {
    mapElement.innerHTML = `
      <div style="text-align: center; padding: 3rem 1.5rem; background: #f8fafc; color: #64748b;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🗺️</div>
        <div style="font-weight: 700; color: #1e293b; margin-bottom: 0.25rem;">GIS Leaflet Tile Offline Mode</div>
        <p style="font-size: 0.85rem; max-width: 440px; margin: 0 auto;">Leaflet tile connectivity is offline. Switch to the <strong>Hydraulic Schematic</strong> view above for full hydraulic telemetry.</p>
      </div>
    `;
    return;
  }

  // Clear existing map instance if any
  if (window.leafletMapInstance) {
    try { window.leafletMapInstance.remove(); } catch (e) {}
  }

  try {
    const map = L.map("leaflet-canal-map").setView([20.06, 74.05], 11);
    window.leafletMapInstance = map;

    // OpenStreetMap Tile Layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap contributors | JalMitra AI"
    }).addTo(map);

    // Feature Layer Groups
    const canalLayer = L.layerGroup().addTo(map);
    const gatesLayer = L.layerGroup().addTo(map);
    const farmersLayer = L.layerGroup().addTo(map);
    const cadastralLayer = L.layerGroup().addTo(map);
    const disputesLayer = L.layerGroup().addTo(map);

    // Canal Polyline Coordinates (GLBC 40 km Course)
    const canalCoordinates = [
      [20.005, 73.880], // Waghad Dam Reservoir Headworks
      [20.021, 73.915], // Gate 1 (Sukene)
      [20.038, 73.948], // Gate 2 (Ozar)
      [20.054, 73.988], // Gate 3 (Pimpalgaon A)
      [20.068, 74.045], // Gate 4 (Pimpalgaon B)
      [20.082, 74.112], // Gate 5 (Niphad Distributary)
      [20.096, 74.185]  // Gate 6 (Chandori Tail End)
    ];

    // Draw Blue Canal Polyline
    const canalLine = L.polyline(canalCoordinates, {
      color: "#0284c7",
      weight: 6,
      opacity: 0.85,
      dashArray: "1, 2"
    }).addTo(canalLayer);
    canalLine.bindPopup("<strong>Godavari Left Bank Canal (GLBC)</strong><br>Length: 40.0 km • Head Discharge: 115 cusecs");

    // Headworks Marker: Waghad Dam
    const damMarker = L.circleMarker([20.005, 73.880], {
      radius: 12,
      fillColor: "#0369a1",
      color: "#ffffff",
      weight: 3,
      opacity: 1,
      fillOpacity: 0.95
    }).addTo(canalLayer);
    damMarker.bindPopup("<strong>🏛️ Waghad / Gangapur Reservoir Complex</strong><br>Live Storage: 142.5 Mcft (74.2%)<br>Canal Head Discharge: 115 cusecs");

    // Sluice Gate Markers (Gate 1 to 6)
    state.gates.forEach(g => {
      if (g.lat && g.lng) {
        const isTail = g.reach === "Tail";
        const isMiddle = g.reach === "Middle";
        const color = isTail ? (g.anomaly ? "#ef4444" : "#f59e0b") : (isMiddle ? "#0d9488" : "#0284c7");

        const gateMarker = L.circleMarker([g.lat, g.lng], {
          radius: g.anomaly ? 10 : 8,
          fillColor: color,
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(gatesLayer);

        gateMarker.bindPopup(`
          <strong>${g.name} (${g.id})</strong><br>
          Reach: <strong>${g.reach} Reach</strong> (KM ${g.distance_km})<br>
          Discharge: <strong>${g.flow_cusecs} cusecs</strong><br>
          Status: <strong>${g.status}</strong><br>
          ${g.anomaly ? `<span style="color:#dc2626;">⚠️ ${g.anomaly_note}</span>` : ""}
        `);
      }
    });

    // Farmer Plot Markers
    state.farmers.forEach(f => {
      if (f.lat && f.lng) {
        const fMarker = L.marker([f.lat, f.lng]).addTo(farmersLayer);
        fMarker.bindPopup(`
          <strong>👨‍🌾 ${f.name}</strong> (${f.id})<br>
          Village: <strong>${f.village}</strong> (Gat ${f.gat_no})<br>
          Crop: <strong>${f.crop} (${f.farm_area_acres} Acres)</strong><br>
          Gate: <strong>${f.gate_id}</strong> (${f.reach} Reach)<br>
          Received this cycle: <strong>${f.current_cycle_received} m³</strong>
        `);
      }
    });

    // Simulated Cadastral Boundaries (Gat 142/2A Niphad & Gat 58/1 Sukene)
    const niphadCadastre = [
      [20.081, 74.113],
      [20.085, 74.113],
      [20.085, 74.117],
      [20.081, 74.117]
    ];
    L.polygon(niphadCadastre, {
      color: "#059669",
      weight: 2,
      dashArray: "4, 4",
      fillColor: "#10b981",
      fillOpacity: 0.2
    }).bindPopup("<strong>Cadastral Parcel: Gat 142/2A</strong><br>Village: Niphad<br>Owner: Ramesh Patil (4.0 Acres)<br><em>Simulated Cadastral Demonstration Geometry</em>").addTo(cadastralLayer);

    const sukeneCadastre = [
      [20.021, 73.916],
      [20.025, 73.916],
      [20.025, 73.920],
      [20.021, 73.920]
    ];
    L.polygon(sukeneCadastre, {
      color: "#0284c7",
      weight: 2,
      dashArray: "4, 4",
      fillColor: "#38bdf8",
      fillOpacity: 0.2
    }).bindPopup("<strong>Cadastral Parcel: Gat 58/1</strong><br>Village: Sukene<br>Owner: Suresh Shinde (5.0 Acres)<br><em>Simulated Cadastral Demonstration Geometry</em>").addTo(cadastralLayer);

    // Active Dispute Marker (Gate 5 Tail Starvation)
    const dispMarker = L.circleMarker([20.082, 74.112], {
      radius: 14,
      fillColor: "#ef4444",
      color: "#ffffff",
      weight: 3,
      opacity: 1,
      fillOpacity: 0.75
    }).addTo(disputesLayer);
    dispMarker.bindPopup("<strong>🚨 Active Mediation Case: DISP-2026-001</strong><br>Category: Unequal Water Distribution<br>Conflict: Suresh Shinde (Gate 1) vs Ramesh Patil (Gate 5)<br>Status: Awaiting Official Ratification");

    // Connect Layer Checkboxes
    document.getElementById("layer-chk-canal")?.addEventListener("change", (e) => {
      if (e.target.checked) map.addLayer(canalLayer); else map.removeLayer(canalLayer);
    });
    document.getElementById("layer-chk-gates")?.addEventListener("change", (e) => {
      if (e.target.checked) map.addLayer(gatesLayer); else map.removeLayer(gatesLayer);
    });
    document.getElementById("layer-chk-farmers")?.addEventListener("change", (e) => {
      if (e.target.checked) map.addLayer(farmersLayer); else map.removeLayer(farmersLayer);
    });
    document.getElementById("layer-chk-cadastral")?.addEventListener("change", (e) => {
      if (e.target.checked) map.addLayer(cadastralLayer); else map.removeLayer(cadastralLayer);
    });
    document.getElementById("layer-chk-disputes")?.addEventListener("change", (e) => {
      if (e.target.checked) map.addLayer(disputesLayer); else map.removeLayer(disputesLayer);
    });

  } catch (err) {
    console.warn("Leaflet initialization fallback:", err);
  }
}
