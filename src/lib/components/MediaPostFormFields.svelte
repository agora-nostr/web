<script lang="ts">
  import { Textarea } from '$lib/components/ui/textarea';
  import { Button } from '$lib/components/ui/button';
  import { toast } from '$lib/stores/toast.svelte';
  import { encodeGeohash } from '$lib/utils/geohash';
  import UserSelector from '$lib/components/UserSelector.svelte';
  import HashtagSelector from '$lib/components/HashtagSelector.svelte';
  import { browser } from '$app/environment';
  import type { Snippet } from 'svelte';

  interface Props {
    content?: string;
    location?: string;
    tags?: string[];
    mentions?: string[];
    isNsfw?: boolean;
    disabled?: boolean;
    relayButton?: Snippet;
  }

  let {
    content = $bindable(''),
    location = $bindable(''),
    tags = $bindable([]),
    mentions = $bindable([]),
    isNsfw = $bindable(false),
    disabled = false,
    relayButton
  }: Props = $props();

  let isHashtagSelectorOpen = $state(false);
  let isUserSelectorOpen = $state(false);

  const isMobile = $derived(browser && window.innerWidth < 768);

  function removeTag(tag: string) {
    tags = tags.filter(t => t !== tag);
  }

  function handleTagsChange(newTags: string[]) {
    tags = newTags;
  }

  function handleLocationRequest() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const gh = encodeGeohash(lat, lon, 5);
          location = `Near ${gh}`;
          toast.success('Location detected');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your location');
        }
      );
    } else {
      toast.error('Geolocation is not supported');
    }
  }
</script>

<div class="p-4 md:p-6 space-y-4 md:overflow-auto">
  <!-- Caption -->
  <Textarea
    bind:value={content}
    placeholder="Write a caption..."
    rows={4}
    autofocus={!isMobile}
    {disabled}
    class="resize-none border-0 focus-visible:ring-0 px-3 text-base placeholder:text-muted-foreground"
  />

  <!-- Action buttons -->
  <div class="flex items-center gap-1 border-t border-border pt-3">
    <!-- Add more images (passed via slot) -->
    <slot name="addImagesButton" />

    <!-- Hashtags -->
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onclick={() => isHashtagSelectorOpen = true}
      {disabled}
      title="Add hashtags to categorize your post and make it discoverable"
      class="h-8 w-8 {tags.length > 0 ? 'text-primary' : ''}"
    >
      <div class="relative">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
        {#if tags.length > 0}
          <span class="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-medium rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
            {tags.length}
          </span>
        {/if}
      </div>
    </Button>

    <!-- Location -->
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onclick={handleLocationRequest}
      {disabled}
      title="Add location - uses your device's GPS to tag where this was posted"
      class="h-8 w-8 {location ? 'text-primary' : ''}"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
    </Button>

    <!-- Mentions -->
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onclick={() => isUserSelectorOpen = true}
      {disabled}
      title="Tag people in this post - they'll be notified"
      class="h-8 w-8 {mentions.length > 0 ? 'text-primary' : ''}"
    >
      <div class="relative">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {#if mentions.length > 0}
          <span class="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-medium rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
            {mentions.length}
          </span>
        {/if}
      </div>
    </Button>

    <!-- NSFW Toggle -->
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onclick={() => isNsfw = !isNsfw}
      {disabled}
      title="Mark as sensitive content (NSFW)"
      class="h-8 w-8 {isNsfw ? 'text-primary' : ''}"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </Button>

    <!-- Relays (passed via snippet) -->
    {#if relayButton}
      {@render relayButton()}
    {/if}
  </div>

  <!-- Display sections for selected items -->
  {#if tags.length > 0}
    <div class="flex flex-wrap gap-2 items-center">
      {#each tags as tag}
        <button
          onclick={() => removeTag(tag)}
          disabled={disabled}
          class="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
        >
          <span>#{tag}</span>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/each}
    </div>
  {/if}

  {#if location}
    <div class="text-sm text-muted-foreground flex items-center gap-1.5">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
      </svg>
      <span>{location}</span>
      <button
        onclick={() => location = ''}
        disabled={disabled}
        class="ml-1 hover:text-foreground transition-colors"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  {/if}
</div>

<!-- Hashtag Selector Modal -->
<HashtagSelector
  bind:open={isHashtagSelectorOpen}
  selectedTags={tags}
  onTagsChange={handleTagsChange}
/>

<!-- User Selector Modal -->
<UserSelector
  bind:open={isUserSelectorOpen}
  bind:selectedPubkeys={mentions}
  buttonClass="hidden"
  iconOnly={false}
/>
