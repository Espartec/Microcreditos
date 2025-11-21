import requests
import sys
import json
from datetime import datetime, timedelta
import uuid

class LoanAppAPITester:
    def __init__(self, base_url="https://financemgr.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}  # Store tokens for different users
        self.users = {}   # Store user data
        self.loans = {}   # Store loan data
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            self.failed_tests.append({"name": name, "details": details})
            print(f"❌ {name} - {details}")

    def make_request(self, method, endpoint, data=None, token=None, params=None):
        """Make HTTP request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, params=params)
            
            return response
        except Exception as e:
            return None

    def test_user_registration(self):
        """Test user registration for different roles"""
        print("\n🔍 Testing User Registration...")
        
        # Test client registration
        client_data = {
            "email": f"client_{uuid.uuid4().hex[:8]}@test.com",
            "password": "TestPass123!",
            "name": "Test Client",
            "role": "client",
            "phone": "1234567890",
            "address": "Test Address"
        }
        
        response = self.make_request('POST', 'auth/register', client_data)
        if response and response.status_code == 200:
            result = response.json()
            self.tokens['client'] = result['access_token']
            self.users['client'] = result['user']
            self.log_test("Client Registration", True)
        else:
            self.log_test("Client Registration", False, f"Status: {response.status_code if response else 'No response'}")

        # Test lender registration
        lender_data = {
            "email": f"lender_{uuid.uuid4().hex[:8]}@test.com",
            "password": "TestPass123!",
            "name": "Test Lender",
            "role": "lender"
        }
        
        response = self.make_request('POST', 'auth/register', lender_data)
        if response and response.status_code == 200:
            result = response.json()
            self.tokens['lender'] = result['access_token']
            self.users['lender'] = result['user']
            self.log_test("Lender Registration", True)
        else:
            self.log_test("Lender Registration", False, f"Status: {response.status_code if response else 'No response'}")

        # Test admin registration
        admin_data = {
            "email": f"admin_{uuid.uuid4().hex[:8]}@test.com",
            "password": "TestPass123!",
            "name": "Test Admin",
            "role": "admin"
        }
        
        response = self.make_request('POST', 'auth/register', admin_data)
        if response and response.status_code == 200:
            result = response.json()
            self.tokens['admin'] = result['access_token']
            self.users['admin'] = result['user']
            self.log_test("Admin Registration", True)
        else:
            self.log_test("Admin Registration", False, f"Status: {response.status_code if response else 'No response'}")

    def test_user_login(self):
        """Test user login"""
        print("\n🔍 Testing User Login...")
        
        if 'client' in self.users:
            login_data = {
                "email": self.users['client']['email'],
                "password": "TestPass123!"
            }
            
            response = self.make_request('POST', 'auth/login', login_data)
            if response and response.status_code == 200:
                self.log_test("Client Login", True)
            else:
                self.log_test("Client Login", False, f"Status: {response.status_code if response else 'No response'}")

    def test_loan_calculator(self):
        """Test loan calculation"""
        print("\n🔍 Testing Loan Calculator...")
        
        calc_data = {
            "amount": 10000,
            "interest_rate": 12,
            "term_months": 12
        }
        
        response = self.make_request('POST', 'loans/calculate', calc_data)
        if response and response.status_code == 200:
            result = response.json()
            if 'monthly_payment' in result and 'total_amount' in result:
                self.log_test("Loan Calculator", True)
            else:
                self.log_test("Loan Calculator", False, "Missing calculation fields")
        else:
            self.log_test("Loan Calculator", False, f"Status: {response.status_code if response else 'No response'}")

    def test_loan_creation(self):
        """Test loan creation by client"""
        print("\n🔍 Testing Loan Creation...")
        
        if 'client' not in self.users:
            self.log_test("Loan Creation", False, "No client user available")
            return
        
        loan_data = {
            "amount": 15000,
            "interest_rate": 15,
            "term_months": 24,
            "purpose": "Business expansion"
        }
        
        client = self.users['client']
        params = {
            "client_id": client['id'],
            "client_name": client['name']
        }
        
        response = self.make_request('POST', 'loans', loan_data, self.tokens['client'], params)
        if response and response.status_code == 200:
            result = response.json()
            self.loans['test_loan'] = result
            self.log_test("Loan Creation", True)
        else:
            self.log_test("Loan Creation", False, f"Status: {response.status_code if response else 'No response'}")

    def test_get_loans(self):
        """Test getting loans"""
        print("\n🔍 Testing Get Loans...")
        
        # Test get all loans
        response = self.make_request('GET', 'loans')
        if response and response.status_code == 200:
            self.log_test("Get All Loans", True)
        else:
            self.log_test("Get All Loans", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test get loans by client
        if 'client' in self.users:
            params = {"client_id": self.users['client']['id']}
            response = self.make_request('GET', 'loans', params=params)
            if response and response.status_code == 200:
                self.log_test("Get Client Loans", True)
            else:
                self.log_test("Get Client Loans", False, f"Status: {response.status_code if response else 'No response'}")

    def test_loan_approval(self):
        """Test loan approval by admin"""
        print("\n🔍 Testing Loan Approval...")
        
        if 'test_loan' not in self.loans or 'admin' not in self.users or 'lender' not in self.users:
            self.log_test("Loan Approval", False, "Missing required data (loan, admin, or lender)")
            return
        
        approval_data = {
            "loan_id": self.loans['test_loan']['id'],
            "lender_id": self.users['lender']['id'],
            "start_date": datetime.now().isoformat()
        }
        
        loan_id = self.loans['test_loan']['id']
        response = self.make_request('POST', f'loans/{loan_id}/approve', approval_data, self.tokens['admin'])
        if response and response.status_code == 200:
            self.log_test("Loan Approval", True)
        else:
            self.log_test("Loan Approval", False, f"Status: {response.status_code if response else 'No response'}")

    def test_payment_schedules(self):
        """Test payment schedules"""
        print("\n🔍 Testing Payment Schedules...")
        
        # Test get all schedules
        response = self.make_request('GET', 'schedules')
        if response and response.status_code == 200:
            self.log_test("Get Payment Schedules", True)
        else:
            self.log_test("Get Payment Schedules", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test get today's schedules
        response = self.make_request('GET', 'schedules/today')
        if response and response.status_code == 200:
            self.log_test("Get Today's Schedules", True)
        else:
            self.log_test("Get Today's Schedules", False, f"Status: {response.status_code if response else 'No response'}")

    def test_payment_creation(self):
        """Test payment creation"""
        print("\n🔍 Testing Payment Creation...")
        
        if 'test_loan' not in self.loans or 'client' not in self.users:
            self.log_test("Payment Creation", False, "Missing required data (loan or client)")
            return
        
        # First get the loan schedules to find a pending payment
        loan_id = self.loans['test_loan']['id']
        params = {"loan_id": loan_id, "status": "pending"}
        response = self.make_request('GET', 'schedules', params=params)
        
        if not response or response.status_code != 200:
            self.log_test("Payment Creation", False, "Could not get payment schedules")
            return
        
        schedules = response.json()
        if not schedules:
            self.log_test("Payment Creation", False, "No pending payment schedules found")
            return
        
        # Create payment for the first pending schedule
        payment_data = {
            "loan_id": loan_id,
            "amount": schedules[0]['amount'],
            "notes": "Test payment"
        }
        
        params = {"client_id": self.users['client']['id']}
        response = self.make_request('POST', 'payments', payment_data, self.tokens['client'], params)
        if response and response.status_code == 200:
            self.log_test("Payment Creation", True)
        else:
            self.log_test("Payment Creation", False, f"Status: {response.status_code if response else 'No response'}")

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n🔍 Testing Dashboard Stats...")
        
        # Test client stats
        if 'client' in self.users:
            params = {
                "user_id": self.users['client']['id'],
                "role": "client"
            }
            response = self.make_request('GET', 'stats/dashboard', params=params)
            if response and response.status_code == 200:
                self.log_test("Client Dashboard Stats", True)
            else:
                self.log_test("Client Dashboard Stats", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test admin stats
        if 'admin' in self.users:
            params = {
                "user_id": self.users['admin']['id'],
                "role": "admin"
            }
            response = self.make_request('GET', 'stats/dashboard', params=params)
            if response and response.status_code == 200:
                self.log_test("Admin Dashboard Stats", True)
            else:
                self.log_test("Admin Dashboard Stats", False, f"Status: {response.status_code if response else 'No response'}")

    def test_monthly_utility(self):
        """Test monthly utility endpoint"""
        print("\n🔍 Testing Monthly Utility Endpoint...")
        
        # Test without parameters (current month)
        response = self.make_request('GET', 'admin/monthly-utility')
        if response and response.status_code == 200:
            result = response.json()
            required_fields = ['month', 'year', 'total_interest_collected', 'total_payments', 'active_loans_count', 'completed_loans_count']
            if all(field in result for field in required_fields):
                self.log_test("Monthly Utility - Current Month", True)
            else:
                missing_fields = [field for field in required_fields if field not in result]
                self.log_test("Monthly Utility - Current Month", False, f"Missing fields: {missing_fields}")
        else:
            self.log_test("Monthly Utility - Current Month", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test with specific year and month
        params = {"year": 2024, "month": 11}
        response = self.make_request('GET', 'admin/monthly-utility', params=params)
        if response and response.status_code == 200:
            result = response.json()
            if result.get('year') == 2024 and result.get('month') == 11:
                self.log_test("Monthly Utility - Specific Month", True)
            else:
                self.log_test("Monthly Utility - Specific Month", False, f"Wrong month/year returned: {result.get('month')}/{result.get('year')}")
        else:
            self.log_test("Monthly Utility - Specific Month", False, f"Status: {response.status_code if response else 'No response'}")

    def test_expenses_crud(self):
        """Test expenses CRUD operations"""
        print("\n🔍 Testing Expenses CRUD Operations...")
        
        if 'admin' not in self.users:
            self.log_test("Expenses CRUD", False, "No admin user available")
            return
        
        admin_id = self.users['admin']['id']
        created_expense_id = None
        
        # Test POST /api/admin/expenses - Create expense
        expense_data = {
            "description": "Gastos de oficina - Prueba",
            "amount": 25000,
            "category": "Operaciones",
            "month": 11,
            "year": 2024
        }
        
        params = {"admin_id": admin_id}
        response = self.make_request('POST', 'admin/expenses', expense_data, params=params)
        if response and response.status_code == 200:
            result = response.json()
            if 'id' in result and 'created_at' in result and result['amount'] == 25000:
                created_expense_id = result['id']
                self.log_test("Create Expense", True)
            else:
                self.log_test("Create Expense", False, "Missing required fields in response")
        else:
            self.log_test("Create Expense", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test GET /api/admin/expenses - Get expenses without parameters (current month)
        response = self.make_request('GET', 'admin/expenses')
        if response and response.status_code == 200:
            result = response.json()
            if isinstance(result, list):
                self.log_test("Get Expenses - Current Month", True)
            else:
                self.log_test("Get Expenses - Current Month", False, "Response is not an array")
        else:
            self.log_test("Get Expenses - Current Month", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test GET /api/admin/expenses - Get expenses with specific year and month
        params = {"year": 2024, "month": 11}
        response = self.make_request('GET', 'admin/expenses', params=params)
        if response and response.status_code == 200:
            result = response.json()
            if isinstance(result, list):
                # Check if our created expense is in the list
                found_expense = any(exp.get('id') == created_expense_id for exp in result if created_expense_id)
                if found_expense or not created_expense_id:
                    self.log_test("Get Expenses - Specific Month", True)
                else:
                    self.log_test("Get Expenses - Specific Month", False, "Created expense not found in results")
            else:
                self.log_test("Get Expenses - Specific Month", False, "Response is not an array")
        else:
            self.log_test("Get Expenses - Specific Month", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test DELETE /api/admin/expenses/{expense_id} - Delete expense
        if created_expense_id:
            response = self.make_request('DELETE', f'admin/expenses/{created_expense_id}')
            if response and response.status_code == 200:
                self.log_test("Delete Expense", True)
                
                # Verify expense was deleted by trying to delete again (should return 404)
                response = self.make_request('DELETE', f'admin/expenses/{created_expense_id}')
                if response and response.status_code == 404:
                    self.log_test("Delete Non-existent Expense (404)", True)
                else:
                    self.log_test("Delete Non-existent Expense (404)", False, f"Expected 404, got {response.status_code if response else 'No response'}")
            else:
                self.log_test("Delete Expense", False, f"Status: {response.status_code if response else 'No response'}")
        else:
            self.log_test("Delete Expense", False, "No expense ID to delete")

    def test_financial_comparison(self):
        """Test financial comparison endpoint"""
        print("\n🔍 Testing Financial Comparison Endpoint...")
        
        # Test without parameters (current month)
        response = self.make_request('GET', 'admin/financial-comparison')
        if response and response.status_code == 200:
            result = response.json()
            required_fields = ['month', 'year', 'total_utility', 'total_expenses', 'net_profit', 'expenses_breakdown']
            if all(field in result for field in required_fields):
                # Verify net_profit calculation
                expected_net_profit = result['total_utility'] - result['total_expenses']
                if result['net_profit'] == expected_net_profit:
                    self.log_test("Financial Comparison - Current Month", True)
                else:
                    self.log_test("Financial Comparison - Current Month", False, f"Net profit calculation incorrect: {result['net_profit']} != {expected_net_profit}")
            else:
                missing_fields = [field for field in required_fields if field not in result]
                self.log_test("Financial Comparison - Current Month", False, f"Missing fields: {missing_fields}")
        else:
            self.log_test("Financial Comparison - Current Month", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test with specific year and month
        params = {"year": 2024, "month": 11}
        response = self.make_request('GET', 'admin/financial-comparison', params=params)
        if response and response.status_code == 200:
            result = response.json()
            if result.get('year') == 2024 and result.get('month') == 11:
                # Verify expenses_breakdown is an array
                if isinstance(result.get('expenses_breakdown'), list):
                    self.log_test("Financial Comparison - Specific Month", True)
                else:
                    self.log_test("Financial Comparison - Specific Month", False, "expenses_breakdown is not an array")
            else:
                self.log_test("Financial Comparison - Specific Month", False, f"Wrong month/year returned: {result.get('month')}/{result.get('year')}")
        else:
            self.log_test("Financial Comparison - Specific Month", False, f"Status: {response.status_code if response else 'No response'}")

    def test_data_integrity(self):
        """Test data integrity across financial endpoints"""
        print("\n🔍 Testing Data Integrity...")
        
        if 'admin' not in self.users:
            self.log_test("Data Integrity", False, "No admin user available")
            return
        
        # Create a test expense for data integrity testing
        admin_id = self.users['admin']['id']
        expense_data = {
            "description": "Prueba de integridad",
            "amount": 15000,
            "category": "Testing",
            "month": 12,
            "year": 2024
        }
        
        params = {"admin_id": admin_id}
        expense_response = self.make_request('POST', 'admin/expenses', expense_data, params=params)
        
        if not expense_response or expense_response.status_code != 200:
            self.log_test("Data Integrity", False, "Could not create test expense")
            return
        
        # Get financial comparison for the same month
        params = {"year": 2024, "month": 12}
        comparison_response = self.make_request('GET', 'admin/financial-comparison', params=params)
        
        if comparison_response and comparison_response.status_code == 200:
            comparison_result = comparison_response.json()
            
            # Get expenses for the same month
            expenses_response = self.make_request('GET', 'admin/expenses', params=params)
            
            if expenses_response and expenses_response.status_code == 200:
                expenses_result = expenses_response.json()
                
                # Calculate total expenses manually
                manual_total = sum(exp['amount'] for exp in expenses_result)
                
                # Compare with financial comparison total
                if comparison_result['total_expenses'] == manual_total:
                    self.log_test("Data Integrity - Expense Totals Match", True)
                else:
                    self.log_test("Data Integrity - Expense Totals Match", False, 
                                f"Totals don't match: comparison={comparison_result['total_expenses']}, manual={manual_total}")
                
                # Verify amounts are integers
                all_integers = all(isinstance(exp['amount'], int) for exp in expenses_result)
                if all_integers:
                    self.log_test("Data Integrity - All Amounts Are Integers", True)
                else:
                    self.log_test("Data Integrity - All Amounts Are Integers", False, "Some amounts are not integers")
            else:
                self.log_test("Data Integrity", False, "Could not get expenses for comparison")
        else:
            self.log_test("Data Integrity", False, "Could not get financial comparison")

    def test_get_users(self):
        """Test getting users"""
        print("\n🔍 Testing Get Users...")
        
        # Test get all users
        response = self.make_request('GET', 'users')
        if response and response.status_code == 200:
            self.log_test("Get All Users", True)
        else:
            self.log_test("Get All Users", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test get lenders only
        params = {"role": "lender"}
        response = self.make_request('GET', 'users', params=params)
        if response and response.status_code == 200:
            self.log_test("Get Lenders", True)
        else:
            self.log_test("Get Lenders", False, f"Status: {response.status_code if response else 'No response'}")

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Loan Management App API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Run tests in logical order
        self.test_user_registration()
        self.test_user_login()
        self.test_get_users()
        self.test_loan_calculator()
        self.test_loan_creation()
        self.test_get_loans()
        self.test_loan_approval()
        self.test_payment_schedules()
        self.test_payment_creation()
        self.test_dashboard_stats()
        
        # Run new financial management tests
        print("\n🏦 Testing Financial Management Endpoints...")
        self.test_monthly_utility()
        self.test_expenses_crud()
        self.test_financial_comparison()
        self.test_data_integrity()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        return len(self.failed_tests) == 0

def main():
    tester = LoanAppAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())