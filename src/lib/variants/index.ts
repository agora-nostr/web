/**
 * Component Variants
 *
 * Type-safe component styling variants using tailwind-variants.
 * Import and use these in your components for consistent, maintainable styling.
 *
 * @example
 * ```svelte
 * <script>
 *   import { buttonVariants } from '$lib/variants';
 * </script>
 *
 * <button class={buttonVariants({ variant: 'default', size: 'md' })}>
 *   Click me
 * </button>
 * ```
 */

export * from './button';
export * from './input';
export * from './card';
export * from './badge';
