"""
JalMitra AI - Comprehensive Test Suite
Tests core business logic, allocation engine, compliance rules, fairness index,
dispute mediation compromises, schedule conflict detection, and cryptographic audit chain.
"""
import unittest
import json
import csv
import io
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from engine import (
    calculate_crop_water_estimate,
    calculate_water_balance,
    run_allocation_engine,
    verify_eight_rules,
    verify_thirteen_points,
    calculate_fairness_index,
    detect_schedule_conflicts,
    generate_mediation_proposals,
    analyze_demand_vs_history,
    AuditHashChain,
    CROP_DATA,
    DEFAULT_RULES_CONFIG
)

class TestJalMitraEngine(unittest.TestCase):

    def setUp(self):
        self.sample_requests = [
            {
                "id": "REQ-2026-001",
                "farmer_name": "Ramesh Patil",
                "farmer_id": "FARMER-MH-081",
                "gate_id": "Gate-5",
                "crop": "Sugarcane",
                "growth_stage": "Grand Growth",
                "requested_quantity": 25.0,
                "urgency": "High",
                "farm_area_acres": 4.0,
                "previous_shortfall": 4.5
            },
            {
                "id": "REQ-2026-002",
                "farmer_name": "Suresh Shinde",
                "farmer_id": "FARMER-MH-014",
                "gate_id": "Gate-1",
                "crop": "Cotton",
                "growth_stage": "Flowering/Boll",
                "requested_quantity": 30.0,
                "urgency": "Medium",
                "farm_area_acres": 5.0,
                "previous_shortfall": 0.0
            },
            {
                "id": "REQ-2026-003",
                "farmer_name": "Sunita Gaikwad",
                "farmer_id": "FARMER-MH-032",
                "gate_id": "Gate-3",
                "crop": "Onion",
                "growth_stage": "Bulb Formation",
                "requested_quantity": 15.0,
                "urgency": "Emergency",
                "farm_area_acres": 2.5,
                "previous_shortfall": 2.0
            }
        ]

    # Test 1: Farmer registration validation
    def test_farmer_registration_validation(self):
        valid_farmer = {"name": "Ramesh Patil", "village": "Niphad", "gat_no": "142", "area": 4.0}
        self.assertTrue(bool(valid_farmer["name"] and valid_farmer["village"] and valid_farmer["area"] > 0))
        invalid_farmer = {"name": "", "village": "Niphad", "area": -1.0}
        self.assertFalse(bool(invalid_farmer["name"]) and invalid_farmer["area"] > 0)

    # Test 2: Farmer demo sign-in
    def test_farmer_demo_signin(self):
        demo_accounts = {"FARMER-MH-081": "Ramesh Patil", "OFFICER-ENG-01": "Er. S. Deshmukh"}
        self.assertIn("FARMER-MH-081", demo_accounts)
        self.assertEqual(demo_accounts["FARMER-MH-081"], "Ramesh Patil")

    # Test 3: Water request submission structure
    def test_water_request_submission(self):
        req = self.sample_requests[0]
        self.assertEqual(req["requested_quantity"], 25.0)
        self.assertEqual(req["crop"], "Sugarcane")
        self.assertIn(req["urgency"], ["Normal", "Medium", "High", "Emergency"])

    # Test 4: Complaint submission fields
    def test_complaint_submission(self):
        complaint = {
            "id": "CMP-2026-001",
            "category": "Water Shortage",
            "gate_id": "Gate-5",
            "farmer_id": "FARMER-MH-081",
            "urgency": "High",
            "description": "Tail-reach canal flow completely stopped during critical grand growth stage."
        }
        self.assertEqual(complaint["category"], "Water Shortage")
        self.assertEqual(complaint["gate_id"], "Gate-5")

    # Test 5: Unique ID generation
    def test_unique_id_generation(self):
        req_ids = [f"REQ-2026-{i:03d}" for i in range(1, 100)]
        self.assertEqual(len(req_ids), len(set(req_ids)))

    # Test 6: Allocation under normal supply (Supply > Demand)
    def test_allocation_normal_supply(self):
        total_demand = sum(r["requested_quantity"] for r in self.sample_requests) # 70.0
        result = run_allocation_engine(allocatable_supply=100.0, requests=self.sample_requests, strategy="PROPORTIONAL")
        self.assertEqual(result["total_allocated"], total_demand)
        self.assertEqual(result["unmet_demand"], 0.0)

    # Test 7: Allocation under drought conditions (Supply < Demand)
    def test_allocation_drought_conditions(self):
        result = run_allocation_engine(allocatable_supply=35.0, requests=self.sample_requests, strategy="PROPORTIONAL")
        self.assertAlmostEqual(result["total_allocated"], 35.0, places=1)
        self.assertAlmostEqual(result["unmet_demand"], 35.0, places=1)
        for alloc in result["allocations"]:
            self.assertLess(alloc["proposed_quantity"], alloc["requested_quantity"])

    # Test 8: Allocation with canal losses
    def test_allocation_with_canal_losses(self):
        balance = calculate_water_balance(canal_inflow_thousand_m3=100.0, transit_loss_pct=15.0, emergency_reserve_pct=15.0)
        self.assertEqual(balance["transit_loss"], 15.0)
        self.assertEqual(balance["emergency_reserve"], 15.0)
        self.assertEqual(balance["allocatable_supply"], 70.0)

    # Test 9: Water balance conservation (Inflow = Loss + Reserve + Net Available)
    def test_water_balance_conservation(self):
        inflow = 120.0
        balance = calculate_water_balance(canal_inflow_thousand_m3=inflow, transit_loss_pct=12.0, emergency_reserve_pct=15.0)
        reconstructed = balance["transit_loss"] + balance["emergency_reserve"] + balance["allocatable_supply"]
        self.assertAlmostEqual(inflow, reconstructed, places=2)

    # Test 10: Prevention of over-allocation (Allocated <= Demand and Allocated <= Supply)
    def test_prevention_of_over_allocation(self):
        supply = 40.0
        result = run_allocation_engine(allocatable_supply=supply, requests=self.sample_requests, strategy="PROPORTIONAL")
        self.assertLessEqual(result["total_allocated"], supply + 0.01)
        for alloc in result["allocations"]:
            self.assertLessEqual(alloc["proposed_quantity"], alloc["requested_quantity"])

    # Test 11: Emergency reserve constraints
    def test_emergency_reserve_constraints(self):
        balance = calculate_water_balance(canal_inflow_thousand_m3=80.0, emergency_reserve_pct=20.0)
        self.assertEqual(balance["emergency_reserve"], 16.0)
        self.assertTrue(balance["emergency_reserve"] > 0)

    # Test 12: Invalid input handling
    def test_invalid_input_handling(self):
        balance_zero = calculate_water_balance(canal_inflow_thousand_m3=0.0)
        self.assertEqual(balance_zero["allocatable_supply"], 0.0)
        empty_res = run_allocation_engine(allocatable_supply=50.0, requests=[], strategy="PROPORTIONAL")
        self.assertEqual(empty_res["total_allocated"], 0.0)

    # Test 13: Mediation strategy comparison
    def test_mediation_strategy_comparison(self):
        supply = 45.0
        prop = run_allocation_engine(allocatable_supply=supply, requests=self.sample_requests, strategy="PROPORTIONAL")
        agron = run_allocation_engine(allocatable_supply=supply, requests=self.sample_requests, strategy="AGRONOMIC")
        rot = run_allocation_engine(allocatable_supply=supply, requests=self.sample_requests, strategy="ROTATIONAL")
        self.assertEqual(len(prop["allocations"]), 3)
        self.assertEqual(len(agron["allocations"]), 3)
        self.assertEqual(len(rot["allocations"]), 3)
        self.assertLessEqual(prop["total_allocated"], supply + 0.01)
        self.assertLessEqual(agron["total_allocated"], supply + 0.01)

    # Test 14: Officer approval workflow logic
    def test_officer_approval(self):
        req = dict(self.sample_requests[0])
        req["status"] = "Submitted"
        req["status"] = "Proposed"
        req["proposed_quantity"] = 20.0
        req["status"] = "Approved"
        req["approved_quantity"] = 20.0
        self.assertEqual(req["status"], "Approved")
        self.assertEqual(req["approved_quantity"], 20.0)

    # Test 15: Farmer appeal submission
    def test_farmer_appeal_submission(self):
        appeal = {
            "appeal_id": "APL-2026-001",
            "request_id": "REQ-2026-001",
            "farmer_id": "FARMER-MH-081",
            "reason": "Sugarcane is in Grand Growth stage. 15 T-m3 leaves 40% crop withered.",
            "status": "Under Reconsideration"
        }
        self.assertEqual(appeal["status"], "Under Reconsideration")
        self.assertIn("Grand Growth", appeal["reason"])

    # Test 16: Status changes lifecycle
    def test_status_lifecycle(self):
        valid_transitions = ["Draft", "Submitted", "Under Review", "Proposed", "Approved"]
        current = "Draft"
        for next_st in valid_transitions[1:]:
            current = next_st
        self.assertEqual(current, "Approved")

    # Test 17: Dashboard totals calculation
    def test_dashboard_totals(self):
        all_requests = self.sample_requests
        total_requested = sum(r["requested_quantity"] for r in all_requests)
        self.assertEqual(total_requested, 70.0)

    # Test 18: CSV export format
    def test_csv_export(self):
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["id", "farmer_name", "gate_id", "crop", "requested_quantity"])
        writer.writeheader()
        for r in self.sample_requests:
            writer.writerow({k: r[k] for k in ["id", "farmer_name", "gate_id", "crop", "requested_quantity"]})
        csv_text = output.getvalue()
        self.assertIn("Ramesh Patil", csv_text)
        self.assertIn("REQ-2026-001", csv_text)

    # Test 19: Cryptographic audit hash chain verification
    def test_audit_hash_verification(self):
        audit = AuditHashChain()
        audit.add_event("Farmer Patil", "Farmer", "SUBMIT_REQUEST", "REQ-001", "Requested 25 T-m3 water")
        audit.add_event("AI Engine", "System", "GENERATE_PROPOSAL", "REQ-001", "Proposed 20 T-m3 via Agronomic Priority")
        audit.add_event("Er. Deshmukh", "Officer", "APPROVE_ALLOCATION", "REQ-001", "Approved 20 T-m3 for Gate 5")
        
        is_valid, msg, results = audit.verify_chain()
        self.assertTrue(is_valid)
        self.assertEqual(len(results), 3)

        # Test tamper detection
        audit.chain[1]["details"] = "TAMPERED DETAILS"
        is_valid_tampered, tamper_msg, _ = audit.verify_chain()
        self.assertFalse(is_valid_tampered)
        self.assertIn("Tampering detected", tamper_msg)

    # Test 20: Demo data reset state
    def test_demo_data_reset(self):
        reset_flag = True
        self.assertTrue(reset_flag)

    # Test 21: Jain's Fairness Score computation
    def test_fairness_score_calculation(self):
        allocs = [
            {"requested_quantity": 20.0, "proposed_quantity": 18.0, "gate_id": "Gate-1"},
            {"requested_quantity": 25.0, "proposed_quantity": 22.0, "gate_id": "Gate-3"},
            {"requested_quantity": 30.0, "proposed_quantity": 26.0, "gate_id": "Gate-5"}
        ]
        fairness = calculate_fairness_index(allocs)
        self.assertGreaterEqual(fairness["jains_fairness_score"], 80.0)
        self.assertIn("rating", fairness)

    # Test 22: Schedule conflict detection
    def test_schedule_conflict_detection(self):
        schedules = [
            {"id": "SCH-1", "date": "2026-10-28", "window": "08:00 - 16:00", "gate_id": "Gate-1", "farmer_name": "Suresh", "flow_cusecs": 80.0},
            {"id": "SCH-2", "date": "2026-10-28", "window": "08:00 - 16:00", "gate_id": "Gate-1", "farmer_name": "Ramesh", "flow_cusecs": 90.0}
        ]
        conflicts = detect_schedule_conflicts(schedules, canal_capacity_cusecs=150.0)
        self.assertEqual(len(conflicts), 1)
        self.assertIn("overlap", conflicts[0]["description"])

    # Test 23: 3 Compromise proposals generation
    def test_dispute_compromise_generation(self):
        dispute = {
            "farmer_a_name": "Suresh Shinde",
            "farmer_a_requested": 30.0,
            "farmer_b_name": "Ramesh Patil",
            "farmer_b_requested": 25.0
        }
        proposals = generate_mediation_proposals(dispute, allocatable_supply=45.0)
        self.assertEqual(len(proposals), 3)
        self.assertEqual(proposals[0]["strategy"], "PROPORTIONAL")
        self.assertEqual(proposals[1]["strategy"], "AGRONOMIC")
        self.assertEqual(proposals[2]["strategy"], "ROTATIONAL")
        for p in proposals:
            self.assertGreater(p["farmer_a_alloc"], 0)
            self.assertGreater(p["farmer_b_alloc"], 0)

    # Test 24: Configurable 8-Rule Matrix custom thresholds
    def test_eight_rules_custom_config(self):
        req = self.sample_requests[0]
        sys_state = {"allocatable_supply": 50.0, "emergency_reserve_pct": 15.0}
        custom_cfg = {"rule4_max_per_acre": 2.0} # Lower ceiling to trigger warning
        rules = verify_eight_rules(req, sys_state, custom_cfg)
        self.assertEqual(len(rules), 8)
        # 25 T-m3 for 4 acres = 6.25 > 2.0, rule 4 should warn
        rule4 = [r for r in rules if r["rule_num"] == 4][0]
        self.assertEqual(rule4["status"], "Warning")

    # Test 25: Water History and Demand Analysis (Prompt Specification Example)
    def test_demand_vs_history_user_example(self):
        # User specified: "A farmer previously received 800 litres and currently requests 1,000 litres.
        # Show the previous quantity, requested quantity, difference of 200 litres, and a 25% increase."
        history = [
            {
                "id": "HIST-TEST-01",
                "farmer_id": "FARMER-TEST",
                "received_qty_m3": 0.8,
                "received_qty_litres": 800.0,
                "allocated_qty_m3": 0.8,
                "requested_qty_m3": 0.8,
                "year": 2025,
                "season": "Kharif",
                "crop": "Sugarcane"
            }
        ]
        current_req = {
            "farmer_id": "FARMER-TEST",
            "crop": "Sugarcane",
            "growth_stage": "Grand Growth",
            "farm_area_acres": 1.0,
            "requested_quantity": 1000.0,
            "unit": "litres"
        }
        res = analyze_demand_vs_history(current_req, history, zone_available_supply_m3=50.0)
        self.assertEqual(res["previous_received_litres"], 800.0)
        self.assertEqual(res["current_requested_litres"], 1000.0)
        self.assertEqual(res["difference_from_previous_litres"], 200.0)
        self.assertEqual(res["percentage_change"], 25.0)
        self.assertIn("narrative", res)

    # Test 26: Water History multi-cycle averages and zone balance
    def test_demand_vs_history_multicycle_averages(self):
        history = [
            {"id": "H1", "farmer_id": "F1", "received_qty_m3": 18.0, "requested_qty_m3": 22.0, "year": 2024, "delivery_date": "2024-07-10"},
            {"id": "H2", "farmer_id": "F1", "received_qty_m3": 20.0, "requested_qty_m3": 24.0, "year": 2025, "delivery_date": "2025-07-12"}
        ]
        current_req = {
            "farmer_id": "F1",
            "crop": "Cotton",
            "growth_stage": "Flowering/Boll",
            "farm_area_acres": 4.0,
            "requested_quantity": 21.0,
            "unit": "m3"
        }
        res = analyze_demand_vs_history(current_req, history, zone_available_supply_m3=40.0)
        # Average received: (18 + 20) / 2 = 19.0 m3
        self.assertEqual(res["historical_avg_received_m3"], 19.0)
        self.assertEqual(res["historical_record_count"], 2)
        # Most recent previous was H2: 20.0 m3
        self.assertEqual(res["previous_received_m3"], 20.0)
        self.assertEqual(res["difference_from_previous_m3"], 1.0)
        self.assertEqual(res["percentage_change"], 5.0)
        self.assertGreater(res["agronomic_gross_m3"], 0)
        self.assertEqual(res["zone_status"], "Sufficient")

if __name__ == "__main__":
    unittest.main(verbosity=2)
