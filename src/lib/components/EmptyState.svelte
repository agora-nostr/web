<script lang="ts">
  import Icon from './Icon.svelte';
  import type { IconName } from './Icon.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    icon?: IconName;
    title: string;
    description?: string;
    action?: Snippet;
    size?: 'sm' | 'md' | 'lg';
    class?: string;
  }

  const {
    icon,
    title,
    description,
    action,
    size = 'md',
    class: className = ''
  }: Props = $props();

  const containerPadding = $derived({
    sm: 'py-6',
    md: 'py-12',
    lg: 'py-16'
  }[size]);

  const iconSize = $derived({
    sm: 'lg' as const,
    md: 'xl' as const,
    lg: 'xl' as const
  }[size]);

  const titleSize = $derived({
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }[size]);

  const descriptionSize = $derived({
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size]);
</script>

<div class="flex flex-col items-center justify-center {containerPadding} {className}">
  {#if icon}
    <div class="mb-3 text-muted-foreground opacity-50">
      <Icon name={icon} size={iconSize} />
    </div>
  {/if}

  <p class="{titleSize} font-medium text-muted-foreground text-center">
    {title}
  </p>

  {#if description}
    <p class="{descriptionSize} text-muted-foreground/70 text-center mt-1 max-w-md">
      {description}
    </p>
  {/if}

  {#if action}
    <div class="mt-4">
      {@render action()}
    </div>
  {/if}
</div>
