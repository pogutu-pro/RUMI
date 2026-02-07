"""
Test Runner Script for Backend Payment Tests

Runs all pytest tests with coverage reports.

Usage:
    python run_backend_tests.py
    python run_backend_tests.py --verbose
    python run_backend_tests.py --coverage
"""

import subprocess
import sys
import os

def run_tests(verbose=False, coverage=False):
    """Run pytest with appropriate flags."""
    
    # Check if pytest-cov is installed
    cov_available = False
    if coverage:
        try:
            import pytest_cov
            cov_available = True
        except ImportError:
            print("⚠️  pytest-cov not installed. Running tests without coverage.")
            print("   Install with: pip install pytest-cov\n")
            coverage = False
    
    # Base command
    cmd = ["pytest", "Backend/payments/tests_comprehensive.py"]
    
    # Add flags
    if verbose:
        cmd.append("-v")
        cmd.append("--tb=short")
    
    if coverage and cov_available:
        cmd.extend([
            "--cov=Backend/payments",
            "--cov-report=html",
            "--cov-report=term"
        ])
    
    # Color output
    cmd.append("--color=yes")
    
    # Run tests
    print(f"Running: {' '.join(cmd)}\n")
    result = subprocess.run(cmd, cwd="/home/ogutu/Pictures/RUMI")
    
    if result.returncode == 0:
        print("\n✅ All backend tests passed!")
        if coverage and cov_available:
            print("\n📊 Coverage report generated in htmlcov/index.html")
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    verbose = "--verbose" in sys.argv or "-v" in sys.argv
    coverage = "--coverage" in sys.argv or "-c" in sys.argv
    
    run_tests(verbose=verbose, coverage=coverage)
