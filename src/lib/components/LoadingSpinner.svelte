<script lang="ts">
  interface Props {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    class?: string;
  }

  const { size = 'md', class: className = '' }: Props = $props();

  const sizeClasses = $derived({
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }[size]);

  const borderWidth = $derived({
    xs: 'border',
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-3',
    xl: 'border-4'
  }[size]);
</script>

<div
  class="inline-block {sizeClasses} {borderWidth} border-current border-t-transparent rounded-full animate-spin {className}"
  role="status"
  aria-label="Loading"
>
  <span class="sr-only">Loading...</span>
</div>
