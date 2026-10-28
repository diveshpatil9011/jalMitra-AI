/**
 * JalMitra AI - Authentication & Role Management Component (Module 2)
 * Demonstrates role-based access control, switchable demo accounts,
 * registration forms, and profile management.
 */

import { store } from "../store.js";

export function renderAuthModal(container, onClose) {
  const state = store.getState();
  const currentRole = state.activeRole;

  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  modalOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(15, 23, 42, 0.7); display: flex; align-items: center;
    justify-content: center; z-index: 1000; padding: 1rem; backdrop-filter: blur(4px);
  `;

  modalOverlay.innerHTML = `
    <div class="card" style="max-width: 650px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; animation: fadeIn 0.2s ease;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 40px; height: 40px; background: var(--teal-accent); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
            🔐
          </div>
          <div>
            <h3 style="color: var(--primary); font-size: 1.25rem; font-weight: 800;">JalMitra Authentication & Role Switcher</h3>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Access Farmer Portal, Department Command Center, or Demo Persona</div>
          </div>
        </div>
        <button id="btn-close-modal" class="btn btn-secondary btn-sm" style="font-size: 1.2rem; padding: 0.2rem 0.6rem; line-height: 1;">&times;</button>
      </div>

      <!-- Quick Switch Tabs -->
      <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--surface-border); padding-bottom: 0.5rem;">
        <button id="tab-demo-accounts" class="btn btn-teal btn-sm">⚡ 1-Click Demo Accounts</button>
        <button id="tab-farmer-login" class="btn btn-secondary btn-sm">🌾 Farmer Sign In</button>
        <button id="tab-officer-login" class="btn btn-secondary btn-sm">🏛️ Department Authority</button>
        <button id="tab-register" class="btn btn-secondary btn-sm">📝 New Registration</button>
      </div>

      <!-- Tab Content Area -->
      <div id="auth-tab-content"></div>
    </div>
  `;

  document.body.appendChild(modalOverlay);

  const close = () => {
    modalOverlay.remove();
    if (onClose) onClose();
  };

  modalOverlay.querySelector("#btn-close-modal")?.addEventListener("click", close);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) close();
  });

  const contentArea = modalOverlay.querySelector("#auth-tab-content");

  // Tab 1: 1-Click Demo Accounts
  const showDemoAccounts = () => {
    contentArea.innerHTML = `
      <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">
        Click any verified demo persona to instantly switch portal access with pre-configured farm data and permissions:
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem;">
        <!-- Ramesh Patil (Tail Reach Farmer) -->
        <div class="card demo-account-card" data-role="farmer" data-farmer="FARMER-MH-081" style="margin-bottom: 0; cursor: pointer; border-left: 4px solid #ef4444; padding: 0.85rem 1rem; transition: transform 0.15s ease;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: var(--primary); font-size: 0.95rem;">👨‍🌾 Ramesh Patil</strong>
              <span class="badge badge-danger" style="font-size: 0.7rem; margin-left: 0.5rem;">Tail Reach Farmer</span>
              <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">
                📍 Niphad (Gate-5, 31.0 km) • 4.0 Acres • Sugarcane (Grand Growth stage) • 🚨 Active Dispute #DISP-001
              </div>
            </div>
            <button class="btn btn-teal btn-sm">Select & Enter</button>
          </div>
        </div>

        <!-- Suresh Shinde (Head Reach Farmer) -->
        <div class="card demo-account-card" data-role="farmer" data-farmer="FARMER-MH-014" style="margin-bottom: 0; cursor: pointer; border-left: 4px solid #0284c7; padding: 0.85rem 1rem; transition: transform 0.15s ease;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: var(--primary); font-size: 0.95rem;">👨‍🌾 Suresh Shinde</strong>
              <span class="badge badge-info" style="font-size: 0.7rem; margin-left: 0.5rem;">Head Reach Farmer</span>
              <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">
                📍 Sukene (Gate-1, 4.5 km) • 5.0 Acres • Cotton (Flowering stage) • Standard Head Turn
              </div>
            </div>
            <button class="btn btn-secondary btn-sm">Select & Enter</button>
          </div>
        </div>

        <!-- Sunita Gaikwad (Middle Reach Drip Farmer) -->
        <div class="card demo-account-card" data-role="farmer" data-farmer="FARMER-MH-032" style="margin-bottom: 0; cursor: pointer; border-left: 4px solid #10b981; padding: 0.85rem 1rem; transition: transform 0.15s ease;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: var(--primary); font-size: 0.95rem;">👩‍🌾 Sunita Gaikwad</strong>
              <span class="badge badge-success" style="font-size: 0.7rem; margin-left: 0.5rem;">Middle Reach Farmer</span>
              <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">
                📍 Pimpalgaon (Gate-3, 16.8 km) • 2.5 Acres • Onion (Bulb Formation) • Drip Irrigation Verified
              </div>
            </div>
            <button class="btn btn-secondary btn-sm">Select & Enter</button>
          </div>
        </div>

        <!-- Er. S. Deshmukh (Executive Engineer) -->
        <div class="card demo-account-card" data-role="officer" style="margin-bottom: 0; cursor: pointer; border-left: 4px solid #0f172a; padding: 0.85rem 1rem; background: #f8fafc; transition: transform 0.15s ease;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #0f172a; font-size: 0.95rem;">🏛️ Er. S. Deshmukh</strong>
              <span class="badge" style="background: #0f172a; color: white; font-size: 0.7rem; margin-left: 0.5rem;">Executive Engineer (Authority)</span>
              <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">
                Department of Water Resources • GLBC Division Nashik • Full Regulatory Approval & Ratification Powers
              </div>
            </div>
            <button class="btn btn-teal btn-sm" style="background: #0f172a;">Enter Command Center</button>
          </div>
        </div>
      </div>
    `;

    contentArea.querySelectorAll(".demo-account-card").forEach(card => {
      card.addEventListener("click", () => {
        const role = card.getAttribute("data-role");
        const farmerId = card.getAttribute("data-farmer");
        if (farmerId) store.setFarmer(farmerId);
        store.setRole(role);
        if (window.showToast) {
          window.showToast(`Switched persona to ${card.querySelector("strong").textContent}`, "success");
        }
        close();
      });
    });
  };

  // Tab 2: Standard Farmer Login
  const showFarmerLogin = () => {
    contentArea.innerHTML = `
      <form id="form-farmer-login" style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <label class="form-label">Registered Mobile Number / Farmer ID</label>
          <input type="text" id="login-farmer-id" class="form-input" value="FARMER-MH-081" required>
        </div>
        <div>
          <label class="form-label">Security PIN / Password</label>
          <input type="password" id="login-farmer-pin" class="form-input" value="••••••" required>
        </div>
        <button type="submit" class="btn btn-teal" style="padding: 0.7rem;">
          🌾 Sign In to Farmer Dashboard
        </button>
      </form>
    `;
    contentArea.querySelector("#form-farmer-login")?.addEventListener("submit", (e) => {
      e.preventDefault();
      store.setRole("farmer");
      if (window.showToast) window.showToast("Signed in successfully as registered farmer.", "success");
      close();
    });
  };

  // Tab 3: Officer Login
  const showOfficerLogin = () => {
    contentArea.innerHTML = `
      <form id="form-officer-login" style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <label class="form-label">Officer Employee Code (HRMS / CAD)</label>
          <input type="text" class="form-input" value="OFFICER-ENG-01" required>
        </div>
        <div>
          <label class="form-label">Departmental Security Token / Passphrase</label>
          <input type="password" class="form-input" value="••••••••••••" required>
        </div>
        <div>
          <label class="form-label">Assigned Canal Command</label>
          <input type="text" class="form-input" value="Godavari Left Bank Canal Division" readonly style="background: #f1f5f9;">
        </div>
        <button type="submit" class="btn btn-teal" style="background: #0f172a; padding: 0.7rem;">
          🏛️ Authenticate as Executive Engineer
        </button>
      </form>
    `;
    contentArea.querySelector("#form-officer-login")?.addEventListener("submit", (e) => {
      e.preventDefault();
      store.setRole("officer");
      if (window.showToast) window.showToast("Officer authenticated. Command Center activated.", "success");
      close();
    });
  };

  // Tab 4: New Farm / Farmer Registration
  const showRegistration = () => {
    contentArea.innerHTML = `
      <form id="form-register" style="display: flex; flex-direction: column; gap: 0.85rem;">
        <div class="grid-2" style="gap: 0.75rem;">
          <div>
            <label class="form-label">Farmer Full Name</label>
            <input type="text" id="reg-name" class="form-input" placeholder="e.g. Dnyaneshwar Bhor" required>
          </div>
          <div>
            <label class="form-label">Mobile Number</label>
            <input type="tel" id="reg-phone" class="form-input" placeholder="+91 98221 XXXXX" required>
          </div>
        </div>

        <div class="grid-3" style="gap: 0.75rem;">
          <div>
            <label class="form-label">Village</label>
            <select id="reg-village" class="form-select">
              <option value="Niphad">Niphad (Tail Reach)</option>
              <option value="Pimpalgaon">Pimpalgaon (Middle Reach)</option>
              <option value="Sukene">Sukene (Head Reach)</option>
              <option value="Ozar">Ozar (Head Reach)</option>
              <option value="Chandori">Chandori (Tail End)</option>
            </select>
          </div>
          <div>
            <label class="form-label">Gat / Survey Number</label>
            <input type="text" id="reg-gat" class="form-input" placeholder="e.g. 184/B" required>
          </div>
          <div>
            <label class="form-label">Farm Area (Acres)</label>
            <input type="number" id="reg-area" class="form-input" value="3.5" min="0.5" max="50" step="0.1" required>
          </div>
        </div>

        <div class="grid-3" style="gap: 0.75rem;">
          <div>
            <label class="form-label">Primary Crop</label>
            <select id="reg-crop" class="form-select">
              <option value="Sugarcane">Sugarcane</option>
              <option value="Cotton">Cotton</option>
              <option value="Onion">Onion</option>
              <option value="Soybean">Soybean</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Wheat">Wheat</option>
            </select>
          </div>
          <div>
            <label class="form-label">Soil Type</label>
            <select id="reg-soil" class="form-select">
              <option value="Black Cotton">Black Cotton</option>
              <option value="Loamy">Loamy</option>
              <option value="Sandy Loam">Sandy Loam</option>
              <option value="Alluvial">Alluvial</option>
            </select>
          </div>
          <div>
            <label class="form-label">Irrigation Method</label>
            <select id="reg-method" class="form-select">
              <option value="Drip">Drip Irrigation</option>
              <option value="Sprinkler">Sprinkler</option>
              <option value="Furrow">Furrow</option>
              <option value="Flood">Flood (Surface)</option>
            </select>
          </div>
        </div>

        <div>
          <label class="form-label">Assigned Canal Outlet Gate</label>
          <select id="reg-gate" class="form-select">
            <option value="Gate-5">Gate-5: Niphad Distributary (Tail Reach)</option>
            <option value="Gate-3">Gate-3: Pimpalgaon Outlet A (Middle Reach)</option>
            <option value="Gate-4">Gate-4: Pimpalgaon Outlet B (Middle Reach)</option>
            <option value="Gate-1">Gate-1: Sukene Distributary (Head Reach)</option>
            <option value="Gate-2">Gate-2: Ozar Minor (Head Reach)</option>
            <option value="Gate-6">Gate-6: Chandori Tail End (Tail Reach)</option>
          </select>
        </div>

        <button type="submit" class="btn btn-teal" style="margin-top: 0.5rem; padding: 0.7rem;">
          📝 Register Farm & Create JalMitra Account
        </button>
      </form>
    `;

    contentArea.querySelector("#form-register")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const newFarmer = {
        id: `FARMER-MH-${String(state.farmers.length + 10).padStart(3, "0")}`,
        name: contentArea.querySelector("#reg-name").value,
        village: contentArea.querySelector("#reg-village").value,
        gat_no: contentArea.querySelector("#reg-gat").value,
        farm_area_acres: parseFloat(contentArea.querySelector("#reg-area").value),
        crop: contentArea.querySelector("#reg-crop").value,
        growth_stage: "Vegetative",
        soil_type: contentArea.querySelector("#reg-soil").value,
        irrigation_method: contentArea.querySelector("#reg-method").value,
        gate_id: contentArea.querySelector("#reg-gate").value,
        reach: contentArea.querySelector("#reg-gate").value.includes("5") || contentArea.querySelector("#reg-gate").value.includes("6") ? "Tail" : "Middle",
        distance_km: 26.5,
        current_cycle_received: 0.0,
        water_deficit: 4.5,
        turn_schedule: "Friday 08:00 AM - 04:00 PM",
        phone_masked: "+91 98****9900"
      };

      state.farmers.push(newFarmer);
      store.setFarmer(newFarmer.id);
      store.setRole("farmer");
      store.addAuditEvent(newFarmer.name, "Farmer", "REGISTER_FARM", newFarmer.id, `Registered farm ${newFarmer.gat_no} in ${newFarmer.village} (${newFarmer.crop}, ${newFarmer.farm_area_acres} acres).`);
      
      if (window.showToast) {
        window.showToast(`Farmer ${newFarmer.name} registered successfully!`, "success");
      }
      close();
    });
  };

  // Bind tab clicks
  const setActiveTabBtn = (activeId) => {
    modalOverlay.querySelectorAll("#tab-demo-accounts, #tab-farmer-login, #tab-officer-login, #tab-register").forEach(btn => {
      if (btn.id === activeId) {
        btn.className = "btn btn-teal btn-sm";
      } else {
        btn.className = "btn btn-secondary btn-sm";
      }
    });
  };

  modalOverlay.querySelector("#tab-demo-accounts")?.addEventListener("click", () => {
    setActiveTabBtn("tab-demo-accounts");
    showDemoAccounts();
  });
  modalOverlay.querySelector("#tab-farmer-login")?.addEventListener("click", () => {
    setActiveTabBtn("tab-farmer-login");
    showFarmerLogin();
  });
  modalOverlay.querySelector("#tab-officer-login")?.addEventListener("click", () => {
    setActiveTabBtn("tab-officer-login");
    showOfficerLogin();
  });
  modalOverlay.querySelector("#tab-register")?.addEventListener("click", () => {
    setActiveTabBtn("tab-register");
    showRegistration();
  });

  // Default to Demo Accounts tab
  showDemoAccounts();
}
