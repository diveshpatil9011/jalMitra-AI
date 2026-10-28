/**
 * JalMitra AI - Water Allocation Mathematical Engine
 * Implements Proportional Rationing, Agronomic Priority, and Rotational Time-Shift algorithms.
 */

export const CROP_FACTORS = {
  Sugarcane: {
    base_depth_mm: 65,
    stages: { "Germination": 0.50, "Tillering": 0.85, "Grand Growth": 1.25, "Ripening": 0.75 },
    critical_stage: "Grand Growth",
    drought_sensitivity: 0.90
  },
  Cotton: {
    base_depth_mm: 50,
    stages: { "Vegetative": 0.45, "Flowering/Boll": 1.15, "Boll Maturation": 0.70 },
    critical_stage: "Flowering/Boll",
    drought_sensitivity: 0.85
  },
  Soybean: {
    base_depth_mm: 45,
    stages: { "Vegetative": 0.40, "Pod Formation": 1.10, "Grain Filling": 0.85 },
    critical_stage: "Pod Formation",
    drought_sensitivity: 0.80
  },
  Onion: {
    base_depth_mm: 40,
    stages: { "Transplanting": 0.50, "Bulb Formation": 1.05, "Bulb Maturation": 0.75 },
    critical_stage: "Bulb Formation",
    drought_sensitivity: 0.85
  },
  Vegetables: {
    base_depth_mm: 35,
    stages: { "Nursery/Early": 0.50, "Vegetative": 0.80, "Fruiting": 1.10 },
    critical_stage: "Fruiting",
    drought_sensitivity: 0.80
  }
};

export const SOIL_FACTORS = {
  "Black Cotton": 0.85,
  "Loamy": 0.75,
  "Sandy Loam": 0.65,
  "Alluvial": 0.80
};

export const IRRIGATION_METHODS = {
  "Drip": 0.90,
  "Sprinkler": 0.75,
  "Furrow": 0.60,
  "Flood": 0.50
};

export function estimateCropWaterRequirement({
  crop = "Sugarcane",
  farm_area_acres = 4.0,
  growth_stage = "Grand Growth",
  soil_type = "Black Cotton",
  irrigation_method = "Furrow",
  et0_mm_day = 5.0,
  effective_rainfall_mm = 0.0,
  interval_days = 14
}) {
  const cropData = CROP_FACTORS[crop] || CROP_FACTORS["Vegetables"];
  const kc = cropData.stages[growth_stage] || 0.85;
  const soilEff = SOIL_FACTORS[soil_type] || 0.75;
  const methodEff = IRRIGATION_METHODS[irrigation_method] || 0.60;
  
  // Net crop evapotranspiration ETc = ET0 * Kc
  let etc_period = (et0_mm_day * kc * interval_days) - effective_rainfall_mm;
  etc_period = Math.max(5.0, etc_period);
  
  const combinedEff = soilEff * methodEff;
  const grossDepthMm = etc_period / combinedEff;
  
  // 1 acre = 4046.86 m2
  const areaM2 = farm_area_acres * 4046.86;
  const volumeM3 = (grossDepthMm / 1000.0) * areaM2;
  const volumeThousandM3 = volumeM3 / 1000.0;
  
  return {
    crop,
    farm_area_acres,
    growth_stage,
    kc,
    grossDepthMm: Math.round(grossDepthMm * 10) / 10,
    applicationEfficiencyPct: Math.round(combinedEff * 100),
    volumeM3: Math.round(volumeM3),
    volumeThousandM3: Math.round(volumeThousandM3 * 100) / 100,
    isCriticalStage: (growth_stage === cropData.critical_stage)
  };
}

export function computeWaterBalance(inflowThousandM3, transitLossPct = 12.0, emergencyReservePct = 15.0) {
  const transitLoss = inflowThousandM3 * (transitLossPct / 100);
  const waterAfterLoss = Math.max(0, inflowThousandM3 - transitLoss);
  const emergencyReserve = inflowThousandM3 * (emergencyReservePct / 100);
  const allocatableSupply = Math.max(0, waterAfterLoss - emergencyReserve);
  
  return {
    inflow: Math.round(inflowThousandM3 * 100) / 100,
    transitLoss: Math.round(transitLoss * 100) / 100,
    transitLossPct,
    emergencyReserve: Math.round(emergencyReserve * 100) / 100,
    emergencyReservePct,
    allocatableSupply: Math.round(allocatableSupply * 100) / 100
  };
}

export function runAllocation(allocatableSupply, requests, strategy = "PROPORTIONAL") {
  const totalRequested = requests.reduce((sum, r) => sum + parseFloat(r.requested_quantity || 0), 0);
  if (totalRequested === 0) {
    return { strategy, allocatableSupply, totalRequested: 0, totalAllocated: 0, unmetDemand: 0, allocations: [] };
  }
  
  const allocations = [];
  
  if (strategy === "PROPORTIONAL") {
    const ratio = Math.min(1.0, allocatableSupply / totalRequested);
    requests.forEach(r => {
      const propQty = Math.round(r.requested_quantity * ratio * 10) / 10;
      allocations.push({
        request_id: r.id,
        farmer_name: r.farmer_name,
        gate_id: r.gate_id,
        crop: r.crop,
        growth_stage: r.growth_stage,
        requested_quantity: r.requested_quantity,
        proposed_quantity: propQty,
        unmet_demand: Math.round((r.requested_quantity - propQty) * 10) / 10,
        allocation_ratio: Math.round(ratio * 100),
        priority_score: 50.0,
        strategy_note: `Proportional rationing at ${Math.round(ratio * 100)}% of demand.`
      });
    });
  } else if (strategy === "AGRONOMIC") {
    // Score based on crop critical stage, urgency, deficit, and reach
    const scored = requests.map(r => {
      const cropInfo = CROP_FACTORS[r.crop] || {};
      const isCritical = (r.growth_stage === cropInfo.critical_stage);
      const urgencyWeights = { Emergency: 40, High: 30, Medium: 20, Normal: 10 };
      const uWeight = urgencyWeights[r.urgency] || 10;
      const stageWeight = isCritical ? 35 : 15;
      const deficitWeight = Math.min(15, (r.water_deficit || 2.0) * 1.5);
      const gateNum = parseInt(String(r.gate_id).replace(/\D/g, "") || "3");
      const reachWeight = gateNum >= 5 ? 10 : (gateNum >= 3 ? 5 : 0);
      const score = uWeight + stageWeight + deficitWeight + reachWeight;
      return { ...r, score };
    });
    
    // Sort descending by agronomic score
    scored.sort((a, b) => b.score - a.score);
    let remainingPool = allocatableSupply;
    
    scored.forEach(r => {
      const reqQty = r.requested_quantity;
      let allocQty = 0;
      if (remainingPool > 0) {
        const factor = r.score >= 80 ? 1.0 : Math.min(1.0, r.score / 85.0);
        const target = reqQty * factor;
        allocQty = Math.round(Math.min(remainingPool, target) * 10) / 10;
        remainingPool -= allocQty;
      }
      allocations.push({
        request_id: r.id,
        farmer_name: r.farmer_name,
        gate_id: r.gate_id,
        crop: r.crop,
        growth_stage: r.growth_stage,
        requested_quantity: reqQty,
        proposed_quantity: allocQty,
        unmet_demand: Math.round((reqQty - allocQty) * 10) / 10,
        allocation_ratio: Math.round((allocQty / reqQty) * 100),
        priority_score: Math.round(r.score * 10) / 10,
        strategy_note: `Agronomic Score: ${Math.round(r.score)} (${r.crop} in ${r.growth_stage}, ${r.urgency})`
      });
    });
  } else if (strategy === "ROTATIONAL") {
    let remainingPool = allocatableSupply;
    requests.forEach((r, idx) => {
      const reqQty = r.requested_quantity;
      const isTurnA = (idx % 2 === 0) || (r.urgency === "High" || r.urgency === "Emergency");
      let allocQty = 0;
      let note = "";
      if (isTurnA && remainingPool >= reqQty * 0.7) {
        allocQty = Math.round(Math.min(remainingPool, reqQty) * 10) / 10;
        remainingPool -= allocQty;
        note = "Scheduled for Primary Window (Turn A - 100% Release)";
      } else if (remainingPool > 0) {
        allocQty = Math.round(Math.min(remainingPool, reqQty * 0.45) * 10) / 10;
        remainingPool -= allocQty;
        note = "Assigned Supplemental Release (Turn B)";
      } else {
        allocQty = 0;
        note = "Deferred to Rotation Cycle #5 (Within 72h)";
      }
      allocations.push({
        request_id: r.id,
        farmer_name: r.farmer_name,
        gate_id: r.gate_id,
        crop: r.crop,
        growth_stage: r.growth_stage,
        requested_quantity: reqQty,
        proposed_quantity: allocQty,
        unmet_demand: Math.round((reqQty - allocQty) * 10) / 10,
        allocation_ratio: Math.round((allocQty / reqQty) * 100),
        priority_score: isTurnA ? 70.0 : 35.0,
        strategy_note: note
      });
    });
  }
  
  const totalAllocated = Math.round(allocations.reduce((sum, a) => sum + a.proposed_quantity, 0) * 10) / 10;
  const unmetDemand = Math.round(Math.max(0, totalRequested - totalAllocated) * 10) / 10;
  const fairness = computeFairnessScore(allocations);
  
  return {
    strategy,
    allocatableSupply,
    totalRequested: Math.round(totalRequested * 10) / 10,
    totalAllocated,
    unmetDemand,
    fairness,
    allocations
  };
}

export function computeFairnessScore(allocations) {
  if (!allocations || allocations.length === 0) return { score: 100, index: 1.0, rating: "Optimal" };
  const ratios = allocations.map(a => {
    const req = a.requested_quantity || 1;
    const prop = a.proposed_quantity || 0;
    return Math.min(1.0, prop / req);
  });
  const n = ratios.length;
  const sumR = ratios.reduce((s, r) => s + r, 0);
  const sumSq = ratios.reduce((s, r) => s + (r * r), 0);
  const jIndex = (n === 0 || sumSq === 0) ? 1.0 : (sumR * sumR) / (n * sumSq);
  const score = Math.round(jIndex * 1000) / 10;
  const rating = score >= 85 ? "High Equity (Fair)" : (score >= 70 ? "Moderate Equity" : "Inequitable Distribution");
  return { score, index: Math.round(jIndex * 100) / 100, rating };
}

export function analyzeDemandVsHistory(currentRequest, historyRecords = [], zoneAvailableSupplyM3 = 45.0) {
  // 1. Parse current requested quantity and units
  const unit = String(currentRequest.unit || "m3").toLowerCase();
  const rawQty = parseFloat(currentRequest.requested_quantity || currentRequest.requested_quantity_m3 || 0.0);
  
  let currentRequestedM3 = rawQty;
  let currentRequestedLitres = rawQty * 1000.0;
  if (unit === "litres" || unit === "litre" || unit === "l") {
    currentRequestedLitres = rawQty;
    currentRequestedM3 = rawQty / 1000.0;
  } else if (unit === "t-m3" || unit === "thousand_m3") {
    currentRequestedM3 = rawQty * 1000.0;
    currentRequestedLitres = currentRequestedM3 * 1000.0;
  }

  // 2. Filter records for this farmer
  const farmerId = currentRequest.farmer_id;
  let farmerHistory = historyRecords;
  if (farmerId && historyRecords.length > 0) {
    const matched = historyRecords.filter(h => h.farmer_id === farmerId);
    if (matched.length > 0) farmerHistory = matched;
  }

  // Sort descending by delivery date
  const sorted = [...farmerHistory].sort((a, b) => {
    return String(b.delivery_date || b.date || b.id || "").localeCompare(String(a.delivery_date || a.date || a.id || ""));
  });

  // 3. Previous cycle metrics
  let prevReceivedM3 = 0.0;
  let prevAllocatedM3 = 0.0;
  let prevRequestedM3 = 0.0;
  let prevDate = "None recorded";
  let prevDuration = 0;
  let prevSeason = "N/A";
  let prevCrop = currentRequest.crop || "Unknown";

  if (sorted.length > 0) {
    const prev = sorted[0];
    prevReceivedM3 = parseFloat(prev.received_qty_m3 || prev.received_quantity || 0.0);
    prevAllocatedM3 = parseFloat(prev.allocated_qty_m3 || prev.allocated_quantity || 0.0);
    prevRequestedM3 = parseFloat(prev.requested_qty_m3 || prev.requested_quantity || 0.0);
    prevDate = prev.delivery_date || prev.date || "N/A";
    prevDuration = prev.duration_hours || 0;
    prevSeason = `${prev.year || ''} ${prev.season || ''}`.trim();
    prevCrop = prev.crop || currentRequest.crop || "Unknown";
  }

  // 4. Historical Averages
  const completed = sorted.filter(h => parseFloat(h.received_qty_m3 || h.received_quantity || 0) > 0);
  let histAvgReceivedM3 = prevReceivedM3;
  let histAvgRequestedM3 = prevRequestedM3;
  let histCount = completed.length;

  if (completed.length > 0) {
    const sumRec = completed.reduce((s, h) => s + parseFloat(h.received_qty_m3 || h.received_quantity || 0), 0);
    const sumReq = completed.reduce((s, h) => s + parseFloat(h.requested_qty_m3 || h.requested_quantity || 0), 0);
    histAvgReceivedM3 = Math.round((sumRec / completed.length) * 100) / 100;
    histAvgRequestedM3 = Math.round((sumReq / completed.length) * 100) / 100;
  }

  // 5. Differences & Percentage Changes
  const refReceivedM3 = prevReceivedM3 > 0 ? prevReceivedM3 : (histAvgReceivedM3 > 0 ? histAvgReceivedM3 : prevAllocatedM3);
  const diffFromPrevM3 = Math.round((currentRequestedM3 - refReceivedM3) * 100) / 100;
  const diffFromPrevLitres = Math.round(diffFromPrevM3 * 1000.0 * 10) / 10;
  const pctChange = refReceivedM3 > 0 ? Math.round((diffFromPrevM3 / refReceivedM3) * 1000) / 10 : 0.0;

  const diffFromAvgM3 = Math.round((currentRequestedM3 - histAvgReceivedM3) * 100) / 100;
  const pctChangeAvg = histAvgReceivedM3 > 0 ? Math.round((diffFromAvgM3 / histAvgReceivedM3) * 1000) / 10 : 0.0;

  // 6. Scientific agronomic estimate
  const crop = currentRequest.crop || "Sugarcane";
  const area = parseFloat(currentRequest.farm_area_acres || 3.0);
  const stage = currentRequest.growth_stage || "Grand Growth";
  const agro = estimateCropWaterRequirement({
    crop,
    farm_area_acres: area,
    growth_stage: stage,
    soil_type: currentRequest.soil_type || "Black Cotton",
    irrigation_method: currentRequest.irrigation_method || "Furrow"
  });

  const agroGrossM3 = agro.estimated_volume_m3 || 0;
  const agroGrossLitres = agroGrossM3 * 1000.0;

  let agroStatus = "Agronomically Justified";
  let agroBadge = "success";
  if (currentRequestedM3 > agroGrossM3 * 1.25) {
    agroStatus = "Elevated Request (Requires Verification)";
    agroBadge = "danger";
  } else if (currentRequestedM3 > agroGrossM3 * 1.05) {
    agroStatus = "Moderate Variance (Within Field Soil Margin)";
    agroBadge = "warning";
  }

  // 7. Zone available supply balance
  const zoneSupply = parseFloat(zoneAvailableSupplyM3 || 45.0);
  const zoneDemandPct = zoneSupply > 0 ? Math.round((currentRequestedM3 / zoneSupply) * 10000) / 100 : 0;
  const zoneShortageSurplusM3 = Math.round((zoneSupply - currentRequestedM3) * 100) / 100;

  const narrative = `Farmer previously received ${refReceivedM3.toFixed(1)} m³ (${(refReceivedM3 * 1000).toLocaleString()} L) in ${prevSeason}. Current request is ${currentRequestedM3.toFixed(1)} m³ (${Math.round(currentRequestedLitres).toLocaleString()} L), a change of ${diffFromPrevM3 >= 0 ? '+' : ''}${diffFromPrevM3.toFixed(1)} m³ (${diffFromPrevLitres >= 0 ? '+' : ''}${Math.round(diffFromPrevLitres).toLocaleString()} L, ${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}%). Agronomic FAO-56 scientific estimate for ${area} acres of ${crop} (${stage}) is ${agroGrossM3.toFixed(1)} m³ (${Math.round(agroGrossLitres).toLocaleString()} L). Status: ${agroStatus}.`;

  return {
    current_requested_m3: Math.round(currentRequestedM3 * 100) / 100,
    current_requested_litres: Math.round(currentRequestedLitres * 10) / 10,
    previous_allocated_m3: Math.round(prevAllocatedM3 * 100) / 100,
    previous_allocated_litres: Math.round(prevAllocatedM3 * 1000.0 * 10) / 10,
    previous_received_m3: Math.round(prevReceivedM3 * 100) / 100,
    previous_received_litres: Math.round(prevReceivedM3 * 1000.0 * 10) / 10,
    previous_delivery_date: prevDate,
    previous_duration_hours: prevDuration,
    previous_season: prevSeason,
    historical_avg_received_m3: Math.round(histAvgReceivedM3 * 100) / 100,
    historical_avg_received_litres: Math.round(histAvgReceivedM3 * 1000.0 * 10) / 10,
    historical_avg_requested_m3: Math.round(histAvgRequestedM3 * 100) / 100,
    historical_record_count: histCount,
    difference_from_previous_m3: diffFromPrevM3,
    difference_from_previous_litres: diffFromPrevLitres,
    percentage_change: pctChange,
    difference_from_avg_m3: diffFromAvgM3,
    percentage_change_avg: pctChangeAvg,
    agronomic_gross_m3: Math.round(agroGrossM3 * 100) / 100,
    agronomic_gross_litres: Math.round(agroGrossLitres * 10) / 10,
    agronomic_status: agroStatus,
    agronomic_badge: agroBadge,
    zone_available_supply_m3: Math.round(zoneSupply * 100) / 100,
    zone_demand_pct: zoneDemandPct,
    zone_surplus_or_shortage_m3: zoneShortageSurplusM3,
    zone_status: zoneShortageSurplusM3 >= 0 ? "Sufficient Pool" : "Zone Deficit Risk",
    narrative
  };
}
