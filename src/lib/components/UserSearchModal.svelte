<script lang="ts">
  import { goto } from '$app/navigation';
  import { ndk } from '$lib/ndk.svelte';
  import type { NDKUser } from '@nostr-dev-kit/ndk';
  import { MediaQuery } from 'svelte/reactivity';
  import * as Dialog from '$lib/components/ui/dialog';
  import { UserSearchCombobox } from '$lib/ndk/components/user-search';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  const { isOpen, onClose }: Props = $props();
  const isDesktop = new MediaQuery('(min-width: 768px)');

  function handleUserSelect(user: NDKUser) {
    goto(`/p/${user.npub}`);
    onClose();
  }
</script>

<Dialog.Root open={isOpen} onOpenChange={(newOpen: boolean) => { if (!newOpen) onClose(); }}>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>Search Users</Dialog.Title>
    </Dialog.Header>

    <UserSearchCombobox
      ndk={ndk}
      onSelect={handleUserSelect}
      placeholder="Search by name, NIP-05, or paste npub..."
    />
  </Dialog.Content>
</Dialog.Root>
