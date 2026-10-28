/**
 * JalMitra AI - Department Officer Portal & Water Governance Command Center
 * Implements:
 * - Module 6: Water Governance Command Center (Total farmers, Status counts, Water balances, Reach distribution)
 * - Module 7 & Admin Request Review Actions:
 *   1. Approve Request
 *   2. Partially Approve Request
 *   3. Request More Info
 *   4. Reject Request with Reason
 *   5. Refer to Mediation
 *   6. Mark Delivery Completed (records actual volume into farmer's water history)
 * - Telemetry flow adjustments, root-cause grievance analysis, SLA monitor, and Anomaly monitor.
 */

import { store } from "../store.js";
import { t } from "../i18n.js";
import { evaluateEightRules, evaluateThirteenPoints } from "../rules.js";
import { analyzeDemandVsHistory } from "../allocation.js";

export function renderOfficerPortal(container) {
  const state = store.getState();
  const activeSubTab = state.activeOfficerSubTab || "water_intel";

  // Officer info
  const officerUser = state.currentUser && state.currentUser.role === "officer"
    ? state.currentUser
    : (state.officers ? state.officers[0] : { name: "Er. S. Deshmukh", designation: "Executive Engineer", division: "Godavari Left Bank Canal (GLBC) Irrigation Division", station: "Nashik" });

  const pendingCount = state.requests.filter(r => ["Submitted", "Under Review", "Proposed", "More Info Requested"].includes(r.status)).length;

  container.innerHTML = `
    <!-- Top Officer Header -->
    <div class="card" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%); color: white; padding: 1.5rem 1.75rem; margin-bottom: 1.25rem; border: 1px solid rgba(255,255,255,0.12); box-shadow: var(--shadow-md);">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 1.25rem;">
          <div style="width: 58px; height: 58px; background: #0284c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.85rem; border: 3px solid #7dd3fc; box-shadow: 0 4px 10px rgba(0,0,0,0.25);">
            🏛️
          </div>
          <div>
            <div style="font-size: 1.45rem; font-weight: 800; display: flex; align-items: center; gap: 0.6rem; letter-spacing: -0.01em;">
              ${officerUser.name}
              <span class="badge" style="background: rgba(2, 132, 199, 0.45); color: #bae6fd; font-size: 0.78rem; font-weight: 700; border: 1px solid rgba(56, 189, 248, 0.5);">
                ${officerUser.designation || officerUser.role || "Executive Engineer"}
              </span>
              <span class="badge" style="background: #10b981; color: white; font-size: 0.72rem;">
                Authorized Sluice Controller
              </span>
            </div>
            <div style="font-size: 0.88rem; color: #cbd5e1; margin-top: 0.2rem;">
              Division: <strong>${officerUser.division || "GLBC Irrigation Division"}</strong> • Station: <strong>${officerUser.station || "Nashik Head Office"}</strong>
            </div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.2rem;">
              Jurisdiction: <strong>Godavari Left Bank Canal (KM 0.0 - 40.0)</strong> • Sluice Gates: Gate 1 to Gate 6
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
          <button id="btn-officer-quick-approvals" class="btn btn-teal btn-sm" style="font-weight: 700; padding: 0.5rem 1rem;">
            📋 Review Requests (${pendingCount})
          </button>
          <button id="btn-officer-mediation" class="btn btn-secondary btn-sm" style="background: rgba(255,255,255,0.15); color: white; border-color: rgba(255,255,255,0.25);">
            🤝 Mediation Room (${state.disputes.length})
          </button>
          ${state.currentUser ? `
            <button id="btn-officer-logout" class="btn btn-secondary btn-sm" style="background: rgba(239,68,68,0.25); color: #fca5a5; border-color: rgba(239,68,68,0.4);">
              🚪 Sign Out
            </button>
          ` : `
            <span class="demo-pill">⚙️ AUTHORITY DEMO MODE</span>
          `}
        </div>
      </div>
    </div>

    <!-- Officer Sub-Navigation Tabs -->
    <div style="display: flex; gap: 0.4rem; overflow-x: auto; margin-bottom: 1.25rem; padding-bottom: 0.35rem; scrollbar-width: thin;">
      <button class="btn ${activeSubTab === "water_intel" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="water_intel">🌊 Water Governance Command Center</button>
      <button class="btn ${activeSubTab === "approvals" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="approvals">📋 Review Requests (${pendingCount} Pending)</button>
      <button class="btn ${activeSubTab === "complaints" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="complaints">⚠️ Grievance Intelligence (${state.complaints.length})</button>
      <button class="btn ${activeSubTab === "conflicts" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="conflicts">⚔️ Conflict Centre (${state.conflicts.length})</button>
      <button class="btn ${activeSubTab === "sla" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="sla">⏱️ SLA Monitor</button>
      <button class="btn ${activeSubTab === "anomalies" ? "btn-teal" : "btn-secondary"} btn-sm sub-tab-btn" data-tab="anomalies">🚨 Anomaly Monitor (${state.anomalies.length})</button>
    </div>

    <div id="officer-subtab-content" class="animate-fadeIn"></div>
  `;

  // Attach Top Header Action Buttons
  container.querySelector("#btn-officer-quick-approvals")?.addEventListener("click", () => {
    state.activeOfficerSubTab = "approvals";
    renderOfficerPortal(container);
  });

  container.querySelector("#btn-officer-mediation")?.addEventListener("click", () => {
    store.setTab("mediation");
  });

  container.querySelector("#btn-officer-logout")?.addEventListener("click", () => {
    store.logout();
    window.showToast("Signed out from Authority Portal.", "info");
  });

  // Attach subtab switcher
  container.querySelectorAll(".sub-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      state.activeOfficerSubTab = btn.getAttribute("data-tab");
      renderOfficerPortal(container);
    });
  });

  const contentArea = container.querySelector("#officer-subtab-content");
  renderOfficerSection(contentArea, activeSubTab, state, container);
}

function renderOfficerSection(contentArea, tab, state, mainContainer) {
  const res = state.reservoir;

  // =========================================================================
  // SUBTAB 1: WATER GOVERNANCE COMMAND CENTER (Module 6)
  // =========================================================================
  if (tab === "water_intel") {
    const totalFarmers = state.farmers.length;
    const totalRequests = state.requests.length;
    const pendingReqs = state.requests.filter(r => ["Submitted", "Under Review", "Proposed", "More Info Requested"].includes(r.status)).length;
    const approvedReqs = state.requests.filter(r => r.status === "Approved").length;
    const partialReqs = state.requests.filter(r => r.status === "Partially Approved").length;
    const rejectedReqs = state.requests.filter(r => r.status === "Rejected").length;
    const deliveredReqs = state.requests.filter(r => ["Completed", "Completed / Delivered", "Delivered"].includes(r.status)).length;

    const totalDemandedM3 = state.requests.reduce((s, r) => s + parseFloat(r.requested_quantity || 0), 0);
    const totalAllocatedM3 = state.requests.reduce((s, r) => s + parseFloat(r.approved_quantity || r.proposed_quantity || 0), 0);
    const totalDeliveredM3 = (state.water_history || []).reduce((s, h) => s + parseFloat(h.received_qty_m3 || 0), 0);
    const deficitM3 = Math.max(0, totalDemandedM3 - res.allocatable_supply);

    contentArea.innerHTML = `
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <div>
            <div class="card-title"><span>🌊</span> Water Governance Command Center & Reservoir Balance (Module 6)</div>
            <div class="card-subtitle">
              Live telemetry for Godavari Left Bank Canal (GLBC) • Rabi Cycle #4 (${res.cycle_dates})
            </div>
          </div>
          <span class="badge ${deficitM3 > 0 ? 'badge-warning' : 'badge-success'}">
            ${deficitM3 > 0 ? `Command Deficit: -${deficitM3.toFixed(1)} m³` : 'Surplus Usable Supply'}
          </span>
        </div>

        <!-- 8 High-Level Command Metrics -->
        <div class="grid-4" style="margin-bottom: 1.25rem;">
          <div class="stat-box" style="border-top: 3px solid #0d9488;">
            <div class="stat-label">Total Registered Farmers</div>
            <div class="stat-value" style="font-size: 1.45rem; color: #0d9488;">${totalFarmers} Farmers</div>
            <div class="stat-sub">Across 4 Command Villages</div>
          </div>
          <div class="stat-box" style="border-top: 3px solid #0284c7;">
            <div class="stat-label">Net Allocatable Pool</div>
            <div class="stat-value" style="font-size: 1.45rem; color: #0284c7;">${res.allocatable_supply} m³</div>
            <div class="stat-sub">${(res.allocatable_supply * 1000).toLocaleString()} Litres Available</div>
          </div>
          <div class="stat-box" style="border-top: 3px solid #f59e0b;">
            <div class="stat-label">Total Water Demanded</div>
            <div class="stat-value" style="font-size: 1.45rem; color: ${deficitM3 > 0 ? '#dc2626' : '#16532d'};">${totalDemandedM3.toFixed(1)} m³</div>
            <div class="stat-sub">${(totalDemandedM3 * 1000).toLocaleString()} Litres Requested</div>
          </div>
          <div class="stat-box" style="border-top: 3px solid #10b981;">
            <div class="stat-label">Total Water Delivered</div>
            <div class="stat-value" style="font-size: 1.45rem; color: #10b981;">${totalDeliveredM3.toFixed(1)} m³</div>
            <div class="stat-sub">${(totalDeliveredM3 * 1000).toLocaleString()} Litres Fulfilled</div>
          </div>
        </div>

        <!-- Request Lifecycle Status Breakdown -->
        <div style="background: var(--surface-alt); border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.75rem;">
            Irrigation Request Lifecycle Status Breakdown:
          </div>
          <div class="grid-5" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem;">
            <div style="background: white; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); padding: 0.85rem; text-align: center;">
              <div style="font-size: 0.78rem; color: var(--text-muted);">Pending Review</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: #f59e0b;">${pendingReqs}</div>
            </div>
            <div style="background: white; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); padding: 0.85rem; text-align: center;">
              <div style="font-size: 0.78rem; color: var(--text-muted);">Fully Approved</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: #10b981;">${approvedReqs}</div>
            </div>
            <div style="background: white; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); padding: 0.85rem; text-align: center;">
              <div style="font-size: 0.78rem; color: var(--text-muted);">Partially Approved</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: #0284c7;">${partialReqs}</div>
            </div>
            <div style="background: white; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); padding: 0.85rem; text-align: center;">
              <div style="font-size: 0.78rem; color: var(--text-muted);">Delivered / Fulfilled</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: #059669;">${deliveredReqs}</div>
            </div>
            <div style="background: white; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); padding: 0.85rem; text-align: center;">
              <div style="font-size: 0.78rem; color: var(--text-muted);">Rejected</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: #ef4444;">${rejectedReqs}</div>
            </div>
          </div>
        </div>

        <!-- Interactive Canal Discharge Slider -->
        <div style="background: #f8fafc; border: 1px solid var(--surface-border); padding: 1.5rem; border-radius: var(--radius-lg); margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <div>
              <strong style="color: var(--primary); font-size: 1rem;">🎛️ Interactive Canal Discharge Telemetry Adjustment Slider</strong>
              <div style="font-size: 0.82rem; color: var(--text-muted);">
                Simulate gate adjustments at headworks (recalculates allocatable pool in real-time)
              </div>
            </div>
            <div style="font-size: 1.25rem; font-weight: 800; color: #0d9488;">
              <span id="flow-display-val">${res.current_head_flow_cusecs}</span> cusecs
            </div>
          </div>

          <input type="range" id="flow-range-slider" min="50" max="150" step="5" value="${res.current_head_flow_cusecs}" style="width: 100%; height: 8px; border-radius: 5px; accent-color: #0d9488; cursor: pointer;">

          <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
            <span>50 cusecs (Severe Drought)</span>
            <span>100 cusecs (Moderate Deficit)</span>
            <span>115 cusecs (Baseline)</span>
            <span>150 cusecs (Full Design Capacity)</span>
          </div>
        </div>

        <!-- 6 Distributary Sluice Gates Status Grid -->
        <h4 style="color: var(--primary); margin-bottom: 0.75rem;">Canal Distributary Gates Telemetry</h4>
        <div class="grid-3">
          ${state.gates.map(g => `
            <div class="card" style="margin-bottom: 0; border-top: 3px solid ${g.anomaly ? '#ef4444' : '#0d9488'};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <strong>${g.id}: ${g.name}</strong>
                <span class="badge ${g.anomaly ? 'badge-danger' : 'badge-success'}">${g.status}</span>
              </div>
              <div style="font-size: 0.85rem; line-height: 1.6;">
                <div>Reach: <strong>${g.reach} Reach</strong> (${g.distance_km} km)</div>
                <div>Discharge: <strong>${g.flow_cusecs} cusecs</strong></div>
                ${g.anomaly ? `
                  <div style="margin-top: 0.5rem; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 0.4rem; border-radius: var(--radius-sm); font-size: 0.76rem;">
                    🚨 ${g.anomaly_note}
                  </div>
                ` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    const slider = contentArea.querySelector("#flow-range-slider");
    const display = contentArea.querySelector("#flow-display-val");
    slider?.addEventListener("input", (e) => {
      display.innerText = e.target.value;
    });
    slider?.addEventListener("change", (e) => {
      store.updateCanalFlow(parseFloat(e.target.value));
      window.showToast(`Main canal flow updated to ${e.target.value} cusecs. Recalculated allocation pool: ${store.getState().reservoir.allocatable_supply} m³`, "info");
      renderOfficerPortal(mainContainer);
    });
  }

  // =========================================================================
  // SUBTAB 2: WATER REQUEST APPROVALS & DECISION CONSOLE (Module 7 & Actions)
  // =========================================================================
  else if (tab === "approvals") {
    renderApprovalsSubtab(contentArea, state, mainContainer);
  }

  // =========================================================================
  // SUBTAB 3: GRIEVANCE ROOT-CAUSE ANALYSIS (Phase 12)
  // =========================================================================
  else if (tab === "complaints") {
    renderGrievanceIntelligenceSubtab(contentArea, state);
  }

  // =========================================================================
  // SUBTAB 4: CONFLICT DETECTION (Phase 13)
  // =========================================================================
  else if (tab === "conflicts") {
    renderConflictsSubtab(contentArea, state);
  }

  // =========================================================================
  // SUBTAB 5: SLA MONITOR (Phase 17)
  // =========================================================================
  else if (tab === "sla") {
    renderSlaMonitorSubtab(contentArea, state);
  }

  // =========================================================================
  // SUBTAB 6: HYDRAULIC ANOMALIES (Phase 18)
  // =========================================================================
  else if (tab === "anomalies") {
    renderAnomaliesSubtab(contentArea, state);
  }
}

// =========================================================================
// HELPER: RENDER REQUEST APPROVALS & ACTIONS (6 Official Actions)
// =========================================================================
function renderApprovalsSubtab(contentArea, state, mainContainer) {
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title"><span>📋</span> Irrigation Request Review & Authority Decision Console</div>
          <div class="card-subtitle">
            AI Recommends. Humans Govern. Six official administrative actions under statutory 8-Rule compliance.
          </div>
        </div>
        <span class="badge badge-info">${state.requests.length} Total Requests</span>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        ${state.requests.map(req => {
          const rules = evaluateEightRules(req, state.reservoir);
          const points = evaluateThirteenPoints(req, state.reservoir);
          const farmer = state.farmers.find(f => f.id === req.farmer_id) || { village: "Niphad", gat_no: "142/2A", reach: "Tail" };
          const fHistory = (state.water_history || []).filter(h => h.farmer_id === req.farmer_id);
          const analysis = analyzeDemandVsHistory(req, fHistory, state.reservoir.allocatable_supply);

          return `
            <div style="border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1.25rem; background: var(--surface-alt);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                <div>
                  <h4 style="color: var(--primary); font-size: 1.15rem; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                    ${req.id} • ${req.farmer_name} (${req.farmer_id})
                    <span class="badge ${getStatusBadge(req.status)}">${req.status}</span>
                  </h4>
                  <div style="font-size: 0.85rem; color: var(--text-muted);">
                    📍 ${farmer.village} (Gat ${farmer.gat_no}) • Assigned: <strong>${req.gate_id}</strong> (${farmer.reach} Reach) • Crop: <strong>${req.crop} (${req.growth_stage})</strong> • Area: <strong>${req.farm_area_acres} Acres</strong>
                  </div>
                </div>

                <div style="text-align: right;">
                  <div style="font-size: 1.2rem; font-weight: 800; color: #0d9488;">
                    Req: ${req.requested_quantity} m³
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">
                    (${(req.requested_quantity * 1000).toLocaleString()} Litres)
                  </div>
                </div>
              </div>

              <!-- Demand Analysis Comparison Banner -->
              <div style="background: white; border: 1px solid #99f6e4; border-radius: var(--radius-sm); padding: 0.75rem 1rem; margin-bottom: 0.75rem; font-size: 0.85rem; line-height: 1.55;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                  <div>
                    <strong>Historical Comparison:</strong> Previously received: <strong>${analysis.previous_received_m3} m³</strong> (${analysis.previous_received_litres.toLocaleString()} L in ${analysis.previous_season}).
                    Difference: <strong style="color: ${analysis.difference_from_previous_m3 > 0 ? '#b45309' : '#059669'};">${analysis.difference_from_previous_m3 >= 0 ? '+' : ''}${analysis.difference_from_previous_m3} m³ (${analysis.percentage_change >= 0 ? '+' : ''}${analysis.percentage_change}%)</strong>.
                  </div>
                  <span class="badge ${analysis.agronomic_badge === 'success' ? 'badge-success' : 'badge-warning'}">
                    ${analysis.agronomic_status}
                  </span>
                </div>
                <div style="font-size: 0.78rem; color: #047857; margin-top: 0.25rem;">
                  Theoretical FAO-56 Penman-Monteith gross crop requirement: <strong>${analysis.agronomic_gross_m3} m³</strong> (${Math.round(analysis.agronomic_gross_litres).toLocaleString()} L).
                </div>
              </div>

              <div style="background: white; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); padding: 0.75rem; font-size: 0.82rem; margin-bottom: 0.75rem;">
                <strong>Farmer Justification:</strong> ${req.reason || 'Routine supplemental turn.'}
              </div>

              <!-- Collapsible 8-Rule & 13-Point Check -->
              <details style="margin-bottom: 1rem; background: white; border: 1px solid var(--surface-border); border-radius: var(--radius-sm); padding: 0.75rem;">
                <summary style="font-weight: 700; color: var(--primary); cursor: pointer; font-size: 0.85rem;">
                  🔍 Inspect Statutory 8-Rule Compliance & 13-Point Matrix for ${req.id}
                </summary>
                <div class="grid-2" style="margin-top: 0.75rem; font-size: 0.8rem;">
                  <div>
                    <h5 style="color: var(--primary); margin-bottom: 0.35rem;">8-Rule Verification Results</h5>
                    ${rules.map(r => `
                      <div style="display: flex; justify-content: space-between; padding: 0.25rem 0.5rem; border-bottom: 1px solid #f1f5f9;">
                        <span>${r.rule_num}. ${r.name}</span>
                        <span class="badge ${r.badge_class}">${r.status}</span>
                      </div>
                    `).join("")}
                  </div>
                  <div>
                    <h5 style="color: var(--primary); margin-bottom: 0.35rem;">13-Point Decision Matrix</h5>
                    <div style="max-height: 180px; overflow-y: auto;">
                      ${points.map(p => `
                        <div style="display: flex; justify-content: space-between; padding: 0.2rem 0.5rem; border-bottom: 1px solid #f1f5f9;">
                          <span>${p.label}: <strong>${p.value}</strong></span>
                          <span style="color: #059669; font-weight: 600;">${p.status}</span>
                        </div>
                      `).join("")}
                    </div>
                  </div>
                </div>
              </details>

              <!-- Six Official Administrative Actions Bar -->
              <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; background: #f8fafc; padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--surface-border);">
                <div style="display: flex; align-items: center; gap: 0.35rem; margin-right: 0.5rem;">
                  <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-main);">Qty:</span>
                  <input type="number" step="0.5" id="action-qty-${req.id}" class="form-control" style="width: 85px; padding: 0.3rem 0.5rem; font-size: 0.85rem;" value="${req.proposed_quantity || req.requested_quantity}" />
                  <span style="font-size: 0.75rem; color: var(--text-muted);">m³</span>
                </div>

                <!-- Action 1: Approve -->
                <button class="btn btn-teal btn-sm btn-act-approve" data-id="${req.id}">
                  ✅ Approve
                </button>

                <!-- Action 2: Partially Approve -->
                <button class="btn btn-secondary btn-sm btn-act-partial" data-id="${req.id}" style="background: white; border: 1px solid #0284c7; color: #0284c7; font-weight: 600;">
                  ⚠️ Partial Quota
                </button>

                <!-- Action 3: Request More Info -->
                <button class="btn btn-secondary btn-sm btn-act-info" data-id="${req.id}" style="background: white; border: 1px solid #f59e0b; color: #b45309; font-weight: 600;">
                  ❓ Request Info
                </button>

                <!-- Action 4: Reject -->
                <button class="btn btn-danger btn-sm btn-act-reject" data-id="${req.id}">
                  ❌ Reject
                </button>

                <!-- Action 5: Refer to Mediation -->
                <button class="btn btn-secondary btn-sm btn-act-mediate" data-id="${req.id}" style="background: #fdf2f8; border: 1px solid #f472b6; color: #9d174d; font-weight: 600;">
                  🤝 Refer Mediation
                </button>

                <!-- Action 6: Mark Delivery Completed -->
                <button class="btn btn-sm btn-act-delivered" data-id="${req.id}" style="background: #10b981; color: white; font-weight: 700; margin-left: auto;">
                  💧 Mark Delivered
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;

  // Action 1: Approve
  contentArea.querySelectorAll(".btn-act-approve").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const qty = contentArea.querySelector(`#action-qty-${id}`)?.value;
      const remarks = prompt("Enter officer approval remarks:", "Approved under Agronomic Criticality and Tail Preservation Policy.");
      if (remarks === null) return;
      await store.executeRequestAction(id, "approve", { approved_quantity: qty, remarks });
      window.showToast(`Request ${id} approved for ${qty} m³!`, "success");
      renderOfficerPortal(mainContainer);
    });
  });

  // Action 2: Partial
  contentArea.querySelectorAll(".btn-act-partial").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const qty = contentArea.querySelector(`#action-qty-${id}`)?.value;
      const remarks = prompt("Enter partial rationing reason:", "Partially approved under reach conveyance constraint.");
      if (remarks === null) return;
      await store.executeRequestAction(id, "partial", { approved_quantity: qty, remarks });
      window.showToast(`Request ${id} partially approved for ${qty} m³!`, "info");
      renderOfficerPortal(mainContainer);
    });
  });

  // Action 3: Request More Info
  contentArea.querySelectorAll(".btn-act-info").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const inquiry = prompt("Specify the information required from farmer:", "Please upload photograph of soil crack formation or clarify borewell status.");
      if (!inquiry) return;
      await store.executeRequestAction(id, "request_info", { remarks: inquiry });
      window.showToast(`Inquiry sent to farmer for request ${id}.`, "info");
      renderOfficerPortal(mainContainer);
    });
  });

  // Action 4: Reject
  contentArea.querySelectorAll(".btn-act-reject").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const reason = prompt("Enter mandatory statutory rejection reason:", "Seasonal allocation quota exceeded under Rule 5.");
      if (!reason) return;
      await store.executeRequestAction(id, "reject", { remarks: reason });
      window.showToast(`Request ${id} rejected.`, "error");
      renderOfficerPortal(mainContainer);
    });
  });

  // Action 5: Refer to Mediation
  contentArea.querySelectorAll(".btn-act-mediate").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const reason = prompt("Enter dispute context for Mediation referral:", "Upstream draw conflict with Gate 1; referred for compromise formulation.");
      if (reason === null) return;
      await store.executeRequestAction(id, "refer_mediation", { remarks: reason });
      window.showToast(`Request ${id} referred to 4-stage Mediation Room!`, "success");
      store.setTab("mediation");
    });
  });

  // Action 6: Mark Delivery Completed
  contentArea.querySelectorAll(".btn-act-delivered").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const qty = contentArea.querySelector(`#action-qty-${id}`)?.value;
      const code = prompt("Enter Sluice Gatekeeper verification code:", "GK-NIPHAD-05");
      if (!code) return;
      await store.executeRequestAction(id, "mark_delivered", {
        delivered_quantity_m3: qty,
        delivery_date: new Date().toISOString().split("T")[0],
        duration_hours: 8.0,
        gatekeeper_id: code,
        remarks: "Turn verified delivered into field furrow by Sluice Gatekeeper."
      });
      window.showToast(`Delivery recorded for ${id}! Appended into farmer's water history.`, "success");
      renderOfficerPortal(mainContainer);
    });
  });
}

function renderGrievanceIntelligenceSubtab(contentArea, state) {
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><span>⚠️</span> Grievance Intelligence & Root-Cause Analysis (Phase 12)</div>
        <div class="card-subtitle">Distinguishes: Observed Fact, Reported Info, Inferred Possibility, and Unverified Hypothesis</div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        ${state.complaints.map(cmp => `
          <div style="border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1.25rem; background: var(--surface-alt); border-left: 4px solid #ef4444;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <strong style="font-size: 1.1rem; color: var(--primary);">${cmp.id}: ${cmp.category}</strong>
                <div style="font-size: 0.82rem; color: var(--text-muted);">
                  Logged by <strong>${cmp.farmer_name}</strong> (${cmp.farmer_id}) at <strong>${cmp.gate_id}</strong>
                </div>
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <span class="badge ${getStatusBadge(cmp.status)}">${cmp.status}</span>
                <span class="badge badge-warning">SLA: ${cmp.elapsed_hours}h / ${cmp.sla_target_hours}h</span>
              </div>
            </div>
            <p style="font-size: 0.88rem; margin-bottom: 0.75rem; color: var(--text-main);">${cmp.description}</p>
            <div class="grid-2" style="font-size: 0.82rem; background: white; padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--surface-border); margin-bottom: 0.75rem;">
              <div>
                <div style="color: #0284c7; font-weight: 700;">📡 Telemetry & Reported Fact:</div>
                <div>${cmp.evidence_type}</div>
                <div>Gate Current Flow: <strong>12.0 cusecs</strong> (Target: 22.0 cusecs)</div>
              </div>
              <div>
                <div style="color: #d97706; font-weight: 700;">🧠 AI Inferred Root Cause:</div>
                <div>${cmp.suspected_cause}</div>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderConflictsSubtab(contentArea, state) {
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><span>⚔️</span> Conflict Detection Centre (Phase 13)</div>
        <div class="card-subtitle">Algorithmic scanner detecting overlapping delivery turns & tail-end starvation risks</div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${state.conflicts.map(cnf => `
          <div style="border: 1px solid #fde68a; border-radius: var(--radius-md); padding: 1.25rem; background: #fffbeb; border-left: 4px solid #f59e0b;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <div>
                <strong style="font-size: 1.1rem; color: #92400e;">${cnf.id}: ${cnf.title}</strong>
                <div style="font-size: 0.82rem; color: #78350f;">
                  Affected Gates: ${cnf.gate_ids.join(", ")} • Deficit: ${cnf.water_deficit_thousand_m3} m³
                </div>
              </div>
              <span class="badge badge-warning">${cnf.status}</span>
            </div>
            <p style="font-size: 0.88rem; margin-bottom: 0.75rem; color: #78350f;">${cnf.summary}</p>
            <div style="background: white; border: 1px solid #fde68a; border-radius: var(--radius-sm); padding: 0.75rem; font-size: 0.82rem; margin-bottom: 0.75rem;">
              <strong>Suggested Resolution:</strong> ${cnf.suggested_resolution}
            </div>
            <button class="btn btn-teal btn-sm" onclick="window.location.hash='#mediation'; location.reload();">
              🤝 Open in Multi-Farmer Mediation Centre
            </button>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderSlaMonitorSubtab(contentArea, state) {
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><span>⏱️</span> Service Level Agreement (SLA) & Grievance Deadlines</div>
        <div class="card-subtitle">Target Resolution Commitment: 48h / 72h</div>
      </div>
      <div class="grid-4" style="margin-bottom: 1.25rem;">
        <div class="stat-box">
          <div class="stat-label">Total Grievances</div>
          <div class="stat-value">${state.complaints.length}</div>
          <div class="stat-sub">Across command area</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Under Investigation</div>
          <div class="stat-value" style="color: #0284c7;">1</div>
          <div class="stat-sub">Within SLA window</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Overdue Items</div>
          <div class="stat-value" style="color: #16532d;">0</div>
          <div class="stat-sub">100% On-Track Compliance</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Average Resolution Time</div>
          <div class="stat-value" style="color: #0d9488;">28.5 hrs</div>
          <div class="stat-sub">Benchmark: 48.0 hrs</div>
        </div>
      </div>
    </div>
  `;
}

function renderAnomaliesSubtab(contentArea, state) {
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title"><span>🚨</span> Hydraulic & Conveyance Anomaly Monitor</div>
        <div class="card-subtitle">Identifies sudden pressure drops, unauthorized drawdowns, and transit seepage</div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${state.anomalies.map(anm => `
          <div style="border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1.25rem; background: var(--surface-alt); border-left: 4px solid #ef4444;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <div>
                <strong style="font-size: 1.05rem; color: var(--primary);">${anm.id}: ${anm.title} (${anm.gate_id})</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${anm.timestamp}</div>
              </div>
              <span class="badge badge-danger">${anm.difference}</span>
            </div>
            <div class="grid-2" style="font-size: 0.85rem; background: white; padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--surface-border); margin-bottom: 0.75rem;">
              <div>Observed Flow: <strong>${anm.observed_value}</strong></div>
              <div>Expected Baseline Flow: <strong>${anm.expected_value}</strong></div>
            </div>
            <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem;">
              <strong>Suggested Action:</strong> ${anm.suggested_investigation}
            </p>
            <button class="btn btn-secondary btn-sm" onclick="alert('Acknowledged anomaly ${anm.id}. Field inspection dispatched.')">
              ✓ Acknowledge & Assign Patrol
            </button>
          </div>
        `).join("")}
      </div>
    </div>
  `;
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
