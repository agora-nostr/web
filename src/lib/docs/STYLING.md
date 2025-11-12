# Styling Guidelines

**Version**: 1.0
**Last Updated**: 2025-11-12
**Status**: Active

## Table of Contents

1. [Philosophy](#philosophy)
2. [Tailwind v4 Architecture](#tailwind-v4-architecture)
3. [When to Use Tailwind vs Scoped Styles](#when-to-use-tailwind-vs-scoped-styles)
4. [Theme System](#theme-system)
5. [Component Variants](#component-variants)
6. [Dark Mode](#dark-mode)
7. [Spacing & Typography](#spacing--typography)
8. [Best Practices](#best-practices)
9. [Common Patterns](#common-patterns)
10. [Anti-Patterns](#anti-patterns)

---

## Philosophy

This project follows a **Tailwind-first approach** with clear exceptions for complex component styling. Our goal is:

- **Consistency**: Single source of truth for colors, spacing, and typography
- **Maintainability**: Clear patterns that are easy to understand and modify
- **Performance**: Optimized CSS output through Tailwind v4's native compilation
- **Type Safety**: Full TypeScript support for component variants and theme tokens
- **Developer Experience**: Autocomplete, clear documentation, predictable patterns

---

## Tailwind v4 Architecture

### Core Differences from v3

Tailwind v4 uses **CSS-first configuration** instead of JavaScript config files:

- **@theme directive**: Define design tokens in CSS that automatically generate utilities
- **No tailwind.config.js theme**: Theme values live in `src/app.css`
- **Native cascade layers**: Better CSS ordering without hijacking `@layer`
- **OKLch color space**: Perceptually uniform colors for better dark mode

### File Structure

```
src/
├── app.css              # Theme configuration with @theme directive
├── tailwind.config.js   # Minimal config (content paths, dark mode)
└── lib/
    ├── components/      # Components using Tailwind + scoped styles
    ├── utils/
    │   └── styles.ts    # Style utility functions
    └── variants/        # Type-safe component variants
```

---

## When to Use Tailwind vs Scoped Styles

### ✅ Use Tailwind Classes When:

1. **Styling markup you control directly**
   ```svelte
   <button class="px-4 py-2 bg-primary text-primary-foreground rounded-md">
     Click me
   </button>
   ```

2. **Simple, one-off component styles**
   ```svelte
   <div class="flex items-center gap-4 p-6 bg-card rounded-lg">
     <!-- Content -->
   </div>
   ```

3. **Responsive design**
   ```svelte
   <div class="text-sm sm:text-base md:text-lg">
     Responsive text
   </div>
   ```

4. **State variations**
   ```svelte
   <button class="hover:bg-primary/90 active:scale-95 disabled:opacity-50">
     Interactive
   </button>
   ```

### ✅ Use Scoped `<style>` Blocks When:

1. **Styling external/dynamic content**
   ```svelte
   <style>
     /* Markdown content from external sources */
     :global(.article-content h1) {
       font-size: 1.875rem;
       margin-top: 3rem;
     }
   </style>
   ```

2. **Complex animations with keyframes**
   ```svelte
   <style>
     @keyframes fade-in-scale {
       from {
         opacity: 0;
         transform: scale(0.95);
       }
       to {
         opacity: 1;
         transform: scale(1);
       }
     }

     .animated-element {
       animation: fade-in-scale 0.3s ease-out;
     }
   </style>
   ```

3. **Pseudo-element styling**
   ```svelte
   <style>
     .custom-scrollbar::-webkit-scrollbar {
       width: 0.5rem;
     }

     .custom-scrollbar::-webkit-scrollbar-thumb {
       background-color: var(--color-muted);
       border-radius: 9999px;
     }
   </style>
   ```

4. **Complex grid/flexbox layouts with calculations**
   ```svelte
   <style>
     .sidebar {
       width: calc(100% - 20rem);
       max-height: calc(100vh - 4rem);
     }
   </style>
   ```

### ❌ NEVER Use:

1. **@apply directives** (deprecated in v4, defeats purpose of utility-first)
2. **Hardcoded hex colors** (use theme tokens instead)
3. **Arbitrary spacing values** (stick to Tailwind scale)

---

## Theme System

### Defining Theme Tokens

All theme configuration lives in `src/app.css` using the `@theme` directive:

```css
@theme {
  /* Colors - automatically generate bg-*, text-*, border-* utilities */
  --color-primary: oklch(0.62 0.2 45);
  --color-primary-foreground: oklch(1 0 0);

  /* Border radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;

  /* Fonts */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-serif: 'Lora', Georgia, serif;
}
```

### Using Theme Tokens

**In Tailwind Classes:**
```svelte
<div class="bg-primary text-primary-foreground rounded-md">
  Uses theme tokens automatically
</div>
```

**In Scoped Styles:**
```svelte
<style>
  .custom-element {
    background-color: var(--color-primary);
    border-radius: var(--radius-md);
    font-family: var(--font-serif);
  }
</style>
```

**In JavaScript:**
```typescript
const primaryColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary')
  .trim();
```

### Theme Token Naming Convention

Follow Tailwind v4 namespaces for automatic utility generation:

| Namespace | Generates | Example |
|-----------|-----------|---------|
| `--color-*` | `bg-*`, `text-*`, `border-*` | `--color-primary` → `bg-primary` |
| `--font-*` | `font-*` | `--font-sans` → `font-sans` |
| `--radius-*` | `rounded-*` | `--radius-md` → `rounded-md` |
| `--spacing-*` | `p-*`, `m-*`, `gap-*` | Uses Tailwind defaults |

### Color System

We use **OKLch color space** for perceptually uniform colors:

```css
@theme {
  /* Lightness | Chroma | Hue */
  --color-primary: oklch(0.62 0.2 45);  /* Orange */
}
```

**Benefits:**
- Consistent perceived brightness across hues
- Better dark mode color adaptation
- More predictable color manipulation

---

## Component Variants

### Using tailwind-variants

We use `tailwind-variants` for type-safe component styling. All variants are centralized in `src/lib/variants/`.

### Available Variants

#### Button Variants (`src/lib/variants/button.ts`)

```typescript
import { buttonVariants } from '$lib/variants/button';

// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default, sm, lg, icon, icon-sm, icon-lg

buttonVariants({ variant: 'default', size: 'lg' });
```

**Example:**
```svelte
<script>
  import { buttonVariants } from '$lib/variants/button';
</script>

<button class={buttonVariants({ variant: 'default', size: 'default' })}>
  Click me
</button>
```

#### Input Variants (`src/lib/variants/input.ts`)

```typescript
import { inputVariants, textareaVariants } from '$lib/variants/input';

// Input variants
inputVariants({ size: 'md', error: false });

// Textarea variants
textareaVariants({ error: false, resize: 'vertical' });
```

**Example:**
```svelte
<script>
  import { inputVariants } from '$lib/variants/input';

  let value = $state('');
  let error = $state(false);
</script>

<input
  bind:value
  class={inputVariants({ size: 'md', error })}
  placeholder="Enter text..."
/>
```

#### Card Variants (`src/lib/variants/card.ts`)

```typescript
import {
  cardVariants,
  cardHeaderVariants,
  cardTitleVariants,
  cardDescriptionVariants,
  cardContentVariants,
  cardFooterVariants
} from '$lib/variants/card';

// Card variants: default, elevated, outline, ghost
// Padding: none, sm, md, lg
// Hover: true, false

cardVariants({ variant: 'default', padding: 'md', hover: false });
```

**Example:**
```svelte
<script>
  import { cardVariants, cardTitleVariants } from '$lib/variants/card';
</script>

<div class={cardVariants({ variant: 'elevated', padding: 'md' })}>
  <h2 class={cardTitleVariants({ size: 'md' })}>Card Title</h2>
  <p class="text-sm text-muted-foreground">Card description</p>
</div>
```

#### Badge Variants (`src/lib/variants/badge.ts`)

```typescript
import { badgeVariants } from '$lib/variants/badge';

// Variants: default, secondary, destructive, outline, success, warning

badgeVariants({ variant: 'success' });
```

**Example:**
```svelte
<script>
  import { badgeVariants } from '$lib/variants/badge';
</script>

<span class={badgeVariants({ variant: 'success' })}>
  Active
</span>
```

### Creating Custom Variants

```typescript
// src/lib/variants/my-component.ts
import { tv, type VariantProps } from 'tailwind-variants';

export const myComponentVariants = tv({
  base: 'base-classes-here',
  variants: {
    size: {
      sm: 'small-classes',
      md: 'medium-classes',
      lg: 'large-classes',
    },
    color: {
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
    },
  },
  defaultVariants: {
    size: 'md',
    color: 'primary',
  },
});

export type MyComponentVariants = VariantProps<typeof myComponentVariants>;
```

### Benefits of Variant System

- ✅ **Full TypeScript autocomplete** for variant names
- ✅ **Centralized style definitions** - change once, apply everywhere
- ✅ **Type-safe props** - compile-time checking
- ✅ **Easy to extend** - add new variants without touching components
- ✅ **Reusable** - use variants directly without wrapping in components
- ✅ **IDE support** - autocomplete for variant options

---

## Dark Mode

### Strategy

We use **class-based dark mode** with automatic system preference detection:

```javascript
// tailwind.config.js
export default {
  darkMode: 'class',  // Controlled by .dark class on <html>
};
```

### Defining Dark Mode Colors

Dark mode colors are defined using media queries in `app.css`:

```css
@theme {
  /* Light mode (default) */
  --color-background: oklch(0.96 0.01 60);
  --color-foreground: oklch(0.2 0 0);
}

/* Dark mode */
.dark {
  --color-background: oklch(0.2 0 0);
  --color-foreground: oklch(0.95 0 0);
}
```

### Using Dark Mode in Components

**With Tailwind:**
```svelte
<div class="bg-background text-foreground">
  Automatically adapts to dark mode via CSS variables
</div>
```

**With Arbitrary Values (when needed):**
```svelte
<a class="text-[oklch(0.55_0.2_250)] dark:text-[oklch(0.7_0.15_250)]">
  Custom link color with dark mode override
</a>
```

**❌ Don't:**
```svelte
<style>
  /* Avoid :global(.dark) when theme variables handle it */
  :global(.dark) .my-element {
    color: var(--color-primary);  /* Redundant - theme var already changes */
  }
</style>
```

---

## Spacing & Typography

### Spacing Scale

Use Tailwind's default spacing scale (0.25rem base unit):

| Class | Value | Usage |
|-------|-------|-------|
| `gap-1`, `p-1` | 0.25rem | Minimal spacing |
| `gap-2`, `p-2` | 0.5rem | Tight spacing |
| `gap-3`, `p-3` | 0.75rem | **Default gaps** |
| `gap-4`, `p-4` | 1rem | Standard padding |
| `gap-6`, `p-6` | 1.5rem | Card padding |
| `gap-8`, `p-8` | 2rem | Section spacing |

**In Scoped Styles:**
```css
.custom-component {
  gap: 0.75rem;  /* Equivalent to gap-3 */
  padding: 1rem;  /* Equivalent to p-4 */
}
```

### Typography Scale

```css
@theme {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-serif: 'Lora', Georgia, serif;
}
```

**Font Sizes:**

| Class | Size | Line Height | Usage |
|-------|------|-------------|-------|
| `text-sm` | 0.875rem | 1.25rem | Small text, captions |
| `text-base` | 1rem | 1.5rem | Body text |
| `text-lg` | 1.125rem | 1.75rem | Large body, article text |
| `text-xl` | 1.25rem | 1.75rem | Subheadings |
| `text-2xl` | 1.5rem | 2rem | Section headings |
| `text-3xl` | 1.875rem | 2.25rem | Page headings |

---

## Best Practices

### 1. Prefer Composition Over Duplication

**❌ Bad:**
```svelte
<button class="px-4 py-2 bg-primary text-white rounded-md">Save</button>
<button class="px-4 py-2 bg-primary text-white rounded-md">Cancel</button>
<button class="px-4 py-2 bg-primary text-white rounded-md">Submit</button>
```

**✅ Good:**
```svelte
<script>
  import Button from '$lib/components/ui/button';
</script>

<Button>Save</Button>
<Button>Cancel</Button>
<Button>Submit</Button>
```

### 2. Use Semantic Color Names

**❌ Bad:**
```svelte
<div class="bg-orange-500 text-white">Primary action</div>
```

**✅ Good:**
```svelte
<div class="bg-primary text-primary-foreground">Primary action</div>
```

### 3. Keep Responsive Breakpoints Consistent

```svelte
<!-- Mobile-first approach -->
<div class="text-sm sm:text-base md:text-lg">
  Consistent scaling
</div>
```

### 4. Avoid Magic Numbers

**❌ Bad:**
```css
.header {
  height: 73px;  /* Why 73? */
}
```

**✅ Good:**
```css
.header {
  height: 4.5rem;  /* 72px, aligns with spacing scale */
}
```

---

## Common Patterns

### Card Component

```svelte
<div class="bg-card border border-border rounded-lg p-6 shadow-sm">
  <h2 class="text-lg font-semibold text-foreground mb-2">Card Title</h2>
  <p class="text-sm text-muted-foreground">Card description</p>
</div>
```

### Form Input

```svelte
<input
  class="w-full px-3 py-2 bg-background border border-input rounded-md
         text-foreground placeholder:text-muted-foreground
         focus:outline-none focus:ring-2 focus:ring-ring"
  placeholder="Enter text..."
/>
```

### Flex Container

```svelte
<div class="flex items-center gap-4">
  <!-- Use gap instead of margin on children -->
  <img src="..." alt="..." class="w-10 h-10 rounded-full" />
  <div class="flex-1">
    <h3 class="font-medium">Title</h3>
    <p class="text-sm text-muted-foreground">Subtitle</p>
  </div>
</div>
```

---

## Anti-Patterns

### 1. Using @apply

**❌ Never:**
```css
.button {
  @apply px-4 py-2 bg-primary rounded-md;  /* Defeats utility-first approach */
}
```

**✅ Instead:**
- Use Tailwind classes directly in markup
- Create component variants for repeated patterns

### 2. Hardcoded Colors

**❌ Never:**
```css
.element {
  background: #fb923c;  /* Bypasses theme system */
}
```

**✅ Instead:**
```css
.element {
  background: var(--color-primary);
}
```

### 3. Arbitrary Spacing

**❌ Avoid:**
```svelte
<div class="gap-[13px]">  <!-- Doesn't align with scale -->
```

**✅ Instead:**
```svelte
<div class="gap-3">  <!-- 0.75rem, part of scale -->
```

### 4. Excessive :global()

**❌ Overuse:**
```css
:global(.dark) .my-component {
  color: var(--color-primary);  /* Redundant */
}
```

**✅ Let theme variables handle it:**
```css
.my-component {
  color: var(--color-primary);  /* Automatically adapts */
}
```

---

## Style Utility Functions

We provide helper functions in `src/lib/utils/styles.ts` for common styling patterns.

### Theme Token Access

```typescript
import { getThemeToken, setThemeToken, getThemeTokensWithPrefix } from '$lib/utils/styles';

// Get a single token
const primaryColor = getThemeToken('color-primary');
// Returns: "oklch(0.62 0.2 45)"

// Set a token dynamically
setThemeToken('color-primary', 'oklch(0.7 0.2 45)');

// Get all tokens with a prefix
const primaryColors = getThemeTokensWithPrefix('color-primary');
// Returns: { 'color-primary': '...', 'color-primary-foreground': '...', ... }
```

### Common Utilities

```typescript
import {
  focusRing,
  transition,
  container,
  flexCenter,
  truncate,
  hoverScale,
  isDarkMode,
  toggleDarkMode,
  setDarkMode
} from '$lib/utils/styles';

// Focus ring
const classes = focusRing({ offset: true, color: 'ring' });

// Transitions
const transitionClasses = transition('colors', 'normal');

// Container
const containerClasses = container({ maxWidth: '7xl', padding: true });

// Flex center
const flexClasses = flexCenter({ direction: 'col', gap: 4 });

// Truncate text
const truncateClasses = truncate({ lines: 2 });

// Hover scale
const hoverClasses = hoverScale({ scale: 110 });

// Dark mode helpers
if (isDarkMode()) {
  console.log('Dark mode is active');
}

toggleDarkMode(); // Toggle between light and dark
setDarkMode(true); // Set to dark mode
```

### VS Code Snippets

We provide VS Code snippets for common patterns. Type these prefixes and press Tab:

- `svbutton` - Button component with variants
- `svcard` - Card component with variants
- `svinput` - Input component with variants
- `svbadge` - Badge component with variants
- `impbutton` - Import button variants
- `impcard` - Import card variants
- `impvariants` - Import all variants
- `flexcenter` - Flex container centered both ways
- `flexcol` - Flex column with gap
- `grid` - Grid layout
- `gridr` - Responsive grid layout
- `svformfield` - Form field with label

---

## Quick Reference

**File to edit for theme changes:**
- `src/app.css` - All theme tokens

**When to use Tailwind:**
- Direct markup styling
- Responsive design
- State variations (hover, focus, etc.)

**When to use scoped styles:**
- External content styling
- Complex animations
- Pseudo-elements
- Dynamic calculations

**Never use:**
- `@apply` directives
- Hardcoded hex colors
- Arbitrary spacing values
- Excessive `:global()` selectors

**Variant files:**
- `src/lib/variants/button.ts` - Button variants
- `src/lib/variants/input.ts` - Input & textarea variants
- `src/lib/variants/card.ts` - Card variants
- `src/lib/variants/badge.ts` - Badge variants
- `src/lib/variants/index.ts` - Export all variants

**Utility helpers:**
- `src/lib/utils/styles.ts` - Style utility functions

**Developer tools:**
- `.vscode/svelte.code-snippets` - VS Code snippets
- `.vscode/settings.json` - Tailwind IntelliSense config

---

**For more information**, refer to:
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [tailwind-variants Docs](https://www.tailwind-variants.org/)
- [OKLch Color Picker](https://oklch.com/)
- [Svelte 5 Docs](https://svelte.dev/docs/svelte/overview)
