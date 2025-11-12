import { tv, type VariantProps } from 'tailwind-variants';

/**
 * Input component variants
 *
 * Usage:
 * ```svelte
 * <script>
 *   import { inputVariants } from '$lib/variants/input';
 * </script>
 *
 * <input class={inputVariants({ size: 'md', error: false })} />
 * ```
 */
export const inputVariants = tv({
  base: [
    'flex w-full rounded-md',
    'bg-background text-foreground',
    'border border-input',
    'transition-colors',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  variants: {
    size: {
      sm: 'h-9 px-3 py-1 text-sm',
      md: 'h-10 px-3 py-2',
      lg: 'h-11 px-4 py-3',
    },
    error: {
      true: 'border-destructive focus-visible:ring-destructive',
      false: '',
    },
  },
  defaultVariants: {
    size: 'md',
    error: false,
  },
});

export type InputVariants = VariantProps<typeof inputVariants>;

/**
 * Textarea component variants (extends input)
 */
export const textareaVariants = tv({
  base: [
    'flex min-h-[80px] w-full rounded-md',
    'bg-background text-foreground',
    'border border-input',
    'px-3 py-2',
    'transition-colors',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  variants: {
    error: {
      true: 'border-destructive focus-visible:ring-destructive',
      false: '',
    },
    resize: {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    },
  },
  defaultVariants: {
    error: false,
    resize: 'vertical',
  },
});

export type TextareaVariants = VariantProps<typeof textareaVariants>;
