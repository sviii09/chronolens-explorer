#!/usr/bin/env python3
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

print("=" * 80)
print("Rebuilding RAG FAISS Index")
print("=" * 80)

try:
    import rag_module
    print("\n[1/3] Initializing RAG module (rebuilding FAISS)...")
    print("This may take 3-5 minutes on first run...")
    rag_module._initialize()
    print("✓ FAISS index rebuilt")
    
    print("\n[2/3] Testing retrieval with different queries...")
    test_queries = [
        "women entrepreneurs schemes",
        "education scholarships",
        "agriculture assistance",
    ]
    
    previous = None
    for q in test_queries:
        docs = rag_module.retrieve_documents(q, "public")
        current = tuple([d['title'] for d in docs[:2]])
        match_flag = "⚠️ DUPLICATE" if current == previous else "✓"
        print(f"  {match_flag} '{q[:30]}' → {docs[0]['title'] if docs else 'NONE'}")
        previous = current
    
    print("\n✅ RAG rebuild complete! Restart app.py to use new index.")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
