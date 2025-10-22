<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    subtitle?: string;
    actions?: Snippet;
    icon?: Snippet;
  }

  let { title, subtitle, actions, icon }: Props = $props();
</script>

<div class="border-b border-border bg-background">
  <div class="px-4 sm:px-6 lg:px-8 py-3">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3 min-w-0 flex-1">
        {#if icon}
          <div class="flex-shrink-0">
            {@render icon()}
          </div>
        {/if}
        <div class="min-w-0">
          <h1 class="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
          {#if subtitle}
            <p class="text-sm text-muted-foreground mt-1">{subtitle}</p>
          {/if}
        </div>
      </div>
      {#if actions}
        <div class="flex-shrink-0">
          {@render actions()}
        </div>
      {/if}
    </div>
  </div>
</div>
