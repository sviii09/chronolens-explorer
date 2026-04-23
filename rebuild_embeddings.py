#!/usr/bin/env python3
"""
rebuild_embeddings.py - Fix RAG retrieval by rebuilding FAISS index with proper embeddings

This script:
1. Ensures sentence-transformers is installed and working
2. Rebuilds the FAISS index with real embeddings (not dummy/all-zero vectors)
3. Clears the old broken index
4. Tests retrieval on a few queries

Run this if: "when I asked for schemes about women's entrepreneurships it gave me about fishermen"
This means DummyEmbeddings are being used (all queries return same results).
"""

import os
import sys
import shutil
import pandas as pd
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_embeddings():
    """Verify sentence-transformers is installed and working."""
    logger.info("Checking sentence-transformers installation...")
    try:
        from sentence_transformers import SentenceTransformer
        logger.info("✓ sentence-transformers is installed")
        
        # Try to load the model
        logger.info("Loading embedding model (all-MiniLM-L6-v2)...")
        model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
        
        # Test it returns non-zero vectors
        test_embed = model.encode("test query")
        if all(x == 0.0 for x in test_embed):
            raise ValueError("Model returned all-zero embeddings!")
        
        logger.info(f"✓ Embeddings working! Vector dimension: {len(test_embed)}")
        return True
    except Exception as e:
        logger.error(f"✗ Embeddings check failed: {e}")
        logger.error("Installing sentence-transformers...")
        os.system(f"{sys.executable} -m pip install sentence-transformers torch")
        return False

def rebuild_faiss_index():
    """Rebuild FAISS index with proper embeddings."""
    logger.info("\n" + "="*70)
    logger.info("REBUILDING FAISS INDEX WITH PROPER EMBEDDINGS")
    logger.info("="*70)
    
    # Add src to path
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))
    
    # Step 1: Backup old index
    faiss_path = os.path.join(os.path.dirname(__file__), "src", "govt_schemes_faiss")
    backup_path = faiss_path + ".backup"
    if os.path.exists(faiss_path):
        logger.info(f"Backing up old index to {backup_path}...")
        if os.path.exists(backup_path):
            shutil.rmtree(backup_path)
        shutil.copytree(faiss_path, backup_path)
        shutil.rmtree(faiss_path)
        logger.info("✓ Old index backed up and removed")
    
    # Step 2: Load CSV
    csv_path = os.path.join(os.path.dirname(__file__), "src", "updated_data.csv")
    logger.info(f"Loading schemes from {csv_path}...")
    df = pd.read_csv(csv_path)
    logger.info(f"✓ Loaded {len(df)} schemes")
    
    # Step 3: Initialize embeddings (will use proper HuggingFaceEmbeddings)
    logger.info("Initializing embeddings...")
    from langchain_community.embeddings import HuggingFaceEmbeddings
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    
    # Verify embeddings work
    test_embed = embeddings.embed_query("test")
    if all(x == 0.0 for x in test_embed):
        raise RuntimeError("CRITICAL: Embeddings still returning all-zero vectors after initialization!")
    logger.info(f"✓ Embeddings initialized (dimension: {len(test_embed)})")
    
    # Step 4: Create documents from CSV
    from langchain_core.documents import Document
    logger.info("Creating documents from CSV...")
    documents = []
    for idx, row in df.iterrows():
        if idx % 100 == 0:
            logger.info(f"  Processing row {idx}/{len(df)}")
        
        content = f"""Scheme Name: {row['scheme_name']}
Category: {row['schemeCategory']}
Level: {row['level']}
Tags: {row['tags']}

Details:
{row['details']}

Benefits:
{row['benefits']}

Eligibility:
{row['eligibility']}

Application Process:
{row['application']}

Required Documents:
{row['documents']}"""
        
        documents.append(
            Document(
                page_content=content.strip(),
                metadata={
                    "scheme_name": row["scheme_name"],
                    "category": row["schemeCategory"],
                    "level": row["level"],
                    "tags": str(row["tags"]),
                    "slug": str(row.get("slug", "")),
                },
            )
        )
    logger.info(f"✓ Created {len(documents)} documents")
    
    # Step 5: Split into chunks
    logger.info("Splitting documents into chunks...")
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=120)
    chunks = text_splitter.split_documents(documents)
    logger.info(f"✓ Split into {len(chunks)} chunks")
    
    # Step 6: Build FAISS index
    logger.info("Building FAISS index (this may take 2-5 minutes)...")
    from langchain_community.vectorstores import FAISS
    
    texts = [c.page_content for c in chunks]
    metadatas = [c.metadata for c in chunks]
    
    vectorstore = FAISS.from_texts(
        texts=texts,
        embedding=embeddings,
        metadatas=metadatas
    )
    logger.info("✓ FAISS index built")
    
    # Step 7: Save index
    logger.info(f"Saving FAISS index to {faiss_path}...")
    os.makedirs(faiss_path, exist_ok=True)
    vectorstore.save_local(faiss_path)
    logger.info(f"✓ Index saved successfully")
    
    return vectorstore, embeddings

def test_retrieval(vectorstore, embeddings):
    """Test retrieval with some queries to verify it works."""
    logger.info("\n" + "="*70)
    logger.info("TESTING RETRIEVAL")
    logger.info("="*70)
    
    test_queries = [
        "women entrepreneurs",
        "education scholarships",
        "fishermen schemes",
    ]
    
    for query in test_queries:
        logger.info(f"\nQuery: '{query}'")
        logger.info("-" * 50)
        
        # Retrieve documents
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
        docs = retriever.invoke(query)
        
        # Display results
        for i, doc in enumerate(docs, 1):
            meta = doc.metadata or {}
            scheme_name = meta.get("scheme_name", "Unknown")
            category = meta.get("category", "N/A")
            logger.info(f"  [{i}] {scheme_name} (Category: {category})")
            logger.info(f"       Preview: {doc.page_content[:100]}...")

def main():
    """Main function."""
    logger.info("ChronoLens - Rebuild Embeddings & FAISS Index")
    logger.info("=" * 70)
    
    # Step 1: Check embeddings
    if not check_embeddings():
        logger.error("Failed to set up embeddings. Please check your installation.")
        return False
    
    # Step 2: Rebuild FAISS
    try:
        vectorstore, embeddings = rebuild_faiss_index()
    except Exception as e:
        logger.error(f"Failed to rebuild FAISS index: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Step 3: Test retrieval
    try:
        test_retrieval(vectorstore, embeddings)
    except Exception as e:
        logger.error(f"Retrieval test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    logger.info("\n" + "="*70)
    logger.info("✓ SUCCESS: Embeddings rebuilt and tested!")
    logger.info("="*70)
    logger.info("\nNext steps:")
    logger.info("1. Restart the backend: python app.py")
    logger.info("2. Try searching for 'women entrepreneurs' again")
    logger.info("3. You should now get women entrepreneurship schemes, not fishermen schemes!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
