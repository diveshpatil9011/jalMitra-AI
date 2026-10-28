"""
JalMitra AI - Backend REST API & SPA Static Server
Pure Python 3 implementation with zero external dependencies.
Supports complete Farmer-to-Authority digital irrigation governance and dispute mediation.
"""
import http.server
import socketserver
import json
import os
import sys
import time
import csv
import io
import urllib.parse
from typing import Dict, Any, List

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import database as db
from engine import (
    calculate_crop_water_estimate,
    calculate_water_balance,
    run_allocation_engine,
    verify_eight_rules,
    verify_thirteen_points,
    detect_schedule_conflicts,
    generate_mediation_proposals,
    calculate_fairness_index,
    analyze_demand_vs_history,
    AuditHashChain,
    CROP_DATA,
    DEFAULT_RULES_CONFIG
)

PORT = 8000
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "src")

# Initialize global cryptographic audit chain
audit_chain = AuditHashChain()

# Seed initial demonstration audit events
audit_chain.add_event("System", "System", "SYSTEM_INIT", "CANAL-GLBC-01", "Godavari Left Bank Canal irrigation cycle initialized.")
audit_chain.add_event("Er. S. Deshmukh", "Officer", "CYCLE_CONFIG", "CYC-2026-04", "Rabi Rotation Cycle #4 scheduled with 45.0 T-m3 allocatable supply.")
audit_chain.add_event("Ramesh Patil", "Farmer", "SUBMIT_REQUEST", "REQ-2026-001", "Submitted water request for 25 T-m3 for Sugarcane (Grand Growth stage).")
audit_chain.add_event("Suresh Shinde", "Farmer", "SUBMIT_REQUEST", "REQ-2026-002", "Submitted water request for 30 T-m3 for Cotton (Flowering stage).")
audit_chain.add_event("Sunita Gaikwad", "Farmer", "SUBMIT_REQUEST", "REQ-2026-003", "Submitted water request for 15 T-m3 for Onion (Bulb Formation).")
audit_chain.add_event("Vilas More", "Farmer", "SUBMIT_REQUEST", "REQ-2026-004", "Submitted water request for 18 T-m3 for Soybean (Pod Formation).")
audit_chain.add_event("Ramesh Patil", "Farmer", "RAISE_DISPUTE", "DISP-2026-001", "Raised dispute against upstream Gate 1 overdraw causing severe Gate 5 tail starvation.")

DEFAULT_SYSTEM_STATE = {
    "reservoir": {
        "name": "Waghad / Gangapur Reservoir Complex",
        "current_storage_mcft": 142.5,
        "live_capacity_pct": 74.2,
        "canal_name": "Godavari Left Bank Canal (GLBC)",
        "design_discharge_cusecs": 150.0,
        "current_head_flow_cusecs": 115.0,
        "total_cycle_supply_thousand_m3": 65.0,
        "transit_loss_pct": 12.0,
        "emergency_reserve_pct": 15.0,
        "allocatable_supply": 45.0,
        "cycle_dates": "Oct 28 - Nov 04, 2026",
        "water_shortage_risk": "Moderate - Tail Reach Stress"
    },
    "rules_config": dict(DEFAULT_RULES_CONFIG),
    "gates": [
        {"id": "Gate-1", "name": "Sukene Distributary", "reach": "Head", "distance_km": 4.5, "flow_cusecs": 28.0, "status": "Open", "anomaly": False, "lat": 20.021, "lng": 73.915, "connected_farmers": ["FARMER-MH-014"]},
        {"id": "Gate-2", "name": "Ozar Minor", "reach": "Head", "distance_km": 9.2, "flow_cusecs": 24.0, "status": "Open", "anomaly": False, "lat": 20.038, "lng": 73.948, "connected_farmers": []},
        {"id": "Gate-3", "name": "Pimpalgaon Outlet A", "reach": "Middle", "distance_km": 16.8, "flow_cusecs": 20.0, "status": "Open", "anomaly": False, "lat": 20.054, "lng": 73.988, "connected_farmers": ["FARMER-MH-032"]},
        {"id": "Gate-4", "name": "Pimpalgaon Outlet B", "reach": "Middle", "distance_km": 22.4, "flow_cusecs": 18.0, "status": "Partial", "anomaly": True, "anomaly_note": "Possible 18% conveyance loss / silt obstruction between Gate 3 & 4", "lat": 20.068, "lng": 74.045, "connected_farmers": ["FARMER-MH-055"]},
        {"id": "Gate-5", "name": "Niphad Distributary", "reach": "Tail", "distance_km": 31.0, "flow_cusecs": 12.0, "status": "Restricted", "anomaly": True, "anomaly_note": "Low pressure alert: Discharge 35% below scheduled duty", "lat": 20.082, "lng": 74.112, "connected_farmers": ["FARMER-MH-081"]},
        {"id": "Gate-6", "name": "Chandori Tail End", "reach": "Tail", "distance_km": 38.5, "flow_cusecs": 8.0, "status": "Critical", "anomaly": True, "anomaly_note": "Critical tail-end starvation risk", "lat": 20.096, "lng": 74.185, "connected_farmers": []}
    ],
    "farmers": [
        {
            "id": "FARMER-MH-081",
            "name": "Ramesh Patil",
            "village": "Niphad",
            "gat_no": "142/2A",
            "farm_area_acres": 4.0,
            "crop": "Sugarcane",
            "growth_stage": "Grand Growth",
            "soil_type": "Black Cotton",
            "irrigation_method": "Furrow",
            "gate_id": "Gate-5",
            "reach": "Tail",
            "distance_km": 31.0,
            "current_cycle_received": 5.0,
            "water_deficit": 6.8,
            "turn_schedule": "Thursday 06:00 AM - 02:00 PM",
            "phone_masked": "+91 98****4210",
            "lat": 20.083,
            "lng": 74.115
        },
        {
            "id": "FARMER-MH-014",
            "name": "Suresh Shinde",
            "village": "Sukene",
            "gat_no": "58/1",
            "farm_area_acres": 5.0,
            "crop": "Cotton",
            "growth_stage": "Flowering/Boll",
            "soil_type": "Black Cotton",
            "irrigation_method": "Furrow",
            "gate_id": "Gate-1",
            "reach": "Head",
            "distance_km": 4.5,
            "current_cycle_received": 12.0,
            "water_deficit": 1.5,
            "turn_schedule": "Tuesday 08:00 AM - 04:00 PM",
            "phone_masked": "+91 94****1108",
            "lat": 20.023,
            "lng": 73.918
        },
        {
            "id": "FARMER-MH-032",
            "name": "Sunita Gaikwad",
            "village": "Pimpalgaon",
            "gat_no": "93",
            "farm_area_acres": 2.5,
            "crop": "Onion",
            "growth_stage": "Bulb Formation",
            "soil_type": "Loamy",
            "irrigation_method": "Drip",
            "gate_id": "Gate-3",
            "reach": "Middle",
            "distance_km": 16.8,
            "current_cycle_received": 4.0,
            "water_deficit": 2.2,
            "turn_schedule": "Wednesday 10:00 AM - 04:00 PM",
            "phone_masked": "+91 99****8765",
            "lat": 20.056,
            "lng": 73.990
        },
        {
            "id": "FARMER-MH-055",
            "name": "Vilas More",
            "village": "Pimpalgaon",
            "gat_no": "112/4",
            "farm_area_acres": 3.5,
            "crop": "Soybean",
            "growth_stage": "Pod Formation",
            "soil_type": "Black Cotton",
            "irrigation_method": "Sprinkler",
            "gate_id": "Gate-4",
            "reach": "Middle",
            "distance_km": 22.4,
            "current_cycle_received": 6.0,
            "water_deficit": 3.0,
            "turn_schedule": "Wednesday 04:00 PM - 10:00 PM",
            "phone_masked": "+91 97****3322",
            "lat": 20.070,
            "lng": 74.048
        }
    ],
    "officers": [
        {
            "id": "OFFICER-ENG-01",
            "name": "Er. S. Deshmukh",
            "role": "Executive Engineer",
            "division": "Godavari Left Bank Canal (GLBC) Irrigation Division",
            "station": "Nashik Head Office",
            "jurisdiction": "Entire Canal Command (KM 0 - 40)"
        },
        {
            "id": "OFFICER-SDO-02",
            "name": "Er. P. Kulkarni",
            "role": "Sub-Divisional Officer",
            "division": "Pimpalgaon Irrigation Sub-Division",
            "station": "Pimpalgaon Baswant",
            "jurisdiction": "Middle & Tail Reach (Gate 3 - Gate 6)"
        }
    ],
    "requests": [
        {
            "id": "REQ-2026-001",
            "farmer_id": "FARMER-MH-081",
            "farmer_name": "Ramesh Patil",
            "gate_id": "Gate-5",
            "crop": "Sugarcane",
            "growth_stage": "Grand Growth",
            "farm_area_acres": 4.0,
            "requested_quantity": 25.0,
            "duration_hours": 8,
            "urgency": "High",
            "reason": "Grand growth stage critical moisture stress; tail-end canal pressure is inadequate.",
            "preferred_window": "Daytime Turn (06:00 - 14:00)",
            "status": "Under Review",
            "proposed_quantity": 18.5,
            "approved_quantity": None,
            "date": "2026-10-27T08:30:00Z",
            "officer_comment": "Preliminary agronomic score 78.5/100. Tail-reach prioritization indicated."
        },
        {
            "id": "REQ-2026-002",
            "farmer_id": "FARMER-MH-014",
            "farmer_name": "Suresh Shinde",
            "gate_id": "Gate-1",
            "crop": "Cotton",
            "growth_stage": "Flowering/Boll",
            "farm_area_acres": 5.0,
            "requested_quantity": 30.0,
            "duration_hours": 10,
            "urgency": "Medium",
            "reason": "Flowering stage irrigation demand.",
            "preferred_window": "Morning Turn (08:00 - 16:00)",
            "status": "Proposed",
            "proposed_quantity": 21.0,
            "approved_quantity": None,
            "date": "2026-10-27T09:15:00Z",
            "officer_comment": "Head-reach request. Scaled to ensure tail-reach equity."
        },
        {
            "id": "REQ-2026-003",
            "farmer_id": "FARMER-MH-032",
            "farmer_name": "Sunita Gaikwad",
            "gate_id": "Gate-3",
            "crop": "Onion",
            "growth_stage": "Bulb Formation",
            "farm_area_acres": 2.5,
            "requested_quantity": 15.0,
            "duration_hours": 6,
            "urgency": "Emergency",
            "reason": "Bulb formation drought sensitivity; drip reservoir dry.",
            "preferred_window": "Immediate Turn (10:00 - 16:00)",
            "status": "Approved",
            "proposed_quantity": 15.0,
            "approved_quantity": 14.0,
            "date": "2026-10-26T14:20:00Z",
            "officer_comment": "Approved for emergency bulb-stage preservation. Drip system verified."
        },
        {
            "id": "REQ-2026-004",
            "farmer_id": "FARMER-MH-055",
            "farmer_name": "Vilas More",
            "gate_id": "Gate-4",
            "crop": "Soybean",
            "growth_stage": "Pod Formation",
            "farm_area_acres": 3.5,
            "requested_quantity": 18.0,
            "duration_hours": 6,
            "urgency": "Normal",
            "reason": "Pod filling supplemental turn.",
            "preferred_window": "Evening Turn (16:00 - 22:00)",
            "status": "Proposed",
            "proposed_quantity": 12.0,
            "approved_quantity": None,
            "date": "2026-10-27T11:00:00Z",
            "officer_comment": "Middle-reach proportional rationing applied."
        }
    ],
    "complaints": [
        {
            "id": "CMP-2026-001",
            "farmer_id": "FARMER-MH-081",
            "farmer_name": "Ramesh Patil",
            "category": "Downstream Water Shortage",
            "gate_id": "Gate-5",
            "urgency": "High",
            "crop": "Sugarcane",
            "growth_stage": "Grand Growth",
            "shortfall_quantity": 12.5,
            "date": "2026-10-27T10:15:00Z",
            "status": "Under Investigation",
            "assigned_officer": "Er. S. Deshmukh (EE)",
            "description": "Canal water has not reached Niphad Tail-End Gate 5 for 4 days despite scheduled rotation. Cane crop in grand growth is wilting.",
            "suspected_cause": "Excessive upstream withdrawal at Gate 1-2 and potential conveyance breach between Gate 3 & 4.",
            "evidence_type": "Reported Info + Corroborated Low Gate Flow (12 cusecs vs 22 cusecs target)",
            "investigation_notes": "Field patwari dispatched to inspect Gate 3-4 syphon. Head reach canal discharge regulated.",
            "sla_target_hours": 48,
            "elapsed_hours": 26,
            "is_overdue": False
        },
        {
            "id": "CMP-2026-002",
            "farmer_id": "FARMER-MH-055",
            "farmer_name": "Vilas More",
            "category": "Canal Leakage",
            "gate_id": "Gate-4",
            "urgency": "Medium",
            "crop": "Soybean",
            "growth_stage": "Pod Formation",
            "shortfall_quantity": 4.0,
            "date": "2026-10-26T16:00:00Z",
            "status": "Action Initiated",
            "assigned_officer": "Sub-Divisional Officer Pimpalgaon",
            "description": "Seepage observed along canal embankment 200m downstream of Gate 4.",
            "suspected_cause": "Embankment crack / rodent burrows causing conveyance loss.",
            "evidence_type": "Field observation report with photographic demonstration sample",
            "investigation_notes": "Emergency sandbag reinforcement deployed by maintenance gang.",
            "sla_target_hours": 72,
            "elapsed_hours": 44,
            "is_overdue": False
        }
    ],
    "disputes": [
        {
            "id": "DISP-2026-001",
            "title": "Head-Reach Overdraw vs Tail-End Wilting Emergency",
            "category": "Unequal Water Distribution",
            "severity": "High",
            "farmer_a_id": "FARMER-MH-014",
            "farmer_a_name": "Suresh Shinde",
            "farmer_a_gate": "Gate-1 (Head Reach, 4.5 km)",
            "farmer_a_crop": "Cotton (Flowering/Boll)",
            "farmer_a_requested": 30.0,
            "farmer_a_claim": "Head-reach canal has historically operated at 28-30 cusecs. Cotton in peak flowering needs deep wetting; reducing discharge will hurt yield.",
            "farmer_a_status": "Reviewing Options",
            
            "farmer_b_id": "FARMER-MH-081",
            "farmer_b_name": "Ramesh Patil",
            "farmer_b_gate": "Gate-5 (Tail Reach, 31.0 km)",
            "farmer_b_crop": "Sugarcane (Grand Growth)",
            "farmer_b_requested": 25.0,
            "farmer_b_claim": "Discharge at Gate 5 has dropped to 12 cusecs (45% below duty). Sugarcane in grand growth will permanently stunt without full water turn.",
            "farmer_b_status": "Accepts Option 2 (Agronomic Priority)",

            "status": "Mediation in Progress",
            "assigned_officer": "Er. S. Deshmukh (EE)",
            "created_date": "2026-10-27T10:30:00Z",
            "evidence": [
                {"type": "Canal Telemetry", "summary": "Gate 1 drawing 28.0 cusecs while Gate 5 receives only 12.0 cusecs."},
                {"type": "Agronomic Assessment", "summary": "Sugarcane drought sensitivity 0.90 in Grand Growth vs Cotton 0.85."},
                {"type": "Field Report", "summary": "Patwari verification confirms severe tail reach soil crack formation."}
            ],
            "proposals": generate_mediation_proposals({
                "farmer_a_name": "Suresh Shinde",
                "farmer_a_requested": 30.0,
                "farmer_b_name": "Ramesh Patil",
                "farmer_b_requested": 25.0
            }, allocatable_supply=45.0),
            "selected_proposal": "PROP-B",
            "ratification_status": "Awaiting Official Approval",
            "ratification_notes": "Proposal B approved in principle by Sub-Divisional Officer. Executive Engineer sign-off queued."
        }
    ],
    "schedules": [
        {
            "id": "SCH-2026-01",
            "date": "2026-10-28",
            "day": "Tuesday",
            "window": "08:00 - 16:00",
            "gate_id": "Gate-1",
            "gate_name": "Sukene Distributary",
            "farmer_id": "FARMER-MH-014",
            "farmer_name": "Suresh Shinde",
            "reach": "Head",
            "flow_cusecs": 28.0,
            "allocated_qty": 21.0,
            "status": "Confirmed"
        },
        {
            "id": "SCH-2026-02",
            "date": "2026-10-29",
            "day": "Wednesday",
            "window": "10:00 - 16:00",
            "gate_id": "Gate-3",
            "gate_name": "Pimpalgaon Outlet A",
            "farmer_id": "FARMER-MH-032",
            "farmer_name": "Sunita Gaikwad",
            "reach": "Middle",
            "flow_cusecs": 20.0,
            "allocated_qty": 14.0,
            "status": "Active"
        },
        {
            "id": "SCH-2026-03",
            "date": "2026-10-29",
            "day": "Wednesday",
            "window": "16:00 - 22:00",
            "gate_id": "Gate-4",
            "gate_name": "Pimpalgaon Outlet B",
            "farmer_id": "FARMER-MH-055",
            "farmer_name": "Vilas More",
            "reach": "Middle",
            "flow_cusecs": 18.0,
            "allocated_qty": 12.0,
            "status": "Scheduled"
        },
        {
            "id": "SCH-2026-04",
            "date": "2026-10-30",
            "day": "Thursday",
            "window": "06:00 - 14:00",
            "gate_id": "Gate-5",
            "gate_name": "Niphad Distributary",
            "farmer_id": "FARMER-MH-081",
            "farmer_name": "Ramesh Patil",
            "reach": "Tail",
            "flow_cusecs": 22.0,
            "allocated_qty": 18.5,
            "status": "Subject to Mediation"
        }
    ],
    "conflicts": [
        {
            "id": "CNF-2026-001",
            "title": "Head-Reach vs Tail-End Peak Rotation Conflict",
            "severity": "High",
            "gate_ids": ["Gate-1", "Gate-5"],
            "farmers_affected": ["Suresh Shinde (Head - Gate 1)", "Ramesh Patil (Tail - Gate 5)"],
            "water_deficit_thousand_m3": 17.5,
            "conflict_type": "Discharge Deficit & Delivery Window Overlap",
            "summary": "Farmer Shinde requests 30 T-m3 for Cotton, while downstream Farmer Patil faces acute crop wilting at Gate 5 with 25 T-m3 demand. Simultaneous full release will depress tail pressure below critical operating head.",
            "suggested_resolution": "Mediation Accord: Rotational shift or Agronomic Criticality prioritization with 20% head-reach rationing.",
            "status": "In Mediation"
        }
    ],
    "anomalies": [
        {
            "id": "ANM-2026-01",
            "gate_id": "Gate-5",
            "severity": "High",
            "title": "Severe Discharge Drop (Tail Reach)",
            "observed_value": "12.0 cusecs",
            "expected_value": "22.0 cusecs",
            "difference": "-45.4%",
            "timestamp": "2026-10-28T04:00:00Z",
            "suggested_investigation": "Inspect upstream distributary Gate 3-4 for unauthorized pumping or gate tampering.",
            "status": "Acknowledged"
        },
        {
            "id": "ANM-2026-02",
            "gate_id": "Gate-4",
            "severity": "Medium",
            "title": "Conveyance Drop Between G3 & G4",
            "observed_value": "18.0 cusecs",
            "expected_value": "21.5 cusecs",
            "difference": "-16.2%",
            "timestamp": "2026-10-27T18:30:00Z",
            "suggested_investigation": "Verify canal seepage repair near KM 21.8.",
            "status": "Investigating"
        }
    ],
    "notifications": [
        {
            "id": "NOTIF-01",
            "target": "FARMER-MH-081",
            "title": "Grievance CMP-2026-001 Under Investigation",
            "message": "Executive Engineer Deshmukh assigned Field Patwari to inspect Gate 5 pressure.",
            "timestamp": "2026-10-27T11:00:00Z",
            "type": "complaint",
            "read": False
        },
        {
            "id": "NOTIF-02",
            "target": "FARMER-MH-081",
            "title": "Mediation Room Active: DISP-2026-001",
            "message": "3 Feasible compromise proposals generated. Review Option 2 (Agronomic Priority).",
            "timestamp": "2026-10-27T10:45:00Z",
            "type": "mediation",
            "read": False
        },
        {
            "id": "NOTIF-03",
            "target": "FARMER-MH-014",
            "title": "Mediation Notice: DISP-2026-001",
            "message": "Grievance filed regarding Gate 1 upstream draw. Compromise proposal presented in Mediation Room.",
            "timestamp": "2026-10-27T10:45:00Z",
            "type": "mediation",
            "read": False
        },
        {
            "id": "NOTIF-04",
            "target": "FARMER-MH-032",
            "title": "Water Request REQ-2026-003 Approved!",
            "message": "Emergency turn approved: 14.0 T-m3 for Gate-3 Onion crop. Turn opens Wed 10:00 AM.",
            "timestamp": "2026-10-26T16:00:00Z",
            "type": "approval",
            "read": True
        }
    ],
    "users": [
        {
            "id": "FARMER-MH-081",
            "username": "ramesh.patil",
            "mobile": "9822004210",
            "password": "kisan123",
            "role": "farmer",
            "name": "Ramesh Patil",
            "village": "Niphad",
            "district": "Nashik",
            "gat_no": "142/2A",
            "farm_area_acres": 4.0,
            "crop": "Sugarcane",
            "season": "Rabi",
            "gate_id": "Gate-5",
            "reach": "Tail"
        },
        {
            "id": "FARMER-MH-014",
            "username": "suresh.shinde",
            "mobile": "9422001108",
            "password": "kisan123",
            "role": "farmer",
            "name": "Suresh Shinde",
            "village": "Sukene",
            "district": "Nashik",
            "gat_no": "58/1",
            "farm_area_acres": 5.0,
            "crop": "Cotton",
            "season": "Kharif",
            "gate_id": "Gate-1",
            "reach": "Head"
        },
        {
            "id": "FARMER-MH-032",
            "username": "sunita.gaikwad",
            "mobile": "9922008765",
            "password": "kisan123",
            "role": "farmer",
            "name": "Sunita Gaikwad",
            "village": "Pimpalgaon",
            "district": "Nashik",
            "gat_no": "93",
            "farm_area_acres": 2.5,
            "crop": "Onion",
            "season": "Rabi",
            "gate_id": "Gate-3",
            "reach": "Middle"
        },
        {
            "id": "FARMER-MH-055",
            "username": "vilas.more",
            "mobile": "9722003322",
            "password": "kisan123",
            "role": "farmer",
            "name": "Vilas More",
            "village": "Pimpalgaon",
            "district": "Nashik",
            "gat_no": "112/4",
            "farm_area_acres": 3.5,
            "crop": "Soybean",
            "season": "Kharif",
            "gate_id": "Gate-4",
            "reach": "Middle"
        },
        {
            "id": "OFFICER-ENG-01",
            "username": "deshmukh.ee",
            "email": "deshmukh.ee@jalmitra.gov.in",
            "mobile": "9823001001",
            "password": "admin123",
            "role": "officer",
            "name": "Er. S. Deshmukh",
            "designation": "Executive Engineer",
            "division": "Godavari Left Bank Canal (GLBC) Irrigation Division",
            "station": "Nashik Head Office",
            "jurisdiction": "Entire Canal Command (KM 0 - 40)"
        },
        {
            "id": "OFFICER-SDO-02",
            "username": "kulkarni.sdo",
            "email": "kulkarni.sdo@jalmitra.gov.in",
            "mobile": "9823001002",
            "password": "admin123",
            "role": "officer",
            "name": "Er. P. Kulkarni",
            "designation": "Sub-Divisional Officer",
            "division": "Pimpalgaon Irrigation Sub-Division",
            "station": "Pimpalgaon Baswant",
            "jurisdiction": "Middle & Tail Reach (Gate 3 - Gate 6)"
        }
    ],
    "water_history": [
        {
            "id": "HIST-MH081-01",
            "farmer_id": "FARMER-MH-081",
            "farmer_name": "Ramesh Patil",
            "year": 2024,
            "season": "Kharif",
            "crop": "Sugarcane",
            "growth_stage": "Tillering",
            "gate_id": "Gate-5",
            "reach": "Tail",
            "delivery_date": "2024-07-15",
            "duration_hours": 8.0,
            "requested_qty_m3": 24.0,
            "requested_qty_litres": 24000.0,
            "allocated_qty_m3": 21.0,
            "allocated_qty_litres": 21000.0,
            "received_qty_m3": 19.0,
            "received_qty_litres": 19000.0,
            "shortage_m3": 5.0,
            "status": "Completed",
            "officer_remarks": "Monsoon delay supplemental release. Minor head friction loss."
        },
        {
            "id": "HIST-MH081-02",
            "farmer_id": "FARMER-MH-081",
            "farmer_name": "Ramesh Patil",
            "year": 2024,
            "season": "Rabi",
            "crop": "Sugarcane",
            "growth_stage": "Grand Growth",
            "gate_id": "Gate-5",
            "reach": "Tail",
            "delivery_date": "2024-11-12",
            "duration_hours": 7.5,
            "requested_qty_m3": 25.0,
            "requested_qty_litres": 25000.0,
            "allocated_qty_m3": 20.0,
            "allocated_qty_litres": 20000.0,
            "received_qty_m3": 18.0,
            "received_qty_litres": 18000.0,
            "shortage_m3": 7.0,
            "status": "Completed",
            "officer_remarks": "Tail-reach pressure deficit noted; Patwari monitored turn."
        },
        {
            "id": "HIST-MH081-03",
            "farmer_id": "FARMER-MH-081",
            "farmer_name": "Ramesh Patil",
            "year": 2025,
            "season": "Kharif",
            "crop": "Sugarcane",
            "growth_stage": "Tillering",
            "gate_id": "Gate-5",
            "reach": "Tail",
            "delivery_date": "2025-07-20",
            "duration_hours": 8.0,
            "requested_qty_m3": 24.0,
            "requested_qty_litres": 24000.0,
            "allocated_qty_m3": 22.0,
            "allocated_qty_litres": 22000.0,
            "received_qty_m3": 20.0,
            "received_qty_litres": 20000.0,
            "shortage_m3": 4.0,
            "status": "Completed",
            "officer_remarks": "Adequate upstream discharge; 91% fulfillment."
        },
        {
            "id": "HIST-MH081-04",
            "farmer_id": "FARMER-MH-081",
            "farmer_name": "Ramesh Patil",
            "year": 2025,
            "season": "Rabi",
            "crop": "Sugarcane",
            "growth_stage": "Grand Growth",
            "gate_id": "Gate-5",
            "reach": "Tail",
            "delivery_date": "2025-11-18",
            "duration_hours": 8.0,
            "requested_qty_m3": 26.0,
            "requested_qty_litres": 26000.0,
            "allocated_qty_m3": 22.0,
            "allocated_qty_litres": 22000.0,
            "received_qty_m3": 20.0,
            "received_qty_litres": 20000.0,
            "shortage_m3": 6.0,
            "status": "Completed",
            "officer_remarks": "Rabi turn successfully delivered via Gate 5."
        },
        {
            "id": "HIST-MH081-05",
            "farmer_id": "FARMER-MH-081",
            "farmer_name": "Ramesh Patil",
            "year": 2026,
            "season": "Kharif",
            "crop": "Sugarcane",
            "growth_stage": "Tillering",
            "gate_id": "Gate-5",
            "reach": "Tail",
            "delivery_date": "2026-07-22",
            "duration_hours": 7.5,
            "requested_qty_m3": 24.0,
            "requested_qty_litres": 24000.0,
            "allocated_qty_m3": 21.0,
            "allocated_qty_litres": 21000.0,
            "received_qty_m3": 19.5,
            "received_qty_litres": 19500.0,
            "shortage_m3": 4.5,
            "status": "Completed",
            "officer_remarks": "Kharif turn fulfilled under normal rotation."
        },
        {
            "id": "HIST-MH014-01",
            "farmer_id": "FARMER-MH-014",
            "farmer_name": "Suresh Shinde",
            "year": 2024,
            "season": "Kharif",
            "crop": "Cotton",
            "growth_stage": "Flowering/Boll",
            "gate_id": "Gate-1",
            "reach": "Head",
            "delivery_date": "2024-07-16",
            "duration_hours": 10.0,
            "requested_qty_m3": 28.0,
            "requested_qty_litres": 28000.0,
            "allocated_qty_m3": 28.0,
            "allocated_qty_litres": 28000.0,
            "received_qty_m3": 28.0,
            "received_qty_litres": 28000.0,
            "shortage_m3": 0.0,
            "status": "Completed",
            "officer_remarks": "Head-reach full release completed."
        },
        {
            "id": "HIST-MH014-02",
            "farmer_id": "FARMER-MH-014",
            "farmer_name": "Suresh Shinde",
            "year": 2025,
            "season": "Kharif",
            "crop": "Cotton",
            "growth_stage": "Flowering/Boll",
            "gate_id": "Gate-1",
            "reach": "Head",
            "delivery_date": "2025-07-21",
            "duration_hours": 9.5,
            "requested_qty_m3": 30.0,
            "requested_qty_litres": 30000.0,
            "allocated_qty_m3": 29.0,
            "allocated_qty_litres": 29000.0,
            "received_qty_m3": 28.5,
            "received_qty_litres": 28500.0,
            "shortage_m3": 1.5,
            "status": "Completed",
            "officer_remarks": "Normal head-reach rotation delivery."
        },
        {
            "id": "HIST-MH014-03",
            "farmer_id": "FARMER-MH-014",
            "farmer_name": "Suresh Shinde",
            "year": 2026,
            "season": "Kharif",
            "crop": "Cotton",
            "growth_stage": "Flowering/Boll",
            "gate_id": "Gate-1",
            "reach": "Head",
            "delivery_date": "2026-07-26",
            "duration_hours": 10.0,
            "requested_qty_m3": 30.0,
            "requested_qty_litres": 30000.0,
            "allocated_qty_m3": 29.5,
            "allocated_qty_litres": 29500.0,
            "received_qty_m3": 29.0,
            "received_qty_litres": 29000.0,
            "shortage_m3": 1.0,
            "status": "Completed",
            "officer_remarks": "High canal head discharge verified."
        },
        {
            "id": "HIST-MH032-01",
            "farmer_id": "FARMER-MH-032",
            "farmer_name": "Sunita Gaikwad",
            "year": 2024,
            "season": "Rabi",
            "crop": "Onion",
            "growth_stage": "Bulb Formation",
            "gate_id": "Gate-3",
            "reach": "Middle",
            "delivery_date": "2024-11-10",
            "duration_hours": 6.0,
            "requested_qty_m3": 14.0,
            "requested_qty_litres": 14000.0,
            "allocated_qty_m3": 14.0,
            "allocated_qty_litres": 14000.0,
            "received_qty_m3": 13.5,
            "received_qty_litres": 13500.0,
            "shortage_m3": 0.5,
            "status": "Completed",
            "officer_remarks": "Drip system supply delivered."
        },
        {
            "id": "HIST-MH032-02",
            "farmer_id": "FARMER-MH-032",
            "farmer_name": "Sunita Gaikwad",
            "year": 2025,
            "season": "Rabi",
            "crop": "Onion",
            "growth_stage": "Bulb Formation",
            "gate_id": "Gate-3",
            "reach": "Middle",
            "delivery_date": "2025-11-15",
            "duration_hours": 6.0,
            "requested_qty_m3": 15.0,
            "requested_qty_litres": 15000.0,
            "allocated_qty_m3": 14.5,
            "allocated_qty_litres": 14500.0,
            "received_qty_m3": 14.0,
            "received_qty_litres": 14000.0,
            "shortage_m3": 1.0,
            "status": "Completed",
            "officer_remarks": "Full drip pressure preserved."
        },
        {
            "id": "HIST-MH055-01",
            "farmer_id": "FARMER-MH-055",
            "farmer_name": "Vilas More",
            "year": 2024,
            "season": "Kharif",
            "crop": "Soybean",
            "growth_stage": "Pod Formation",
            "gate_id": "Gate-4",
            "reach": "Middle",
            "delivery_date": "2024-07-18",
            "duration_hours": 6.0,
            "requested_qty_m3": 16.0,
            "requested_qty_litres": 16000.0,
            "allocated_qty_m3": 15.0,
            "allocated_qty_litres": 15000.0,
            "received_qty_m3": 14.0,
            "received_qty_litres": 14000.0,
            "shortage_m3": 2.0,
            "status": "Completed",
            "officer_remarks": "Sprinkler cycle completed."
        },
        {
            "id": "HIST-MH055-02",
            "farmer_id": "FARMER-MH-055",
            "farmer_name": "Vilas More",
            "year": 2025,
            "season": "Kharif",
            "crop": "Soybean",
            "growth_stage": "Pod Formation",
            "gate_id": "Gate-4",
            "reach": "Middle",
            "delivery_date": "2025-07-22",
            "duration_hours": 6.0,
            "requested_qty_m3": 18.0,
            "requested_qty_litres": 18000.0,
            "allocated_qty_m3": 16.0,
            "allocated_qty_litres": 16000.0,
            "received_qty_m3": 15.0,
            "received_qty_litres": 15000.0,
            "shortage_m3": 3.0,
            "status": "Completed",
            "officer_remarks": "Sprinkler pressure sustained."
        }
    ],
    "water_deliveries": [
        {
            "delivery_id": "DEL-2026-001",
            "request_id": "REQ-2026-003",
            "farmer_id": "FARMER-MH-032",
            "farmer_name": "Sunita Gaikwad",
            "gate_id": "Gate-3",
            "reach": "Middle",
            "delivery_date": "2026-10-26",
            "duration_hours": 6.0,
            "delivered_qty_m3": 14.0,
            "delivered_qty_litres": 14000.0,
            "flow_verified_cusecs": 20.0,
            "gatekeeper_id": "GK-PIMP-03",
            "status": "Delivered",
            "notes": "Emergency bulb stage turn delivered in full."
        }
    ]
}

# Working in-memory state
app_state = json.loads(json.dumps(DEFAULT_SYSTEM_STATE))

def sync_from_database():
    """Restores database records into app_state so data persists across restarts."""
    try:
        db_farmers = db.db_get_all_farmers()
        if db_farmers:
            app_state["farmers"] = db_farmers
        db_requests = db.db_get_water_requests()
        if db_requests:
            app_state["requests"] = db_requests
        db_hist = db.db_get_water_history()
        if db_hist:
            app_state["water_history"] = db_hist
        db_complaints = db.db_get_grievances()
        if db_complaints:
            app_state["complaints"] = db_complaints
        db_disputes = db.db_get_disputes()
        if db_disputes:
            app_state["disputes"] = db_disputes
    except Exception as e:
        print(f"Notice: Database sync initialization: {e}")

sync_from_database()

class JalMitraRequestHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript; charset=utf-8",
        ".mjs": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".html": "text/html; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".ico": "image/x-icon"
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def _send_json(self, data: Any, status: int = 200):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_csv(self, filename: str, csv_content: str):
        body = csv_content.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed.query)

        # Health API
        if parsed.path == "/api/health":
            self._send_json({
                "status": "healthy",
                "service": "JalMitra AI Irrigation Decision Support & Dispute Mediation Platform",
                "version": "2.0.0",
                "principle": "AI recommends. Humans govern.",
                "demo_mode": True
            })
            return

        # Complete unified state
        if parsed.path == "/api/data":
            self._send_json({
                "state": app_state,
                "audit_summary": {
                    "total_events": len(audit_chain.chain),
                    "last_hash": audit_chain.chain[-1]["current_hash"] if audit_chain.chain else None
                }
            })
            return

        # Audit chain
        if parsed.path == "/api/audit":
            self._send_json({
                "chain": audit_chain.chain,
                "total_events": len(audit_chain.chain)
            })
            return

        # Disputes list
        if parsed.path == "/api/disputes":
            self._send_json({"disputes": app_state["disputes"]})
            return

        # Schedules list
        if parsed.path == "/api/schedules":
            conflicts = detect_schedule_conflicts(app_state["schedules"])
            self._send_json({
                "schedules": app_state["schedules"],
                "conflicts": conflicts
            })
            return

        # Rules Config
        if parsed.path == "/api/rules":
            self._send_json({"rules_config": app_state["rules_config"]})
            return

        # CSV Export
        if parsed.path == "/api/export/csv":
            report_type = query.get("type", ["allocations"])[0]
            output = io.StringIO()
            
            if report_type == "allocations":
                writer = csv.writer(output)
                writer.writerow(["Request_ID", "Farmer_Name", "Gate_ID", "Crop", "Growth_Stage", "Requested_Tm3", "Proposed_Tm3", "Approved_Tm3", "Status", "Date"])
                for r in app_state["requests"]:
                    writer.writerow([r["id"], r["farmer_name"], r["gate_id"], r["crop"], r["growth_stage"], r["requested_quantity"], r.get("proposed_quantity"), r.get("approved_quantity"), r["status"], r["date"]])
                self._send_csv("jalmitra_allocations_report.csv", output.getvalue())
                return
            elif report_type == "grievances":
                writer = csv.writer(output)
                writer.writerow(["Complaint_ID", "Farmer_Name", "Gate_ID", "Category", "Urgency", "Shortfall_Tm3", "Status", "Assigned_Officer", "Date"])
                for c in app_state["complaints"]:
                    writer.writerow([c["id"], c["farmer_name"], c["gate_id"], c["category"], c["urgency"], c.get("shortfall_quantity"), c["status"], c.get("assigned_officer"), c["date"]])
                self._send_csv("jalmitra_grievances_report.csv", output.getvalue())
                return
            elif report_type == "audit":
                writer = csv.writer(output)
                writer.writerow(["Event_ID", "Timestamp", "Actor", "Role", "Action", "Record_ID", "Details", "Current_Hash"])
                for e in audit_chain.chain:
                    writer.writerow([e["event_id"], e["timestamp"], e["actor"], e["role"], e["action"], e["record_id"], e["details"], e["current_hash"]])
                self._send_csv("jalmitra_audit_hash_chain.csv", output.getvalue())
                return

        # Notifications query
        if parsed.path == "/api/notifications":
            uid = query.get("user_id", [None])[0]
            notifs = []
            if uid:
                notifs = db.db_get_notifications(uid)
                if not notifs:
                    notifs = [n for n in app_state.get("notifications", []) if n.get("target") == uid or n.get("user_id") == uid]
            else:
                notifs = app_state.get("notifications", [])
            self._send_json({"success": True, "notifications": notifs, "unread_count": len([n for n in notifs if not n.get("is_read") and not n.get("read")])})
            return

        # Command Center statistics
        if parsed.path == "/api/command-center":
            stats = db.db_get_command_center_stats()
            self._send_json({"success": True, "stats": stats, "metrics": stats})
            return

        # Farmers Water History
        if parsed.path.startswith("/api/farmers/") and parsed.path.endswith("/history"):
            parts = parsed.path.strip("/").split("/")
            if len(parts) >= 4:
                farmer_id = parts[2]
                history = db.db_get_water_history(farmer_id=farmer_id)
                if not history:
                    # Check in-memory as fallback
                    history = [h for h in app_state.get("water_history", []) if h.get("farmer_id") == farmer_id]
                f_reqs = [r for r in app_state.get("requests", []) if r.get("farmer_id") == farmer_id]
                active_req = f_reqs[0] if f_reqs else {"farmer_id": farmer_id, "crop": "Sugarcane", "farm_area_acres": 4.0, "growth_stage": "Grand Growth", "requested_quantity": 25.0}
                analysis = analyze_demand_vs_history(active_req, history, float(app_state["reservoir"]["allocatable_supply"]))
                self._send_json({"farmer_id": farmer_id, "history": history, "analysis": analysis, "total_records": len(history)})
                return

        # Complete Water History query
        if parsed.path == "/api/water-history":
            fid = query.get("farmer_id", [None])[0]
            year = query.get("year", [None])[0]
            season = query.get("season", [None])[0]
            crop = query.get("crop", [None])[0]
            history = db.db_get_water_history(farmer_id=fid, year=int(year) if year and year.isdigit() else None, season=season, crop=crop)
            if not history and not fid:
                history = list(app_state.get("water_history", []))
            self._send_json({"water_history": history, "total": len(history)})
            return

        # Deliveries list
        if parsed.path == "/api/deliveries":
            self._send_json({"deliveries": app_state.get("water_deliveries", []), "total": len(app_state.get("water_deliveries", []))})
            return

        # Users public list (safe, without passwords)
        if parsed.path == "/api/users":
            safe_users = [{k: v for k, v in u.items() if k != "password"} for u in app_state.get("users", [])]
            self._send_json({"users": safe_users})
            return

        # Fallback to static files
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        try:
            body = json.loads(raw_body)
        except Exception:
            body = {}

        # Auth: Login
        if parsed.path == "/api/auth/login":
            identifier = str(body.get("identifier", body.get("username", body.get("mobile", "")))).strip()
            password = str(body.get("password", "")).strip()
            role = body.get("role")
            
            # Primary authentication against SQLite persistent database
            matched_user = db.db_verify_user(identifier, password, required_role=role)
            
            # Fallback to in-memory users for legacy demo credentials
            if not matched_user:
                for u in app_state.get("users", []):
                    matches_id = (
                        identifier == u.get("id") or
                        identifier == u.get("mobile") or
                        identifier == u.get("username") or
                        identifier == u.get("email")
                    )
                    if matches_id:
                        if role and u.get("role") != role:
                            continue
                        if u.get("password") == password or password in ["demo123", "kisan123", "admin123"]:
                            matched_user = {k: v for k, v in u.items() if k != "password"}
                            break

            if matched_user:
                token = f"jm_{matched_user['id']}_{int(time.time())}"
                db.db_add_audit_event(
                    actor=matched_user["name"],
                    role=matched_user["role"].capitalize(),
                    action="AUTH_LOGIN_SUCCESS",
                    record_id=matched_user["id"],
                    details=f"User signed in successfully to {matched_user['role']} portal."
                )
                audit_chain.add_event(
                    actor=matched_user["name"],
                    role=matched_user["role"].capitalize(),
                    action="AUTH_LOGIN_SUCCESS",
                    record_id=matched_user["id"],
                    details=f"User signed in successfully to {matched_user['role']} portal."
                )
                self._send_json({
                    "success": True,
                    "user": matched_user,
                    "token": token,
                    "message": f"Welcome back, {matched_user['name']}!"
                })
            else:
                self._send_json({
                    "success": False,
                    "error": "Invalid login credentials. For demo, use 'kisan123' for farmers or 'admin123' for officers."
                }, status=401)
            return

        # Auth: Register New Farmer
        if parsed.path == "/api/auth/register":
            name = body.get("name", "").strip()
            mobile = str(body.get("mobile", "")).strip()
            village = body.get("village", "Niphad").strip()
            district = body.get("district", "Nashik").strip()
            farm_area = float(body.get("farm_area_acres", 3.0))
            crop = body.get("crop", "Sugarcane")
            season = body.get("season", "Rabi")
            gate_id = body.get("gate_id", "Gate-5")
            gat_no = body.get("gat_no", "100/1")
            password = body.get("password", "kisan123")
            
            if not name or not mobile:
                self._send_json({"success": False, "error": "Farmer Name and 10-digit Mobile number are required."}, status=400)
                return

            # Register in SQLite database
            db_success, db_res = db.db_register_farmer(body)
            if not db_success:
                self._send_json({"success": False, "error": db_res.get("error", "Registration error.")}, status=400)
                return

            new_user = db_res["user"]
            new_farmer = db_res["farmer"]
            new_fid = db_res["farmer_id"]

            # Synchronize to in-memory app_state
            app_state["water_history"] = [h for h in app_state.get("water_history", []) if h.get("farmer_id") != new_fid]
            app_state["requests"] = [r for r in app_state.get("requests", []) if r.get("farmer_id") != new_fid]
            app_state["users"] = [u for u in app_state.get("users", []) if u.get("id") != new_fid and u.get("mobile") != mobile]
            app_state["farmers"] = [f for f in app_state.get("farmers", []) if f.get("id") != new_fid and f.get("mobile") != mobile]
            app_state["users"].append({**new_user, "password": password, "gat_no": gat_no, "farm_area_acres": farm_area, "crop": crop, "season": season, "gate_id": gate_id, "reach": new_farmer["reach"]})
            app_state["farmers"].append(new_farmer)
            
            audit_chain.add_event(
                actor=name,
                role="Farmer",
                action="FARMER_REGISTRATION",
                record_id=new_fid,
                details=f"Registered farmer {name} in {village} ({farm_area} acres, Gat No. {gat_no}, {gate_id})."
            )
            
            self._send_json({
                "success": True,
                "user": new_user,
                "farmer": new_farmer,
                "farmer_id": new_fid,
                "token": f"jm_{new_fid}_{int(time.time())}",
                "message": f"Farmer {name} registered successfully with unique ID {new_fid}."
            })
            return

        # Auth: Logout
        if parsed.path == "/api/auth/logout":
            self._send_json({"success": True, "message": "Logged out successfully."})
            return

        # Demand Analysis API
        if parsed.path == "/api/demand-analysis":
            req_data = body.get("request", {})
            f_history = [h for h in app_state.get("water_history", []) if h.get("farmer_id") == req_data.get("farmer_id")]
            if not f_history:
                f_history = app_state.get("water_history", [])
            supply = float(body.get("zone_supply_m3", app_state["reservoir"]["allocatable_supply"]))
            analysis = analyze_demand_vs_history(req_data, f_history, supply)
            self._send_json({"success": True, "analysis": analysis})
            return

        # Officer Review Action (6 actions: approve, partial, request_info, reject, refer_mediation, mark_delivered)
        if parsed.path == "/api/requests/action":
            req_id = body.get("request_id")
            action = body.get("action", "approve").lower()
            officer_name = body.get("officer_name", "Er. S. Deshmukh")
            remarks = body.get("remarks", "")
            
            matched_req = None
            for r in app_state["requests"]:
                if r["id"] == req_id:
                    matched_req = r
                    break
                    
            if not matched_req:
                self._send_json({"success": False, "error": f"Request {req_id} not found."}, status=404)
                return

            status_map = {
                "approve": "Approved",
                "partial": "Partially Approved",
                "request_info": "More Info Requested",
                "reject": "Rejected",
                "refer_mediation": "Referred to Mediation",
                "mark_delivered": "Completed / Delivered"
            }
            new_status = status_map.get(action, "Reviewed")
            matched_req["status"] = new_status
            matched_req["officer_comment"] = remarks
            
            if action == "approve":
                matched_req["approved_quantity"] = float(body.get("approved_quantity", matched_req["requested_quantity"]))
                matched_req["scheduled_date"] = body.get("schedule_date", "2026-10-31")
                matched_req["scheduled_window"] = body.get("schedule_window", "06:00 - 14:00")
            elif action == "partial":
                matched_req["approved_quantity"] = float(body.get("approved_quantity", matched_req["requested_quantity"] * 0.75))
                matched_req["scheduled_date"] = body.get("schedule_date", "2026-10-31")
                matched_req["scheduled_window"] = body.get("schedule_window", "06:00 - 12:00")
            elif action == "reject":
                matched_req["approved_quantity"] = 0.0
                matched_req["rejection_reason"] = remarks or "Does not meet canal operational threshold."
            elif action == "refer_mediation":
                disp_id = f"DISP-2026-{len(app_state['disputes']) + 1:03d}"
                matched_req["mediation_id"] = disp_id
                disp_obj = {
                    "id": disp_id,
                    "title": f"Mediation Case: {matched_req['crop']} Allocation Conflict ({matched_req['gate_id']})",
                    "category": "Unequal Water Distribution",
                    "severity": "High",
                    "farmer_a_id": "FARMER-MH-014",
                    "farmer_a_name": "Suresh Shinde",
                    "farmer_a_gate": "Gate-1",
                    "farmer_a_crop": "Cotton",
                    "farmer_a_requested": 30.0,
                    "farmer_a_claim": "Head reach standard cycle requirement.",
                    "farmer_a_status": "Reviewing Proposals",
                    "farmer_b_id": matched_req["farmer_id"],
                    "farmer_b_name": matched_req["farmer_name"],
                    "farmer_b_gate": matched_req["gate_id"],
                    "farmer_b_crop": matched_req["crop"],
                    "farmer_b_requested": matched_req["requested_quantity"],
                    "farmer_b_claim": f"Requested turn for {matched_req['crop']} under review. Officer mediation initiated.",
                    "farmer_b_status": "Awaiting Consensus",
                    "status": "Mediation in Progress",
                    "assigned_officer": officer_name,
                    "created_date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "evidence": [{"type": "Officer Referral", "summary": remarks or "Escalated for compromise formulation."}],
                    "proposals": generate_mediation_proposals({
                        "farmer_a_name": "Suresh Shinde",
                        "farmer_a_requested": 30.0,
                        "farmer_b_name": matched_req["farmer_name"],
                        "farmer_b_requested": matched_req["requested_quantity"]
                    }, allocatable_supply=float(app_state["reservoir"]["allocatable_supply"])),
                    "selected_proposal": "PROP-B",
                    "ratification_status": "Mediation Active"
                }
                app_state["disputes"].insert(0, disp_obj)
            elif action == "mark_delivered":
                deliv_id = f"DEL-2026-{len(app_state.get('water_deliveries', [])) + 1:03d}"
                deliv_qty_m3 = float(body.get("delivered_quantity_m3", matched_req.get("approved_quantity", matched_req["requested_quantity"])))
                deliv_qty_litres = deliv_qty_m3 * 1000.0
                deliv_date = body.get("delivery_date", time.strftime("%Y-%m-%d", time.gmtime()))
                duration = float(body.get("duration_hours", matched_req.get("duration_hours", 8.0)))
                gatekeeper = body.get("gatekeeper_id", "GK-GLBC-01")
                
                # Persist delivery into SQLite database
                db.db_record_delivery(
                    request_id=req_id,
                    farmer_id=matched_req["farmer_id"],
                    delivered_qty_m3=deliv_qty_m3,
                    delivery_date=deliv_date,
                    duration_hours=duration,
                    recorded_by=officer_name,
                    remarks=remarks or "Turn confirmed delivered by field gatekeeper."
                )

                deliv_record = {
                    "delivery_id": deliv_id,
                    "request_id": req_id,
                    "farmer_id": matched_req["farmer_id"],
                    "farmer_name": matched_req["farmer_name"],
                    "gate_id": matched_req["gate_id"],
                    "reach": "Tail" if matched_req["gate_id"] in ["Gate-5", "Gate-6"] else ("Middle" if matched_req["gate_id"] in ["Gate-3", "Gate-4"] else "Head"),
                    "delivery_date": deliv_date,
                    "duration_hours": duration,
                    "delivered_qty_m3": deliv_qty_m3,
                    "delivered_qty_litres": deliv_qty_litres,
                    "flow_verified_cusecs": float(body.get("flow_verified_cusecs", 18.0)),
                    "gatekeeper_id": gatekeeper,
                    "status": "Delivered",
                    "notes": remarks or "Turn confirmed delivered by field gatekeeper."
                }
                if "water_deliveries" not in app_state: app_state["water_deliveries"] = []
                app_state["water_deliveries"].insert(0, deliv_record)
                
                hist_id = f"HIST-{matched_req['farmer_id'][-5:]}-{len(app_state.get('water_history', [])) + 1:02d}"
                hist_record = {
                    "id": hist_id,
                    "farmer_id": matched_req["farmer_id"],
                    "farmer_name": matched_req["farmer_name"],
                    "year": 2026,
                    "season": "Rabi",
                    "crop": matched_req["crop"],
                    "growth_stage": matched_req["growth_stage"],
                    "gate_id": matched_req["gate_id"],
                    "reach": deliv_record["reach"],
                    "delivery_date": deliv_date,
                    "duration_hours": duration,
                    "requested_qty_m3": matched_req["requested_quantity"],
                    "requested_qty_litres": matched_req["requested_quantity"] * 1000.0,
                    "allocated_qty_m3": matched_req.get("approved_quantity", deliv_qty_m3),
                    "allocated_qty_litres": (matched_req.get("approved_quantity", deliv_qty_m3)) * 1000.0,
                    "received_qty_m3": deliv_qty_m3,
                    "received_qty_litres": deliv_qty_litres,
                    "shortage_m3": round(max(0.0, matched_req["requested_quantity"] - deliv_qty_m3), 2),
                    "status": "Completed",
                    "officer_remarks": remarks or "Verified delivery completed.",
                    "gatekeeper_id": gatekeeper
                }
                if "water_history" not in app_state: app_state["water_history"] = []
                app_state["water_history"].insert(0, hist_record)
                matched_req["received_quantity"] = deliv_qty_m3

            # Also update SQLite for non-delivery actions
            if action != "mark_delivered":
                db.db_action_water_request(
                    request_id=req_id,
                    action=action,
                    officer_name=officer_name,
                    remarks=remarks or "",
                    approved_qty=matched_req.get("approved_quantity"),
                    schedule_date=matched_req.get("scheduled_date"),
                    schedule_window=matched_req.get("scheduled_window")
                )

            audit_chain.add_event(
                actor=officer_name,
                role="Officer",
                action=f"REQUEST_ACTION_{action.upper()}",
                record_id=req_id,
                details=f"Officer executed {action.upper()} on {req_id} -> {new_status}. Note: {remarks}"
            )
            
            app_state["notifications"].insert(0, {
                "id": f"NOTIF-{len(app_state['notifications']) + 1:02d}",
                "target": matched_req["farmer_id"],
                "title": f"Update on Water Request {req_id}: {new_status}",
                "message": f"Authority {officer_name}: {new_status}. {remarks}",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "type": "decision",
                "read": False
            })

            self._send_json({
                "success": True,
                "action": action,
                "status": new_status,
                "request": matched_req
            })
            return

        # 1. Submit Water Request
        if parsed.path == "/api/requests":
            farmer_id = body.get("farmer_id", "FARMER-MH-081")
            farmer_name = body.get("farmer_name", "Ramesh Patil")
            gate_id = body.get("gate_id", "Gate-5")
            crop = body.get("crop", "Sugarcane")
            growth_stage = body.get("growth_stage", "Grand Growth")
            requested_qty = float(body.get("requested_quantity", 20.0))
            urgency = body.get("urgency", "High")
            area = float(body.get("farm_area_acres", 4.0))

            # Persist request to SQLite database first, guaranteeing unique ID
            db_success, db_res = db.db_create_water_request({
                "farmer_id": farmer_id,
                "farmer_name": farmer_name,
                "gate_id": gate_id,
                "crop": crop,
                "growth_stage": growth_stage,
                "farm_area_acres": area,
                "requested_quantity": requested_qty,
                "urgency": urgency,
                "reason": body.get("reason", "Supplemental irrigation request.")
            })
            req_id = db_res["request_id"] if (db_success and "request_id" in db_res) else f"REQ-2026-{len(app_state['requests']) + 101:03d}"
            
            # Calculate demand estimate
            est = calculate_crop_water_estimate(crop=crop, area_acres=area, growth_stage=growth_stage)
            
            req_obj = {
                "id": req_id,
                "farmer_id": farmer_id,
                "farmer_name": farmer_name,
                "gate_id": gate_id,
                "crop": crop,
                "growth_stage": growth_stage,
                "farm_area_acres": area,
                "requested_quantity": requested_qty,
                "urgency": urgency,
                "reason": body.get("reason", "Supplemental irrigation request."),
                "status": "Submitted",
                "date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "proposed_quantity": round(min(requested_qty, est["estimated_volume_thousand_m3"] * 0.9), 2),
                "approved_quantity": None,
                "officer_comment": "Automated intake verified. Queued for Officer sign-off.",
                "crop_estimate": est
            }
            
            rules = verify_eight_rules(req_obj, app_state["reservoir"], app_state["rules_config"])
            thirteen_points = verify_thirteen_points(req_obj, app_state["reservoir"])
            
            app_state["requests"].insert(0, req_obj)
            
            audit_chain.add_event(
                actor=farmer_name,
                role="Farmer",
                action="SUBMIT_REQUEST",
                record_id=req_id,
                details=f"Requested {requested_qty} T-m3 for {crop} ({growth_stage}) at {gate_id}."
            )
            
            app_state["notifications"].insert(0, {
                "id": f"NOTIF-{len(app_state['notifications']) + 1:02d}",
                "target": farmer_id,
                "title": f"Water Request {req_id} Submitted",
                "message": f"Your request for {requested_qty} T-m3 has been registered and verified under 8-Rule Matrix.",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "type": "request",
                "read": False
            })

            self._send_json({
                "success": True,
                "request": req_obj,
                "eight_rules": rules,
                "thirteen_points": thirteen_points
            })
            return

        # 2. Officer Approval / Rejection
        if parsed.path == "/api/approve":
            req_id = body.get("request_id")
            decision = body.get("decision", "Approved") # Approved, Rejected, Adjusted
            qty = float(body.get("approved_quantity", 0.0))
            officer_name = body.get("officer_name", "Er. S. Deshmukh")
            comment = body.get("comment", "Officer review completed and authorized.")

            matched = None
            for r in app_state["requests"]:
                if r["id"] == req_id:
                    r["status"] = decision
                    r["approved_quantity"] = qty if decision == "Approved" else 0.0
                    r["officer_comment"] = comment
                    matched = r
                    break
            
            if matched:
                audit_chain.add_event(
                    actor=officer_name,
                    role="Officer",
                    action=f"DECISION_{decision.upper()}",
                    record_id=req_id,
                    details=f"Officer {decision} {qty} T-m3. Note: {comment}"
                )
                app_state["notifications"].insert(0, {
                    "id": f"NOTIF-{len(app_state['notifications']) + 1:02d}",
                    "target": matched["farmer_id"],
                    "title": f"Decision on Request {req_id}: {decision}",
                    "message": f"Officer {officer_name} {decision} {qty} T-m3. Turn scheduled.",
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "type": "decision",
                    "read": False
                })
                self._send_json({"success": True, "request": matched})
            else:
                self._send_json({"success": False, "error": "Request ID not found"}, status=404)
            return

        # 3. Submit Grievance / Complaint
        if parsed.path == "/api/complaints":
            cmp_id = f"CMP-2026-{len(app_state['complaints']) + 1:03d}"
            farmer_id = body.get("farmer_id", "FARMER-MH-081")
            farmer_name = body.get("farmer_name", "Ramesh Patil")
            cmp_obj = {
                "id": cmp_id,
                "farmer_id": farmer_id,
                "farmer_name": farmer_name,
                "category": body.get("category", "Water Shortage"),
                "gate_id": body.get("gate_id", "Gate-5"),
                "urgency": body.get("urgency", "High"),
                "crop": body.get("crop", "Sugarcane"),
                "growth_stage": body.get("growth_stage", "Grand Growth"),
                "shortfall_quantity": float(body.get("shortfall_quantity", 5.0)),
                "date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "status": "Submitted",
                "assigned_officer": "Er. S. Deshmukh (EE)",
                "description": body.get("description", "Canal water shortfall reported."),
                "suspected_cause": "Under AI evaluation: Upstream diversion vs transit loss.",
                "evidence_type": "Voice Grievance Transcript" if body.get("voice_recorded") else "Web Grievance Form",
                "investigation_notes": "Queued for Sectional Officer field visit.",
                "sla_target_hours": 48,
                "elapsed_hours": 0,
                "is_overdue": False
            }
            app_state["complaints"].insert(0, cmp_obj)
            
            # Persist to SQLite database
            try:
                db.db_create_grievance({
                    "farmer_id": farmer_id,
                    "farmer_name": farmer_name,
                    "gate_id": body.get("gate_id", "Gate-5"),
                    "category": body.get("category", "Water Shortage"),
                    "urgency": body.get("urgency", "High"),
                    "description": body.get("description", "Canal water shortfall reported."),
                    "shortfall_quantity": float(body.get("shortfall_quantity", 5.0))
                })
            except Exception as ex:
                print(f"Notice: SQLite complaint persist: {ex}")
            
            audit_chain.add_event(
                actor=farmer_name,
                role="Farmer",
                action="SUBMIT_COMPLAINT",
                record_id=cmp_id,
                details=f"Grievance: {cmp_obj['category']} at {cmp_obj['gate_id']} ({cmp_obj['urgency']})."
            )

            self._send_json({"success": True, "complaint": cmp_obj})
            return

        # Direct Delivery Recording (Requirement 11 & 18)
        if parsed.path == "/api/deliveries":
            req_id = body.get("request_id", "REQ-2026-001")
            farmer_id = body.get("farmer_id", "FARMER-MH-081")
            qty = float(body.get("delivered_quantity_m3", body.get("delivered_qty_m3", 10.0)))
            del_date = body.get("delivery_date", time.strftime("%Y-%m-%d"))
            duration = float(body.get("duration_hours", 8.0))
            recorded_by = body.get("recorded_by", "Er. S. Deshmukh")
            remarks = body.get("remarks", "Direct field gate delivery verified.")
            
            success, res = db.db_record_delivery(req_id, farmer_id, qty, del_date, duration, recorded_by, remarks)
            sync_from_database()
            self._send_json(res)
            return

        # 4. Raise New Dispute
        if parsed.path == "/api/disputes":
            disp_id = f"DISP-2026-{len(app_state['disputes']) + 1:03d}"
            fA_id = body.get("farmer_a_id", "FARMER-MH-014")
            fA_name = body.get("farmer_a_name", "Suresh Shinde")
            fB_id = body.get("farmer_b_id", "FARMER-MH-081")
            fB_name = body.get("farmer_b_name", "Ramesh Patil")
            
            new_disp = {
                "id": disp_id,
                "title": body.get("title", f"Water Sharing Dispute ({body.get('category', 'Unequal Distribution')})"),
                "category": body.get("category", "Unequal Water Distribution"),
                "severity": body.get("urgency", "High"),
                "farmer_a_id": fA_id,
                "farmer_a_name": fA_name,
                "farmer_a_gate": body.get("farmer_a_gate", "Gate-1"),
                "farmer_a_crop": body.get("farmer_a_crop", "Cotton"),
                "farmer_a_requested": float(body.get("farmer_a_requested", 30.0)),
                "farmer_a_claim": body.get("farmer_a_claim", "Demanding allocated water according to head-reach rotation."),
                "farmer_a_status": "Awaiting Response",
                
                "farmer_b_id": fB_id,
                "farmer_b_name": fB_name,
                "farmer_b_gate": body.get("farmer_b_gate", "Gate-5"),
                "farmer_b_crop": body.get("farmer_b_crop", "Sugarcane"),
                "farmer_b_requested": float(body.get("farmer_b_requested", 25.0)),
                "farmer_b_claim": body.get("farmer_b_claim", "Tail-reach canal starvation causing crop wilting."),
                "farmer_b_status": "Complaint Initiator",
                
                "status": "Submitted",
                "assigned_officer": "Er. S. Deshmukh (EE)",
                "created_date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "evidence": [
                    {"type": "Farmer Complaint", "summary": body.get("farmer_b_claim", "Tail reach shortage")}
                ],
                "proposals": generate_mediation_proposals({
                    "farmer_a_name": fA_name,
                    "farmer_a_requested": float(body.get("farmer_a_requested", 30.0)),
                    "farmer_b_name": fB_name,
                    "farmer_b_requested": float(body.get("farmer_b_requested", 25.0))
                }, allocatable_supply=float(app_state["reservoir"]["allocatable_supply"])),
                "selected_proposal": None,
                "ratification_status": "Pending Mediation"
            }
            
            app_state["disputes"].insert(0, new_disp)
            
            audit_chain.add_event(
                actor=fB_name,
                role="Farmer",
                action="RAISE_DISPUTE",
                record_id=disp_id,
                details=f"Raised dispute against {fA_name} over {new_disp['category']}."
            )
            
            self._send_json({"success": True, "dispute": new_disp})
            return

        # 5. Accept / Reject Dispute Proposal
        if parsed.path == "/api/disputes/accept":
            disp_id = body.get("dispute_id")
            prop_id = body.get("proposal_id", "PROP-B")
            actor = body.get("actor", "Ramesh Patil")
            action = body.get("action", "Accepted") # Accepted, Rejected
            
            matched = None
            for d in app_state["disputes"]:
                if d["id"] == disp_id:
                    matched = d
                    d["selected_proposal"] = prop_id
                    if actor in [d.get("farmer_a_name"), "Suresh Shinde"]:
                        d["farmer_a_status"] = f"{action} {prop_id}"
                    else:
                        d["farmer_b_status"] = f"{action} {prop_id}"
                    
                    if "Accepted" in d.get("farmer_a_status", "") and "Accepted" in d.get("farmer_b_status", ""):
                        d["status"] = "Awaiting Official Approval"
                        d["ratification_status"] = "Consensus Reached - Pending EE Ratification"
                    else:
                        d["status"] = "Mediation in Progress"
                    break
                    
            if matched:
                audit_chain.add_event(
                    actor=actor,
                    role="Farmer",
                    action=f"DISPUTE_PROPOSAL_{action.upper()}",
                    record_id=disp_id,
                    details=f"{actor} {action.lower()} proposal {prop_id} for dispute {disp_id}."
                )
                self._send_json({"success": True, "dispute": matched})
            else:
                self._send_json({"success": False, "error": "Dispute not found"}, status=404)
            return

        # 6. Officer Ratify Dispute Accord
        if parsed.path == "/api/disputes/ratify":
            disp_id = body.get("dispute_id")
            prop_id = body.get("proposal_id", "PROP-B")
            officer = body.get("officer_name", "Er. S. Deshmukh")
            decision = body.get("decision", "Ratified")
            notes = body.get("notes", "Statutory compliance verified under 8-Rule Matrix. Accord ratified.")
            
            matched = None
            for d in app_state["disputes"]:
                if d["id"] == disp_id:
                    matched = d
                    d["status"] = "Resolved" if decision == "Ratified" else "Rejected"
                    d["ratification_status"] = f"{decision} by {officer}"
                    d["ratification_notes"] = notes
                    break
                    
            if matched:
                audit_chain.add_event(
                    actor=officer,
                    role="Officer",
                    action=f"RATIFY_MEDIATION_{decision.upper()}",
                    record_id=disp_id,
                    details=f"Officer {officer} {decision} proposal {prop_id} for {disp_id}. Notes: {notes}"
                )
                
                # Notify both farmers
                for target_id in [matched["farmer_a_id"], matched["farmer_b_id"]]:
                    app_state["notifications"].insert(0, {
                        "id": f"NOTIF-{len(app_state['notifications']) + 1:02d}",
                        "target": target_id,
                        "title": f"Mediation Accord Ratified: {disp_id}",
                        "message": f"Executive Engineer has ratified the settlement accord. Updated schedule published.",
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        "type": "decision",
                        "read": False
                    })
                    
                self._send_json({"success": True, "dispute": matched})
            else:
                self._send_json({"success": False, "error": "Dispute not found"}, status=404)
            return

        # 7. Update Farm Details (Module 4)
        if parsed.path == "/api/farms/update":
            farmer_id = body.get("farmer_id")
            for f in app_state["farmers"]:
                if f["id"] == farmer_id:
                    if "farm_area_acres" in body: f["farm_area_acres"] = float(body["farm_area_acres"])
                    if "crop" in body: f["crop"] = body["crop"]
                    if "growth_stage" in body: f["growth_stage"] = body["growth_stage"]
                    if "soil_type" in body: f["soil_type"] = body["soil_type"]
                    if "irrigation_method" in body: f["irrigation_method"] = body["irrigation_method"]
                    if "gate_id" in body: f["gate_id"] = body["gate_id"]
                    if "village" in body: f["village"] = body["village"]
                    if "gat_no" in body: f["gat_no"] = body["gat_no"]
                    
                    audit_chain.add_event(
                        actor=f["name"],
                        role="Farmer",
                        action="UPDATE_FARM_PROFILE",
                        record_id=farmer_id,
                        details=f"Updated farm parcel {f['gat_no']}: {f['crop']} ({f['growth_stage']}), {f['farm_area_acres']} acres, {f['irrigation_method']}."
                    )
                    self._send_json({"success": True, "farmer": f})
                    return
            self._send_json({"success": False, "error": "Farmer not found"}, status=404)
            return

        # 8. Update Rules Configuration (Module 9 & 17)
        if parsed.path == "/api/rules/update":
            new_cfg = body.get("rules_config", {})
            app_state["rules_config"].update(new_cfg)
            audit_chain.add_event(
                actor=body.get("officer_name", "Er. S. Deshmukh"),
                role="Officer",
                action="UPDATE_COMPLIANCE_RULES",
                record_id="RULES-CONFIG",
                details=f"Updated 8-rule compliance thresholds: {json.dumps(new_cfg)}"
            )
            self._send_json({"success": True, "rules_config": app_state["rules_config"]})
            return

        # 9. Update Schedule Slot (Module 12)
        if parsed.path == "/api/schedules/update":
            sch_id = body.get("schedule_id")
            for s in app_state["schedules"]:
                if s["id"] == sch_id:
                    if "date" in body: s["date"] = body["date"]
                    if "window" in body: s["window"] = body["window"]
                    if "flow_cusecs" in body: s["flow_cusecs"] = float(body["flow_cusecs"])
                    if "allocated_qty" in body: s["allocated_qty"] = float(body["allocated_qty"])
                    if "status" in body: s["status"] = body["status"]
                    
                    audit_chain.add_event(
                        actor=body.get("officer_name", "Er. S. Deshmukh"),
                        role="Officer",
                        action="UPDATE_SCHEDULE",
                        record_id=sch_id,
                        details=f"Modified rotation turn {sch_id} to {s['date']} ({s['window']}) at {s['flow_cusecs']} cusecs."
                    )
                    self._send_json({"success": True, "schedule": s})
                    return
            self._send_json({"success": False, "error": "Schedule not found"}, status=404)
            return

        # 10. Mediate (Side-by-side 3 strategies)
        if parsed.path == "/api/mediate":
            alloc_supply = float(body.get("allocatable_supply", app_state["reservoir"]["allocatable_supply"]))
            active_reqs = [r for r in app_state["requests"] if r["status"] in ["Submitted", "Under Review", "Proposed"]]
            if not active_reqs:
                active_reqs = app_state["requests"]

            opt1_prop = run_allocation_engine(alloc_supply, active_reqs, strategy="PROPORTIONAL")
            opt2_agron = run_allocation_engine(alloc_supply, active_reqs, strategy="AGRONOMIC")
            opt3_rot = run_allocation_engine(alloc_supply, active_reqs, strategy="ROTATIONAL")

            self._send_json({
                "options": {
                    "proportional": opt1_prop,
                    "agronomic": opt2_agron,
                    "rotational": opt3_rot
                }
            })
            return

        # 11. Audit Verify
        if parsed.path == "/api/audit/verify":
            is_valid, msg, results = audit_chain.verify_chain()
            self._send_json({
                "success": is_valid,
                "valid": is_valid,
                "message": msg,
                "total_blocks": len(audit_chain.chain),
                "blocks": results,
                "chain_verification": {
                    "is_valid": is_valid,
                    "status": "Tamper-Proof & Cryptographically Verified" if is_valid else "Chain Invalid",
                    "total_blocks": len(audit_chain.chain)
                }
            })
            return

        # 12. Simulate
        if parsed.path == "/api/simulate":
            inflow = float(body.get("inflow", app_state["reservoir"]["total_cycle_supply_thousand_m3"]))
            loss_pct = float(body.get("transit_loss_pct", 12.0))
            reserve_pct = float(body.get("emergency_reserve_pct", 15.0))
            strategy = body.get("strategy", "AGRONOMIC")

            balance = calculate_water_balance(inflow, loss_pct, reserve_pct)
            allocation_res = run_allocation_engine(balance["allocatable_supply"], app_state["requests"], strategy=strategy)

            self._send_json({
                "balance": balance,
                "allocation": allocation_res
            })
            return

        # 13. Reset
        if parsed.path == "/api/reset":
            app_state.clear()
            app_state.update(json.loads(json.dumps(DEFAULT_SYSTEM_STATE)))
            self._send_json({"success": True, "message": "Demo data restored to initial pristine state."})
            return

        self._send_json({"error": "Unknown API route"}, status=404)

class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def handle_error(self, request, client_address):
        exc_type, exc_val, _ = sys.exc_info()
        if exc_type in (ConnectionResetError, ConnectionAbortedError, BrokenPipeError):
            return
        super().handle_error(request, client_address)

def run_server(port=None):
    if port is None:
        if len(sys.argv) > 1 and sys.argv[1].isdigit():
            port = int(sys.argv[1])
        else:
            port = int(os.environ.get("PORT", PORT))

    server_address = ("", port)
    httpd = None
    try:
        httpd = ThreadingServer(server_address, JalMitraRequestHandler)
    except OSError as e:
        if getattr(e, "winerror", None) == 10048 or "10048" in str(e) or getattr(e, "errno", None) == 98:
            print(f"[NOTICE] Port {port} is occupied. Attempting alternative ports...")
            for alt_port in [8000, 8080, 8001, 8002, 8888]:
                try:
                    httpd = ThreadingServer(("", alt_port), JalMitraRequestHandler)
                    port = alt_port
                    break
                except OSError:
                    continue
            if not httpd:
                raise e
        else:
            raise e

    print(f"==================================================")
    print(f" JalMitra AI Server Running (Multi-Threaded)")
    print(f" URL: http://127.0.0.1:{port}")
    print(f" URL: http://localhost:{port}")
    print(f" Static Root: {STATIC_DIR}")
    print(f" Press Ctrl+C to stop.")
    print(f"==================================================")
    try:
        while True:
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nShutting down server.")
                break
            except Exception as e:
                time.sleep(0.5)
    finally:
        if httpd:
            httpd.server_close()

if __name__ == "__main__":
    run_server()
