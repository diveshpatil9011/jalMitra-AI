# JalMitra AI (जलमित्र AI)
### AI-Powered Agricultural Water-Sharing Dispute Mediation & Digital Irrigation Governance Platform

> **Foundational Governance Principle:** *"AI recommends. Humans govern."*  
> **Platform Tagline:** *"Smart Water. Fair Distribution. Stronger Farmers."*

JalMitra is an agricultural technology and digital irrigation governance platform designed for canal command areas. It directly addresses the irrigation crisis where upstream head-reach farmers overdraw water while tail-end farmers face severe crop wilting, missed irrigation schedules, opaque gate operations, and unmediated local disputes.

---

## 🌾 Comprehensive Platform Modules & Features

The platform is designed around 23 integrated modules implemented across a modern Single-Page Application (SPA) frontend and a zero-dependency pure Python 3 REST API backend:

### 1. Professional Welcome & Login Portal (First Page Entry)
* **Initial Landing Experience:** When visitors open the platform, they are greeted by a scenic Indian agricultural and canal theme with the tagline *"Smart Water. Fair Distribution. Stronger Farmers."* rather than opening the dashboard directly.
* **Dual Login Architecture:**
  1. **🌾 Farmer Portal:** Dedicated authentication and registration tab.
  2. **🏛️ Irrigation Authority Portal:** Administrative access for Executive Engineers and SDOs.
* **Instant Demo Evaluation Personas:** One-click pre-filled credentials for hackathon evaluation:
  * 👨‍🌾 **Ramesh Patil** (`9822004210` / `kisan123`): Tail Reach Farmer - Niphad, Gate 5, Sugarcane (4.0 Acres).
  * 👨‍🌾 **Suresh Shinde** (`9422001108` / `kisan123`): Head Reach Farmer - Sukene, Gate 1, Cotton (5.0 Acres).
  * 👩‍🌾 **Sunita Gaikwad** (`9922008765` / `kisan123`): Middle Reach Farmer - Pimpalgaon, Gate 3, Onion (2.5 Acres).
  * 🏛️ **Er. S. Deshmukh** (`deshmukh.ee@jalmitra.gov.in` / `admin123`): Executive Engineer, GLBC Division Nashik.
  * 🏛️ **Er. P. Kulkarni** (`kulkarni.sdo@jalmitra.gov.in` / `admin123`): Sub-Divisional Officer, Pimpalgaon.
* **Farmer Registration System:** Comprehensive intake collecting Farmer Name, 10-digit Mobile Number, Village, District, Agricultural Land Area (Acres), Plot/Gat/Survey Number, Primary Crop, Growing Season, Irrigation Canal/Distributary Gate, and Password Confirmation.
* **Password Recovery:** Simulated SMS OTP recovery modal for farmers and official email recovery for department staff.
* **Direct Explorer Links:** Instant bypass buttons to view the Public Overview or 10-Step Interactive Tour without logging in.

### 2. Farmer Experience Portal & Water History
* **Profile & Identity Card:** Displays Gat number, village, assigned distributary gate, distance from headworks ($km$), and turn schedules with strict session isolation (farmers only access their own private records).
* **Historical Delivery Records Table:** Multi-year records (2024–2026) documenting delivery dates, duration in hours, requested volume, allocated volume, actual water received in both **Litres** and **Cubic Metres ($m^3$)**, delivery status, and shortage flags.
* **Comparative SVG Visualization:** Real-time bar chart comparing Requested vs Allocated vs Actual Received water across delivery cycles.
* **Dynamic Historical Filters:** Filter records instantly by Year (2024, 2025, 2026, All), Season (Kharif, Rabi, Zaid), Crop, and Status.
* **Cumulative Summary KPIs:** Displays lifetime water delivered ($m^3$ and Litres), seasonal allocations, and historical shortage events.

### 3. Current Water Requirement Form
* **Intake Form:** Prominent "➕ Request Water" workflow pre-populated with authenticated farmer profile details.
* **Live Unit Converter:** Real-time bi-directional conversion between **Cubic Metres ($m^3$)** and **Litres ($L$)** ($1\text{ m}^3 = 1,000\text{ Litres}$).
* **Agronomic & Operational Parameters:**
  * Current crop & growing stage (e.g. Sugarcane in Grand Growth, Cotton in Flowering/Boll).
  * Land area requiring irrigation (Acres).
  * Preferred irrigation date and required duration in hours.
  * Last irrigation date and current soil moisture percentage.
  * Urgency categorization: Normal Irrigation, Water Shortage, Crop-Critical Wilting, or Emergency.
  * Evidence & supporting documents upload preview.
* **Transparent Non-Auto-Approved Intake:** Submissions generate unique tracking IDs (e.g. `REQ-2026-081`) and are saved into the database in `Submitted` / `Under Review` status awaiting official administrative review.

### 4. Water History and Current Demand Analysis
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

### 8. Ten Specialized AI Decision Agents (Pipeline Studio)
Modular coordinated agents operating with deterministic transparency:
1. **Farmer Intake Agent** — Structures natural-language requests and voice transcripts.
2. **Crop Demand Agent** — Computes agronomic $ET_c$ and volumetric irrigation duty.
3. **Water Supply Agent** — Validates reservoir inflow and reserves.
4. **Allocation Agent** — Computes constraint-aware distribution and fairness scores.
5. **GIS Analysis Agent** — Analyzes canal chainage, elevation, and friction losses.
6. **Compliance Agent** — Executes the Universal 8-Rule Matrix.
7. **Dispute Analysis Agent** — Isolates root causes and competing drawdown windows.
8. **Mediation Agent** — Formulates feasible compromise settlements.
9. **Schedule Optimization Agent** — Assigns conflict-free Warabandi delivery slots.
10. **Reporting and Audit Agent** — Generates multilingual SMS alerts and SHA-256 blocks.

### 9. GIS Canal Mapping & Cadastre
* Interactive 40 km hydraulic line schematic and GIS cadastral layer of the Godavari Left Bank Canal (GLBC).
* Distributary gates (Gate 1 Sukene to Gate 6 Chandori) with live flow telemetry (cusecs), conveyance seepage alerts, and tail starvation warning heatmaps.
* Search tool by village name, gate identifier, or farmer record.

### 10. Cryptographic SHA-256 Audit Log Hash Chain
* Every water request, grievance, allocation adjustment, and mediation accord is hashed and chained into a tamper-evident audit ledger:
  $$\text{Hash}_n = \text{SHA-256}(\text{BlockID} \parallel \text{Timestamp} \parallel \text{Actor} \parallel \text{Role} \parallel \text{Action} \parallel \text{RecordID} \parallel \text{Details} \parallel \text{Hash}_{n-1})$$
* Live "Verify Hash Chain Integrity" button recalculates all digests in real time.
* Includes an interactive "Simulate Record Tampering" demonstration for judges.

### 11. Multilingual Accessibility & Voice Input
* Complete UI localization in **English**, **हिन्दी (Hindi)**, and **मराठी (Marathi)**.
* Voice Grievance input with live Web Speech API recognition and entity extraction for regional farmers.

---

## 🚀 Setup & Execution Guide

### Prerequisites
* Python 3.10+ (Standard Python runtime, zero external pip packages required).
* Any modern web browser (Chrome, Edge, Firefox, Safari).

### Starting the Server
1. Open a terminal in the project directory:
   ```bash
   cd jalmitra-ai
   ```
2. Start the integrated Python REST API & SPA server:
   ```bash
   python backend/server.py
   ```
   *(On Windows with Python 3.14: `python3.14 backend/server.py`)*
3. Access the web platform in your browser at:
   ```
   http://127.0.0.1:8000
   ```
   *Upon initial launch, the system automatically loads the **Professional Welcome & Login Portal**.*

---

## 🧪 Automated Test Suite (51 Unit & Workflow Tests)

JalMitra AI includes **51 automated unit, integration, database, and workflow tests** covering:
- Penman-Monteith crop water calculation formulas
- Water balance physical conservation laws
- Demand vs history analysis (including 800L $\to$ 1,000L delta calculations)
- 8-Rule statutory compliance matrix checks
- Dispute mediation compromise generation and Jain's fairness scores
- Warabandi rotation scheduling conflict detection
- SHA-256 cryptographic audit chain and tamper detection
- Authentication, registration, water history, and administrative request review API endpoints
- SQLite database schema initialization, user verification, and persistence
- Complete 13-step end-to-end governance lifecycle workflow

To execute all tests:
```bash
python -m unittest discover backend
# Or with python 3.14:
python3.14 -m unittest discover backend
```
*(Result: 51 tests passed in 0.201s, 100% pass rate).*

---

## ⚡ Hackathon 10-Step Walkthrough Guide

Visitors and judges can experience the full end-to-end governance cycle using the **⚡ Walkthrough Tour** button in the header:

1. **Problem Discovery:** Tail-end starvation identified at Gate 5 (Niphad, KM 31.0).
2. **Crop Demand Calculation:** Penman-Monteith equation computes 25.0 T-$m^3$ for Sugarcane in Grand Growth.
3. **Request Submission:** Farmer Ramesh Patil lodges request under Gat No. 142/2A.
4. **Canal Overdraw Conflict:** Conflict Detector identifies upstream drawdown at Gate 1 (Suresh Shinde).
5. **Dispute Mediation Room:** Case `DISP-2026-001` generates 3 compromise alternatives.
6. **8-Rule Compliance Check:** Statutory matrix validates emergency reserve and tail priority.
7. **Consensus Accord Ratified:** Executive Engineer signs Option 2 (Agronomic Priority, 18.5 T-$m^3$).
8. **Warabandi Scheduler Updated:** Gate 5 assigned dedicated Thursday 06:00 AM turn; Gate 1 scheduled for Tuesday.
9. **GIS Canal Telemetry:** Visual schematic verifies tail pressure recovery.
10. **Cryptographic Verification:** SHA-256 block hash recalculated and confirmed tamper-free.
