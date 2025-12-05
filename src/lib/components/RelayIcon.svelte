<script lang="ts">
  import { useRelayInfoCached } from '$lib/utils/relayInfo.svelte';

  interface Props {
    relayUrl: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    class?: string;
  }

  const { relayUrl, size = 'md', class: className = '' }: Props = $props();

  const relayInfo = $derived.by(() => useRelayInfoCached(relayUrl));

  const sizeClasses = $derived({
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size]);

  const svgSizeClasses = $derived({
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }[size]);
</script>

{#if relayInfo.info?.icon}
  <img src={relayInfo.info.icon} alt="" class="{sizeClasses} rounded flex-shrink-0 {className}" />
{:else}
  <div class="{sizeClasses} rounded bg-muted flex items-center justify-center flex-shrink-0 {className}">
    <svg class="{svgSizeClasses} text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  </div>
{/if}
