#!/usr/bin/env python3
"""
Focused test for financial management endpoints
"""
import requests
import json
import uuid
import time
from datetime import datetime

def test_financial_endpoints():
    base_url = "https://financemgr.preview.emergentagent.com/api"
    
    print("🏦 Testing Financial Management Endpoints...")
    
    # Create admin user first
    admin_data = {
        "email": f"admin_test_{uuid.uuid4().hex[:8]}@test.com",
        "password": "TestPass123!",
        "name": "Test Admin",
        "role": "admin"
    }
    
    response = requests.post(f"{base_url}/auth/register", json=admin_data)
    if response.status_code != 200:
        print(f"❌ Failed to create admin user: {response.status_code}")
        return False
    
    admin_user = response.json()['user']
    admin_id = admin_user['id']
    print(f"✅ Created admin user: {admin_id}")
    
    # Test 1: GET /api/admin/monthly-utility (current month)
    print("\n1. Testing GET /api/admin/monthly-utility (current month)")
    response = requests.get(f"{base_url}/admin/monthly-utility")
    if response.status_code == 200:
        result = response.json()
        required_fields = ['month', 'year', 'total_interest_collected', 'total_payments', 'active_loans_count', 'completed_loans_count']
        if all(field in result for field in required_fields):
            print(f"✅ Monthly utility endpoint working - Response: {json.dumps(result, indent=2)}")
        else:
            print(f"❌ Missing fields in response: {result}")
    else:
        print(f"❌ Monthly utility failed: {response.status_code} - {response.text}")
    
    # Test 2: GET /api/admin/monthly-utility with parameters
    print("\n2. Testing GET /api/admin/monthly-utility with year=2024, month=11")
    response = requests.get(f"{base_url}/admin/monthly-utility", params={"year": 2024, "month": 11})
    if response.status_code == 200:
        result = response.json()
        if result.get('year') == 2024 and result.get('month') == 11:
            print(f"✅ Monthly utility with params working - Response: {json.dumps(result, indent=2)}")
        else:
            print(f"❌ Wrong month/year returned: {result}")
    else:
        print(f"❌ Monthly utility with params failed: {response.status_code} - {response.text}")
    
    # Test 3: POST /api/admin/expenses
    print("\n3. Testing POST /api/admin/expenses")
    expense_data = {
        "description": "Gastos de oficina - Prueba API",
        "amount": 35000,
        "category": "Operaciones",
        "month": 11,
        "year": 2024
    }
    
    response = requests.post(f"{base_url}/admin/expenses", json=expense_data, params={"admin_id": admin_id})
    if response.status_code == 200:
        result = response.json()
        if 'id' in result and 'created_at' in result and result['amount'] == 35000:
            expense_id = result['id']
            print(f"✅ Expense created successfully - ID: {expense_id}")
        else:
            print(f"❌ Invalid expense response: {result}")
            expense_id = None
    else:
        print(f"❌ Expense creation failed: {response.status_code} - {response.text}")
        expense_id = None
    
    # Test 4: GET /api/admin/expenses (current month)
    print("\n4. Testing GET /api/admin/expenses (current month)")
    response = requests.get(f"{base_url}/admin/expenses")
    if response.status_code == 200:
        result = response.json()
        if isinstance(result, list):
            print(f"✅ Get expenses working - Found {len(result)} expenses")
        else:
            print(f"❌ Response is not an array: {result}")
    else:
        print(f"❌ Get expenses failed: {response.status_code} - {response.text}")
    
    # Test 5: GET /api/admin/expenses with parameters
    print("\n5. Testing GET /api/admin/expenses with year=2024, month=11")
    response = requests.get(f"{base_url}/admin/expenses", params={"year": 2024, "month": 11})
    if response.status_code == 200:
        result = response.json()
        if isinstance(result, list):
            found_expense = any(exp.get('id') == expense_id for exp in result if expense_id)
            print(f"✅ Get expenses with params working - Found {len(result)} expenses, created expense found: {found_expense}")
        else:
            print(f"❌ Response is not an array: {result}")
    else:
        print(f"❌ Get expenses with params failed: {response.status_code} - {response.text}")
    
    # Test 6: GET /api/admin/financial-comparison (current month)
    print("\n6. Testing GET /api/admin/financial-comparison (current month)")
    response = requests.get(f"{base_url}/admin/financial-comparison")
    if response.status_code == 200:
        result = response.json()
        required_fields = ['month', 'year', 'total_utility', 'total_expenses', 'net_profit', 'expenses_breakdown']
        if all(field in result for field in required_fields):
            expected_net_profit = result['total_utility'] - result['total_expenses']
            if result['net_profit'] == expected_net_profit:
                print(f"✅ Financial comparison working - Response: {json.dumps(result, indent=2)}")
            else:
                print(f"❌ Net profit calculation incorrect: {result['net_profit']} != {expected_net_profit}")
        else:
            print(f"❌ Missing fields in response: {result}")
    else:
        print(f"❌ Financial comparison failed: {response.status_code} - {response.text}")
    
    # Test 7: GET /api/admin/financial-comparison with parameters
    print("\n7. Testing GET /api/admin/financial-comparison with year=2024, month=11")
    response = requests.get(f"{base_url}/admin/financial-comparison", params={"year": 2024, "month": 11})
    if response.status_code == 200:
        result = response.json()
        if result.get('year') == 2024 and result.get('month') == 11:
            if isinstance(result.get('expenses_breakdown'), list):
                print(f"✅ Financial comparison with params working - Response: {json.dumps(result, indent=2)}")
            else:
                print(f"❌ expenses_breakdown is not an array: {result}")
        else:
            print(f"❌ Wrong month/year returned: {result}")
    else:
        print(f"❌ Financial comparison with params failed: {response.status_code} - {response.text}")
    
    # Test 8: DELETE /api/admin/expenses/{expense_id}
    if expense_id:
        print(f"\n8. Testing DELETE /api/admin/expenses/{expense_id}")
        response = requests.delete(f"{base_url}/admin/expenses/{expense_id}")
        if response.status_code == 200:
            print("✅ Expense deleted successfully")
            
            # Test 9: DELETE non-existent expense (should return 404)
            print(f"\n9. Testing DELETE non-existent expense (should return 404)")
            time.sleep(0.5)  # Small delay
            response = requests.delete(f"{base_url}/admin/expenses/{expense_id}")
            if response.status_code == 404:
                print("✅ DELETE non-existent expense correctly returned 404")
            else:
                print(f"❌ Expected 404, got {response.status_code} - {response.text}")
        else:
            print(f"❌ Expense deletion failed: {response.status_code} - {response.text}")
    else:
        print("\n8-9. Skipping DELETE tests - no expense ID available")
    
    print("\n🎉 Financial endpoints testing completed!")
    return True

if __name__ == "__main__":
    test_financial_endpoints()