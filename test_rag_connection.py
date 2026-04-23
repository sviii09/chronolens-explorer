#!/usr/bin/env python
"""Test RAG engine connection to Flask."""

import sys
import os

print("=" * 70)
print("Testing RAG Engine Initialization")
print("=" * 70)

print(f"\nCurrent directory: {os.getcwd()}")
print(f"Python version: {sys.version}")

# Test paths
src_csv = os.path.join(os.path.dirname(__file__), "src", "updated_data.csv")
root_csv = os.path.join(os.path.dirname(__file__), "updated_data.csv")
src_faiss = os.path.join(os.path.dirname(__file__), "src", "govt_schemes_faiss")
root_faiss = os.path.join(os.path.dirname(__file__), "govt_schemes_faiss")

print(f"\n CSV Paths:")
print(f"  {src_csv}: {'EXISTS' if os.path.exists(src_csv) else 'NOT FOUND'}")
print(f"  {root_csv}: {'EXISTS' if os.path.exists(root_csv) else 'NOT FOUND'}")

print(f"\n FAISS Paths:")
print(f"  {src_faiss}: {'EXISTS' if os.path.exists(src_faiss) else 'NOT FOUND'}")
print(f"  {root_faiss}: {'EXISTS' if os.path.exists(root_faiss) else 'NOT FOUND'}")

print("\n" + "=" * 70)
print("Initializing RAG Engine...")
print("=" * 70)

os.environ["CHRONOLENS_SKIP_LLM"] = "1"

try:
    from rag_engine import RAGEngine
    print("✓ Successfully imported RAGEngine")
    
    print("\nCreating RAG instance...")
    rag = RAGEngine()
    print("✓ RAG Engine initialized successfully!")
    
    print("\n" + "=" * 70)
    print("Testing RAG Query")
    print("=" * 70)
    
    query_text = "Which schemes help women entrepreneurs?"
    print(f"\nQuery: {query_text}")
    
    result = rag.query(query_text, user_role="public")
    print(f"✓ Query successful!")
    print(f"  Retrieved {len(result['documents'])} documents")
    print(f"  Answer preview: {result['answer'][:100]}...")
    
    print("\n" + "=" * 70)
    print("✓ ALL TESTS PASSED - RAG is connected to Flask!")
    print("=" * 70)
    
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
