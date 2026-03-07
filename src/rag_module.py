# -*- coding: utf-8 -*-
"""
rag_module.py — ChronoLens RAG Module
Importable version of the RAG pipeline from rag.py (originally a Colab notebook).
Uses: LangChain, FAISS, HuggingFace Embeddings, Mistral-7B (via transformers pipeline).
Dataset: jainamgada45/indian-government-schemes (loaded via KaggleDatasetAdapter.PANDAS)

Functions:
    retrieve_documents(query, user_role, time_filter=None) -> list[dict]
    generate_answer(query, retrieved_docs, user_role) -> str
"""

import os
import logging
from typing import Optional
import warnings

# Suppress deprecation warnings for cleaner output
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=UserWarning, message=".*Pydantic V1.*")
warnings.filterwarnings("ignore", message=".*HuggingFaceEmbeddings.*deprecated.*")

# workaround for LangChain callback manager bug in newer versions where
# `langchain.debug` attribute no longer exists.  Some components call
# ``langchain.debug`` during CallbackManager.configure(), which crashes with
# AttributeError when it's missing.  Set a default value here so retrieval
# works even with mismatched package versions.
try:
    import langchain
    if not hasattr(langchain, "debug"):
        langchain.debug = False
except ImportError:
    pass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Role-based access: maps role → max number of docs returned, label shown
# ---------------------------------------------------------------------------
ROLE_CONFIG = {
    "public": {
        "k": 3,
        "label": "Public",
        "note": "General access — top 3 results shown.",
    },
    "researcher": {
        "k": 7,
        "label": "Researcher",
        "note": "Enhanced access — top 7 results with full chunks.",
    },
    "government_official": {
        "k": 10,
        "label": "Government Official",
        "note": "Full access — top 10 results with all metadata.",
    },
}

# ---------------------------------------------------------------------------
# Lazy-loaded singletons (loaded once on first call, not at import time)
# ---------------------------------------------------------------------------
_embeddings = None
_vectorstore = None
_llm_pipeline = None
_initialized = False


def _initialize():
    """Load embeddings, FAISS index, and LLM pipeline (once, on first use)."""
    global _embeddings, _vectorstore, _llm_pipeline, _initialized

    if _initialized:
        return

    # -- 1. Embeddings --
    logger.info("Loading HuggingFace embeddings…")
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings

        _embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    except Exception as exc:
        logger.exception(
            "Failed to load HuggingFace embeddings, falling back to dummy. %s",
            str(exc),
        )

        # Fallback: a minimal Embeddings-like object implementing the
        # methods used by the vectorstore (`embed_documents`, `embed_query`),
        # and also acting as a callable so older code paths that assume
        # ``embedding_function(text)`` still work.  We avoid any torch
        # dependencies here so failure to load the real model doesn't crash
        # the service.
        class DummyEmbeddings:
            """Dummy embeddings returning zero vectors for any input."""

            def __init__(self, dim: int = 384):
                self.dim = dim

            def embed_documents(self, texts):
                return [[0.0] * self.dim for _ in texts]

            def embed_query(self, text):
                return [0.0] * self.dim

            def __call__(self, texts):
                # support being used as a function by Faiss internals
                if isinstance(texts, str):
                    return self.embed_query(texts)
                return self.embed_documents(texts)

        _embeddings = DummyEmbeddings()

    # -- 2. FAISS vector store --
    faiss_path = os.path.join(os.path.dirname(__file__), "govt_schemes_faiss")
    from langchain_community.vectorstores import FAISS

    if os.path.exists(faiss_path):
        logger.info("Loading existing FAISS index from '%s'…", faiss_path)
        _vectorstore = FAISS.load_local(
            faiss_path, _embeddings, allow_dangerous_deserialization=True
        )
    else:
        logger.warning(
            "FAISS index not found at '%s'. Building from dataset…", faiss_path
        )
        # If a local CSV is available use it; otherwise fall back to Kaggle or mock.
        try:
            _vectorstore = _build_and_save_vectorstore(faiss_path)
        except Exception:
            logger.exception("Failed to construct FAISS index from dataset; falling back to mock data.")
            _vectorstore = _build_mock_vectorstore()

    # -- 3. LLM pipeline (Mistral-7B) --
    # Allow skipping heavy LLM initialization (useful for local dev or low-memory
    # environments). Set environment variable `CHRONOLENS_SKIP_LLM=1` to force
    # extractive-only mode and avoid loading large model checkpoints.
    logger.info("Preparing LLM pipeline (skip if CHRONOLENS_SKIP_LLM set)…")
    skip_llm = os.environ.get("CHRONOLENS_SKIP_LLM") in ("1", "true", "True", "TRUE")
    if skip_llm:
        logger.warning("CHRONOLENS_SKIP_LLM is set — skipping LLM pipeline (extractive-only).")
        _llm_pipeline = None
    else:
        try:
            import torch
            from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
            from langchain_community.llms import HuggingFacePipeline

            model_id = "mistralai/Mistral-7B-Instruct-v0.2"
            tokenizer = AutoTokenizer.from_pretrained(model_id)
            model = AutoModelForCausalLM.from_pretrained(
                model_id,
                torch_dtype=torch.float16,
                device_map="auto",
            )
            hf_pipe = pipeline(
                "text-generation",
                model=model,
                tokenizer=tokenizer,
                max_new_tokens=400,
                temperature=0.1,
                do_sample=False,
            )
            _llm_pipeline = HuggingFacePipeline(pipeline=hf_pipe)
            logger.info("LLM pipeline ready.")
        except Exception as exc:
            logger.error("Could not load LLM pipeline: %s", exc)
            logger.warning("Falling back to extractive summary (no generation).")
            _llm_pipeline = None

    _initialized = True


def _build_and_save_vectorstore(save_path: str):
    """Load the dataset, chunk it, embed it, and persist FAISS.

    The function now prefers a local CSV file named ``updated_data.csv`` located
    in the same directory as this module.  If that file is missing it will fall
    back to downloading the original Kaggle dataset (requires credentials).
    If neither source is available it will raise an exception which is handled
    by the caller to use a mock vectorstore.
    """
    import pandas as pd
    from langchain_core.documents import Document
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    from langchain_community.vectorstores import FAISS

    # allow override via environment variable for portability
    env_path = os.environ.get("CHRONOLENS_DATA_CSV")
    if env_path:
        local_csv = env_path
    else:
        local_csv = os.path.join(os.path.dirname(__file__), "updated_data.csv")

    if os.path.exists(local_csv):
        logger.info("Loading dataset from CSV '%s'…", local_csv)
        df = pd.read_csv(local_csv)
        df = df.drop(columns=[c for c in df.columns if "Unnamed" in c], errors="ignore")
        
        # For faster initialization in test/dev mode, support limiting documents
        max_rows = os.environ.get("CHRONOLENS_MAX_ROWS")
        if max_rows:
            max_rows = int(max_rows)
            df = df.head(max_rows)
            logger.info("Limited to %d rows (fast mode)", max_rows)
        
        logger.info("Local dataset loaded: %d rows, columns: %s", len(df), list(df.columns))
    else:
        # fallback to Kaggle
        logger.info("Local CSV not found; attempting to download Kaggle dataset…")
        import kagglehub
        from kagglehub import KaggleDatasetAdapter

        if not os.environ.get("KAGGLE_USERNAME") or not os.environ.get("KAGGLE_KEY"):
            raise RuntimeError("Kaggle credentials missing and local CSV not available")

        df = kagglehub.load_dataset(
            KaggleDatasetAdapter.PANDAS,
            "jainamgada45/indian-government-schemes",
            "",  # empty string → load the default/first file in the dataset
        )
        df = df.drop(columns=[c for c in df.columns if "Unnamed" in c], errors="ignore")
        logger.info("Dataset downloaded from Kaggle: %d rows, columns: %s", len(df), list(df.columns))

    documents = []
    for _, row in df.iterrows():
        content = (
            f"Scheme Name: {row['scheme_name']}\n"
            f"Category: {row['schemeCategory']}\n"
            f"Level: {row['level']}\n"
            f"Tags: {row['tags']}\n\n"
            f"Details:\n{row['details']}\n\n"
            f"Benefits:\n{row['benefits']}\n\n"
            f"Eligibility:\n{row['eligibility']}\n\n"
            f"Application Process:\n{row['application']}\n\n"
            f"Required Documents:\n{row['documents']}"
        )
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

    splitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=120)
    chunks = splitter.split_documents(documents)

    logger.info("Building FAISS index from %d chunks…", len(chunks))
    texts = [c.page_content for c in chunks]
    metadatas = [c.metadata for c in chunks]
    vectorstore = FAISS.from_texts(texts=texts, embedding=_embeddings, metadatas=metadatas)
    vectorstore.save_local(save_path)
    logger.info("FAISS index saved to '%s'.", save_path)
    return vectorstore



def _build_mock_vectorstore():
    """Create a tiny in-memory vectorstore with hardcoded example documents.

    This avoids connecting to Kaggle or downloading large datasets during
    early development or when credentials are missing.
    """
    from langchain_core.documents import Document
    from langchain_community.vectorstores import FAISS

    logger.info("Building mock FAISS vectorstore with sample documents.")
    sample_texts = [
        "Scheme Name: Education Scholarship\nCategory: Education\nLevel: National\nDetails: Financial aid for students.",
        "Scheme Name: Women Entrepreneurship\nCategory: Womens\nLevel: State\nDetails: Grants for women starting businesses.",
    ]
    sample_meta = [
        {"scheme_name": "Education Scholarship", "category": "education", "level": "national", "tags": "scholarship"},
        {"scheme_name": "Women Entrepreneurship", "category": "womens", "level": "state", "tags": "women,business"},
    ]

    docs = [Document(page_content=t, metadata=m) for t, m in zip(sample_texts, sample_meta)]
    vectorstore = FAISS.from_documents(docs, _embeddings)
    return vectorstore

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def retrieve_documents(
    query: str,
    user_role: str,
    time_filter: Optional[str] = None,
) -> list[dict]:
    """
    Retrieve top-k relevant document chunks for *query* based on *user_role*.

    A workaround is applied here to guard against a bug in recent versions
    of LangChain where ``langchain.debug`` is missing.  The callback manager
    invoked by FAISS retrieval checks this attribute, so we ensure it exists
    before proceeding.

    Args:
        query:       Natural language query string.
        user_role:   One of 'public', 'researcher', 'government_official'.
                     Controls how many results are returned.
        time_filter: Optional ISO date string (YYYY-MM-DD) - placeholder for
                     future date-range filtering; not yet applied.

    Returns:
        List of dicts, each with keys:
            id, title, category, source, excerpt, relevance_score, matched_chunk,
            tags, level, slug
    """
    # ensure debug flag exists to prevent AttributeError during retrieval
    try:
        import langchain
        if not hasattr(langchain, "debug"):
            langchain.debug = False
    except ImportError:
        pass
    _initialize()

    # debugging: log what embedding object we have and what the vectorstore
    # currently thinks its embedding function is.  This helps diagnose why
    # we sometimes end up with a plain function that lacks the expected
    # methods.
    try:
        logger.debug("_embeddings type: %s", type(_embeddings))
        if _vectorstore is not None:
            logger.debug("vectorstore.embedding_function type: %s", type(_vectorstore.embedding_function))
    except Exception:
        pass

    role_cfg = ROLE_CONFIG.get(user_role, ROLE_CONFIG["public"])
    k = role_cfg["k"]

    retriever = _vectorstore.as_retriever(search_kwargs={"k": k})
    raw_docs = retriever.invoke(query)

    results = []
    for i, doc in enumerate(raw_docs):
        meta = doc.metadata or {}
        # Simple descending relevance placeholder (FAISS returns by distance but
        # LangChain's .invoke() doesn't expose raw scores; we simulate here)
        relevance_score = max(99 - i * 8, 30)

        results.append(
            {
                "id": f"rag-doc-{i + 1}",
                "title": meta.get("scheme_name", f"Document {i + 1}"),
                "category": meta.get("category", "general"),
                "source": f"Indian Government Schemes (Level: {meta.get('level', 'N/A')})",
                "excerpt": doc.page_content[:200] + "…",
                "relevance_score": relevance_score,
                "matched_chunk": doc.page_content[:500],
                "tags": meta.get("tags", ""),
                "level": meta.get("level", ""),
                "slug": meta.get("slug", ""),
            }
        )

    return results


def generate_answer(
    query: str,
    retrieved_docs: list[dict],
    user_role: str,
) -> str:
    """
    Generate a synthesised answer from *retrieved_docs* for *query*.

    If the LLM pipeline is unavailable (e.g., GPU missing / model not downloaded),
    falls back to an extractive summary built from the top document excerpts.

    Args:
        query:          Original user query.
        retrieved_docs: Output of retrieve_documents().
        user_role:      Role label included in the answer preamble.

    Returns:
        Answer string (may be generated or extractive).
    """
    _initialize()

    if not retrieved_docs:
        return "No relevant documents were found for your query."

    role_label = ROLE_CONFIG.get(user_role, ROLE_CONFIG["public"])["label"]
    context = "\n\n---\n\n".join(
        f"[{i + 1}] {doc['title']}\n{doc['matched_chunk']}"
        for i, doc in enumerate(retrieved_docs[:5])
    )

    # -- Generative path --
    if _llm_pipeline is not None:
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser

        # build prompt using ordinary string concatenation to avoid any
        # triple-quote mismatches that were causing import-time syntax errors
        prompt_text = (
            "You are ChronoLens, an AI assistant for analysing Indian government policy schemes.\n"
            "Answer the question using ONLY the provided context. Cite sources as [1], [2], etc.\n"
            "Access level: {role}\n\n"
            "Context:\n"
            "{context}\n\n"
            "Question:\n"
            "{question}\n\n"
            "Provide a clear, structured answer (3-5 sentences) citing specific schemes where relevant."
        )
        prompt = ChatPromptTemplate.from_template(prompt_text)
        chain = prompt | _llm_pipeline | StrOutputParser()
        return chain.invoke({"context": context, "question": query, "role": role_label})

    # -- Extractive fallback path --
    lines = [
        f"[{role_label} view] Based on {len(retrieved_docs)} retrieved scheme(s):\n"
    ]
    for i, doc in enumerate(retrieved_docs[:3], 1):
        lines.append(f"[{i}] **{doc['title']}**: {doc['excerpt']}")
    lines.append(
        "\n*(Generative summary unavailable — Mistral-7B pipeline not loaded. "
        "Ensure GPU is available and the model is downloaded.)*"
    )
    return "\n\n".join(lines)
