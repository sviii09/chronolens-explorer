#!/usr/bin/env python3
"""
Monitor RAG rebuild progress
"""
import os
import time
from pathlib import Path

faiss_dir = Path("src/govt_schemes_faiss")

print("\n🔍 RAG Rebuild Monitor")
print("=" * 60)

start_time = time.time()
checked_count = 0

while not faiss_dir.exists() and checked_count < 300:  # Check for up to 5 minutes
    elapsed = time.time() - start_time
    checked_count += 1
    
    status_chars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    spinner = status_chars[checked_count % len(status_chars)]
    
    print(f"\r{spinner} Rebuilding... ({elapsed:.0f}s)", end="", flush=True)
    time.sleep(1)

print()

if faiss_dir.exists():
    elapsed = time.time() - start_time
    files = list(faiss_dir.glob("*"))
    print(f"✓ FAISS index created in {elapsed:.0f}s")
    print(f"  Files: {', '.join(f.name for f in files)}")
    print("\n✅ Rebuild complete! Restart app.py to use the new index.")
else:
    print("⏳ Still rebuilding (taking longer than expected)...")
    print("   This can take 5-10 minutes for first build.")
    print("   Check memory usage: tasklist | find \"python\"")
