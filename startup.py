#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Startup script for ChronoLens RAG Backend
Handles initialization with optional parameters
"""

import os
import sys
import argparse
import subprocess
import platform

def get_python_executable():
    """Get current Python executable."""
    return sys.executable

def run_backend(args):
    """Run the Flask backend with specified options."""
    
    env = os.environ.copy()
    
    # Set environment variables based on arguments
    if args.fast_mode:
        env['CHRONOLENS_MAX_ROWS'] = str(args.fast_mode)
        print(f"[*] Fast mode: Limiting to {args.fast_mode} rows")
    
    if args.skip_llm:
        env['CHRONOLENS_SKIP_LLM'] = '1'
        print("[*] LLM disabled: Using extractive-only mode")
    
    if args.csv_path:
        env['CHRONOLENS_DATA_CSV'] = args.csv_path
        print(f"[*] Using custom CSV: {args.csv_path}")
    
    if args.gpu:
        env['CUDA_VISIBLE_DEVICES'] = '0'
        print("[*] GPU mode enabled")
    else:
        print("[*] CPU mode: Using CPU (slower but works everywhere)")
    
    # Run the backend
    python_exe = get_python_executable()
    cmd = [python_exe, 'app.py']
    
    print(f"[*] Starting FlaskBackend on http://localhost:5000")
    print(f"[*] Python: {python_exe}")
    print("[*] Press Ctrl+C to stop\n")
    
    try:
        subprocess.run(cmd, env=env)
    except KeyboardInterrupt:
        print("\n[*] Backend stopped")
        sys.exit(0)

def main():
    parser = argparse.ArgumentParser(
        description='ChronoLens RAG Backend Startup',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run with full dataset (default)
  python startup.py

  # Fast mode with 200 rows for testing
  python startup.py --fast-mode 200

  # Skip LLM (extractive-only) for faster startup
  python startup.py --skip-llm

  # Use custom CSV file
  python startup.py --csv-path /path/to/data.csv

  # Enable GPU acceleration (if available)
  python startup.py --gpu

  # Combine options
  python startup.py --fast-mode 500 --skip-llm --gpu
        """
    )
    
    parser.add_argument(
        '--fast-mode',
        type=int,
        default=None,
        metavar='NUM_ROWS',
        help='Limit dataset to N rows for faster initialization (e.g., 200)'
    )
    
    parser.add_argument(
        '--skip-llm',
        action='store_true',
        help='Disable LLM generation (use extractive summaries only)'
    )
    
    parser.add_argument(
        '--csv-path',
        type=str,
        default=None,
        help='Path to custom CSV file'
    )
    
    parser.add_argument(
        '--gpu',
        action='store_true',
        help='Enable GPU acceleration (if available)'
    )
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("ChronoLens RAG Backend Startup")
    print("=" * 70)
    print(f"[*] Platform: {platform.platform()}")
    print(f"[*] Python: {sys.version.split()[0]}")
    print()
    
    # Verify dependencies
    print("[*] Checking dependencies...")
    try:
        import flask
        import langchain
        import faiss
        import torch
        print("[✓] All dependencies available")
    except ImportError as e:
        print(f"[✗] Missing dependency: {e}")
        print("[!] Run: pip install -r requirements.txt")
        sys.exit(1)
    
    print()
    run_backend(args)

if __name__ == '__main__':
    main()
