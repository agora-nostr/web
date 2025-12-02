<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import { createNotificationFeed } from '$lib/ndk/builders/notification/index.svelte';
  import * as Notification from '$lib/ndk/ui/notification';
  import TimeAgo from '$lib/components/TimeAgo.svelte';

  interface Props {
    pubkey?: string;
    limit?: number;
  }

  const { pubkey, limit = 50 }: Props = $props();

  // Create reactive notification feed using the registry builder
  const notifications = $derived.by(() => {
    const targetPubkey = pubkey || ndk.$currentPubkey;
    if (!targetPubkey) return null;

    return createNotificationFeed(
      () => ({
        pubkey: targetPubkey,
        limit,
        sort: 'time',
        kinds: [1, 6, 7, 9735, 1111] // replies, reposts, reactions, zaps, generic replies
      }),
      ndk
    );
  });

  // Group notifications by type for display
  const groupedNotifications = $derived.by(() => {
    if (!notifications) return null;

    return {
      all: notifications.all,
      reactions: notifications.byType.reactions,
      zaps: notifications.byType.zaps,
      reposts: notifications.byType.reposts,
      replies: notifications.byType.replies
    };
  });
</script>

{#if notifications?.loading}
  <div class="flex justify-center py-8">
    <div class="loading loading-spinner loading-lg"></div>
  </div>
{:else if groupedNotifications}
  <div class="space-y-2">
    {#each groupedNotifications.all as group (group.targetEvent.id)}
      <Notification.Root {ndk} notification={group}>
        <div class="flex items-start gap-3 p-4 hover:bg-accent/10 rounded-lg transition-colors">
          <!-- Actor avatars -->
          <Notification.Actors />

          <!-- Notification content -->
          <div class="flex-1 min-w-0">
            <Notification.Action />

            <Notification.Content class="mt-1 text-sm text-muted-foreground line-clamp-2" />

            <Notification.Timestamp class="mt-1" />
          </div>

          <!-- Interaction counts -->
          <div class="flex gap-2 text-xs text-muted-foreground">
            {#if group.types.has(7)}
              <span>❤️ {group.types.get(7)?.length || 0}</span>
            {/if}
            {#if group.types.has(9735)}
              <span>⚡ {group.types.get(9735)?.length || 0}</span>
            {/if}
            {#if group.types.has(6)}
              <span>🔁 {group.types.get(6)?.length || 0}</span>
            {/if}
            {#if group.types.has(1) || group.types.has(1111)}
              <span>💬 {(group.types.get(1)?.length || 0) + (group.types.get(1111)?.length || 0)}</span>
            {/if}
          </div>
        </div>
      </Notification.Root>
    {/each}
  </div>
{:else}
  <div class="text-center py-8 text-muted-foreground">
    No notifications yet
  </div>
{/if}