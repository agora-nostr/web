<script lang="ts">
  import type { NDKEvent } from '@nostr-dev-kit/ndk';
  import { ndk } from '$lib/ndk.svelte';
  import {EventCard} from '$lib/ndk/components/event-card';
  import EventActions from './EventActions.svelte';
    import RepostButtonAvatars from '$lib/ndk/components/repost-button-avatars';
    import { goto } from '$app/navigation';
    import ReactionButtonAvatars from '$lib/ndk/components/reaction-button-avatars';
    import ReplyButtonAvatars from '$lib/ndk/components/reply-button-avatars';
    import ComposeDialog from './ComposeDialog.svelte';
    import { cn } from '$lib/utils';
    import ZapButtonAvatars from '$lib/ndk/components/zap-button-avatars';

  interface Props {
    event: NDKEvent;
    showActions?: boolean;
    variant?: 'default' | 'thread-parent' | 'thread-main' | 'thread-reply';
    showThreadLine?: boolean;
    onNavigate?: () => void;
    compact?: boolean;
  }

  const {
    event,
    showActions = true,
    variant = 'default',
    showThreadLine = false,
    onNavigate,
    compact = false
  }: Props = $props();

  let showReplyModal = $state(false);

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

  function zap(zapFn: (amount: number, comment?: string) => Promise<void>) {
    zapFn(1, "test zap from agora")
  }

  function userClicked(user: import('@nostr-dev-kit/ndk').NDKUser) {
    goto(`/p/${user.npub}`);
  }
</script>

<EventCard.Root
  {ndk}
  {event}
  {interactive}
  onclick={() => goto(`/e/${event.encode()}`)}
  onUserClick={userClicked}
  class="p-3 sm:p-4 flex flex-col max-sm:max-w-screen {cardClass} transition-colors min-w-0 border-b border-border"
>
  <!-- Header Row: Avatar + Name/Handle/Time -->
  <div class={cn(spacingClass, "flex flex-row justify-between")}>
    <EventCard.Header
      variant={headerVariant}
      {avatarSize}
    />
    <EventCard.Dropdown />
  </div>

  <!-- Reply indicator -->
  <EventCard.ReplyIndicator />

  <!-- Content -->
  <div class="mb-2">
    <EventCard.Content class={contentClass} />
  </div>

  <!-- Actions -->
  <EventCard.Actions>
    <ReplyButtonAvatars {ndk} {event} class="hover:bg-muted" onclick={() => showReplyModal = true} />
    <ReactionButtonAvatars {ndk} {event} class="hover:bg-muted" />
    <RepostButtonAvatars {ndk} {event} class="hover:bg-muted" />
    <ZapButtonAvatars {ndk} {event} class="hover:bg-muted" onclick={zap} />
  </EventCard.Actions>
</EventCard.Root>

<ComposeDialog bind:open={showReplyModal} replyTo={event} />
