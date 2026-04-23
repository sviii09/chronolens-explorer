#!/usr/bin/env python3
"""
Fix script for ChronoLens RAG Pipeline
Diagnoses and fixes embedding/retrieval issues
"""

import sys
import os
import shutil

# Make src/ importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

def diagnose_issue():
    """Diagnose the RAG issue by checking embeddings and vector store."""
    print("🔍 Diagnosing RAG Pipeline Issues...")
    print("=" * 80)
    
    # Check 1: CSV file exists
    print("\n[1/5] Checking CSV file...")
    csv_path = os.path.join(os.path.dirname(__file__), "src", "updated_data.csv")
    if os.path.exists(csv_path):
        import pandas as pd
        df = pd.read_csv(csv_path)
        print(f"✓ CSV file found: {len(df)} rows")
    else:
        print(f"✗ CSV file not found at {csv_path}")
        return False
    
    # Check 2: HuggingFace embeddings availability
    print("\n[2/5] Checking HuggingFace embeddings...")
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        test_embed = embeddings.embed_query("test")
        
        # Check if embeddings are all zeros (indicator of dummy embeddings)
        if all(x == 0.0 for x in test_embed):
            print("⚠️  WARNING: HuggingFace embeddings loaded but returning all-zero vectors (DummyEmbeddings active)")
            print("   This causes RAG to return the same results for all queries!")
            return False
        else:
            print(f"✓ HuggingFace embeddings working properly ({len(test_embed)} dimensions)")
            return True
    except Exception as e:
        print(f"✗ HuggingFace embeddings failed to load: {e}")
        print("   This causes the fallback to DummyEmbeddings (all zero vectors)")
        return False

def rebuild_faiss_index():
    """Rebuild the FAISS index with proper embeddings."""
    print("\n🔨 Rebuilding FAISS Index with Proper Embeddings...")
    print("=" * 80)
    
    faiss_path = os.path.join(os.path.dirname(__file__), "src", "govt_schemes_faiss")
    
    # Backup existing index
    if os.path.exists(faiss_path):
        backup_path = faiss_path + ".backup"
        if os.path.exists(backup_path):
            shutil.rmtree(backup_path)
        shutil.copytree(faiss_path, backup_path)
        print(f"✓ Backed up existing index to {backup_path}")
        
        # Remove old index
        shutil.rmtree(faiss_path)
    
    # Force rebuild
    print("\nRemoving old index and cache...")
    
    # Import and reset the RAG module
    print("Importing RAG module...")
    import rag_module
    
    # Reset the module state
    print("Resetting RAG module state...")
    rag_module._initialized = False
    rag_module._vectorstore = None
    rag_module._embeddings = None
    rag_module._llm_pipeline = None
    
    # Force rebuild
    print("\nInitializing RAG module (rebuilding FAISS index)...")
    print("This will take 3-5 minutes on first run...")
    
    try:
        rag_module._initialize()
        print("✓ FAISS index rebuilt successfully!")
        
        # Test retrieval
        print("\nTesting retrieval with different queries...")
        test_queries = [
            "women entrepreneurs",
            "education scholarships",
            "healthcare schemes",
        ]
        
        previous_results = None
        for query in test_queries:
            docs = rag_module.retrieve_documents(query, "public")
            result_titles = [doc['title'] for doc in docs[:3]]
            print(f"\n  Query: '{query}'")
            print(f"  Top 3 results: {result_titles}")
            
            if previous_results == result_titles:
                print("  ⚠️  WARNING: Same results as previous query! Retrieval may still be broken.")
            previous_results = result_titles
        
        return True
        
    except Exception as e:
        print(f"✗ Failed to rebuild index: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("\n" + "=" * 80)
    print("ChronoLens RAG Pipeline Fixer")
    print("=" * 80)
    
    # Step 1: Diagnose
    issue_found = not diagnose_issue()
    
    if issue_found:
        print("\n💡 Issue detected: Embeddings are not working properly")
        print("   All queries return the same results because embeddings are all zeros.")
        
        # Step 2: Rebuild
        response = input("\nRebuild FAISS index with proper embeddings? (y/n): ").strip().lower()
        if response == 'y':
            if rebuild_faiss_index():
                print("\n✅ RAG pipeline fixed! Restart the server with: python app.py")
            else:
                print("\n❌ Failed to rebuild index. Check the error messages above.")
        else:
            print("Skipped rebuild. RAG will continue returning same results for all queries.")
    else:
        print("\n✅ RAG pipeline appears to be working correctly!")

if __name__ == "__main__":
    main()
