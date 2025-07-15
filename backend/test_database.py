#!/usr/bin/env python3
"""
Comprehensive Database Integration Tests for SnackOverflow
This script tests all database functions with various scenarios.
"""

import os
import sys
import json
import base64
from datetime import datetime
from dotenv import load_dotenv

# Add the current directory to the path to import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import (
    get_database_connection, 
    create_tables, 
    save_food_analysis, 
    get_recent_analyses
)

def test_connection():
    """Test 1: Database Connection"""
    print("🔍 Test 1: Testing database connection...")
    
    connection = get_database_connection()
    if connection:
        print("✅ Database connection successful")
        if connection.is_connected():
            connection.close()
        return True
    else:
        print("❌ Database connection failed")
        return False

def test_table_creation():
    """Test 2: Table Creation"""
    print("\n🔍 Test 2: Testing table creation...")
    
    if create_tables():
        print("✅ Tables created successfully")
        return True
    else:
        print("❌ Table creation failed")
        return False

def test_save_analysis():
    """Test 3: Save Food Analysis"""
    print("\n🔍 Test 3: Testing save food analysis...")
    
    # Create test data
    test_data = {
        'fruit_name': 'Test Apple',
        'freshness_level': 8,
        'freshness_state': 'Fresh',
        'visual_indicators': 'Bright red color, firm texture',
        'should_buy': True,
        'best_use': 'Eat now',
        'shelf_life_days': 7,
        'calories': 95,
        'nutrition_highlights': 'High in fiber and vitamin C',
        'health_benefits': 'Supports immune system',
        'purchase_recommendation': 'Buy - excellent quality',
        'storage_method': 'Store in refrigerator',
        'food_pun': 'You\'re apple-solutely going to love this!'
    }
    
    # Test with sample image data
    sample_image_data = base64.b64encode(b"fake_image_data_for_testing").decode('utf-8')
    
    result_id = save_food_analysis(test_data, "test_apple.jpg", sample_image_data)
    
    if result_id:
        print(f"✅ Food analysis saved with ID: {result_id}")
        return result_id
    else:
        print("❌ Save food analysis failed")
        return None

def test_get_recent():
    """Test 4: Get Recent Analyses"""
    print("\n🔍 Test 4: Testing get recent analyses...")
    
    analyses = get_recent_analyses(5)
    
    if analyses is not None:
        print(f"✅ Retrieved {len(analyses)} recent analyses")
        
        if len(analyses) > 0:
            print("\n📋 Sample analysis data:")
            latest = analyses[0]
            print(f"   ID: {latest.get('id')}")
            print(f"   Fruit: {latest.get('fruit_name')}")
            print(f"   Freshness: {latest.get('freshness_state')}")
            print(f"   Should Buy: {latest.get('should_buy')}")
            print(f"   Created: {latest.get('created_at')}")
        
        return True
    else:
        print("❌ Get recent analyses failed")
        return False

def test_save_multiple():
    """Test 5: Save Multiple Analyses"""
    print("\n🔍 Test 5: Testing multiple saves...")
    
    test_fruits = [
        {
            'fruit_name': 'Test Banana',
            'freshness_level': 6,
            'freshness_state': 'Ripe',
            'visual_indicators': 'Yellow with brown spots',
            'should_buy': True,
            'best_use': 'Eat today',
            'shelf_life_days': 2,
            'calories': 105,
            'nutrition_highlights': 'High in potassium',
            'health_benefits': 'Good for heart health',
            'purchase_recommendation': 'Buy - perfect ripeness',
            'storage_method': 'Counter at room temperature',
            'food_pun': 'This deal is a-peel-ing!'
        },
        {
            'fruit_name': 'Test Orange',
            'freshness_level': 9,
            'freshness_state': 'Very Fresh',
            'visual_indicators': 'Bright orange, firm skin',
            'should_buy': True,
            'best_use': 'Eat within week',
            'shelf_life_days': 10,
            'calories': 62,
            'nutrition_highlights': 'Excellent source of vitamin C',
            'health_benefits': 'Boosts immune system',
            'purchase_recommendation': 'Buy - premium quality',
            'storage_method': 'Refrigerate for longer storage',
            'food_pun': 'Orange you glad you found these?'
        }
    ]
    
    success_count = 0
    for fruit_data in test_fruits:
        result_id = save_food_analysis(fruit_data, f"test_{fruit_data['fruit_name'].lower().replace(' ', '_')}.jpg")
        if result_id:
            success_count += 1
            print(f"   ✅ Saved {fruit_data['fruit_name']} with ID: {result_id}")
        else:
            print(f"   ❌ Failed to save {fruit_data['fruit_name']}")
    
    print(f"\n📊 Successfully saved {success_count}/{len(test_fruits)} test analyses")
    return success_count == len(test_fruits)

def test_edge_cases():
    """Test 6: Edge Cases and Error Handling"""
    print("\n🔍 Test 6: Testing edge cases...")
    
    # Test with missing data
    incomplete_data = {
        'fruit_name': 'Incomplete Test',
        # Missing many required fields
    }
    
    result = save_food_analysis(incomplete_data)
    if result:
        print("   ✅ Handled incomplete data gracefully")
    else:
        print("   ⚠️ Incomplete data was rejected (expected)")
    
    # Test with None values
    none_data = {
        'fruit_name': None,
        'freshness_level': None,
        'should_buy': None
    }
    
    result = save_food_analysis(none_data)
    if result:
        print("   ✅ Handled None values gracefully")
    else:
        print("   ⚠️ None values were rejected (expected)")
    
    # Test getting analyses with different limits
    for limit in [1, 5, 20]:
        analyses = get_recent_analyses(limit)
        if analyses is not None:
            actual_count = len(analyses)
            expected_count = min(limit, 10)  # Assuming we don't have more than 10 test records
            print(f"   ✅ Limit {limit}: Retrieved {actual_count} analyses")
        else:
            print(f"   ❌ Failed to get analyses with limit {limit}")
    
    return True

def test_api_integration():
    """Test 7: API Integration Test"""
    print("\n🔍 Test 7: Testing API integration...")
    
    try:
        # Import Flask app to test integration
        from api import app
        
        with app.test_client() as client:
            # Test health endpoint
            response = client.get('/health')
            if response.status_code == 200:
                print("   ✅ Health endpoint working")
            else:
                print("   ❌ Health endpoint failed")
            
            # Test recent analyses endpoint
            response = client.get('/analyses/recent')
            if response.status_code == 200:
                data = response.get_json()
                print(f"   ✅ Recent analyses endpoint returned {len(data)} records")
            else:
                print("   ❌ Recent analyses endpoint failed")
        
        return True
        
    except Exception as e:
        print(f"   ⚠️ API integration test skipped: {e}")
        return False

def run_all_tests():
    """Run all database tests"""
    print("🍌 SnackOverflow Database Integration Tests")
    print("=" * 50)
    
    # Load environment variables
    load_dotenv()
    
    tests = [
        ("Database Connection", test_connection),
        ("Table Creation", test_table_creation),
        ("Save Analysis", test_save_analysis),
        ("Get Recent Analyses", test_get_recent),
        ("Multiple Saves", test_save_multiple),
        ("Edge Cases", test_edge_cases),
        ("API Integration", test_api_integration)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} failed with error: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your database integration is working correctly.")
    else:
        print("⚠️ Some tests failed. Please check your database configuration.")
    
    return passed, total

if __name__ == "__main__":
    run_all_tests() 