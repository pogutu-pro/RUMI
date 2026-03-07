# STACK.md — Technology Stack

## Languages
- **Python 3.12** — Backend
- **TypeScript 5.9.3** — Frontend

## Runtimes & Package Managers
- **pip** — Python package manager (Backend)
- **pnpm 10.20.0** — Node package manager (Frontend)

## Backend Framework
- **Django 4.2.7** — Core web framework
- **Django REST Framework (DRF)** — REST API layer
- **Django Channels** — WebSocket support
- **Celery** — Async task queue / background jobs

## Frontend Framework
- **Next.js 16** — React meta-framework (App Router)
- **React 19** — UI library

## Databases
- **PostgreSQL** — Primary database (production)
- **SQLite** — Fallback (development)
- **Redis** — Cache + Celery broker + Django Channels layer

## ORM / Data Access
- Django ORM (models, migrations)

## Dev Tools
### Backend
- **black** — Code formatter
- **flake8** — Linter
- **mypy** — Static type checker

### Frontend
- **ESLint** — Linter
- **Prettier** — Code formatter

## Testing
### Backend
- **pytest** — Test runner
- **factory-boy** — Test fixtures/factories

### Frontend
- **Jest** — Unit tests
- **Cypress** — E2E tests
- **Playwright** — E2E tests

## Configuration Files
- `Backend/settings/` — Django settings (base, dev, production)
- `frontend/.env*` — Frontend environment variables
- `Backend/.env` — Backend environment variables
- `pyproject.toml` / `requirements.txt` — Python dependencies
- `frontend/package.json` — Node dependencies
