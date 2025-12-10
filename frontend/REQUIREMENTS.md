# Frontend Requirements & Setup Guide

This document lists the technical requirements, technology stack, and dependencies for the RUMI frontend application. It serves as a guide for setting up the environment and understanding the tools used.

## 🛠️ Tech Stack Overview

- **Framework:** [Next.js](https://nextjs.org/) (v16+) - The React Framework for the Web.
- **Library:** [React](https://react.dev/) (v19+) - The library for web and native user interfaces.
- **Language:** [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4) - A utility-first CSS framework.
- **Package Manager:** [pnpm](https://pnpm.io/) - Fast, disk space efficient package manager.

## 📋 Prerequisites

Before installing the project, ensure you have the following installed:

- **Node.js**: Version `>=20.0.0`
- **pnpm**: Version `10.20.0` (as specified in package.json)

## 🚀 Installation & Setup

To install all dependencies and set up the project locally:

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd rumi-frontend
    ```

2.  **Install dependencies using pnpm:**
    ```bash
    pnpm install
    ```
    *This command reads the `package.json` file and installs all listed dependencies.*

3.  **Run the development server:**
    ```bash
    pnpm dev
    ```

## 📦 Dependencies Breakdown

Below is a list of key dependencies used in the project with explanations.

### Core Framework
- **`next`**: The core Next.js framework for server-side rendering, routing, and more.
- **`react` & `react-dom`**: The core React library for building UI components.

### UI Components & Styling
- **`tailwindcss`**: Validation utility-first CSS framework.
- **`@radix-ui/react-*`**: Accessible, unstyled UI primitives (Dialog, Tabs, Slider, Switch, etc.) used to build the design system.
- **`framer-motion`**: Library for declarative animations and gestures.
- **`lucide-react`**: Icon set compatible with React.
- **`clsx` & `tailwind-merge`**: Utilities for conditionally joining classNames and merging Tailwind classes without conflicts.
- **`class-variance-authority`**: For managing component variants.
- **`sonner`**: Toast notification library.

### State Management & Data Fetching
- **`zustand`**: Lightweight state management for global client state.
- **`@tanstack/react-query`**: For managing server state, caching, and synchronization.
- **`axios`**: HTTP client for making API requests.

### Forms & Validation
- **`react-hook-form`**: Library for flexible and efficient form validation.
- **`zod`**: Schema validation library for TypeScript.
- **`@hookform/resolvers`**: Bridges Zod schemas with React Hook Form.

### Maps & Location
- **`react-map-gl`**: React wrapper for Mapbox/MapLibre GL.
- **`maplibre-gl`**: Rendering library for interactive maps.

### Data Visualization
- **`recharts`**: Charting library built on React components.
- **`chart.js` & `react-chartjs-2`**: Alternative charting library.

### Utilities
- **`date-fns`**: For manipulating and formatting dates.
- **`react-dropzone`**: For handling file uploads via drag-and-drop.
- **`react-day-picker`**: Date picker component.
- **`next-pwa`**: Plugin to turn the Next.js app into a Progressive Web App (PWA).

### Authentication
- **`@react-oauth/google`**: Google OAuth integration for React.

### Testing & Quality Assurance
- **`jest`**: Test runner for unit and integration tests.
- **`cypress`**: End-to-end testing framework.
- **`@testing-library/react`**: Utilities for testing React components.
- **`eslint` & `prettier`**: For code linting and formatting.

## 📝 Quick Add Commands

If you were setting this up from scratch, here are the commands to add these groups of dependencies:

```bash
# Core
pnpm add next@latest react@latest react-dom@latest

# Styling
pnpm add tailwindcss@latest postcss autoprefixer
pnpm add framer-motion lucide-react clsx tailwind-merge class-variance-authority

# Components (Radix UI examples)
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-slot

# State & Data
pnpm add zustand @tanstack/react-query axios

# Forms
pnpm add react-hook-form zod @hookform/resolvers
```
