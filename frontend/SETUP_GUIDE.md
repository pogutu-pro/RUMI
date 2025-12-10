# RUMI Frontend Setup Guide

Welcome to the RUMI Frontend repository! This guide will help you set up your development environment and get the application running smoothly.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js**: Version 20.0.0 or higher.
    - Check with: `node -v`
2.  **pnpm**: We use pnpm for package management.
    - Install globally: `npm install -g pnpm`
    - Check with: `pnpm -v`

## 🚀 Installation

1.  **Navigate to the frontend directory**:
    ```bash
    cd frontend
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Environment Setup**:
    - Copy the example environment file (if available) or ask the team for the `.env` values.
    - Create a `.env.local` file in the `frontend` root.
    - *Critical values usually include API URLs and third-party keys (Maps, Auth).*

## 💻 Running the Application

### Development Server
To start the local development server with hot-reloading:

```bash
pnpm dev
```

- Opens at: [http://localhost:3000](http://localhost:3000)

### Production Build
To test the production build locally:

1.  **Build the app**:
    ```bash
    pnpm build
    ```
2.  **Start the production server**:
    ```bash
    pnpm start
    ```

## 🧪 Testing

We use **Jest** for unit testing and **Cypress** for End-to-End (E2E) testing.

- **Run Unit Tests**:
    ```bash
    pnpm test
    ```
- **Run E2E Tests**:
    ```bash
    pnpm cypress:open
    ```
- **Lint Code**:
    ```bash
    pnpm lint
    ```

## 📁 Project Structure

- `app/` - Next.js App Router pages and layouts.
- `components/` - Reusable UI components.
    - `ui/` - Base UI elements (buttons, inputs, etc.).
- `lib/` - Utility functions and helpers.
- `hooks/` - Custom React hooks.
- `public/` - Static assets (images, icons).

## ⚠️ Troubleshooting

- **"Module not found"**: Ensure you ran `pnpm install` in the `frontend` directory, not the root.
- **Hydration Errors**: Check console logs. These often happen if HTML structure is invalid (e.g., `div` inside `p`).
- **Map Issues**: Ensure your Mapbox/MapLibre token is correctly set in `.env.local`.

---
*Happy Coding!* 🚀
