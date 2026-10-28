/**
 * JalMitra AI - Comprehensive Farmer Experience Portal
 * Implements:
 * - Module 3: Farmer Dashboard — Water History (Requested vs Allocated vs Received, Durations, Filters, Charts)
 * - Module 4: Current Water Requirement Form (Pre-populated, Litres/m3, Preferred Date, Soil Moisture, Proof Upload)
 * - Module 5: Water History and Current Demand Analysis (Dynamic comparison, +25% delta indicators, Penman-Monteith)
 * - Session Isolation, Grievance Form, Voice Transcript, Warabandi Schedule & Dispute Mediation.
 */

import { store } from "../store.js";
import { t } from "../i18n.js";
import { estimateCropWaterRequirement, analyzeDemandVsHistory } from "../allocation.js";
import { evaluateEightRules, evaluateThirteenPoints } from "../rules.js";

export function renderFarmerPortal(container) {
  const state = store.getState();
  
  // If user is authenticated as farmer, isolate to their profile
  let activeId = state.activeFarmerId;
  if (state.currentUser && state.currentUser.role === "farmer") {
    activeId = state.currentUser.id;
  }
  const farmer = state.farmers.find(f => f.id === activeId) || state.farmers[0];
  const activeSubTab = state.activeFarmerSubTab || "dashboard";

  container.innerHTML = `
    <!-- Top Farmer Agricultural Profile Header -->
    <div class="card" style="background: linear-gradient(135deg, #072317 0%, #0d3826 40%, #16532d 100%); color: white; padding: 1.5rem 1.75rem; margin-bottom: 1.25rem; border: 1px solid rgba(255,255,255,0.12); box-shadow: var(--shadow-md);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 1.25rem;">
          <div style="width: 58px; height: 58px; background: #0d9488; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.85rem; font-weight: 700; border: 3px solid #5eead4; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
            👨‍🌾
          </div>
          <div>
            <div style="font-size: 1.45rem; font-weight: 800; display: flex; align-items: center; gap: 0.6rem; letter-spacing: -0.01em;">
              ${farmer.name}
              <span class="badge" style="background: rgba(255, 255, 255, 0.22); color: white; font-size: 0.78rem; font-weight: 700; border: 1px solid rgba(255,255,255,0.3);">
                ${farmer.id}
              </span>
              <span class="badge" style="background: #10b981; color: white; font-size: 0.72rem;">
                Active Farmer
              </span>
            </div>
            <div style="font-size: 0.88rem; color: #a7f3d0; margin-top: 0.2rem;">
              📍 Village: <strong>${farmer.village}</strong> (Gat No. <strong>${farmer.gat_no}</strong>) • Assigned Canal Gate: <strong>${farmer.gate_id}</strong> (${farmer.reach} Reach, ${farmer.distance_km} km)
            </div>
            <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 0.2rem;">
              🌱 Cultivating: <strong>${farmer.farm_area_acres} Acres</strong> of <strong>${farmer.crop}</strong> (${farmer.growth_stage}) • Irrigation: <strong>${farmer.irrigation_method}</strong>
            </div>
          </div>
        </div>

        <!-- Quick Primary Action Buttons & Session Controls -->
        <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
          <button id="btn-header-request-water" class="btn btn-teal" style="font-weight: 700; padding: 0.55rem 1.1rem; box-shadow: 0 4px 12px rgba(13,148,136,0.4);">
            ➕ Request Water
          </button>
          <button id="btn-header-view-history" class="btn btn-secondary" style="background: rgba(255,255,255,0.15); color: white; border-color: rgba(255,255,255,0.25); font-weight: 600;">
            💧 Water History
          </button>
          
          ${!state.currentUser ? `
            <div style="display: flex; align-items: center; gap: 0.4rem; background: rgba(0,0,0,0.25); padding: 0.2rem 0.5rem; border-radius: var(--radius-sm);">
              <span style="font-size: 0.75rem; color: #cbd5e1;">Demo Farmer:</span>
              <select id="farmer-demo-select" class="form-select" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.78rem; background: white; color: var(--primary); font-weight: 600;">
                ${state.farmers.map(f => `
                  <option value="${f.id}" ${f.id === farmer.id ? "selected" : ""}>
                    ${f.name} (${f.village} - ${f.crop})
                  </option>
                `).join("")}
              </select>
            </div>
          ` : `
            <button id="btn-farmer-logout" class="btn btn-secondary btn-sm" style="background: rgba(239,68,68,0.25); color: #fca5a5; border-color: rgba(239,68,68,0.4);">
              🚪 Sign Out
            </button>
          `}
        </div>
      </div>
    </div>

    <!-- Farmer Portal Sub-Navigation Tabs -->
    <div style="display: flex; gap: 0.4rem; overflow-x: auto; margin-bottom: 1.25rem; padding-bottom: 0.35rem; scrollbar-width: thin;">
      <button class="btn ${activeSubTab === "dashboard" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="dashboard">📊 Dashboard</button>
      <button class="btn ${activeSubTab === "water_history" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="water_history">💧 Water History</button>
      <button class="btn ${activeSubTab === "request_water" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="request_water">➕ Request Water</button>
      <button class="btn ${activeSubTab === "demand_analysis" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="demand_analysis">📈 Demand Analysis</button>
      <button class="btn ${activeSubTab === "my_farm" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="my_farm">🏡 My Farm</button>
      <button class="btn ${activeSubTab === "ledger" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="ledger">🌊 Canal Ledger</button>
      <button class="btn ${activeSubTab === "calculator" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="calculator">🧮 AI Crop Calculator</button>
      <button class="btn ${activeSubTab === "my_requests" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="my_requests">📋 My Requests</button>
      <button class="btn ${activeSubTab === "complaint" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="complaint">⚠️ Grievance Form</button>
      <button class="btn ${activeSubTab === "voice" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="voice">🎙️ Voice Grievance</button>
      <button class="btn ${activeSubTab === "my_complaints" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="my_complaints">📑 My Grievances</button>
      <button class="btn ${activeSubTab === "disputes" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="disputes">⚖️ Dispute & Appeal</button>
      <button class="btn ${activeSubTab === "notifications" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="notifications">🔔 Notifications</button>
    </div>

    <!-- Sub-tab Content Area -->
    <div id="farmer-subtab-content" class="animate-fadeIn"></div>
  `;

  // Attach Top Header Action Buttons
  container.querySelector("#btn-header-request-water")?.addEventListener("click", () => {
    state.activeFarmerSubTab = "request_water";
    renderFarmerPortal(container);
  });

  container.querySelector("#btn-header-view-history")?.addEventListener("click", () => {
    state.activeFarmerSubTab = "water_history";
    renderFarmerPortal(container);
  });

  container.querySelector("#btn-farmer-logout")?.addEventListener("click", () => {
    store.logout();
    window.showToast("Signed out successfully.", "info");
  });

  // Attach tab switcher
  container.querySelectorAll(".sub-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.activeFarmerSubTab = btn.getAttribute("data-tab");
      renderFarmerPortal(container);
    });
  });

  // Attach demo farmer switcher (if public demo mode)
  container.querySelector("#farmer-demo-select")?.addEventListener("change", (e) => {
    store.setFarmer(e.target.value);
  });

  const contentArea = container.querySelector("#farmer-subtab-content");
  renderFarmerSection(contentArea, activeSubTab, farmer, state, container);
}

function renderFarmerSection(contentArea, tab, farmer, state, mainContainer) {
  // Session isolation: filter private records for this farmer
  const farmerRequests = state.requests.filter(r => r.farmer_id === farmer.id);
  const farmerComplaints = state.complaints.filter(c => c.farmer_id === farmer.id);
  const farmerNotifs = state.notifications.filter(n => n.target === farmer.id || n.target === "ALL");
  const farmerHistory = (state.water_history || []).filter(h => h.farmer_id === farmer.id);
  const latestReq = farmerRequests[0];

  // =========================================================================
  // SECTION A: DASHBOARD OVERVIEW
  // =========================================================================
  if (tab === "dashboard") {
    // Calculate cumulative water metrics from history
    const totalDeliveredM3 = farmerHistory.reduce((sum, h) => sum + parseFloat(h.received_qty_m3 || 0), 0);
    const totalDeliveredLitres = totalDeliveredM3 * 1000.0;
    const totalRequestedM3 = farmerHistory.reduce((sum, h) => sum + parseFloat(h.requested_qty_m3 || 0), 0);
    const totalAllocatedM3 = farmerHistory.reduce((sum, h) => sum + parseFloat(h.allocated_qty_m3 || 0), 0);

    contentArea.innerHTML = `
      <div class="grid-4" style="margin-bottom: 1.25rem;">
        <div class="stat-box" style="border-top: 3px solid #0d9488;">
          <div class="stat-label">Farm Acreage & Crop</div>
          <div class="stat-value" style="font-size: 1.35rem; color: #0d9488;">${farmer.farm_area_acres} Acres</div>
          <div class="stat-sub">${farmer.crop} (${farmer.growth_stage})</div>
        </div>
        <div class="stat-box" style="border-top: 3px solid #0284c7;">
          <div class="stat-label">Next Scheduled Warabandi Turn</div>
          <div class="stat-value" style="font-size: 1.15rem; color: #0284c7;">${farmer.turn_schedule.split(" ")[0]}</div>
          <div class="stat-sub">${farmer.turn_schedule}</div>
        </div>
        <div class="stat-box" style="border-top: 3px solid #10b981;">
          <div class="stat-label">Actual Water Received</div>
          <div class="stat-value" style="font-size: 1.35rem; color: #10b981;">
            ${farmer.current_cycle_received} m³
          </div>
          <div class="stat-sub">${(farmer.current_cycle_received * 1000).toLocaleString()} Litres this cycle</div>
        </div>
        <div class="stat-box" style="border-top: 3px solid ${farmerComplaints.length > 0 ? '#ef4444' : '#64748b'};">
          <div class="stat-label">Active Grievances</div>
          <div class="stat-value" style="font-size: 1.35rem; color: ${farmerComplaints.length > 0 ? '#ef4444' : '#10b981'};">
            ${farmerComplaints.length}
          </div>
          <div class="stat-sub">${farmerComplaints.length > 0 ? 'Under SLA Investigation' : 'No Open Grievances'}</div>
        </div>
      </div>

      <!-- Quick Action Prompt Banner -->
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #a7f3d0; border-radius: var(--radius-md); padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="font-weight: 800; color: #065f46; font-size: 1.05rem;">
            🌾 Need Water for Your Next Irrigation Cycle?
          </div>
          <div style="font-size: 0.85rem; color: #047857; margin-top: 0.25rem;">
            Submit your crop requirement to receive transparent 8-rule compliance budgeting and verified Warabandi scheduling.
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button id="btn-dash-request-now" class="btn btn-teal btn-sm" style="font-weight: 700;">
            ➕ Submit New Requirement
          </button>
          <button id="btn-dash-view-analysis" class="btn btn-secondary btn-sm" style="background: white; border-color: #a7f3d0; color: #065f46;">
            📈 View Demand Analysis
          </button>
        </div>
      </div>

      <div class="grid-2">
        <!-- Active Request Status Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><span>📋</span> Current Irrigation Request Status</div>
            ${latestReq ? `<span class="badge ${getStatusBadge(latestReq.status)}">${latestReq.status}</span>` : ""}
          </div>
          ${latestReq ? `
            <div style="font-size: 0.88rem; line-height: 1.6;">
              <p><strong>Request ID:</strong> ${latestReq.id} (Submitted: ${latestReq.date.split("T")[0]})</p>
              <p><strong>Requested Volume:</strong> <strong>${latestReq.requested_quantity} m³</strong> (${(latestReq.requested_quantity * 1000).toLocaleString()} Litres)</p>
              <p><strong>Proposed AI Allocation:</strong> <span style="font-weight: 700; color: #0d9488;">${latestReq.proposed_quantity || 'Calculating...'} m³</span></p>
              <p><strong>Approved Volume:</strong> ${latestReq.approved_quantity !== null ? `<span style="font-weight: 700; color: #16532d;">${latestReq.approved_quantity} m³</span>` : '<span style="color: #64748b;">Pending Authority Sign-off</span>'}</p>
              <div style="background: var(--surface-alt); padding: 0.75rem; border-radius: var(--radius-sm); margin-top: 0.75rem; border: 1px solid var(--surface-border);">
                <strong>Officer Remarks:</strong> ${latestReq.officer_comment || 'Under agronomic review.'}
              </div>
            </div>
          ` : `
            <p style="color: var(--text-muted); font-size: 0.85rem;">No active water request submitted for current rotation.</p>
          `}
        </div>

        <!-- Assigned Sluice Gate Telemetry -->
        <div class="card">
          <div class="card-header">
            <div class="card-title"><span>🌊</span> Assigned Canal Gate Telemetry</div>
            <span class="badge ${farmer.gate_id === 'Gate-5' ? 'badge-warning' : 'badge-success'}">${farmer.gate_id} (${farmer.reach} Reach)</span>
          </div>
          <div style="font-size: 0.88rem; line-height: 1.6;">
            <p><strong>Canal Reach:</strong> ${farmer.reach} Reach (${farmer.distance_km} km from headworks)</p>
            <p><strong>Current Measured Flow:</strong> <span style="font-weight: 700; color: ${farmer.gate_id === 'Gate-5' ? '#dc2626' : '#059669'};">${farmer.gate_id === 'Gate-5' ? '12.0 cusecs (Restricted Flow)' : '28.0 cusecs (Normal)'}</span></p>
            <p><strong>Operating Duty:</strong> ${farmer.gate_id === 'Gate-5' ? '65% of scheduled pressure' : '98% of scheduled pressure'}</p>
            <div style="background: ${farmer.gate_id === 'Gate-5' ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${farmer.gate_id === 'Gate-5' ? '#fecaca' : '#bbf7d0'}; color: ${farmer.gate_id === 'Gate-5' ? '#991b1b' : '#166534'}; padding: 0.75rem; border-radius: var(--radius-sm); margin-top: 0.75rem; font-size: 0.82rem;">
              ${farmer.gate_id === 'Gate-5' ? '⚠️ <strong>Tail Reach Alert:</strong> Gate 5 pressure drop detected. Algorithmic mediation is compensating with rotational rationing priority.' : '✅ <strong>Head Reach Normal:</strong> Hydraulic pressure operating within target parameters.'}
            </div>
          </div>
        </div>
      </div>
    `;

    contentArea.querySelector("#btn-dash-request-now")?.addEventListener("click", () => {
      state.activeFarmerSubTab = "request_water";
      renderFarmerPortal(mainContainer);
    });

    contentArea.querySelector("#btn-dash-view-analysis")?.addEventListener("click", () => {
      state.activeFarmerSubTab = "demand_analysis";
      renderFarmerPortal(mainContainer);
    });
  }

  // =========================================================================
  // SECTION B: MODULE 3 — FARMER DASHBOARD WATER HISTORY
  // =========================================================================
  else if (tab === "water_history") {
    renderWaterHistorySubtab(contentArea, farmer, farmerHistory, mainContainer);
  }

  // =========================================================================
  // SECTION C: MODULE 4 — CURRENT WATER REQUIREMENT FORM
  // =========================================================================
  else if (tab === "request_water") {
    renderWaterRequirementForm(contentArea, farmer, state, mainContainer);
  }

  // =========================================================================
  // SECTION D: MODULE 5 — WATER HISTORY AND DEMAND ANALYSIS
  // =========================================================================
  else if (tab === "demand_analysis") {
    renderDemandAnalysisSubtab(contentArea, farmer, farmerHistory, farmerRequests, state);
  }

  // =========================================================================
  // SECTION E: MY FARM PROFILE (Module 4 Crop & Parcel Registration)
  // =========================================================================
  else if (tab === "my_farm") {
    contentArea.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><span>🏡</span> Farm Profile & Agricultural Registration (Module 4)</div>
          <div class="card-subtitle">Registered agricultural land details for ${farmer.name} (${farmer.id})</div>
        </div>
        <form id="farm-edit-form">
          <div class="grid-3">
            <div class="form-group">
              <label class="form-label">Farmer Full Name</label>
              <input type="text" class="form-input" id="edit-farmer-name" value="${farmer.name}">
            </div>
            <div class="form-group">
              <label class="form-label">Village</label>
              <input type="text" class="form-input" id="edit-farmer-village" value="${farmer.village}">
            </div>
            <div class="form-group">
              <label class="form-label">Plot / Gat / Survey Number</label>
              <input type="text" class="form-input" id="edit-farmer-gat" value="${farmer.gat_no}">
            </div>
            <div class="form-group">
              <label class="form-label">Total Land Area (Acres)</label>
              <input type="number" step="0.1" class="form-input" id="edit-farmer-area" value="${farmer.farm_area_acres}">
            </div>
            <div class="form-group">
              <label class="form-label">Primary Crop</label>
              <select class="form-select" id="edit-farmer-crop">
                <option value="Sugarcane" ${farmer.crop === "Sugarcane" ? "selected" : ""}>Sugarcane (ऊस)</option>
                <option value="Cotton" ${farmer.crop === "Cotton" ? "selected" : ""}>Cotton (कापूस)</option>
                <option value="Soybean" ${farmer.crop === "Soybean" ? "selected" : ""}>Soybean (सोयाबीन)</option>
                <option value="Onion" ${farmer.crop === "Onion" ? "selected" : ""}>Onion (कांदा)</option>
                <option value="Wheat" ${farmer.crop === "Wheat" ? "selected" : ""}>Wheat (गहू)</option>
                <option value="Grapes" ${farmer.crop === "Grapes" ? "selected" : ""}>Grapes (द्राक्ष)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Growth Stage</label>
              <input type="text" class="form-input" id="edit-farmer-stage" value="${farmer.growth_stage}">
            </div>
            <div class="form-group">
              <label class="form-label">Soil Type</label>
              <select class="form-select" id="edit-farmer-soil">
                <option value="Black Cotton" ${farmer.soil_type === "Black Cotton" ? "selected" : ""}>Black Cotton (काळी माती)</option>
                <option value="Loamy" ${farmer.soil_type === "Loamy" ? "selected" : ""}>Loamy (गाळाची माती)</option>
                <option value="Sandy Loam" ${farmer.soil_type === "Sandy Loam" ? "selected" : ""}>Sandy Loam (वालुकामय)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Irrigation Method</label>
              <select class="form-select" id="edit-farmer-method">
                <option value="Furrow" ${farmer.irrigation_method === "Furrow" ? "selected" : ""}>Furrow (सरी वरंबा)</option>
                <option value="Drip" ${farmer.irrigation_method === "Drip" ? "selected" : ""}>Drip (ठिबक)</option>
                <option value="Sprinkler" ${farmer.irrigation_method === "Sprinkler" ? "selected" : ""}>Sprinkler (तुषार)</option>
                <option value="Flood" ${farmer.irrigation_method === "Flood" ? "selected" : ""}>Flood (मोकाट)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Assigned Canal Sluice Gate</label>
              <input type="text" class="form-input" id="edit-farmer-gate" value="${farmer.gate_id}" readonly style="background: #f1f5f9;">
            </div>
          </div>
          <button type="submit" class="btn btn-teal">💾 Save Farm Parameters</button>
        </form>
      </div>
    `;

    contentArea.querySelector("#farm-edit-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      farmer.name = contentArea.querySelector("#edit-farmer-name").value;
      farmer.village = contentArea.querySelector("#edit-farmer-village").value;
      farmer.gat_no = contentArea.querySelector("#edit-farmer-gat").value;
      farmer.farm_area_acres = parseFloat(contentArea.querySelector("#edit-farmer-area").value);
      farmer.crop = contentArea.querySelector("#edit-farmer-crop").value;
      farmer.growth_stage = contentArea.querySelector("#edit-farmer-stage").value;
      farmer.soil_type = contentArea.querySelector("#edit-farmer-soil").value;
      farmer.irrigation_method = contentArea.querySelector("#edit-farmer-method").value;
      store.notify();
      window.showToast("Farm details updated successfully!", "success");
    });
  }

  // =========================================================================
  // SECTION F: VOLUMETRIC CANAL LEDGER
  // =========================================================================
  else if (tab === "ledger") {
    const res = state.reservoir;
    contentArea.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><span>🌊</span> Volumetric Water Ledger & Cycle Balances</div>
          <div class="card-subtitle">Rotation Cycle #4: ${res.cycle_dates}</div>
        </div>
        <div class="grid-4" style="margin-bottom: 1.5rem;">
          <div class="stat-box">
            <div class="stat-label">Reservoir Storage</div>
            <div class="stat-value">${res.current_storage_mcft} Mcft</div>
            <div class="stat-sub">${res.live_capacity_pct}% of live capacity</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Canal Head Discharge</div>
            <div class="stat-value">${res.current_head_flow_cusecs} cusecs</div>
            <div class="stat-sub">Design: ${res.design_discharge_cusecs} cusecs</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Transit Loss (12%)</div>
            <div class="stat-value" style="color: #f59e0b;">${(res.total_cycle_supply_thousand_m3 * 0.12).toFixed(1)} T-m3</div>
            <div class="stat-sub">Estimated conveyance loss</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Emergency Reserve (15%)</div>
            <div class="stat-value" style="color: #0284c7;">${(res.total_cycle_supply_thousand_m3 * 0.15).toFixed(1)} T-m3</div>
            <div class="stat-sub">Protected drinking water quota</div>
          </div>
        </div>

        <div style="background: var(--surface-alt); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--surface-border); margin-bottom: 1rem;">
          <h4 style="color: var(--primary); margin-bottom: 0.5rem;">Farmer Personal Entitlement & Quota</h4>
          <div class="grid-3" style="font-size: 0.85rem;">
            <div><strong>Baseline Seasonal Quota:</strong> ${(farmer.farm_area_acres * 12).toFixed(1)} m³</div>
            <div><strong>Delivered this Cycle:</strong> ${farmer.current_cycle_received} m³</div>
            <div><strong>Remaining Entitlement:</strong> ${((farmer.farm_area_acres * 12) - farmer.current_cycle_received).toFixed(1)} m³</div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // SECTION G: AI CROP WATER CALCULATOR
  // =========================================================================
  else if (tab === "calculator") {
    renderCropWaterCalculator(contentArea, farmer);
  }

  // =========================================================================
  // SECTION H: MY REQUESTS TABLE
  // =========================================================================
  else if (tab === "my_requests") {
    contentArea.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><span>📋</span> My Water Requests History</div>
          <div class="card-subtitle">Showing all water requests for ${farmer.name} (${farmer.id})</div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Submission Date</th>
                <th>Crop & Stage</th>
                <th>Requested Qty</th>
                <th>Proposed Qty</th>
                <th>Approved Qty</th>
                <th>Status</th>
                <th>Official Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${farmerRequests.length > 0 ? farmerRequests.map(r => `
                <tr>
                  <td><strong>${r.id}</strong></td>
                  <td>${r.date.split("T")[0]}</td>
                  <td>${r.crop} (${r.growth_stage})</td>
                  <td><strong>${r.requested_quantity} m³</strong><br><span style="font-size: 0.72rem; color: #64748b;">${(r.requested_quantity * 1000).toLocaleString()} L</span></td>
                  <td>${r.proposed_quantity || "-"} m³</td>
                  <td><strong>${r.approved_quantity !== null && r.approved_quantity !== undefined ? r.approved_quantity + " m³" : "<span style='color:#f59e0b;'>Pending Review</span>"}</strong></td>
                  <td><span class="badge ${getStatusBadge(r.status)}">${r.status}</span></td>
                  <td style="font-size: 0.8rem; color: var(--text-muted);">${r.officer_comment || 'Under evaluation.'}</td>
                </tr>
              `).join("") : `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No water requests submitted yet. Click "Request Water" to create one.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // SECTION I: GRIEVANCE FORM
  // =========================================================================
  else if (tab === "complaint") {
    renderGrievanceForm(contentArea, farmer, state, mainContainer);
  }

  // =========================================================================
  // SECTION J: VOICE GRIEVANCE
  // =========================================================================
  else if (tab === "voice") {
    renderVoiceGrievance(contentArea, farmer, state, mainContainer);
  }

  // =========================================================================
  // SECTION K: MY GRIEVANCES RESOLUTION TRACKING
  // =========================================================================
  else if (tab === "my_complaints") {
    contentArea.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><span>📑</span> Registered Grievances & Resolution Tracking</div>
          <div class="card-subtitle">Showing all complaints for ${farmer.name}</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${farmerComplaints.length > 0 ? farmerComplaints.map(c => `
            <div style="border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1.25rem; background: var(--surface-alt); border-left: 4px solid #ef4444;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <strong style="font-size: 1.05rem; color: var(--primary);">${c.id}: ${c.category}</strong>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">
                    Logged: ${c.date.split("T")[0]} • Gate: ${c.gate_id} • Assigned Officer: ${c.assigned_officer}
                  </div>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                  <span class="badge ${getStatusBadge(c.status)}">${c.status}</span>
                  <span class="badge badge-warning">SLA: ${c.elapsed_hours}h / ${c.sla_target_hours}h</span>
                </div>
              </div>
              <p style="font-size: 0.88rem; margin-bottom: 0.75rem; color: var(--text-main);">${c.description}</p>
              <div style="background: white; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); padding: 0.75rem; font-size: 0.82rem; line-height: 1.6;">
                <div><strong>AI Suspected Cause:</strong> ${c.suspected_cause}</div>
                <div><strong>Investigation Notes:</strong> ${c.investigation_notes}</div>
              </div>
            </div>
          `).join("") : `<p style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">No active complaints registered.</p>`}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // SECTION L: DISPUTE & MEDIATION ROOM (Module 8 & 13)
  // =========================================================================
  else if (tab === "disputes") {
    const activeDisputes = state.disputes || [];
    const myDisputes = activeDisputes.filter(d => d.farmer_a_id === farmer.id || d.farmer_b_id === farmer.id || d.farmer_a_name === farmer.name || d.farmer_b_name === farmer.name);
    const displayDisputes = myDisputes.length > 0 ? myDisputes : activeDisputes;

    contentArea.innerHTML = `
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <div class="card-title"><span>⚖️</span> Agricultural Water-Sharing Dispute Mediation (Module 8 & 13)</div>
            <div class="card-subtitle">AI-assisted dispute mediation room • Transparent multi-party compromise formulation</div>
          </div>
          <button id="btn-goto-full-mediation" class="btn btn-teal btn-sm" style="font-weight: 700;">
            🤝 Enter Digital Mediation Room →
          </button>
        </div>

        <!-- Mediation Workflow Stage Tracker Banner -->
        <div style="background: var(--surface-alt); border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1rem 1.25rem; margin-bottom: 1.5rem;">
          <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--primary); font-weight: 800; margin-bottom: 0.5rem;">
            11-Step Mediation Workflow Status:
          </div>
          <div style="display: flex; gap: 0.4rem; overflow-x: auto; padding-bottom: 0.25rem; font-size: 0.75rem;">
            <span class="badge badge-success">1. Intake Received</span>
            <span class="badge badge-success">2. Records Retrieved</span>
            <span class="badge badge-success">3. Conflict Isolated</span>
            <span class="badge badge-success">4. 8-Rule Validated</span>
            <span class="badge badge-success">5. Neutral Analysis</span>
            <span class="badge badge-info">6. Compromise Proposals</span>
            <span class="badge badge-warning">7. Party Review</span>
            <span class="badge badge-neutral">8. Recalculation</span>
            <span class="badge badge-neutral">9. Official Ratification</span>
            <span class="badge badge-neutral">10. Warabandi Published</span>
            <span class="badge badge-neutral">11. SHA-256 Sealed</span>
          </div>
        </div>

        <!-- Active Disputes List -->
        <h4 style="color: var(--primary); margin-bottom: 1rem; font-size: 1.1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>📋</span> Active Dispute Cases (${displayDisputes.length})
        </h4>

        <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem;">
          ${displayDisputes.map(disp => `
            <div style="border: 2px solid ${disp.status === 'Resolved' ? '#86efac' : '#99f6e4'}; border-radius: var(--radius-lg); padding: 1.5rem; background: white; box-shadow: var(--shadow-sm);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <span class="badge" style="background: #0f172a; color: white; font-family: monospace; font-size: 0.8rem;">${disp.id}</span>
                    <h3 style="margin: 0; font-size: 1.15rem; color: var(--primary);">${disp.title}</h3>
                  </div>
                  <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.35rem;">
                    Category: <strong>${disp.category}</strong> • Severity: <strong>${disp.severity}</strong> • Assigned Officer: <strong>${disp.assigned_officer}</strong>
                  </div>
                </div>

                <div style="text-align: right;">
                  <span class="badge ${getStatusBadge(disp.status)}" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">
                    ${disp.status}
                  </span>
                  <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.3rem;">
                    Ratification: <strong>${disp.ratification_status || 'Pending'}</strong>
                  </div>
                </div>
              </div>

              <!-- Two Farmers Claims Comparison -->
              <div class="grid-2" style="gap: 1rem; margin-bottom: 1.25rem;">
                <div style="background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: var(--radius-md); padding: 1rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                    <strong style="color: #1e40af; font-size: 0.95rem;">👨‍🌾 Head Reach: ${disp.farmer_a_name}</strong>
                    <span class="badge badge-info">${disp.farmer_a_gate}</span>
                  </div>
                  <div style="font-size: 0.83rem; color: #1e3a8a; line-height: 1.55;">
                    <div>Crop: <strong>${disp.farmer_a_crop}</strong> • Demanded: <strong>${disp.farmer_a_requested} m³</strong></div>
                    <div style="margin-top: 0.4rem; font-style: italic; background: white; padding: 0.5rem; border-radius: 4px; border: 1px solid #dbeafe;">
                      "${disp.farmer_a_claim}"
                    </div>
                    <div style="margin-top: 0.4rem; font-weight: 700; color: #1d4ed8;">
                      Status: ${disp.farmer_a_status || 'Awaiting Response'}
                    </div>
                  </div>
                </div>

                <div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: var(--radius-md); padding: 1rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                    <strong style="color: #065f46; font-size: 0.95rem;">👨‍🌾 Tail Reach: ${disp.farmer_b_name}</strong>
                    <span class="badge badge-success">${disp.farmer_b_gate}</span>
                  </div>
                  <div style="font-size: 0.83rem; color: #064e3b; line-height: 1.55;">
                    <div>Crop: <strong>${disp.farmer_b_crop}</strong> • Demanded: <strong>${disp.farmer_b_requested} m³</strong></div>
                    <div style="margin-top: 0.4rem; font-style: italic; background: white; padding: 0.5rem; border-radius: 4px; border: 1px solid #dcfce7;">
                      "${disp.farmer_b_claim}"
                    </div>
                    <div style="margin-top: 0.4rem; font-weight: 700; color: #059669;">
                      Status: ${disp.farmer_b_status || 'Awaiting Response'}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Feasible Compromise Settlement Proposals -->
              <div style="background: #f8fafc; border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
                <div style="font-weight: 800; color: var(--primary); font-size: 0.95rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                  <span>⚖️ Feasible Compromise Settlement Proposals (Select to Accept):</span>
                  <span style="font-size: 0.75rem; color: #64748b; font-weight: 600;">Calculated under strict water-balance conservation</span>
                </div>

                <div class="grid-3" style="gap: 1rem;">
                  <!-- Option 1 -->
                  <div style="background: white; border: 1.5px solid #cbd5e1; border-radius: var(--radius-md); padding: 1rem; display: flex; flex-direction: column;">
                    <strong style="color: #0284c7; font-size: 0.95rem; margin-bottom: 0.25rem;">Option 1: Proportional Cut</strong>
                    <div style="font-size: 0.78rem; color: #64748b; margin-bottom: 0.5rem;">Equal mathematical 36% cut across both farms</div>
                    <div style="font-size: 0.83rem; line-height: 1.6; margin-bottom: 0.75rem;">
                      <div>${disp.farmer_a_name}: <strong>19.2 m³</strong></div>
                      <div>${disp.farmer_b_name}: <strong>16.0 m³</strong></div>
                      <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem;">Fairness: 98% • Wilting Risk: High for Cane</div>
                    </div>
                    <button class="btn btn-outline-teal btn-sm btn-accept-prop" data-disp="${disp.id}" data-prop="PROP-A" style="margin-top: auto;">
                      Accept Option 1
                    </button>
                  </div>

                  <!-- Option 2 -->
                  <div style="background: #f0fdfa; border: 2px solid #0d9488; border-radius: var(--radius-md); padding: 1rem; display: flex; flex-direction: column; position: relative;">
                    <span class="badge" style="position: absolute; top: -10px; right: 10px; background: #0d9488; color: white; font-size: 0.68rem; font-weight: 800;">AI RECOMMENDED</span>
                    <strong style="color: #0f766e; font-size: 0.95rem; margin-bottom: 0.25rem;">Option 2: Agronomic Priority</strong>
                    <div style="font-size: 0.78rem; color: #047857; margin-bottom: 0.5rem;">Protects critical grand-growth sugarcane</div>
                    <div style="font-size: 0.83rem; line-height: 1.6; margin-bottom: 0.75rem;">
                      <div>${disp.farmer_a_name}: <strong>20.0 m³</strong> (Tuesday Turn)</div>
                      <div>${disp.farmer_b_name}: <strong style="color: #0d9488;">18.5 m³</strong> (Thursday Turn)</div>
                      <div style="font-size: 0.75rem; color: #047857; margin-top: 0.25rem;">Fairness: 94% • Zero Yield Loss</div>
                    </div>
                    <button class="btn btn-teal btn-sm btn-accept-prop" data-disp="${disp.id}" data-prop="PROP-B" style="margin-top: auto; font-weight: 700;">
                      ✅ Accept Option 2 (Recommended)
                    </button>
                  </div>

                  <!-- Option 3 -->
                  <div style="background: white; border: 1.5px solid #cbd5e1; border-radius: var(--radius-md); padding: 1rem; display: flex; flex-direction: column;">
                    <strong style="color: #d97706; font-size: 0.95rem; margin-bottom: 0.25rem;">Option 3: Rotational Staggering</strong>
                    <div style="font-size: 0.78rem; color: #64748b; margin-bottom: 0.5rem;">Full pressure 48h staggered Warabandi turns</div>
                    <div style="font-size: 0.83rem; line-height: 1.6; margin-bottom: 0.75rem;">
                      <div>Turn 1: Tail Gate-5 (Full 23.8 m³)</div>
                      <div>Turn 2: Head Gate-1 (+48h Stagger)</div>
                      <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem;">Fairness: 91% • High Gatekeeper Vigilance</div>
                    </div>
                    <button class="btn btn-outline-teal btn-sm btn-accept-prop" data-disp="${disp.id}" data-prop="PROP-C" style="margin-top: auto;">
                      Accept Option 3
                    </button>
                  </div>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem;">
                  <button class="btn btn-secondary btn-sm btn-reject-prop" data-disp="${disp.id}" style="color: #b91c1c; border-color: #fca5a5; background: #fff5f5;">
                    ❌ Request Reconsideration / Reject
                  </button>
                </div>
              </div>

              <!-- Ratification Summary Note -->
              <div style="background: #f1f5f9; border-radius: var(--radius-sm); padding: 0.75rem 1rem; font-size: 0.82rem; color: #475569; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <strong>Official Ratification:</strong> ${disp.ratification_notes || "Statutory 8-Rule Matrix checks validated. Awaiting Executive Engineer final authorization."}
                </div>
                <span class="badge" style="background: #e2e8f0; color: #334155; font-size: 0.75rem;">Officer: ${disp.assigned_officer}</span>
              </div>
            </div>
          `).join("")}
        </div>

        <!-- FORM TO RAISE A NEW WATER-SHARING DISPUTE -->
        <div style="background: white; border: 2px dashed #99f6e4; border-radius: var(--radius-lg); padding: 1.75rem;">
          <h4 style="color: var(--primary); font-size: 1.15rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>➕</span> Raise New Water-Sharing Dispute / Appeal
          </h4>
          <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1.25rem;">
            If you suspect unauthorized upstream withdrawal, missing rotation turns, or gate discharge deprivation, submit a formal dispute case. JalMitra's AI Dispute Analysis Agent will retrieve evidence and generate compromise proposals.
          </p>

          <form id="farmer-new-dispute-form">
            <div class="grid-3" style="gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label class="form-label">Dispute Category</label>
                <select class="form-select" id="new-disp-category" required>
                  <option value="Unequal Water Distribution">Unequal Water Distribution (असम वाटर वाटप)</option>
                  <option value="Missed Irrigation Turn">Missed Irrigation Turn (पाळी न मिळणे)</option>
                  <option value="Unauthorized Withdrawal">Unauthorized Withdrawal (अनाधिकृत उपसा)</option>
                  <option value="Schedule Conflict">Schedule Conflict (वेळापत्रक संघर्ष)</option>
                  <option value="Inaccurate Allocation Records">Inaccurate Allocation Records (अचूक नोंद त्रुटी)</option>
                  <option value="Water Shortage Emergency">Water Shortage Emergency (तीव्र पाणी टंचाई)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Urgency & Severity</label>
                <select class="form-select" id="new-disp-urgency">
                  <option value="Critical Crop Wilting">🚨 Critical Crop Wilting (तातडीचे - पीक जळणे)</option>
                  <option value="High" selected>High (उच्च प्राधान्य)</option>
                  <option value="Normal">Normal (सर्वसाधारण)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Contested Gate / Upstream Distributary</label>
                <select class="form-select" id="new-disp-target-gate">
                  <option value="Gate-1">Gate-1 (Sukene - Head Reach, Suresh Shinde)</option>
                  <option value="Gate-2">Gate-2 (Ozar Minor)</option>
                  <option value="Gate-3">Gate-3 (Pimpalgaon A - Middle Reach)</option>
                  <option value="Gate-4">Gate-4 (Pimpalgaon B - Middle Reach)</option>
                  <option value="Gate-5">Gate-5 (Niphad Distributary - Tail Reach)</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label">Dispute Title / Headline</label>
              <input type="text" class="form-input" id="new-disp-title" value="Tail-reach water deprivation due to upstream excessive drawdown" required>
            </div>

            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label">Detailed Grievance & Factual Claim</label>
              <textarea class="form-textarea" id="new-disp-claim" rows="3" required placeholder="Describe what happened: date, missing hours of flow, observed discharge, wilting stage...">Discharge at Gate 5 has dropped to 12 cusecs for 4 consecutive days. Upstream Gate 1 is running continuous full flow contrary to the Warabandi schedule. Sugarcane in Grand Growth requires urgent rotational turn or permanent crop damage will occur.</textarea>
            </div>

            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label class="form-label">Supporting Evidence / Photos / Telemetry Observation (Optional)</label>
              <div style="display: flex; gap: 0.75rem; align-items: center;">
                <input type="file" id="new-disp-file" class="form-input" style="padding: 0.45rem;">
                <span style="font-size: 0.78rem; color: #64748b;">Supported: Geo-tagged photo, canal gauge reading, crop wilting snapshot</span>
              </div>
            </div>

            <div style="display: flex; gap: 0.75rem;">
              <button type="submit" class="btn btn-teal" style="font-weight: 700;">
                ⚖️ Submit Dispute Case to Mediation Centre
              </button>
            </div>
          </form>
        </div>

      </div>
    `;

    // Button event listeners
    contentArea.querySelector("#btn-goto-full-mediation")?.addEventListener("click", () => {
      store.setTab("mediation");
    });

    contentArea.querySelectorAll(".btn-accept-prop").forEach(btn => {
      btn.addEventListener("click", async () => {
        const dispId = btn.getAttribute("data-disp");
        const propId = btn.getAttribute("data-prop");
        await store.acceptDisputeProposal(dispId, propId, farmer.name, "Accepted");
        window.showToast(`Accepted ${propId} for ${dispId}! Recorded in SHA-256 audit chain.`, "success");
        renderFarmerPortal(mainContainer);
      });
    });

    contentArea.querySelectorAll(".btn-reject-prop").forEach(btn => {
      btn.addEventListener("click", async () => {
        const dispId = btn.getAttribute("data-disp");
        await store.acceptDisputeProposal(dispId, "PROP-REVIEW", farmer.name, "Rejected / Review Requested");
        window.showToast(`Reconsideration requested for ${dispId}. Escalated to Executive Engineer.`, "info");
        renderFarmerPortal(mainContainer);
      });
    });

    contentArea.querySelector("#farmer-new-dispute-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const category = contentArea.querySelector("#new-disp-category").value;
      const urgency = contentArea.querySelector("#new-disp-urgency").value;
      const targetGate = contentArea.querySelector("#new-disp-target-gate").value;
      const title = contentArea.querySelector("#new-disp-title").value;
      const claim = contentArea.querySelector("#new-disp-claim").value;

      const newCase = await store.raiseDispute({
        title,
        category,
        urgency,
        farmer_b_id: farmer.id,
        farmer_b_name: farmer.name,
        farmer_b_gate: farmer.gate_id,
        farmer_b_crop: farmer.crop,
        farmer_b_requested: farmer.farm_area_acres * 6.0,
        farmer_b_claim: claim,
        farmer_a_id: targetGate === "Gate-1" ? "FARMER-MH-014" : "FARMER-MH-032",
        farmer_a_name: targetGate === "Gate-1" ? "Suresh Shinde" : "Sunita Gaikwad",
        farmer_a_gate: targetGate,
        farmer_a_crop: targetGate === "Gate-1" ? "Cotton" : "Onion",
        farmer_a_requested: 30.0,
        farmer_a_claim: "Standard upstream allocation under review."
      });

      window.showToast(`Dispute ${newCase.id} registered! AI Mediation Room activated.`, "success");
      renderFarmerPortal(mainContainer);
    });
  }

  // =========================================================================
  // SECTION M: IN-APP NOTIFICATIONS
  // =========================================================================
  else if (tab === "notifications") {
    contentArea.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><span>🔔</span> Farmer In-App Notifications</div>
          <button id="btn-mark-all-read" class="btn btn-secondary btn-sm">Mark All as Read</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${farmerNotifs.length > 0 ? farmerNotifs.map(n => `
            <div style="padding: 1rem; border-radius: var(--radius-md); background: ${n.read ? 'var(--surface-alt)' : '#f0fdfa'}; border: 1px solid ${n.read ? 'var(--surface-border)' : '#99f6e4'}; display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <strong style="color: var(--primary); font-size: 0.95rem;">${n.title}</strong>
                <p style="font-size: 0.85rem; color: var(--text-main); margin-top: 0.25rem;">${n.message}</p>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">${n.timestamp}</div>
              </div>
              ${!n.read ? `<span class="badge badge-info">New</span>` : ""}
            </div>
          `).join("") : `<p style="color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0;">No unread notifications.</p>`}
        </div>
      </div>
    `;

    contentArea.querySelector("#btn-mark-all-read")?.addEventListener("click", () => {
      farmerNotifs.forEach(n => n.read = true);
      store.notify();
      renderFarmerPortal(mainContainer);
    });
  }
}

// =========================================================================
// HELPER: RENDER WATER HISTORY SUB-TAB (Module 3)
// =========================================================================
function renderWaterHistorySubtab(contentArea, farmer, farmerHistory, mainContainer) {
  contentArea.innerHTML = `
    <div class="card" style="margin-bottom: 1.25rem;">
      <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
        <div>
          <div class="card-title"><span>💧</span> Farmer Water History & Delivery Ledger (Module 3)</div>
          <div class="card-subtitle">
            Historical delivery records for <strong>${farmer.name}</strong> (${farmer.village}, Gat No. ${farmer.gat_no}) • Assigned <strong>${farmer.gate_id}</strong>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button id="btn-hist-request-water" class="btn btn-teal btn-sm" style="font-weight: 700;">
            ➕ Request Water
          </button>
        </div>
      </div>

      <!-- Filters by Year, Season, Crop, Status -->
      <div style="background: var(--surface-alt); border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem;">
        <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">
          Filter Historical Records:
        </div>
        <div class="grid-4" style="gap: 0.75rem;">
          <div>
            <label class="form-label" style="font-size: 0.75rem;">Year</label>
            <select id="filter-hist-year" class="form-select form-select-sm">
              <option value="ALL" selected>All Years (2024 - 2026)</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 0.75rem;">Season</label>
            <select id="filter-hist-season" class="form-select form-select-sm">
              <option value="ALL" selected>All Seasons (Kharif, Rabi, Zaid)</option>
              <option value="Rabi">Rabi (Winter)</option>
              <option value="Kharif">Kharif (Monsoon)</option>
              <option value="Zaid">Zaid (Summer)</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 0.75rem;">Crop</label>
            <select id="filter-hist-crop" class="form-select form-select-sm">
              <option value="ALL" selected>All Crops</option>
              <option value="Sugarcane">Sugarcane</option>
              <option value="Cotton">Cotton</option>
              <option value="Onion">Onion</option>
              <option value="Soybean">Soybean</option>
              <option value="Wheat">Wheat</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="font-size: 0.75rem;">Status</label>
            <select id="filter-hist-status" class="form-select form-select-sm">
              <option value="ALL" selected>All Statuses</option>
              <option value="Completed">Completed / Delivered</option>
              <option value="Approved">Approved</option>
              <option value="Partially Approved">Partially Approved</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Water History KPI Summary Cards -->
      <div id="hist-kpi-container" class="grid-4" style="margin-bottom: 1.5rem;"></div>

      <!-- Comparative SVG Chart: Requested vs Allocated vs Actual Received -->
      <div style="background: white; border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <h4 style="font-size: 1rem; color: var(--primary); margin: 0; display: flex; align-items: center; gap: 0.5rem;">
            <span>📊</span> Comparative Water History Chart (Requested vs Allocated vs Received)
          </h4>
          <div style="display: flex; gap: 1rem; font-size: 0.78rem;">
            <span style="display: inline-flex; align-items: center; gap: 0.35rem;">
              <span style="width: 12px; height: 12px; background: #94a3b8; border-radius: 2px;"></span> Requested
            </span>
            <span style="display: inline-flex; align-items: center; gap: 0.35rem;">
              <span style="width: 12px; height: 12px; background: #0284c7; border-radius: 2px;"></span> Allocated
            </span>
            <span style="display: inline-flex; align-items: center; gap: 0.35rem;">
              <span style="width: 12px; height: 12px; background: #10b981; border-radius: 2px;"></span> Actual Received
            </span>
          </div>
        </div>
        <div id="hist-chart-container"></div>
      </div>

      <!-- Detailed Delivery Records Table -->
      <div style="margin-top: 1rem;">
        <h4 style="font-size: 1rem; color: var(--primary); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>📋</span> Historical Delivery & Allocation Records Table
        </h4>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Delivery Date</th>
                <th>Year & Season</th>
                <th>Crop (Growth Stage)</th>
                <th>Requested Water</th>
                <th>Allocated Water</th>
                <th>Actual Water Received</th>
                <th>Delivery Duration</th>
                <th>Deficit / Shortage</th>
                <th>Status</th>
                <th>Official Remarks</th>
              </tr>
            </thead>
            <tbody id="hist-table-body"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  contentArea.querySelector("#btn-hist-request-water")?.addEventListener("click", () => {
    store.getState().activeFarmerSubTab = "request_water";
    renderFarmerPortal(mainContainer);
  });

  // Filter application function
  const applyFilters = () => {
    const yr = contentArea.querySelector("#filter-hist-year")?.value || "ALL";
    const sn = contentArea.querySelector("#filter-hist-season")?.value || "ALL";
    const cp = contentArea.querySelector("#filter-hist-crop")?.value || "ALL";
    const st = contentArea.querySelector("#filter-hist-status")?.value || "ALL";

    let filtered = [...farmerHistory];
    if (yr !== "ALL") filtered = filtered.filter(h => String(h.year) === String(yr));
    if (sn !== "ALL") filtered = filtered.filter(h => String(h.season).toLowerCase() === sn.toLowerCase());
    if (cp !== "ALL") filtered = filtered.filter(h => String(h.crop).toLowerCase() === cp.toLowerCase());
    if (st !== "ALL") filtered = filtered.filter(h => String(h.status).toLowerCase() === st.toLowerCase());

    // Update KPI cards
    const totReqM3 = filtered.reduce((s, h) => s + parseFloat(h.requested_qty_m3 || 0), 0);
    const totAllocM3 = filtered.reduce((s, h) => s + parseFloat(h.allocated_qty_m3 || 0), 0);
    const totRecM3 = filtered.reduce((s, h) => s + parseFloat(h.received_qty_m3 || 0), 0);
    const totShortM3 = filtered.reduce((s, h) => s + parseFloat(h.shortage_m3 || Math.max(0, (h.requested_qty_m3 || 0) - (h.received_qty_m3 || 0))), 0);
    const fulfillmentRate = totReqM3 > 0 ? Math.round((totRecM3 / totReqM3) * 100) : 100;

    const kpiBox = contentArea.querySelector("#hist-kpi-container");
    if (kpiBox) {
      kpiBox.innerHTML = `
        <div class="stat-box" style="border-top: 3px solid #64748b;">
          <div class="stat-label">Total Water Requested</div>
          <div class="stat-value" style="font-size: 1.35rem;">${totReqM3.toFixed(1)} m³</div>
          <div class="stat-sub">${(totReqM3 * 1000).toLocaleString()} Litres</div>
        </div>
        <div class="stat-box" style="border-top: 3px solid #0284c7;">
          <div class="stat-label">Total Water Allocated</div>
          <div class="stat-value" style="font-size: 1.35rem; color: #0284c7;">${totAllocM3.toFixed(1)} m³</div>
          <div class="stat-sub">${(totAllocM3 * 1000).toLocaleString()} Litres</div>
        </div>
        <div class="stat-box" style="border-top: 3px solid #10b981;">
          <div class="stat-label">Total Actual Received</div>
          <div class="stat-value" style="font-size: 1.35rem; color: #10b981;">${totRecM3.toFixed(1)} m³</div>
          <div class="stat-sub">${(totRecM3 * 1000).toLocaleString()} Litres (${fulfillmentRate}% fulfillment)</div>
        </div>
        <div class="stat-box" style="border-top: 3px solid ${totShortM3 > 0 ? '#ef4444' : '#10b981'};">
          <div class="stat-label">Cumulative Shortfall</div>
          <div class="stat-value" style="font-size: 1.35rem; color: ${totShortM3 > 0 ? '#ef4444' : '#10b981'};">${totShortM3.toFixed(1)} m³</div>
          <div class="stat-sub">${(totShortM3 * 1000).toLocaleString()} Litres Deficit</div>
        </div>
      `;
    }

    // Render SVG Bar Chart
    const chartBox = contentArea.querySelector("#hist-chart-container");
    if (chartBox) {
      if (filtered.length === 0) {
        chartBox.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No historical records matching filter criteria.</p>`;
      } else {
        const maxVal = Math.max(...filtered.map(h => Math.max(h.requested_qty_m3 || 0, h.allocated_qty_m3 || 0, h.received_qty_m3 || 0)), 10.0);
        const svgHeight = 160;
        
        chartBox.innerHTML = `
          <div style="display: flex; gap: 1.25rem; align-items: flex-end; height: 180px; padding: 10px 10px 25px 10px; border-bottom: 2px solid #cbd5e1; overflow-x: auto;">
            ${filtered.map(h => {
              const reqH = Math.round(((h.requested_qty_m3 || 0) / maxVal) * svgHeight);
              const allocH = Math.round(((h.allocated_qty_m3 || 0) / maxVal) * svgHeight);
              const recH = Math.round(((h.received_qty_m3 || 0) / maxVal) * svgHeight);
              const label = `${h.year} ${h.season.substring(0, 4)}`;

              return `
                <div style="display: flex; flex-direction: column; align-items: center; min-width: 68px;">
                  <div style="display: flex; align-items: flex-end; gap: 3px; height: ${svgHeight}px;">
                    <div title="Requested: ${h.requested_qty_m3} m3" style="width: 16px; height: ${reqH}px; background: #94a3b8; border-radius: 3px 3px 0 0;"></div>
                    <div title="Allocated: ${h.allocated_qty_m3} m3" style="width: 16px; height: ${allocH}px; background: #0284c7; border-radius: 3px 3px 0 0;"></div>
                    <div title="Actual Received: ${h.received_qty_m3} m3" style="width: 16px; height: ${recH}px; background: #10b981; border-radius: 3px 3px 0 0;"></div>
                  </div>
                  <div style="font-size: 0.72rem; color: #475569; font-weight: 600; margin-top: 6px; white-space: nowrap;">
                    ${label}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `;
      }
    }

    // Render Table Rows
    const tableBody = contentArea.querySelector("#hist-table-body");
    if (tableBody) {
      if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="11" style="text-align: center; color: var(--text-muted); padding: 2rem;">No historical records found for selected filters.</td></tr>`;
      } else {
        tableBody.innerHTML = filtered.map(h => {
          const reqM3 = parseFloat(h.requested_qty_m3 || 0);
          const allocM3 = parseFloat(h.allocated_qty_m3 || 0);
          const recM3 = parseFloat(h.received_qty_m3 || 0);
          const diffM3 = Math.round(Math.max(0, reqM3 - recM3) * 10) / 10;

          return `
            <tr>
              <td><strong>${h.id}</strong></td>
              <td>${h.delivery_date}</td>
              <td>${h.year} ${h.season}</td>
              <td>${h.crop} <span style="font-size: 0.75rem; color: #64748b;">(${h.growth_stage || 'Standard'})</span></td>
              <td><strong>${reqM3} m³</strong><br><span style="font-size: 0.72rem; color: #64748b;">${(reqM3 * 1000).toLocaleString()} L</span></td>
              <td>${allocM3} m³<br><span style="font-size: 0.72rem; color: #64748b;">${(allocM3 * 1000).toLocaleString()} L</span></td>
              <td><strong style="color: #059669;">${recM3} m³</strong><br><span style="font-size: 0.72rem; color: #047857;">${(recM3 * 1000).toLocaleString()} L</span></td>
              <td>${h.duration_hours || 8.0} hrs</td>
              <td><span style="color: ${diffM3 > 0 ? '#dc2626' : '#059669'}; font-weight: 600;">${diffM3 > 0 ? diffM3 + ' m³ deficit' : '0.0 (Full)'}</span></td>
              <td><span class="badge ${getStatusBadge(h.status)}">${h.status}</span></td>
              <td style="font-size: 0.8rem; color: var(--text-muted);">${h.officer_remarks || 'Verified gatekeeper release.'}</td>
            </tr>
          `;
        }).join("");
      }
    }
  };

  contentArea.querySelectorAll("select[id^='filter-hist-']").forEach(sel => {
    sel.addEventListener("change", applyFilters);
  });

  applyFilters();
}

// =========================================================================
// HELPER: RENDER CURRENT WATER REQUIREMENT FORM (Module 4)
// =========================================================================
function renderWaterRequirementForm(contentArea, farmer, state, mainContainer) {
  contentArea.innerHTML = `
    <div class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <div>
          <div class="card-title"><span>➕</span> Current Water Requirement Submission Form (Module 4)</div>
          <div class="card-subtitle">
            Pre-populated for registered account <strong>${farmer.name}</strong> (${farmer.id}) • Gat No. ${farmer.gat_no}
          </div>
        </div>
        <span class="badge badge-info">Unapproved Intake State</span>
      </div>

      <form id="water-req-form" style="margin-top: 0.5rem;">
        <!-- Pre-populated Account Information (Read-only for integrity) -->
        <div style="background: var(--surface-alt); border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1rem 1.25rem; margin-bottom: 1.25rem;">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">
            Farmer Account Information (Pre-Populated):
          </div>
          <div class="grid-4" style="font-size: 0.85rem;">
            <div><strong>Farmer ID:</strong> <span style="color: #0d9488;">${farmer.id}</span></div>
            <div><strong>Village & District:</strong> ${farmer.village}, Nashik</div>
            <div><strong>Assigned Sluice Gate:</strong> ${farmer.gate_id} (${farmer.reach})</div>
            <div><strong>Plot / Gat No:</strong> ${farmer.gat_no}</div>
          </div>
        </div>

        <!-- Input Fields -->
        <div class="grid-3" style="gap: 1rem; margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Current Crop <span class="required">*</span></label>
            <select id="req-crop" class="form-select" required>
              <option value="Sugarcane" ${farmer.crop === "Sugarcane" ? "selected" : ""}>Sugarcane (ऊस)</option>
              <option value="Cotton" ${farmer.crop === "Cotton" ? "selected" : ""}>Cotton (कापूस)</option>
              <option value="Onion" ${farmer.crop === "Onion" ? "selected" : ""}>Onion (कांदा)</option>
              <option value="Soybean" ${farmer.crop === "Soybean" ? "selected" : ""}>Soybean (सोयाबीन)</option>
              <option value="Wheat" ${farmer.crop === "Wheat" ? "selected" : ""}>Wheat (गहू)</option>
              <option value="Grapes" ${farmer.crop === "Grapes" ? "selected" : ""}>Grapes (द्राक्ष)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Current Growth Stage <span class="required">*</span></label>
            <select id="req-stage" class="form-select" required>
              <option value="Grand Growth" ${farmer.growth_stage === "Grand Growth" ? "selected" : ""}>Grand Growth (मोठी वाढ - Peak Water)</option>
              <option value="Tillering" ${farmer.growth_stage === "Tillering" ? "selected" : ""}>Tillering (फुटवे फुटणे)</option>
              <option value="Flowering/Boll" ${farmer.growth_stage === "Flowering/Boll" ? "selected" : ""}>Flowering / Boll Formation (फुलधारणा)</option>
              <option value="Bulb Formation" ${farmer.growth_stage === "Bulb Formation" ? "selected" : ""}>Bulb Formation (कांदा पोसणे)</option>
              <option value="Pod Formation" ${farmer.growth_stage === "Pod Formation" ? "selected" : ""}>Pod Formation (शेंगा धरणे)</option>
              <option value="Ripening" ${farmer.growth_stage === "Ripening" ? "selected" : ""}>Maturity / Ripening (पक्वता)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Land Area Requiring Irrigation (Acres) <span class="required">*</span></label>
            <input type="number" id="req-acres" class="form-control" step="0.5" min="0.5" max="${farmer.farm_area_acres * 1.5}" value="${farmer.farm_area_acres}" required />
          </div>
        </div>

        <!-- Quantity & Unit Selection with Live Converter -->
        <div class="grid-2" style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" style="font-weight: 700; color: #0f766e;">Water Required Quantity <span class="required">*</span></label>
            <div style="display: flex; gap: 0.5rem;">
              <input type="number" id="req-quantity-val" class="form-control" step="1" min="1" value="25" required style="font-size: 1.15rem; font-weight: 700; color: #0d9488;" />
              <select id="req-unit-sel" class="form-select" style="width: 170px; font-weight: 700;">
                <option value="m3" selected>Cubic Metres (m³)</option>
                <option value="litres">Litres (L)</option>
              </select>
            </div>
            <div id="unit-conversion-preview" style="font-size: 0.82rem; color: #0d9488; font-weight: 600; margin-top: 0.35rem;">
              Equivalent: 25.0 m³ = 25,000 Litres
            </div>
          </div>

          <div>
            <div style="font-size: 0.78rem; font-weight: 700; color: #0f766e; text-transform: uppercase; margin-bottom: 0.25rem;">
              Live Agronomic Penman-Monteith Estimate:
            </div>
            <div id="agro-quick-estimate" style="font-size: 0.85rem; color: #134e4a; line-height: 1.5;">
              Calculating theoretical scientific crop requirement...
            </div>
          </div>
        </div>

        <!-- Irrigation Timing & Field State -->
        <div class="grid-4" style="gap: 1rem; margin-bottom: 1rem;">
          <div class="form-group">
            <label class="form-label">Preferred Irrigation Date <span class="required">*</span></label>
            <input type="date" id="req-date" class="form-control" required />
          </div>

          <div class="form-group">
            <label class="form-label">Required Turn Duration (Hours) <span class="required">*</span></label>
            <input type="number" id="req-duration" class="form-control" min="2" max="24" value="8" required />
          </div>

          <div class="form-group">
            <label class="form-label">Last Irrigation Date</label>
            <input type="date" id="req-last-date" class="form-control" />
          </div>

          <div class="form-group">
            <label class="form-label">Current Soil Moisture (%, if known)</label>
            <input type="number" id="req-soil-moisture" class="form-control" min="5" max="100" placeholder="e.g. 22%" />
          </div>
        </div>

        <!-- Reason & Evidence Upload -->
        <div class="grid-2" style="gap: 1rem; margin-bottom: 1.25rem;">
          <div class="form-group">
            <label class="form-label">Reason for Request <span class="required">*</span></label>
            <select id="req-reason-cat" class="form-select" required>
              <option value="Normal Irrigation" selected>Normal Irrigation (Routine Warabandi turn)</option>
              <option value="Water Shortage">Water Shortage (Compensating canal delay)</option>
              <option value="Crop-Critical Irrigation">Crop-Critical Irrigation (Wilting prevention)</option>
              <option value="Emergency Requirement">Emergency Requirement (Severe drought stress)</option>
            </select>
            <textarea id="req-reason-details" class="form-textarea" rows="2" style="margin-top: 0.5rem;" placeholder="Explain specific field conditions... e.g. Cane crop entering peak grand growth; canal pressure inadequate.">Sugarcane crop in grand growth stage requires continuous soil moisture to avoid stem cracking.</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Optional Supporting Evidence (Photo / Document)</label>
            <div style="border: 2px dashed #cbd5e1; border-radius: var(--radius-md); padding: 1rem; text-align: center; background: #f8fafc;">
              <input type="file" id="req-evidence-file" class="form-control" accept="image/*,.pdf" style="font-size: 0.8rem;" />
              <div id="evidence-preview" style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.4rem;">
                Upload photograph of soil crack formation, crop wilting, or pump log (optional).
              </div>
            </div>
          </div>
        </div>

        <!-- Terms and Submit -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-top: 1px solid var(--surface-border); padding-top: 1rem;">
          <label style="font-size: 0.82rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" id="req-confirm-accuracy" required checked />
            I certify that the requested water quantity is for agricultural use on Gat No. ${farmer.gat_no}.
          </label>
          <button type="submit" class="btn btn-teal" style="font-size: 1rem; font-weight: 700; padding: 0.75rem 1.75rem; box-shadow: 0 4px 14px rgba(13,148,136,0.35);">
            🚀 Submit Water Requirement Request
          </button>
        </div>
      </form>
    </div>
  `;

  // Set default preferred date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const dateInput = contentArea.querySelector("#req-date");
  if (dateInput) {
    dateInput.value = tomorrowStr;
    dateInput.min = new Date().toISOString().split("T")[0];
  }

  // Set default last date to 12 days ago
  const lastDate = new Date();
  lastDate.setDate(lastDate.getDate() - 12);
  const lastDateInput = contentArea.querySelector("#req-last-date");
  if (lastDateInput) {
    lastDateInput.value = lastDate.toISOString().split("T")[0];
  }

  // Live Unit Conversion and Agronomic Calculator
  const qtyInput = contentArea.querySelector("#req-quantity-val");
  const unitSel = contentArea.querySelector("#req-unit-sel");
  const previewDiv = contentArea.querySelector("#unit-conversion-preview");
  const agroDiv = contentArea.querySelector("#agro-quick-estimate");
  const cropSel = contentArea.querySelector("#req-crop");
  const stageSel = contentArea.querySelector("#req-stage");
  const acresInput = contentArea.querySelector("#req-acres");

  const updateUnitsAndAgro = () => {
    const rawVal = parseFloat(qtyInput?.value || 0);
    const unit = unitSel?.value || "m3";
    let m3Val = rawVal;
    let litresVal = rawVal * 1000.0;
    if (unit === "litres") {
      litresVal = rawVal;
      m3Val = rawVal / 1000.0;
    }

    if (previewDiv) {
      previewDiv.innerHTML = `Equivalent: <strong>${m3Val.toFixed(1)} m³</strong> = <strong>${Math.round(litresVal).toLocaleString()} Litres</strong>`;
    }

    const cr = cropSel?.value || "Sugarcane";
    const stg = stageSel?.value || "Grand Growth";
    const ac = parseFloat(acresInput?.value || 3.0);

    const est = estimateCropWaterRequirement({
      crop: cr,
      farm_area_acres: ac,
      growth_stage: stg
    });

    if (agroDiv) {
      agroDiv.innerHTML = `
        FAO-56 Gross Demand: <strong>${est.volumeM3.toFixed(1)} m³</strong> (${(est.volumeM3 * 1000).toLocaleString()} L).
        Kc factor: <strong>${est.kc}</strong> (${est.isCriticalStage ? 'Critical Moisture Sensitive' : 'Normal'}).
      `;
    }
  };

  qtyInput?.addEventListener("input", updateUnitsAndAgro);
  unitSel?.addEventListener("change", updateUnitsAndAgro);
  cropSel?.addEventListener("change", updateUnitsAndAgro);
  stageSel?.addEventListener("change", updateUnitsAndAgro);
  acresInput?.addEventListener("input", updateUnitsAndAgro);
  updateUnitsAndAgro();

  // Photo / File preview handler
  contentArea.querySelector("#req-evidence-file")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    const prev = contentArea.querySelector("#evidence-preview");
    if (file && prev) {
      prev.innerHTML = `📎 <strong>Attached:</strong> ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      prev.style.color = "#0d9488";
    }
  });

  // Submit Handler
  contentArea.querySelector("#water-req-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const rawVal = parseFloat(qtyInput.value);
    const unit = unitSel.value;
    const reqM3 = unit === "litres" ? rawVal / 1000.0 : rawVal;

    const reqData = {
      farmer_id: farmer.id,
      farmer_name: farmer.name,
      gate_id: farmer.gate_id,
      crop: cropSel.value,
      growth_stage: stageSel.value,
      farm_area_acres: parseFloat(acresInput.value),
      requested_quantity: reqM3,
      duration_hours: parseInt(contentArea.querySelector("#req-duration").value),
      preferred_date: contentArea.querySelector("#req-date").value,
      last_irrigation_date: contentArea.querySelector("#req-last-date")?.value,
      soil_moisture: contentArea.querySelector("#req-soil-moisture")?.value || null,
      urgency: contentArea.querySelector("#req-reason-cat").value,
      reason: contentArea.querySelector("#req-reason-details").value
    };

    const newReq = await store.submitWaterRequest(reqData);
    window.showToast(`Water Request ${newReq.id} submitted! Pending Sectional Officer review.`, "success");

    // Automatically transition to Demand Analysis to review historical comparison
    state.activeFarmerSubTab = "demand_analysis";
    renderFarmerPortal(mainContainer);
  });
}

// =========================================================================
// HELPER: RENDER DEMAND ANALYSIS SUB-TAB (Module 5)
// =========================================================================
function renderDemandAnalysisSubtab(contentArea, farmer, farmerHistory, farmerRequests, state) {
  const latestReq = farmerRequests[0] || {
    farmer_id: farmer.id,
    crop: farmer.crop,
    growth_stage: farmer.growth_stage,
    farm_area_acres: farmer.farm_area_acres,
    requested_quantity: 25.0,
    unit: "m3"
  };

  const analysis = analyzeDemandVsHistory(latestReq, farmerHistory, state.reservoir.allocatable_supply);

  // Example demonstration calculation callout from Prompt:
  // "A farmer previously received 800 litres and currently requests 1,000 litres.
  // Show the previous quantity, requested quantity, difference of 200 litres, and a 25% increase."
  contentArea.innerHTML = `
    <div class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <div>
          <div class="card-title"><span>📈</span> Water History and Current Demand Analysis (Module 5)</div>
          <div class="card-subtitle">
            Evaluating historical consumption against current request for <strong>${farmer.name}</strong> (${farmer.village})
          </div>
        </div>
        <span class="badge ${analysis.agronomic_badge === 'success' ? 'badge-success' : 'badge-warning'}">
          ${analysis.agronomic_status}
        </span>
      </div>

      <!-- Explanation & Prompt Example Card -->
      <div class="water-comparison-card">
        <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
          <span style="font-size: 1.6rem;">💡</span>
          <div style="font-size: 0.88rem; color: #065f46; line-height: 1.55;">
            <strong>Explainable AI Intelligence Principle:</strong>
            ${analysis.narrative}
            <div style="margin-top: 0.4rem; font-size: 0.8rem; color: #047857; font-style: italic;">
              * Note: JalMitra never classifies a request as excessive based only on historical figures. Growth stage transitions (e.g. Vegetative to Grand Growth) legitimately increase crop water consumption by up to 2.5x.
            </div>
          </div>
        </div>
      </div>

      <!-- Key Quantitative Comparison Cards -->
      <div class="grid-4" style="margin-bottom: 1.5rem;">
        <div class="stat-box" style="border-top: 3px solid #64748b;">
          <div class="stat-label">Previous Water Received</div>
          <div class="stat-value" style="font-size: 1.35rem; color: #334155;">
            ${analysis.previous_received_m3} m³
          </div>
          <div class="stat-sub">${analysis.previous_received_litres.toLocaleString()} Litres (${analysis.previous_season})</div>
        </div>

        <div class="stat-box" style="border-top: 3px solid #0d9488;">
          <div class="stat-label">Current Water Requested</div>
          <div class="stat-value" style="font-size: 1.35rem; color: #0d9488;">
            ${analysis.current_requested_m3} m³
          </div>
          <div class="stat-sub">${analysis.current_requested_litres.toLocaleString()} Litres (${latestReq.crop})</div>
        </div>

        <div class="stat-box" style="border-top: 3px solid ${analysis.difference_from_previous_m3 > 0 ? '#f59e0b' : '#10b981'};">
          <div class="stat-label">Difference from Previous</div>
          <div class="stat-value" style="font-size: 1.35rem; color: ${analysis.difference_from_previous_m3 > 0 ? '#b45309' : '#059669'};">
            ${analysis.difference_from_previous_m3 >= 0 ? '+' : ''}${analysis.difference_from_previous_m3} m³
          </div>
          <div class="stat-sub">
            ${analysis.difference_from_previous_litres >= 0 ? '+' : ''}${analysis.difference_from_previous_litres.toLocaleString()} L 
            (<strong>${analysis.percentage_change >= 0 ? '+' : ''}${analysis.percentage_change}%</strong>)
          </div>
        </div>

        <div class="stat-box" style="border-top: 3px solid #0284c7;">
          <div class="stat-label">Scientific Gross Crop Demand</div>
          <div class="stat-value" style="font-size: 1.35rem; color: #0284c7;">
            ${analysis.agronomic_gross_m3} m³
          </div>
          <div class="stat-sub">FAO-56 Penman-Monteith ETc</div>
        </div>
      </div>

      <!-- Zone Water Balance Comparison -->
      <div class="grid-2" style="margin-bottom: 1.25rem;">
        <div style="background: white; border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1.25rem;">
          <h4 style="font-size: 0.95rem; color: var(--primary); margin-bottom: 0.75rem;">
            🌊 Canal Reach Available Supply vs Demand
          </h4>
          <div style="font-size: 0.85rem; line-height: 1.6; margin-bottom: 0.75rem;">
            <div><strong>Zone Pool Supply:</strong> ${analysis.zone_available_supply_m3} m³ (${(analysis.zone_available_supply_m3 * 1000).toLocaleString()} L)</div>
            <div><strong>Farmer Request Share:</strong> ${analysis.zone_demand_pct}% of total allocatable pool</div>
            <div><strong>Pool Balance:</strong> <span style="font-weight: 700; color: ${analysis.zone_surplus_or_shortage_m3 >= 0 ? '#059669' : '#dc2626'};">${analysis.zone_status} (${analysis.zone_surplus_or_shortage_m3 >= 0 ? '+' : ''}${analysis.zone_surplus_or_shortage_m3} m³)</span></div>
          </div>
          <!-- Progress bar -->
          <div style="background: #e2e8f0; border-radius: 999px; height: 10px; overflow: hidden;">
            <div style="background: #0d9488; width: ${Math.min(100, analysis.zone_demand_pct)}%; height: 100%;"></div>
          </div>
        </div>

        <div style="background: white; border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1.25rem;">
          <h4 style="font-size: 0.95rem; color: var(--primary); margin-bottom: 0.75rem;">
            📊 Historical Usage Baseline (${analysis.historical_record_count} Completed Cycles)
          </h4>
          <div style="font-size: 0.85rem; line-height: 1.6;">
            <div><strong>Historical Average Received:</strong> ${analysis.historical_avg_received_m3} m³ (${analysis.historical_avg_received_litres.toLocaleString()} L)</div>
            <div><strong>Historical Average Requested:</strong> ${analysis.historical_avg_requested_m3} m³</div>
            <div><strong>Variance from Historical Average:</strong> <span style="font-weight: 600;">${analysis.difference_from_avg_m3 >= 0 ? '+' : ''}${analysis.difference_from_avg_m3} m³ (${analysis.percentage_change_avg >= 0 ? '+' : ''}${analysis.percentage_change_avg}%)</span></div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.35rem;">
              Computed across verified field deliveries from 2024 to 2026.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// =========================================================================
// HELPER: RENDER CROP WATER CALCULATOR (Module 5)
// =========================================================================
function renderCropWaterCalculator(contentArea, farmer) {
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><span>🧮</span> Crop-Water Demand Calculator (FAO-56 Penman-Monteith)</div>
        <div class="card-subtitle">Estimates scientific irrigation requirement without inventing unmeasured field data</div>
      </div>
      <div class="grid-3" style="margin-bottom: 1.25rem;">
        <div class="form-group">
          <label class="form-label">Crop</label>
          <select class="form-select" id="calc-crop">
            <option value="Sugarcane" ${farmer.crop === "Sugarcane" ? "selected" : ""}>Sugarcane (ऊस)</option>
            <option value="Cotton" ${farmer.crop === "Cotton" ? "selected" : ""}>Cotton (कापूस)</option>
            <option value="Soybean" ${farmer.crop === "Soybean" ? "selected" : ""}>Soybean (सोयाबीन)</option>
            <option value="Onion" ${farmer.crop === "Onion" ? "selected" : ""}>Onion (कांदा)</option>
            <option value="Wheat" ${farmer.crop === "Wheat" ? "selected" : ""}>Wheat (गहू)</option>
            <option value="Vegetables">Vegetables (भाजीपाला)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Farm Area (Acres)</label>
          <input type="number" step="0.5" class="form-input" id="calc-acres" value="${farmer.farm_area_acres}">
        </div>
        <div class="form-group">
          <label class="form-label">Growth Stage</label>
          <select class="form-select" id="calc-stage">
            <option value="Grand Growth">Grand Growth (मोठी वाढ - Peak Water)</option>
            <option value="Tillering">Tillering (फुटवे)</option>
            <option value="Flowering/Boll">Flowering / Boll (फुलधारणा)</option>
            <option value="Bulb Formation">Bulb Formation (कांदा पोसणे)</option>
            <option value="Ripening">Ripening (पक्वता)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Soil Type</label>
          <select class="form-select" id="calc-soil">
            <option value="Black Cotton" ${farmer.soil_type === "Black Cotton" ? "selected" : ""}>Black Cotton Soil (काळी माती)</option>
            <option value="Loamy" ${farmer.soil_type === "Loamy" ? "selected" : ""}>Loamy Soil (गाळाची माती)</option>
            <option value="Sandy Loam">Sandy Loam (वालुकामय)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Irrigation Method</label>
          <select class="form-select" id="calc-method">
            <option value="Furrow" ${farmer.irrigation_method === "Furrow" ? "selected" : ""}>Furrow / Ridge (सरी वरंबा - 60% Eff)</option>
            <option value="Drip" ${farmer.irrigation_method === "Drip" ? "selected" : ""}>Drip Irrigation (ठिबक - 90% Eff)</option>
            <option value="Sprinkler" ${farmer.irrigation_method === "Sprinkler" ? "selected" : ""}>Sprinkler (तुषार - 75% Eff)</option>
            <option value="Flood" ${farmer.irrigation_method === "Flood" ? "selected" : ""}>Flood Irrigation (मोकाट - 50% Eff)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Watering Interval (Days)</label>
          <input type="number" class="form-input" id="calc-interval" value="14">
        </div>
      </div>
      <button id="btn-run-calc" class="btn btn-teal">⚡ Calculate Scientific Water Demand</button>

      <div id="calc-results-box" style="margin-top: 1.5rem; background: var(--surface-alt); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--surface-border);"></div>
    </div>
  `;

  const runCalc = () => {
    const crop = contentArea.querySelector("#calc-crop").value;
    const acres = parseFloat(contentArea.querySelector("#calc-acres").value);
    const stage = contentArea.querySelector("#calc-stage").value;
    const soil = contentArea.querySelector("#calc-soil").value;
    const method = contentArea.querySelector("#calc-method").value;
    const interval = parseInt(contentArea.querySelector("#calc-interval").value);

    const est = estimateCropWaterRequirement({
      crop,
      farm_area_acres: acres,
      growth_stage: stage,
      soil_type: soil,
      irrigation_method: method,
      interval_days: interval
    });

    const resBox = contentArea.querySelector("#calc-results-box");
    resBox.innerHTML = `
      <h4 style="color: var(--primary); margin-bottom: 0.5rem;">Calculation Formula & Scientific Demand Result</h4>
      <div style="font-size: 0.82rem; color: #334155; margin-bottom: 1rem; font-family: monospace; background: white; padding: 0.6rem; border-radius: 4px; border: 1px solid #e2e8f0;">
        ETc = ET0 (5.0 mm/day) × Kc (${est.kc}) × ${interval} days = ${est.netEtcMm} mm net depth.<br>
        Gross Volume = [${est.grossDepthMm} mm ÷ 1000] × [${acres} acres × 4046.86 m²] = <strong>${est.volumeM3.toFixed(1)} m³</strong> (${(est.volumeM3 * 1000).toLocaleString()} L).
      </div>
      <div class="grid-4" style="margin-bottom: 1rem;">
        <div class="stat-box">
          <div class="stat-label">Crop Factor (Kc)</div>
          <div class="stat-value" style="font-size: 1.35rem;">${est.kc}</div>
          <div class="stat-sub">${est.isCriticalStage ? 'Critical Moisture Sensitive' : 'Normal Growth'}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Gross Depth Required</div>
          <div class="stat-value" style="font-size: 1.35rem;">${est.grossDepthMm} mm</div>
          <div class="stat-sub">Application Eff: ${est.applicationEfficiencyPct}%</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Required Volume (m³)</div>
          <div class="stat-value" style="font-size: 1.35rem; color: #0d9488;">${est.volumeM3.toFixed(1)} m³</div>
          <div class="stat-sub">For ${acres} acres</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Volume in Litres</div>
          <div class="stat-value" style="font-size: 1.35rem; color: #16532d;">${Math.round(est.volumeM3 * 1000).toLocaleString()} L</div>
          <div class="stat-sub">Volumetric unit</div>
        </div>
      </div>
    `;
  };

  contentArea.querySelector("#btn-run-calc")?.addEventListener("click", runCalc);
  runCalc();
}

// =========================================================================
// HELPER: RENDER GRIEVANCE FORM
// =========================================================================
function renderGrievanceForm(contentArea, farmer, state, mainContainer) {
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><span>⚠️</span> Submit Irrigation Grievance / Complaint</div>
        <div class="card-subtitle">Formal grievance tracking with 48h / 72h SLA guarantees</div>
      </div>
      <form id="grievance-form">
        <div class="grid-3">
          <div class="form-group">
            <label class="form-label">Complaint Category</label>
            <select class="form-select" id="cmp-category">
              <option value="Downstream Water Shortage">Downstream Water Shortage (शेवटच्या टोकाला पाणी टंचाई)</option>
              <option value="Low Canal Pressure">Low Canal Pressure (कालव्यात कमी प्रवाह/दाब)</option>
              <option value="Suspected Unauthorized Diversion">Suspected Unauthorized Diversion (अवैध पाणी उपसा)</option>
              <option value="Canal Leakage">Canal Leakage / Embankment Breach (कालवा गळती/तूट)</option>
              <option value="Delayed Irrigation Turn">Delayed Irrigation Turn (पाणी पाळीत उशीर)</option>
              <option value="Incorrect Allocation">Incorrect Allocation (अयोग्य पाणी वाटप)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Canal Gate</label>
            <input type="text" class="form-input" id="cmp-gate" value="${farmer.gate_id}">
          </div>
          <div class="form-group">
            <label class="form-label">Estimated Water Shortfall (m³)</label>
            <input type="number" step="0.5" class="form-input" id="cmp-shortfall" value="10.0">
          </div>
          <div class="form-group">
            <label class="form-label">Affected Crop</label>
            <input type="text" class="form-input" id="cmp-crop" value="${farmer.crop}">
          </div>
          <div class="form-group">
            <label class="form-label">Crop Growth Stage</label>
            <input type="text" class="form-input" id="cmp-stage" value="${farmer.growth_stage}">
          </div>
          <div class="form-group">
            <label class="form-label">Urgency</label>
            <select class="form-select" id="cmp-urgency">
              <option value="High" selected>High - Wilting Risk</option>
              <option value="Emergency">Emergency - Total Crop Loss Risk</option>
              <option value="Medium">Medium</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Detailed Description of Problem</label>
          <textarea class="form-textarea" id="cmp-desc" rows="3" required placeholder="Describe what happened, canal conditions, time since last water delivery...">Canal water has not reached Niphad Tail-End Gate 5 for 4 days despite scheduled rotation. Cane crop in grand growth is wilting.</textarea>
        </div>
        <button type="submit" class="btn btn-teal">📝 Register Grievance & Dispatch Alert</button>
      </form>
    </div>
  `;

  contentArea.querySelector("#grievance-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cat = contentArea.querySelector("#cmp-category").value;
    const gate = contentArea.querySelector("#cmp-gate").value;
    const shortfall = parseFloat(contentArea.querySelector("#cmp-shortfall").value);
    const crop = contentArea.querySelector("#cmp-crop").value;
    const stage = contentArea.querySelector("#cmp-stage").value;
    const urgency = contentArea.querySelector("#cmp-urgency").value;
    const desc = contentArea.querySelector("#cmp-desc").value;

    const newCmp = await store.submitComplaint({
      farmer_id: farmer.id,
      farmer_name: farmer.name,
      category: cat,
      gate_id: gate,
      shortfall_quantity: shortfall,
      crop,
      growth_stage: stage,
      urgency,
      description: desc
    });

    window.showToast(`Grievance ${newCmp.id} logged successfully! Sectional Officer alerted.`, "success");
    state.activeFarmerSubTab = "my_complaints";
    renderFarmerPortal(mainContainer);
  });
}

// =========================================================================
// HELPER: RENDER VOICE GRIEVANCE INTERFACE
// =========================================================================
function renderVoiceGrievance(contentArea, farmer, state, mainContainer) {
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><span>🎙️</span> Voice Grievance Interface (आवाज तक्रार प्रणाली)</div>
        <div class="card-subtitle">Speak in Marathi, Hindi, or English - Automated Entity Extraction</div>
      </div>

      <div style="background: var(--teal-subtle); border: 1px solid #99f6e4; padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
        <div style="font-weight: 700; color: var(--teal-dark); margin-bottom: 0.35rem;">Language Selection for Speech Recognition:</div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <label><input type="radio" name="voice-lang" value="mr-IN" checked> <strong>मराठी (Marathi)</strong></label>
          <label><input type="radio" name="voice-lang" value="hi-IN" style="margin-left: 1rem;"> <strong>हिंदी (Hindi)</strong></label>
          <label><input type="radio" name="voice-lang" value="en-IN" style="margin-left: 1rem;"> <strong>English (Indian)</strong></label>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 1rem; background: var(--surface-alt); border-radius: var(--radius-lg); border: 2px dashed var(--surface-border); margin-bottom: 1.25rem;">
        <button id="btn-mic-toggle" style="width: 80px; height: 80px; border-radius: 50%; background: #0d9488; color: white; border: none; font-size: 2.2rem; cursor: pointer; box-shadow: 0 4px 15px rgba(13, 148, 136, 0.4); display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;">
          🎤
        </button>
        <div id="mic-status-text" style="margin-top: 1rem; font-weight: 600; color: var(--text-main); font-size: 0.95rem;">
          Click microphone to start speaking your complaint
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
          (Supports HTML5 Speech Recognition with instant entity extraction)
        </div>
      </div>

      <!-- Sample Voice Simulation Prompts -->
      <div style="margin-bottom: 1.25rem;">
        <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">OR LOAD A REALISTIC PRE-RECORDED COMPLAINT SAMPLE:</div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-sm sample-voice-btn" data-text="निफाड गेट नंबर पाच ला चार दिवसांपासून पाणी नाही आले. उसाचे पीक करपायला लागले आहे. तातडीने पाणी सोडावे.">
            🗣️ Sample Marathi (Tail-reach sugarcane wilting)
          </button>
          <button class="btn btn-secondary btn-sm sample-voice-btn" data-text="Gate number 5 at Niphad has received zero canal discharge. Sugarcane crop is facing critical drought stress.">
            🗣️ Sample English (Gate 5 discharge failure)
          </button>
        </div>
      </div>

      <!-- Transcript & Entity Extraction Display -->
      <div id="voice-transcript-card" style="background: white; border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
        <h4 style="color: var(--primary); margin-bottom: 0.5rem;">Live Transcript (संपादनयोग्य उतारा)</h4>
        <textarea id="voice-transcript-text" class="form-textarea" rows="3" placeholder="Transcription will appear here..."></textarea>

        <h5 style="color: var(--primary); margin-top: 1rem; margin-bottom: 0.5rem;">AI Extracted Parameters</h5>
        <div class="grid-3" style="font-size: 0.85rem;">
          <div style="background: var(--surface-alt); padding: 0.6rem; border-radius: var(--radius-sm);">
            <strong>Identified Crop:</strong> <span id="ext-crop" style="color: #0d9488; font-weight: 700;">Sugarcane (ऊस)</span>
          </div>
          <div style="background: var(--surface-alt); padding: 0.6rem; border-radius: var(--radius-sm);">
            <strong>Identified Gate:</strong> <span id="ext-gate" style="color: #0d9488; font-weight: 700;">Gate-5</span>
          </div>
          <div style="background: var(--surface-alt); padding: 0.6rem; border-radius: var(--radius-sm);">
            <strong>Urgency Score:</strong> <span id="ext-urgency" class="badge badge-danger">High (Wilting Risk)</span>
          </div>
        </div>

        <div style="margin-top: 1.25rem;">
          <button id="btn-submit-voice-cmp" class="btn btn-teal">
            ✅ Review & Submit Extracted Voice Grievance
          </button>
        </div>
      </div>
    </div>
  `;

  const micBtn = contentArea.querySelector("#btn-mic-toggle");
  const micStatus = contentArea.querySelector("#mic-status-text");
  const transcriptArea = contentArea.querySelector("#voice-transcript-text");

  let isRecording = false;
  let recognition = null;

  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      isRecording = true;
      micBtn.style.background = "#ef4444";
      micStatus.innerHTML = "🔴 Listening... Speak clearly now";
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      transcriptArea.value = transcript;
      extractFromTranscript(transcript);
    };

    recognition.onerror = () => {
      micStatus.innerHTML = "Speech recognition ended or mic blocked. You can type or use sample button.";
      micBtn.style.background = "#0d9488";
      isRecording = false;
    };

    recognition.onend = () => {
      micStatus.innerHTML = "Recording stopped. Review extracted entities below.";
      micBtn.style.background = "#0d9488";
      isRecording = false;
    };
  }

  micBtn?.addEventListener("click", () => {
    if (!isRecording) {
      const langVal = contentArea.querySelector('input[name="voice-lang"]:checked')?.value || "mr-IN";
      if (recognition) {
        recognition.lang = langVal;
        try {
          recognition.start();
        } catch (e) {
          console.error(e);
        }
      } else {
        micStatus.innerHTML = "Browser speech recognition simulated.";
        transcriptArea.value = "निफाड गेट नंबर ५ ला पाणी नाही आले. ऊस सुकत चालला आहे. कृपया तातडीने मदत करा.";
        extractFromTranscript(transcriptArea.value);
      }
    } else {
      if (recognition) recognition.stop();
    }
  });

  contentArea.querySelectorAll(".sample-voice-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const sample = btn.getAttribute("data-text");
      transcriptArea.value = sample;
      extractFromTranscript(sample);
    });
  });

  function extractFromTranscript(text) {
    let crop = "Sugarcane";
    let gate = "Gate-5";
    if (text.includes("ऊस") || text.toLowerCase().includes("sugarcane")) crop = "Sugarcane";
    if (text.includes("कांदा") || text.toLowerCase().includes("onion")) crop = "Onion";
    if (text.includes("कापूस") || text.toLowerCase().includes("cotton")) crop = "Cotton";
    if (text.match(/५|5/)) gate = "Gate-5";
    if (text.match(/१|1/)) gate = "Gate-1";
    if (text.match(/३|3/)) gate = "Gate-3";

    contentArea.querySelector("#ext-crop").innerText = crop;
    contentArea.querySelector("#ext-gate").innerText = gate;
  }

  contentArea.querySelector("#btn-submit-voice-cmp")?.addEventListener("click", async () => {
    const text = transcriptArea.value.trim();
    if (!text) {
      window.showToast("Please speak or enter a grievance description first.", "warning");
      return;
    }
    const newCmp = await store.submitComplaint({
      farmer_id: farmer.id,
      farmer_name: farmer.name,
      category: "Downstream Water Shortage",
      gate_id: contentArea.querySelector("#ext-gate").innerText,
      shortfall_quantity: 12.0,
      crop: contentArea.querySelector("#ext-crop").innerText,
      growth_stage: farmer.growth_stage,
      urgency: "High",
      description: text,
      voice_recorded: true
    });

    window.showToast(`Voice grievance ${newCmp.id} submitted! SLA tracking initiated.`, "success");
    state.activeFarmerSubTab = "my_complaints";
    renderFarmerPortal(mainContainer);
  });
}

function getStatusBadge(st) {
  switch (st) {
    case "Approved": return "badge-success";
    case "Partially Approved": return "badge-warning";
    case "Completed":
    case "Completed / Delivered":
    case "Delivered": return "badge-success";
    case "Submitted": return "badge-info";
    case "Under Review": return "badge-warning";
    case "Proposed": return "badge-info";
    case "Under Investigation": return "badge-warning";
    case "Action Initiated": return "badge-info";
    case "Resolved": return "badge-success";
    case "Rejected": return "badge-danger";
    case "More Info Requested": return "badge-warning";
    default: return "badge-neutral";
  }
}
