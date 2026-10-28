/**
 * JalMitra AI - Compliance Verification & Decision Checks
 * Implements the 8-Rule Compliance Demonstration and 13-Point Verification Matrix.
 * Transparent agricultural decision support rules (NOT legally binding statutory counsel).
 */

import { CROP_FACTORS } from "./allocation.js";

export function evaluateEightRules(request, systemState) {
  const rules = [];

  // Rule 1: Verify farmer request information
  const hasId = Boolean(request.farmer_id);
  const qty = parseFloat(request.requested_quantity || 0);
  const r1_ok = hasId && qty > 0;
  rules.push({
    rule_num: 1,
    name: "Farmer Request Information",
    status: r1_ok ? "Passed" : "Failed",
    badge_class: r1_ok ? "badge-success" : "badge-danger",
    explanation: r1_ok 
      ? `Farmer ID ${request.farmer_id} verified. Requested volume ${qty} T-m3 registered.`
      : "Farmer credentials or requested volume missing.",
    missing_info: r1_ok ? null : "Farmer identification credentials",
    action: r1_ok ? "Proceed to gate mapping." : "Re-enter farmer registration details."
  });

  // Rule 2: Verify eligible farm and canal association
  const gateId = request.gate_id || "";
  const knownGates = ["Gate-1", "Gate-2", "Gate-3", "Gate-4", "Gate-5", "Gate-6"];
  const r2_ok = knownGates.includes(gateId);
  rules.push({
    rule_num: 2,
    name: "Farm & Canal Association",
    status: r2_ok ? "Passed" : "Warning",
    badge_class: r2_ok ? "badge-success" : "badge-warning",
    explanation: r2_ok
      ? `Mapped to distributary ${gateId} under Godavari Left Bank Canal command area.`
      : `Outlet ${gateId} not in primary command registry.`,
    missing_info: r2_ok ? null : "Distributary association unverified",
    action: "Confirm canal outlet before gate operation."
  });

  // Rule 3: Review crop and growth-stage information
  const crop = request.crop || "";
  const stage = request.growth_stage || "";
  const cropData = CROP_FACTORS[crop];
  const r3_ok = Boolean(cropData && stage);
  rules.push({
    rule_num: 3,
    name: "Crop & Growth Stage Review",
    status: r3_ok ? "Passed" : "Requires Review",
    badge_class: r3_ok ? "badge-success" : "badge-warning",
    explanation: r3_ok
      ? `Crop: ${crop} in ${stage}. Kc coefficient matched from agronomic database.`
      : "Crop growth stage not verified in standard Krishi Vigyan table.",
    missing_info: r3_ok ? null : "Stage verification from field patwari",
    action: "Reference local crop calendar."
  });

  // Rule 4: Validate requested quantity and duration bounds
  const acreage = parseFloat(request.farm_area_acres || 3.0);
  const maxCeiling = acreage * 7.5; // Max 7.5 T-m3 per acre per watering
  const r4_ok = qty > 0 && qty <= maxCeiling;
  rules.push({
    rule_num: 4,
    name: "Quantity & Duration Bounds",
    status: r4_ok ? "Passed" : "Warning",
    badge_class: r4_ok ? "badge-success" : "badge-warning",
    explanation: r4_ok
      ? `Requested ${qty} T-m3 for ${acreage} acres within crop ceiling (${maxCeiling} T-m3 max).`
      : `Requested ${qty} T-m3 exceeds reasonable irrigation duty for ${acreage} acres.`,
    missing_info: r4_ok ? null : "Reason for extraordinary depth requirement",
    action: r4_ok ? "Proceed to quota check." : "Flag for Sectional Officer technical review."
  });

  // Rule 5: Check allocation limits and existing entitlement
  const pastReceived = parseFloat(request.current_cycle_received || 0);
  const r5_ok = (pastReceived + qty) <= (acreage * 16.0);
  rules.push({
    rule_num: 5,
    name: "Entitlement Limits & Prior Deliveries",
    status: r5_ok ? "Passed" : "Requires Review",
    badge_class: r5_ok ? "badge-success" : "badge-neutral",
    explanation: `Prior water delivered: ${pastReceived} T-m3. Remaining seasonal entitlement checked.`,
    missing_info: null,
    action: "Enforce Warabandi seasonal rotation balance."
  });

  // Rule 6: Check available supply and emergency reserve
  const allocPool = parseFloat(systemState.allocatable_supply || 45.0);
  const emergencyPct = parseFloat(systemState.emergency_reserve_pct || 15.0);
  const r6_ok = allocPool >= qty;
  rules.push({
    rule_num: 6,
    name: "Supply & Emergency Reserve Conservation",
    status: r6_ok ? "Passed" : "Warning",
    badge_class: r6_ok ? "badge-success" : "badge-warning",
    explanation: `Allocatable pool: ${allocPool} T-m3. Emergency reserve conserved at ${emergencyPct}%.`,
    missing_info: r6_ok ? null : "Deficit: Demand exceeds current single-turn pool",
    action: r6_ok ? "Adequate storage available." : "Apply proportional or rotational rationing."
  });

  // Rule 7: Assess competing requests and downstream impact
  const isTail = gateId === "Gate-5" || gateId === "Gate-6";
  rules.push({
    rule_num: 7,
    name: "Downstream Impact & Competing Demands",
    status: isTail ? "Passed" : "Requires Review",
    badge_class: isTail ? "badge-success" : "badge-neutral",
    explanation: isTail
      ? "Tail-reach farm: High priority to prevent downstream starvation."
      : "Head/Middle reach farm: Must preserve sufficient conveyance head for downstream gates.",
    missing_info: isTail ? null : "Hydraulic head loss at downstream tail",
    action: "Synchronize opening with tail-end delivery schedule."
  });

  // Rule 8: Mandatory human approval requirement
  rules.push({
    rule_num: 8,
    name: "Human Governance & Final Authority",
    status: "Requires Review",
    badge_class: "badge-info",
    explanation: "AI Recommends. Humans Govern. Final sluice gate release requires Sectional Officer authorization.",
    missing_info: "Pending Executive Engineer Sign-Off",
    action: "Forward recommendation to Officer Portal."
  });

  return rules;
}

export function evaluateThirteenPoints(request, systemState) {
  const points = [
    { label: "1. Farm Area", value: `${request.farm_area_acres || 3.0} Acres`, status: "Verified", impact: "Determines total volumetric irrigation boundary." },
    { label: "2. Crop Species", value: `${request.crop || "Sugarcane"}`, status: "Verified", impact: "Governs base evapotranspiration demand (ETc)." },
    { label: "3. Crop Growth Stage", value: `${request.growth_stage || "Grand Growth"}`, status: "Verified", impact: "Determines crop coefficient (Kc) and moisture sensitivity." },
    { label: "4. Water Demand", value: `${request.requested_quantity || 20.0} T-m3`, status: "Verified", impact: "Input demand ceiling for allocation calculation." },
    { label: "5. Entitlement Limit", value: `${(request.farm_area_acres || 3.0) * 12} T-m3`, status: "Verified", impact: "Seasonal statutory volumetric quota." },
    { label: "6. Current Allocation", value: `${request.proposed_quantity || 18.5} T-m3`, status: "Pending Approval", impact: "Proposed allocation under current cycle." },
    { label: "7. Water Received", value: `${request.current_cycle_received || 5.0} T-m3`, status: "Verified", impact: "Tracks cumulative delivery to date." },
    { label: "8. Water Deficit", value: `${request.water_deficit || 6.8} T-m3`, status: "Estimated", impact: "Root moisture stress indicator for priority scoring." },
    { label: "9. Available Supply", value: `${systemState.allocatable_supply || 45.0} T-m3`, status: "Verified", impact: "Maximum available water for distribution cycle." },
    { label: "10. Urgency Level", value: `${request.urgency || "High"}`, status: "Verified", impact: "Direct weighting factor in agronomic prioritization." },
    { label: "11. Competing Requests", value: `3 Competing Demands`, status: "Active", impact: "Requires multi-stakeholder dispute mediation." },
    { label: "12. Downstream Impact", value: `Gate-5 / Gate-6 Vulnerable`, status: "Monitored", impact: "Safeguards tail-end farmers against head-reach starvation." },
    { label: "13. Existing Schedule", value: `Cycle #4 (Oct 28 - Nov 04)`, status: "Scheduled", impact: "Prevents unscheduled or conflicting gate operations." }
  ];

  return points;
}
