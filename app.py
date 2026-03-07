# -*- coding: utf-8 -*-
"""
app.py — ChronoLens Flask Backend
Connects the React frontend to the RAG pipeline defined in src/rag_module.py.

Endpoints:
    GET  /health         → system health check
    POST /query          → RAG query (retrieve + generate)
    GET  /roles          → available user roles

Usage:
    python app.py

CORS is enabled for all origins (local dev only).
"""

import sys
import os
import time
import logging

# Make src/ importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from flask import Flask, request, jsonify
from flask_cors import CORS

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app)  # Allow all origins for local development

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy-import the RAG module so Flask starts instantly; models load on first
# real query (initialisation can take 30-120 s on first run).
# ---------------------------------------------------------------------------
_rag = None


def get_rag():
    global _rag
    if _rag is None:
        import rag_module
        _rag = rag_module
    return _rag


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/health", methods=["GET"])
def health():
    """Lightweight liveness probe — does NOT trigger model loading."""
    return jsonify(
        {
            "status": "ok",
            "service": "ChronoLens RAG Backend",
            "version": "1.0.0",
        }
    ), 200


@app.route("/roles", methods=["GET"])
def roles():
    """Return the list of valid user roles."""
    return jsonify(
        {
            "roles": [
                {"id": "public", "label": "Public", "description": "General access – top 3 results"},
                {"id": "researcher", "label": "Researcher", "description": "Enhanced access – top 7 results"},
                {
                    "id": "government_official",
                    "label": "Government Official",
                    "description": "Full access – top 10 results",
                },
            ]
        }
    ), 200


@app.route("/query", methods=["POST"])
def query():
    """
    Main RAG endpoint.

    Request JSON:
        {
            "query":       "...",
            "user_role":   "public | researcher | government_official",
            "time_filter": null   (optional ISO date string)
        }

    Response JSON:
        {
            "retrieved_documents": [...],
            "generated_answer":    "...",
            "metadata": {
                "role":     "...",
                "num_docs": N,
                "latency_ms": ...
            }
        }
    """
    data = request.get_json(silent=True)

    # -- Validation --
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    user_query = (data.get("query") or "").strip()
    user_role = (data.get("user_role") or "public").strip().lower()
    time_filter = data.get("time_filter")  # optional, may be None

    if not user_query:
        return jsonify({"error": "'query' field is required and must not be empty."}), 400

    valid_roles = {"public", "researcher", "government_official"}
    if user_role not in valid_roles:
        return (
            jsonify(
                {
                    "error": f"Invalid user_role '{user_role}'. Must be one of: {sorted(valid_roles)}."
                }
            ),
            400,
        )

    # -- RAG pipeline --
    rag = get_rag()
    t0 = time.perf_counter()

    try:
        retrieved_docs = rag.retrieve_documents(user_query, user_role, time_filter)
    except Exception as exc:
        logger.exception("retrieve_documents failed")
        return jsonify({"error": f"Retrieval error: {str(exc)}"}), 500

    try:
        generated_answer = rag.generate_answer(user_query, retrieved_docs, user_role)
    except Exception as exc:
        logger.exception("generate_answer failed")
        return jsonify({"error": f"Generation error: {str(exc)}"}), 500

    latency_ms = round((time.perf_counter() - t0) * 1000)

    return jsonify(
        {
            "retrieved_documents": retrieved_docs,
            "generated_answer": generated_answer,
            "metadata": {
                "role": user_role,
                "num_docs": len(retrieved_docs),
                "latency_ms": latency_ms,
            },
        }
    ), 200


# ---------------------------------------------------------------------------
# Utility / admin routes
# ---------------------------------------------------------------------------

@app.route("/reload", methods=["POST"])
def reload_index():
    """Reset the RAG module so the FAISS index will be rebuilt on next query.

    Useful after updating the underlying CSV or when you want to switch
    datasets without restarting the server.  This endpoint does **not** delete
    the on-disk index; it simply clears the in-memory singleton state.
    """
    rag = get_rag()
    # these attributes exist in rag_module
    if hasattr(rag, "_initialized"):
        rag._initialized = False
    if hasattr(rag, "_vectorstore"):
        rag._vectorstore = None
    return jsonify({"status": "reloaded", "note": "vectorstore will rebuild on next query"}), 200

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logger.info("Starting ChronoLens Flask server on http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
