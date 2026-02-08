## 0. Theme Governance & Ownership
The Rumia Theme System is a core design system asset. Changes to this system must be treated with design-system-level rigor.

*   **Ownership**: The Design Systems team (or designated Design System Owner) owns `themes.css` and `UnifiedThemeProvider`.
*   **Review Requirements**: Any PR modifying semantic tokens, current CSS variables, or the provider logic requires approval from a Design System Architect.
*   **Breaking Changes**: Renaming or removing existing tokens is considered a breaking change. Developers must provide a migration guide and a deprecation timeline in the `theme.md` history.

## 1. Problems Identified Before Refactor (Anti-Patterns)
Before the theme system was unified, the following critical issues were present:

*   **Fragmented Theme Logic**: Every dashboard (`Admin`, `Landlord`, `Student`, etc.) independently managed its own theme provider and persistence logic.
*   **Root Cause**: Lack of a centralized design system and poor separation of concerns between layout and authentication.
*   **Leakage**: Dark mode CSS was globally inclusive, causing "theme bleed" on public pages that were intended to be light-only.
*   **Hardcoded Color Hacks**: Widespread use of `text-emerald-500` or `indigo-600` utilities for branding instead of semantic tokens.
*   **Hydration Failures**: Inconsistent handling of `next-themes` leading to "Flash of Unstyled Content" (FOUC) and hydration mismatches on page load.
*   **Contrast Gaps**: Pure black backgrounds or low-contrast emeralds that failed WCAG AA accessibility standards.

## 2. Hard Rules (The Theme Contract)
All developers MUST adhere to these non-negotiable rules to maintain system integrity:

> [!IMPORTANT]
> **NO LOCAL THEME LOGIC**: Dashboards and layouts MUST NOT define their own theme state.
> 
> **ZERO HARDCODED COLORS**: Do not use raw Tailwind color utilities (e.g., `text-blue-500`, `bg-slate-900`) for permanent UI elements.
> 
> **SEMANTIC MAPPING**: Map all stylistic choices to semantic tokens. If a token is missing, propose a new global one instead of using a hack.
> 
> **FORCED LIGHT MODE**: Public routes and Auth pages MUST remain light-only. Theme toggling is strictly a dashboard feature.
> 
> **PROVIDER MONOPOLY**: Only `UnifiedThemeProvider` may be used to wrap layouts.

## 3. Architecture
The system is built on `next-themes` + Tailwind CSS v4 + Semantic CSS Variables.

### Key Components
1.  **`UnifiedThemeProvider`**: Manages global theme state. Support `forcedTheme` for light-only pages.
2.  **`themes.css`**: Centralized token store.
3.  **`ThemeToggle`**: Centralized, hydration-safe theme switcher.

## 4. Design Tokens (Taxonomy)

| Category | Token | Description |
| :--- | :--- | :--- |
| **Text** | `--text-primary` | Main content text. |
| | `--text-muted` | Secondary/de-emphasized text (WCAG compliant). |
| | `--text-inverse` | Text on top of primary/dark backgrounds. |
| **Surfaces** | `--background` | Main page background. |
| | `--surface` | Subtle background for sections/panels. |
| | `--card` | Surface for dashboard widgets and sidebars. |
| **UI** | `--border` | Standard border color. |
| | `--ring` | Focus ring color (mapped to primary). |
| | `--input` | Input field border/background. |
| **States** | `--primary` | Rumia Brand (Balanced Emerald). |
| | `--success` | Validation/Success statuses. |
| | `--warning` | Pending/Caution statuses. |
| | `--destructive` | Error/Critical statuses. |

## 5. Accessibility Policy
Accessibility is a core requirement, not a feature.

*   **WCAG AA Compliance**: All text-to-background combinations using semantic tokens must pass a 4.5:1 ratio (3:1 for large text).
*   **Color-Blind Safety**: Never rely solely on color to convey information. Combine status colors with icons (`AlertTriangle`, `CheckCircle`) or text labels.
*   **Focus Management**: All interactive elements must have a visible `--ring` on focus.

### QA Checklist for Theme Changes
- [ ] Does the element remain readable in Dark mode?
- [ ] Are muted labels still legible (check contrast)?
- [ ] On public pages, does switching the OS preference to Dark mode break anything? (It should stay Light).
- [ ] Is there a visual icon or label accompanying status colors?

## 6. Component Contribution Guidelines
When adding a new component:
1.  **Consume Tokens**: Use `text-text-primary`, `bg-background`, `border-border`, etc.
2.  **Test Both Modes**: Verify appearances in both Light and Dark dashboard themes.
3.  **Cross-Dashboard Check**: Ensure the component looks premium in both the Student sidebar and the Admin panel.
4.  **No Direct Utilities**: If you find yourself typing `text-gray-400`, use `text-text-muted` instead.

## 7. Common Mistakes
*   **Mistake**: Adding `dark:bg-slate-900` to a generic component.
    *   *Correction*: Rely on the semantic `--card` or `--background` mapping.
*   **Mistake**: Hardcoding `text-emerald-600` for a logo.
    *   *Correction*: Use `text-primary`.
*   **Mistake**: Using `next-themes`'s `useTheme` hook outside of a client component with a hydration check.
    *   *Correction*: Always check if `mounted` is true before rendering theme-dependent UI.

## 8. Public vs Dashboard Boundary Contract
To prevent theme leaks and maintain performance:

*   **Public Routes**: Must NEVER import or use `ThemeToggle` or the `useTheme` hook. They are locked to the Light theme.
*   **Dashboard Layouts**: Must NEVER assume the background is white. Always use semantic surface tokens.
*   **Shared Components**: Must be "theme-agnostic." Avoid hardcoding specific shades that only look good in one mode.
*   **Violation Example**: Importing a dashboard-specific `Sidebar` into the marketing `Hero` section. This will fail if the sidebar depends on Dark-mode specific tokens not handled by the forced-light provider.

## 9. Adding New Theme Tokens Safely
Do not add tokens ad-hoc. Follow this workflow:

1.  **Propose**: Propose a semantic token name (e.g., `--border-strong`).
2.  **Define**: Add the token to both `:root` (Light) and `.dark` blocks in `themes.css`.
3.  **Verify**: Use a contrast checker to ensure the new token meets WCAG AA standards in both modes.
4.  **Register**: Add the token to the `@theme` block in `themes.css` so it's available as a Tailwind utility.
5.  **Document**: Update the Design Tokens table in this file.

## 10. Theme Definition of Done (DoD)
A UI change is not "Done" until:
- [ ] Zero hardcoded Tailwind color utilities (e.g., `text-gray-500`) are used.
- [ ] Component accessibility (contrast) is verified in both Light and Dark themes.
- [ ] Public pages are confirmed to stay in Light mode regardless of OS settings.
- [ ] New tokens (if any) are added to the documentation taxonomy.

## 11. Developer Quick Start
### How to style a new component
**Bad Approach**:
```tsx
<div className="bg-white text-gray-900 border border-gray-200">...</div>
```
**Good Approach**:
```tsx
<div className="bg-card text-text-primary border-border">...</div>
```

### PR Review Checklist
- Does this PR introduce `text-(color)-(shade)`? (Should be rejected).
- Is the new UI verified in Dark mode?
- Does it break the Public vs. Dashboard boundary?

## 12. Theme Versioning & Changelog
To maintain transparency in large teams, all theme changes must be recorded:
- **Summary**: Record added/deprecated tokens and visual changes.
- **Breaking Changes**: Must include a version bump, migration notes, and a list of affected components.

## 13. Automated Guardrails (Recommended)
To prevent regressions at scale, the following are recommended:
- **Linting**: Add rules to flag hardcoded Tailwind colors (e.g., `text-gray-500`).
- **CI Checks**: Ensure `useTheme` is never imported in public routes.
- **Visual Testing**: Implement visual regression tests for core dashboard pages in both Light and Dark modes.

## 14. Token Deprecation Policy
Safely removing tokens is as important as adding them:
1. **Notice**: Mark tokens as deprecated in `theme.md` and code comments.
2. **Replacement**: Provide a clear replacement token and migration path.
3. **Timeline**: Allow a reasonable grace period before removal.
4. **Cleanup**: Only remove the token once zero usages remain in the codebase.
