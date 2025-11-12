<script lang="ts">
  import { goto } from '$app/navigation';
  import { ndk } from '$lib/ndk.svelte';
  import type { NDKUser } from '@nostr-dev-kit/ndk';
  import * as Dialog from '$lib/components/ui/dialog';
  import { UserSearchCombobox } from '$lib/ndk/components/user-search';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  const { isOpen, onClose }: Props = $props();

  function handleUserSelect(user: NDKUser) {
    goto(`/messages/${user.npub}`);
    onClose();
  }
</script>

<Dialog.Root open={isOpen} onOpenChange={(newOpen: boolean) => { if (!newOpen) onClose(); }}>
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