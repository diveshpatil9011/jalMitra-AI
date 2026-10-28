/**
 * JalMitra AI - Welcome & Login Selection, Farmer Login, Farmer Registration, and Department Admin Login
 * Implements Requirements 2, 3, 4, and 5 of the Master Prompt:
 * - Requirement 2: First Page Welcome and Login Selection (2 prominent cards: Farmer Login & Department Admin Login)
 * - Requirement 3: Dedicated Farmer Login Page (Farmer ID/mobile, password, show/hide, remember me, create account link)
 * - Requirement 4: Dedicated Farmer Create Account Page (Complete agricultural intake, unique ID, password hashing, no paid SMS)
 * - Requirement 5: Dedicated Department Admin Login (Official email/username, password, strict RBAC rejection of farmer accounts)
 */

import { store } from "../store.js";
import { t } from "../i18n.js";

export function renderLoginPortal(container, initialSubView = "selection") {
  // Check URL hash or parameter
  const hash = window.location.hash;
  let view = initialSubView;
  if (hash === "#farmer-login") view = "farmer-login";
  else if (hash === "#farmer-register") view = "farmer-register";
  else if (hash === "#admin-login") view = "admin-login";
  else if (hash === "#role-selection" || hash === "#portal") view = "selection";

  if (view === "farmer-login") {
    renderFarmerLoginPage(container);
  } else if (view === "farmer-register") {
    renderFarmerRegisterPage(container);
  } else if (view === "admin-login") {
    renderDepartmentLoginPage(container);
  } else {
    renderRoleSelectionPage(container);
  }
}

/**
 * 1. FIRST PAGE — WELCOME AND LOGIN SELECTION (Requirement 2)
 */
export function renderRoleSelectionPage(container) {
  window.location.hash = "role-selection";

  container.innerHTML = `
    <div class="login-selection-wrapper animate-fadeIn">
      <!-- Agricultural & Canal Visual Hero Card -->
      <div class="portal-hero-card" style="background: linear-gradient(135deg, #072317 0%, #0d3826 45%, #0d9488 100%); position: relative; overflow: hidden; padding: 2.5rem 2rem; border-radius: var(--radius-lg); color: white; margin-bottom: 2rem; box-shadow: var(--shadow-lg);">
        <div style="position: absolute; right: -20px; bottom: -20px; font-size: 14rem; opacity: 0.07; user-select: none; pointer-events: none;">💧</div>
        
        <div style="max-width: 820px; position: relative; z-index: 2;">
          <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(20, 184, 166, 0.25); border: 1px solid rgba(94, 234, 212, 0.4); padding: 0.35rem 0.85rem; border-radius: var(--radius-full); font-size: 0.82rem; font-weight: 700; color: #a7f3d0; margin-bottom: 1rem;">
            <span>💧</span> Godavari Left Bank Canal (GLBC) Irrigation Command Area
          </div>

          <h1 style="font-size: 2.5rem; font-weight: 800; line-height: 1.15; margin-bottom: 0.4rem; letter-spacing: -0.02em;">
            JalMitra AI <span style="font-weight: 600; color: #6ee7b7; font-size: 1.85rem;">(जलमित्र)</span>
          </h1>

          <div style="font-size: 1.25rem; font-weight: 600; color: #f0fdf4; margin-bottom: 0.75rem;">
            जलमित्र — किसानों के लिए स्मार्ट जल प्रबंधन
          </div>

          <p style="font-size: 1.35rem; font-weight: 700; color: #fef08a; margin-bottom: 0.75rem; font-style: italic;">
            "Smart Water. Fair Distribution. Stronger Farmers."
          </p>

          <p style="font-size: 0.95rem; color: #cbd5e1; line-height: 1.6; max-width: 720px; margin-bottom: 1.25rem;">
            AI-powered agricultural water-sharing dispute mediation and digital irrigation governance platform. Connecting tail-reach and head-reach cultivators with transparent water quotas, digital Warabandi scheduling, and explainable dispute resolution under human administrative oversight.
          </p>

          <div style="display: inline-flex; align-items: center; gap: 0.6rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.18); padding: 0.4rem 0.9rem; border-radius: var(--radius-md); font-size: 0.82rem; color: #e2e8f0;">
            <span>⚖️</span>
            <span><strong>Core Governance Principle:</strong> "AI Recommends. Humans Govern."</span>
          </div>
        </div>
      </div>

      <!-- Two Prominent Login Cards (Requirement 2) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.75rem; margin-bottom: 2rem;">
        
        <!-- Card 1: Farmer Login -->
        <div class="card login-card-selection" style="background: white; border: 2px solid #bbf7d0; border-radius: var(--radius-lg); padding: 2.25rem 2rem; box-shadow: var(--shadow-md); transition: all 0.25s ease; display: flex; flex-direction: column;">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
            <div style="width: 60px; height: 60px; border-radius: var(--radius-md); background: #ecfdf5; border: 2px solid #86efac; display: flex; align-items: center; justify-content: center; font-size: 2.2rem;">
              🌾
            </div>
            <div>
              <h2 style="font-size: 1.5rem; font-weight: 800; color: #065f46; margin-bottom: 0.2rem;">Farmer Login</h2>
              <div style="font-size: 0.85rem; color: #047857; font-weight: 600;">शेतकरी / किसान प्रवेश दालन</div>
            </div>
          </div>

          <p style="color: #475569; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.75rem; flex: 1;">
            Access verified water delivery history, submit seasonal irrigation requirements, track Warabandi rotation turns, report shortages, and resolve water disputes with AI mediation.
          </p>

          <div style="margin-top: auto;">
            <button id="btn-goto-farmer-login" class="btn btn-teal btn-block" style="padding: 0.85rem 1.25rem; font-size: 1.05rem; font-weight: 700; border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(13, 148, 136, 0.35);">
              🌾 Farmer Login →
            </button>
            <div style="text-align: center; margin-top: 0.85rem; font-size: 0.85rem; color: #64748b;">
              New farmer? <a href="#farmer-register" id="link-goto-register-card" style="color: #0d9488; font-weight: 700; text-decoration: underline;">Create Account</a>
            </div>
          </div>
        </div>

        <!-- Card 2: Department Admin Login -->
        <div class="card login-card-selection" style="background: white; border: 2px solid #bfdbfe; border-radius: var(--radius-lg); padding: 2.25rem 2rem; box-shadow: var(--shadow-md); transition: all 0.25s ease; display: flex; flex-direction: column;">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
            <div style="width: 60px; height: 60px; border-radius: var(--radius-md); background: #eff6ff; border: 2px solid #93c5fd; display: flex; align-items: center; justify-content: center; font-size: 2.2rem;">
              🏛️
            </div>
            <div>
              <h2 style="font-size: 1.5rem; font-weight: 800; color: #1e40af; margin-bottom: 0.2rem;">Department Admin Login</h2>
              <div style="font-size: 0.85rem; color: #1d4ed8; font-weight: 600;">जलसंपदा अधिकारी व प्रशासकीय दालन</div>
            </div>
          </div>

          <p style="color: #475569; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.75rem; flex: 1;">
            Operational command center for Executive Engineers, SDOs, and Gatekeepers to review farmer requests, compare supply with demand, recommend fair allocations, and record official decisions.
          </p>

          <div style="margin-top: auto;">
            <button id="btn-goto-admin-login" class="btn btn-block" style="background: #1e40af; color: white; padding: 0.85rem 1.25rem; font-size: 1.05rem; font-weight: 700; border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(30, 64, 175, 0.35);">
              🏛️ Department Login →
            </button>
            <div style="text-align: center; margin-top: 0.85rem; font-size: 0.85rem; color: #64748b;">
              Restricted to authorized irrigation department personnel
            </div>
          </div>
        </div>

      </div>

      <!-- Hackathon Demo Evaluation Helper Drawer -->
      <div class="card" style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: var(--radius-md); padding: 1.25rem 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
          <div style="font-size: 0.88rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 0.4rem;">
            <span>⚡</span> Hackathon Demo Evaluation Accounts (Click to test):
          </div>
          <span class="badge" style="background: #e2e8f0; color: #475569; font-size: 0.75rem;">Password for all: <code>kisan123</code> / <code>admin123</code></span>
        </div>

        <div style="display: flex; gap: 0.65rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-sm btn-outline-teal btn-quick-eval" data-role="farmer" data-id="9822004210" data-pass="kisan123">
            👨‍🌾 Ramesh Patil (Tail Reach - Cane 4.0 ac)
          </button>
          <button type="button" class="btn btn-sm btn-outline-teal btn-quick-eval" data-role="farmer" data-id="9422001108" data-pass="kisan123">
            👨‍🌾 Suresh Shinde (Head Reach - Cotton 5.0 ac)
          </button>
          <button type="button" class="btn btn-sm btn-outline-teal btn-quick-eval" data-role="farmer" data-id="9922008765" data-pass="kisan123">
            👩‍🌾 Sunita Gaikwad (Middle Reach - Onion 2.5 ac)
          </button>
          <button type="button" class="btn btn-sm btn-secondary btn-quick-eval" style="border-color: #93c5fd; color: #1e40af; background: #eff6ff;" data-role="officer" data-id="deshmukh.ee@jalmitra.gov.in" data-pass="admin123">
            🏛️ Er. S. Deshmukh (Executive Engineer)
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach button navigation listeners
  container.querySelector("#btn-goto-farmer-login")?.addEventListener("click", () => {
    renderFarmerLoginPage(container);
  });

  container.querySelector("#link-goto-register-card")?.addEventListener("click", (e) => {
    e.preventDefault();
    renderFarmerRegisterPage(container);
  });

  container.querySelector("#btn-goto-admin-login")?.addEventListener("click", () => {
    renderDepartmentLoginPage(container);
  });

  // Quick evaluation auto-logins for judges
  container.querySelectorAll(".btn-quick-eval").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      const pass = btn.getAttribute("data-pass");
      const role = btn.getAttribute("data-role");
      await executeLogin(id, pass, role, container);
    });
  });
}

/**
 * 2. DEDICATED FARMER LOGIN PAGE (Requirement 3)
 */
export function renderFarmerLoginPage(container) {
  window.location.hash = "farmer-login";

  container.innerHTML = `
    <div class="auth-page-container animate-fadeIn" style="max-width: 520px; margin: 2rem auto; padding: 0 1rem;">
      <div style="margin-bottom: 1.25rem;">
        <button id="btn-back-to-roles" class="btn btn-sm btn-secondary" style="font-weight: 600;">
          ← Back to Role Selection
        </button>
      </div>

      <div class="card" style="background: white; border: 2px solid #bbf7d0; border-radius: var(--radius-lg); padding: 2.25rem; box-shadow: var(--shadow-lg);">
        <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1.25rem;">
          <div style="width: 50px; height: 50px; border-radius: 50%; background: #ecfdf5; border: 2px solid #86efac; display: flex; align-items: center; justify-content: center; font-size: 1.8rem;">
            🌾
          </div>
          <div>
            <h2 style="font-size: 1.45rem; font-weight: 800; color: #065f46; margin-bottom: 0.15rem;">Farmer Login</h2>
            <div style="font-size: 0.82rem; color: #047857; font-weight: 600;">शेतकरी / किसान प्रवेश</div>
          </div>
        </div>

        <div id="farmer-login-alert" style="display: none; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.88rem; margin-bottom: 1.25rem;"></div>

        <form id="form-farmer-login-dedicated">
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label" style="font-weight: 700; color: #1e293b; margin-bottom: 0.4rem; display: block;">
              Farmer ID or Registered Mobile Number <span class="required" style="color: #ef4444;">*</span>
            </label>
            <div class="input-with-icon" style="position: relative;">
              <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 1.1rem; color: #64748b;">📱</span>
              <input type="text" id="farmer-id-input" class="form-control" placeholder="e.g. 9822004210 or FARMER-MH-081" required style="padding-left: 2.4rem; height: 46px; border-radius: var(--radius-md); border: 1.5px solid #cbd5e1; width: 100%; font-size: 0.95rem;" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label" style="font-weight: 700; color: #1e293b; margin-bottom: 0.4rem; display: block;">
              Password <span class="required" style="color: #ef4444;">*</span>
            </label>
            <div class="input-with-icon" style="position: relative;">
              <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 1.1rem; color: #64748b;">🔒</span>
              <input type="password" id="farmer-password-input" class="form-control" placeholder="Enter password" required style="padding-left: 2.4rem; padding-right: 2.6rem; height: 46px; border-radius: var(--radius-md); border: 1.5px solid #cbd5e1; width: 100%; font-size: 0.95rem;" />
              <button type="button" id="btn-toggle-farmer-pass" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #64748b;" title="Show/Hide Password">
                👁️
              </button>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; font-size: 0.85rem;">
            <label style="display: flex; align-items: center; gap: 0.45rem; cursor: pointer; color: #475569;">
              <input type="checkbox" id="farmer-remember-me" checked />
              <span>Remember me</span>
            </label>
            <a href="#" id="link-farmer-forgot" style="color: #0d9488; font-weight: 600; text-decoration: none;">Forgot Password?</a>
          </div>

          <button type="submit" id="btn-farmer-submit" class="btn btn-teal btn-block" style="height: 48px; font-size: 1.05rem; font-weight: 700; border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(13, 148, 136, 0.35);">
            🌾 Enter Farmer Dashboard
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid #f1f5f9; font-size: 0.9rem; color: #475569;">
          Don't have a registered Farmer ID?  
          <a href="#farmer-register" id="link-open-registration" style="color: #0d9488; font-weight: 700; text-decoration: underline; margin-left: 0.25rem;">
            Create Farmer Account
          </a>
        </div>

        <!-- Evaluation Quick Buttons -->
        <div style="margin-top: 1.5rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: var(--radius-md); padding: 0.85rem;">
          <div style="font-size: 0.78rem; font-weight: 700; color: #64748b; margin-bottom: 0.5rem;">⚡ Instant Demo Logins:</div>
          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
            <button type="button" class="btn btn-sm btn-outline-teal btn-fill-demo" data-id="9822004210" data-pass="kisan123">Ramesh Patil</button>
            <button type="button" class="btn btn-sm btn-outline-teal btn-fill-demo" data-id="9422001108" data-pass="kisan123">Suresh Shinde</button>
            <button type="button" class="btn btn-sm btn-outline-teal btn-fill-demo" data-id="9922008765" data-pass="kisan123">Sunita Gaikwad</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach controls
  container.querySelector("#btn-back-to-roles")?.addEventListener("click", () => renderRoleSelectionPage(container));
  container.querySelector("#link-open-registration")?.addEventListener("click", (e) => {
    e.preventDefault();
    renderFarmerRegisterPage(container);
  });

  const passInput = container.querySelector("#farmer-password-input");
  container.querySelector("#btn-toggle-farmer-pass")?.addEventListener("click", () => {
    if (passInput) passInput.type = passInput.type === "password" ? "text" : "password";
  });

  container.querySelector("#link-farmer-forgot")?.addEventListener("click", (e) => {
    e.preventDefault();
    showSimulatedRecoveryModal("farmer");
  });

  container.querySelectorAll(".btn-fill-demo").forEach(btn => {
    btn.addEventListener("click", () => {
      const idInput = container.querySelector("#farmer-id-input");
      if (idInput && passInput) {
        idInput.value = btn.getAttribute("data-id");
        passInput.value = btn.getAttribute("data-pass");
      }
    });
  });

  // Handle submit
  const form = container.querySelector("#form-farmer-login-dedicated");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = container.querySelector("#farmer-id-input")?.value?.trim();
    const pass = passInput?.value?.trim();
    await executeLogin(id, pass, "farmer", container);
  });
}

/**
 * 3. DEDICATED FARMER CREATE ACCOUNT PAGE (Requirement 4)
 */
export function renderFarmerRegisterPage(container) {
  window.location.hash = "farmer-register";

  // Auto-generate suggested ID
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const suggestedId = `JM-FARM-${randomSuffix}`;

  container.innerHTML = `
    <div class="auth-page-container animate-fadeIn" style="max-width: 680px; margin: 1.5rem auto; padding: 0 1rem;">
      <div style="margin-bottom: 1.25rem;">
        <button id="btn-back-to-farmer-login" class="btn btn-sm btn-secondary" style="font-weight: 600;">
          ← Back to Farmer Login
        </button>
      </div>

      <div class="card" style="background: white; border: 2px solid #86efac; border-radius: var(--radius-lg); padding: 2rem; box-shadow: var(--shadow-lg);">
        <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1.25rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem;">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: #ecfdf5; border: 2px solid #86efac; display: flex; align-items: center; justify-content: center; font-size: 1.6rem;">
            📝
          </div>
          <div>
            <h2 style="font-size: 1.45rem; font-weight: 800; color: #065f46; margin-bottom: 0.15rem;">Farmer Registration</h2>
            <div style="font-size: 0.82rem; color: #047857; font-weight: 600;">नवीन शेतकरी / किसान नोंदणी</div>
          </div>
        </div>

        <div id="farmer-reg-alert" style="display: none; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.88rem; margin-bottom: 1.25rem;"></div>

        <form id="form-farmer-register-dedicated">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 700; font-size: 0.88rem;">Farmer Full Name <span style="color:#ef4444;">*</span></label>
              <input type="text" id="reg-name" class="form-control" placeholder="e.g. Dnyaneshwar Bhor" required style="height: 42px;" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 700; font-size: 0.88rem;">Assigned Farmer ID</label>
              <input type="text" id="reg-fid" class="form-control" value="${suggestedId}" readonly style="height: 42px; background: #f8fafc; font-weight: 700; color: #065f46;" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 700; font-size: 0.88rem;">10-Digit Mobile Number <span style="color:#ef4444;">*</span></label>
              <input type="tel" id="reg-mobile" class="form-control" pattern="[0-9]{10}" placeholder="e.g. 9822114455" required style="height: 42px;" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 700; font-size: 0.88rem;">Plot / Gat / Survey Number</label>
              <input type="text" id="reg-gat" class="form-control" placeholder="e.g. Gat 142/2" required style="height: 42px;" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 700; font-size: 0.88rem;">Village <span style="color:#ef4444;">*</span></label>
              <input type="text" id="reg-village" class="form-control" placeholder="e.g. Niphad" required style="height: 42px;" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 700; font-size: 0.88rem;">District <span style="color:#ef4444;">*</span></label>
              <input type="text" id="reg-district" class="form-control" value="Nashik" required style="height: 42px;" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 700; font-size: 0.88rem;">State <span style="color:#ef4444;">*</span></label>
              <input type="text" id="reg-state" class="form-control" value="Maharashtra" required style="height: 42px;" />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 700; font-size: 0.88rem;">Agricultural Land Area (Acres) <span style="color:#ef4444;">*</span></label>
              <input type="number" id="reg-area" class="form-control" min="0.5" max="50" step="0.5" value="3.5" required style="height: 42px;" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 700; font-size: 0.88rem;">Primary Crop Type <span style="color:#ef4444;">*</span></label>
              <select id="reg-crop" class="form-select" required style="height: 42px;">
                <option value="Sugarcane">Sugarcane (ऊस)</option>
                <option value="Cotton">Cotton (कापूस)</option>
                <option value="Onion" selected>Onion (कांदा)</option>
                <option value="Soybean">Soybean (सोयाबीन)</option>
                <option value="Wheat">Wheat (गहू)</option>
                <option value="Grapes">Grapes (द्राक्ष)</option>
                <option value="Vegetables">Vegetables (भाजीपाला)</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label" style="font-weight: 700; font-size: 0.88rem;">Irrigation Canal / Water Distribution Zone <span style="color:#ef4444;">*</span></label>
            <select id="reg-gate" class="form-select" required style="height: 42px;">
              <option value="Gate-1">Gate 1 - Sukene Distributary (Head Reach, 4.5 km)</option>
              <option value="Gate-2">Gate 2 - Ozar Minor (Head Reach, 9.2 km)</option>
              <option value="Gate-3">Gate 3 - Pimpalgaon Outlet A (Middle Reach, 16.8 km)</option>
              <option value="Gate-4">Gate 4 - Pimpalgaon Outlet B (Middle Reach, 22.4 km)</option>
              <option value="Gate-5" selected>Gate 5 - Niphad Distributary (Tail Reach, 31.0 km)</option>
              <option value="Gate-6">Gate 6 - Chandori Tail End (Extreme Tail, 38.5 km)</option>
            </select>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 700; font-size: 0.88rem;">Password (Min 6 chars) <span style="color:#ef4444;">*</span></label>
              <input type="password" id="reg-pass" class="form-control" minlength="6" placeholder="Create password" required style="height: 42px;" />
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 700; font-size: 0.88rem;">Confirm Password <span style="color:#ef4444;">*</span></label>
              <input type="password" id="reg-pass-conf" class="form-control" minlength="6" placeholder="Repeat password" required style="height: 42px;" />
            </div>
          </div>

          <div style="margin-bottom: 1.5rem; font-size: 0.85rem; color: #475569;">
            <label style="display: flex; align-items: flex-start; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" id="reg-terms" required style="margin-top: 3px;" />
              <span>I hereby acknowledge the water governance rules and agree to transparent digital Warabandi scheduling. (SMS verification is simulated for demonstration).</span>
            </label>
          </div>

          <button type="submit" id="btn-reg-submit" class="btn btn-teal btn-block" style="height: 48px; font-size: 1.05rem; font-weight: 700; border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(13, 148, 136, 0.35);">
            📝 Complete Registration & Enter Portal
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.25rem; font-size: 0.88rem; color: #64748b;">
          Already registered? <a href="#farmer-login" id="link-goto-login-back" style="color: #0d9488; font-weight: 700; text-decoration: underline;">Back to Login</a>
        </div>
      </div>
    </div>
  `;

  // Attach navigation
  container.querySelector("#btn-back-to-farmer-login")?.addEventListener("click", () => renderFarmerLoginPage(container));
  container.querySelector("#link-goto-login-back")?.addEventListener("click", (e) => {
    e.preventDefault();
    renderFarmerLoginPage(container);
  });

  // Handle registration submission
  const form = container.querySelector("#form-farmer-register-dedicated");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const alertBox = container.querySelector("#farmer-reg-alert");
    const name = container.querySelector("#reg-name")?.value?.trim();
    const fid = container.querySelector("#reg-fid")?.value?.trim();
    const mobile = container.querySelector("#reg-mobile")?.value?.trim();
    const gat = container.querySelector("#reg-gat")?.value?.trim();
    const village = container.querySelector("#reg-village")?.value?.trim();
    const district = container.querySelector("#reg-district")?.value?.trim();
    const state = container.querySelector("#reg-state")?.value?.trim();
    const area = parseFloat(container.querySelector("#reg-area")?.value || "3.5");
    const crop = container.querySelector("#reg-crop")?.value;
    const gate = container.querySelector("#reg-gate")?.value;
    const pass = container.querySelector("#reg-pass")?.value;
    const conf = container.querySelector("#reg-pass-conf")?.value;

    if (pass !== conf) {
      if (alertBox) {
        alertBox.style.display = "block";
        alertBox.style.background = "#fef2f2";
        alertBox.style.color = "#991b1b";
        alertBox.textContent = "Passwords do not match. Please verify and retry.";
      }
      return;
    }

    try {
      const resp = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmer_id: fid,
          name,
          mobile,
          gat_no: gat,
          village,
          district,
          state,
          farm_area_acres: area,
          crop,
          season: "Rabi",
          gate_id: gate,
          password: pass
        })
      });

      const res = await resp.json();
      if (!resp.ok || !res.success) {
        if (alertBox) {
          alertBox.style.display = "block";
          alertBox.style.background = "#fef2f2";
          alertBox.style.color = "#991b1b";
          alertBox.textContent = res.error || "Registration failed. Mobile may already be registered.";
        }
        return;
      }

      // Success: Log in new farmer
      store.loginUser(res.user);
      store.setRole("farmer");
      store.setActiveFarmer(res.farmer ? res.farmer.id : res.user.id);

      if (window.showToast) {
        window.showToast(`Welcome ${name}! Your assigned Farmer ID is ${res.user.id}.`, "success");
      }
    } catch (err) {
      console.error(err);
      if (alertBox) {
        alertBox.style.display = "block";
        alertBox.style.background = "#fef2f2";
        alertBox.style.color = "#991b1b";
        alertBox.textContent = "Network error communicating with server.";
      }
    }
  });
}

/**
 * 4. DEDICATED DEPARTMENT ADMIN LOGIN PAGE (Requirement 5)
 */
export function renderDepartmentLoginPage(container) {
  window.location.hash = "admin-login";

  container.innerHTML = `
    <div class="auth-page-container animate-fadeIn" style="max-width: 520px; margin: 2rem auto; padding: 0 1rem;">
      <div style="margin-bottom: 1.25rem;">
        <button id="btn-back-to-roles-admin" class="btn btn-sm btn-secondary" style="font-weight: 600;">
          ← Back to Role Selection
        </button>
      </div>

      <div class="card" style="background: white; border: 2px solid #93c5fd; border-radius: var(--radius-lg); padding: 2.25rem; box-shadow: var(--shadow-lg);">
        <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1.25rem;">
          <div style="width: 50px; height: 50px; border-radius: 50%; background: #eff6ff; border: 2px solid #93c5fd; display: flex; align-items: center; justify-content: center; font-size: 1.8rem;">
            🏛️
          </div>
          <div>
            <h2 style="font-size: 1.45rem; font-weight: 800; color: #1e40af; margin-bottom: 0.15rem;">Department Admin Login</h2>
            <div style="font-size: 0.82rem; color: #1d4ed8; font-weight: 600;">जलसंपदा अधिकारी व प्रशासकीय दालन</div>
          </div>
        </div>

        <div id="admin-login-alert" style="display: none; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.88rem; margin-bottom: 1.25rem;"></div>

        <form id="form-admin-login-dedicated">
          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label" style="font-weight: 700; color: #1e293b; margin-bottom: 0.4rem; display: block;">
              Official Username or Government Email <span class="required" style="color: #ef4444;">*</span>
            </label>
            <div class="input-with-icon" style="position: relative;">
              <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 1.1rem; color: #64748b;">🆔</span>
              <input type="text" id="admin-id-input" class="form-control" placeholder="e.g. deshmukh.ee@jalmitra.gov.in or admin" required style="padding-left: 2.4rem; height: 46px; border-radius: var(--radius-md); border: 1.5px solid #cbd5e1; width: 100%; font-size: 0.95rem;" />
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label class="form-label" style="font-weight: 700; color: #1e293b; margin-bottom: 0.4rem; display: block;">
              Administrative Password <span class="required" style="color: #ef4444;">*</span>
            </label>
            <div class="input-with-icon" style="position: relative;">
              <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 1.1rem; color: #64748b;">🔑</span>
              <input type="password" id="admin-password-input" class="form-control" placeholder="Enter administrative password" required style="padding-left: 2.4rem; padding-right: 2.6rem; height: 46px; border-radius: var(--radius-md); border: 1.5px solid #cbd5e1; width: 100%; font-size: 0.95rem;" />
              <button type="button" id="btn-toggle-admin-pass" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #64748b;" title="Show/Hide Password">
                👁️
              </button>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; font-size: 0.85rem;">
            <label style="display: flex; align-items: center; gap: 0.45rem; cursor: pointer; color: #475569;">
              <input type="checkbox" id="admin-remember-me" checked />
              <span>Remember official session</span>
            </label>
            <a href="#" id="link-admin-forgot" style="color: #1e40af; font-weight: 600; text-decoration: none;">Forgot Password?</a>
          </div>

          <button type="submit" id="btn-admin-submit" class="btn btn-block" style="background: #1e40af; color: white; height: 48px; font-size: 1.05rem; font-weight: 700; border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(30, 64, 175, 0.35);">
            🏛️ Enter Department Command Center
          </button>
        </form>

        <!-- Demo credentials box for hackathon -->
        <div style="margin-top: 1.75rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-md); padding: 1rem;">
          <div style="font-size: 0.82rem; font-weight: 700; color: #1e40af; margin-bottom: 0.4rem;">
            🏛️ Hackathon Demo Officer Credentials:
          </div>
          <div style="font-size: 0.82rem; color: #334155; line-height: 1.5;">
            • Username: <code>deshmukh.ee@jalmitra.gov.in</code> (or <code>admin</code>)<br>
            • Password: <code>admin123</code>
          </div>
          <button type="button" id="btn-fill-admin-demo" class="btn btn-sm" style="margin-top: 0.6rem; background: #1e40af; color: white; font-size: 0.78rem;">
            ⚡ Auto-Fill Officer Credentials
          </button>
        </div>

        <div style="text-align: center; margin-top: 1.25rem; font-size: 0.82rem; color: #64748b;">
          Notice: Public administrator self-registration is strictly disabled for security.
        </div>
      </div>
    </div>
  `;

  // Attach controls
  container.querySelector("#btn-back-to-roles-admin")?.addEventListener("click", () => renderRoleSelectionPage(container));

  const passInput = container.querySelector("#admin-password-input");
  container.querySelector("#btn-toggle-admin-pass")?.addEventListener("click", () => {
    if (passInput) passInput.type = passInput.type === "password" ? "text" : "password";
  });

  container.querySelector("#link-admin-forgot")?.addEventListener("click", (e) => {
    e.preventDefault();
    showSimulatedRecoveryModal("officer");
  });

  container.querySelector("#btn-fill-admin-demo")?.addEventListener("click", () => {
    const idInput = container.querySelector("#admin-id-input");
    if (idInput && passInput) {
      idInput.value = "deshmukh.ee@jalmitra.gov.in";
      passInput.value = "admin123";
    }
  });

  // Handle submit
  const form = container.querySelector("#form-admin-login-dedicated");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = container.querySelector("#admin-id-input")?.value?.trim();
    const pass = passInput?.value?.trim();
    await executeLogin(id, pass, "officer", container);
  });
}

/**
 * Common Login Execution Function with Strict RBAC (Requirements 3 & 5)
 */
async function executeLogin(identifier, password, requiredRole, container) {
  const alertId = requiredRole === "farmer" ? "#farmer-login-alert" : "#admin-login-alert";
  const alertBox = container.querySelector(alertId) || container.querySelector("#farmer-login-alert") || container.querySelector("#admin-login-alert");

  try {
    const resp = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password, role: requiredRole })
    });

    const res = await resp.json();

    if (!resp.ok || !res.success) {
      if (alertBox) {
        alertBox.style.display = "block";
        alertBox.style.background = "#fef2f2";
        alertBox.style.color = "#991b1b";
        alertBox.textContent = res.error || "Authentication failed. Check your credentials.";
      }
      return;
    }

    const user = res.user;

    // Strict Role Enforcement
    if (requiredRole && user.role !== requiredRole) {
      if (alertBox) {
        alertBox.style.display = "block";
        alertBox.style.background = "#fef2f2";
        alertBox.style.color = "#991b1b";
        if (requiredRole === "officer") {
          alertBox.textContent = "Access Denied: Ordinary farmer accounts cannot access the Department Command Center.";
        } else {
          alertBox.textContent = "Access Restricted: Administrative accounts must log in via the Department Portal.";
        }
      }
      return;
    }

    // Set authenticated user in store
    store.loginUser(user);

    if (user.role === "farmer") {
      store.setRole("farmer");
      store.setActiveFarmer(user.id);
      window.location.hash = "farmer-portal";
    } else {
      store.setRole("officer");
      window.location.hash = "officer-portal";
    }

    if (window.showToast) {
      window.showToast(`Welcome back, ${user.name}!`, "success");
    }
  } catch (err) {
    console.error(err);
    if (alertBox) {
      alertBox.style.display = "block";
      alertBox.style.background = "#fef2f2";
      alertBox.style.color = "#991b1b";
      alertBox.textContent = "Server communication error. Please check backend connection.";
    }
  }
}

/**
 * Simulated Password Recovery Modal (No paid SMS/email required)
 */
function showSimulatedRecoveryModal(role) {
  let modal = document.getElementById("recovery-modal");
  if (modal) modal.remove();

  modal = document.createElement("div");
  modal.id = "recovery-modal";
  modal.className = "modal-backdrop animate-fadeIn";
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.background = "rgba(0,0,0,0.6)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "9999";

  modal.innerHTML = `
    <div class="card" style="background: white; max-width: 440px; width: 90%; padding: 2rem; border-radius: var(--radius-lg); box-shadow: var(--shadow-lg);">
      <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">
        ${role === "farmer" ? "🌾 Farmer Password Assistance" : "🏛️ Authority Access Recovery"}
      </h3>
      <p style="font-size: 0.88rem; color: #64748b; line-height: 1.5; margin-bottom: 1.25rem;">
        ${role === "farmer" ? "Enter your registered 10-digit mobile number to receive a simulated SMS verification OTP." : "Official email recovery request will be dispatched to the Divisional IT Officer."}
      </p>

      <div class="form-group" style="margin-bottom: 1rem;">
        <label class="form-label" style="font-size: 0.85rem; font-weight: 700;">${role === "farmer" ? "Registered Mobile Number" : "Department Email"}</label>
        <input type="text" id="recovery-input" class="form-control" placeholder="${role === "farmer" ? "e.g. 9822004210" : "deshmukh.ee@jalmitra.gov.in"}" style="height: 42px;" />
      </div>

      <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.8rem; color: #475569; margin-bottom: 1.25rem;">
        ℹ️ <strong>Hackathon Notice:</strong> In this evaluation environment, external paid SMS gateways (Twilio/KisanSMS) are simulated. Use default password <code>${role === "farmer" ? "kisan123" : "admin123"}</code> for immediate login.
      </div>

      <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
        <button type="button" id="btn-cancel-recovery" class="btn btn-secondary btn-sm">Cancel</button>
        <button type="button" id="btn-send-recovery" class="btn btn-teal btn-sm">Submit Request</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#btn-cancel-recovery")?.addEventListener("click", () => modal.remove());
  modal.querySelector("#btn-send-recovery")?.addEventListener("click", () => {
    if (window.showToast) {
      window.showToast(`Simulated OTP/Recovery alert registered. For demo, use '${role === "farmer" ? "kisan123" : "admin123"}'.`, "info");
    }
    modal.remove();
  });
}
