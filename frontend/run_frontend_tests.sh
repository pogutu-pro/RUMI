#!/bin/bash

# Frontend Test Runner Script
# Runs all frontend tests (unit + E2E) with coverage

set -e  # Exit on error

echo "🧪 Running Frontend Payment Tests..."
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to frontend directory
cd /home/ogutu/Pictures/RUMI/frontend

# Parse arguments
RUN_UNIT=true
RUN_E2E=false
COVERAGE=false

for arg in "$@"; do
  case $arg in
    --e2e)
      RUN_E2E=true
      ;;
    --unit-only)
      RUN_E2E=false
      ;;
    --coverage)
      COVERAGE=true
      ;;
    --all)
      RUN_UNIT=true
      RUN_E2E=true
      ;;
  esac
done

# Run unit tests
if [ "$RUN_UNIT" = true ]; then
  echo -e "${YELLOW}📦 Running Component Unit Tests...${NC}"
  if [ "$COVERAGE" = true ]; then
    pnpm exec jest --coverage --watchAll=false --passWithNoTests
  else
    pnpm exec jest --watchAll=false --passWithNoTests
  fi
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Unit tests passed!${NC}"
  else
    echo -e "${RED}❌ Unit tests failed!${NC}"
    exit 1
  fi
  echo ""
fi

# Run E2E tests
if [ "$RUN_E2E" = true ]; then
  echo -e "${YELLOW}🌐 Running E2E Tests...${NC}"
  pnpm exec playwright test
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ E2E tests passed!${NC}"
  else
    echo -e "${RED}❌ E2E tests failed!${NC}"
    exit 1
  fi
  echo ""
fi

echo -e "${GREEN}✅ All frontend tests completed successfully!${NC}"

if [ "$COVERAGE" = true ]; then
  echo ""
  echo -e "${YELLOW}📊 Coverage report available in coverage/index.html${NC}"
fi
