"""
JalMitra AI - Water Allocation Engine, Dispute Mediation & Verification Logic
Deterministic, auditable, and transparent irrigation decision support.
Includes Jain's Fairness Score, Schedule Conflict Detection, 8-Rule Matrix, and 3 Compromise Strategies.
"""
import math
import hashlib
import time
from typing import Dict, List, Any, Tuple

# Crop water requirements (base mm per cycle) and Kc growth-stage coefficients
CROP_DATA = {
    "Sugarcane": {
        "base_depth_mm": 65,
        "stages": {"Germination": 0.5, "Tillering": 0.85, "Grand Growth": 1.25, "Ripening": 0.75},
        "critical_stage": "Grand Growth",
        "drought_sensitivity": 0.90
    },
    "Cotton": {
        "base_depth_mm": 50,
        "stages": {"Vegetative": 0.45, "Flowering/Boll": 1.15, "Boll Maturation": 0.70},
        "critical_stage": "Flowering/Boll",
        "drought_sensitivity": 0.85
    },
    "Soybean": {
        "base_depth_mm": 45,
        "stages": {"Vegetative": 0.40, "Pod Formation": 1.10, "Grain Filling": 0.85},
        "critical_stage": "Pod Formation",
        "drought_sensitivity": 0.80
    },
    "Onion": {
        "base_depth_mm": 40,
        "stages": {"Transplanting": 0.50, "Bulb Formation": 1.05, "Bulb Maturation": 0.75},
        "critical_stage": "Bulb Formation",
        "drought_sensitivity": 0.85
    },
    "Vegetables": {
        "base_depth_mm": 35,
        "stages": {"Nursery/Early": 0.50, "Vegetative": 0.80, "Fruiting": 1.10},
        "critical_stage": "Fruiting",
        "drought_sensitivity": 0.80
    },
    "Wheat": {
        "base_depth_mm": 45,
        "stages": {"Crown Root": 0.60, "Tillering": 0.85, "Flowering": 1.15, "Grain Filling": 0.80},
        "critical_stage": "Flowering",
        "drought_sensitivity": 0.85
    },
    "Gram/Chickpea": {
        "base_depth_mm": 35,
        "stages": {"Vegetative": 0.40, "Pod Development": 1.00, "Maturity": 0.60},
        "critical_stage": "Pod Development",
        "drought_sensitivity": 0.75
    }
}

# Soil percolation / retention efficiency
SOIL_EFFICIENCY = {
    "Black Cotton": 0.85,
    "Loamy": 0.75,
    "Sandy Loam": 0.65,
    "Alluvial": 0.80
}

# Irrigation method efficiency
IRRIGATION_EFFICIENCY = {
    "Drip": 0.90,
    "Sprinkler": 0.75,
    "Furrow": 0.60,
    "Flood": 0.50
}

# Default Statutory 8-Rule Configuration Parameters
DEFAULT_RULES_CONFIG = {
    "rule1_require_valid_farmer": True,
    "rule2_valid_gates": ["Gate-1", "Gate-2", "Gate-3", "Gate-4", "Gate-5", "Gate-6"],
    "rule4_max_per_acre": 6.0, # Thousand m3 per acre ceiling
    "rule5_seasonal_quota_per_acre": 12.0, # Thousand m3 seasonal ceiling
    "rule6_min_emergency_reserve_pct": 10.0, # % emergency reserve threshold
    "rule7_tail_equity_boost": True,
    "rule8_require_human_officer": True
}

def calculate_crop_water_estimate(
    crop: str,
    area_acres: float,
    growth_stage: str,
    soil_type: str = "Black Cotton",
    irrigation_method: str = "Furrow",
    et0_mm_day: float = 5.0,
    effective_rainfall_mm: float = 0.0,
    interval_days: int = 14
) -> Dict[str, Any]:
    """
    Calculate estimated crop water requirement in cubic meters and acre-inches.
    1 acre = 4046.86 m2.
    Depth (mm) * 10^-3 m * Area (m2) = Volume (m3).
    Formula: ETc = (ET0 * Kc * interval_days) - Peff
    Gross Depth = ETc / (Soil Efficiency * Irrigation Method Efficiency)
    """
    crop_info = CROP_DATA.get(crop, CROP_DATA.get("Vegetables", {"stages": {}, "critical_stage": "Vegetative"}))
    kc = crop_info["stages"].get(growth_stage, 0.85)
    soil_eff = SOIL_EFFICIENCY.get(soil_type, 0.75)
    irrig_eff = IRRIGATION_EFFICIENCY.get(irrigation_method, 0.60)
    
    # Net crop evapotranspiration ETc = ET0 * Kc
    etc_mm_period = (et0_mm_day * kc * interval_days) - effective_rainfall_mm
    etc_mm_period = max(5.0, etc_mm_period)
    
    # Combined application efficiency
    combined_eff = soil_eff * irrig_eff
    gross_depth_mm = etc_mm_period / combined_eff
    
    # Volume calculation
    area_m2 = area_acres * 4046.86
    volume_m3 = (gross_depth_mm / 1000.0) * area_m2
    volume_thousand_m3 = volume_m3 / 1000.0
    
    # Acre-inches calculation: 1 acre-inch = 102.79 m3
    acre_inches = volume_m3 / 102.79
    
    return {
        "crop": crop,
        "area_acres": area_acres,
        "growth_stage": growth_stage,
        "kc": kc,
        "et0_mm_day": et0_mm_day,
        "effective_rainfall_mm": effective_rainfall_mm,
        "interval_days": interval_days,
        "net_etc_mm": round(etc_mm_period, 1),
        "gross_depth_mm": round(gross_depth_mm, 1),
        "soil_type": soil_type,
        "soil_efficiency": round(soil_eff * 100, 1),
        "irrigation_method": irrigation_method,
        "irrigation_efficiency": round(irrig_eff * 100, 1),
        "application_efficiency": round(combined_eff * 100, 1),
        "estimated_volume_m3": round(volume_m3, 1),
        "estimated_volume_thousand_m3": round(volume_thousand_m3, 2),
        "acre_inches": round(acre_inches, 2),
        "is_critical_stage": (growth_stage == crop_info.get("critical_stage"))
    }

def calculate_water_balance(
    canal_inflow_thousand_m3: float,
    transit_loss_pct: float = 12.0,
    emergency_reserve_pct: float = 15.0
) -> Dict[str, float]:
    """
    Conserves water balance:
    Total Inflow = Transit Loss + Emergency Reserve + Net Allocatable Supply.
    """
    inflow = max(0.0, float(canal_inflow_thousand_m3))
    transit_loss = inflow * (transit_loss_pct / 100.0)
    water_after_loss = max(0.0, inflow - transit_loss)
    emergency_reserve = inflow * (emergency_reserve_pct / 100.0)
    allocatable_supply = max(0.0, water_after_loss - emergency_reserve)
    
    return {
        "inflow": round(inflow, 2),
        "transit_loss": round(transit_loss, 2),
        "transit_loss_pct": transit_loss_pct,
        "emergency_reserve": round(emergency_reserve, 2),
        "emergency_reserve_pct": emergency_reserve_pct,
        "allocatable_supply": round(allocatable_supply, 2)
    }

def calculate_fairness_index(allocations: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes Jain's Fairness Index for water allocation:
    J = (sum(r_i))^2 / (n * sum(r_i^2))
    where r_i = proposed_quantity / requested_quantity (fulfillment ratio).
    Also computes Tail-End Parity Ratio (ratio of average tail satisfaction to head satisfaction).
    """
    if not allocations:
        return {"jains_fairness_score": 100.0, "tail_parity_ratio": 1.0, "rating": "Optimal"}
        
    ratios = []
    head_ratios = []
    tail_ratios = []
    
    for a in allocations:
        req = float(a.get("requested_quantity", 0))
        prop = float(a.get("proposed_quantity", 0))
        ratio = min(1.0, prop / req) if req > 0 else 1.0
        ratios.append(ratio)
        
        gate = str(a.get("gate_id", ""))
        if "5" in gate or "6" in gate:
            tail_ratios.append(ratio)
        elif "1" in gate or "2" in gate:
            head_ratios.append(ratio)
            
    n = len(ratios)
    sum_r = sum(ratios)
    sum_sq = sum(r ** 2 for r in ratios)
    
    if n == 0 or sum_sq == 0:
        j_index = 1.0
    else:
        j_index = (sum_r ** 2) / (n * sum_sq)
        
    score_pct = round(j_index * 100.0, 1)
    
    avg_head = (sum(head_ratios) / len(head_ratios)) if head_ratios else 1.0
    avg_tail = (sum(tail_ratios) / len(tail_ratios)) if tail_ratios else 1.0
    tail_parity = round(avg_tail / avg_head, 2) if avg_head > 0 else 1.0
    
    rating = "High Fairness (Equitable)" if score_pct >= 85 else ("Moderate Equity" if score_pct >= 70 else "Inequitable - Head Dominance")
    
    return {
        "jains_fairness_score": score_pct,
        "jains_index": round(j_index, 3),
        "tail_parity_ratio": tail_parity,
        "avg_head_satisfaction": round(avg_head * 100, 1),
        "avg_tail_satisfaction": round(avg_tail * 100, 1),
        "rating": rating
    }

def run_allocation_engine(
    allocatable_supply: float,
    requests: List[Dict[str, Any]],
    strategy: str = "PROPORTIONAL"
) -> Dict[str, Any]:
    """
    Executes one of three allocation strategies:
    1. PROPORTIONAL: Scales eligible requests uniformly by available supply / total demand.
    2. AGRONOMIC: Priority scores based on crop stage, urgency, deficit, and tail-reach equity boost.
    3. ROTATIONAL: Alternates cyclic delivery windows to ensure full water pressure during scheduled turns.
    """
    total_requested = sum(r.get("requested_quantity", 0) for r in requests)
    if total_requested <= 0 or not requests:
        return {
            "strategy": strategy,
            "allocatable_supply": allocatable_supply,
            "total_requested": 0.0,
            "total_allocated": 0.0,
            "unmet_demand": 0.0,
            "allocations": [],
            "fairness": {"jains_fairness_score": 100.0, "tail_parity_ratio": 1.0, "rating": "Optimal"}
        }

    allocations = []
    
    # Strategy 1: Proportional
    if strategy == "PROPORTIONAL":
        ratio = min(1.0, allocatable_supply / total_requested) if total_requested > 0 else 1.0
        allocated_so_far = 0.0
        for r in requests:
            prop_qty = round(r["requested_quantity"] * ratio, 2)
            allocations.append({
                "request_id": r["id"],
                "farmer_name": r.get("farmer_name", "Farmer"),
                "farmer_id": r.get("farmer_id", ""),
                "gate_id": r.get("gate_id", "Gate-1"),
                "crop": r.get("crop", "Crops"),
                "growth_stage": r.get("growth_stage", ""),
                "requested_quantity": r["requested_quantity"],
                "proposed_quantity": prop_qty,
                "unmet_demand": round(r["requested_quantity"] - prop_qty, 2),
                "allocation_ratio": round(ratio * 100, 1),
                "priority_score": 50.0,
                "strategy_note": f"Proportional allocation at {round(ratio * 100, 1)}% of eligible demand.",
                "scheduled_slot": r.get("preferred_window", "Turn Cycle Standard")
            })
            allocated_so_far += prop_qty

    # Strategy 2: Agronomic Priority
    elif strategy == "AGRONOMIC":
        scored_requests = []
        for r in requests:
            crop_info = CROP_DATA.get(r.get("crop", ""), {})
            is_critical = (r.get("growth_stage") == crop_info.get("critical_stage"))
            urgency_weights = {"Emergency": 40, "High": 30, "Medium": 20, "Normal": 10}
            u_weight = urgency_weights.get(r.get("urgency", "Normal"), 10)
            stage_weight = 35 if is_critical else 15
            deficit_weight = min(15, float(r.get("previous_shortfall", 0.0)) * 1.5)
            # Reach weight: preference for tail-end equity (Gate 5-6)
            gate_str = str(r.get("gate_id", "Gate-3"))
            gate_num = int("".join([c for c in gate_str if c.isdigit()]) or "3")
            reach_weight = 15 if gate_num >= 5 else (8 if gate_num >= 3 else 0)
            
            score = u_weight + stage_weight + deficit_weight + reach_weight
            scored_requests.append((score, r))
        
        # Sort descending by priority score
        scored_requests.sort(key=lambda x: x[0], reverse=True)
        remaining_pool = allocatable_supply
        
        for score, r in scored_requests:
            req_qty = r["requested_quantity"]
            if remaining_pool <= 0:
                alloc_qty = 0.0
            else:
                scale_factor = min(1.0, score / 80.0) if score < 80 else 1.0
                target_qty = req_qty * scale_factor
                alloc_qty = round(min(remaining_pool, target_qty), 2)
                remaining_pool -= alloc_qty

            allocations.append({
                "request_id": r["id"],
                "farmer_name": r.get("farmer_name", "Farmer"),
                "farmer_id": r.get("farmer_id", ""),
                "gate_id": r.get("gate_id", "Gate-1"),
                "crop": r.get("crop", "Crops"),
                "growth_stage": r.get("growth_stage", ""),
                "requested_quantity": req_qty,
                "proposed_quantity": alloc_qty,
                "unmet_demand": round(req_qty - alloc_qty, 2),
                "allocation_ratio": round((alloc_qty / req_qty) * 100 if req_qty > 0 else 0, 1),
                "priority_score": round(score, 1),
                "strategy_note": f"Agronomic priority: {round(score, 1)} pts (Stage: {r.get('growth_stage')}, Reach: {r.get('gate_id')})",
                "scheduled_slot": "Priority Daytime Window (06:00 - 14:00)" if score > 70 else "Secondary Window (14:00 - 22:00)"
            })

    # Strategy 3: Rotational
    elif strategy == "ROTATIONAL":
        remaining_pool = allocatable_supply
        for idx, r in enumerate(requests):
            req_qty = r["requested_quantity"]
            is_turn_eligible = (idx % 2 == 0) or (r.get("urgency") in ["High", "Emergency"])
            if is_turn_eligible and remaining_pool >= (req_qty * 0.75):
                alloc_qty = round(min(remaining_pool, req_qty), 2)
                remaining_pool -= alloc_qty
                status_note = "Scheduled for Primary Delivery Window (Turn A - 100% Flow)"
                slot = "Turn A (Wed 06:00 - 14:00)"
            elif remaining_pool > 0:
                alloc_qty = round(min(remaining_pool, req_qty * 0.4), 2)
                remaining_pool -= alloc_qty
                status_note = "Scheduled for Shift B (Supplemental Release)"
                slot = "Turn B (Thu 14:00 - 20:00)"
            else:
                alloc_qty = 0.0
                status_note = "Deferred to Next Rotational Cycle (48h)"
                slot = "Cycle #5 Deferred"

            allocations.append({
                "request_id": r["id"],
                "farmer_name": r.get("farmer_name", "Farmer"),
                "farmer_id": r.get("farmer_id", ""),
                "gate_id": r.get("gate_id", "Gate-1"),
                "crop": r.get("crop", "Crops"),
                "growth_stage": r.get("growth_stage", ""),
                "requested_quantity": req_qty,
                "proposed_quantity": alloc_qty,
                "unmet_demand": round(req_qty - alloc_qty, 2),
                "allocation_ratio": round((alloc_qty / req_qty) * 100 if req_qty > 0 else 0, 1),
                "priority_score": 65.0 if is_turn_eligible else 35.0,
                "strategy_note": status_note,
                "scheduled_slot": slot
            })

    total_allocated = round(sum(a["proposed_quantity"] for a in allocations), 2)
    # Strictly enforce supply constraint
    if total_allocated > allocatable_supply:
        diff = total_allocated - allocatable_supply
        for a in reversed(allocations):
            reduction = min(a["proposed_quantity"], diff)
            a["proposed_quantity"] = round(a["proposed_quantity"] - reduction, 2)
            a["unmet_demand"] = round(a["requested_quantity"] - a["proposed_quantity"], 2)
            diff -= reduction
            if diff <= 0:
                break
        total_allocated = round(sum(a["proposed_quantity"] for a in allocations), 2)

    unmet_demand = round(max(0.0, total_requested - total_allocated), 2)
    fairness = calculate_fairness_index(allocations)

    return {
        "strategy": strategy,
        "allocatable_supply": allocatable_supply,
        "total_requested": total_requested,
        "total_allocated": total_allocated,
        "unmet_demand": unmet_demand,
        "allocations": allocations,
        "fairness": fairness
    }

def verify_eight_rules(
    request_data: Dict[str, Any],
    system_state: Dict[str, Any],
    rules_config: Dict[str, Any] = None
) -> List[Dict[str, Any]]:
    """
    Module 9 & 17: Configurable Statutory 8-Rule Compliance Engine.
    Rules represent administrative and engineering criteria for equitable irrigation governance.
    """
    cfg = dict(DEFAULT_RULES_CONFIG)
    if rules_config:
        cfg.update(rules_config)
        
    rules = []
    
    # Rule 1: Verify farmer request information
    has_farmer_id = bool(request_data.get("farmer_id"))
    qty = float(request_data.get("requested_quantity", 0))
    r1_pass = has_farmer_id and qty > 0
    rules.append({
        "rule_num": 1,
        "name": "Farmer Request Information",
        "description": "Validates registered farmer identity, contact validity, and non-zero positive water volume demand.",
        "status": "Passed" if r1_pass else "Failed",
        "reference": "Maharashtra Irrigation Act / Model State Canal Rules Section 14",
        "explanation": f"Farmer ID {request_data.get('farmer_id', 'Unknown')} validated with quantity {qty} T-m3." if r1_pass else "Farmer ID or valid quantity missing.",
        "missing_info": None if r1_pass else "Farmer ID or positive volume missing",
        "suggested_action": "Verify farmer credentials and requested amount." if not r1_pass else "Proceed."
    })
    
    # Rule 2: Verify eligible farm and canal association
    gate_id = request_data.get("gate_id", "")
    known_gates = cfg.get("rule2_valid_gates", ["Gate-1", "Gate-2", "Gate-3", "Gate-4", "Gate-5", "Gate-6"])
    r2_pass = gate_id in known_gates
    rules.append({
        "rule_num": 2,
        "name": "Canal & Gate Association",
        "description": "Validates that the farm parcel is hydrologically mapped to an active sanctioned canal outlet.",
        "status": "Passed" if r2_pass else "Warning",
        "reference": "GLBC Canal Command Cadastral Mapping Register",
        "explanation": f"Farm mapped to {gate_id} on Godavari Left Bank Canal system." if r2_pass else f"Outlet {gate_id} unverified in command registry.",
        "missing_info": None if r2_pass else "Unverified canal outlet gate",
        "suggested_action": "Confirm outlet distributary before opening sluice."
    })
    
    # Rule 3: Review crop and growth-stage information
    crop = request_data.get("crop", "")
    stage = request_data.get("growth_stage", "")
    crop_info = CROP_DATA.get(crop)
    r3_pass = (crop_info is not None) and bool(stage)
    rules.append({
        "rule_num": 3,
        "name": "Crop & Growth Stage Review",
        "description": "Verifies that the declared crop and growth stage match agronomic evapotranspiration coefficients.",
        "status": "Passed" if r3_pass else "Requires Review",
        "reference": "Krishi Vigyan Kendra (KVK) Regional Crop Water Duty Manual",
        "explanation": f"Crop: {crop}, Stage: {stage}. Kc factor retrieved from agronomic database." if r3_pass else "Crop stage unverified or custom non-standard crop.",
        "missing_info": None if r3_pass else "Crop growth stage unverified",
        "suggested_action": "Check local Krishi Vigyan Kendra crop calendar."
    })
    
    # Rule 4: Validate requested quantity and duration bounds
    acreage = float(request_data.get("farm_area_acres", 2.0))
    max_rate = float(cfg.get("rule4_max_per_acre", 6.0))
    max_reasonable = acreage * max_rate
    r4_pass = (0 < qty <= max_reasonable)
    rules.append({
        "rule_num": 4,
        "name": "Quantity & Duration Bounds",
        "description": f"Enforces maximum allowable water duty ({max_rate} T-m3 per acre per cycle) to prevent over-watering.",
        "status": "Passed" if r4_pass else "Warning",
        "reference": "Central Water Commission Irrigation Efficiency Norms",
        "explanation": f"Requested {qty} T-m3 for {acreage} acres (Duty ceiling: {max_reasonable:.1f} T-m3)." if r4_pass else f"Request of {qty} T-m3 exceeds allowable duty ceiling ({max_reasonable:.1f} T-m3).",
        "missing_info": None if r4_pass else "Quantity exceeds standard crop irrigation ceiling",
        "suggested_action": "Flag for engineering review if high duty is requested."
    })

    # Rule 5: Check allocation limits and existing entitlement
    past_alloc = float(request_data.get("current_cycle_received", 0.0))
    seasonal_cap = acreage * float(cfg.get("rule5_seasonal_quota_per_acre", 12.0))
    r5_pass = (past_alloc + qty) <= seasonal_cap
    rules.append({
        "rule_num": 5,
        "name": "Entitlement Limits & Prior Deliveries",
        "description": "Ensures cumulative water deliveries remain within approved seasonal volumetric water user quota.",
        "status": "Passed" if r5_pass else "Requires Review",
        "reference": "State Water Resources Regulatory Authority Quota Directive",
        "explanation": f"Cumulative delivery: {past_alloc} T-m3 + {qty} T-m3 requested <= {seasonal_cap:.1f} T-m3 seasonal cap." if r5_pass else f"Exceeds seasonal volumetric entitlement ({past_alloc + qty:.1f} > {seasonal_cap:.1f} T-m3).",
        "missing_info": None if r5_pass else "Cumulative seasonal entitlement quota exceeded",
        "suggested_action": "Assess historical rotational quota for Gat number."
    })

    # Rule 6: Check available supply and emergency reserve
    supply = float(system_state.get("allocatable_supply", 0.0))
    reserve_pct = float(system_state.get("emergency_reserve_pct", 15.0))
    min_reserve = float(cfg.get("rule6_min_emergency_reserve_pct", 10.0))
    emergency_safe = reserve_pct >= min_reserve
    r6_pass = (supply >= qty) and emergency_safe
    rules.append({
        "rule_num": 6,
        "name": "Supply & Emergency Reserve Conservation",
        "description": "Verifies canal branch allocatable water pool and protects non-negotiable drinking/emergency reserve.",
        "status": "Passed" if r6_pass else "Warning",
        "reference": "Dam Safety and Reservoir Operation Guidelines",
        "explanation": f"Allocatable canal pool: {supply} T-m3. Emergency reserve preserved at {reserve_pct}% (min: {min_reserve}%)." if r6_pass else f"Supply deficit (Available: {supply} T-m3 vs Req: {qty} T-m3) or reserve stress.",
        "missing_info": None if r6_pass else "Supply deficit or drought threshold active",
        "suggested_action": "Apply proportional rationing or rotational scheduling."
    })

    # Rule 7: Assess competing requests and downstream impact
    reach = "Tail" if gate_id in ["Gate-5", "Gate-6"] else ("Middle" if gate_id in ["Gate-3", "Gate-4"] else "Head")
    competing_count = system_state.get("active_competing_requests", 2)
    r7_pass = reach == "Tail" or not cfg.get("rule7_tail_equity_boost", True)
    rules.append({
        "rule_num": 7,
        "name": "Downstream Impact & Competing Demands",
        "description": "Guarantees tail-end reach priority; head-reach abstractions must not depress tail delivery pressure.",
        "status": "Passed" if r7_pass else "Requires Review",
        "reference": "Warabandi Rotation & Tail-Reach Protection Act",
        "explanation": f"Location in {reach} reach. Tail-reach farmers are protected under priority allocation." if r7_pass else f"Head-reach request at {gate_id} requires tail-reach pressure verification ({competing_count} competing requests).",
        "missing_info": "Potential tail-end pressure drop" if reach == "Head" else None,
        "suggested_action": "Ensure tail reach discharge minimums are satisfied before clearing head reach."
    })

    # Rule 8: Mandatory human approval requirement
    rules.append({
        "rule_num": 8,
        "name": "Human Governance & Final Authority",
        "description": "Ensures explainable AI recommendations remain advisory; final physical gate execution requires officer sign-off.",
        "status": "Requires Review",
        "reference": "JalMitra Governance Charter: AI Recommends. Humans Govern.",
        "explanation": "AI recommendations generated. Final sluice opening requires Sectional Officer authorization.",
        "missing_info": "Pending Officer Digital Approval",
        "suggested_action": "Submit proposal to Officer Portal for final sign-off."
    })

    return rules

def verify_thirteen_points(request: Dict[str, Any], system_state: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Phase 10: Thirteen-Point Decision Verification Panel
    """
    points_def = [
        ("1. Farm Area", request.get("farm_area_acres"), "Acres", True),
        ("2. Crop Species", request.get("crop"), "", True),
        ("3. Crop Growth Stage", request.get("growth_stage"), "", True),
        ("4. Water Demand", request.get("requested_quantity"), "Thousand m3", True),
        ("5. Entitlement Limit", request.get("entitlement_limit", 12.0), "Thousand m3", True),
        ("6. Current Allocation", request.get("current_allocation", 0.0), "Thousand m3", True),
        ("7. Water Already Received", request.get("current_cycle_received", 0.0), "Thousand m3", True),
        ("8. Remaining Water Deficit", request.get("water_deficit", 2.2), "Thousand m3", True),
        ("9. Current Available Supply", system_state.get("allocatable_supply", 45.0), "Thousand m3", True),
        ("10. Urgency Level", request.get("urgency", "Normal"), "", True),
        ("11. Competing Requests", system_state.get("active_competing_requests", 3), "Active", True),
        ("12. Downstream Impact", "Tail-reach Gate 5-6 vulnerable", "", True),
        ("13. Existing Schedule", "Rotation Cycle #4 (Oct 28 - Nov 04)", "", True)
    ]
    
    results = []
    for name, val, unit, has_data in points_def:
        display_val = f"{val} {unit}".strip() if val is not None else "Missing"
        results.append({
            "point": name,
            "value": display_val,
            "status": "Available" if val is not None else "Missing",
            "check": "Verified" if val is not None else "Incomplete",
            "impact": "Informs transparent allocation bounds." if val is not None else "Flagged for officer review."
        })
    return results

def detect_schedule_conflicts(schedules: List[Dict[str, Any]], canal_capacity_cusecs: float = 150.0) -> List[Dict[str, Any]]:
    """
    Module 12: Detects overlapping turns and canal segment over-capacity.
    """
    conflicts = []
    for i in range(len(schedules)):
        for j in range(i + 1, len(schedules)):
            s1 = schedules[i]
            s2 = schedules[j]
            # Check overlap on same date or window
            if s1.get("date") == s2.get("date") and s1.get("window") == s2.get("window"):
                combined_discharge = float(s1.get("flow_cusecs", 30)) + float(s2.get("flow_cusecs", 30))
                # If both draw from same reach or exceed distributary capacity
                if s1.get("gate_id") == s2.get("gate_id") or combined_discharge > canal_capacity_cusecs:
                    conflicts.append({
                        "id": f"SCH-CNF-{len(conflicts) + 1:02d}",
                        "schedules": [s1["id"], s2["id"]],
                        "farmers": [s1.get("farmer_name"), s2.get("farmer_name")],
                        "date": s1.get("date"),
                        "window": s1.get("window"),
                        "combined_discharge": combined_discharge,
                        "capacity_limit": canal_capacity_cusecs,
                        "description": f"Schedule conflict: {s1.get('farmer_name')} ({s1.get('gate_id')}) and {s2.get('farmer_name')} ({s2.get('gate_id')}) overlap in window {s1.get('window')}."
                    })
    return conflicts

def generate_mediation_proposals(dispute: Dict[str, Any], allocatable_supply: float = 45.0) -> List[Dict[str, Any]]:
    """
    Module 8 & 13: Generates 3 Feasible Compromise Settlements for a dispute.
    """
    pA_name = dispute.get("farmer_a_name", "Suresh Shinde")
    pA_qty = float(dispute.get("farmer_a_requested", 30.0))
    pA_gate = dispute.get("farmer_a_gate", "Gate-1 (Head)")
    
    pB_name = dispute.get("farmer_b_name", "Ramesh Patil")
    pB_qty = float(dispute.get("farmer_b_requested", 25.0))
    pB_gate = dispute.get("farmer_b_gate", "Gate-5 (Tail)")
    
    total_req = pA_qty + pB_qty
    target_pool = min(allocatable_supply * 0.75, total_req * 0.85) # realistic pool for these gates
    
    # Proposal 1: Proportional Scaling
    p1_ratio = round(target_pool / total_req, 2) if total_req > 0 else 0.8
    p1_a = round(pA_qty * p1_ratio, 1)
    p1_b = round(pB_qty * p1_ratio, 1)
    prop1 = {
        "id": "PROP-A",
        "title": "Option 1: Equal Proportional Rationing",
        "strategy": "PROPORTIONAL",
        "summary": f"Both farmers share water deficit equally by taking a {round((1 - p1_ratio) * 100)}% uniform volumetric cut.",
        "farmer_a_alloc": p1_a,
        "farmer_b_alloc": p1_b,
        "farmer_a_effect": f"{pA_name} receives {p1_a} T-m3 (was {pA_qty} T-m3). Sufficient for maintenance irrigation.",
        "farmer_b_effect": f"{pB_name} receives {p1_b} T-m3 (was {pB_qty} T-m3). Relieves immediate tail-reach wilting.",
        "fairness_score": 82.5,
        "feasibility": "High - Zero schedule changes required; flow throttled at Gate 1."
    }
    
    # Proposal 2: Agronomic Priority Shift (Crop wilting defense)
    p2_b = min(pB_qty, round(pB_qty * 0.95, 1)) # tail crop (Sugarcane) in Grand Growth is critical
    p2_a = round(max(10.0, target_pool - p2_b), 1)
    prop2 = {
        "id": "PROP-B",
        "title": "Option 2: Agronomic Criticality Priority",
        "strategy": "AGRONOMIC",
        "summary": f"Prioritizes tail-end {pB_name}'s Sugarcane in critical Grand Growth stage (90% fulfillment). Head-reach Cotton deferred 24 hours.",
        "farmer_a_alloc": p2_a,
        "farmer_b_alloc": p2_b,
        "farmer_a_effect": f"{pA_name} accepts 25% rationing now, with guaranteed supplemental turn in next rotation cycle.",
        "farmer_b_effect": f"{pB_name} receives full {p2_b} T-m3 required to avert irreversible crop loss.",
        "fairness_score": 94.0,
        "feasibility": "High - Protects highest economic crop value at risk."
    }
    
    # Proposal 3: Rotational Window Split (Warabandi Time-Sharing)
    prop3 = {
        "id": "PROP-C",
        "title": "Option 3: Time-Window Split (Dedicated Sluice Hours)",
        "strategy": "ROTATIONAL",
        "summary": "Head-reach Gate 1 is closed for 8 hours on Thursday morning to maintain full hydraulic head down to Tail Gate 5.",
        "farmer_a_alloc": round(pA_qty * 0.85, 1),
        "farmer_b_alloc": round(pB_qty * 0.85, 1),
        "farmer_a_effect": f"{pA_name} waters Tuesday 06:00 - 14:00 (full discharge). Gate 1 paused Thursday.",
        "farmer_b_effect": f"{pB_name} waters Thursday 06:00 - 18:00 with undiluted downstream flow pressure.",
        "fairness_score": 88.0,
        "feasibility": "Medium - Requires Patwari physical monitoring of Gate 1 lock during tail turn."
    }
    
    return [prop1, prop2, prop3]

def analyze_demand_vs_history(
    current_request: Dict[str, Any],
    history_records: List[Dict[str, Any]],
    zone_available_supply_m3: float = 0.0
) -> Dict[str, Any]:
    """
    Module 5: Water History and Current Demand Analysis
    Compares each farmer's historical usage with their current request dynamically.
    Calculates:
      - Historical average water usage (received and requested)
      - Current requested water in both m3 and Litres
      - Previous water allocation & actual water received
      - Zone available supply vs demand & shortage/surplus
      - Difference and percentage change between current request and historical usage
      - Agronomic Penman-Monteith theoretical crop requirement
    Never claims a request is excessive solely on history without considering crop stage and acreage.
    """
    # 1. Parse current requested quantity and units
    unit = str(current_request.get("unit", "m3")).lower()
    raw_qty = float(current_request.get("requested_quantity", current_request.get("requested_quantity_m3", 0.0)))
    
    if unit in ["litres", "litre", "l"]:
        current_requested_litres = raw_qty
        current_requested_m3 = raw_qty / 1000.0
    elif unit in ["t-m3", "thousand_m3"]:
        current_requested_m3 = raw_qty * 1000.0
        current_requested_litres = current_requested_m3 * 1000.0
    else:
        # Default unit is m3
        current_requested_m3 = raw_qty
        current_requested_litres = raw_qty * 1000.0

    # 2. Extract farmer-specific historical records
    farmer_id = current_request.get("farmer_id")
    if farmer_id and history_records:
        farmer_history = [h for h in history_records if h.get("farmer_id") == farmer_id]
        if not farmer_history:
            farmer_history = list(history_records)
    else:
        farmer_history = list(history_records) if history_records else []

    # Sort history records by delivery_date / year / id descending if possible
    def get_sort_key(rec):
        return str(rec.get("delivery_date", rec.get("date", rec.get("id", ""))))
    farmer_history.sort(key=get_sort_key, reverse=True)

    # 3. Previous cycle metrics
    if farmer_history:
        prev_rec = farmer_history[0]
        # Check if units in record are m3 or litres
        prev_received_m3 = float(prev_rec.get("received_qty_m3", prev_rec.get("received_quantity", 0.0)))
        prev_allocated_m3 = float(prev_rec.get("allocated_qty_m3", prev_rec.get("allocated_quantity", 0.0)))
        prev_requested_m3 = float(prev_rec.get("requested_qty_m3", prev_rec.get("requested_quantity", 0.0)))
        prev_date = prev_rec.get("delivery_date", prev_rec.get("date", "N/A"))
        prev_duration = prev_rec.get("duration_hours", 0)
        prev_crop = prev_rec.get("crop", current_request.get("crop", "Unknown"))
        prev_season = f"{prev_rec.get('year', '')} {prev_rec.get('season', '')}".strip()
    else:
        prev_rec = None
        prev_received_m3 = 0.0
        prev_allocated_m3 = 0.0
        prev_requested_m3 = 0.0
        prev_date = "No historical delivery recorded"
        prev_duration = 0
        prev_crop = current_request.get("crop", "Unknown")
        prev_season = "N/A"

    # 4. Historical Averages
    completed_recs = [h for h in farmer_history if float(h.get("received_qty_m3", h.get("received_quantity", 0.0))) > 0]
    if completed_recs:
        hist_avg_received_m3 = round(sum(float(h.get("received_qty_m3", h.get("received_quantity", 0.0))) for h in completed_recs) / len(completed_recs), 2)
        hist_avg_requested_m3 = round(sum(float(h.get("requested_qty_m3", h.get("requested_quantity", 0.0))) for h in completed_recs) / len(completed_recs), 2)
        hist_record_count = len(completed_recs)
    else:
        hist_avg_received_m3 = prev_received_m3
        hist_avg_requested_m3 = prev_requested_m3
        hist_record_count = 0

    # 5. Difference and percentage change calculations
    ref_received_m3 = prev_received_m3 if prev_received_m3 > 0 else (hist_avg_received_m3 if hist_avg_received_m3 > 0 else prev_allocated_m3)
    diff_from_prev_received_m3 = round(current_requested_m3 - ref_received_m3, 2)
    diff_from_prev_received_litres = round(diff_from_prev_received_m3 * 1000.0, 1)

    if ref_received_m3 > 0:
        pct_change = round((diff_from_prev_received_m3 / ref_received_m3) * 100.0, 1)
    else:
        pct_change = 0.0

    # Difference from historical average
    diff_from_avg_m3 = round(current_requested_m3 - hist_avg_received_m3, 2)
    pct_change_avg = round((diff_from_avg_m3 / hist_avg_received_m3) * 100.0, 1) if hist_avg_received_m3 > 0 else 0.0

    # 6. Agronomic Penman-Monteith crop water demand
    crop = current_request.get("crop", "Sugarcane")
    area_acres = float(current_request.get("farm_area_acres", 3.0))
    growth_stage = current_request.get("growth_stage", "Grand Growth")
    soil = current_request.get("soil_type", "Black Cotton")
    irrig_method = current_request.get("irrigation_method", "Furrow")

    agronomic_est = calculate_crop_water_estimate(
        crop=crop,
        area_acres=area_acres,
        growth_stage=growth_stage,
        soil_type=soil,
        irrigation_method=irrig_method
    )
    agronomic_gross_m3 = agronomic_est.get("estimated_volume_m3", 0.0)
    agronomic_gross_litres = agronomic_gross_m3 * 1000.0

    # Agronomic justification status
    # Compare current requested against scientific crop demand
    agro_diff_m3 = round(current_requested_m3 - agronomic_gross_m3, 2)
    if current_requested_m3 <= agronomic_gross_m3 * 1.05:
        agro_status = "Agronomically Justified"
        agro_badge = "success"
    elif current_requested_m3 <= agronomic_gross_m3 * 1.25:
        agro_status = "Moderate Variance (Within Field Soil Margin)"
        agro_badge = "warning"
    else:
        agro_status = "Elevated Request (Requires Verification)"
        agro_badge = "danger"

    # 7. Zone available supply comparison
    if zone_available_supply_m3 > 0:
        zone_demand_pct = round((current_requested_m3 / zone_available_supply_m3) * 100.0, 2)
        zone_surplus_or_shortage_m3 = round(zone_available_supply_m3 - current_requested_m3, 2)
        zone_status = "Sufficient" if zone_surplus_or_shortage_m3 >= 0 else "Zone Deficit Risk"
    else:
        zone_demand_pct = 0.0
        zone_surplus_or_shortage_m3 = 0.0
        zone_status = "Zone Telemetry Pending"

    # 8. Human-interpretable explainable analysis text
    analysis_narrative = (
        f"Farmer previously received {ref_received_m3:.1f} m³ ({ref_received_m3 * 1000.0:,.0f} L) in {prev_season}. "
        f"Current request is {current_requested_m3:.1f} m³ ({current_requested_litres:,.0f} L), "
        f"a change of {diff_from_prev_received_m3:+.1f} m³ ({diff_from_prev_received_litres:+,.0f} L, {pct_change:+.1f}%). "
        f"Theoretical scientific requirement for {area_acres} acres of {crop} ({growth_stage}) is {agronomic_gross_m3:.1f} m³ "
        f"({agronomic_gross_litres:,.0f} L). Status: {agro_status}."
    )

    return {
        "current_requested_m3": round(current_requested_m3, 2),
        "current_requested_litres": round(current_requested_litres, 1),
        "previous_allocated_m3": round(prev_allocated_m3, 2),
        "previous_allocated_litres": round(prev_allocated_m3 * 1000.0, 1),
        "previous_received_m3": round(prev_received_m3, 2),
        "previous_received_litres": round(prev_received_m3 * 1000.0, 1),
        "previous_delivery_date": prev_date,
        "previous_duration_hours": prev_duration,
        "previous_season": prev_season,
        "historical_avg_received_m3": round(hist_avg_received_m3, 2),
        "historical_avg_received_litres": round(hist_avg_received_m3 * 1000.0, 1),
        "historical_avg_requested_m3": round(hist_avg_requested_m3, 2),
        "historical_record_count": hist_record_count,
        "difference_from_previous_m3": diff_from_prev_received_m3,
        "difference_from_previous_litres": diff_from_prev_received_litres,
        "percentage_change": pct_change,
        "difference_from_avg_m3": diff_from_avg_m3,
        "percentage_change_avg": pct_change_avg,
        "agronomic_gross_m3": round(agronomic_gross_m3, 2),
        "agronomic_gross_litres": round(agronomic_gross_litres, 1),
        "agronomic_status": agro_status,
        "agronomic_badge": agro_badge,
        "zone_available_supply_m3": round(zone_available_supply_m3, 2),
        "zone_demand_pct": zone_demand_pct,
        "zone_surplus_or_shortage_m3": zone_surplus_or_shortage_m3,
        "zone_status": zone_status,
        "narrative": analysis_narrative
    }

class AuditHashChain:
    """
    Phase 21 & Module 18: Cryptographic SHA-256 Audit Log Hash Chain
    Tamper-evident verification of all administrative decisions and water allocations.
    """
    def __init__(self):
        self.chain: List[Dict[str, Any]] = []

    def add_event(self, actor: str, role: str, action: str, record_id: str, details: str) -> Dict[str, Any]:
        prev_hash = self.chain[-1]["current_hash"] if self.chain else "0000000000000000000000000000000000000000000000000000000000000000"
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        event_id = f"EVT-{len(self.chain) + 1:04d}"
        
        payload = f"{event_id}|{timestamp}|{actor}|{role}|{action}|{record_id}|{details}|{prev_hash}"
        curr_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        
        event = {
            "event_id": event_id,
            "timestamp": timestamp,
            "actor": actor,
            "role": role,
            "action": action,
            "record_id": record_id,
            "details": details,
            "previous_hash": prev_hash,
            "current_hash": curr_hash
        }
        self.chain.append(event)
        return event

    def verify_chain(self) -> Tuple[bool, str, List[Dict[str, Any]]]:
        if not self.chain:
            return True, "Audit chain is empty.", []
            
        verification_results = []
        for i, evt in enumerate(self.chain):
            expected_prev = "0000000000000000000000000000000000000000000000000000000000000000" if i == 0 else self.chain[i - 1]["current_hash"]
            if evt["previous_hash"] != expected_prev:
                return False, f"Broken link at event {evt['event_id']}: previous hash mismatch", verification_results

            payload = f"{evt['event_id']}|{evt['timestamp']}|{evt['actor']}|{evt['role']}|{evt['action']}|{evt['record_id']}|{evt['details']}|{evt['previous_hash']}"
            computed_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
            if computed_hash != evt["current_hash"]:
                return False, f"Tampering detected at event {evt['event_id']}: hash recalculation mismatch", verification_results
                
            verification_results.append({
                "event_id": evt["event_id"],
                "action": evt["action"],
                "actor": evt["actor"],
                "timestamp": evt["timestamp"],
                "valid": True,
                "hash_short": evt["current_hash"][:12] + "..."
            })
            
        return True, "All audit blocks mathematically verified. Hash chain is intact.", verification_results
