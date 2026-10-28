# JalMitra AI (जलमित्र AI)
### AI-Powered Agricultural Water-Sharing Dispute Mediation & Digital Irrigation Governance Platform

> **Foundational Governance Principle:** *"AI recommends. Humans govern."*  
> **Platform Tagline:** *"Smart Water. Fair Distribution. Stronger Farmers."*  
> **Hindi Subtitle:** *जलमित्र — किसानों के लिए स्मार्ट जल प्रबंधन*

JalMitra is a complete, production-grade agricultural technology and digital irrigation governance platform designed for canal command areas. It directly addresses the chronic irrigation crisis where upstream head-reach farmers overdraw water while tail-end farmers face severe crop wilting, missed irrigation schedules, opaque gate operations, and unmediated local disputes.

---

## 🌾 Platform Architecture & Core Modules

JalMitra AI is engineered with a modern Single-Page Application (SPA) frontend, an integrated multi-threaded Python REST API backend, and an ACID-compliant persistent SQLite database (`backend/jalmitra.db`).

### 1. Professional Welcome & Role Selection Portal (First Page Entry)
* **Initial Page Boundary:** Opening `http://localhost:8000` directly displays the JalMitra Role Selection page. Dashboards are strictly protected and never opened prior to authentication.
* **Dual Prominent Login Cards:**
  1. **🌾 Farmer Login Card:** Access water history, submit current crop irrigation requirements, and track request status.
  2. **🏛️ Department Admin Login Card:** Command center for Executive Engineers and SDOs to review requests, compare demand vs supply, resolve disputes, and record official deliveries.
* **Dedicated Separate Pages:**
  * `#role-selection`: Scenic agricultural hero, Hindi subtitle, platform principles, and role cards.
  * `#farmer-login`: Dedicated farmer login with mobile/ID, password toggle, remember me, and links to registration.
  * `#farmer-register`: Comprehensive intake for new farmers (Name, auto-generated unique ID, 10-digit mobile, Gat No., village, district, state, acreage, crop, canal gate).
  * `#admin-login`: Dedicated department login with strict server-side RBAC (rejects ordinary farmer logins).

### 2. Farmer Experience Portal & Water History
* **Profile & Identity Card:** Displays Gat number, village, assigned distributary gate, distance from headworks ($km$), and turn schedules with strict session isolation.
* **Historical Delivery Records Table:** Multi-year records (2024–2026) documenting delivery dates, duration in hours, requested volume, allocated volume, actual water received in both **Litres** and **Cubic Metres ($m^3$)**, delivery status, and shortage flags.
* **Empty State Handling:** Newly registered farmers display a clean, reassuring empty state: *"No historical irrigation records yet. Submit a water request to get started."*
* **Comparative Visualizations:** Real-time bar charts comparing Requested vs Allocated vs Actual Received water across delivery cycles.
* **Dynamic Historical Filters:** Filter records instantly by Year, Season (Kharif, Rabi, Zaid), Crop, and Status.

### 3. Current Water Requirement Form & Penman-Monteith Estimator
* **Intake Form:** Prominent "➕ Request Water" workflow pre-populated with authenticated farmer profile details.
* **Live Unit Converter:** Real-time bi-directional conversion between **Cubic Metres ($m^3$)** and **Litres ($L$)** ($1\text{ m}^3 = 1,000\text{ Litres}$).
* **Agronomic & Operational Parameters:**
  * Current crop & growing stage (e.g. Sugarcane in Grand Growth, Cotton in Flowering/Boll).
  * Land area requiring irrigation (Acres).
  * Preferred irrigation date and required duration in hours.
  * Last irrigation date and current soil moisture percentage.
  * Urgency categorization: Normal Irrigation, Water Shortage, Crop-Critical Wilting, or Emergency.
  * Optional supporting documents upload preview.
* **Transparent Non-Auto-Approved Intake:** Submissions generate unique tracking IDs (e.g. `REQ-2026-081`) and are saved into the database in `Submitted` / `Under Review` status awaiting official administrative review.

### 4. Water Intelligence and History Comparison
* **Dynamic Historical Comparison:** Evaluates current water requests against historical baseline data:
  * Previous cycle water received.
  * Historical multi-cycle average usage.
  * Current requested quantity.
  * Difference in volume ($\Delta\text{ m}^3$ and $\Delta\text{ Litres}$).
  * Dynamic percentage change (e.g. Previous 800L vs Current 1,000L = $+200\text{L}$ / $+25\%$ increase).
* **Agronomic Theoretical Baseline:** Calculates theoretical FAO-56 Penman-Monteith gross crop water demand ($ET_c$) using crop coefficients ($K_c$), soil percolation efficiency, and effective rainfall.
* **Zone Supply Pool Balance:** Checks allocatable water supply for the farmer's distributary gate to evaluate capacity.
* **Explainable Non-Punitive Narrative:** Evaluates request reasonableness transparently without biased claims of "excessive use", factoring in crop stage, acreage, and drought conditions.

### 5. Irrigation Authority Command Center & Official Request Review
* **Water Governance Command Center:** Live reservoir storage (Gangapur / Waghad Complex), canal head discharge (115 cusecs), total demanded water, net allocatable supply, and reach distribution parity (Head vs Middle vs Tail).
* **6 Official Administrative Review Actions:**
  1. ✅ **Approve Request:** Authorizes full or requested quota under statutory rules.
  2. ⚖️ **Partially Approve Request:** Allocates adjusted quota based on canal capacity and rationing rules.
  3. ❓ **Request More Info:** Returns request to farmer with specific departmental queries.
  4. ❌ **Reject Request:** Rejects with mandatory documented administrative reason.
  5. 🤝 **Refer to Mediation:** Immediately routes contested requests to the Dispute Mediation room.
  6. 💧 **Mark Delivery Completed:** Records actual delivered water volume and duration, automatically updating the farmer's historical water ledger.

### 6. Multi-Party Dispute Mediation Room
* Dedicated 4-stage negotiation workflow for resolving head-vs-tail water conflicts:
  * **Stage 1:** Competing Demands & Scarcity Context.
  * **Stage 2:** Comparative evaluation of 3 Feasible Compromise Proposals with volume impact on each farmer.
  * **Stage 3:** Recording farmer objections and concessions.
  * **Stage 4:** Consensus Accord Formulation & Executive Engineer Digital Ratification.

### 7. Universal Eight-Rule Statutory Compliance Matrix
Exhaustive administrative and legal validation matrix with configurable parameter sliders:
1. *Farmer Request Information Check*
2. *Canal & Gate Association Check*
3. *Crop & Growth Stage Review*
4. *Quantity & Duration Bounds Check* (Ceiling: 6.0 T-$m^3$/acre)
5. *Entitlement Limits & Seasonal Quota* (Ceiling: 12.0 T-$m^3$/acre)
6. *Supply & Emergency Reserve Conservation* (15% mandatory drinking pool)
7. *Downstream Impact & Tail-Reach Priority*
8. *Mandatory Human Governance & Officer Sign-off*

### 8. Interactive GIS Canal Cadastre (Leaflet OSM + SVG Fallback)
* Interactive OpenStreetMap layer centered on the 40 km Godavari Left Bank Canal (GLBC) in Nashik.
* Canal line polyline, Waghad Dam headworks, and Gate 1 (Sukene) to Gate 6 (Chandori) distributaries.
* Farmer plot cadastral markers with interactive click popups showing farmer name, crop, Gat number, and turn schedule.
* Village search tool that auto-pans and zooms smoothly to the searched location.
* Seamless offline SVG schematic fallback toggle.

### 9. Cryptographic SHA-256 Audit Log Hash Chain
* Every water request, grievance, allocation adjustment, and mediation accord is hashed and chained into a tamper-evident audit ledger:
  $$\text{Hash}_n = \text{SHA-256}(\text{BlockID} \parallel \text{Timestamp} \parallel \text{Actor} \parallel \text{Role} \parallel \text{Action} \parallel \text{RecordID} \parallel \text{Details} \parallel \text{Hash}_{n-1})$$
* Live "Verify Hash Chain Integrity" button recalculates all digests in real time.
* Includes an interactive "Simulate Record Tampering" demonstration for judges.

### 10. Persistent SQLite Database Architecture (`jalmitra.db`)
* Safe schema auto-initialization preserving existing data on restart.
* Tables: `users`, `farmers`, `water_requests`, `historical_records`, `deliveries`, `grievances`, `disputes`, `notifications`, `audit_logs`, `system_config`.
* Write-Ahead Logging (`WAL`) mode and 30-second busy timeout for high concurrency.

---

## 🚀 Quick Start Guide

### Demonstration Credentials
* 👨‍🌾 **Farmer Persona (Tail Reach):**
  * Mobile: `9822004210` (or `FARMER-MH-081`) | Password: `kisan123`
  * Name: Ramesh Patil | Gat: 142/2A | Crop: Sugarcane | Gate: Gate-5 (Tail Reach)
* 👨‍🌾 **Farmer Persona (Head Reach):**
  * Mobile: `9422001108` (or `FARMER-MH-014`) | Password: `kisan123`
  * Name: Suresh Shinde | Gat: 58/1 | Crop: Cotton | Gate: Gate-1 (Head Reach)
* 🏛️ **Department Admin (Executive Engineer):**
  * Username / Email: `deshmukh.ee@jalmitra.gov.in` | Password: `admin123`
  * Role: Irrigation Department Executive Engineer (GLBC Division Nashik)

### Launching the Application
1. Open PowerShell / Command Prompt and navigate to the project directory:
   ```powershell
   cd C:\Users\JSPMUNI-SL-I-06\.gemini\antigravity\scratch\jalmitra-ai
   ```
2. Run the server using Anaconda Python (or your installed Python 3.10+):
   ```powershell
   & "C:\Users\JSPMUNI-SL-I-06\anaconda3\python.exe" -u backend/server.py
   ```
   *Alternative standard command:*
   ```bash
   python backend/server.py
   ```
3. Open your browser at:
   ```
   http://127.0.0.1:8000
   ```
   *The first page will be the JalMitra Role Selection page.*

---

## 🧪 Automated Test Suite (51 Tests Passing 100%)

The automated test suite contains **51 tests** verifying:
1. `backend/test_api.py` (20 API tests): Auth, Login, Registration, Demand Analysis, Water History, Review Actions, Reset.
2. `backend/test_database.py` (4 DB tests): Connection, Farmer registration, Config, Verification.
3. `backend/test_engine.py` (26 Algorithmic tests): Water balance conservation, Penman-Monteith formulas, 8-rule compliance, Dispute mediation proposals, Jain's fairness index, Warabandi conflicts, Cryptographic hash chain.
4. `backend/test_workflows.py` (1 E2E Lifecycle test): Full 13-step governance cycle from unauthenticated root to delivery and persistence.

To run all 51 tests:
```powershell
& "C:\Users\JSPMUNI-SL-I-06\anaconda3\python.exe" -m unittest discover -s backend -v
```
**Test Result:** `Ran 51 tests in 0.732s — OK (100% Pass Rate)`.
