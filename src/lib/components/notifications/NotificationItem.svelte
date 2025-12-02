<script lang="ts">
  import type { NotificationGroup } from '$lib/utils/useNotifications.svelte';
  import User from '$lib/components/User.svelte';
  import NoteCard from '$lib/components/NoteCard.svelte';

  let { notification }: { notification: NotificationGroup } = $props();

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 604800)}w ago`;
  };
</script>

<div class="border-b border-border p-4 hover:bg-muted/50 transition-colors">
  <div class="flex items-start gap-3">
    <!-- Icon based on notification type -->
    <div class="flex-shrink-0 mt-1">
      {#if notification.type === 'reply'}
        <div class="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
          <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </div>
      {:else if notification.type === 'mention'}
        <div class="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
          <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        </div>
      {:else if notification.type === 'reaction'}
        <div class="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center">
          <svg class="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
      {:else if notification.type === 'repost'}
        <div class="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
          <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      {:else if notification.type === 'zap'}
        <div class="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
          <svg class="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      {:else if notification.type === 'invite_acceptance'}
        <div class="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
          <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      {:else if notification.type === 'quote'}
        <div class="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
          <svg class="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
      {/if}
    </div>

    <div class="flex-1 min-w-0">
      <!-- Notification header -->
      <div class="mb-2">
        {#if notification.type === 'reply'}
          <div class="flex flex-wrap items-center gap-2 mb-2">
            {#each notification.replies.slice(0, 3) as reply}
              <User pubkey={reply.pubkey} />
            {/each}
            {#if notification.replies.length > 3}
              <span class="text-sm text-muted-foreground">
                +{notification.replies.length - 3} more
              </span>
            {/if}
          </div>
          <p class="text-sm text-muted-foreground mb-2">
            {notification.replies.length === 1 ? 'replied to your post' : `${notification.replies.length} replies to your post`}
          </p>
        {:else if notification.type === 'mention'}
          <div class="flex flex-wrap items-center gap-2 mb-2">
            {#each notification.mentions.slice(0, 3) as mention}
              <User pubkey={mention.pubkey} />
            {/each}
            {#if notification.mentions.length > 3}
              <span class="text-sm text-muted-foreground">
                +{notification.mentions.length - 3} more
              </span>
            {/if}
          </div>
          <p class="text-sm text-muted-foreground mb-2">
            {notification.mentions.length === 1 ? 'mentioned you' : `${notification.mentions.length} mentions`}
          </p>
        {:else if notification.type === 'reaction'}
          {@const totalReactions = Array.from(notification.reactions.values()).reduce((sum, reactors) => sum + reactors.length, 0)}
          <div class="flex flex-wrap items-center gap-2 mb-2">
            {#each Array.from(notification.reactions.entries()).slice(0, 2) as [emoji, reactors]}
              <div class="flex items-center gap-1">
                <span class="text-lg">{emoji}</span>
                {#each reactors.slice(0, 2) as reactor}
                  <User pubkey={reactor.pubkey} />
                {/each}
              </div>
            {/each}
          </div>
          <p class="text-sm text-muted-foreground mb-2">
            {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
          </p>
        {:else if notification.type === 'repost'}
          <div class="flex flex-wrap items-center gap-2 mb-2">
            {#each notification.reposts.slice(0, 3) as repost}
              <User pubkey={repost.pubkey} />
            {/each}
            {#if notification.reposts.length > 3}
              <span class="text-sm text-muted-foreground">
                +{notification.reposts.length - 3} more
              </span>
            {/if}
          </div>
          <p class="text-sm text-muted-foreground mb-2">
            {notification.reposts.length === 1 ? 'reposted' : `${notification.reposts.length} reposts`}
          </p>
        {:else if notification.type === 'zap'}
          {@const totalAmount = notification.zaps.reduce((sum, zap) => sum + zap.amount, 0)}
          <div class="flex flex-wrap items-center gap-2 mb-2">
            {#each notification.zaps.slice(0, 3) as zap}
              <User pubkey={zap.sender} />
            {/each}
            {#if notification.zaps.length > 3}
              <span class="text-sm text-muted-foreground">
                +{notification.zaps.length - 3} more
              </span>
            {/if}
          </div>
          <p class="text-sm text-muted-foreground mb-2">
            ⚡ {totalAmount.toLocaleString()} sats
            {notification.zaps.length > 1 ? `(${notification.zaps.length} zaps)` : ''}
          </p>
        {:else if notification.type === 'invite_acceptance'}
          <div class="flex flex-wrap items-center gap-2 mb-2">
            {#each notification.inviteeEvents.slice(0, 3) as inviteeEvent}
              <User pubkey={inviteeEvent.pubkey} />
            {/each}
            {#if notification.inviteeEvents.length > 3}
              <span class="text-sm text-muted-foreground">
                +{notification.inviteeEvents.length - 3} more
              </span>
            {/if}
          </div>
          <p class="text-sm text-muted-foreground mb-2">
            {notification.inviteeEvents.length === 1 ? 'accepted your invite 🎉' : `${notification.inviteeEvents.length} people accepted your invites 🎉`}
          </p>
        {:else if notification.type === 'quote'}
          <div class="flex flex-wrap items-center gap-2 mb-2">
            {#each notification.quotes.slice(0, 3) as quote}
              <User pubkey={quote.pubkey} />
            {/each}
            {#if notification.quotes.length > 3}
              <span class="text-sm text-muted-foreground">
                +{notification.quotes.length - 3} more
              </span>
            {/if}
          </div>
          <p class="text-sm text-muted-foreground mb-2">
            {notification.quotes.length === 1 ? 'quoted your post' : `${notification.quotes.length} quotes`}
          </p>
        {/if}

        <span class="text-xs text-muted-foreground">
          {formatTimestamp(notification.timestamp)}
        </span>
      </div>

      <!-- Target event preview -->
      <div class="bg-muted/50 rounded-lg p-3">
        <NoteCard event={notification.targetEvent} compact={true} />
      </div>

      <!-- Show interaction samples -->
      {#if notification.type === 'reply' && notification.replies.length > 0}
        <div class="mt-3 space-y-2">
          <p class="text-xs font-medium text-muted-foreground">Recent replies:</p>
          {#each notification.replies.slice(0, 2) as reply}
            <div class="bg-muted/30 rounded p-2">
              <NoteCard event={reply} compact={true} />
            </div>
          {/each}
        </div>
      {:else if notification.type === 'mention' && notification.mentions.length > 0}
        <div class="mt-3 space-y-2">
          <p class="text-xs font-medium text-muted-foreground">Recent mentions:</p>
          {#each notification.mentions.slice(0, 2) as mention}
            <div class="bg-muted/30 rounded p-2">
              <NoteCard event={mention} compact={true} />
            </div>
          {/each}
        </div>
      {:else if notification.type === 'quote' && notification.quotes.length > 0}
        <div class="mt-3 space-y-2">
          <p class="text-xs font-medium text-muted-foreground">Recent quotes:</p>
          {#each notification.quotes.slice(0, 2) as quote}
            <div class="bg-muted/30 rounded p-2">
              <NoteCard event={quote} compact={true} />
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
