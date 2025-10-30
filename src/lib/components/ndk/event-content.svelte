<script lang="ts">
  import type { NDKEvent } from '@nostr-dev-kit/ndk';
  import type { NDKSvelte } from '@nostr-dev-kit/svelte';
  import EventContent from './event/content/event-content.svelte';
  import { goto } from '$app/navigation';

  interface Props {
    ndk: NDKSvelte;
    event?: NDKEvent;
    content?: string;
    emojiTags?: string[][];
    class?: string;
    onMentionClick?: (bech32: string) => void;
    onEventClick?: (bech32: string) => void;
    onHashtagClick?: (tag: string) => void;
    onLinkClick?: (url: string) => void;
  }

  let {
    ndk,
    event,
    content,
    emojiTags,
    class: className = '',
    onMentionClick,
    onEventClick,
    onHashtagClick,
    onLinkClick,
  }: Props = $props();

  // Default handlers that navigate
  function handleMentionClick(bech32: string) {
    if (onMentionClick) {
      onMentionClick(bech32);
    } else {
      goto(`/p/${bech32}`);
    }
  }

  function handleEventClick(bech32: string) {
    if (onEventClick) {
      onEventClick(bech32);
    } else {
      goto(`/e/${bech32}`);
    }
  }

  function handleHashtagClick(tag: string) {
    if (onHashtagClick) {
      onHashtagClick(tag);
    } else {
      goto(`/t/${tag}`);
    }
  }

  function handleLinkClick(url: string) {
    if (onLinkClick) {
      onLinkClick(url);
    } else {
      window.open(url, '_blank');
    }
  }
</script>

<EventContent {ndk} {event} {content} {emojiTags} class={className}>
  {#snippet mention({ bech32 })}
    <button type="button" onclick={() => handleMentionClick(bech32)} class="mention-button">
      @{bech32.slice(0, 8)}...
    </button>
  {/snippet}

  {#snippet eventRef({ bech32 })}
    <button type="button" onclick={() => handleEventClick(bech32)} class="event-ref-button">
      note:{bech32.slice(0, 8)}...
    </button>
  {/snippet}

  {#snippet hashtag({ tag })}
    <button type="button" onclick={() => handleHashtagClick(tag)} class="hashtag-button">
      #{tag}
    </button>
  {/snippet}

  {#snippet link({ url })}
    <button type="button" onclick={() => handleLinkClick(url)} class="link-button">
      {url}
    </button>
  {/snippet}
</EventContent>

<style>
  .mention-button,
  .event-ref-button,
  .hashtag-button,
  .link-button {
    background: none;
    border: none;
    padding: 0;
    color: var(--link-color, #3b82f6);
    cursor: pointer;
    text-decoration: none;
    font: inherit;
  }

  .mention-button:hover,
  .event-ref-button:hover,
  .hashtag-button:hover,
  .link-button:hover {
    text-decoration: underline;
    opacity: 0.8;
  }
</style>
