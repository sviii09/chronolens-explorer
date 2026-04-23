#!/usr/bin/env python3
"""
Fix for RAG returning same results - fixes embeddings and rebuilds FAISS index
"""

import sys
import os
import shutil
import subprocess

def check_and_install_dependencies():
    """Ensure all required packages are installed."""
    print("\n🔧 Checking and installing dependencies...")
    
    required_packages = [
        "sentence-transformers",
        "langchain-community",
        "langchain-core",
        "faiss-cpu",
        "torch",
        "transformers",
        "pandas",
    ]
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print(f"  ✓ {package} is installed")
        except ImportError:
            print(f"  ⚠️  Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", package])
            print(f"  ✓ {package} installed")
    
    print("✓ All dependencies ready")


def fix_rag_embeddings():
    """Fix RAG embeddings issue by rebuilding FAISS index."""
    print("\n" + "=" * 80)
    print("🐛 RAG Embeddings Fix")
    print("=" * 80)
    
    # Step 1: Ensure dependencies
    try:
        check_and_install_dependencies()
    except Exception as e:
        print(f"\n❌ Failed to install dependencies: {e}")
        print("Please run: pip install -r requirements.txt")
        return False
    
    # Step 2: Remove old FAISS index
    print("\n🗑️  Cleaning up old FAISS index...")
    faiss_path = os.path.join(os.path.dirname(__file__), "src", "govt_schemes_faiss")
    
    if os.path.exists(faiss_path):
        try:
            shutil.rmtree(faiss_path)
            print(f"  ✓ Removed {faiss_path}")
        except Exception as e:
            print(f"  ⚠️  Failed to remove FAISS index: {e}")
    
    # Step 3: Rebuild
    print("\n🔨 Rebuilding FAISS index (this takes 3-5 minutes)...")
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))
    
    try:
        import rag_module
        
        # Reset module state
        rag_module._initialized = False
        rag_module._vectorstore = None
        rag_module._embeddings = None
        rag_module._llm_pipeline = None
        
        # Force initialization and rebuild
        print("  - Loading embeddings...")
        rag_module._initialize()
        
        # Verify embeddings are NOT DummyEmbeddings
        if hasattr(rag_module._embeddings, '__class__'):
            class_name = rag_module._embeddings.__class__.__name__
            print(f"  ✓ Using: {class_name}")
            
            if class_name == "DummyEmbeddings":
                print("\n  ⚠️  ERROR: Still using DummyEmbeddings!")
                print("  This means HuggingFace embeddings failed to load.")
                print("\n  To fix:")
                print("  1. Check your internet connection")
                print("  2. Ensure torch and transformers are installed")
                print("  3. Run: pip install sentence-transformers")
                return False
        
        # Test retrieval
        print("\n  - Testing retrieval...")
        test_queries = [
            "women entrepreneurs",
            "education scholarships", 
            "healthcare schemes",
            "agriculture assistance",
            "skill development",
        ]
        
        results_cache = {}
        for query in test_queries:
            docs = rag_module.retrieve_documents(query, "public")
            result_titles = tuple([doc['title'] for doc in docs[:3]])
            results_cache[query] = result_titles
            print(f"    '{query[:30]}...' → {result_titles[0] if result_titles else 'no results'}")
        
        # Check if all results are the same (still broken)
        unique_results = set(results_cache.values())
        if len(unique_results) == 1:
            print("\n  ❌ ERROR: All queries return identical results!")
            print("     The FAISS index is still broken.")
            return False
        
        print("\n✅ RAG pipeline fixed successfully!")
        print("   Different queries now return different results.")
        return True
        
    except Exception as e:
        print(f"\n❌ Failed to rebuild FAISS: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("ChronoLens RAG Issue Fix")
    print("Problem: RAG returns same results for all queries")
    print("Cause: Embeddings are failing, using all-zero fallback vectors")
    print("=" * 80)
    
    success = fix_rag_embeddings()
    
    if success:
        print("\n" + "=" * 80)
        print("✅ Fix Complete!")
        print("=" * 80)
        print("\nNext steps:")
        print("1. Restart the backend: python app.py")
        print("2. Try different queries - they should return different results")
        print("3. If issues persist, check the logs in app.py output")
    else:
        print("\n" + "=" * 80)
        print("❌ Fix Failed")
        print("=" * 80)
        print("\nTroubleshooting:")
        print("1. Ensure all requirements are installed: pip install -r requirements.txt")
        print("2. Check Python version (should be 3.11+)")
        print("3. Check internet connection (for downloading models)")
        sys.exit(1)
