<script lang="ts">
  import type { NDKEvent } from '@nostr-dev-kit/ndk';
  import { ndk } from '$lib/ndk.svelte';
  import { EventCard } from './ndk/event-card';
  import ReplyIndicator from './ReplyIndicator.svelte';
  import EventActions from './EventActions.svelte';

  interface Props {
    event: NDKEvent;
    showActions?: boolean;
    variant?: 'default' | 'thread-parent' | 'thread-main' | 'thread-reply';
    showThreadLine?: boolean;
    onNavigate?: () => void;
  }

  const {
    event,
    showActions = true,
    variant = 'default',
    showThreadLine = false,
    onNavigate
  }: Props = $props();

  const avatarSize = $derived(
    variant === 'thread-main' ? 'lg' as const :
    variant === 'thread-reply' ? 'md' as const :
    'sm' as const
  );

  const contentClass = $derived(
    variant === 'thread-main' ? 'text-lg leading-relaxed' : 'text-base'
  );

  const cardClass = $derived(
    variant === 'thread-main' ? 'bg-card/50' :
    variant === 'default' ? 'hover:bg-card/30' :
    'hover:bg-card/30'
  );

  const interactive = $derived(variant === 'default' || (onNavigate !== undefined));

  const headerVariant = $derived(variant === 'thread-main' ? 'full' : 'compact');

  const spacingClass = $derived(variant === 'thread-main' ? 'mb-2' : 'mb-1.5');
</script>

<EventCard.Root
  {ndk}
  {event}
  {interactive}
  onclick={onNavigate}
  class="p-3 sm:p-4 flex flex-col max-sm:max-w-screen {cardClass} transition-colors min-w-0"
>
  {#if showThreadLine}
    <EventCard.ThreadLine forceShow />
  {/if}

  <!-- Header Row: Avatar + Name/Handle/Time -->
  <div class={spacingClass}>
    <EventCard.Header
      variant={headerVariant}
      {avatarSize}
    />
  </div>

  <!-- Reply indicator -->
  {#if variant === 'default'}
    <ReplyIndicator {event} />
  {/if}

  <!-- Content -->
  <div class="mb-2">
    <EventCard.Content class={contentClass} />
  </div>

  <!-- Actions -->
  {#if showActions}
    <EventActions {event} {variant} />
  {/if}
</EventCard.Root>
