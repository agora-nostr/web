<script lang="ts">
  import { goto } from '$app/navigation';
  import { ndk } from '$lib/ndk.svelte';
  import type { NDKUser } from '@nostr-dev-kit/ndk';
  import { MediaQuery } from 'svelte/reactivity';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Drawer from '$lib/components/ui/drawer';
  import { UserSearchCombobox } from '$lib/ndk/components/user/inputs/search';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  const { isOpen, onClose }: Props = $props();
  const isDesktop = new MediaQuery('(min-width: 768px)');

  function handleUserSelect(user: NDKUser) {
    goto(`/messages/${user.npub}`);
    onClose();
  }
</script>

{#if isDesktop.current}
  <Dialog.Root open={isOpen} onOpenChange={(newOpen) => { if (!newOpen) onClose(); }}>
    <Dialog.Content class="max-w-md">
      <Dialog.Header>
        <Dialog.Title>New Message</Dialog.Title>
      </Dialog.Header>

      <UserSearchCombobox
        ndk={ndk}
        onSelect={handleUserSelect}
        placeholder="Search by name, NIP-05, or paste npub..."
      />
    </Dialog.Content>
  </Dialog.Root>
{:else}
  <Drawer.Root open={isOpen} onOpenChange={(newOpen) => { if (!newOpen) onClose(); }}>
    <Drawer.Content>
      <Drawer.Header class="text-left">
        <Drawer.Title>New Message</Drawer.Title>
      </Drawer.Header>

      <div class="px-4 pb-4">
        <UserSearchCombobox
          ndk={ndk}
          onSelect={handleUserSelect}
          placeholder="Search by name, NIP-05, or paste npub..."
        />
      </div>
    </Drawer.Content>
  </Drawer.Root>
{/if}
