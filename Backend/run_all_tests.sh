#!/bin/bash

# ============================================
# RUMI Platform - Master Test Runner
# ============================================
# Runs ALL tests (backend + frontend) with one command
# Usage:
#   ./run_all_tests.sh               # Run all tests
#   ./run_all_tests.sh --coverage    # With coverage reports
#   ./run_all_tests.sh --skip-e2e    # Skip E2E tests (faster)

set -e  # Exit on first error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - Detect Project Root (Parent of Backend)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COVERAGE=false
SKIP_E2E=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --coverage)
      COVERAGE=true
      ;;
    --skip-e2e)
      SKIP_E2E=true
      ;;
  esac
done

# Header
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  RUMI Platform - Master Test Runner${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Track results
BACKEND_PASSED=false
FRONTEND_UNIT_PASSED=false
FRONTEND_E2E_PASSED=false

# ============================================
# 1. BACKEND TESTS
# ============================================
echo -e "${YELLOW}📦 Running Backend Tests (pytest)...${NC}"
echo ""

cd "$PROJECT_ROOT/Backend"

if [ "$COVERAGE" = true ]; then
  python3 payments/run_backend_tests.py --verbose --coverage
else
  python3 payments/run_backend_tests.py --verbose
fi

if [ $? -eq 0 ]; then
  BACKEND_PASSED=true
  echo -e "${GREEN}✅ Backend tests PASSED${NC}"
else
  echo -e "${RED}❌ Backend tests FAILED${NC}"
  exit 1
fi

echo ""
echo "-----------------------------------------"
echo ""

# ============================================
# 2. FRONTEND UNIT TESTS
# ============================================
echo -e "${YELLOW}⚛️  Running Frontend Unit Tests (Vitest)...${NC}"
echo ""

cd "$PROJECT_ROOT/frontend"

if [ "$COVERAGE" = true ]; then
  pnpm test --coverage --watchAll=false
else
  pnpm test --watchAll=false
fi

if [ $? -eq 0 ]; then
  FRONTEND_UNIT_PASSED=true
  echo -e "${GREEN}✅ Frontend unit tests PASSED${NC}"
else
  echo -e "${RED}❌ Frontend unit tests FAILED${NC}"
  exit 1
fi

echo ""
echo "-----------------------------------------"
echo ""

# ============================================
# 3. FRONTEND E2E TESTS (Optional)
# ============================================
if [ "$SKIP_E2E" = false ]; then
  echo -e "${YELLOW}🌐 Running Frontend E2E Tests (Playwright)...${NC}"
  echo ""
  
  cd "$PROJECT_ROOT/frontend"
  
  # Check if dev server is running
  if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Dev server not running. Starting background server...${NC}"
    pnpm dev > /dev/null 2>&1 &
    DEV_SERVER_PID=$!
    echo "Waiting for server to be ready..."
    sleep 10
  fi
  
  pnpm exec playwright test
  
  if [ $? -eq 0 ]; then
    FRONTEND_E2E_PASSED=true
    echo -e "${GREEN}✅ Frontend E2E tests PASSED${NC}"
  else
    echo -e "${RED}❌ Frontend E2E tests FAILED${NC}"
    
    # Kill dev server if we started it
    if [ ! -z "$DEV_SERVER_PID" ]; then
      kill $DEV_SERVER_PID 2>/dev/null || true
    fi
    
    exit 1
  fi
  
  # Kill dev server if we started it
  if [ ! -z "$DEV_SERVER_PID" ]; then
    kill $DEV_SERVER_PID 2>/dev/null || true
  fi
  
  echo ""
  echo "-----------------------------------------"
  echo ""
else
  FRONTEND_E2E_PASSED=true  # Skipped, mark as passed
  echo -e "${YELLOW}⏭️  Skipping E2E tests${NC}"
  echo ""
fi

# ============================================
# FINAL SUMMARY
# ============================================
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}           TEST RESULTS SUMMARY${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

if [ "$BACKEND_PASSED" = true ]; then
  echo -e "  ${GREEN}✅ Backend Tests (30+)      PASSED${NC}"
else
  echo -e "  ${RED}❌ Backend Tests (30+)      FAILED${NC}"
fi

if [ "$FRONTEND_UNIT_PASSED" = true ]; then
  echo -e "  ${GREEN}✅ Frontend Unit Tests (25+) PASSED${NC}"
else
  echo -e "  ${RED}❌ Frontend Unit Tests (25+) FAILED${NC}"
fi

if [ "$SKIP_E2E" = false ]; then
  if [ "$FRONTEND_E2E_PASSED" = true ]; then
    echo -e "  ${GREEN}✅ Frontend E2E Tests (17+)  PASSED${NC}"
  else
    echo -e "  ${RED}❌ Frontend E2E Tests (17+)  FAILED${NC}"
  fi
else
  echo -e "  ${YELLOW}⏭️  Frontend E2E Tests       SKIPPED${NC}"
fi

echo ""
echo -e "${BLUE}============================================${NC}"
echo ""

# Coverage report locations
if [ "$COVERAGE" = true ]; then
  echo -e "${YELLOW}📊 Coverage Reports Generated:${NC}"
  echo -e "  • Backend:  ${PROJECT_ROOT}/Backend/htmlcov/index.html"
  echo -e "  • Frontend: ${PROJECT_ROOT}/frontend/coverage/index.html"
  echo ""
fi

# Final status
if [ "$BACKEND_PASSED" = true ] && [ "$FRONTEND_UNIT_PASSED" = true ] && [ "$FRONTEND_E2E_PASSED" = true ]; then
  echo -e "${GREEN}🎉 ALL TESTS PASSED! Ready for deployment.${NC}"
  echo ""
  exit 0
198: else
  echo -e "${RED}❌ SOME TESTS FAILED! Fix errors before deploying.${NC}"
  echo ""
  exit 1
fi
