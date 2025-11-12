<script lang="ts">
  import { page } from '$app/stores';
  import Icon from '../Icon.svelte';

  interface FABConfig {
    icon: string;
    label?: string;
    action: () => void;
  }

  interface Props {
    onComposeClick?: () => void;
    onListingClick?: () => void;
    onInviteClick?: () => void;
    onTradeClick?: () => void;
  }

  const {
    onComposeClick = () => {},
    onListingClick = () => {},
    onInviteClick = () => {},
    onTradeClick = () => {}
  }: Props = $props();

  const currentPath = $derived($page.url.pathname);

  // Route-based FAB configuration
  const fabConfig: Record<string, FABConfig> = {
    '/': {
      icon: 'edit',
      label: 'Compose',
      action: onComposeClick
    },
    '/marketplace': {
      icon: 'plus',
      label: 'Create Listing',
      action: onListingClick
    },
    '/agora/invites': {
      icon: 'users',
      label: 'Create Invite',
      action: onInviteClick
    },
    '/trades': {
      icon: 'plus',
      label: 'Create Order',
      action: onTradeClick
    }
  };

  // Get current FAB configuration based on route
  const currentConfig = $derived(fabConfig[currentPath]);

  // Only show FAB on mobile
  const shouldShow = $derived(currentConfig !== undefined);
</script>

{#if shouldShow && currentConfig}
  <button
    onclick={currentConfig.action}
    class="fixed bottom-24 right-4 z-[500] bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground p-4 rounded-full shadow-lg transition-all lg:hidden"
    aria-label={currentConfig.label || 'Floating action button'}
  >
    {#if currentConfig.icon === 'edit'}
      <!-- Custom edit icon (matches the original) -->
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    {:else}
      <Icon name={currentConfig.icon} size="lg" />
    {/if}
  </button>
{/if}