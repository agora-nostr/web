<script lang="ts">
  import { setContext } from 'svelte';
  import { ndk } from '$lib/ndk.svelte';
  import { messagesStore } from '$lib/stores/messages.svelte';
  import { npubCashMonitor } from '$lib/services/npubcashMonitor.svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import DesktopLayout from './layouts/DesktopLayout.svelte';
  import MobileLayout from './layouts/MobileLayout.svelte';
  import UserSearchModal from './UserSearchModal.svelte';
  import ComposeDialog from './ComposeDialog.svelte';
  import CreateListingModal from './CreateListingModal.svelte';
  import CreateInviteModal from './invite/CreateInviteModal.svelte';
  import CreateOrderModal from './trades/CreateOrderModal.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  const { children }: Props = $props();

  // Set NDK in Svelte context for child components
  setContext('ndk', ndk);

  // Responsive detection
  const isDesktop = new MediaQuery('(min-width: 1024px)');

  // Modal states
  let isSearchModalOpen = $state(false);
  let isComposeModalOpen = $state(false);
  let isCreateListingModalOpen = $state(false);
  let isCreateInviteModalOpen = $state(false);
  let isCreateOrderModalOpen = $state(false);

  // Modal handlers
  const handleSearchClick = () => {
    isSearchModalOpen = true;
  };

  const handleComposeClick = () => {
    isComposeModalOpen = true;
  };

  const handleListingClick = () => {
    isCreateListingModalOpen = true;
  };

  const handleInviteClick = () => {
    isCreateInviteModalOpen = true;
  };

  const handleTradeClick = () => {
    isCreateOrderModalOpen = true;
  };

  // Primary action handler - context-aware based on route
  const handlePrimaryAction = () => {
    const path = window.location.pathname;
    if (path === '/marketplace') {
      handleListingClick();
    } else if (path === '/trades') {
      handleTradeClick();
    } else if (path === '/agora/invites') {
      handleInviteClick();
    } else {
      handleComposeClick();
    }
  };

  // Handle messages subscription lifecycle
  $effect(() => {
    const user = ndk.$currentUser;
    const hasSigner = !!ndk.signer;

    if (user && hasSigner) {
      messagesStore.start();
    } else {
      messagesStore.stop();
    }
  });

  // Handle npub.cash monitor lifecycle
  $effect(() => {
    if (ndk.$currentUser) {
      npubCashMonitor.start();
    } else {
      npubCashMonitor.stop();
    }

    return () => {
      npubCashMonitor.stop();
    };
  });
</script>

<div class="bg-background">
  <!-- Responsive Layout Switcher -->
  {#if isDesktop.current}
    <DesktopLayout onSearchClick={handleSearchClick} onPrimaryAction={handlePrimaryAction}>
      {@render children()}
    </DesktopLayout>
  {:else}
    <MobileLayout
      onComposeClick={handleComposeClick}
      onListingClick={handleListingClick}
      onInviteClick={handleInviteClick}
      onTradeClick={handleTradeClick}
    >
      {@render children()}
    </MobileLayout>
  {/if}

  <!-- Modals Portal -->
  <!-- User Search Modal -->
  <UserSearchModal
    isOpen={isSearchModalOpen}
    onClose={() => isSearchModalOpen = false}
  />

  <!-- Compose Modal -->
  <ComposeDialog bind:open={isComposeModalOpen} />

  <!-- Create Listing Modal -->
  <CreateListingModal bind:open={isCreateListingModalOpen} />

  <!-- Create Invite Modal -->
  <CreateInviteModal
    bind:isOpen={isCreateInviteModalOpen}
    onClose={() => isCreateInviteModalOpen = false}
  />

  <!-- Create Order Modal (for trades) -->
  {#if isCreateOrderModalOpen}
    <CreateOrderModal
      open={isCreateOrderModalOpen}
      onClose={() => isCreateOrderModalOpen = false}
    />
  {/if}
</div>