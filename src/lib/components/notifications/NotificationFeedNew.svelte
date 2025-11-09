<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import { createNotificationFeed } from '$lib/ndk/builders/notification/index.svelte';
  import { Notification } from '$lib/ndk/ui/notification';
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
      <Notification.Root notification={group}>
        <div class="flex items-start gap-3 p-4 hover:bg-accent/10 rounded-lg transition-colors">
          <!-- Actor avatars -->
          <Notification.Actors class="flex -space-x-2">
            {#each group.actors.slice(0, 3) as actor}
              <div class="w-10 h-10 rounded-full bg-muted border-2 border-background">
                <!-- User avatar would go here -->
              </div>
            {/each}
            {#if group.actors.length > 3}
              <div class="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                +{group.actors.length - 3}
              </div>
            {/if}
          </Notification.Actors>

          <!-- Notification content -->
          <div class="flex-1 min-w-0">
            <Notification.Action>
              <p class="text-sm">
                <span class="font-medium">
                  {#if group.actors.length === 1}
                    Someone
                  {:else if group.actors.length === 2}
                    2 people
                  {:else}
                    {group.actors.length} people
                  {/if}
                </span>

                {#if group.types.has(7)}
                  reacted to
                {:else if group.types.has(9735)}
                  zapped
                {:else if group.types.has(6)}
                  reposted
                {:else if group.types.has(1) || group.types.has(1111)}
                  replied to
                {:else}
                  interacted with
                {/if}
                your note
              </p>
            </Notification.Action>

            <Notification.Content class="mt-1 text-sm text-muted-foreground line-clamp-2">
              {group.targetEvent.content}
            </Notification.Content>

            <Notification.Timestamp class="mt-1">
              <TimeAgo timestamp={group.mostRecentAt} />
            </Notification.Timestamp>
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