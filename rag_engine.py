# -*- coding: utf-8 -*-
"""
RAG Engine - Core retrieval and generation logic for ChronoLens.

This module encapsulates the RAG (Retrieval Augmented Generation) pipeline:
1. Load and chunk government schemes dataset
2. Build FAISS vector index with HuggingFace embeddings
3. Retrieve relevant documents using semantic search
4. Generate answers using Mistral-7B LLM
"""

import os
import sys
import logging
from typing import Optional, Dict, List, Any

import pandas as pd
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import embeddings
try:
    from langchain_community.embeddings import HuggingFaceEmbeddings
    EMBEDDINGS_AVAILABLE = True
except Exception as e:
    logger.warning(f"HuggingFaceEmbeddings not available: {e}")
    EMBEDDINGS_AVAILABLE = False

# Try to import LLM components
try:
    from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
    import torch
    LLM_AVAILABLE = True
except Exception as e:
    logger.warning(f"LLM components not available: {e}")
    LLM_AVAILABLE = False

# ============================================================================
# Constants
# ============================================================================

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
LLM_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"
CHUNK_SIZE = 600
CHUNK_OVERLAP = 120

ROLE_CONFIG = {
    "public": {"k": 3, "label": "Public"},
    "researcher": {"k": 7, "label": "Researcher"},
    "government_official": {"k": 10, "label": "Government Official"},
}

# ============================================================================
# RAG Engine
# ============================================================================

class RAGEngine:
    """Core RAG engine for retrieving government schemes and generating answers."""

    def __init__(self):
        """Initialize the RAG engine."""
        self.vectorstore = None
        self.embeddings = None
        self.llm_pipeline = None
        self.skip_llm = os.environ.get("CHRONOLENS_SKIP_LLM") in ("1", "true", "True")

        logger.info("Initializing RAG Engine...")
        self._initialize()
        logger.info("✓ RAG Engine initialized")

    def _initialize(self):
        """Initialize embeddings, FAISS index, and LLM."""
        # Step 1: Load embeddings
        logger.info("Loading embeddings model...")
        logger.info(f"Using model: {EMBEDDING_MODEL}")
        
        if not EMBEDDINGS_AVAILABLE:
            raise RuntimeError(
                "HuggingFaceEmbeddings is not available. "
                "Please ensure langchain-community is installed: pip install langchain-community"
            )
        
        try:
            # Create embeddings with proper configuration
            logger.info("Initializing HuggingFaceEmbeddings...")
            self.embeddings = HuggingFaceEmbeddings(
                model_name=EMBEDDING_MODEL,
                encode_kwargs={"normalize_embeddings": True},
                multi_process=False  # Disable multiprocessing to avoid issues
            )
            logger.info("✓ Embeddings model initialized")
            
            # Verify embeddings work with a test vector
            logger.info("Testing embeddings with sample query...")
            test_vector = self.embeddings.embed_query("test query")
            logger.info(f"✓ Embeddings working (dimension: {len(test_vector)})")
            
        except Exception as e:
            logger.error(f"✗ Failed to initialize embeddings: {e}", exc_info=True)
            raise RuntimeError(f"Embeddings initialization failed: {e}")

        # Step 2: Load or build FAISS index
        logger.info("Loading FAISS vector database...")
        # Try multiple locations: src/ directory first, then root
        faiss_paths = [
            os.path.join(os.path.dirname(__file__), "src", "govt_schemes_faiss"),
            os.path.join(os.path.dirname(__file__), "govt_schemes_faiss")
        ]
        faiss_path = None
        for path in faiss_paths:
            if os.path.exists(path):
                faiss_path = path
                logger.info(f"Found FAISS index at: {path}")
                break
        
        if faiss_path:
            logger.info(f"Loading existing FAISS index...")
            try:
                self.vectorstore = FAISS.load_local(
                    faiss_path,
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                logger.info(f"✓ FAISS index loaded successfully")
            except Exception as e:
                logger.error(f"✗ Failed to load FAISS index: {e}", exc_info=True)
                logger.warning("Will attempt to rebuild FAISS index...")
                faiss_path = os.path.join(os.path.dirname(__file__), "src", "govt_schemes_faiss")
                try:
                    self.vectorstore = self._build_vectorstore(faiss_path)
                except Exception as build_error:
                    logger.error(f"✗ Failed to build FAISS index: {build_error}", exc_info=True)
                    raise RuntimeError(f"Cannot build FAISS index: {build_error}")
        else:
            logger.info("No existing FAISS index found. Building new index from dataset...")
            # Use src directory for new FAISS index
            faiss_path = os.path.join(os.path.dirname(__file__), "src", "govt_schemes_faiss")
            try:
                self.vectorstore = self._build_vectorstore(faiss_path)
            except Exception as build_error:
                logger.error(f"✗ Failed to build FAISS index: {build_error}", exc_info=True)
                raise RuntimeError(f"Cannot build FAISS index: {build_error}")

        # Step 3: Load LLM (optional)
        if not self.skip_llm:
            logger.info("Loading LLM pipeline...")
            if not LLM_AVAILABLE:
                logger.warning("LLM components (transformers/torch) not available")
                logger.warning("Falling back to extractive summaries")
                self.llm_pipeline = None
            else:
                try:
                    self._load_llm()
                    logger.info("✓ LLM pipeline loaded")
                except Exception as e:
                    logger.warning(f"Could not load LLM: {e}")
                    logger.warning("Falling back to extractive summaries")
                    self.llm_pipeline = None
        else:
            logger.info("LLM disabled via CHRONOLENS_SKIP_LLM")

    def _build_vectorstore(self, save_path: str) -> FAISS:
        """Build FAISS index from CSV dataset."""
        # Load dataset
        # Try multiple locations: src/ directory first, then root
        possible_paths = [
            os.path.join(os.path.dirname(__file__), "src", "updated_data.csv"),
            os.path.join(os.path.dirname(__file__), "updated_data.csv"),
        ]
        csv_path = None
        for path in possible_paths:
            if os.path.exists(path):
                csv_path = path
                break
        
        if not csv_path:
            raise FileNotFoundError(f"Dataset CSV not found in any of: {possible_paths}")

        logger.info(f"Loading dataset from {csv_path}")
        df = pd.read_csv(csv_path)
        df = df.drop(columns=[c for c in df.columns if "Unnamed" in c], errors="ignore")
        logger.info(f"✓ Dataset loaded: {len(df)} schemes")

        # Create documents
        documents = self._create_documents(df)
        logger.info(f"✓ Created {len(documents)} documents")

        # Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP
        )
        chunks = text_splitter.split_documents(documents)
        logger.info(f"✓ Split into {len(chunks)} chunks")

        # Build FAISS index
        logger.info("Building FAISS index (this may take 2-5 minutes)...")
        texts = [c.page_content for c in chunks]
        metadatas = [c.metadata for c in chunks]

        vectorstore = FAISS.from_texts(
            texts=texts,
            embedding=self.embeddings,
            metadatas=metadatas
        )

        # Save index
        os.makedirs(save_path, exist_ok=True)
        vectorstore.save_local(save_path)
        logger.info(f"✓ FAISS index saved to {save_path}")

        return vectorstore

    @staticmethod
    def _create_documents(df: pd.DataFrame) -> List[Document]:
        """Create LangChain documents from DataFrame."""
        documents = []
        for _, row in df.iterrows():
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
        return documents

    def _load_llm(self):
        """Load Mistral-7B LLM pipeline."""
        if not LLM_AVAILABLE:
            raise RuntimeError("LLM components (transformers/torch) are not available")
        
        logger.info("Loading tokenizer and model...")
        try:
            tokenizer = AutoTokenizer.from_pretrained(LLM_MODEL)
            model = AutoModelForCausalLM.from_pretrained(
                LLM_MODEL,
                torch_dtype=torch.float16,
                device_map="auto"
            )

            hf_pipeline = pipeline(
                "text-generation",
                model=model,
                tokenizer=tokenizer,
                max_new_tokens=400,
                temperature=0.1,
                do_sample=False
            )

            from langchain_community.llms import HuggingFacePipeline
            self.llm_pipeline = HuggingFacePipeline(pipeline=hf_pipeline)
        except Exception as e:
            logger.error(f"Failed to load LLM: {e}", exc_info=True)
            raise

    def query(
        self,
        query_text: str,
        user_role: str = "public",
        time_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute RAG query.

        Args:
            query_text: User's natural language query
            user_role: One of 'public', 'researcher', 'government_official'
            time_filter: Optional date filter (placeholder for future use)

        Returns:
            Dict with 'documents' and 'answer' keys
        """
        try:
            role_cfg = ROLE_CONFIG.get(user_role, ROLE_CONFIG["public"])
            k = role_cfg["k"]

            # Retrieve documents
            logger.info(f"Retrieving top {k} documents for: {query_text[:50]}...")
            retriever = self.vectorstore.as_retriever(search_kwargs={"k": k})
            raw_docs = retriever.invoke(query_text)

            # Format documents
            documents = []
            for i, doc in enumerate(raw_docs):
                meta = doc.metadata or {}
                relevance_score = max(99 - i * 8, 30)  # Simulated score

                documents.append({
                "id": f"doc-{i + 1}",
                "title": meta.get("scheme_name", f"Document {i + 1}"),
                "category": meta.get("category", "General"),
                "source": f"Indian Government Schemes (Level: {meta.get('level', 'N/A')})",
                "excerpt": doc.page_content[:200] + "…",
                "relevance_score": relevance_score,
                "matched_chunk": doc.page_content[:500],
                "tags": meta.get("tags", ""),
                "level": meta.get("level", ""),
                "slug": meta.get("slug", ""),
            })

            # Generate answer
            answer = self._generate_answer(query_text, raw_docs, user_role)

            return {
                "documents": documents,
                "answer": answer
            }
            
        except Exception as e:
            logger.error(f"Query execution failed: {e}", exc_info=True)
            raise

    def _generate_answer(self, query: str, docs: List[Document], user_role: str) -> str:
        """Generate answer from retrieved documents."""
        if not docs:
            return "No relevant documents were found for your query."

        try:
            role_label = ROLE_CONFIG.get(user_role, ROLE_CONFIG["public"])["label"]
            context = "\n\n---\n\n".join(
                f"[{i + 1}] {doc.metadata.get('scheme_name', f'Scheme {i+1}')}\n{doc.page_content[:400]}"
                for i, doc in enumerate(docs[:5])
            )

            # Use LLM if available
            if self.llm_pipeline:
                try:
                    from langchain_core.prompts import ChatPromptTemplate
                    from langchain_core.output_parsers import StrOutputParser

                    prompt_template = """You are ChronoLens, an AI assistant for analyzing Indian government policy schemes.
Answer the user's question using ONLY the provided context. Cite sources as [1], [2], etc.
Access level: {role}

Context:
{context}

Question:
{question}

Provide a clear, structured answer (3-5 sentences) citing specific schemes where relevant."""

                    prompt = ChatPromptTemplate.from_template(prompt_template)
                    chain = prompt | self.llm_pipeline | StrOutputParser()

                    answer = chain.invoke({
                        "context": context,
                        "question": query,
                        "role": role_label
                    })
                    logger.info(f"✓ Generated answer using LLM ({len(answer)} chars)")
                    return answer
                except Exception as e:
                    logger.warning(f"LLM generation failed: {e}, falling back to extractive()")

            # Fallback to extractive summary
            lines = [f"[{role_label} view] Based on {len(docs)} retrieved scheme(s):\n"]
            for i, doc in enumerate(docs[:3], 1):
                scheme_name = doc.metadata.get("scheme_name", f"Scheme {i}")
                preview = doc.page_content[:150]
                lines.append(f"[{i}] **{scheme_name}**: {preview}...")

            lines.append("\n*(Using extractive summary mode)*")
            answer = "\n\n".join(lines)
            logger.info(f"✓ Generated extractive answer ({len(answer)} chars)")
            return answer
            
        except Exception as e:
            logger.error(f"Failed to generate answer: {e}", exc_info=True)
            # Ultimate fallback
            return f"Based on {len(docs)} retrieved documents, the system found relevant government schemes for your query."
