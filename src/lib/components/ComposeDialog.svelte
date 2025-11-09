<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import { NDKEvent, NDKRelaySet } from '@nostr-dev-kit/ndk';
  import { User } from '$lib/ndk/ui/user';
  import { toast } from '$lib/stores/toast.svelte';
  import { useRelayInfoCached } from '$lib/utils/relayInfo.svelte';
  import { clickOutside } from '$lib/utils/clickOutside';
  import { portal } from '$lib/utils/portal.svelte';
  import { browser } from '$app/environment';
  import { MediaQuery } from 'svelte/reactivity';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Drawer from '$lib/components/ui/drawer';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import ContentComposer from '$lib/components/ContentComposer.svelte';
  import RelayPublishDropdownContent from '$lib/components/RelayPublishDropdownContent.svelte';
  import { useModalRelaySelection } from '$lib/composables/useModalRelaySelection.svelte';
  import NoteCard from '$lib/components/NoteCard.svelte';
  import Icon from './Icon.svelte';

  const isDesktop = new MediaQuery('(min-width: 768px)');

  interface Props {
    open?: boolean;
    onClose?: () => void;
    replyTo?: NDKEvent;
    quotedEvent?: NDKEvent;
    onPublished?: () => void;
  }

  let { open = $bindable(false), onClose, replyTo, quotedEvent, onPublished }: Props = $props();

  let content = $state('');
  let isPublishing = $state(false);
  let isRelayDropdownOpen = $state(false);
  let isProtected = $state(false);
  let showProtectedInfo = $state(false);
  let selectedMentions = $state<string[]>([]);
  let composerRef: ContentComposer;

  let replyToProfile = $state<import('@nostr-dev-kit/ndk').NDKUserProfile | null>(null);

  $effect(() => {
    if (!replyTo) {
      replyToProfile = null;
      return;
    }
    replyTo.author.fetchProfile().then(p => { replyToProfile = p; });
  });

  const relaySelection = useModalRelaySelection(() => open);
  const { selectedRelayUrls, allRelays } = $derived(relaySelection);

  async function publishNote() {
    if (!content.trim() || isPublishing || selectedRelayUrls.length === 0) return;

    try {
      isPublishing = true;

      // Get content with nostr entities (replace markers with actual nostr: links)
      const contentWithEntities = composerRef?.getContentWithNostrEntities() ?? content;

      let event: NDKEvent;

      if (replyTo) {
        event = replyTo.reply();
      } else if (quotedEvent) {
        event = new NDKEvent(ndk);
        event.kind = 1;
        event.tag(quotedEvent, undefined, false, "q");
      } else {
        event = new NDKEvent(ndk);
        event.kind = 1;
      }

      event.content = quotedEvent ? `${contentWithEntities}\nnostr:${quotedEvent.encode()}` : contentWithEntities;

      if (!replyTo) {
        event.isProtected = isProtected;
      }

      // Add mention tags
      selectedMentions.forEach(pubkey => {
        event.tags.push(['p', pubkey]);
      });

      await event.sign();

      // Create a relay set from the selected relay URLs
      const relaySet = NDKRelaySet.fromRelayUrls(selectedRelayUrls, ndk);
      await event.publish(relaySet);

      if (event.publishStatus === 'error') {
        const error = event.publishError;
        console.error('Publish error object:', error);
        console.error('Relay errors:', (error as any)?.relayErrors);

        const relayErrors = (error as any)?.relayErrors || {};
        const relayErrorEntries = Object.entries(relayErrors);

        if (relayErrorEntries.length > 0) {
          const errorMessages = relayErrorEntries
            .map(([relay, err]) => `• ${relay.replace('wss://', '')}: ${err}`)
            .join('\n');
          toast.error(`Failed to publish to relays:\n\n${errorMessages}`);
        } else {
          toast.error(`Failed to publish: ${error?.message || 'Not enough relays received the event'}`);
        }
        return;
      }

      composerRef?.reset();
      content = '';
      selectedMentions = [];
      open = false;
      toast.success(replyTo ? 'Reply published' : quotedEvent ? 'Quote published' : 'Note published');
      onPublished?.();
      onClose?.();
    } catch (error) {
      console.error('Failed to publish note:', error);
      toast.error(`Failed to publish: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isPublishing = false;
    }
  }

  function toggleRelay(url: string) {
    if (relaySelection.selectedRelayUrls.includes(url)) {
      relaySelection.selectedRelayUrls = relaySelection.selectedRelayUrls.filter(u => u !== url);
    } else {
      relaySelection.selectedRelayUrls = [...relaySelection.selectedRelayUrls, url];
    }
  }

  function selectOnlyRelay(url: string) {
    relaySelection.selectedRelayUrls = [url];
    isRelayDropdownOpen = false;
  }

  function handleRelayDropdownClickOutside() {
    isRelayDropdownOpen = false;
  }

  function handleClose() {
    if (!isPublishing) {
      open = false;
      content = '';
      selectedMentions = [];
      onClose?.();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      publishNote();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isDesktop.current}
  <Dialog.Root {open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleClose();
      } else {
        open = true;
      }
    }}>
    <Dialog.Content class="md:max-w-2xl !overflow-visible">
      <!-- Header -->
      <div class="flex items-center justify-between -mx-6 -mt-6 px-4 py-3 mb-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onclick={handleClose}
          disabled={isPublishing}
          class="h-10 w-10"
        >
          <Icon name="close" size="lg" />
        </Button>
        <Dialog.Title class="text-lg">
          {replyTo ? 'Reply' : quotedEvent ? 'Quote' : 'Compose'}
        </Dialog.Title>
        <Button
          onclick={publishNote}
          disabled={!content.trim() || isPublishing || selectedRelayUrls.length === 0}
          class="rounded-full"
          size="sm"
        >
          {isPublishing ? 'Publishing...' : 'Post'}
        </Button>
      </div>

      <!-- Reply context (if replying) -->
      {#if replyTo && replyToProfile}
        <div class="-mx-6 px-4 py-3 mb-4 border-b border-border bg-card/50">
          <div class="flex gap-3">
            <User.Root {ndk} pubkey={replyTo.pubkey}>
              <User.Avatar class="w-10 h-10" />
            </User.Root>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-foreground text-sm">
                  {replyToProfile.displayName || replyToProfile.name || `${replyTo.pubkey.slice(0, 8)}...`}
                </span>
                <span class="text-muted-foreground text-xs">
                  @{replyToProfile.name || replyTo.pubkey.slice(0, 8)}
                </span>
              </div>
              <p class="text-muted-foreground text-sm line-clamp-3">
                {replyTo.content}
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Compose area -->
      <div class="relative mb-4">
        <ContentComposer
          bind:this={composerRef}
          bind:value={content}
          bind:selectedMentions
          placeholder={replyTo ? 'Write your reply...' : quotedEvent ? 'Add your thoughts...' : "What's on your mind?"}
          autofocus={true}
          disabled={isPublishing}
        >
          {#snippet relayButton()}
            <div class="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onclick={() => isRelayDropdownOpen = !isRelayDropdownOpen}
                disabled={isPublishing}
                class="h-8 w-8"
                title="Select relays"
              >
                {#if selectedRelayUrls.length <= 2 && selectedRelayUrls.length > 0}
                  <div class="flex items-center -space-x-1">
                    {#each selectedRelayUrls as relayUrl}
                      {@const relay = allRelays.find(r => r.url === relayUrl)}
                      {@const relayInfo = relay ? useRelayInfoCached(relay.url) : null}
                      {#if relayInfo?.info?.icon}
                        <img src={relayInfo.info.icon} alt="" class="w-5 h-5 rounded border border-background" />
                      {:else}
                        <div class="w-5 h-5 rounded bg-muted flex items-center justify-center border border-background">
                          <Icon name="relay" size="xs" class="text-muted-foreground" />
                        </div>
                      {/if}
                    {/each}
                  </div>
                {:else}
                  <div class="relative">
                    <Icon name="relay" size="md" />
                    {#if selectedRelayUrls.length > 2}
                      <span class="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-medium rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                        {selectedRelayUrls.length}
                      </span>
                    {/if}
                  </div>
                {/if}
              </Button>

              <!-- Relay Dropdown -->
              {#if isRelayDropdownOpen}
                <div
                  use:clickOutside={handleRelayDropdownClickOutside}
                  class="absolute top-full left-0 mt-2 bg-popover border border-border rounded-lg shadow-xl z-[100] w-80 max-h-[400px] overflow-y-auto transition-all duration-200"
                >
                  <RelayPublishDropdownContent
                    {selectedRelayUrls}
                    bind:isProtected
                    onToggleRelay={toggleRelay}
                    onSelectOnly={selectOnlyRelay}
                  />
                </div>
              {/if}
            </div>
          {/snippet}
        </ContentComposer>
      </div>

      <!-- Quoted event (if quoting) -->
      {#if quotedEvent}
        <div class="-mx-6 px-4 py-3 mb-4 border-y border-border bg-muted/30">
          <div class="text-xs text-muted-foreground mb-2">Quoting</div>
          <div class="border border-border rounded-lg overflow-hidden bg-card">
            <NoteCard event={quotedEvent} showActions={false} />
          </div>
        </div>
      {/if}

      <!-- Footer hint -->
      <div class="-mx-6 px-4 py-3 border-t border-border">
        <p class="text-xs text-muted-foreground">
          Press <kbd class="px-1.5 py-0.5 bg-muted rounded text-muted-foreground">Esc</kbd> to cancel,
          <kbd class="px-1.5 py-0.5 bg-muted rounded text-muted-foreground">⌘</kbd> +
          <kbd class="px-1.5 py-0.5 bg-muted rounded text-muted-foreground">Enter</kbd> to post
        </p>
      </div>
    </Dialog.Content>
  </Dialog.Root>
{:else}
  <Drawer.Root {open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        handleClose();
      } else {
        open = true;
      }
    }}>
    <Drawer.Content class="h-[95vh] flex flex-col !overflow-visible">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 mb-4 border-b border-border shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onclick={handleClose}
          disabled={isPublishing}
          class="h-10 w-10"
        >
          <Icon name="close" size="lg" />
        </Button>
        <Drawer.Title class="text-lg">
          {replyTo ? 'Reply' : quotedEvent ? 'Quote' : 'Compose'}
        </Drawer.Title>
        <Button
          onclick={publishNote}
          disabled={!content.trim() || isPublishing || selectedRelayUrls.length === 0}
          class="rounded-full"
          size="sm"
        >
          {isPublishing ? 'Publishing...' : 'Post'}
        </Button>
      </div>

      <!-- Reply context (if replying) -->
      {#if replyTo && replyToProfile}
        <div class="px-4 py-3 mb-4 border-b border-border bg-card/50 shrink-0">
          <div class="flex gap-3">
            <User.Root {ndk} pubkey={replyTo.pubkey}>
              <User.Avatar class="w-10 h-10" />
            </User.Root>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-semibold text-foreground text-sm">
                  {replyToProfile.displayName || replyToProfile.name || `${replyTo.pubkey.slice(0, 8)}...`}
                </span>
                <span class="text-muted-foreground text-xs">
                  @{replyToProfile.name || replyTo.pubkey.slice(0, 8)}
                </span>
              </div>
              <p class="text-muted-foreground text-sm line-clamp-3">
                {replyTo.content}
              </p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Compose area -->
      <div class="relative mb-4 flex-1 flex flex-col overflow-hidden px-4">
        <div class="flex-1 overflow-hidden">
          <ContentComposer
            bind:this={composerRef}
            bind:value={content}
            bind:selectedMentions
            placeholder={replyTo ? 'Write your reply...' : quotedEvent ? 'Add your thoughts...' : "What's on your mind?"}
            autofocus={true}
            disabled={isPublishing}
            class="flex-1 overflow-hidden"
          >
            {#snippet relayButton()}
              <div class="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onclick={() => isRelayDropdownOpen = !isRelayDropdownOpen}
                  disabled={isPublishing}
                  class="h-8 w-8"
                  title="Select relays"
                >
                  {#if selectedRelayUrls.length <= 2 && selectedRelayUrls.length > 0}
                    <div class="flex items-center -space-x-1">
                      {#each selectedRelayUrls as relayUrl}
                        {@const relay = allRelays.find(r => r.url === relayUrl)}
                        {@const relayInfo = relay ? useRelayInfoCached(relay.url) : null}
                        {#if relayInfo?.info?.icon}
                          <img src={relayInfo.info.icon} alt="" class="w-5 h-5 rounded border border-background" />
                        {:else}
                          <div class="w-5 h-5 rounded bg-muted flex items-center justify-center border border-background">
                            <Icon name="relay" size="xs" class="text-muted-foreground" />
                          </div>
                        {/if}
                      {/each}
                    </div>
                  {:else}
                    <div class="relative">
                      <Icon name="relay" size="md" />
                      {#if selectedRelayUrls.length > 2}
                        <span class="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-medium rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                          {selectedRelayUrls.length}
                        </span>
                      {/if}
                    </div>
                  {/if}
                </Button>

                <!-- Relay Dropdown -->
                {#if isRelayDropdownOpen}
                  <div
                    use:portal
                    role="presentation"
                    onclick={handleRelayDropdownClickOutside}
                    onkeydown={(e) => e.key === 'Escape' && handleRelayDropdownClickOutside()}
                    class="fixed inset-0 bg-black/50 z-[1002] flex items-center justify-center transition-opacity"
                  >
                    <div
                      role="dialog"
                      tabindex="-1"
                      onclick={(e) => e.stopPropagation()}
                      onkeydown={(e) => e.stopPropagation()}
                      class="bg-popover border border-border rounded-lg shadow-xl w-80 max-h-[400px] overflow-y-auto"
                    >
                      <RelayPublishDropdownContent
                        {selectedRelayUrls}
                        bind:isProtected
                        onToggleRelay={toggleRelay}
                        onSelectOnly={selectOnlyRelay}
                      />
                    </div>
                  </div>
                {/if}
              </div>
            {/snippet}
          </ContentComposer>
        </div>
      </div>

      <!-- Quoted event (if quoting) -->
      {#if quotedEvent}
        <div class="px-4 py-3 mb-4 border-y border-border bg-muted/30 shrink-0">
          <div class="text-xs text-muted-foreground mb-2">Quoting</div>
          <div class="border border-border rounded-lg overflow-hidden bg-card">
            <NoteCard event={quotedEvent} showActions={false} />
          </div>
        </div>
      {/if}

      <!-- Footer hint -->
      <div class="px-4 py-3 border-t border-border shrink-0">
        <p class="text-xs text-muted-foreground">
          Press <kbd class="px-1.5 py-0.5 bg-muted rounded text-muted-foreground">Esc</kbd> to cancel,
          <kbd class="px-1.5 py-0.5 bg-muted rounded text-muted-foreground">⌘</kbd> +
          <kbd class="px-1.5 py-0.5 bg-muted rounded text-muted-foreground">Enter</kbd> to post
        </p>
      </div>
    </Drawer.Content>
  </Drawer.Root>
{/if}
