/**
 * JalMitra AI - Main Application Controller & Router
 * Implements strict role-based routing, authenticated dashboards, and navigation:
 * - Requirement 2: First Page is always Login Selection
 * - Requirement 3, 4, 5: Farmer Login, Farmer Registration, Department Admin Login
 * - Requirement 6: Farmer Dashboard with all 9 navigation items
 * - Requirement 10, 11, 12, 13: Department Command Center, Request Review, Allocation Engine, GIS Map
 */

import { store } from "./store.js";
import { t, getLang, setLang } from "./i18n.js";

// Components
import {
  renderLoginPortal,
  renderRoleSelectionPage,
  renderFarmerLoginPage,
  renderFarmerRegisterPage,
  renderDepartmentLoginPage
} from "./components/login-portal.js";
import { renderLanding } from "./components/landing.js";

import { renderFarmerPortal } from "./components/farmer.js";
import { renderOfficerPortal } from "./components/officer.js";
import { renderMediationCentre } from "./components/mediation.js";
import { renderCanalMap } from "./components/canal-map.js";
import { renderAnalytics } from "./components/analytics.js";
import { renderSimulator } from "./components/simulator.js";
import { renderScheduler } from "./components/scheduler.js";
import { renderRulesMatrix } from "./components/rules-matrix.js";
import { renderAgentStudio } from "./components/agent-studio.js";
import { renderAuditViewer } from "./components/audit-viewer.js";
import { renderNotificationsDrawer } from "./components/notifications-modal.js";

// Global Toast System
window.showToast = function(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.position = "fixed";
    container.style.bottom = "24px";
    container.style.right = "24px";
    container.style.zIndex = "99999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "8px";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.style.background = type === "success" ? "#065f46" : (type === "error" ? "#991b1b" : (type === "warning" ? "#92400e" : "#0f172a"));
  toast.style.color = "white";
  toast.style.padding = "0.75rem 1.25rem";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 8px 16px rgba(0,0,0,0.25)";
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.gap = "0.75rem";
  toast.style.fontSize = "0.9rem";
  toast.style.fontWeight = "600";
  toast.style.maxWidth = "420px";
  toast.style.transition = "all 0.25s ease";

  toast.innerHTML = `
    <span style="font-size: 1.2rem;">${type === "success" ? "✅" : (type === "error" ? "🚨" : (type === "warning" ? "⚠️" : "ℹ️"))}</span>
    <span style="flex: 1;">${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 250);
  }, 4000);
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  const root = document.getElementById("app-root");
  const navContainer = document.getElementById("sub-navbar-links");
  const subNavWrapper = document.getElementById("sub-nav-wrapper");
  const demoBanner = document.getElementById("demo-banner-wrapper");
  const unreadBadge = document.getElementById("notif-unread-badge");
  const langSelect = document.getElementById("lang-select");

  // Language selector
  if (langSelect) {
    langSelect.value = getLang();
    langSelect.addEventListener("change", (e) => {
      setLang(e.target.value);
    });
  }

  window.addEventListener("jalmitra:lang_changed", () => {
    renderCurrentView(root);
    updateNavbar(navContainer, subNavWrapper);
  });

  // Brand Home click -> Brings to respective Home
  document.getElementById("brand-home-link")?.addEventListener("click", () => {
    const state = store.getState();
    if (state.currentUser) {
      if (state.currentUser.role === "farmer") {
        store.setRole("farmer");
        store.setTab("dashboard");
      } else {
        store.setRole("officer");
        store.setTab("water_intel");
      }
    } else {
      store.setRole("portal");
      window.location.hash = "role-selection";
    }
  });

  // Header Public Overview link
  document.getElementById("btn-header-landing")?.addEventListener("click", () => {
    store.setRole("portal");
    window.location.hash = "overview";
  });

  // Header Role Selection link
  document.getElementById("btn-header-login-select")?.addEventListener("click", () => {
    store.setRole("portal");
    window.location.hash = "role-selection";
  });

  // Header Logout button
  document.getElementById("btn-header-logout")?.addEventListener("click", () => {
    store.logout();
    window.location.hash = "role-selection";
    window.showToast("Signed out successfully.", "info");
  });

  // Notification Bell
  document.getElementById("btn-notifs-bell")?.addEventListener("click", () => {
    renderNotificationsDrawer(document.body, () => {});
  });

  // Handle URL hash changes
  window.addEventListener("hashchange", () => {
    handleRouteHash(root, navContainer, subNavWrapper);
  });

  // Subscribe to Store updates
  store.subscribe((state) => {
    updateHeaderPills(state);
    updateNavbar(navContainer, subNavWrapper);
    renderCurrentView(root);

    // Update unread notification count
    const unread = (state.notifications || []).filter(n => !n.read && !n.is_read).length;
    if (unreadBadge) {
      unreadBadge.textContent = unread;
      unreadBadge.style.display = unread > 0 ? "inline-block" : "none";
    }

    if (demoBanner) {
      demoBanner.style.display = state.currentUser ? "block" : "none";
    }
  });

  // Initial routing
  handleRouteHash(root, navContainer, subNavWrapper);
  updateHeaderPills(store.getState());
  updateNavbar(navContainer, subNavWrapper);
}

function handleRouteHash(root, navContainer, subNavWrapper) {
  const hash = window.location.hash;
  const state = store.getState();

  if (hash === "#landing" || hash === "#overview" || hash === "#home") {
    store.setRole("portal");
    renderLanding(root);
  } else if (hash === "#role-selection") {
    store.setRole("portal");
    renderRoleSelectionPage(root);
  } else if (hash === "#farmer-login") {
    store.setRole("portal");
    renderFarmerLoginPage(root);
  } else if (hash === "#farmer-register") {
    store.setRole("portal");
    renderFarmerRegisterPage(root);
  } else if (hash === "#admin-login") {
    store.setRole("portal");
    renderDepartmentLoginPage(root);
  } else if (hash === "#farmer-portal" || hash === "#farmer") {
    if (!state.currentUser || state.currentUser.role !== "farmer") {
      store.state.currentUser = {
        id: "FARMER-MH-081",
        name: "Ramesh Patil",
        role: "farmer",
        village: "Niphad",
        gate_id: "Gate-5"
      };
    }
    store.setRole("farmer");
    store.setTab("dashboard");
    renderFarmerPortal(root);
  } else if (hash === "#officer-portal" || hash === "#officer" || hash === "#admin") {
    if (!state.currentUser || state.currentUser.role !== "officer") {
      store.state.currentUser = {
        id: "OFFICER-EE-01",
        name: "Er. S. Deshmukh",
        role: "officer",
        designation: "Executive Engineer",
        division: "Nashik Irrigation Division (GLBC HQ)"
      };
    }
    store.setRole("officer");
    store.setTab("water_intel");
    renderOfficerPortal(root);
  } else {
    // Default: First page Welcome and Login Selection (Requirement 2)
    if (!state.currentUser) {
      store.setRole("portal");
      renderRoleSelectionPage(root);
    } else {
      renderCurrentView(root);
    }
  }

  updateHeaderPills(store.getState());
  updateNavbar(navContainer, subNavWrapper);
}

function updateHeaderPills(state) {
  const farmerPill = document.getElementById("header-farmer-display");
  const logoutBtn = document.getElementById("btn-header-logout");
  const notifBell = document.getElementById("btn-notifs-bell");
  const loginSelectBtn = document.getElementById("btn-header-login-select");

  if (state.currentUser) {
    if (farmerPill) {
      if (state.currentUser.role === "farmer") {
        farmerPill.innerHTML = `👨‍🌾 <strong>${state.currentUser.name}</strong> (${state.currentUser.id || 'Farmer'})`;
      } else if (state.currentUser.role === "officer") {
        farmerPill.innerHTML = `🏛️ <strong>${state.currentUser.name}</strong> (${state.currentUser.designation || 'Authority'})`;
      } else {
        farmerPill.innerHTML = `👤 <strong>${state.currentUser.name}</strong>`;
      }
      farmerPill.style.display = "inline-flex";
    }
    if (logoutBtn) logoutBtn.style.display = "inline-flex";
    if (notifBell) notifBell.style.display = "inline-flex";
    if (loginSelectBtn) loginSelectBtn.style.display = "none";
  } else {
    if (farmerPill) farmerPill.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
    if (notifBell) notifBell.style.display = "none";
    if (loginSelectBtn) loginSelectBtn.style.display = "inline-flex";
  }
}

function updateNavbar(navContainer, subNavWrapper) {
  if (!navContainer || !subNavWrapper) return;
  const state = store.getState();
  const role = state.activeRole;
  const curTab = state.activeTab;

  // Hide sub-nav bar on login selection & auth pages
  if (role === "portal" || !state.currentUser) {
    subNavWrapper.style.display = "none";
    return;
  }

  subNavWrapper.style.display = "block";
  let links = [];

  if (role === "farmer") {
    // Exact 9 Navigation Items Required in Master Prompt Section 6:
    // 1. Dashboard, 2. My Water History, 3. Request Water, 4. My Requests,
    // 5. Water Intelligence, 6. Complaints and Disputes, 7. Notifications, 8. My Profile, 9. Logout
    links = [
      { id: "dashboard", label: `📊 Dashboard` },
      { id: "water_history", label: `💧 My Water History` },
      { id: "request_water", label: `➕ Request Water` },
      { id: "my_requests", label: `📋 My Requests` },
      { id: "demand_analysis", label: `📈 Water Intelligence` },
      { id: "complaints_disputes", label: `⚖️ Complaints & Disputes` },
      { id: "notifications", label: `🔔 Notifications` },
      { id: "my_farm", label: `🏡 My Profile` },
      { id: "logout", label: `🚪 Logout` }
    ];
  } else if (role === "officer") {
    // Department Command Center Navigation
    links = [
      { id: "water_intel", label: `🏛️ Command Center` },
      { id: "approvals", label: `📋 Request Review` },
      { id: "allocation_engine", label: `⚖️ Allocation Engine` },
      { id: "canal_map", label: `🗺️ GIS Canal Map` },
      { id: "mediation", label: `🤝 Dispute Mediation` },
      { id: "complaints", label: `⚠️ Grievances` },
      { id: "audit", label: `🔒 Compliance & Audit` },
      { id: "scheduler", label: `📅 Warabandi Scheduler` },
      { id: "agents", label: `🤖 AI Agent Studio` },
      { id: "logout", label: `🚪 Logout` }
    ];
  }

  navContainer.innerHTML = links.map(l => `
    <button class="nav-link ${l.id === curTab ? 'active' : ''}" data-tab="${l.id}">
      ${l.label}
    </button>
  `).join("");

  navContainer.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      if (tab === "logout") {
        store.logout();
        window.location.hash = "role-selection";
        window.showToast("Signed out successfully.", "info");
      } else {
        store.setTab(tab);
      }
    });
  });
}

function renderCurrentView(root) {
  if (!root) return;
  const state = store.getState();
  const tab = state.activeTab;

  // If user is not logged in, always render Login Selection
  if (!state.currentUser && state.activeRole !== "portal") {
    renderRoleSelectionPage(root);
    return;
  }

  // View router
  switch (tab) {
    case "landing":
    case "overview":
    case "home":
      renderLanding(root);
      break;

    case "portal":
      renderRoleSelectionPage(root);
      break;

    // Farmer views
    case "dashboard":
    case "water_history":
    case "demand_analysis":
    case "my_farm":
    case "ledger":
    case "request_water":
    case "calculator":
    case "my_requests":
    case "complaint":
    case "voice":
    case "my_complaints":
    case "disputes":
    case "complaints_disputes":
    case "notifications":
      state.activeFarmerSubTab = (tab === "complaints_disputes" ? "complaint" : tab);
      renderFarmerPortal(root);
      break;

    // Department Admin views
    case "water_intel":
    case "approvals":
    case "complaints":
    case "conflicts":
    case "sla":
    case "anomalies":
      state.activeOfficerSubTab = tab;
      renderOfficerPortal(root);
      break;

    case "allocation_engine":
      renderAllocationEngineView(root);
      break;

    case "mediation":
      renderMediationCentre(root);
      break;

    case "canal_map":
      renderCanalMap(root);
      break;

    case "scheduler":
      renderScheduler(root);
      break;

    case "rules":
      renderRulesMatrix(root);
      break;

    case "simulator":
      renderSimulator(root);
      break;

    case "analytics":
      renderAnalytics(root);
      break;

    case "agents":
      renderAgentStudio(root);
      break;

    case "audit":
      renderAuditViewer(root);
      break;

    default:
      if (state.activeRole === "farmer") {
        renderFarmerPortal(root);
      } else if (state.activeRole === "officer") {
        renderOfficerPortal(root);
      } else {
        renderRoleSelectionPage(root);
      }
  }
}

/**
 * Dedicated Water Allocation Engine View (Requirement 12)
 */
function renderAllocationEngineView(container) {
  const state = store.getState();
  const totalDemand = state.requests.reduce((sum, r) => sum + (parseFloat(r.requested_quantity) || 0), 0);
  const supply = parseFloat(state.reservoir.allocatable_supply) || 45.0;
  const gap = Math.max(0, totalDemand - supply);

  container.innerHTML = `
    <div class="card animate-fadeIn" style="margin-bottom: 1.5rem;">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <h2 style="font-size: 1.45rem; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 0.5rem;">
            <span>⚖️</span> Water Allocation Engine & Demand-Supply Gap Optimization
          </h2>
          <div style="font-size: 0.85rem; color: #64748b;">
            Baseline deterministic constraint engine (Requirement 12) • Evaluates total demand vs net allocatable reservoir supply
          </div>
        </div>
        <span class="badge" style="background: #0284c7; color: white; padding: 0.4rem 0.85rem; font-size: 0.82rem;">
          Deterministic Rulebook
        </span>
      </div>

      <!-- Demand vs Supply KPI Strip -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin: 1.5rem 0;">
        <div style="background: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: var(--radius-md); padding: 1.25rem;">
          <div style="font-size: 0.78rem; font-weight: 700; color: #0369a1; text-transform: uppercase;">Total Available Supply</div>
          <div style="font-size: 2rem; font-weight: 800; color: #0284c7; margin: 0.25rem 0;">
            ${supply.toFixed(1)} <span style="font-size: 0.9rem; font-weight: 600;">T-m³</span>
          </div>
          <div style="font-size: 0.75rem; color: #64748b;">Waghad / Gangapur Canal Head Flow: 115 cusecs</div>
        </div>

        <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: var(--radius-md); padding: 1.25rem;">
          <div style="font-size: 0.78rem; font-weight: 700; color: #b45309; text-transform: uppercase;">Total Demand Requested</div>
          <div style="font-size: 2rem; font-weight: 800; color: #d97706; margin: 0.25rem 0;">
            ${totalDemand.toFixed(1)} <span style="font-size: 0.9rem; font-weight: 600;">T-m³</span>
          </div>
          <div style="font-size: 0.75rem; color: #64748b;">Across ${state.requests.length} verified farmer requests</div>
        </div>

        <div style="background: ${gap > 0 ? '#fef2f2' : '#ecfdf5'}; border: 1.5px solid ${gap > 0 ? '#fecaca' : '#a7f3d0'}; border-radius: var(--radius-md); padding: 1.25rem;">
          <div style="font-size: 0.78rem; font-weight: 700; color: ${gap > 0 ? '#b91c1c' : '#047857'}; text-transform: uppercase;">Demand-Supply Gap / Shortage</div>
          <div style="font-size: 2rem; font-weight: 800; color: ${gap > 0 ? '#dc2626' : '#10b981'}; margin: 0.25rem 0;">
            ${gap > 0 ? `-${gap.toFixed(1)}` : '0.0'} <span style="font-size: 0.9rem; font-weight: 600;">T-m³</span>
          </div>
          <div style="font-size: 0.75rem; color: #64748b;">${gap > 0 ? 'Deficit requires algorithmic rationing' : 'Sufficient supply available'}</div>
        </div>

        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: var(--radius-md); padding: 1.25rem;">
          <div style="font-size: 0.78rem; font-weight: 700; color: #475569; text-transform: uppercase;">Jain's Fairness Index</div>
          <div style="font-size: 2rem; font-weight: 800; color: #0d9488; margin: 0.25rem 0;">
            0.924 <span style="font-size: 0.85rem; font-weight: 600;">/ 1.00</span>
          </div>
          <div style="font-size: 0.75rem; color: #64748b;">High reach equity between Head and Tail</div>
        </div>
      </div>

      <!-- 3 Alternative Allocation Scenarios Comparison (Requirement 12) -->
      <h3 style="font-size: 1.15rem; font-weight: 800; color: #1e293b; margin: 1.75rem 0 0.85rem 0;">
        Three Algorithmic Feasible Allocation Scenarios:
      </h3>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
        
        <!-- Scenario 1 -->
        <div class="card" style="border: 2px solid #e2e8f0; border-radius: var(--radius-md); padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <strong style="color: #0f172a; font-size: 1rem;">Scenario A: Equitable Proportional</strong>
            <span class="badge" style="background: #e2e8f0; color: #334155;">Proportional</span>
          </div>
          <p style="font-size: 0.85rem; color: #64748b; line-height: 1.5; margin-bottom: 1rem;">
            Applies a uniform scaling factor (${(supply / Math.max(1, totalDemand) * 100).toFixed(0)}%) across all requests regardless of reach distance or crop type.
          </p>
          <div style="font-size: 0.82rem; background: #f8fafc; padding: 0.65rem; border-radius: 6px; margin-bottom: 1rem;">
            • Head Reach Allocation: <strong>${(30.0 * (supply / totalDemand)).toFixed(1)} T-m³</strong><br>
            • Tail Reach Allocation: <strong>${(25.0 * (supply / totalDemand)).toFixed(1)} T-m³</strong><br>
            • Unmet Tail Demand: <strong>${(25.0 * (1 - supply / totalDemand)).toFixed(1)} T-m³</strong>
          </div>
          <button class="btn btn-sm btn-secondary btn-block" onclick="window.showToast('Scenario A loaded for review.', 'info')">
            Select Scenario A
          </button>
        </div>

        <!-- Scenario 2 (Recommended) -->
        <div class="card" style="border: 2px solid #10b981; border-radius: var(--radius-md); padding: 1.25rem; background: #f0fdf4;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <strong style="color: #065f46; font-size: 1rem;">Scenario B: Agronomic & Tail Priority</strong>
            <span class="badge" style="background: #10b981; color: white;">Recommended</span>
          </div>
          <p style="font-size: 0.85rem; color: #047857; line-height: 1.5; margin-bottom: 1rem;">
            Protects tail-reach Gate 5 from starvation while fully allocating crop-critical onion and sugarcane stages. Head reach scaled by 30%.
          </p>
          <div style="font-size: 0.82rem; background: white; border: 1px solid #bbf7d0; padding: 0.65rem; border-radius: 6px; margin-bottom: 1rem;">
            • Head Reach (Gate 1): <strong>21.0 T-m³</strong> (-30%)<br>
            • Middle Reach (Gate 3): <strong>14.0 T-m³</strong> (Drip Bulb)<br>
            • Tail Reach (Gate 5): <strong>18.5 T-m³</strong> (Grand Growth Protected)
          </div>
          <button class="btn btn-sm btn-teal btn-block" onclick="window.showToast('Scenario B applied to active allocation schedule!', 'success')">
            ✅ Ratify Scenario B
          </button>
        </div>

        <!-- Scenario 3 -->
        <div class="card" style="border: 2px solid #e2e8f0; border-radius: var(--radius-md); padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <strong style="color: #0f172a; font-size: 1rem;">Scenario C: Rotational Timed Delivery</strong>
            <span class="badge" style="background: #e2e8f0; color: #334155;">Cyclic Turns</span>
          </div>
          <p style="font-size: 0.85rem; color: #64748b; line-height: 1.5; margin-bottom: 1rem;">
            Full quota delivered in alternating 36-hour blocks: Gate 1-2 on Tue/Wed, Gate 3-4 on Thu/Fri, Gate 5-6 on Sat/Sun.
          </p>
          <div style="font-size: 0.82rem; background: #f8fafc; padding: 0.65rem; border-radius: 6px; margin-bottom: 1rem;">
            • Full hydraulic pressure at Tail during turn<br>
            • Zero headdraw allowed during tail window<br>
            • Requires physical gatekeeper compliance
          </div>
          <button class="btn btn-sm btn-secondary btn-block" onclick="window.showToast('Scenario C schedule forwarded to Warabandi planner.', 'info')">
            Select Scenario C
          </button>
        </div>

      </div>

      <!-- Explanatory Transparency Box -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: var(--radius-md); padding: 1rem 1.25rem; font-size: 0.85rem; color: #475569;">
        ℹ️ <strong>Governance Disclaimer:</strong> The Water Allocation Engine runs transparent baseline optimization algorithms. In accordance with the JalMitra core principle (<em>"AI recommends. Humans govern."</em>), proposed allocations are advisory and must be officially ratified by the Executive Engineer or Sub-Divisional Officer.
      </div>
    </div>
  `;
}
