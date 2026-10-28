/**
 * JalMitra AI - Universal Eight-Rule Statutory Compliance Matrix (Module 9 & 17)
 * Configurable rule-engine interface for water-allocation and dispute-resolution checks.
 * Authorized administrators can adjust thresholds and test compliance in real-time.
 */

import { store } from "../store.js";
import { evaluateEightRules } from "../rules.js";

export function renderRulesMatrix(container) {
  const state = store.getState();
  const sampleRequest = state.requests[0];
  const rules = evaluateEightRules(sampleRequest, state.reservoir);
  const cfg = state.rulesConfig || {};

  container.innerHTML = `
    <div class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <div>
          <div class="card-title"><span>⚖️</span> Universal Eight-Rule Statutory Compliance Matrix</div>
          <div class="card-subtitle">Transparent engineering & administrative rules for lawful water allocation and dispute resolution</div>
        </div>
        <span class="badge badge-info">Rule Engine v2.4 Active</span>
      </div>

      <!-- Legal Context Callout -->
      <div style="background: var(--surface-alt); border-left: 4px solid var(--teal-accent); padding: 1rem 1.25rem; border-radius: var(--radius-sm); margin-bottom: 1.5rem; font-size: 0.85rem; line-height: 1.6;">
        <strong style="color: var(--primary);">Statutory Context & Administrative Scope:</strong>
        These 8 compliance checks encode standard operational rules derived from state irrigation codes, Central Water Commission volumetric norms, and local Warabandi rotation guidelines. They ensure that every automated recommendation is auditable, non-discriminatory, and subject to human executive approval before execution.
      </div>

      <!-- Interactive 8 Rules Table -->
      <div style="overflow-x: auto; margin-bottom: 2rem;">
        <table class="table" style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 0.75rem; width: 60px;">Rule #</th>
              <th style="padding: 0.75rem;">Rule Name & Statutory Objective</th>
              <th style="padding: 0.75rem;">Validation Logic</th>
              <th style="padding: 0.75rem;">Status</th>
              <th style="padding: 0.75rem;">Compliance Details & Corrective Action</th>
            </tr>
          </thead>
          <tbody>
            ${rules.map(r => `
              <tr style="border-bottom: 1px solid var(--surface-border);">
                <td style="padding: 0.75rem; font-weight: 800; color: var(--primary); text-align: center;">${r.rule_num}</td>
                <td style="padding: 0.75rem;">
                  <strong style="color: var(--primary);">${r.name}</strong><br>
                  <span style="font-size: 0.78rem; color: var(--text-muted); font-style: italic;">
                    Ref: State Irrigation Manual / Model Canal Governance Code
                  </span>
                </td>
                <td style="padding: 0.75rem; font-size: 0.82rem; color: #334155;">
                  ${getValidationLogicText(r.rule_num)}
                </td>
                <td style="padding: 0.75rem;">
                  <span class="badge ${r.badge_class || (r.status === 'Passed' ? 'badge-success' : (r.status === 'Failed' ? 'badge-danger' : 'badge-warning'))}">
                    ${r.status}
                  </span>
                </td>
                <td style="padding: 0.75rem; font-size: 0.83rem;">
                  <div>${r.explanation}</div>
                  ${r.missing_info ? `<div style="color: #dc2626; margin-top: 0.25rem;"><strong>Missing:</strong> ${r.missing_info}</div>` : ''}
                  <div style="color: var(--teal-dark); margin-top: 0.25rem; font-weight: 600;">Action: ${r.action}</div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <!-- Configurable Rule Thresholds (Administrative Controls) -->
      <div style="background: white; border: 2px solid var(--surface-border); border-radius: var(--radius-lg); padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
          <h4 style="color: var(--primary); font-size: 1.1rem;">
            🛠️ Administrator Rule Parameter Configuration
          </h4>
          <span style="font-size: 0.8rem; color: var(--text-muted);">
            Changes logged in SHA-256 audit chain
          </span>
        </div>

        <div class="grid-3" style="gap: 1.25rem; margin-bottom: 1.5rem;">
          <div class="stat-box">
            <label class="form-label">Rule 4: Max Duty Ceiling per Acre</label>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
              <input type="range" id="cfg-max-acre" min="3.0" max="10.0" step="0.5" value="${cfg.rule4_max_per_acre || 6.0}" style="width: 100%; accent-color: var(--teal-accent);">
              <span id="cfg-max-acre-val" style="font-weight: 700; color: #0d9488; min-width: 45px;">${cfg.rule4_max_per_acre || 6.0}</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Thousand m3 per acre per cycle</div>
          </div>

          <div class="stat-box">
            <label class="form-label">Rule 5: Seasonal Quota Ceiling</label>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
              <input type="range" id="cfg-seasonal" min="6.0" max="20.0" step="1.0" value="${cfg.rule5_seasonal_quota_per_acre || 12.0}" style="width: 100%; accent-color: var(--teal-accent);">
              <span id="cfg-seasonal-val" style="font-weight: 700; color: #0d9488; min-width: 45px;">${cfg.rule5_seasonal_quota_per_acre || 12.0}</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Thousand m3 per acre per season</div>
          </div>

          <div class="stat-box">
            <label class="form-label">Rule 6: Mandatory Emergency Reserve</label>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.25rem;">
              <input type="range" id="cfg-reserve" min="5" max="30" step="1" value="${cfg.rule6_min_emergency_reserve_pct || 10}" style="width: 100%; accent-color: var(--teal-accent);">
              <span id="cfg-reserve-val" style="font-weight: 700; color: #0d9488; min-width: 45px;">${cfg.rule6_min_emergency_reserve_pct || 10}%</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Protected non-negotiable drinking pool</div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button id="btn-save-rules" class="btn btn-teal">
            💾 Save & Apply Rule Parameters
          </button>
        </div>
      </div>
    </div>
  `;

  // Slider bindings
  const r4Slider = container.querySelector("#cfg-max-acre");
  const r4Val = container.querySelector("#cfg-max-acre-val");
  r4Slider?.addEventListener("input", (e) => { r4Val.textContent = e.target.value; });

  const r5Slider = container.querySelector("#cfg-seasonal");
  const r5Val = container.querySelector("#cfg-seasonal-val");
  r5Slider?.addEventListener("input", (e) => { r5Val.textContent = e.target.value; });

  const r6Slider = container.querySelector("#cfg-reserve");
  const r6Val = container.querySelector("#cfg-reserve-val");
  r6Slider?.addEventListener("input", (e) => { r6Val.textContent = e.target.value + "%"; });

  container.querySelector("#btn-save-rules")?.addEventListener("click", async () => {
    const updated = {
      rule4_max_per_acre: parseFloat(r4Slider.value),
      rule5_seasonal_quota_per_acre: parseFloat(r5Slider.value),
      rule6_min_emergency_reserve_pct: parseFloat(r6Slider.value)
    };
    await store.updateRulesConfig(updated);
    if (window.showToast) {
      window.showToast("Compliance thresholds updated and recorded in SHA-256 audit chain.", "success");
    }
    renderRulesMatrix(container);
  });
}

function getValidationLogicText(ruleNum) {
  switch (ruleNum) {
    case 1: return "Verify registered farmer identity exists & demand volume > 0";
    case 2: return "Verify farm Gat number maps to active canal distributary (Gates 1-6)";
    case 3: return "Match crop & growth stage with standard agronomic Kc coefficients";
    case 4: return "Enforce maximum duty threshold (Vol <= Acreage × Max Duty Limit)";
    case 5: return "Track prior seasonal delivery (Prior + Request <= Seasonal Quota)";
    case 6: return "Ensure Allocatable Supply >= Request & Emergency Reserve is conserved";
    case 7: return "Prioritize tail-reach vulnerable gates; throttle head overdraw";
    case 8: return "Mandatory digital sign-off by Sectional / Executive Officer";
    default: return "Validation check";
  }
}
