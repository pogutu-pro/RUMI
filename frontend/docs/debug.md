# Frontend TypeScript Debugging Plan

This document is the **single source of truth** for cleaning up TypeScript and React issues in the RUMI frontend and making it production‑ready.

The goal is to:
- Eliminate all TypeScript errors and `any` usages.
- Remove or refactor duplicated / conflicting business logic.
- Remove unused / dead code.
- Ensure React/Next best practices (hooks, effects, async, etc.).

---

## 1. Baseline: Reproduce All Static Errors

1. **Install deps (if not already):**
   - `pnpm install` (preferred) or `npm install`.

2. **Run ESLint:**
   - `pnpm lint` or `npm run lint`.
   - Treat **every error and warning as must‑fix**.
   - Export output to a log file for tracking, e.g. `pnpm lint > lint.log`.

3. **Run TypeScript compiler:**
   - There is no `typecheck` script; use:
     - `npx tsc -p tsconfig.json --noEmit`.
   - Save output to `tsc.log` for reference.

4. **Goal for this stage:**
   - `lint` and `tsc` must complete with **0 errors** and ideally **0 warnings**.

---

## 2. Systematically Eliminate `any` and Unsafe Types

> Rule: **No `any` in production code.** If you must use it temporarily, document it and replace it before release.

1. **Search for `any` and ts‑ignore:**
   - `rg "any" src`
   - `rg "@ts-ignore" src`
   - `rg "eslint-disable" src`

2. **Prioritise core layers:**
   - `src/lib/api/**` (API clients like `tech-support.ts`, `payments.ts`, `public.ts`, `rooms.ts`, `transfers.ts`).
   - `src/stores/**` (e.g. `auth.store.ts`, `useInventoryStore.ts`, `tech-support.store.ts`).
   - `src/hooks/**` (e.g. `use-auth.ts`, `use-payments.ts`, `use-roommates.ts`, `use-notifications.ts`).

3. **Replace `any` with real domain types:**
   - **API params:**
     - Example: `techSupportApi.getUsers(params?: any)` → create `TechSupportUserQuery` type with fields actually supported by the backend and use that instead.
   - **Zustand stores:**
     - Example: `error: any` in `tech-support.store.ts` → narrow to `unknown` and safely refine (`instanceof Error`) before reading `.message`.
   - **Profiles in `auth.store.ts`:**
     - Replace `(s.profile as any).type` with a discriminated union on profile types (e.g. `StudentProfile | LandlordProfile | CaretakerProfile`) instead of casting.

4. **Remove `@ts-ignore` and `eslint-disable` gradually:**
   - For each occurrence:
     - Understand the underlying type or hook rule violation.
     - Refactor until the ignore is no longer necessary.
   - Only keep ignores around truly external / untyped libraries and document them.

5. **Update shared `types/*.ts` files:**
   - Add or refine interfaces in `src/types/auth.types.ts`, `src/types/entities.types.ts`, etc.
   - Reuse them consistently across API clients, hooks, and components.

---

## 3. Fix Concrete TypeScript / JSX Issues Reported So Far

### 3.1 JSX / TSX syntax errors

- **File:** `src/components/hostels/hostel-image-upload.tsx`
- **Issues:**
  - `JSX element 'AnimatePresence' has no corresponding closing tag`.
  - Mismatched closing tag for `motion.div` and trailing JSX syntax errors.
- **Plan:**
  1. Open the component and fix all tag mismatches.
  2. Ensure `AnimatePresence` and `motion.div` are properly opened/closed.
  3. Re‑run `tsc` to confirm file compiles.

### 3.2 React hooks lint issues

- **File:** `src/components/ui/form-fields.tsx`
  - `React.useId` called conditionally → hoist all hook calls (including `useId`) to top level of the component, no conditionals or early returns around them.

- **File:** `src/hooks/use-async.ts`
  - Ref updates inside render: `successCallbackRef.current = ...` and `errorCallbackRef.current = ...` in render path.
  - **Fix:** move these assignments into a `useEffect` that depends on `options?.onSuccess` and `options?.onError`.

- **File:** `src/hooks/use-roommate-quiz.ts`
  - `setState` (`setQuizState`) called synchronously in an effect after `JSON.parse`.
  - **Fix:**
    - Either initialize state lazily from `localStorage` in the `useState` initializer, or
    - Keep the effect but ensure it only calls `setQuizState` when necessary and doesn’t cause cascading renders (guard with a ref or deep equality check).

- **File:** `src/hooks/use-websocket.ts`
  - `connect` accessed before declaration inside a callback.
  - Missing dependencies in `useEffect` (lint warns about `connect` and `disconnect`).
  - **Fix:**
    - Define `connect` and `disconnect` (via `useCallback`) **before** any `useEffect` that references them.
    - Add them to effect dependency arrays, or restructure the logic to avoid stale closures.

Re‑run `npm run lint` after each fix until these React‑hook issues disappear.

---

## 4. Clean Up Business Logic: Duplications and Conflicts

### 4.1 Identify business logic hotspots

1. **Stores:**
   - `src/stores/auth.store.ts` – auth state, profile completeness, landlord verification.
   - `src/stores/tech-support.store.ts` – tech‑support management with mocked data.
   - `src/stores/useInventoryStore.ts`, `src/stores/transfer.store.ts`, etc.

2. **Hooks:**
   - `src/hooks/use-auth.ts`, `use-rooms.ts`, `use-payments.ts`, `use-transfers.ts`, `use-notifications.ts`, `use-support.ts`.

3. **Utilities:**
   - `src/lib/utils/roommate-compatibility.ts`, `message-utils.ts`, `logger.ts`, `motion-presets.tsx`.

### 4.2 Consolidate duplicated logic

1. **Auth / profile checks:**
   - `useIsStudentProfileComplete`, `useIsLandlordVerified`, `useCanBook`, `useCanListHostels` in `auth.store.ts` currently duplicate checks using `(s.profile as any).type`.
   - **Refactor plan:**
     - Introduce a `Profile` discriminated union type with `type: 'student' | 'landlord' | ...`.
     - Create shared helper functions like `isStudentProfile(profile)` and `isLandlordProfile(profile)`.
     - Replace repeated casts and property checks with these helpers and typed predicates.

2. **Tech support API vs store:**
   - `src/lib/api/tech-support.ts` defines fully typed API functions, but `tech-support.store.ts` currently uses **mocked data** and doesn’t call them.
   - **Refactor plan:**
     - Replace mock `setTimeout` data with real `techSupportApi.*` calls once backend is ready.
     - Ensure the domain types (`TechSupportUser`, `TechSupportHostel`, etc.) are used end‑to‑end.

3. **Transfers and inventory:**
   - Check `useInventoryStore`, `transfer.store`, and corresponding hooks/components for repeated logic to derive active/history transfers, statuses, etc.
   - Extract shared helpers/utilities (e.g. `getActiveTransfer`, `partitionTransfersByStatus`) into a single utility module.

### 4.3 Remove or gate obsolete paths

- If there are older versions of features (e.g. legacy roommates logic vs new `roommate-compatibility` utilities, old vs new messaging implementations):
  - Decide on **one source of truth**.
  - Remove or clearly deprecate the obsolete implementation.
  - Update imports across the app to use the new unified logic only.

---

## 5. Remove Unused Files and Dead Code

1. **Detect unused modules via import graph:**
   - Use `ts-prune`, `knip`, or `depcheck` in the project root.
   - Alternatively, manually:
     - `rg "filename" src` for suspect files.
     - If a file is never imported and has no side‑effects, mark it for deletion.

2. **Categories of likely unused code:**
   - Early experimental components under `src/components/**` not referenced by any `page.tsx`.
   - Old hooks (`use-*`) that have been replaced by newer versions.
   - API client methods that are never consumed by stores/hooks.

3. **Process for removal:**
   1. Mark file/function as **candidate for removal** in a checklist.
   2. Confirm via search that it is truly unused.
   3. Delete the file or function.
   4. Re‑run `lint` and `tsc`.

---

## 6. Hardening Types Around External Boundaries

1. **API layer (`src/lib/api/**`):**
   - Every function should:
     - Take **typed params** (never `any`).
     - Return strongly typed responses using shared domain interfaces.
   - Introduce types for query params instead of `params?: any`.

2. **LocalStorage / JSON.parse usage:**
   - Wrap `JSON.parse` in safe helpers that validate shape.
   - Example: roommate quiz progress – define a `RoommateQuizState` type and a `parseRoommateQuizState(raw: string): RoommateQuizState | null` helper.

3. **WebSocket and real‑time hooks:**
   - In `use-websocket.ts`, define types for messages and events instead of using `any` payloads.
   - Ensure callbacks passed into hooks (onOpen/onMessage/etc.) are fully typed.

---

## 7. Final Production‑Readiness Checklist

Before calling the frontend **production‑ready**, ensure the following are true:

- **TypeScript & ESLint:**
  - `npx tsc -p tsconfig.json --noEmit` → **0 errors**.
  - `pnpm lint` / `npm run lint` → **0 errors, 0 warnings**.

- **Types:**
  - No `any` in `src/**` (except in very well‑documented, unavoidable interop cases).
  - No `@ts-ignore` or `eslint-disable` in normal code paths.

- **React / Hooks:**
  - No hook rule violations (`react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`, `refs` misuse, `setState` in effects without justification).

- **Business logic:**
  - Auth/profile, roommates, transfers, payments, tech‑support flows each have a **single, well‑typed source of truth**.
  - No duplicated or conflicting logic for the same domain concept.

- **Code hygiene:**
  - Unused components/hooks/APIs removed.
  - No dead feature code hidden in the tree.

---

## 8. How to Work Through This Plan Incrementally

1. **Phase 1 – Make the app compile:**
   - Fix JSX/TSX syntax issues and the most severe TS errors.
   - Ensure `npm run dev` works and main flows render.

2. **Phase 2 – Clean hooks and runtime stability:**
   - Fix all React hook errors/warnings.
   - Stabilize async hooks (`use-async`, `use-websocket`, `use-roommate-quiz`).

3. **Phase 3 – Type discipline:**
   - Sweep for `any`/`ts-ignore`/`eslint-disable` and replace.
   - Strengthen domain types and API contracts.

4. **Phase 4 – Business logic consolidation:**
   - Refactor duplicated logic into shared helpers.
   - Remove old/unused versions of business logic.

5. **Phase 5 – Dead code cleanup:**
   - Run an unused‑code tool and delete confirmed unused modules.

6. **Phase 6 – Final QA:**
   - Run full lint + typecheck + e2e/manual testing.
   - Freeze types and enable `noImplicitAny`/stricter TS options if not already enabled.
