/**
 * JalMitra AI - Irrigation Scheduler Component (Module 12)
 * Warabandi cyclic rotation planner, time-slot conflict detector,
 * upstream-to-downstream scheduling, and schedule modification workflow.
 */

import { store } from "../store.js";
import { t } from "../i18n.js";

export function renderScheduler(container) {
  const state = store.getState();
  const schedules = state.schedules || [];
  
  // Calculate overlaps/conflicts
  const conflicts = [];
  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      if (schedules[i].date === schedules[j].date && schedules[i].window === schedules[j].window) {
        conflicts.push({ s1: schedules[i], s2: schedules[j] });
      }
    }
  }

  container.innerHTML = `
    <div class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <div>
          <div class="card-title"><span>🗓️</span> Warabandi Irrigation Rotation Scheduler</div>
          <div class="card-subtitle">Cyclic rotation planner balancing upstream drawdowns with tail-reach pressure delivery</div>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span class="badge ${conflicts.length > 0 ? 'badge-danger' : 'badge-success'}">
            ${conflicts.length > 0 ? `⚠️ ${conflicts.length} Overlapping Slot Conflict` : '🟢 Zero Schedule Conflicts'}
          </span>
          <button id="btn-export-schedule-csv" class="btn btn-secondary btn-sm">📥 Export Schedule</button>
        </div>
      </div>

      <!-- Schedule Principles & Rotation Cycle Banner -->
      <div style="background: var(--surface-alt); border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <div>
          <strong style="color: var(--primary);">Active Rotation Cycle:</strong> Rabi Cycle #4 (Oct 28 - Nov 04, 2026)<br>
          <span style="font-size: 0.82rem; color: var(--text-muted);">
            Rotation Rule: Head-to-Tail Sequenced Discharge • Design Canal Headflow: 115.0 cusecs
          </span>
        </div>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <div style="text-align: right;">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Allocatable Cycle Pool</div>
            <div style="font-size: 1.15rem; font-weight: 800; color: #0d9488;">${state.reservoir.allocatable_supply} T-m3</div>
          </div>
        </div>
      </div>

      <!-- Schedule Conflict Alert Box -->
      ${conflicts.length > 0 ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md); padding: 1rem 1.25rem; margin-bottom: 1.5rem;">
          <strong style="color: #991b1b;">🚨 Time Slot Collision Detected:</strong>
          <p style="font-size: 0.85rem; color: #7f1d1d; margin-top: 0.25rem;">
            Multiple gates assigned to the same delivery window on ${conflicts[0].s1.date} (${conflicts[0].s1.window}). Simultaneous full flow causes tail-end pressure depression. Use the editor below to stagger delivery.
          </p>
        </div>
      ` : ''}

      <!-- Interactive Timeline Grid -->
      <div style="overflow-x: auto; margin-bottom: 1.5rem;">
        <table class="table" style="width: 100%; border-collapse: collapse; font-size: 0.88rem;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 0.75rem;">Slot ID</th>
              <th style="padding: 0.75rem;">Date & Day</th>
              <th style="padding: 0.75rem;">Time Window</th>
              <th style="padding: 0.75rem;">Gate & Reach</th>
              <th style="padding: 0.75rem;">Farmer Name</th>
              <th style="padding: 0.75rem;">Discharge</th>
              <th style="padding: 0.75rem;">Allocated Vol</th>
              <th style="padding: 0.75rem;">Status</th>
              <th style="padding: 0.75rem; text-align: center;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${schedules.map(s => `
              <tr style="border-bottom: 1px solid var(--surface-border); ${s.gate_id === 'Gate-5' ? 'background: #f0fdfa;' : ''}">
                <td style="padding: 0.75rem; font-weight: 700;">${s.id}</td>
                <td style="padding: 0.75rem;">${s.date} <span style="color: var(--text-muted); font-size: 0.75rem;">(${s.day})</span></td>
                <td style="padding: 0.75rem; font-weight: 600; color: #0284c7;">${s.window}</td>
                <td style="padding: 0.75rem;">
                  <strong>${s.gate_id}</strong> (${s.gate_name})<br>
                  <span class="badge ${s.reach === 'Tail' ? 'badge-danger' : (s.reach === 'Head' ? 'badge-info' : 'badge-neutral')}" style="font-size: 0.7rem;">
                    ${s.reach} Reach
                  </span>
                </td>
                <td style="padding: 0.75rem; font-weight: 600;">${s.farmer_name}</td>
                <td style="padding: 0.75rem;">${s.flow_cusecs} cusecs</td>
                <td style="padding: 0.75rem; font-weight: 700; color: #0d9488;">${s.allocated_qty} T-m3</td>
                <td style="padding: 0.75rem;">
                  <span class="badge ${s.status.includes('Confirmed') ? 'badge-success' : (s.status.includes('Mediation') ? 'badge-warning' : 'badge-info')}">
                    ${s.status}
                  </span>
                </td>
                <td style="padding: 0.75rem; text-align: center;">
                  <button class="btn btn-secondary btn-sm btn-edit-slot" data-id="${s.id}">✏️ Adjust</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <!-- Schedule Adjustment Modal / Form -->
      <div id="slot-edit-modal" style="display: none; background: white; border: 2px solid var(--teal-accent); border-radius: var(--radius-lg); padding: 1.5rem; margin-top: 1rem;">
        <h4 style="color: var(--primary); margin-bottom: 1rem;" id="modal-slot-title">Adjust Schedule Turn Slot</h4>
        <div class="grid-3" style="gap: 1rem; margin-bottom: 1rem;">
          <div>
            <label class="form-label">Rotation Date</label>
            <input type="date" id="edit-date" class="form-input">
          </div>
          <div>
            <label class="form-label">Time Window</label>
            <select id="edit-window" class="form-select">
              <option value="06:00 - 14:00">Morning Shift (06:00 - 14:00)</option>
              <option value="08:00 - 16:00">Standard Day (08:00 - 16:00)</option>
              <option value="10:00 - 16:00">Midday Window (10:00 - 16:00)</option>
              <option value="14:00 - 22:00">Evening Shift (14:00 - 22:00)</option>
              <option value="16:00 - 22:00">Night Priming (16:00 - 22:00)</option>
            </select>
          </div>
          <div>
            <label class="form-label">Regulated Flow Rate (cusecs)</label>
            <input type="number" id="edit-flow" class="form-input" min="5" max="50" step="1">
          </div>
        </div>

        <input type="hidden" id="edit-slot-id">
        <div style="display: flex; gap: 0.75rem;">
          <button id="btn-save-slot" class="btn btn-teal btn-sm">💾 Save & Notify Farmer</button>
          <button id="btn-cancel-slot" class="btn btn-secondary btn-sm">Cancel</button>
        </div>
      </div>
    </div>
  `;

  // Bind Actions
  const modal = container.querySelector("#slot-edit-modal");
  const slotTitle = container.querySelector("#modal-slot-title");
  const editIdInput = container.querySelector("#edit-slot-id");
  const editDateInput = container.querySelector("#edit-date");
  const editWindowInput = container.querySelector("#edit-window");
  const editFlowInput = container.querySelector("#edit-flow");

  container.querySelectorAll(".btn-edit-slot").forEach(btn => {
    btn.addEventListener("click", () => {
      const slotId = btn.getAttribute("data-id");
      const slot = schedules.find(s => s.id === slotId);
      if (slot) {
        modal.style.display = "block";
        slotTitle.textContent = `Adjust Rotation Turn for ${slot.farmer_name} (${slot.gate_id})`;
        editIdInput.value = slot.id;
        editDateInput.value = slot.date;
        editWindowInput.value = slot.window;
        editFlowInput.value = slot.flow_cusecs;
        modal.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  container.querySelector("#btn-cancel-slot")?.addEventListener("click", () => {
    modal.style.display = "none";
  });

  container.querySelector("#btn-save-slot")?.addEventListener("click", async () => {
    const slotId = editIdInput.value;
    const newDate = editDateInput.value;
    const newWindow = editWindowInput.value;
    const newFlow = parseFloat(editFlowInput.value);

    await store.updateScheduleSlot(slotId, {
      date: newDate,
      window: newWindow,
      flow_cusecs: newFlow
    });

    if (window.showToast) {
      window.showToast(`Schedule turn ${slotId} updated. Farmer notified via in-app SMS.`, "success");
    }
    renderScheduler(container);
  });

  container.querySelector("#btn-export-schedule-csv")?.addEventListener("click", () => {
    window.location.href = "/api/export/csv?type=allocations";
  });
}
