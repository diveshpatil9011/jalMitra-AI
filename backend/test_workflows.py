"""
JalMitra AI - End-to-End Governance & Verification Workflow Test Suite
Verifies the complete 17-step lifecycle specified in Requirement 21:
  1. Welcome / Role Selection boundary
  2. Farmer registration & unique ID generation
  3. Farmer authentication & session token
  4. Role-based access control (RBAC) & security boundary enforcement
  5. Empty water history state for new farmers
  6. Water requirement submission with agronomic calculations
  7. Department administrator authentication
  8. Command Center aggregate metrics
  9. Request review and allocation action (Approved / Partially Approved)
  10. Farmer notification & status reflection
  11. Water delivery recording & ledger update
  12. SHA-256 cryptographic audit trail verification
  13. Persistent SQLite database verification
"""
import unittest
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from test_api import invoke_handler
import database as db

class TestJalMitraEndToEndWorkflows(unittest.TestCase):

    def setUp(self):
        self.test_farmer_mobile = "9822998877"
        self.test_farmer_name = "Kisanrao Patil"
        self.test_farmer_village = "Niphad"
        self.test_farmer_district = "Nashik"
        self.test_farmer_gate = "Gate-5"

    def test_complete_e2e_governance_lifecycle(self):
        # -------------------------------------------------------------
        # STEP 1: Verify Root Serves Role Selection HTML (No auto-dashboard)
        # -------------------------------------------------------------
        code, _, html_resp = invoke_handler("GET", "/")
        self.assertEqual(code, 200)
        self.assertIn("JalMitra", html_resp)
        self.assertIn("Smart Water. Fair Distribution. Stronger Farmers.", html_resp)
        self.assertIn("farmer-login", html_resp)

        # -------------------------------------------------------------
        # STEP 2: Farmer Registration
        # -------------------------------------------------------------
        reg_payload = {
            "name": self.test_farmer_name,
            "mobile": self.test_farmer_mobile,
            "village": self.test_farmer_village,
            "district": self.test_farmer_district,
            "state": "Maharashtra",
            "farm_area_acres": 4.5,
            "gat_no": "Gat 312/B",
            "crop": "Sugarcane",
            "season": "Rabi",
            "gate_id": self.test_farmer_gate,
            "password": "kisan_secure_pass",
            "overwrite": True
        }
        code, reg_res, _ = invoke_handler("POST", "/api/auth/register", reg_payload)
        self.assertEqual(code, 200, f"Registration failed: {reg_res}")
        self.assertTrue(reg_res.get("success"))
        new_fid = reg_res.get("farmer_id")
        self.assertTrue(new_fid.startswith("JM-FARM-"))
        self.assertEqual(reg_res["user"]["name"], self.test_farmer_name)
        self.assertEqual(reg_res["user"]["role"], "farmer")

        # -------------------------------------------------------------
        # STEP 3: Farmer Authentication
        # -------------------------------------------------------------
        login_payload = {
            "identifier": self.test_farmer_mobile,
            "password": "kisan_secure_pass",
            "role": "farmer"
        }
        code, login_res, _ = invoke_handler("POST", "/api/auth/login", login_payload)
        self.assertEqual(code, 200)
        self.assertTrue(login_res.get("success"))
        self.assertEqual(login_res["user"]["id"], new_fid)
        self.assertIn("token", login_res)

        # -------------------------------------------------------------
        # STEP 4: Role-Based Authorization Enforcement (RBAC)
        # Ordinary farmer CANNOT log in as Department Officer
        # -------------------------------------------------------------
        hacker_login = {
            "identifier": self.test_farmer_mobile,
            "password": "kisan_secure_pass",
            "role": "officer"
        }
        code, hacker_res, _ = invoke_handler("POST", "/api/auth/login", hacker_login)
        self.assertEqual(code, 401)
        self.assertFalse(hacker_res.get("success"))

        # -------------------------------------------------------------
        # STEP 5: New Farmer Water History -> Confirms Empty State
        # -------------------------------------------------------------
        code, hist_res, _ = invoke_handler("GET", f"/api/farmers/{new_fid}/history")
        self.assertEqual(code, 200)
        self.assertEqual(len(hist_res.get("history", [])), 0)
        self.assertEqual(hist_res.get("farmer_id"), new_fid)
        # Empty state message should be returned or history empty
        self.assertTrue(hist_res.get("empty_state", False) or len(hist_res.get("history", [])) == 0)

        # -------------------------------------------------------------
        # STEP 6: Submit Water Requirement Form
        # -------------------------------------------------------------
        req_payload = {
            "farmer_id": new_fid,
            "farmer_name": self.test_farmer_name,
            "gate_id": self.test_farmer_gate,
            "crop": "Sugarcane",
            "growth_stage": "Grand Growth",
            "farm_area_acres": 4.5,
            "irrig_area_acres": 4.5,
            "requested_quantity": 28.0,
            "unit": "Thousand m3",
            "preferred_date": "2026-11-02",
            "preferred_window": "Daytime Turn (06:00 - 14:00)",
            "duration_hours": 8.0,
            "last_irrig_date": "2026-10-15",
            "soil_moisture": 32.0,
            "urgency": "High",
            "reason": "Grand growth stage moisture deficit; tail end canal pressure low."
        }
        code, req_res, _ = invoke_handler("POST", "/api/requests", req_payload)
        self.assertEqual(code, 200)
        self.assertTrue(req_res.get("success"))
        submitted_req = req_res["request"]
        req_id = submitted_req["id"]
        self.assertTrue(req_id.startswith("REQ-2026-"))
        self.assertEqual(submitted_req["status"], "Submitted")
        self.assertEqual(submitted_req["requested_quantity"], 28.0)
        self.assertIn("crop_estimate", submitted_req)
        self.assertGreater(submitted_req["crop_estimate"]["estimated_volume_thousand_m3"], 0)

        # -------------------------------------------------------------
        # STEP 7: Department Admin Authentication
        # -------------------------------------------------------------
        admin_login = {
            "identifier": "deshmukh.ee@jalmitra.gov.in",
            "password": "admin123",
            "role": "officer"
        }
        code, admin_res, _ = invoke_handler("POST", "/api/auth/login", admin_login)
        self.assertEqual(code, 200)
        self.assertTrue(admin_res.get("success"))
        self.assertEqual(admin_res["user"]["role"], "officer")

        # -------------------------------------------------------------
        # STEP 8: Department Command Center Aggregates
        # -------------------------------------------------------------
        code, cc_res, _ = invoke_handler("GET", "/api/command-center")
        self.assertEqual(code, 200)
        self.assertTrue(cc_res.get("success"))
        metrics = cc_res["metrics"]
        self.assertGreaterEqual(metrics["total_farmers"], 1)
        self.assertGreaterEqual(metrics["total_requests"], 1)
        self.assertIn("allocatable_supply_tm3", metrics)

        # -------------------------------------------------------------
        # STEP 9: Officer Review Action (Partially Approve with remarks)
        # -------------------------------------------------------------
        action_payload = {
            "request_id": req_id,
            "action": "partial",
            "approved_quantity": 22.5,
            "schedule_date": "2026-11-03",
            "schedule_window": "06:00 - 13:00",
            "officer_name": "Er. S. Deshmukh",
            "remarks": "Partially approved under Agronomic Criticality and Tail Reach protection (22.5 T-m3)."
        }
        code, action_res, _ = invoke_handler("POST", "/api/requests/action", action_payload)
        self.assertEqual(code, 200)
        self.assertTrue(action_res.get("success"))
        self.assertEqual(action_res["status"], "Partially Approved")
        self.assertEqual(action_res["request"]["approved_quantity"], 22.5)

        # -------------------------------------------------------------
        # STEP 10: Farmer Notification & Status Verification
        # -------------------------------------------------------------
        code, notif_res, _ = invoke_handler("GET", f"/api/notifications?user_id={new_fid}")
        self.assertEqual(code, 200)
        notifs = notif_res.get("notifications", [])
        self.assertGreaterEqual(len(notifs), 1)

        # -------------------------------------------------------------
        # STEP 11: Official Water Delivery Recording
        # -------------------------------------------------------------
        delivery_payload = {
            "request_id": req_id,
            "farmer_id": new_fid,
            "delivered_qty_m3": 22.0,
            "delivery_date": "2026-11-03",
            "duration_hours": 7.5,
            "recorded_by": "Er. S. Deshmukh",
            "remarks": "Sluice gate flow verified at 21 cusecs; full turn delivered to Gat 312/B."
        }
        code, deliv_res, _ = invoke_handler("POST", "/api/deliveries", delivery_payload)
        self.assertEqual(code, 200)
        self.assertTrue(deliv_res.get("success"))
        self.assertEqual(deliv_res["delivered_qty_m3"], 22.0)

        # Verify delivery is now reflected in farmer's water history
        code, updated_hist, _ = invoke_handler("GET", f"/api/farmers/{new_fid}/history")
        self.assertEqual(code, 200)
        self.assertGreaterEqual(len(updated_hist.get("history", [])), 1)
        delivered_entry = updated_hist["history"][0]
        self.assertEqual(delivered_entry["received_qty_m3"], 22.0)

        # -------------------------------------------------------------
        # STEP 12: SHA-256 Cryptographic Audit Hash Chain Verification
        # -------------------------------------------------------------
        code, verify_res, _ = invoke_handler("POST", "/api/audit/verify", {})
        self.assertEqual(code, 200)
        self.assertTrue(verify_res.get("success"))
        chain_report = verify_res.get("chain_verification", {})
        self.assertTrue(chain_report.get("is_valid", False))
        self.assertEqual(chain_report.get("status"), "Tamper-Proof & Cryptographically Verified")
        self.assertGreater(chain_report.get("total_blocks", 0), 5)

        # -------------------------------------------------------------
        # STEP 13: SQLite Persistence Direct Database Verification
        # -------------------------------------------------------------
        persisted_farmer = db.db_get_farmer(new_fid)
        self.assertIsNotNone(persisted_farmer)
        self.assertEqual(persisted_farmer["name"], self.test_farmer_name)
        self.assertEqual(persisted_farmer["mobile"], self.test_farmer_mobile)

        db_hist = db.db_get_water_history(new_fid)
        self.assertGreaterEqual(len(db_hist), 1)
        self.assertEqual(db_hist[0]["received_qty_m3"], 22.0)

        audit_chain_db = db.db_get_audit_chain()
        self.assertGreater(len(audit_chain_db), 5)

if __name__ == "__main__":
    unittest.main(verbosity=2)
