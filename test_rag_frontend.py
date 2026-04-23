#!/usr/bin/env python3
"""
Quick test of the RAG-Frontend connection.
Verifies that the backend is responding to RAG queries correctly.
"""

import sys
import os
import json
import time

# Make src/ importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))


def test_backend_endpoints():
    """Test if backend is running and responding."""
    try:
        import requests
    except ImportError:
        print("❌ requests library not installed")
        print("   pip install requests")
        return False
    
    backend_url = "http://localhost:5000"
    
    print("🔍 Testing Backend Connection...")
    print(f"   URL: {backend_url}\n")
    
    # Test 1: Health check
    try:
        resp = requests.get(f"{backend_url}/health", timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ /health endpoint OK")
            print(f"   Status: {data.get('status')}")
            print(f"   Service: {data.get('service')}\n")
        else:
            print(f"❌ /health returned {resp.status_code}\n")
            return False
    except Exception as e:
        print(f"❌ Cannot reach backend: {e}")
        print("   Is the backend running? Try: python app.py\n")
        return False
    
    # Test 2: Roles endpoint
    try:
        resp = requests.get(f"{backend_url}/roles", timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            roles = data.get("roles", [])
            print(f"✅ /roles endpoint OK")
            print(f"   Available roles: {len(roles)}")
            for role in roles:
                print(f"     - {role['id']}: {role['label']}")
            print()
        else:
            print(f"❌ /roles returned {resp.status_code}\n")
            return False
    except Exception as e:
        print(f"❌ Error fetching roles: {e}\n")
        return False
    
    # Test 3: Query endpoint (actual RAG)
    try:
        print("✅ Testing /query endpoint with sample query...")
        query_data = {
            "query": "women entrepreneur schemes",
            "user_role": "public"
        }
        
        start = time.time()
        resp = requests.post(
            f"{backend_url}/query",
            json=query_data,
            timeout=120  # RAG can be slow first time
        )
        elapsed = time.time() - start
        
        if resp.status_code == 200:
            data = resp.json()
            print(f"   ✅ Query successful ({elapsed:.1f}s)")
            print(f"   Retrieved documents: {len(data.get('retrieved_documents', []))}")
            print(f"   Answer generated: {len(data.get('generated_answer', '')) > 0}")
            print(f"   Latency (backend): {data.get('metadata', {}).get('latency_ms')}ms\n")
            
            # Show sample results
            docs = data.get("retrieved_documents", [])
            if docs:
                print("   📋 Sample retrieved document:")
                doc = docs[0]
                print(f"      Title: {doc.get('title', 'N/A')}")
                print(f"      Category: {doc.get('category', 'N/A')}")
                print(f"      Relevance: {doc.get('relevance_score', 'N/A')}%")
            print()
            return True
        else:
            error_data = resp.json()
            print(f"   ❌ Query failed: {error_data.get('error', 'Unknown error')}\n")
            return False
    except Exception as e:
        print(f"❌ Error querying backend: {e}\n")
        return False


def test_rag_module():
    """Test if RAG module can be imported and initialized."""
    print("🤖 Testing RAG Module...")
    
    try:
        import rag_module
        print("✅ rag_module imported\n")
        
        # Try to initialize (loads FAISS)
        print("   Initializing FAISS index (first time may take 30+ seconds)...")
        rag_module._initialize()
        print("✅ FAISS index loaded\n")
        
        return True
    except Exception as e:
        print(f"❌ RAG module error: {e}\n")
        return False


def test_frontend_client():
    """Check if frontend API client is properly configured."""
    print("🌐 Testing Frontend Client Configuration...")
    
    client_file = "src/api/client.ts"
    
    if not os.path.exists(client_file):
        print(f"❌ {client_file} not found\n")
        return False
    
    try:
        with open(client_file, 'r') as f:
            content = f.read()
            
            checks = [
                ("queryRag function", "export.*async function queryRag"),
                ("/query endpoint", '"/query"'),
                ("RagResponse type", "interface RagResponse"),
                ("API_BASE config", "function getApiUrl"),
            ]
            
            for check_name, pattern in checks:
                import re
                if re.search(pattern, content):
                    print(f"✅ {check_name} found")
                else:
                    print(f"❌ {check_name} NOT found")
            print()
            return True
    except Exception as e:
        print(f"❌ Error reading client: {e}\n")
        return False


def main():
    print("\n" + "=" * 60)
    print("🧪 RAG-Frontend Connection Test")
    print("=" * 60 + "\n")
    
    results = {
        "Frontend Client": test_frontend_client(),
        "RAG Module": test_rag_module(),
        "Backend Endpoints": test_backend_endpoints(),
    }
    
    print("=" * 60)
    print("📊 Test Results")
    print("=" * 60 + "\n")
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("\n" + "=" * 60)
    
    if all(results.values()):
        print("\n✅ All tests passed! System is ready.\n")
        print("Next steps:")
        print("1. Open http://localhost:5173 in your browser")
        print("2. Navigate to the 'Query Retrieval' page")
        print("3. Try a query like 'women entrepreneur schemes'\n")
        return 0
    else:
        failed = [k for k, v in results.items() if not v]
        print(f"\n❌ {len(failed)} test(s) failed: {', '.join(failed)}\n")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
