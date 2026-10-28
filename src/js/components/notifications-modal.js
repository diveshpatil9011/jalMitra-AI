/**
 * JalMitra AI - Notifications & Communication Center (Module 14)
 * Real-time notification drawer with multi-channel SMS / Push simulation.
 */

import { store } from "../store.js";

export function renderNotificationsDrawer(container, onClose) {
  const state = store.getState();
  const notifs = state.notifications || [];

  const drawerOverlay = document.createElement("div");
  drawerOverlay.className = "modal-overlay";
  drawerOverlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(15, 23, 42, 0.5); display: flex; justify-content: flex-end;
    z-index: 1000; backdrop-filter: blur(2px);
  `;

  drawerOverlay.innerHTML = `
    <div style="background: white; width: 100%; max-width: 460px; height: 100%; display: flex; flex-direction: column; box-shadow: -4px 0 20px rgba(0,0,0,0.15); animation: slideLeft 0.25s ease;">
      <!-- Drawer Header -->
      <div style="padding: 1.25rem; border-bottom: 1px solid var(--surface-border); display: flex; justify-content: space-between; align-items: center; background: #f8fafc;">
        <div>
          <h3 style="color: var(--primary); font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
            🔔 Notification & Alert Dispatch
          </h3>
          <div style="font-size: 0.78rem; color: var(--text-muted);">
            In-App & Simulated Multi-Channel Farmer Communications
          </div>
        </div>
        <button id="btn-close-notifs" class="btn btn-secondary btn-sm" style="font-size: 1.2rem; padding: 0.2rem 0.6rem;">&times;</button>
      </div>

      <!-- SMS Delivery Simulation Disclaimer -->
      <div style="background: #fffbeb; border-bottom: 1px solid #fef3c7; padding: 0.75rem 1.25rem; font-size: 0.78rem; color: #92400e;">
        <strong>📡 Multi-Channel Gateway Simulation:</strong>
        External SMS and WhatsApp transmissions are simulated in this hackathon environment. Real mobile telco carrier integration uses standard DLT/NIC telecom APIs.
      </div>

      <!-- Action Bar -->
      <div style="padding: 0.75rem 1.25rem; border-bottom: 1px solid var(--surface-border); display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 0.82rem; font-weight: 600; color: var(--text-main);">
          ${notifs.length} Dispatch Messages
        </span>
        <button id="btn-mark-all-read" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
          ✓ Mark All Read
        </button>
      </div>

      <!-- Notification List -->
      <div style="flex: 1; overflow-y: auto; padding: 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.75rem;">
        ${notifs.map(n => `
          <div style="background: ${n.read ? '#ffffff' : '#f0fdfa'}; border: 1px solid ${n.read ? '#e2e8f0' : '#99f6e4'}; border-radius: var(--radius-md); padding: 0.85rem; box-shadow: var(--shadow-sm); position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25rem;">
              <strong style="font-size: 0.88rem; color: var(--primary);">
                ${getNotifIcon(n.type)} ${n.title}
              </strong>
              ${!n.read ? `<span class="badge badge-success" style="font-size: 0.65rem;">NEW</span>` : ''}
            </div>
            <p style="font-size: 0.82rem; color: #334155; line-height: 1.5; margin-bottom: 0.5rem;">
              ${n.message}
            </p>
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: var(--text-muted);">
              <span>Target: <strong>${n.target}</strong></span>
              <span>${n.timestamp ? n.timestamp.split("T")[0] + " " + n.timestamp.split("T")[1]?.substring(0, 5) : 'Just now'}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  document.body.appendChild(drawerOverlay);

  const close = () => {
    drawerOverlay.remove();
    if (onClose) onClose();
  };

  drawerOverlay.querySelector("#btn-close-notifs")?.addEventListener("click", close);
  drawerOverlay.addEventListener("click", (e) => {
    if (e.target === drawerOverlay) close();
  });

  drawerOverlay.querySelector("#btn-mark-all-read")?.addEventListener("click", () => {
    notifs.forEach(n => n.read = true);
    store.notify();
    close();
  });
}

function getNotifIcon(type) {
  switch (type) {
    case "approval": return "✅";
    case "decision": return "⚖️";
    case "complaint": return "⚠️";
    case "mediation": return "🤝";
    case "request": return "📋";
    case "shortage": return "🚨";
    default: return "🔔";
  }
}
