#!/bin/bash

# Quick Fix: Install pytest-cov and run tests
# This script handles the externally-managed-environment issue

echo "📦 Installing pytest-cov..."

# Try to install pytest-cov
if command -v pipx &> /dev/null; then
    # Use pipx if available
    pipx install pytest-cov
elif python3 -m pip install --user pytest-cov 2>/dev/null; then
    # Try user install
    echo "✓ Installed pytest-cov for user"
else
    # Use apt
    sudo apt install -y python3-pytest-cov
fi

echo ""
echo "✅ pytest-cov installed!"
echo ""
echo "Now run: ./run_all_tests.sh"
