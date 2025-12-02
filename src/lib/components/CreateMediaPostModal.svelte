<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import { NDKEvent, NDKRelaySet } from '@nostr-dev-kit/ndk';
  import { toast } from '$lib/stores/toast.svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import ImageUploadCarousel from '$lib/components/ImageUploadCarousel.svelte';
  import MediaPostFormFields from '$lib/components/MediaPostFormFields.svelte';
  import RelayPublishDropdownContent from '$lib/components/RelayPublishDropdownContent.svelte';
  import { useRelayInfoCached } from '$lib/utils/relayInfo.svelte';
  import { portal } from '$lib/utils/portal.svelte';
  import { useModalRelaySelection } from '$lib/composables/useModalRelaySelection.svelte';
  import type { UploadedImage } from '$lib/components/ImageUploadCarousel.svelte';

  interface Props {
    open?: boolean;
    onClose?: () => void;
  }

  let { open = $bindable(false), onClose }: Props = $props();

  let isPublishing = $state(false);
  let isRelayDropdownOpen = $state(false);
  let isProtected = $state(false);

  // Form fields
  let content = $state('');
  let location = $state('');
  let tags = $state<string[]>([]);
  let mentions = $state<string[]>([]);
  let isNsfw = $state(false);

  // Upload state
  let uploadedImages = $state<UploadedImage[]>([]);
  let currentImageIndex = $state(0);

  const relaySelection = useModalRelaySelection(() => open);
  const { selectedRelayUrls, allRelays } = $derived(relaySelection);

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

  async function publishMediaPost() {
    if (!content.trim() || uploadedImages.length === 0 || isPublishing) {
      if (uploadedImages.length === 0) {
        toast.error('Please add at least one image');
      } else {
        toast.error('Please add a caption');
      }
      return;
    }

    if (!ndk.$currentUser) {
      toast.error('Please log in to create a media post');
      return;
    }

    if (selectedRelayUrls.length === 0) {
      toast.error('Please select at least one relay to publish to');
      return;
    }

    try {
      isPublishing = true;

      const event = new NDKEvent(ndk);
      event.kind = 20;
      event.content = content.trim();
      event.isProtected = isProtected;

      // Add imeta tags for each image
      uploadedImages.forEach(img => {
        const imetaTag = ['imeta', `url ${img.url}`, `m ${img.mimeType}`];
        if (img.hash) imetaTag.push(`x ${img.hash}`);
        if (img.blurhash) imetaTag.push(`blurhash ${img.blurhash}`);
        if (img.dimensions) imetaTag.push(`dim ${img.dimensions.width}x${img.dimensions.height}`);
        event.tags.push(imetaTag);
      });

      // Add hashtags
      tags.forEach(tag => {
        event.tags.push(['t', tag]);
      });

      // Add mentions
      mentions.forEach(mention => {
        event.tags.push(['p', mention]);
      });

      // Add location with geohash
      if (location.trim()) {
        if (location.startsWith('Near ')) {
          const geohash = location.replace('Near ', '');
          for (let i = 3; i <= geohash.length; i++) {
            event.tags.push(['g', geohash.substring(0, i)]);
          }
        } else {
          event.tags.push(['location', location.trim()]);
        }
      }

      // Add content warning if NSFW
      if (isNsfw) {
        event.tags.push(['content-warning', 'nsfw']);
      }

      await event.sign();

      const relaySet = NDKRelaySet.fromRelayUrls(selectedRelayUrls, ndk);
      await event.publish(relaySet);

      if (event.publishStatus === 'error') {
        const error = event.publishError;
        const relayErrors = (error as any)?.relayErrors || {};
        const errorMessages = Object.entries(relayErrors)
          .map(([relay, err]) => `${relay}: ${err}`)
          .join('\n');
        toast.error(`Failed to publish:\n${errorMessages || 'Unknown error'}`);
        return;
      }

      toast.success('Posted!');
      resetForm();
      open = false;
      onClose?.();
    } catch (error) {
      console.error('Failed to publish media post:', error);
      toast.error(`Failed to publish: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isPublishing = false;
    }
  }

  function resetForm() {
    content = '';
    location = '';
    tags = [];
    mentions = [];
    uploadedImages = [];
    currentImageIndex = 0;
    isNsfw = false;
    isRelayDropdownOpen = false;
  }

  function handleClose() {
    if (!isPublishing) {
      resetForm();
      open = false;
      onClose?.();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && !isPublishing) {
      handleClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog.Root {open} onOpenChange={(newOpen: boolean) => {
      open = newOpen;
      if (!newOpen) handleClose();
    }}>
    <Dialog.Content class="max-md:!max-w-none max-md:!w-full max-md:!h-[100vh] max-md:!m-0 max-md:!rounded-none max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border bg-background">
        <button
          onclick={handleClose}
          disabled={isPublishing}
          title="Close and discard post"
          class="text-foreground hover:text-muted-foreground transition-colors"
          aria-label="Close"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <Dialog.Title class="text-lg md:text-xl font-semibold">New Post</Dialog.Title>
        <Button
          onclick={publishMediaPost}
          disabled={!content.trim() || uploadedImages.length === 0 || isPublishing || selectedRelayUrls.length === 0}
          size="sm"
          class="h-9 px-4"
        >
          {isPublishing ? 'Posting...' : 'Post'}
        </Button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto">
        <ImageUploadCarousel
          bind:images={uploadedImages}
          bind:currentIndex={currentImageIndex}
          disabled={isPublishing}
          autoOpenOnMobile={true}
        />
            <MediaPostFormFields
              bind:content
              bind:location
              bind:tags
              bind:mentions
              bind:isNsfw
              disabled={isPublishing}
            >
              {#snippet addImagesButton()}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isPublishing}
                  title="Add more images to your post"
                  class="h-8 w-8"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </Button>
              {/snippet}

              {#snippet relayButton()}
                <div class="relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onclick={() => isRelayDropdownOpen = !isRelayDropdownOpen}
                    disabled={isPublishing}
                    title="Choose which relays to publish this post to"
                    class="h-8 w-8"
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
                              <svg class="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                              </svg>
                            </div>
                          {/if}
                        {/each}
                      </div>
                    {:else}
                      <div class="relative">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                        </svg>
                        {#if selectedRelayUrls.length > 2}
                          <span class="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-medium rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                            {selectedRelayUrls.length}
                          </span>
                        {/if}
                      </div>
                    {/if}
                  </Button>
                </div>
              {/snippet}
            </MediaPostFormFields>

            <!-- Relay Dropdown with backdrop -->
            {#if isRelayDropdownOpen}
              <div
                use:portal
                role="presentation"
                onclick={handleRelayDropdownClickOutside}
                onkeydown={(e) => e.key === 'Escape' && handleRelayDropdownClickOutside()}
                class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center transition-opacity {isRelayDropdownOpen ? 'opacity-100' : 'opacity-0'}"
              >
                <div
                  role="dialog"
                  tabindex="-1"
                  onclick={(e) => e.stopPropagation()}
                  onkeydown={(e) => e.stopPropagation()}
                  class="bg-popover border border-border rounded-lg shadow-xl w-80 max-h-[400px] overflow-y-auto transition-all {isRelayDropdownOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}"
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
    </Dialog.Content>
  </Dialog.Root
>