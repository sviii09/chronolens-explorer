#!/usr/bin/env python
"""
Complete test suite for RAG-Flask integration.
Tests the entire pipeline from RAG engine to Flask endpoints.
"""

import json
import requests
import sys
import os

# Ensure we're in the right directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 80)
print("CHRONOLENS RAG-FLASK INTEGRATION TEST")
print("=" * 80)

# Test 1: Check file existence
print("\n" + "=" * 80)
print("TEST 1: Checking Required Files")
print("=" * 80)

files_to_check = [
    ("src/updated_data.csv", "Dataset CSV"),
    ("src/govt_schemes_faiss", "FAISS Index"),
    ("rag_engine.py", "RAG Engine"),
    ("app.py", "Flask App"),
]

all_files_exist = True
for file_path, description in files_to_check:
    exists = os.path.exists(file_path)
    status = "✓ EXISTS" if exists else "✗ MISSING"
    print(f"  {description}: {file_path} - {status}")
    if not exists:
        all_files_exist = False

if not all_files_exist:
    print("\n✗ ERROR: Required files are missing!")
    sys.exit(1)

print("\n✓ All required files found!")

# Test 2: Flask Health Check
print("\n" + "=" * 80)
print("TEST 2: Flask Health Check")
print("=" * 80)

try:
    response = requests.get("http://localhost:5000/health", timeout=5)
    if response.status_code == 200:
        data = response.json()
        print(f"  Status: {data.get('status')}")
        print(f"  Service: {data.get('service')}")
        print(f"  Version: {data.get('version')}")
        print("\n✓ Flask is running and responding!")
    else:
        print(f"✗ Unexpected status code: {response.status_code}")
        sys.exit(1)
except requests.ConnectionError:
    print("\n✗ ERROR: Cannot connect to Flask server")
    print("  Make sure to start the backend first:")
    print("    set CHRONOLENS_SKIP_LLM=1 && python app.py")
    sys.exit(1)
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    sys.exit(1)

# Test 3: Roles Endpoint
print("\n" + "=" * 80)
print("TEST 3: User Roles Endpoint")
print("=" * 80)

try:
    response = requests.get("http://localhost:5000/roles", timeout=5)
    if response.status_code == 200:
        data = response.json()
        roles = data.get("roles", [])
        print(f"  Available roles: {len(roles)}")
        for role in roles:
            print(f"    - {role['label']}: {role['description']}")
        print("\n✓ Roles endpoint working!")
    else:
        print(f"✗ Unexpected status code: {response.status_code}")
        sys.exit(1)
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    sys.exit(1)

# Test 4: RAG Query
print("\n" + "=" * 80)
print("TEST 4: RAG Query Endpoint")
print("=" * 80)

test_queries = [
    {
        "query": "Which schemes help women entrepreneurs?",
        "user_role": "public",
        "description": "Women entrepreneurs scheme"
    },
    {
        "query": "What agricultural assistance programs are available?",
        "user_role": "researcher",
        "description": "Agricultural assistance"
    },
    {
        "query": "Healthcare related government schemes",
        "user_role": "government_official",
        "description": "Healthcare schemes"
    }
]

all_queries_passed = True
for i, test_query in enumerate(test_queries, 1):
    print(f"\n  Query {i}: {test_query['description']}")
    print(f"    User Role: {test_query['user_role']}")
    
    try:
        response = requests.post(
            "http://localhost:5000/query",
            json={
                "query": test_query["query"],
                "user_role": test_query["user_role"]
            },
            timeout=60  # Longer timeout for RAG processing
        )
        
        if response.status_code == 200:
            data = response.json()
            docs = data.get("retrieved_documents", [])
            answer = data.get("generated_answer", "")
            metadata = data.get("metadata", {})
            
            print(f"    ✓ Retrieved {len(docs)} documents")
            print(f"    ✓ Latency: {metadata.get('latency_ms', 'N/A')}ms")
            
            if docs:
                top_doc = docs[0]
                print(f"    ✓ Top result: {top_doc['title']} ({top_doc['relevance_score']}%)")
            
            if answer:
                print(f"    ✓ Answer generated ({len(answer)} chars)")
            
        else:
            print(f"    ✗ Status code: {response.status_code}")
            print(f"    Error: {response.text}")
            all_queries_passed = False
            
    except requests.Timeout:
        print(f"    ✗ Request timeout - RAG processing may be slow")
        all_queries_passed = False
    except Exception as e:
        print(f"    ✗ ERROR: {e}")
        all_queries_passed = False

if all_queries_passed:
    print("\n✓ All queries passed!")
else:
    print("\n⚠ Some queries failed - check logs above")

# Final Summary
print("\n" + "=" * 80)
print("INTEGRATION TEST SUMMARY")
print("=" * 80)

if all_files_exist and all_queries_passed:
    print("\n✅ RAG-FLASK INTEGRATION IS WORKING PERFECTLY!")
    print("\nYou can now:")
    print("  1. Test in frontend at http://localhost:5173")
    print("  2. Try different queries with different roles")
    print("  3. Monitor latency and result quality")
else:
    print("\n⚠ Integration test completed with issues - see above for details")

print("\n" + "=" * 80)
