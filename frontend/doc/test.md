# Testing Guide - RUMI Platform

This guide explains how to run the various test suites implemented for the RUMI platform.

## 1. Backend Verification (Pytest)

The backend uses **pytest** with `pytest-django` for a more flexible and powerful testing experience.

### Run All Backend Tests
```bash
cd Backend
pytest
```

### Run Specific Modules
- **Run by app**: `pytest hostels/`
- **Run by keyword**: `pytest -k "booking"`
- **Run with coverage**: `pytest --cov=.`

---

## 2. Frontend Verification (Next.js)

The frontend uses **Jest** for unit/component tests and **Cypress** for End-to-End (E2E) flows.

### Unit & Component Tests
```bash
cd frontend
pnpm test
```
*Note: This runs tests for Zod schemas, data derivation hooks, and UI components.*

### End-to-End (E2E) Tests
1. **Ensure dev server is running**:
   ```bash
   cd frontend
   pnpm dev
   ```
2. **Run Cypress (Headless)**:
   ```bash
   pnpm cypress:run
   ```
3. **Open Cypress UI**:
   ```bash
   pnpm cypress:open
   ```

---

## 3. Coverage Analysis

To review test quality, generate coverage reports.

### Backend Coverage
```bash
cd Backend
coverage run manage.py test hostels payments accounts
coverage report
coverage html  # Generates detailed HTML report
```

### Frontend Coverage
```bash
cd frontend
pnpm test --coverage
```
*HTML reports will be located in `frontend/coverage/lcov-report/index.html`.*
