#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Test script for ChronoLens RAG Pipeline
Tests: loading CSV, building FAISS index, retrieval, and generation
"""

import sys
import os
import time

# Make src/ importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

def test_rag_pipeline():
    """Test the complete RAG pipeline."""
    print("=" * 80)
    print("ChronoLens RAG Pipeline Test")
    print("=" * 80)
    
    # Import the RAG module
    print("\n[1/5] Importing RAG module...")
    try:
        import rag_module
        print("✓ RAG module imported successfully")
    except Exception as e:
        print(f"✗ Failed to import RAG module: {e}")
        return False
    
    # Test CSV loading
    print("\n[2/5] Checking CSV file...")
    try:
        import pandas as pd
        csv_path = os.path.join(os.path.dirname(__file__), "src", "updated_data.csv")
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            print(f"✓ CSV file found: {len(df)} rows")
            print(f"  Columns: {', '.join(df.columns.tolist())}")
        else:
            print(f"✗ CSV file not found at {csv_path}")
            return False
    except Exception as e:
        print(f"✗ Failed to load CSV: {e}")
        return False
    
    # Initialize RAG module (build FAISS index)
    print("\n[3/5] Initializing RAG module (this may take a few minutes)...")
    try:
        start = time.time()
        rag_module._initialize()
        elapsed = time.time() - start
        print(f"✓ RAG module initialized successfully ({elapsed:.1f}s)")
    except Exception as e:
        print(f"✗ Failed to initialize RAG module: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test document retrieval
    print("\n[4/5] Testing document retrieval...")
    try:
        test_queries = [
            "Which schemes help women entrepreneurs?",
            "What education scholarships are available?",
            "Healthcare schemes for rural areas",
        ]
        
        for i, query in enumerate(test_queries, 1):
            print(f"\n  Query {i}: {query}")
            retrieved = rag_module.retrieve_documents(query, "public")
            print(f"  ✓ Retrieved {len(retrieved)} documents")
            
            if retrieved:
                top_doc = retrieved[0]
                print(f"    - Top result: {top_doc['title']}")
                print(f"      Relevance: {top_doc['relevance_score']}%")
                print(f"      Category: {top_doc['category']}")
    except Exception as e:
        print(f"✗ Failed to retrieve documents: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test answer generation
    print("\n[5/5] Testing answer generation...")
    try:
        query = "Which schemes help women entrepreneurs?"
        retrieved = rag_module.retrieve_documents(query, "public")
        answer = rag_module.generate_answer(query, retrieved, "public")
        
        print(f"✓ Answer generated successfully")
        print(f"\n  Query: {query}")
        print(f"  \nGenerated Answer:")
        print(f"  {answer[:300]}...")
    except Exception as e:
        print(f"✗ Failed to generate answer: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 80)
    print("✓ All tests passed!")
    print("=" * 80)
    return True

if __name__ == "__main__":
    success = test_rag_pipeline()
    sys.exit(0 if success else 1)
