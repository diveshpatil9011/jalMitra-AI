/**
 * JalMitra AI - "What If?" Water Allocation Simulator
 * Interactive hydraulic scenario laboratory with dynamic sliders and presets (Phase 15).
 */

import { store } from "../store.js";
import { computeWaterBalance, runAllocation } from "../allocation.js";

export function renderSimulator(container) {
  const state = store.getState();

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title"><span>🧪</span> "What If?" Water Allocation Simulator</div>
          <div class="card-subtitle">Test hydraulic stress scenarios, drought curtailments, and breach loss impacts in real time</div>
        </div>
        <span class="badge badge-info">Interactive Laboratory</span>
      </div>

      <!-- Quick Scenario Presets -->
      <div style="background: var(--surface-alt); padding: 1rem 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--surface-border); margin-bottom: 1.5rem;">
        <div style="font-weight: 700; color: var(--primary); font-size: 0.88rem; margin-bottom: 0.5rem;">
          Load Scenario Preset:
        </div>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-sm preset-btn" data-inflow="75" data-loss="10" data-reserve="15">
            🟢 Normal Monsoonal Supply (75 T-m3, 10% loss)
          </button>
          <button class="btn btn-secondary btn-sm preset-btn" data-inflow="40" data-loss="12" data-reserve="20">
            🟠 Rabi Drought Stress (40 T-m3, 20% reserve)
          </button>
          <button class="btn btn-secondary btn-sm preset-btn" data-inflow="60" data-loss="28" data-reserve="15">
            🔴 Embankment Breach / Seepage (28% transit loss)
          </button>
        </div>
      </div>

      <!-- Sliders Grid -->
      <div class="grid-3" style="margin-bottom: 1.5rem;">
        <div class="stat-box">
          <div style="display: flex; justify-content: space-between;">
            <span class="stat-label">Canal Cycle Inflow</span>
            <strong id="sim-inflow-val" style="color: #0d9488;">65.0 T-m3</strong>
          </div>
          <input type="range" id="sim-inflow" min="30" max="100" step="1" value="65" style="width: 100%; accent-color: #0d9488; margin-top: 0.5rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Volume entering main headworks</div>
        </div>

        <div class="stat-box">
          <div style="display: flex; justify-content: space-between;">
            <span class="stat-label">Transit Conveyance Loss</span>
            <strong id="sim-loss-val" style="color: #f59e0b;">12.0 %</strong>
          </div>
          <input type="range" id="sim-loss" min="5" max="35" step="1" value="12" style="width: 100%; accent-color: #f59e0b; margin-top: 0.5rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Seepage, evaporation & breach losses</div>
        </div>

        <div class="stat-box">
          <div style="display: flex; justify-content: space-between;">
            <span class="stat-label">Mandatory Emergency Reserve</span>
            <strong id="sim-reserve-val" style="color: #0284c7;">15.0 %</strong>
          </div>
          <input type="range" id="sim-reserve" min="10" max="25" step="1" value="15" style="width: 100%; accent-color: #0284c7; margin-top: 0.5rem;">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Protected drinking & ecological quota</div>
        </div>
      </div>

      <!-- Live Dynamic Output Panel -->
      <div id="sim-output-panel"></div>
    </div>
  `;

  const inflowSlider = container.querySelector("#sim-inflow");
  const lossSlider = container.querySelector("#sim-loss");
  const reserveSlider = container.querySelector("#sim-reserve");

  function recalculate() {
    const inflow = parseFloat(inflowSlider.value);
    const loss = parseFloat(lossSlider.value);
    const reserve = parseFloat(reserveSlider.value);

    container.querySelector("#sim-inflow-val").innerText = `${inflow.toFixed(1)} T-m3`;
    container.querySelector("#sim-loss-val").innerText = `${loss.toFixed(1)} %`;
    container.querySelector("#sim-reserve-val").innerText = `${reserve.toFixed(1)} %`;

    const balance = computeWaterBalance(inflow, loss, reserve);
    const allocRes = runAllocation(balance.allocatableSupply, state.requests, "AGRONOMIC");

    const out = container.querySelector("#sim-output-panel");
    out.innerHTML = `
      <!-- Conservation Balance Bar -->
      <div style="margin-bottom: 1.5rem;">
        <h4 style="color: var(--primary); margin-bottom: 0.5rem;">Water Balance Conservation Law</h4>
        <div style="height: 28px; width: 100%; border-radius: var(--radius-sm); overflow: hidden; display: flex; font-size: 0.75rem; font-weight: 700; color: white; text-align: center; line-height: 28px;">
          <div style="width: ${loss}%; background: #f59e0b;" title="Transit Loss">
            Loss (${loss}%)
          </div>
          <div style="width: ${reserve}%; background: #0284c7;" title="Emergency Reserve">
            Reserve (${reserve}%)
          </div>
          <div style="width: ${100 - loss - reserve}%; background: #10b981;" title="Net Allocatable Pool">
            Net Allocatable Pool: ${balance.allocatableSupply} T-m3 (${(100 - loss - reserve).toFixed(0)}%)
          </div>
        </div>
      </div>

      <!-- Key Outcomes -->
      <div class="grid-4" style="margin-bottom: 1.5rem;">
        <div class="stat-box">
          <div class="stat-label">Conveyance Lost</div>
          <div class="stat-value" style="color: #f59e0b;">${balance.transitLoss} T-m3</div>
          <div class="stat-sub">Seepage & evaporation</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Protected Reserve</div>
          <div class="stat-value" style="color: #0284c7;">${balance.emergencyReserve} T-m3</div>
          <div class="stat-sub">Drinking / Ecological</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Allocatable Pool</div>
          <div class="stat-value" style="color: #10b981;">${balance.allocatableSupply} T-m3</div>
          <div class="stat-sub">Distributed to farms</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Unmet Farm Demand</div>
          <div class="stat-value" style="color: ${allocRes.unmetDemand > 0 ? '#ef4444' : '#10b981'};">${allocRes.unmetDemand} T-m3</div>
          <div class="stat-sub">Demand: ${allocRes.totalRequested} T-m3</div>
        </div>
      </div>

      <!-- Gate Impact Table -->
      <h4 style="color: var(--primary); margin-bottom: 0.5rem;">Simulated Gate Distribution Impact (Agronomic Priority)</h4>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Gate</th>
              <th>Farmer</th>
              <th>Crop</th>
              <th>Requested</th>
              <th>Simulated Allocation</th>
              <th>Unmet Deficit</th>
              <th>Ratio</th>
              <th>Delivery Status</th>
            </tr>
          </thead>
          <tbody>
            ${allocRes.allocations.map(a => `
              <tr>
                <td><strong>${a.gate_id}</strong></td>
                <td>${a.farmer_name}</td>
                <td>${a.crop}</td>
                <td>${a.requested_quantity} T-m3</td>
                <td><strong style="color: #0d9488;">${a.proposed_quantity} T-m3</strong></td>
                <td style="color: ${a.unmet_demand > 0 ? '#dc2626' : '#059669'};">${a.unmet_demand} T-m3</td>
                <td>${a.allocation_ratio}%</td>
                <td><span class="badge ${a.proposed_quantity > 0 ? 'badge-success' : 'badge-danger'}">${a.proposed_quantity > 0 ? 'Discharge Active' : 'Starvation Alert'}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  inflowSlider?.addEventListener("input", recalculate);
  lossSlider?.addEventListener("input", recalculate);
  reserveSlider?.addEventListener("input", recalculate);

  container.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      inflowSlider.value = btn.getAttribute("data-inflow");
      lossSlider.value = btn.getAttribute("data-loss");
      reserveSlider.value = btn.getAttribute("data-reserve");
      recalculate();
    });
  });

  recalculate();
}
