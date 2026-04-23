# RAG Issue Fix: Same Results for All Queries

## Problem
The RAG (Retrieval-Augmented Generation) system was returning the same results regardless of the query. For example, querying "women entrepreneurs" returned the exact same documents as querying "healthcare schemes".

## Root Cause
The issue was caused by **embeddings falling back to DummyEmbeddings**:

1. When `HuggingFaceEmbeddings` failed to load (due to missing dependencies like `torch` or `sentence-transformers`), the code fell back to `DummyEmbeddings`
2. `DummyEmbeddings` returns all-zero vectors: `[0.0, 0.0, 0.0, ...]` for every input
3. When FAISS performs similarity search using all-zero vectors, every query has the exact same distance to all documents
4. Therefore, FAISS returns the same K documents (usually the first K in the index) for every query

## Code Location
The problematic fallback is in [src/rag_module.py](src/rag_module.py#L79-L108):

```python
try:
    from langchain_community.embeddings import HuggingFaceEmbeddings
    _embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
except Exception as exc:
    logger.exception("Failed to load HuggingFace embeddings, falling back to dummy...")
    # Falls back to DummyEmbeddings which returns [0.0, 0.0, ...]
    class DummyEmbeddings:
        def embed_query(self, text):
            return [0.0] * self.dim  # ← All zeros!
```

## Solution
Run the fix script to:
1. Delete the old FAISS index (which was built with all-zero vectors)
2. Ensure required dependencies are installed
3. Rebuild the FAISS index with proper embeddings

### Quick Fix
```bash
# Option 1: Run the automatic fix script
python rebuild_rag.py

# Option 2: Manual rebuild
# 1. Delete old index
rm -rf src/govt_schemes_faiss

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run the test (it will rebuild on first access)
python test_rag_pipeline.py
```

### For Production
Ensure these packages are in `requirements.txt`:
- `torch` - PyTorch for deep learning models
- `transformers` - Hugging Face model library
- `sentence-transformers` - Pre-trained sentence embeddings
- `langchain-community` - LangChain integrations
- `faiss-cpu` - Facebook's similarity search library

## Prevention
To prevent this issue in the future:

1. **Strict dependency checking**: Modify `_initialize()` to raise an error if embeddings fail instead of silently falling back
2. **Better logging**: Log when DummyEmbeddings are used
3. **Docker/container**: Use containerization to ensure dependencies are installed correctly
4. **CI/CD testing**: Add automated tests that verify embeddings work before deployment

## Example: Better Error Handling
```python
def _initialize():
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        _embeddings = HuggingFaceEmbeddings(...)
        # Verify embeddings work
        test = _embeddings.embed_query("test")
        if all(x == 0.0 for x in test):
            raise RuntimeError("Embeddings returned all zeros!")
    except Exception as e:
        logger.critical("FATAL: Embeddings unavailable! RAG will not work correctly.")
        logger.critical(f"Error: {e}")
        logger.critical("Install: pip install torch sentence-transformers")
        raise  # Don't silently fall back!
```

## Verification
After applying the fix, verify that different queries return different results:

```python
import rag_module
docs1 = rag_module.retrieve_documents("women entrepreneurs", "public")
docs2 = rag_module.retrieve_documents("healthcare", "public")

# These titles should be DIFFERENT
print(docs1[0]['title'])  # Should be about women schemes
print(docs2[0]['title'])  # Should be about healthcare
```

## Related Files
- [src/rag_module.py](src/rag_module.py) - RAG implementation
- [app.py](app.py) - Flask backend that calls the RAG module
- [src/api/client.ts](src/api/client.ts) - Frontend that queries the backend
- [test_rag_pipeline.py](test_rag_pipeline.py) - Test script to validate RAG
