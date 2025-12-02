/**
 * Style Utilities
 *
 * Helper functions for common styling patterns and theme token access.
 */

/**
 * Get a CSS theme token value from the DOM
 *
 * @param tokenName - The CSS variable name (with or without --)
 * @returns The computed token value
 *
 * @example
 * ```ts
 * const primaryColor = getThemeToken('color-primary');
 * // Returns: "oklch(0.62 0.2 45)"
 * ```
 */
export function getThemeToken(tokenName: string): string {
  const varName = tokenName.startsWith('--') ? tokenName : `--${tokenName}`;
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

/**
 * Set a CSS theme token value dynamically
 *
 * @param tokenName - The CSS variable name (with or without --)
 * @param value - The value to set
 *
 * @example
 * ```ts
 * setThemeToken('color-primary', 'oklch(0.7 0.2 45)');
 * ```
 */
export function setThemeToken(tokenName: string, value: string): void {
  const varName = tokenName.startsWith('--') ? tokenName : `--${tokenName}`;
  document.documentElement.style.setProperty(varName, value);
}

/**
 * Get all theme tokens matching a prefix
 *
 * @param prefix - The prefix to match (e.g., 'color-primary')
 * @returns Object with token names and values
 *
 * @example
 * ```ts
 * const primaryColors = getThemeTokensWithPrefix('color-primary');
 * // Returns: { 'color-primary': '...', 'color-primary-foreground': '...', ... }
 * ```
 */
export function getThemeTokensWithPrefix(prefix: string): Record<string, string> {
  const styles = getComputedStyle(document.documentElement);
  const tokens: Record<string, string> = {};

  Array.from(styles).forEach((propertyName) => {
    if (propertyName.startsWith(`--${prefix}`) || propertyName.startsWith(`--color-${prefix}`)) {
      const value = styles.getPropertyValue(propertyName).trim();
      if (value) {
        tokens[propertyName.replace('--', '')] = value;
      }
    }
  });

  return tokens;
}

/**
 * Focus ring utility classes
 *
 * Consistent focus ring styling across the application.
 *
 * @example
 * ```svelte
 * <button class="{focusRing()}">Click me</button>
 * <input class="{focusRing({ offset: true })}">
 * ```
 */
export function focusRing(options: { offset?: boolean; color?: string } = {}): string {
  const { offset = false, color = 'ring' } = options;
  const offsetClass = offset ? 'focus-visible:ring-offset-2' : '';

  return `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-${color} ${offsetClass}`.trim();
}

/**
 * Transition utility classes
 *
 * Common transition patterns.
 *
 * @example
 * ```svelte
 * <div class="{transition('colors')}">Smooth color transitions</div>
 * <div class="{transition('all', 'slow')}">Slow all transitions</div>
 * ```
 */
export function transition(
  property: 'colors' | 'opacity' | 'shadow' | 'transform' | 'all' = 'colors',
  duration: 'fast' | 'normal' | 'slow' = 'normal'
): string {
  const durationMap = {
    fast: 'duration-150',
    normal: 'duration-200',
    slow: 'duration-300',
  };

  return `transition-${property} ${durationMap[duration]}`;
}

/**
 * Responsive container utility
 *
 * Standard container with max-width and padding.
 *
 * @example
 * ```svelte
 * <div class="{container()}">
 *   Centered container with padding
 * </div>
 * ```
 */
export function container(options: { maxWidth?: string; padding?: boolean } = {}): string {
  const { maxWidth = '7xl', padding = true } = options;
  const paddingClass = padding ? 'px-4 sm:px-6 lg:px-8' : '';

  return `mx-auto max-w-${maxWidth} ${paddingClass}`.trim();
}

/**
 * Flex center utility
 *
 * Common flex centering patterns.
 *
 * @example
 * ```svelte
 * <div class="{flexCenter()}">Centered both ways</div>
 * <div class="{flexCenter({ direction: 'col', gap: 4 })}">Vertical with gap</div>
 * ```
 */
export function flexCenter(
  options: {
    direction?: 'row' | 'col';
    gap?: number;
    inline?: boolean;
  } = {}
): string {
  const { direction = 'row', gap, inline = false } = options;
  const flexType = inline ? 'inline-flex' : 'flex';
  const directionClass = direction === 'col' ? 'flex-col' : '';
  const gapClass = gap !== undefined ? `gap-${gap}` : '';

  return `${flexType} items-center justify-center ${directionClass} ${gapClass}`.trim();
}

/**
 * Truncate text utility
 *
 * Text truncation with ellipsis.
 *
 * @example
 * ```svelte
 * <p class="{truncate()}">Long text will be truncated...</p>
 * <p class="{truncate({ lines: 2 })}">Multi-line truncation</p>
 * ```
 */
export function truncate(options: { lines?: number } = {}): string {
  const { lines } = options;

  if (lines && lines > 1) {
    return `overflow-hidden text-ellipsis line-clamp-${lines}`;
  }

  return 'truncate';
}

/**
 * Screen reader only utility
 *
 * Hide element visually but keep it accessible to screen readers.
 *
 * @example
 * ```svelte
 * <span class="{srOnly()}">This is for screen readers only</span>
 * ```
 */
export function srOnly(): string {
  return 'sr-only';
}

/**
 * Hover scale utility
 *
 * Common hover scale animation.
 *
 * @example
 * ```svelte
 * <button class="{hoverScale()}">Hover me</button>
 * <img class="{hoverScale({ scale: 110 })}" alt="..." />
 * ```
 */
export function hoverScale(options: { scale?: number } = {}): string {
  const { scale = 105 } = options;
  return `transition-transform duration-200 hover:scale-${scale}`;
}

/**
 * Check if dark mode is currently active
 *
 * @returns True if dark mode is active
 *
 * @example
 * ```ts
 * if (isDarkMode()) {
 * }
 * ```
 */
export function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

/**
 * Toggle dark mode
 *
 * @example
 * ```ts
 * toggleDarkMode(); // Switches between light and dark
 * ```
 */
export function toggleDarkMode(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark');
}

/**
 * Set dark mode explicitly
 *
 * @param enabled - Whether to enable dark mode
 *
 * @example
 * ```ts
 * setDarkMode(true);  // Enable dark mode
 * setDarkMode(false); // Enable light mode
 * ```
 */
export function setDarkMode(enabled: boolean): void {
  if (typeof document === 'undefined') return;

  if (enabled) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * Get computed style value for an element
 *
 * @param element - The HTML element
 * @param property - The CSS property to get
 * @returns The computed value
 *
 * @example
 * ```ts
 * const bgColor = getComputedStyleValue(element, 'background-color');
 * ```
 */
export function getComputedStyleValue(element: HTMLElement, property: string): string {
  return getComputedStyle(element).getPropertyValue(property).trim();
}
