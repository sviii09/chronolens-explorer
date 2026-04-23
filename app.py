# -*- coding: utf-8 -*-
"""
ChronoLens - Flask Backend
Clean, minimal Flask server for RAG-based government scheme retrieval.

Endpoints:
    GET  /health              → Health check
    POST /query               → RAG query (retrieve + generate)
    GET  /roles               → Available user roles
"""

import sys
import os
import time
import logging
from typing import Optional

from flask import Flask, request, jsonify
from flask_cors import CORS

# ============================================================================
# Configuration
# ============================================================================

app = Flask(__name__)
CORS(app)  # Enable CORS for local development

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# Lazy Load RAG Engine
# ============================================================================

_rag_engine = None


def get_rag_engine():
    """Get or initialize the RAG engine (lazy load)."""
    global _rag_engine
    if _rag_engine is None:
        from rag_engine import RAGEngine
        _rag_engine = RAGEngine()
    return _rag_engine



# ============================================================================
# API Routes
# ============================================================================

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "service": "ChronoLens RAG Backend",
        "version": "2.0.0",
        "message": "Backend is running"
    }), 200


@app.route("/roles", methods=["GET"])
def get_roles():
    """Get available user roles."""
    return jsonify({
        "roles": [
            {
                "id": "public",
                "label": "Public",
                "description": "General access — top 3 results"
            },
            {
                "id": "researcher",
                "label": "Researcher",
                "description": "Enhanced access — top 7 results"
            },
            {
                "id": "government_official",
                "label": "Government Official",
                "description": "Full access — top 10 results"
            }
        ]
    }), 200


@app.route("/query", methods=["POST"])
def query():
    """
    Main RAG query endpoint.

    Request JSON:
    {
        "query": "Which schemes are available for women entrepreneurs?",
        "user_role": "public | researcher | government_official",
        "time_filter": null (optional)
    }

    Response JSON:
    {
        "retrieved_documents": [...],
        "generated_answer": "...",
        "metadata": {
            "role": "...",
            "num_docs": N,
            "latency_ms": ...
        }
    }
    """
    data = request.get_json(silent=True)

    # Validation
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    query_text = (data.get("query") or "").strip()
    user_role = (data.get("user_role") or "public").strip().lower()
    time_filter = data.get("time_filter")

    if not query_text:
        return jsonify({"error": "'query' field is required and cannot be empty"}), 400

    valid_roles = {"public", "researcher", "government_official"}
    if user_role not in valid_roles:
        return jsonify({
            "error": f"Invalid user_role '{user_role}'. Must be one of: {', '.join(sorted(valid_roles))}"
        }), 400

    # Execute RAG pipeline
    t0 = time.perf_counter()
    try:
        rag = get_rag_engine()
        results = rag.query(query_text, user_role, time_filter)
        latency_ms = round((time.perf_counter() - t0) * 1000)

        return jsonify({
            "retrieved_documents": results["documents"],
            "generated_answer": results["answer"],
            "metadata": {
                "role": user_role,
                "num_docs": len(results["documents"]),
                "latency_ms": latency_ms
            }
        }), 200

    except Exception as e:
        logger.exception("Query processing failed")
        return jsonify({
            "error": f"Query processing failed: {str(e)}"
        }), 500


@app.route("/reload", methods=["POST"])
def reload():
    """Reload RAG engine (rebuild FAISS index)."""
    global _rag_engine
    _rag_engine = None

    return jsonify({
        "status": "reloaded",
        "message": "RAG engine will be rebuilt on next query"
    }), 200


# ============================================================================
# Error Handlers
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    logger.info("=" * 70)
    logger.info("ChronoLens Backend Starting...")
    logger.info("=" * 70)
    logger.info("API will be available at http://localhost:5000")
    logger.info("Endpoints:")
    logger.info("  GET  /health")
    logger.info("  GET  /roles")
    logger.info("  POST /query")
    logger.info("=" * 70)

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False,
        use_reloader=False
    )
