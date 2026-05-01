/**
 * Theme Validator Utility
 * 
 * This utility helps ensure consistent theming across the RUMI platform
 * by providing validation functions and semantic token mappings.
 * 
 * Usage:
 * - Import and use validateThemeClass() to check for hardcoded colors
 * - Use getSemanticToken() to map semantic concepts to theme tokens
 * - Run validateComponent() during development to catch theme violations
 */

// List of forbidden hardcoded color patterns
const HARDCODED_COLOR_PATTERNS = [
  /bg-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/,
  /text-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/,
  /border-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/,
  /dark:bg-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/,
  /dark:text-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/,
  /dark:border-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+/,
];

// Semantic token mappings for common concepts
const SEMANTIC_MAPPINGS: Record<string, string> = {
  // Status colors
  'success': 'text-success bg-success/10 border-success/20',
  'warning': 'text-warning bg-warning/10 border-warning/20', 
  'error': 'text-destructive bg-destructive/10 border-destructive/20',
  'info': 'text-info bg-info/10 border-info/20',
  
  // Surface colors
  'card': 'bg-card border-border',
  'surface': 'bg-surface border-border',
  'muted': 'bg-muted text-muted-foreground',
  
  // Text colors
  'primary-text': 'text-text-primary',
  'secondary-text': 'text-text-muted',
  'inverse-text': 'text-text-inverse',
  
  // Interactive elements
  'interactive': 'hover:bg-accent hover:text-accent-foreground',
  'focus': 'focus:ring-2 focus:ring-primary focus:ring-offset-2',
};

/**
 * Validates if a className string contains any hardcoded colors
 */
export function validateThemeClass(className: string): {
  isValid: boolean;
  violations: string[];
  suggestions: string[];
} {
  const violations: string[] = [];
  const suggestions: string[] = [];
  
  const classes = className.split(' ');
  
  for (const cls of classes) {
    for (const pattern of HARDCODED_COLOR_PATTERNS) {
      if (pattern.test(cls)) {
        violations.push(cls);
        
        // Suggest semantic alternatives
        if (cls.includes('emerald') || cls.includes('green')) {
          suggestions.push(cls.replace(/emerald-\d+|green-\d+/, 'success'));
        } else if (cls.includes('orange') || cls.includes('amber') || cls.includes('yellow')) {
          suggestions.push(cls.replace(/orange-\d+|amber-\d+|yellow-\d+/, 'warning'));
        } else if (cls.includes('red') || cls.includes('rose')) {
          suggestions.push(cls.replace(/red-\d+|rose-\d+/, 'destructive'));
        } else if (cls.includes('blue') || cls.includes('sky') || cls.includes('cyan')) {
          suggestions.push(cls.replace(/blue-\d+|sky-\d+|cyan-\d+/, 'info'));
        } else if (cls.includes('white') || cls.includes('gray') || cls.includes('slate')) {
          if (cls.startsWith('bg-')) {
            suggestions.push(cls.replace(/bg-(white|gray|slate)-\d+/, 'bg-card'));
          } else if (cls.startsWith('text-')) {
            suggestions.push(cls.replace(/text-(white|gray|slate)-\d+/, 'text-text-primary'));
          } else if (cls.startsWith('border-')) {
            suggestions.push(cls.replace(/border-(white|gray|slate)-\d+/, 'border-border'));
          }
        }
      }
    }
  }
  
  return {
    isValid: violations.length === 0,
    violations,
    suggestions,
  };
}

/**
 * Gets semantic token classes for a concept
 */
export function getSemanticToken(concept: keyof typeof SEMANTIC_MAPPINGS): string {
  return SEMANTIC_MAPPINGS[concept] || '';
}

/**
 * Validates a React component's className props for theme violations
 */
export function validateComponent(componentName: string, props: Record<string, any>): {
  isValid: boolean;
  violations: Array<{ prop: string; value: string; suggestions: string[] }>;
} {
  const violations: Array<{ prop: string; value: string; suggestions: string[] }> = [];
  let isValid = true;
  
  for (const [prop, value] of Object.entries(props)) {
    if (typeof value === 'string' && (prop === 'className' || prop.includes('Class'))) {
      const validation = validateThemeClass(value);
      if (!validation.isValid) {
        isValid = false;
        violations.push({
          prop,
          value,
          suggestions: validation.suggestions,
        });
      }
    }
  }
  
  return {
    isValid,
    violations,
  };
}

/**
 * Theme-aware className builder that prevents hardcoded colors
 */
export function cn(...inputs: Parameters<typeof Function.prototype['call']>): string {
  const classes = inputs.filter(Boolean).join(' ');
  const validation = validateThemeClass(classes);
  
  if (!validation.isValid && process.env.NODE_ENV === 'development') {
    console.warn(
      `🎨 Theme Violation Detected:\n` +
      `  Violations: ${validation.violations.join(', ')}\n` +
      `  Suggestions: ${validation.suggestions.join(', ')}\n` +
      `  Please use semantic tokens from themes.css`
    );
  }
  
  return classes;
}

/**
 * Common semantic class combinations for frequent patterns
 */
export const semanticClasses = {
  // Card variations
  card: 'bg-card border-border shadow-sm',
  cardInteractive: 'bg-card border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer',
  cardElevated: 'bg-card border-border shadow-lg',
  
  // Status indicators
  successBadge: 'bg-success/10 text-success border-success/20',
  warningBadge: 'bg-warning/10 text-warning border-warning/20', 
  errorBadge: 'bg-destructive/10 text-destructive border-destructive/20',
  infoBadge: 'bg-info/10 text-info border-info/20',
  
  // Interactive elements
  interactive: 'hover:bg-accent hover:text-accent-foreground transition-colors',
  focusable: 'focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none',
  
  // Text variations
  primaryText: 'text-text-primary',
  secondaryText: 'text-text-muted',
  inverseText: 'text-text-inverse',
  
  // Surface variations
  surface: 'bg-surface',
  mutedSurface: 'bg-muted',
  cardSurface: 'bg-card',
};

export default {
  validateThemeClass,
  getSemanticToken,
  validateComponent,
  cn,
  semanticClasses,
};
