"""
JalMitra AI - Comprehensive REST API Test Suite
Directly tests all endpoints of JalMitraRequestHandler without requiring external network binding.
"""
import unittest
import json
import io
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from server import JalMitraRequestHandler, app_state, DEFAULT_SYSTEM_STATE, audit_chain

class MockSocket:
    def __init__(self, data=b""):
        self.read_buf = io.BytesIO(data)
        self.write_buf = io.BytesIO()

    def makefile(self, mode, *args, **kwargs):
        if "r" in mode:
            return self.read_buf
        else:
            return self.write_buf

    def sendall(self, data):
        self.write_buf.write(data)

def invoke_handler(method: str, path: str, body: dict = None) -> tuple[int, dict, str]:
    body_bytes = json.dumps(body).encode("utf-8") if body is not None else b""
    raw_req = f"{method} {path} HTTP/1.1\r\nHost: localhost\r\nContent-Length: {len(body_bytes)}\r\nContent-Type: application/json\r\n\r\n".encode("utf-8") + body_bytes
    
    mock_sock = MockSocket(raw_req)
    
    try:
        # Construct handler with dummy client address
        handler = JalMitraRequestHandler(mock_sock, ("127.0.0.1", 54321), None)
    except Exception:
        # Handler finishes and closes socket
        pass

    raw_response = mock_sock.write_buf.getvalue().decode("utf-8", errors="replace")
    
    # Parse status code
    lines = raw_response.split("\r\n")
    status_line = lines[0] if lines else ""
    parts = status_line.split(" ")
    status_code = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 200
    
    # Extract body after blank line
    blank_idx = raw_response.find("\r\n\r\n")
    resp_body_str = raw_response[blank_idx + 4:] if blank_idx != -1 else ""
    
    try:
        resp_json = json.loads(resp_body_str)
    except Exception:
        resp_json = {}
        
    return status_code, resp_json, resp_body_str

class TestJalMitraAPI(unittest.TestCase):

    def setUp(self):
        # Reset state before each test
        app_state.clear()
        app_state.update(json.loads(json.dumps(DEFAULT_SYSTEM_STATE)))

    def test_api_health(self):
        code, data, _ = invoke_handler("GET", "/api/health")
        self.assertEqual(code, 200)
        self.assertEqual(data.get("status"), "healthy")
        self.assertIn("JalMitra", data.get("service", ""))

    def test_api_data(self):
        code, data, _ = invoke_handler("GET", "/api/data")
        self.assertEqual(code, 200)
        self.assertIn("state", data)
        self.assertIn("farmers", data["state"])
        self.assertIn("requests", data["state"])
        self.assertIn("disputes", data["state"])
        self.assertIn("schedules", data["state"])

    def test_api_submit_request(self):
        payload = {
            "farmer_id": "FARMER-MH-081",
            "farmer_name": "Ramesh Patil",
            "gate_id": "Gate-5",
            "crop": "Sugarcane",
            "growth_stage": "Grand Growth",
            "farm_area_acres": 4.0,
            "requested_quantity": 25.0,
            "urgency": "High",
            "reason": "Grand growth stage moisture stress"
        }
        code, data, _ = invoke_handler("POST", "/api/requests", payload)
        self.assertEqual(code, 200)
        self.assertTrue(data.get("success"))
        self.assertEqual(data["request"]["requested_quantity"], 25.0)
        self.assertEqual(len(data.get("eight_rules", [])), 8)
        self.assertEqual(len(data.get("thirteen_points", [])), 13)

    def test_api_approve_request(self):
        payload = {
            "request_id": "REQ-2026-001",
            "decision": "Approved",
            "approved_quantity": 18.5,
            "officer_name": "Er. S. Deshmukh",
            "comment": "Approved under Agronomic Priority and Tail Protection"
        }
        code, data, _ = invoke_handler("POST", "/api/approve", payload)
        self.assertEqual(code, 200)
        self.assertTrue(data.get("success"))
        self.assertEqual(data["request"]["status"], "Approved")
        self.assertEqual(data["request"]["approved_quantity"], 18.5)

    def test_api_submit_complaint(self):
        payload = {
            "farmer_id": "FARMER-MH-081",
            "farmer_name": "Ramesh Patil",
            "category": "Downstream Water Shortage",
            "gate_id": "Gate-5",
            "urgency": "High",
            "crop": "Sugarcane",
            "shortfall_quantity": 12.0,
            "description": "Tail reach dry for 4 days"
        }
        code, data, _ = invoke_handler("POST", "/api/complaints", payload)
        self.assertEqual(code, 200)
        self.assertTrue(data.get("success"))
        self.assertEqual(data["complaint"]["category"], "Downstream Water Shortage")

    def test_api_raise_dispute(self):
        payload = {
            "farmer_a_id": "FARMER-MH-014",
            "farmer_a_name": "Suresh Shinde",
            "farmer_a_gate": "Gate-1",
            "farmer_a_crop": "Cotton",
            "farmer_a_requested": 30.0,
            "farmer_b_id": "FARMER-MH-081",
            "farmer_b_name": "Ramesh Patil",
            "farmer_b_gate": "Gate-5",
            "farmer_b_crop": "Sugarcane",
            "farmer_b_requested": 25.0,
            "category": "Unequal Water Distribution",
            "urgency": "High"
        }
        code, data, _ = invoke_handler("POST", "/api/disputes", payload)
        self.assertEqual(code, 200)
        self.assertTrue(data.get("success"))
        self.assertIn("DISP-2026", data["dispute"]["id"])
        self.assertEqual(len(data["dispute"]["proposals"]), 3)

    def test_api_accept_proposal(self):
        payload = {
            "dispute_id": "DISP-2026-001",
            "proposal_id": "PROP-B",
            "actor": "Ramesh Patil",
            "action": "Accepted"
        }
        code, data, _ = invoke_handler("POST", "/api/disputes/accept", payload)
        self.assertEqual(code, 200)
        self.assertTrue(data.get("success"))
        self.assertIn("Accepted", data["dispute"]["farmer_b_status"])

    def test_api_ratify_dispute(self):
        payload = {
            "dispute_id": "DISP-2026-001",
            "proposal_id": "PROP-B",
            "officer_name": "Er. S. Deshmukh",
            "decision": "Ratified",
            "notes": "Statutory compliance verified under 8-Rule Matrix"
        }
        code, data, _ = invoke_handler("POST", "/api/disputes/ratify", payload)
        self.assertEqual(code, 200)
        self.assertTrue(data.get("success"))
        self.assertEqual(data["dispute"]["status"], "Resolved")

    def test_api_update_rules(self):
        payload = {
            "rules_config": {
                "rule4_max_per_acre": 5.5,
                "rule6_min_emergency_reserve_pct": 12.0
            },
            "officer_name": "Er. S. Deshmukh"
        }
        code, data, _ = invoke_handler("POST", "/api/rules/update", payload)
        self.assertEqual(code, 200)
        self.assertTrue(data.get("success"))
        self.assertEqual(data["rules_config"]["rule4_max_per_acre"], 5.5)

    def test_api_update_schedule(self):
        payload = {
            "schedule_id": "SCH-2026-01",
            "date": "2026-10-28",
            "window": "06:00 - 14:00",
            "flow_cusecs": 25.0
        }
        code, data, _ = invoke_handler("POST", "/api/schedules/update", payload)
        self.assertEqual(code, 200)
        self.assertTrue(data.get("success"))
        self.assertEqual(data["schedule"]["window"], "06:00 - 14:00")

    def test_api_mediate_strategies(self):
        payload = {"allocatable_supply": 45.0}
        code, data, _ = invoke_handler("POST", "/api/mediate", payload)
        self.assertEqual(code, 200)
        self.assertIn("options", data)
        self.assertIn("proportional", data["options"])
        self.assertIn("agronomic", data["options"])
        self.assertIn("rotational", data["options"])

    def test_api_audit_verify(self):
        code, data, _ = invoke_handler("POST", "/api/audit/verify")
        self.assertEqual(code, 200)
        self.assertTrue(data.get("valid"))
        self.assertGreater(data.get("total_blocks", 0), 0)

    def test_api_reset(self):
        code, data, _ = invoke_handler("POST", "/api/reset")
        self.assertEqual(code, 200)
        self.assertTrue(data.get("success"))

    def test_api_auth_login_farmer(self):
        payload = {"identifier": "9822004210", "password": "kisan123", "role": "farmer"}
        code, data, _ = invoke_handler("POST", "/api/auth/login", payload)
        self.assertEqual(code, 200)
        self.assertTrue(data.get("success"))
        self.assertEqual(data["user"]["name"], "Ramesh Patil")
        self.assertIn("token", data)

    def test_api_auth_login_officer(self):
        payload = {"identifier": "deshmukh.ee@jalmitra.gov.in", "password": "admin123", "role": "officer"}
        code, data, _ = invoke_handler("POST", "/api/auth/login", payload)
        self.assertEqual(code, 200)
        self.assertTrue(data.get("success"))
        self.assertEqual(data["user"]["role"], "officer")

    def test_api_auth_login_invalid(self):
        payload = {"identifier": "unknown.user", "password": "wrongpassword"}
        code, data, _ = invoke_handler("POST", "/api/auth/login", payload)
        self.assertEqual(code, 401)
        self.assertFalse(data.get("success"))

    def test_api_auth_register_farmer(self):
        payload = {
            "name": "Anil Jadhav",
            "mobile": "9855001234",
            "village": "Chandori",
            "district": "Nashik",
            "farm_area_acres": 3.0,
            "crop": "Wheat",
            "season": "Rabi",
            "gate_id": "Gate-6",
            "gat_no": "205/1",
            "password": "kisan123"
        }
        code, data, _ = invoke_handler("POST", "/api/auth/register", payload)
        self.assertEqual(code, 200)
        self.assertTrue(data.get("success"))
        self.assertEqual(data["user"]["name"], "Anil Jadhav")
        self.assertEqual(data["user"]["gate_id"], "Gate-6")

    def test_api_farmer_water_history(self):
        code, data, _ = invoke_handler("GET", "/api/farmers/FARMER-MH-081/history")
        self.assertEqual(code, 200)
        self.assertEqual(data.get("farmer_id"), "FARMER-MH-081")
        self.assertGreater(len(data.get("history", [])), 0)
        self.assertIn("analysis", data)
        self.assertIn("percentage_change", data["analysis"])

    def test_api_demand_analysis(self):
        req = {
            "farmer_id": "FARMER-MH-081",
            "crop": "Sugarcane",
            "growth_stage": "Grand Growth",
            "farm_area_acres": 4.0,
            "requested_quantity": 25.0,
            "unit": "m3"
        }
        payload = {"request": req, "zone_supply_m3": 45.0}
        code, data, _ = invoke_handler("POST", "/api/demand-analysis", payload)
        self.assertEqual(code, 200)
        self.assertTrue(data.get("success"))
        self.assertIn("analysis", data)
        self.assertIn("agronomic_gross_m3", data["analysis"])
        self.assertIn("narrative", data["analysis"])

    def test_api_request_actions(self):
        # 1. Partial approval
        code, data, _ = invoke_handler("POST", "/api/requests/action", {
            "request_id": "REQ-2026-001",
            "action": "partial",
            "approved_quantity": 18.0,
            "remarks": "Middle reach pressure adjustment"
        })
        self.assertEqual(code, 200)
        self.assertEqual(data["status"], "Partially Approved")
        self.assertEqual(data["request"]["approved_quantity"], 18.0)

        # 2. Mark Delivered
        code, data, _ = invoke_handler("POST", "/api/requests/action", {
            "request_id": "REQ-2026-001",
            "action": "mark_delivered",
            "delivered_quantity_m3": 17.5,
            "delivery_date": "2026-10-28",
            "duration_hours": 7.5,
            "gatekeeper_id": "GK-NIPHAD-05",
            "remarks": "Sluice flow confirmed by Patwari"
        })
        self.assertEqual(code, 200)
        self.assertEqual(data["status"], "Completed / Delivered")
        self.assertEqual(data["request"]["received_quantity"], 17.5)

if __name__ == "__main__":
    unittest.main(verbosity=2)
