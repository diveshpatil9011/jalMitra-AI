/**
 * JalMitra AI - Cryptographic SHA-256 Audit Log Viewer (Module 15 & 18)
 * Demonstrates tamper-evident, mathematical blockchain-style decision verification.
 */

import { store } from "../store.js";

export function renderAuditViewer(container) {
  const state = store.getState();
  const chain = state.auditChain || [];

  container.innerHTML = `
    <div class="card" style="margin-bottom: 1.5rem;">
      <div class="card-header">
        <div>
          <div class="card-title"><span>🛡️</span> Cryptographic SHA-256 Audit Log Hash Chain</div>
          <div class="card-subtitle">Immutable decision ledger tracking every water allocation, grievance, and mediation accord</div>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button id="btn-verify-audit" class="btn btn-teal">
            🔍 Verify Hash Chain Integrity
          </button>
          <button id="btn-export-audit" class="btn btn-secondary">
            📥 Export Audit CSV
          </button>
        </div>
      </div>

      <!-- Verification Result Box -->
      <div id="verification-banner" style="display: none; padding: 1rem 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;"></div>

      <!-- Chain Stats Summary -->
      <div class="grid-4" style="margin-bottom: 1.5rem;">
        <div class="stat-box">
          <div class="stat-label">Total Audit Blocks</div>
          <div class="stat-value" style="color: #0d9488;">${chain.length}</div>
          <div class="stat-sub">Cryptographically linked</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Hashing Algorithm</div>
          <div class="stat-value" style="font-size: 1.2rem; color: #0284c7;">SHA-256</div>
          <div class="stat-sub">256-bit cryptographic digest</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Genesis Hash</div>
          <div class="stat-value" style="font-size: 0.85rem; font-family: monospace; color: #64748b;">
            000000000000...
          </div>
          <div class="stat-sub">System Initialization</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Latest Head Block</div>
          <div class="stat-value" style="font-size: 0.85rem; font-family: monospace; color: #0d9488;">
            ${chain[chain.length - 1]?.current_hash?.substring(0, 12)}...
          </div>
          <div class="stat-sub">${chain[chain.length - 1]?.action}</div>
        </div>
      </div>

      <!-- Audit Events Timeline -->
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${chain.map((evt, idx) => `
          <div style="background: white; border: 1px solid var(--surface-border); border-radius: var(--radius-md); padding: 1rem; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span class="badge" style="background: #0f172a; color: white; font-family: monospace;">
                  Block #${idx + 1} (${evt.event_id})
                </span>
                <span class="badge ${evt.role === 'Officer' ? 'badge-info' : (evt.role === 'Farmer' ? 'badge-success' : 'badge-neutral')}">
                  ${evt.role}: ${evt.actor}
                </span>
                <span style="font-weight: 700; color: var(--primary); font-size: 0.9rem;">
                  ${evt.action}
                </span>
              </div>
              <span style="font-size: 0.8rem; color: var(--text-muted);">
                🕒 ${evt.timestamp.replace("T", " ").replace("Z", " UTC")}
              </span>
            </div>

            <p style="font-size: 0.88rem; color: var(--text-main); margin-bottom: 0.75rem; line-height: 1.5;">
              ${evt.details}
            </p>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: var(--radius-sm); padding: 0.5rem 0.75rem; font-family: monospace; font-size: 0.75rem; color: #475569; display: flex; flex-direction: column; gap: 0.2rem;">
              <div><strong>Prev Hash:</strong> ${evt.previous_hash}</div>
              <div><strong>Block Hash:</strong> <span style="color: #0d9488; font-weight: 700;">${evt.current_hash}</span></div>
            </div>
          </div>
        `).reverse().join("")}
      </div>

      <!-- Tamper Demonstration Testing Controls -->
      <div style="margin-top: 1.5rem; background: var(--surface-alt); border: 1px dashed var(--surface-border); border-radius: var(--radius-md); padding: 1rem 1.25rem;">
        <div style="font-weight: 700; color: #78350f; font-size: 0.88rem; margin-bottom: 0.25rem;">
          🧪 Hackathon Integrity Proof Test
        </div>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 0.75rem;">
          Click "Simulate Record Tampering" to see how altering an existing block's payload invalidates all subsequent hashes, demonstrating strict tamper detection.
        </p>
        <div style="display: flex; gap: 0.5rem;">
          <button id="btn-tamper-test" class="btn btn-secondary btn-sm" style="color: #dc2626; border-color: #fca5a5;">
            ⚠️ Simulate Record Tampering
          </button>
          <button id="btn-restore-chain" class="btn btn-secondary btn-sm">
            🔄 Restore Pristine Chain
          </button>
        </div>
      </div>
    </div>
  `;

  // Bind Verify Integrity
  const verifyBtn = container.querySelector("#btn-verify-audit");
  const banner = container.querySelector("#verification-banner");

  verifyBtn?.addEventListener("click", async () => {
    verifyBtn.disabled = true;
    verifyBtn.textContent = "⏳ Computing Hashes...";
    const res = await store.verifyAuditChain();
    verifyBtn.disabled = false;
    verifyBtn.textContent = "🔍 Verify Hash Chain Integrity";

    banner.style.display = "block";
    if (res.valid) {
      banner.style.background = "#ecfdf5";
      banner.style.border = "1px solid #6ee7b7";
      banner.innerHTML = `
        <strong style="color: #065f46; font-size: 1rem;">✅ Cryptographic Integrity Verified Intact!</strong>
        <p style="color: #047857; font-size: 0.85rem; margin-top: 0.25rem;">
          All ${chain.length} audit blocks verified against SHA-256 hash digests. Every previous-hash link matches mathematically. No record alteration or unauthorized tampering detected.
        </p>
      `;
    } else {
      banner.style.background = "#fef2f2";
      banner.style.border = "1px solid #fecaca";
      banner.innerHTML = `
        <strong style="color: #991b1b; font-size: 1rem;">🚨 Tampering Detected in Audit Log!</strong>
        <p style="color: #b91c1c; font-size: 0.85rem; margin-top: 0.25rem;">
          ${res.message}. The hash link was broken, indicating a database row or allocation record was modified outside the authenticated hash protocol.
        </p>
      `;
    }
  });

  // Export CSV
  container.querySelector("#btn-export-audit")?.addEventListener("click", () => {
    window.location.href = "/api/export/csv?type=audit";
  });

  // Tamper Test
  container.querySelector("#btn-tamper-test")?.addEventListener("click", () => {
    if (state.auditChain && state.auditChain.length > 1) {
      state.auditChain[1].details = "MALICIOUS OVERWRITE: Unauthorized allocation of 50 T-m3 injected without officer approval.";
      store.notify();
      if (window.showToast) {
        window.showToast("Block #2 payload tampered for testing. Click 'Verify Hash Chain Integrity' to see mathematical detection!", "warning");
      }
      renderAuditViewer(container);
    }
  });

  // Restore Chain
  container.querySelector("#btn-restore-chain")?.addEventListener("click", () => {
    store.resetDemo();
    if (window.showToast) {
      window.showToast("Audit chain restored to pristine cryptographic state.", "success");
    }
    renderAuditViewer(container);
  });
}
