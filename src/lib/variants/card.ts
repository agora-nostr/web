import { tv, type VariantProps } from 'tailwind-variants';

/**
 * Card component variants
 *
 * Usage:
 * ```svelte
 * <script>
 *   import { cardVariants } from '$lib/variants/card';
 * </script>
 *
 * <div class={cardVariants({ variant: 'default', padding: 'md' })}>
 *   Card content
 * </div>
 * ```
 */
export const cardVariants = tv({
  base: 'rounded-lg bg-card text-card-foreground',
  variants: {
    variant: {
      default: 'border border-border shadow-sm',
      elevated: 'shadow-lg',
      outline: 'border-2 border-border',
      ghost: 'shadow-none',
    },
    padding: {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
    hover: {
      true: 'transition-shadow hover:shadow-md cursor-pointer',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
    hover: false,
  },
});

export type CardVariants = VariantProps<typeof cardVariants>;

/**
 * Card Header variants
 */
export const cardHeaderVariants = tv({
  base: 'flex flex-col space-y-1.5',
  variants: {
    padding: {
      none: '',
      default: 'p-6',
    },
  },
  defaultVariants: {
    padding: 'default',
  },
});

export type CardHeaderVariants = VariantProps<typeof cardHeaderVariants>;

/**
 * Card Title variants
 */
export const cardTitleVariants = tv({
  base: 'font-semibold leading-none tracking-tight',
  variants: {
    size: {
      sm: 'text-base',
      md: 'text-lg',
      lg: 'text-2xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type CardTitleVariants = VariantProps<typeof cardTitleVariants>;

/**
 * Card Description variants
 */
export const cardDescriptionVariants = tv({
  base: 'text-sm text-muted-foreground',
});

export type CardDescriptionVariants = VariantProps<typeof cardDescriptionVariants>;

/**
 * Card Content variants
 */
export const cardContentVariants = tv({
  base: '',
  variants: {
    padding: {
      none: '',
      default: 'p-6 pt-0',
    },
  },
  defaultVariants: {
    padding: 'default',
  },
});

export type CardContentVariants = VariantProps<typeof cardContentVariants>;

/**
 * Card Footer variants
 */
export const cardFooterVariants = tv({
  base: 'flex items-center',
  variants: {
    padding: {
      none: '',
      default: 'p-6 pt-0',
    },
  },
  defaultVariants: {
    padding: 'default',
  },
});

export type CardFooterVariants = VariantProps<typeof cardFooterVariants>;
