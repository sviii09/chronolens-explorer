#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Pre-builder for FAISS index
Builds the vector store in advance to avoid long wait on first query
"""

import os
import sys
import time
import argparse

# Make src/ importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

def build_faiss_index(max_rows=None, skip_llm=False):
    """Build and save the FAISS index."""
    
    print("=" * 70)
    print("ChronoLens FAISS Index Builder")
    print("=" * 70)
    print()
    
    # Apply environment settings
    if max_rows:
        os.environ['CHRONOLENS_MAX_ROWS'] = str(max_rows)
        print(f"[*] Limiting to {max_rows} rows")
    
    if skip_llm:
        os.environ['CHRONOLENS_SKIP_LLM'] = '1'
        print("[*] Skipping LLM initialization")
    
    print()
    print("[1/3] Importing RAG module...")
    try:
        import rag_module
        print("[✓] RAG module imported")
    except Exception as e:
        print(f"[✗] Failed to import: {e}")
        return False
    
    print()
    print("[2/3] Initializing RAG module (building FAISS index)...")
    print("      This may take 1-5 minutes depending on dataset size...")
    print()
    
    try:
        start = time.time()
        rag_module._initialize()
        elapsed = time.time() - start
        print(f"[✓] Initialization complete ({elapsed:.1f}s)")
    except Exception as e:
        print(f"[✗] Initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print()
    print("[3/3] Verifying vectorstore...")
    try:
        # Test retrieval
        test_query = "education scholarship"
        docs = rag_module.retrieve_documents(test_query, "public")
        print(f"[✓] Vectorstore working: Retrieved {len(docs)} documents")
        
        if docs:
            print(f"    Top result: {docs[0]['title']}")
            print(f"    Relevance: {docs[0]['relevance_score']}%")
    except Exception as e:
        print(f"[✗] Vectorstore test failed: {e}")
        return False
    
    print()
    print("=" * 70)
    print("[✓] FAISS index successfully built and saved!")
    print("=" * 70)
    print()
    print("You can now run the backend without long initialization:")
    print("  python app.py")
    print()
    
    return True

def main():
    parser = argparse.ArgumentParser(
        description='Pre-build FAISS Index for ChronoLens',
        epilog="""
Examples:
  # Build full index (all rows)
  python build_index.py

  # Build fast index (200 rows)
  python build_index.py --max-rows 200

  # Build without LLM
  python build_index.py --skip-llm

Examples:
  python build_index.py --max-rows 500 --skip-llm
        """
    )
    
    parser.add_argument(
        '--max-rows',
        type=int,
        default=None,
        help='Limit to N rows (for testing)'
    )
    
    parser.add_argument(
        '--skip-llm',
        action='store_true',
        help='Skip LLM pipeline'
    )
    
    args = parser.parse_args()
    
    success = build_faiss_index(
        max_rows=args.max_rows,
        skip_llm=args.skip_llm
    )
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
