# RUMIA Theme Implementation Guide

## 🎨 Theme System Overview

RUMIA uses a centralized theme system built on semantic CSS variables and Tailwind CSS v4. This ensures consistent theming across all dashboard components while maintaining accessibility and scalability.

## 🚨 Critical Rules (The Theme Contract)

### ❌ NEVER Use These Patterns
```tsx
// FORBIDDEN - Hardcoded colors
<div className="bg-white dark:bg-slate-900">
<div className="text-emerald-600 dark:text-emerald-400">
<div className="border-gray-200 dark:border-gray-700">
```

### ✅ ALWAYS Use Semantic Tokens
```tsx
// CORRECT - Semantic tokens
<div className="bg-card">
<div className="text-success">
<div className="border-border">
```

## 🎯 Semantic Token Mappings

| Concept | Semantic Token | Use Case |
|---------|----------------|----------|
| **Success** | `text-success`, `bg-success/10` | Completed actions, positive states |
| **Warning** | `text-warning`, `bg-warning/10` | Pending items, caution states |
| **Error** | `text-destructive`, `bg-destructive/10` | Errors, failed actions |
| **Info** | `text-info`, `bg-info/10` | Information, neutral states |
| **Surfaces** | `bg-card`, `bg-surface` | Cards, panels, containers |
| **Text** | `text-text-primary`, `text-text-muted` | Primary and secondary text |
| **Borders** | `border-border` | All borders and dividers |

## 🔧 Common Patterns

### Status Badges
```tsx
// Success state
<Badge className="bg-success/10 text-success border-success/20">
  Active
</Badge>

// Warning state  
<Badge className="bg-warning/10 text-warning border-warning/20">
  Pending
</Badge>

// Error state
<Badge className="bg-destructive/10 text-destructive border-destructive/20">
  Failed
</Badge>
```

### Interactive Cards
```tsx
<Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
  <CardContent>
    <h3 className="text-text-primary">Title</h3>
    <p className="text-text-muted">Description</p>
  </CardContent>
</Card>
```

### Statistics Cards
```tsx
<Card className="bg-card border-border shadow-sm">
  <CardContent className="p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-text-muted text-sm">Revenue</p>
        <p className="text-text-primary text-2xl font-bold">KES 50K</p>
      </div>
      <div className="p-3 rounded-2xl bg-success/10 text-success">
        <DollarSign className="h-6 w-6" />
      </div>
    </div>
  </CardContent>
</Card>
```

## 🛠️ Development Tools

### Theme Validator
```tsx
import { validateThemeClass, semanticClasses } from '@/lib/utils/theme-validator';

// Validate a className string
const validation = validateThemeClass('bg-emerald-50 text-emerald-600');
if (!validation.isValid) {
  console.log('Violations:', validation.violations);
  console.log('Suggestions:', validation.suggestions);
}

// Use predefined semantic classes
<div className={semanticClasses.cardInteractive}>
  Interactive card content
</div>
```

### ESLint Rules
The project includes custom ESLint rules that automatically detect and prevent hardcoded colors. Run:

```bash
npm run lint:theme
```

## 🧪 Testing Theme Consistency

### Manual Testing Checklist
- [ ] Component works in both light and dark modes
- [ ] All colors use semantic tokens (no hardcoded colors)
- [ ] Text meets WCAG AA contrast requirements
- [ ] Interactive elements have proper focus states
- [ ] Status colors are consistent across the application

### Automated Testing
```tsx
import { validateComponent } from '@/lib/utils/theme-validator';

// Test component props for theme violations
const testComponent = () => {
  const props = {
    className: 'bg-card text-text-primary border-border'
  };
  
  const validation = validateComponent('MyComponent', props);
  expect(validation.isValid).toBe(true);
};
```

## 📋 Component Development Guidelines

### 1. Before You Code
- Check if a similar component already exists
- Review the semantic token mappings
- Plan your color usage strategy

### 2. During Development
- Use semantic tokens for all colors
- Test in both light and dark modes
- Use the theme validator to catch violations

### 3. Before Committing
- Run ESLint theme rules
- Test component in both themes
- Verify accessibility compliance

## 🚨 Common Mistakes to Avoid

### Mistake 1: Using hardcoded colors
```tsx
// ❌ WRONG
<div className="bg-emerald-50 text-emerald-600 border-emerald-200">

// ✅ CORRECT
<div className="bg-success/10 text-success border-success/20">
```

### Mistake 2: Dark mode overrides
```tsx
// ❌ WRONG
<div className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">

// ✅ CORRECT
<div className="bg-card text-text-primary">
```

### Mistake 3: Mixing semantic and hardcoded
```tsx
// ❌ WRONG
<div className="bg-card text-emerald-600">

// ✅ CORRECT
<div className="bg-card text-success">
```

## 🔍 Migration Guide

### Converting Existing Components
1. **Identify hardcoded colors** using the theme validator
2. **Map to semantic tokens** using the token mappings
3. **Test in both themes** to ensure consistency
4. **Update tests** to validate theme compliance

### Example Migration
```tsx
// BEFORE
<Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700">
  <h3 className="text-gray-900 dark:text-gray-100">Title</h3>
  <p className="text-gray-600 dark:text-gray-400">Description</p>
  <div className="text-emerald-600 bg-emerald-50">Status</div>
</Card>

// AFTER
<Card className="bg-card border-border">
  <h3 className="text-text-primary">Title</h3>
  <p className="text-text-muted">Description</p>
  <div className="text-success bg-success/10">Status</div>
</Card>
```

## 📞 Getting Help

- **Theme Issues**: Check `theme.md` for detailed token documentation
- **Component Review**: Use the theme validator for automated checks
- **Accessibility**: Test with browser dev tools contrast checker
- **Questions**: Reference the semantic token mappings above

## 🎯 Success Metrics

A theme-compliant component should:
- ✅ Use only semantic color tokens
- ✅ Work perfectly in light and dark modes
- ✅ Pass WCAG AA contrast requirements
- ✅ Have no ESLint theme violations
- ✅ Be consistent with other components

---

**Remember**: Consistent theming is not just about aesthetics—it's about maintainability, accessibility, and user experience. Always use semantic tokens!
