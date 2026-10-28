"""
JalMitra AI - Database Architecture & Persistent SQLite Test Suite
Tests relational schema, data persistence, user verification, registration,
and transactional record integrity for jalmitra.db.
"""
import unittest
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import database as db

class TestJalMitraDatabase(unittest.TestCase):

    def setUp(self):
        # Ensure clean initialized db
        db.init_db()

    def test_db_connection(self):
        conn = db.get_connection()
        self.assertIsNotNone(conn)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        conn.close()

        required_tables = [
            'users', 'farmers', 'water_requests', 'historical_records',
            'deliveries', 'grievances', 'disputes', 'notifications',
            'audit_logs', 'system_config'
        ]
        for tbl in required_tables:
            self.assertIn(tbl, tables, f"Missing table: {tbl}")

    def test_db_user_verification(self):
        # Verify demo farmer
        user = db.db_verify_user("9822004210", "kisan123", required_role="farmer")
        self.assertIsNotNone(user)
        self.assertEqual(user["name"], "Ramesh Patil")
        self.assertEqual(user["role"], "farmer")

        # Verify demo officer
        officer = db.db_verify_user("deshmukh.ee@jalmitra.gov.in", "admin123", required_role="officer")
        self.assertIsNotNone(officer)
        self.assertIn("Er. S. Deshmukh", officer["name"])
        self.assertEqual(officer["role"], "officer")

        # Verify invalid credentials
        invalid = db.db_verify_user("9822004210", "wrongpass")
        self.assertIsNone(invalid)

    def test_db_register_farmer(self):
        new_farmer_data = {
            "name": "Datta Shirode",
            "mobile": "9823998877",
            "village": "Sukene",
            "district": "Nashik",
            "farm_area_acres": 4.5,
            "gat_no": "Gat 312/A",
            "crop": "Grapes",
            "season": "Rabi",
            "gate_id": "Gate-1",
            "password": "kisan123",
            "overwrite": True
        }
        success, res = db.db_register_farmer(new_farmer_data)
        self.assertTrue(success)
        self.assertIn("user", res)
        self.assertIn("farmer", res)
        self.assertEqual(res["user"]["name"], "Datta Shirode")

        # Verify new farmer can log in
        logged_in = db.db_verify_user("9823998877", "kisan123")
        self.assertIsNotNone(logged_in)
        self.assertEqual(logged_in["name"], "Datta Shirode")

    def test_db_system_config(self):
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT value FROM system_config WHERE key = 'allocatable_supply_tm3';")
        row = cursor.fetchone()
        conn.close()
        self.assertIsNotNone(row)
        self.assertEqual(row["value"], "45.0")

if __name__ == '__main__':
    unittest.main()
