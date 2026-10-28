/**
 * JalMitra AI - Ten Specialized AI Agents Studio (Module 16)
 * Interactive pipeline studio and execution trace monitor.
 */

import { store } from "../store.js";
import { agentPipeline } from "../agents.js";

export function renderAgentStudio(container) {
  const state = store.getState();
  const logs = agentPipeline.logs.length > 0 ? agentPipeline.logs : getInitialSampleLogs();

  container.innerHTML = `
    <div class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <div>
          <div class="card-title"><span>🤖</span> Ten Specialized AI Decision Agents Studio</div>
          <div class="card-subtitle">Modular, explainable multi-agent architecture governing canal irrigation decisions</div>
        </div>
        <button id="btn-run-pipeline" class="btn btn-teal">
          ▶️ Execute Full 10-Agent Pipeline
        </button>
      </div>

      <!-- Architectural Transparency Callout -->
      <div style="background: var(--surface-alt); border-left: 4px solid var(--info); padding: 0.85rem 1.25rem; border-radius: var(--radius-sm); margin-bottom: 1.5rem; font-size: 0.85rem; line-height: 1.5;">
        <strong>AI Transparency & Explainability Commitment:</strong> All 10 agents operate with deterministic mathematical models, verifiable water-balance conservation, and transparent agronomic rules. No black-box hallucinations. All outputs require human executive sign-off before canal sluices operate.
      </div>

      <!-- Visual 10-Agent Workflow Badges -->
      <div style="display: flex; gap: 0.4rem; overflow-x: auto; margin-bottom: 1.5rem; padding-bottom: 0.5rem; scrollbar-width: thin;">
        ${[
          { num: 1, name: "Farmer Intake", icon: "📥" },
          { num: 2, name: "Crop Demand", icon: "🌱" },
          { num: 3, name: "Water Supply", icon: "🌊" },
          { num: 4, name: "Allocation", icon: "⚖️" },
          { num: 5, name: "GIS Analysis", icon: "🗺️" },
          { num: 6, name: "Compliance", icon: "📜" },
          { num: 7, name: "Dispute Analysis", icon: "🔍" },
          { num: 8, name: "Mediation", icon: "🤝" },
          { num: 9, name: "Scheduler", icon: "🗓️" },
          { num: 10, name: "Reporting & Audit", icon: "🛡️" }
        ].map(a => `
          <div style="flex: 1; min-width: 110px; background: white; border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 0.6rem 0.5rem; text-align: center; box-shadow: var(--shadow-sm);">
            <div style="font-size: 1.25rem; margin-bottom: 0.2rem;">${a.icon}</div>
            <div style="font-size: 0.7rem; font-weight: 700; color: var(--primary);">Agent ${a.num}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${a.name}</div>
          </div>
        `).join("")}
      </div>

      <!-- Execution Trace Log -->
      <h4 style="color: var(--primary); font-size: 1.05rem; margin-bottom: 0.75rem;">
        Coordinated Pipeline Execution Trace (${logs.length} Steps)
      </h4>

      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${logs.map(log => `
          <div style="background: white; border: 1px solid var(--surface-border); border-left: 4px solid var(--teal-accent); border-radius: var(--radius-md); padding: 0.85rem 1rem; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; flex-wrap: wrap; gap: 0.5rem;">
              <div style="font-weight: 700; color: var(--primary); font-size: 0.92rem; display: flex; align-items: center; gap: 0.5rem;">
                ${log.agent}
                <span class="badge badge-success" style="font-size: 0.7rem;">${log.status}</span>
              </div>
              <span style="font-size: 0.75rem; color: var(--text-muted);">
                ⚡ ${log.execution_ms} ms • ${log.timestamp ? log.timestamp.split("T")[1]?.substring(0, 8) : "10:30:15"}
              </span>
            </div>
            <div style="font-size: 0.83rem; color: #475569; margin-bottom: 0.25rem;">
              <strong>Input Context:</strong> ${log.input}
            </div>
            <div style="font-size: 0.85rem; color: #0f172a; background: #f8fafc; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid #e2e8f0;">
              <strong>Decision Output:</strong> ${log.output}
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  // Bind Run Pipeline button
  container.querySelector("#btn-run-pipeline")?.addEventListener("click", () => {
    const farmer = state.farmers[0]; // Ramesh Patil
    const complaintText = "Canal water has completely stopped reaching Gate 5 Niphad for 4 days. Sugarcane crop is wilting in grand growth.";
    
    // Execute live pipeline
    agentPipeline.runFullPipeline(complaintText, farmer, state);
    
    if (window.showToast) {
      window.showToast("All 10 Specialized AI Agents executed coordinated pipeline successfully!", "success");
    }
    renderAgentStudio(container);
  });
}

function getInitialSampleLogs() {
  return [
    {
      timestamp: "2026-10-28T04:30:10Z",
      agent: "Agent 1: Farmer Intake Agent",
      input: "Raw Voice Grievance Transcript from Ramesh Patil (Gate 5 Tail Reach)",
      output: "Extracted: Category 'Downstream Water Shortage', Urgency 'High', Deficit 12.5 T-m3.",
      status: "Success",
      execution_ms: 18
    },
    {
      timestamp: "2026-10-28T04:30:11Z",
      agent: "Agent 2: Crop Demand Agent",
      input: "Sugarcane (Grand Growth stage), 4.0 Acres on Black Cotton soil",
      output: "ETc computed at 81.3 mm gross depth. Demand verified at 25.0 T-m3 (Critical Stage: YES).",
      status: "Success",
      execution_ms: 14
    },
    {
      timestamp: "2026-10-28T04:30:11Z",
      agent: "Agent 3: Water Supply Agent",
      input: "Reservoir live inflow 65.0 T-m3, 12% transit loss, 15% emergency reserve",
      output: "Allocatable usable pool verified at 45.0 T-m3. Water balance strictly preserved.",
      status: "Success",
      execution_ms: 12
    },
    {
      timestamp: "2026-10-28T04:30:12Z",
      agent: "Agent 4: Allocation Agent",
      input: "Supply 45.0 T-m3, 4 competing requests, Agronomic Priority algorithm",
      output: "Distribution computed. Ramesh Patil assigned 18.5 T-m3 (Jain's Fairness: 94.0%).",
      status: "Success",
      execution_ms: 22
    },
    {
      timestamp: "2026-10-28T04:30:12Z",
      agent: "Agent 5: GIS Analysis Agent",
      input: "Gate-5 Niphad at KM 31.0 on GLBC canal network",
      output: "Elevation & friction loss estimated at 14%. Pressure drop anomaly flagged at -45%.",
      status: "Success",
      execution_ms: 16
    },
    {
      timestamp: "2026-10-28T04:30:13Z",
      agent: "Agent 6: Compliance Agent",
      input: "Universal 8-Rule Matrix validation against proposed allocation",
      output: "Rules 1-7 Passed/Verified. Rule 8 (Human Officer Sign-Off) pending authorization.",
      status: "Success",
      execution_ms: 20
    },
    {
      timestamp: "2026-10-28T04:30:13Z",
      agent: "Agent 7: Dispute Analysis Agent",
      input: "Opposing claims: Suresh Shinde (Head - Gate 1) vs Ramesh Patil (Tail - Gate 5)",
      output: "Root cause: Simultaneous draw depresses tail operating pressure below critical head.",
      status: "Success",
      execution_ms: 25
    },
    {
      timestamp: "2026-10-28T04:30:14Z",
      agent: "Agent 8: Mediation Agent",
      input: "3 Feasible compromise formulations (Proportional, Agronomic, Rotational)",
      output: "Recommended: Option 2 (Agronomic Priority + Tail Protection). Accord drafted.",
      status: "Success",
      execution_ms: 24
    },
    {
      timestamp: "2026-10-28T04:30:14Z",
      agent: "Agent 9: Schedule Optimization Agent",
      input: "Warabandi rotation slots and gate capacities across 4 canal sections",
      output: "Rotation schedule updated: Tail Gate 5 assigned dedicated Thursday 06:00 window.",
      status: "Success",
      execution_ms: 19
    },
    {
      timestamp: "2026-10-28T04:30:15Z",
      agent: "Agent 10: Reporting & Audit Agent",
      input: "Mediation accord and schedule updates for DISP-2026-001",
      output: "Cryptographic SHA-256 block hash generated. Bilingual SMS payloads prepared.",
      status: "Success",
      execution_ms: 15
    }
  ];
}
