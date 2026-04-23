#!/usr/bin/env python3
"""
ChronoLens RAG Frontend Connection Setup
Verifies and initializes the RAG system for frontend integration.

Usage:
    python setup_rag_frontend.py
"""

import os
import sys
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s: %(message)s"
)
logger = logging.getLogger(__name__)

# Make src/ importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))


def check_dependencies():
    """Verify all required Python packages are installed."""
    logger.info("📦 Checking dependencies...")
    
    required = [
        "flask",
        "flask_cors",
        "langchain",
        "langchain_community",
        "sentence_transformers",
        "faiss",
        "pandas",
        "numpy",
    ]
    
    missing = []
    for package in required:
        try:
            __import__(package)
            logger.info(f"  ✅ {package}")
        except ImportError:
            logger.error(f"  ❌ {package}")
            missing.append(package)
    
    if missing:
        logger.error(f"\n❌ Missing packages: {', '.join(missing)}")
        logger.info("\n💡 Install with: pip install -r requirements.txt")
        return False
    
    logger.info("✅ All dependencies found!")
    return True


def verify_faiss_index():
    """Check if FAISS index exists and is valid."""
    logger.info("\n📚 Checking FAISS index...")
    
    index_path = os.path.join(os.path.dirname(__file__), "src", "govt_schemes_faiss")
    index_file = os.path.join(index_path, "index.faiss")
    
    if os.path.exists(index_file):
        size_mb = os.path.getsize(index_file) / (1024 * 1024)
        logger.info(f"  ✅ FAISS index found ({size_mb:.1f} MB)")
        return True
    else:
        logger.warning(f"  ⚠️  FAISS index not found at {index_file}")
        logger.info("     The index will be built on first RAG query (may take 1-2 minutes)")
        return True


def verify_csv_data():
    """Check if training data CSV exists."""
    logger.info("\n📊 Checking dataset...")
    
    csv_path = os.path.join(os.path.dirname(__file__), "src", "updated_data.csv")
    
    if os.path.exists(csv_path):
        size_mb = os.path.getsize(csv_path) / (1024 * 1024)
        logger.info(f"  ✅ Dataset found ({size_mb:.2f} MB)")
        
        import pandas as pd
        try:
            df = pd.read_csv(csv_path)
            logger.info(f"     Contains {len(df)} government schemes")
            return True
        except Exception as e:
            logger.error(f"  ❌ Failed to read CSV: {e}")
            return False
    else:
        logger.error(f"  ❌ Dataset not found at {csv_path}")
        return False


def verify_frontend_config():
    """Check frontend API client configuration."""
    logger.info("\n🌐 Checking frontend configuration...")
    
    client_file = os.path.join(os.path.dirname(__file__), "src", "api", "client.ts")
    
    if not os.path.exists(client_file):
        logger.warning(f"  ⚠️  Frontend client not found at {client_file}")
        return False
    
    try:
        with open(client_file, "r") as f:
            content = f.read()
            if "queryRag" in content and "/query" in content:
                logger.info("  ✅ Frontend configured to call /query endpoint")
                return True
            else:
                logger.warning("  ⚠️  /query endpoint reference not found in client")
                return False
    except Exception as e:
        logger.error(f"  ❌ Error reading client file: {e}")
        return False


def verify_backend_app():
    """Check if app.py has required endpoints."""
    logger.info("\n⚙️  Checking backend application...")
    
    app_file = os.path.join(os.path.dirname(__file__), "app.py")
    
    if not os.path.exists(app_file):
        logger.error(f"  ❌ app.py not found at {app_file}")
        return False
    
    try:
        with open(app_file, "r") as f:
            content = f.read()
            endpoints = [
                ("/health", "✅ Health check"),
                ("/query", "✅ RAG Query endpoint"),
                ("/roles", "✅ User roles endpoint"),
                ("rag_module", "✅ RAG module import"),
            ]
            
            all_found = True
            for endpoint, msg in endpoints:
                if endpoint in content:
                    logger.info(f"  {msg}")
                else:
                    logger.error(f"  ❌ Missing {endpoint}")
                    all_found = False
            
            return all_found
    except Exception as e:
        logger.error(f"  ❌ Error reading app.py: {e}")
        return False


def initialize_rag_module():
    """Try to initialize RAG module to catch any issues early."""
    logger.info("\n🤖 Testing RAG module initialization...")
    
    try:
        import rag_module
        logger.info("  ✅ RAG module imported successfully")
        
        # Check if FAISS can be loaded
        try:
            rag_module._initialize()
            logger.info("  ✅ FAISS index loaded successfully")
            return True
        except Exception as e:
            logger.warning(f"  ⚠️  FAISS initialization: {e}")
            logger.info("     This is expected on first run - index will build on first query")
            return True
            
    except Exception as e:
        logger.error(f"  ❌ Failed to import RAG module: {e}")
        return False


def print_startup_guide():
    """Print instructions for starting the system."""
    logger.info("\n" + "=" * 60)
    logger.info("🚀 STARTUP GUIDE")
    logger.info("=" * 60)
    
    logger.info("\n1. Start the backend (Terminal 1):")
    logger.info("   cd chronolens-explorer-main")
    logger.info("   python app.py")
    logger.info("\n   Backend runs on: http://localhost:5000")
    
    logger.info("\n2. Start the frontend (Terminal 2):")
    logger.info("   cd chronolens-explorer-main")
    logger.info("   npm install  # First time only")
    logger.info("   npm run dev")
    logger.info("\n   Frontend runs on: http://localhost:5173")
    
    logger.info("\n3. Test the connection:")
    logger.info("   Open http://localhost:5173 in your browser")
    logger.info("   Go to 'Query Retrieval' page")
    logger.info("   Enter a query: 'women entrepreneur schemes'")
    
    logger.info("\n4. Health check (in another terminal):")
    logger.info("   curl http://localhost:5000/health")
    
    logger.info("\n" + "=" * 60)
    logger.info("💡 Tips:")
    logger.info("- First RAG query may take 30-120 seconds (models loading)")
    logger.info("- Skip LLM for faster start: set CHRONOLENS_SKIP_LLM=1")
    logger.info("- Use CHRONOLENS_MAX_ROWS=100 for testing (faster startup)")
    logger.info("=" * 60 + "\n")


def main():
    logger.info("=" * 60)
    logger.info("🔧 ChronoLens RAG Frontend Connection Setup")
    logger.info("=" * 60 + "\n")
    
    checks = [
        ("Dependencies", check_dependencies),
        ("FAISS Index", verify_faiss_index),
        ("Dataset", verify_csv_data),
        ("Frontend Config", verify_frontend_config),
        ("Backend App", verify_backend_app),
        ("RAG Module", initialize_rag_module),
    ]
    
    results = {}
    for check_name, check_func in checks:
        try:
            results[check_name] = check_func()
        except Exception as e:
            logger.error(f"❌ {check_name}: Unexpected error: {e}")
            results[check_name] = False
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("📋 SUMMARY")
    logger.info("=" * 60)
    
    all_passed = all(results.values())
    for check_name, passed in results.items():
        status = "✅" if passed else "❌"
        logger.info(f"{status} {check_name}")
    
    logger.info("=" * 60)
    
    if all_passed:
        logger.info("\n✅ All checks passed! System is ready.")
        print_startup_guide()
        return 0
    else:
        failed = [name for name, passed in results.items() if not passed]
        logger.error(f"\n❌ {len(failed)} check(s) failed: {', '.join(failed)}")
        logger.info("\n💡 Run: pip install -r requirements.txt")
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
