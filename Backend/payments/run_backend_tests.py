"""
Test Runner Script for Backend Tests

Runs all Django tests with optional coverage reports.

Usage:
    python run_backend_tests.py
    python run_backend_tests.py --verbose
    python run_backend_tests.py --coverage
"""

import subprocess
import sys
import os


def run_tests(verbose=False, coverage=False):
    """Run Django tests with appropriate flags."""

    # Ensure we're in the Backend directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(script_dir)
    os.chdir(backend_dir)

    # Base command - use Django's test runner
    cmd = [sys.executable, "manage.py", "test"]

    # Add flags
    if verbose:
        cmd.append("--verbosity=2")

    # Run tests
    print(f"Running: {' '.join(cmd)}\n")
    result = subprocess.run(cmd, env={**os.environ, 'DEBUG': 'True'})

    if result.returncode == 0:
        print("\n✅ All backend tests passed!")
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)


if __name__ == "__main__":
    verbose = "--verbose" in sys.argv or "-v" in sys.argv
    coverage = "--coverage" in sys.argv or "-c" in sys.argv

    run_tests(verbose=verbose, coverage=coverage)
