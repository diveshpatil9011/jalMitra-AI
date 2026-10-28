/**
 * JalMitra AI - Public Landing Page Component (Module 1)
 * Complete agricultural technology platform showcase featuring:
 * - JalMitra branding, logo & bilingual typography
 * - Modern green, blue, white, and earth-tone palette
 * - Hero section detailing the water-sharing conflict and core governance principles
 * - Farmer Portal and Department Authority Portal entry points
 * - Problem statement and proposed algorithmic solution
 * - Feature cards and 4-phase system workflow
 * - Interactive demonstration statistics clearly labeled as simulated
 * - 3 Distinct Benefit Cards: Farmers, Irrigation Departments, Rural Communities
 * - How it works section with interactive triggers
 * - Frequently Asked Questions (FAQ) accordion
 * - One-click demo personas for hackathon judges
 */

import { store } from "../store.js";
import { t } from "../i18n.js";
import {
  renderFarmerLoginPage,
  renderDepartmentLoginPage,
  renderRoleSelectionPage
} from "./login-portal.js";

export function renderLanding(container) {
  const state = store.getState();
  const totalFarmers = state.farmers ? state.farmers.length : 4;
  const totalGates = state.gates ? state.gates.length : 6;
  const allocSupply = state.reservoir ? state.reservoir.allocatable_supply : 45.0;
  const headFlow = state.reservoir ? state.reservoir.current_head_flow_cusecs : 115.0;

  container.innerHTML = `
    <div class="landing-page-wrapper animate-fadeIn">
      
      <!-- HERO SECTION -->
      <section class="landing-hero" style="background: linear-gradient(135deg, #072317 0%, #0d3826 40%, #064e3b 70%, #0f766e 100%); color: white; padding: 3.5rem 2.5rem; border-radius: var(--radius-lg); margin-bottom: 2.25rem; position: relative; overflow: hidden; box-shadow: var(--shadow-lg);">
        <div style="position: absolute; right: -40px; bottom: -40px; opacity: 0.07; font-size: 22rem; font-weight: 900; pointer-events: none; line-height: 1; user-select: none;">💧</div>
        
        <div style="max-width: 960px; position: relative; z-index: 2;">
          <div style="display: inline-flex; align-items: center; gap: 0.6rem; background: rgba(20, 184, 166, 0.25); border: 1px solid rgba(94, 234, 212, 0.4); padding: 0.35rem 0.95rem; border-radius: var(--radius-full); font-size: 0.82rem; font-weight: 700; color: #a7f3d0; margin-bottom: 1.25rem;">
            <span>🌾</span> AI-Powered Irrigation Governance & Dispute Mediation Platform
          </div>

          <h1 style="font-size: 3rem; font-weight: 900; line-height: 1.15; margin-bottom: 0.5rem; letter-spacing: -0.025em;">
            JalMitra AI <span style="font-size: 2.15rem; font-weight: 600; color: #6ee7b7;">(जलमित्र AI)</span>
          </h1>

          <div style="font-size: 1.35rem; font-weight: 600; color: #f0fdf4; margin-bottom: 0.75rem;">
            जलमित्र — किसानों के लिए पारदर्शी डिजिटल जल वितरण एवं विवाद मध्यस्थता
          </div>

          <p style="font-size: 1.4rem; color: #fef08a; font-weight: 700; margin-bottom: 1.25rem; font-style: italic;">
            "Smart Water. Fair Distribution. Stronger Farmers."
          </p>

          <p style="font-size: 1.05rem; color: #e2e8f0; line-height: 1.65; margin-bottom: 1.75rem; max-width: 820px;">
            Connecting tail-reach and head-reach agricultural cultivators with transparent canal quotas, scientific FAO-56 crop-water budgeting, GIS telemetry, and explainable dispute mediation under strict human administrative governance.
          </p>

          <!-- Core Principle Callout -->
          <div style="background: rgba(0, 0, 0, 0.32); border-left: 4px solid #14b8a6; padding: 0.9rem 1.4rem; border-radius: var(--radius-sm); margin-bottom: 2.25rem; display: flex; align-items: center; gap: 1rem; max-width: 760px;">
            <span style="font-size: 1.75rem;">⚖️</span>
            <div>
              <div style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.06em; color: #99f6e4; font-weight: 800;">Foundational Platform Principle</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: white;">"AI Recommends. Humans Govern."</div>
              <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 0.15rem;">Automated models never actuate canal sluices without verified Executive Officer ratification.</div>
            </div>
          </div>

          <!-- Direct Entry Points -->
          <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
            <button id="btn-landing-farmer" class="btn btn-teal" style="padding: 0.9rem 1.75rem; font-size: 1.05rem; font-weight: 700; box-shadow: 0 4px 16px rgba(13, 148, 136, 0.45); border-radius: var(--radius-md);">
              🌾 Farmer Portal (शेतकरी दालन) →
            </button>
            <button id="btn-landing-officer" class="btn" style="padding: 0.9rem 1.75rem; font-size: 1.05rem; font-weight: 700; background: #1e40af; color: white; border: 1px solid #3b82f6; box-shadow: 0 4px 16px rgba(30, 64, 175, 0.4); border-radius: var(--radius-md);">
              🏛️ Authority Command Center →
            </button>
            <button id="btn-landing-roles" class="btn btn-secondary" style="padding: 0.9rem 1.5rem; font-size: 1rem; font-weight: 600; background: white; color: #0f172a; border-radius: var(--radius-md);">
              🔑 Role Selection & Demo
            </button>
          </div>
        </div>
      </section>

      <!-- INTERACTIVE DEMONSTRATION KPI STRIP (Clearly Labeled as Simulated) -->
      <section style="margin-bottom: 2.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
          <h3 style="color: var(--primary); font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
            <span>📊</span> Live Irrigation Command Telemetry & System Statistics
          </h3>
          <span class="badge" style="background: #fef3c7; color: #92400e; font-weight: 700; border: 1px solid #fde68a;">
            ⚙️ DEMONSTRATION DATA (SIMULATED FOR HACKATHON)
          </span>
        </div>

        <div class="grid-4" style="gap: 1.25rem;">
          <div class="stat-box" style="border-top: 3.5px solid #0d9488; background: white;">
            <div class="stat-label">Net Allocatable Pool</div>
            <div class="stat-value" style="color: #0d9488; font-size: 1.9rem;">${allocSupply} <span style="font-size: 1rem; font-weight: 600;">T-m³</span></div>
            <div class="stat-sub">${(allocSupply * 1000).toLocaleString()} Litres Available this cycle</div>
          </div>

          <div class="stat-box" style="border-top: 3.5px solid #0284c7; background: white;">
            <div class="stat-label">Canal Command Chainage</div>
            <div class="stat-value" style="color: #0284c7; font-size: 1.9rem;">40.0 <span style="font-size: 1rem; font-weight: 600;">km</span></div>
            <div class="stat-sub">GLBC Headworks to Tail End Niphad</div>
          </div>

          <div class="stat-box" style="border-top: 3.5px solid #f59e0b; background: white;">
            <div class="stat-label">Canal Head Discharge</div>
            <div class="stat-value" style="color: #d97706; font-size: 1.9rem;">${headFlow} <span style="font-size: 1rem; font-weight: 600;">cusecs</span></div>
            <div class="stat-sub">Across ${totalGates} Distributary Sluices</div>
          </div>

          <div class="stat-box" style="border-top: 3.5px solid #10b981; background: white;">
            <div class="stat-label">Jain's Fairness Index</div>
            <div class="stat-value" style="color: #059669; font-size: 1.9rem;">94.2%</div>
            <div class="stat-sub">Mathematically Verified Equity Score</div>
          </div>
        </div>

        <!-- Demonstration Notice Banner -->
        <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: var(--radius-md); padding: 0.85rem 1.25rem; margin-top: 1rem; display: flex; gap: 0.75rem; align-items: flex-start;">
          <span style="font-size: 1.35rem;">⚠️</span>
          <div style="font-size: 0.84rem; color: #78350f; line-height: 1.5;">
            <strong>Demonstration Data Disclaimer:</strong> All canal telemetry readings, Gat/Survey numbers, village water records, and farmer identifiers are simulated demonstration data engineered for the Agriculture & Rural Solutions Hackathon to showcase transparent mathematical water allocation and dispute resolution.
          </div>
        </div>
      </section>

      <!-- PROBLEM VS SOLUTION GRID -->
      <section style="margin-bottom: 2.5rem;">
        <div class="grid-2" style="gap: 1.5rem;">
          
          <!-- The Problem -->
          <div class="card" style="border-left: 5px solid #ef4444; background: white; margin-bottom: 0;">
            <div class="card-header" style="border-bottom: 1px solid #fee2e2; padding-bottom: 0.85rem;">
              <div class="card-title" style="color: #991b1b; font-size: 1.25rem;">
                <span>🚨</span> The Irrigation Crisis in Shared Canal Networks
              </div>
            </div>
            <div style="padding-top: 0.5rem;">
              <ul style="padding-left: 1.25rem; font-size: 0.92rem; color: #334155; display: flex; flex-direction: column; gap: 0.75rem; line-height: 1.6;">
                <li>
                  <strong style="color: #0f172a;">Tail-End Starvation:</strong> Farmers situated 25–40 km downstream face dry distributaries, missed cycles, and severe crop wilting while upstream head-reach farms overdraw water.
                </li>
                <li>
                  <strong style="color: #0f172a;">Opaque Gate Operations:</strong> Sluice gate timings and volumetric releases are managed with paper registers, leading to perceived bias and lack of auditability.
                </li>
                <li>
                  <strong style="color: #0f172a;">Unmediated Community Conflicts:</strong> Disagreements over rotational Warabandi turns escalate into physical altercations, unauthorized canal breaching, and protracted litigation.
                </li>
                <li>
                  <strong style="color: #0f172a;">Transit Conveyance Losses:</strong> Unmonitored 15–25% conveyance loss in silted canal reaches drains reservoirs without equitable agricultural yield return.
                </li>
              </ul>
            </div>
          </div>

          <!-- The Solution -->
          <div class="card" style="border-left: 5px solid #0d9488; background: white; margin-bottom: 0;">
            <div class="card-header" style="border-bottom: 1px solid #ccfbf1; padding-bottom: 0.85rem;">
              <div class="card-title" style="color: #0f766e; font-size: 1.25rem;">
                <span>💡</span> The JalMitra Algorithmic Solution
              </div>
            </div>
            <div style="padding-top: 0.5rem;">
              <ul style="padding-left: 1.25rem; font-size: 0.92rem; color: #334155; display: flex; flex-direction: column; gap: 0.75rem; line-height: 1.6;">
                <li>
                  <strong style="color: #0f172a;">Scientific Crop-Water Budgeting:</strong> FAO-56 Penman-Monteith crop coefficients (Kc), soil hydrology, and irrigation efficiencies calculate transparent volumetric water duty.
                </li>
                <li>
                  <strong style="color: #0f172a;">Explainable AI Dispute Mediation:</strong> Dedicated digital mediation room generates 3 feasible compromise proposals (Proportional Cut, Agronomic Priority, Rotational Staggering).
                </li>
                <li>
                  <strong style="color: #0f172a;">Universal 8-Rule Statutory Compliance:</strong> Configurable compliance matrix protects mandatory 15% drinking water reserves and enforces downstream tail-end equity.
                </li>
                <li>
                  <strong style="color: #0f172a;">Cryptographic Audit Hash Chain:</strong> Every allocation decision, farmer grievance, and officer sign-off is linked with SHA-256 blocks for verifiable transparency.
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      <!-- SYSTEM WORKFLOW: 4 SYNCHRONIZED PHASES -->
      <section class="card" style="margin-bottom: 2.5rem; background: white;">
        <div class="card-header">
          <div>
            <div class="card-title" style="font-size: 1.35rem;">
              <span>🔄</span> How JalMitra Works: End-to-End Governance Cycle
            </div>
            <div class="card-subtitle">4 Synchronized Phases of Autonomous Irrigation Governance & Mediation</div>
          </div>
          <span class="badge badge-info">Zero Black-Box AI</span>
        </div>

        <div class="grid-4" style="gap: 1.25rem; margin-top: 0.5rem;">
          <div class="stat-box" style="border-top: 3.5px solid #0d9488; background: #f0fdfa; text-align: left;">
            <div style="font-size: 1.35rem; margin-bottom: 0.35rem;">1. 📝 Intake & Registration</div>
            <div style="font-weight: 700; color: #0f766e; font-size: 0.92rem; margin-bottom: 0.35rem;">Farmer Demands & Voice</div>
            <div style="font-size: 0.83rem; color: #475569; line-height: 1.55;">
              Farmers submit seasonal requests or speak grievances in Marathi, Hindi, or English. Intake agents parse acreage, crop stage, and assigned gate.
            </div>
          </div>

          <div class="stat-box" style="border-top: 3.5px solid #0284c7; background: #f0f9ff; text-align: left;">
            <div style="font-size: 1.35rem; margin-bottom: 0.35rem;">2. 🧠 Water Intelligence</div>
            <div style="font-weight: 700; color: #0369a1; font-size: 0.92rem; margin-bottom: 0.35rem;">FAO-56 & Hydraulic Balance</div>
            <div style="font-size: 0.83rem; color: #475569; line-height: 1.55;">
              Hydraulic models deduce transit loss (12%) and lock emergency drinking reserves (15%) before computing allocatable canal duty.
            </div>
          </div>

          <div class="stat-box" style="border-top: 3.5px solid #f59e0b; background: #fffbeb; text-align: left;">
            <div style="font-size: 1.35rem; margin-bottom: 0.35rem;">3. 🤝 Explainable Mediation</div>
            <div style="font-weight: 700; color: #b45309; font-size: 0.92rem; margin-bottom: 0.35rem;">3 Algorithmic Alternatives</div>
            <div style="font-size: 0.83rem; color: #475569; line-height: 1.55;">
              Detects upstream overdraw and calculates Proportional Cut, Agronomic Priority, and Warabandi Rotational time-shifts side-by-side.
            </div>
          </div>

          <div class="stat-box" style="border-top: 3.5px solid #10b981; background: #ecfdf5; text-align: left;">
            <div style="font-size: 1.35rem; margin-bottom: 0.35rem;">4. 🏛️ Human Governance</div>
            <div style="font-weight: 700; color: #047857; font-size: 0.92rem; margin-bottom: 0.35rem;">Officer Sign-off & SHA-256</div>
            <div style="font-size: 0.83rem; color: #475569; line-height: 1.55;">
              Executive Engineers review 8-rule compliance, ratify the consensus accord, publish updated Warabandi slots, and seal the cryptographic block.
            </div>
          </div>
        </div>
      </section>

      <!-- 3 COMPREHENSIVE BENEFIT CARDS (Module 1 Requirement) -->
      <section style="margin-bottom: 2.5rem;">
        <h3 style="color: var(--primary); font-size: 1.35rem; font-weight: 800; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>🌟</span> Stakeholder Benefits Across the Agricultural Ecosystem
        </h3>

        <div class="grid-3" style="gap: 1.5rem;">
          
          <!-- Benefit 1: Farmers -->
          <div class="card" style="background: white; border-top: 4px solid #0d9488; margin-bottom: 0;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #ecfdf5; border: 1.5px solid #86efac; display: flex; align-items: center; justify-content: center; font-size: 1.75rem;">
                🌾
              </div>
              <div>
                <h4 style="font-size: 1.15rem; font-weight: 800; color: #065f46; margin: 0;">Benefits for Farmers</h4>
                <div style="font-size: 0.78rem; color: #047857; font-weight: 600;">शेतकऱ्यांसाठी फायदे</div>
              </div>
            </div>
            <ul style="padding-left: 1.15rem; font-size: 0.88rem; color: #334155; display: flex; flex-direction: column; gap: 0.6rem; line-height: 1.55;">
              <li><strong>Guaranteed Warabandi Turns:</strong> Predictable irrigation dates and time windows prevent standing crop moisture stress.</li>
              <li><strong>Tail-Reach Equity Protection:</strong> Algorithmic weighting ensures downstream farmers receive designated cusecs discharge.</li>
              <li><strong>Multilingual Voice Grievances:</strong> Voice recognition in Marathi and Hindi allows instant complaint lodging directly from the field.</li>
              <li><strong>Transparent Water Quotas:</strong> Full visibility into requested vs allocated vs actual delivered litres and cubic metres ($m^3$).</li>
            </ul>
          </div>

          <!-- Benefit 2: Irrigation Department -->
          <div class="card" style="background: white; border-top: 4px solid #1e40af; margin-bottom: 0;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #eff6ff; border: 1.5px solid #93c5fd; display: flex; align-items: center; justify-content: center; font-size: 1.75rem;">
                🏛️
              </div>
              <div>
                <h4 style="font-size: 1.15rem; font-weight: 800; color: #1e40af; margin: 0;">Benefits for Authorities</h4>
                <div style="font-size: 0.78rem; color: #1d4ed8; font-weight: 600;">जलसंपदा विभागासाठी फायदे</div>
              </div>
            </div>
            <ul style="padding-left: 1.15rem; font-size: 0.88rem; color: #334155; display: flex; flex-direction: column; gap: 0.6rem; line-height: 1.55;">
              <li><strong>Automated Dispute Mediation:</strong> Pre-calculated compromise alternatives reduce field officer dispute mediation burden.</li>
              <li><strong>Verifiable Audit Trail:</strong> SHA-256 cryptographic logs protect officers from allegations of biased gate operations.</li>
              <li><strong>Real-Time Canal Telemetry:</strong> Live GIS mapping tracks 40 km chainage, detecting conveyance leaks between sluices.</li>
              <li><strong>Enforced Water Conservation:</strong> Hardcoded 15% drinking water emergency pool prevents reservoir exhaustion.</li>
            </ul>
          </div>

          <!-- Benefit 3: Rural Communities -->
          <div class="card" style="background: white; border-top: 4px solid #f59e0b; margin-bottom: 0;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
              <div style="width: 48px; height: 48px; border-radius: 10px; background: #fffbeb; border: 1.5px solid #fde68a; display: flex; align-items: center; justify-content: center; font-size: 1.75rem;">
                🏘️
              </div>
              <div>
                <h4 style="font-size: 1.15rem; font-weight: 800; color: #92400e; margin: 0;">Benefits for Communities</h4>
                <div style="font-size: 0.78rem; color: #b45309; font-weight: 600;">ग्रामीण समुदायासाठी फायदे</div>
              </div>
            </div>
            <ul style="padding-left: 1.15rem; font-size: 0.88rem; color: #334155; display: flex; flex-direction: column; gap: 0.6rem; line-height: 1.55;">
              <li><strong>Social Harmony & De-escalation:</strong> Mathematical fairness principles prevent inter-village conflicts over night irrigation turns.</li>
              <li><strong>Reduced Sluice Tampering:</strong> Eliminates unauthorized gate breaking and illegal pump diversions along the canal bank.</li>
              <li><strong>Equitable Aquifer Recharge:</strong> Balanced surface irrigation recharges groundwater aquifers evenly across all reach zones.</li>
              <li><strong>Regional Agricultural Prosperity:</strong> Higher yield consistency prevents crop failure in tail-end sugarcane and onion pockets.</li>
            </ul>
          </div>

        </div>
      </section>

      <!-- HACKATHON EVALUATION PERSONAS BAR -->
      <section class="card" style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: var(--radius-md); padding: 1.5rem; margin-bottom: 2.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
          <div>
            <div style="font-size: 1.05rem; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 0.5rem;">
              <span>⚡</span> Hackathon One-Click Demonstration Personas
            </div>
            <div style="font-size: 0.82rem; color: #64748b;">
              Click any persona to log in instantly and evaluate the complete governance workflow:
            </div>
          </div>
          <span class="badge" style="background: #e2e8f0; color: #475569; font-size: 0.78rem;">
            Default Passwords: <code>kisan123</code> / <code>admin123</code>
          </span>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-sm btn-outline-teal btn-landing-quick" data-role="farmer" data-id="9822004210" data-pass="kisan123" style="padding: 0.5rem 0.85rem;">
            👨‍🌾 <strong>Ramesh Patil</strong> (Tail Reach • Niphad Gate 5 • Sugarcane 4.0 ac)
          </button>
          <button type="button" class="btn btn-sm btn-outline-teal btn-landing-quick" data-role="farmer" data-id="9422001108" data-pass="kisan123" style="padding: 0.5rem 0.85rem;">
            👨‍🌾 <strong>Suresh Shinde</strong> (Head Reach • Sukene Gate 1 • Cotton 5.0 ac)
          </button>
          <button type="button" class="btn btn-sm btn-outline-teal btn-landing-quick" data-role="farmer" data-id="9922008765" data-pass="kisan123" style="padding: 0.5rem 0.85rem;">
            👩‍🌾 <strong>Sunita Gaikwad</strong> (Middle Reach • Pimpalgaon Gate 3 • Onion 2.5 ac)
          </button>
          <button type="button" class="btn btn-sm btn-secondary btn-landing-quick" data-role="officer" data-id="deshmukh.ee@jalmitra.gov.in" data-pass="admin123" style="border-color: #93c5fd; color: #1e40af; background: #eff6ff; padding: 0.5rem 0.85rem;">
            🏛️ <strong>Er. S. Deshmukh</strong> (Executive Engineer • GLBC Division)
          </button>
        </div>
      </section>

      <!-- FREQUENTLY ASKED QUESTIONS (FAQ) -->
      <section class="card" style="margin-bottom: 2.5rem; background: white;">
        <div class="card-header">
          <div class="card-title" style="font-size: 1.35rem;">
            <span>❓</span> Frequently Asked Questions (FAQ)
          </div>
          <div class="card-subtitle">Transparent answers regarding JalMitra's AI irrigation governance</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 0.85rem; padding-top: 0.5rem;">
          <details style="background: var(--surface-alt); padding: 1rem 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--surface-border);">
            <summary style="font-weight: 700; color: var(--primary); cursor: pointer; font-size: 0.95rem;">
              Does JalMitra make automated water release decisions without human officers?
            </summary>
            <p style="font-size: 0.88rem; color: var(--text-main); margin-top: 0.6rem; line-height: 1.6;">
              <strong>No.</strong> Our foundational principle is <em>"AI recommends. Humans govern."</em> The allocation algorithms and multi-agent mediation rooms calculate mathematically optimal, constraint-aware proposals, but statutory authority remains exclusively with authorized departmental Executive Engineers and SDOs who must digitally sign off before canal sluices operate.
            </p>
          </details>

          <details style="background: var(--surface-alt); padding: 1rem 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--surface-border);">
            <summary style="font-weight: 700; color: var(--primary); cursor: pointer; font-size: 0.95rem;">
              How does the system protect tail-end farmers from canal starvation?
            </summary>
            <p style="font-size: 0.88rem; color: var(--text-main); margin-top: 0.6rem; line-height: 1.6;">
              JalMitra integrates real-time telemetry from all 6 distributary gates along the 40 km Godavari Left Bank Canal. When discharge at tail gates (such as Gate 5 Niphad) drops below operational duty, Rule 7 triggers automatic rationing of head-reach withdrawals and schedules dedicated Warabandi time slots with full hydraulic head.
            </p>
          </details>

          <details style="background: var(--surface-alt); padding: 1rem 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--surface-border);">
            <summary style="font-weight: 700; color: var(--primary); cursor: pointer; font-size: 0.95rem;">
              How can regional farmers lodge grievances without typing English?
            </summary>
            <p style="font-size: 0.88rem; color: var(--text-main); margin-top: 0.6rem; line-height: 1.6;">
              Farmers can speak directly into their phone or browser using the Voice Grievance feature. JalMitra's Farmer Intake Agent processes spoken Marathi (मराठी) and Hindi (हिन्दी) via Web Speech recognition, automatically extracting the farmer's crop, growth stage, assigned gate, and urgency level.
            </p>
          </details>

          <details style="background: var(--surface-alt); padding: 1rem 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--surface-border);">
            <summary style="font-weight: 700; color: var(--primary); cursor: pointer; font-size: 0.95rem;">
              How does the cryptographic audit hash chain prevent decision tampering?
            </summary>
            <p style="font-size: 0.88rem; color: var(--text-main); margin-top: 0.6rem; line-height: 1.6;">
              Every event—intake submission, quota recommendation, dispute proposal, and official sign-off—is sealed into a SHA-256 block cryptographically linked to the previous block's hash:
              <br><code>Hash_n = SHA-256(BlockID || Timestamp || Actor || Action || Details || Hash_{n-1})</code>.
              Altering any past record immediately breaks all subsequent block hashes, providing indisputable tamper evidence.
            </p>
          </details>
        </div>
      </section>

    </div>
  `;

  // Attach button navigation listeners
  container.querySelector("#btn-landing-farmer")?.addEventListener("click", () => {
    store.setRole("portal");
    window.location.hash = "farmer-login";
  });

  container.querySelector("#btn-landing-officer")?.addEventListener("click", () => {
    store.setRole("portal");
    window.location.hash = "admin-login";
  });

  container.querySelector("#btn-landing-roles")?.addEventListener("click", () => {
    store.setRole("portal");
    window.location.hash = "role-selection";
  });

  // Quick evaluation logins
  container.querySelectorAll(".btn-landing-quick").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const pass = btn.getAttribute("data-pass");
      const role = btn.getAttribute("data-role");
      
      const success = await store.login(id, pass, role);
      if (success) {
        if (role === "farmer") {
          window.location.hash = "farmer-portal";
        } else {
          window.location.hash = "officer-portal";
        }
        if (window.showToast) {
          window.showToast(`Logged in as ${store.getState().currentUser?.name || id}!`, "success");
        }
      } else {
        if (window.showToast) {
          window.showToast("Could not sign in with demo credentials.", "error");
        }
      }
    });
  });
}
