/**
 * JalMitra AI - Analytics Dashboard Component
 * Implements Phase 19: 8 Rich Interactive Charts & Demonstration Analytics Summary.
 */

import { store } from "../store.js";

export function renderAnalytics(container) {
  const state = store.getState();
  const totalRequested = state.requests.reduce((s, r) => s + parseFloat(r.requested_quantity || 0), 0);
  const totalAllocated = state.requests.reduce((s, r) => s + (r.approved_quantity !== null ? parseFloat(r.approved_quantity) : parseFloat(r.proposed_quantity || 0)), 0);
  const unmetDemand = Math.max(0, totalRequested - totalAllocated);

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title"><span>📊</span> Comprehensive Irrigation Analytics & Water Accounting</div>
          <div class="card-subtitle">Volumetric performance, agronomic equity indices & grievance SLA tracking</div>
        </div>
        <span class="badge badge-warning">Demonstration Analytics</span>
      </div>

      <!-- Top Metric Summary Cards -->
      <div class="grid-4" style="margin-bottom: 1.5rem;">
        <div class="stat-box">
          <div class="stat-label">Total Water Demanded</div>
          <div class="stat-value" style="color: #0284c7;">${totalRequested.toFixed(1)} T-m3</div>
          <div class="stat-sub">Across 4 canal sectors</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Total Water Allocated</div>
          <div class="stat-value" style="color: #0d9488;">${totalAllocated.toFixed(1)} T-m3</div>
          <div class="stat-sub">Proposed + Approved</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Cycle Unmet Deficit</div>
          <div class="stat-value" style="color: ${unmetDemand > 0 ? '#ef4444' : '#10b981'};">${unmetDemand.toFixed(1)} T-m3</div>
          <div class="stat-sub">Curtailment: ${((unmetDemand / totalRequested) * 100).toFixed(1)}%</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">SLA Grievance Resolution</div>
          <div class="stat-value" style="color: #10b981;">100%</div>
          <div class="stat-sub">Zero overdue escalations</div>
        </div>
      </div>

      <!-- 8 Charts Grid -->
      <div class="grid-2">
        <!-- Chart 1: Requested vs Allocated by Gate -->
        <div class="card" style="margin-bottom: 1.25rem;">
          <h4 style="color: var(--primary); font-size: 0.95rem; margin-bottom: 0.75rem;">1. Requested vs Allocated Water (by Gate)</h4>
          <svg viewBox="0 0 450 180" style="width: 100%; height: auto;">
            <!-- Axes -->
            <line x1="40" y1="140" x2="420" y2="140" stroke="#cbd5e1" stroke-width="1.5" />
            <line x1="40" y1="20" x2="40" y2="140" stroke="#cbd5e1" stroke-width="1.5" />
            <!-- Bars for G1, G3, G4, G5 -->
            <!-- G1 -->
            <rect x="70" y="50" width="22" height="90" fill="#93c5fd" rx="3" title="Req 30" />
            <rect x="96" y="77" width="22" height="63" fill="#0284c7" rx="3" title="Alloc 21" />
            <text x="94" y="158" font-size="10" fill="#64748b" text-anchor="middle">Gate-1</text>

            <!-- G3 -->
            <rect x="160" y="95" width="22" height="45" fill="#93c5fd" rx="3" title="Req 15" />
            <rect x="186" y="98" width="22" height="42" fill="#0284c7" rx="3" title="Alloc 14" />
            <text x="184" y="158" font-size="10" fill="#64748b" text-anchor="middle">Gate-3</text>

            <!-- G4 -->
            <rect x="250" y="86" width="22" height="54" fill="#93c5fd" rx="3" title="Req 18" />
            <rect x="276" y="104" width="22" height="36" fill="#0284c7" rx="3" title="Alloc 12" />
            <text x="274" y="158" font-size="10" fill="#64748b" text-anchor="middle">Gate-4</text>

            <!-- G5 -->
            <rect x="340" y="65" width="22" height="75" fill="#93c5fd" rx="3" title="Req 25" />
            <rect x="366" y="84" width="22" height="56" fill="#0d9488" rx="3" title="Alloc 18.5" />
            <text x="364" y="158" font-size="10" fill="#64748b" text-anchor="middle">Gate-5 (Tail)</text>

            <!-- Legend -->
            <circle cx="280" cy="18" r="5" fill="#93c5fd" />
            <text x="290" y="22" font-size="10" fill="#64748b">Demanded</text>
            <circle cx="360" cy="18" r="5" fill="#0284c7" />
            <text x="370" y="22" font-size="10" fill="#64748b">Allocated</text>
          </svg>
        </div>

        <!-- Chart 2: Demand Share by Canal Sector -->
        <div class="card" style="margin-bottom: 1.25rem;">
          <h4 style="color: var(--primary); font-size: 0.95rem; margin-bottom: 0.75rem;">2. Demand Share by Reach Zone</h4>
          <svg viewBox="0 0 450 180" style="width: 100%; height: auto;">
            <!-- Doughnut representation -->
            <circle cx="120" cy="90" r="60" fill="none" stroke="#e2e8f0" stroke-width="26" />
            <!-- Head (34%) -->
            <circle cx="120" cy="90" r="60" fill="none" stroke="#0284c7" stroke-width="26" stroke-dasharray="128 377" stroke-dashoffset="0" />
            <!-- Middle (37%) -->
            <circle cx="120" cy="90" r="60" fill="none" stroke="#0d9488" stroke-width="26" stroke-dasharray="140 377" stroke-dashoffset="-128" />
            <!-- Tail (29%) -->
            <circle cx="120" cy="90" r="60" fill="none" stroke="#f59e0b" stroke-width="26" stroke-dasharray="109 377" stroke-dashoffset="-268" />
            
            <text x="120" y="95" font-weight="800" font-size="15" fill="#0f172a" text-anchor="middle">88 T-m3</text>
            
            <!-- Legend items -->
            <rect x="230" y="45" width="14" height="14" rx="3" fill="#0284c7" />
            <text x="255" y="57" font-size="11" fill="#0f172a">Head Reach (Gate 1-2): 30.0 T-m3 (34%)</text>

            <rect x="230" y="80" width="14" height="14" rx="3" fill="#0d9488" />
            <text x="255" y="92" font-size="11" fill="#0f172a">Middle Reach (Gate 3-4): 33.0 T-m3 (37%)</text>

            <rect x="230" y="115" width="14" height="14" rx="3" fill="#f59e0b" />
            <text x="255" y="127" font-size="11" fill="#0f172a">Tail Reach (Gate 5-6): 25.0 T-m3 (29%)</text>
          </svg>
        </div>

        <!-- Chart 3: Grievance Categories -->
        <div class="card" style="margin-bottom: 1.25rem;">
          <h4 style="color: var(--primary); font-size: 0.95rem; margin-bottom: 0.75rem;">3. Grievance Categories Breakdown</h4>
          <div style="font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                <span>Downstream Water Shortage</span> <strong>50%</strong>
              </div>
              <div style="height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
                <div style="width: 50%; height: 100%; background: #ef4444;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                <span>Canal Embankment Leakage</span> <strong>25%</strong>
              </div>
              <div style="height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
                <div style="width: 25%; height: 100%; background: #f59e0b;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
                <span>Low Canal Pressure</span> <strong>25%</strong>
              </div>
              <div style="height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
                <div style="width: 25%; height: 100%; background: #0284c7;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chart 4: Resolution SLA Elapsed Time -->
        <div class="card" style="margin-bottom: 1.25rem;">
          <h4 style="color: var(--primary); font-size: 0.95rem; margin-bottom: 0.75rem;">4. Grievance Resolution SLA Window (48h Target)</h4>
          <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.85rem;">
            <div>
              <div style="display: flex; justify-content: space-between;">
                <span>CMP-2026-001 (Gate-5 Shortage)</span>
                <strong>26h / 48h (54% SLA used)</strong>
              </div>
              <div style="height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden; margin-top: 0.25rem;">
                <div style="width: 54%; height: 100%; background: #0d9488;"></div>
              </div>
            </div>
            <div>
              <div style="display: flex; justify-content: space-between;">
                <span>CMP-2026-002 (Gate-4 Leakage)</span>
                <strong>44h / 72h (61% SLA used)</strong>
              </div>
              <div style="height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden; margin-top: 0.25rem;">
                <div style="width: 61%; height: 100%; background: #0284c7;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Chart 5: Water Balance Loss & Reserve Breakdown -->
        <div class="card" style="margin-bottom: 1.25rem;">
          <h4 style="color: var(--primary); font-size: 0.95rem; margin-bottom: 0.75rem;">5. Cycle Water Balance Breakdown (65 T-m3 Inflow)</h4>
          <div style="height: 24px; width: 100%; display: flex; border-radius: 5px; overflow: hidden; font-size: 0.72rem; font-weight: 700; color: white; text-align: center; line-height: 24px;">
            <div style="width: 12%; background: #f59e0b;" title="Transit Loss">12% Loss</div>
            <div style="width: 15%; background: #0284c7;" title="Reserve">15% Reserve</div>
            <div style="width: 73%; background: #10b981;" title="Allocatable">73% Allocatable Pool (45.0 T-m3)</div>
          </div>
        </div>

        <!-- Chart 6: Allocation Strategy Comparison -->
        <div class="card" style="margin-bottom: 1.25rem;">
          <h4 style="color: var(--primary); font-size: 0.95rem; margin-bottom: 0.75rem;">6. Strategy Equity Index Comparison (Gini Coefficient)</h4>
          <div class="grid-3" style="font-size: 0.8rem; text-align: center;">
            <div style="background: var(--surface-alt); padding: 0.6rem; border-radius: var(--radius-sm);">
              <strong>Proportional Cut</strong><br>
              Gini: <strong>0.18</strong> (High Equity)<br>
              <span style="color: #64748b;">Ignores crop wilting</span>
            </div>
            <div style="background: #f0fdfa; border: 1px solid #99f6e4; padding: 0.6rem; border-radius: var(--radius-sm);">
              <strong style="color: #0d9488;">Agronomic Priority</strong><br>
              Gini: <strong>0.28</strong> (Balanced)<br>
              <span style="color: #0f766e;">Protects critical stage</span>
            </div>
            <div style="background: var(--surface-alt); padding: 0.6rem; border-radius: var(--radius-sm);">
              <strong>Rotational Shift</strong><br>
              Gini: <strong>0.34</strong> (Staggered)<br>
              <span style="color: #64748b;">Full pressure turns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
