<script lang="ts">
  import { goto } from '$app/navigation';
  import { ndk } from '$lib/ndk.svelte';
  import { NDKKind, NDKEvent, NDKUser } from '@nostr-dev-kit/ndk';
  import { toast } from '$lib/stores/toast.svelte';
  import { t } from 'svelte-i18n';
  import { createLazyFeed } from '$lib/utils/lazyFeed.svelte';
  import ReportModal from '$lib/components/ReportModal.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    pubkey: string;
    isOpen: boolean;
    onClose: () => void;
    onOpenCreatePack: () => void;
  }

  let { pubkey, isOpen, onClose, onOpenCreatePack }: Props = $props();

  const reportTarget = $derived(new NDKUser({ pubkey }));

  // Fetch current user's created follow packs
  const userPacksFeed = createLazyFeed(
    ndk,
    () => ndk.$currentUser?.pubkey ? {
      filters: [{ kinds: [39089, 39092], authors: [ndk.$currentUser.pubkey], limit: 100 }]
    } : undefined,
    { initialLimit: 100, pageSize: 100 }
  );

  // Fetch current user's mute list
  const muteListSubscription = ndk.$subscribe(
    () => ndk.$currentUser?.pubkey ? ({
      filters: [{ kinds: [10000], authors: [ndk.$currentUser.pubkey], limit: 1 }],
      bufferMs: 100,
    }) : undefined
  );

  interface UserPack {
    id: string;
    title: string;
    pubkeys: string[];
  }

  const userPacks = $derived.by((): UserPack[] => {
    return userPacksFeed.events.map(event => ({
      id: event.id || '',
      title: event.tagValue('title') || 'Untitled Pack',
      pubkeys: event.tags.filter(t => t[0] === 'p').map(t => t[1]),
    }));
  });

  const isMuted = $derived.by(() => {
    const muteList = muteListSubscription.events[0];
    if (!muteList) return false;
    return muteList.tags.some(tag => tag[0] === 'p' && tag[1] === pubkey);
  });

  let isReportModalOpen = $state(false);

  async function addToExistingPack(packId: string) {
    if (!pubkey) return;

    const packEvent = userPacksFeed.events.find(e => e.id === packId);
    if (!packEvent) return;

    try {
      const existingPubkeys = packEvent.tags.filter(t => t[0] === 'p').map(t => t[1]);
      if (existingPubkeys.includes(pubkey)) {
        return;
      }

      packEvent.tags.push(['p', pubkey]);
      await packEvent.sign();
      await packEvent.publishReplaceable();

      if (packEvent.publishStatus === 'error') {
        const error = packEvent.publishError;
        const relayErrors = (error as any)?.relayErrors || {};
        const errorMessages = Object.entries(relayErrors)
          .map(([relay, err]) => `${relay}: ${err}`)
          .join('\n');
        toast.error(`Failed to publish:\n${errorMessages || 'Unknown error'}`);
        return;
      }

      toast.success('Added to pack');
      onClose();
    } catch (error) {
      console.error('Failed to add to pack:', error);
      toast.error(`Failed to add to pack: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function toggleMute() {
    if (!ndk.$currentUser?.pubkey) return;

    try {
      let muteList = muteListSubscription.events[0];

      if (!muteList) {
        // Create new mute list
        muteList = new NDKEvent(ndk);
        muteList.kind = 10000;
        muteList.content = '';
        muteList.tags = [];
      }

      if (isMuted) {
        // Remove from mute list
        muteList.tags = muteList.tags.filter(tag => !(tag[0] === 'p' && tag[1] === pubkey));
        toast.success('User unmuted');
      } else {
        // Add to mute list
        muteList.tags.push(['p', pubkey]);
        toast.success('User muted');
      }

      await muteList.sign();
      await muteList.publishReplaceable();

      if (muteList.publishStatus === 'error') {
        const error = muteList.publishError;
        const relayErrors = (error as any)?.relayErrors || {};
        const errorMessages = Object.entries(relayErrors)
          .map(([relay, err]) => `${relay}: ${err}`)
          .join('\n');
        toast.error(`Failed to publish:\n${errorMessages || 'Unknown error'}`);
        return;
      }

      onClose();
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      toast.error(`Failed to ${isMuted ? 'unmute' : 'mute'} user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function handleCreatePack() {
    onClose();
    onOpenCreatePack();
  }

  function handleOpenReport() {
    isReportModalOpen = true;
    onClose();
  }

  function handleSendDM() {
    const user = new NDKUser({ pubkey });
    goto(`/messages/${user.npub}`);
    onClose();
  }
</script>

{#if isOpen}
  <div class="absolute right-0 mt-2 w-64 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50">
    <div class="py-1">
      <!-- Send DM button -->
      <button
        onclick={handleSendDM}
        class="w-full px-4 py-3 text-left text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center gap-3"
      >
        <Icon name="message" size="md" class="text-primary" />
        Send Message
      </button>

      <div class="border-t border-border my-1"></div>

      <!-- Mute/Unmute button -->
      <button
        onclick={toggleMute}
        class="w-full px-4 py-3 text-left text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center gap-3"
      >
        <Icon name={isMuted ? 'speaker' : 'speaker-muted'} size="md" class="text-red-500" />
        {isMuted ? $t('userDropdown.unmute') : $t('userDropdown.mute')}
      </button>

      <!-- Report button -->
      <button
        onclick={handleOpenReport}
        class="w-full px-4 py-3 text-left text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center gap-3"
      >
        <Icon name="alert" size="md" class="text-yellow-500" />
        {$t('userDropdown.report')}
      </button>

      <div class="border-t border-border my-1"></div>

      <!-- Create new pack button -->
      <button
        onclick={handleCreatePack}
        class="w-full px-4 py-3 text-left text-sm text-muted-foreground hover:bg-muted transition-colors flex items-center gap-3"
      >
        <Icon name="plus" size="md" class="text-primary" />
        {$t('followPacks.createNew')}
      </button>

      {#if userPacks.length > 0}
        <div class="border-t border-border mt-1 pt-1">
          <div class="px-4 py-2 text-xs text-muted-foreground font-medium">
            {$t('followPacks.addToExisting')}
          </div>
          {#each userPacks as pack (pack.id)}
            {@const alreadyInPack = pack.pubkeys.includes(pubkey)}
            <button
              onclick={() => addToExistingPack(pack.id)}
              disabled={alreadyInPack}
              class="w-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between gap-2"
            >
              <span class="truncate">{pack.title}</span>
              {#if alreadyInPack}
                <Icon name="check" size="sm" class="text-green-500 flex-shrink-0" />
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<ReportModal
  target={reportTarget}
  open={isReportModalOpen}
  onClose={() => isReportModalOpen = false}
/>
