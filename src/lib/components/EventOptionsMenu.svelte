<script lang="ts">
  import { NDKEvent } from '@nostr-dev-kit/ndk';
  import { toast } from '$lib/stores/toast.svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Drawer from '$lib/components/ui/drawer';
  import { Button } from '$lib/components/ui/button';
  import RelayBadge from './RelayBadge.svelte';
  import ReportModal from './ReportModal.svelte';
  import { ndk } from '$lib/ndk.svelte';
  import { t } from 'svelte-i18n';
  import Icon from './Icon.svelte';

  interface Props {
    event: NDKEvent;
  }

  let { event }: Props = $props();

  const isDesktop = new MediaQuery('(min-width: 768px)');

  let showOptionsMenu = $state(false);
  let showRawEventModal = $state(false);
  let isReportModalOpen = $state(false);

  // Fetch current user's mute list
  const muteListSubscription = ndk.$subscribe(
    () => ndk.$currentUser?.pubkey ? ({
      filters: [{ kinds: [10000], authors: [ndk.$currentUser.pubkey], limit: 1 }],
      bufferMs: 100,
    }) : undefined
  );

  const isMuted = $derived.by(() => {
    const muteList = muteListSubscription.events[0];
    if (!muteList || !event.author) return false;
    return muteList.tags.some(tag => tag[0] === 'p' && tag[1] === event.author.pubkey);
  });

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${label}`);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error(`Failed to copy ${label}`);
    }
    showOptionsMenu = false;
  }

  function copyAuthorNprofile() {
    const nprofile = event.author.nprofile;
    copyToClipboard(nprofile, 'author nprofile');
  }

  function copyEventId() {
    const nevent = event.encode();
    copyToClipboard(nevent, 'event ID');
  }

  function viewRawEvent() {
    showOptionsMenu = false;
    showRawEventModal = true;
  }

  async function toggleMute() {
    if (!ndk.$currentUser?.pubkey || !event.author) return;

    try {
      let muteList = muteListSubscription.events[0];

      if (!muteList) {
        // Create new mute list
        muteList = new NDKEvent(ndk as any);
        muteList.kind = 10000;
        muteList.content = '';
        muteList.tags = [];
      }

      const pubkey = event.author.pubkey;

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
        const error = muteList.publishError as any;
        const relayErrors = (error as any)?.relayErrors || {};
        const errorMessages = Object.entries(relayErrors)
          .map(([relay, err]) => `${relay}: ${err}`)
          .join('\n');
        toast.error(`Failed to publish:\n${errorMessages || 'Unknown error'}`);
        return;
      }

      showOptionsMenu = false;
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      toast.error(`Failed to ${isMuted ? 'unmute' : 'mute'} user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  function handleOpenReport() {
    isReportModalOpen = true;
    showOptionsMenu = false;
  }

  $effect(() => {
    if (!showOptionsMenu) return;

    const handleClickOutside = () => {
      showOptionsMenu = false;
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });
</script>

<div class="relative flex-shrink-0">
  <button
    onclick={(e) => { e.stopPropagation(); showOptionsMenu = !showOptionsMenu; }}
    class="p-1 hover:bg-muted rounded-full transition-colors"
    type="button"
    aria-label="More options"
  >
    <svg class="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
    </svg>
  </button>

  {#if showOptionsMenu}
    <div
      class="absolute right-0 mt-1 w-72 bg-popover border border-border rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Mute button -->
      <button
        onclick={toggleMute}
        class="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-muted transition-colors first:rounded-t-lg flex items-center gap-3"
        type="button"
      >
        <Icon name={isMuted ? 'speaker' : 'speaker-muted'} size="md" class="text-red-500" />
        {isMuted ? $t('userDropdown.unmute') : $t('userDropdown.mute')}
      </button>

      <!-- Report button -->
      <button
        onclick={handleOpenReport}
        class="w-full px-4 py-3 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-3"
        type="button"
      >
        <Icon name="alert" size="md" class="text-yellow-500" />
        {$t('noteDropdown.report')}
      </button>

      <div class="border-t border-border my-1"></div>

      <!-- Copy author nprofile -->
      <button
        onclick={copyAuthorNprofile}
        class="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors"
        type="button"
      >
        Copy author (nprofile)
      </button>

      <!-- Copy event ID -->
      <button
        onclick={copyEventId}
        class="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors"
        type="button"
      >
        Copy ID (nevent)
      </button>

      <!-- View raw event -->
      <button
        onclick={viewRawEvent}
        class="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors"
        type="button"
      >
        View raw event
      </button>

      <!-- Relay information -->
      {#if event.relay?.url}
        <div class="border-t border-border mt-1 pt-1">
          <div class="px-4 py-2 text-xs text-muted-foreground">
            {event.relay.url}
          </div>
        </div>
      {:else if event.onRelays && event.onRelays.length > 0}
        <div class="border-t border-border mt-1 pt-1">
          <div class="px-4 py-2 text-xs text-muted-foreground font-medium">
            Seen on {event.onRelays.length} relay{event.onRelays.length === 1 ? '' : 's'}
          </div>
          <div class="px-2 pb-2 space-y-1">
            {#each event.onRelays as relay (relay.url)}
              <RelayBadge {relay} variant="compact" />
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- Raw Event Modal -->
{#if isDesktop.current}
  <Dialog.Root bind:open={showRawEventModal}>
    <Dialog.Content class="max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
      <Dialog.Header>
        <Dialog.Title>Raw Event</Dialog.Title>
        <Dialog.Description>
          JSON representation of this Nostr event
        </Dialog.Description>
      </Dialog.Header>

      <div class="flex-1 overflow-auto bg-muted/50 rounded-lg p-4 font-mono text-sm">
        <pre class="whitespace-pre-wrap break-words">{event.inspect}</pre>
      </div>

      <Dialog.Footer class="flex justify-end gap-2">
        <Button
          variant="outline"
          onclick={() => copyToClipboard(event.inspect, 'raw event')}
        >
          Copy to Clipboard
        </Button>
        <Button onclick={() => showRawEventModal = false}>
          Close
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{:else}
  <Drawer.Root bind:open={showRawEventModal}>
    <Drawer.Content>
      <Drawer.Header class="text-left">
        <Drawer.Title>Raw Event</Drawer.Title>
        <Drawer.Description>
          JSON representation of this Nostr event
        </Drawer.Description>
      </Drawer.Header>

      <div class="px-4 flex-1 overflow-auto bg-muted/50 rounded-lg p-4 font-mono text-sm">
        <pre class="whitespace-pre-wrap break-words">{event.inspect}</pre>
      </div>

      <Drawer.Footer class="pt-2">
        <Button
          variant="outline"
          onclick={() => copyToClipboard(event.inspect, 'raw event')}
        >
          Copy to Clipboard
        </Button>
        <Button onclick={() => showRawEventModal = false}>
          Close
        </Button>
      </Drawer.Footer>
    </Drawer.Content>
  </Drawer.Root>
{/if}

<ReportModal
  target={event}
  open={isReportModalOpen}
  onClose={() => isReportModalOpen = false}
/>
