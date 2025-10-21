import type { NDKEvent } from '@nostr-dev-kit/ndk';
import type { NDKSvelte } from '@nostr-dev-kit/svelte';
import {
  KIND_TEXT_NOTE,
  KIND_REPLY,
  KIND_REPOST,
  KIND_GENERIC_REPOST,
  KIND_REACTION,
  KIND_ZAP,
  KIND_INVITE_ACCEPTANCE,
  NOTIFICATION_KINDS,
} from '$lib/constants/nostr';

/**
 * Notification type definitions
 */
type BaseNotification = {
  id: string;
  timestamp: number;
};

export type ReplyNotification = BaseNotification & {
  type: 'reply';
  event: NDKEvent;
  replyToEventId: string;
};

export type MentionNotification = BaseNotification & {
  type: 'mention';
  event: NDKEvent;
};

export type QuoteNotification = BaseNotification & {
  type: 'quote';
  event: NDKEvent;
  quotedEventId: string;
};

export type ReactionNotification = BaseNotification & {
  type: 'reaction';
  targetEventId: string;
  emoji: string;
  reactors: Array<{ pubkey: string; event: NDKEvent }>;
};

export type RepostNotification = BaseNotification & {
  type: 'repost';
  targetEventId: string;
  reposts: NDKEvent[];
};

export type ZapNotification = BaseNotification & {
  type: 'zap';
  targetEventId: string;
  zaps: Array<{ event: NDKEvent; amount: number; sender: string }>;
};

export type InviteAcceptanceNotification = BaseNotification & {
  type: 'invite_acceptance';
  event: NDKEvent;
  inviteeEventId: string;
  inviteePubkey: string; // Primary actor who accepted the invite
};

export type NotificationGroup =
  | ReplyNotification
  | MentionNotification
  | QuoteNotification
  | ReactionNotification
  | RepostNotification
  | ZapNotification
  | InviteAcceptanceNotification;

export type NotificationFilter = 'all' | 'reply' | 'mention' | 'quote' | 'reaction' | 'repost' | 'zap' | 'invite';

/**
 * Event categorizer - maps events to categories
 */
function categorizeEvent(
  event: NDKEvent,
  userEventIds: Set<string>
): 'reply' | 'mention' | 'quote' | 'reaction' | 'repost' | 'zap' | 'invite_acceptance' | null {
  if (event.kind === KIND_REACTION) return 'reaction';
  if (event.kind === KIND_REPOST || event.kind === KIND_GENERIC_REPOST) return 'repost';
  if (event.kind === KIND_ZAP) return 'zap';
  if (event.kind === KIND_INVITE_ACCEPTANCE) return 'invite_acceptance';

  if (event.kind === KIND_TEXT_NOTE || event.kind === KIND_REPLY) {
    // Check if it's a quote
    const qTag = event.tags.find((t) => t[0] === 'q');
    if (qTag && userEventIds.has(qTag[1])) {
      return 'quote';
    }

    // Check if it's a reply
    const replyMarker = event.tags.find((t) => t[0] === 'e' && t[3] === 'reply');
    if (replyMarker && userEventIds.has(replyMarker[1])) {
      return 'reply';
    }

    // It's a mention
    return 'mention';
  }

  return null;
}

/**
 * Notification processors - strategy pattern for processing different notification types
 */
const notificationProcessors = {
  reply: (events: NDKEvent[]): ReplyNotification[] => {
    return events.map((event) => ({
      id: `reply-${event.id}`,
      type: 'reply' as const,
      timestamp: event.created_at || 0,
      event,
      replyToEventId: event.tags.find((t) => t[0] === 'e' && t[3] === 'reply')?.[1] || '',
    }));
  },

  mention: (events: NDKEvent[]): MentionNotification[] => {
    return events.map((event) => ({
      id: `mention-${event.id}`,
      type: 'mention' as const,
      timestamp: event.created_at || 0,
      event,
    }));
  },

  quote: (events: NDKEvent[]): QuoteNotification[] => {
    return events.map((event) => ({
      id: `quote-${event.id}`,
      type: 'quote' as const,
      timestamp: event.created_at || 0,
      event,
      quotedEventId: event.tags.find((t) => t[0] === 'q')?.[1] || '',
    }));
  },

  reaction: (events: NDKEvent[], userEventIds: Set<string>): ReactionNotification[] => {
    const reactionGroups = new Map<string, { targetEventId: string; emoji: string; reactors: Array<{ pubkey: string; event: NDKEvent }>; timestamp: number }>();

    events.forEach((reaction) => {
      const targetId = reaction.tags.find((t) => t[0] === 'e')?.[1];
      if (!targetId || !userEventIds.has(targetId)) return;

      // Normalize emoji: "+" means like/heart
      let emoji = reaction.content || '👍';
      if (emoji === '+') {
        emoji = '❤️';
      }
      const key = `${targetId}-${emoji}`;

      if (!reactionGroups.has(key)) {
        reactionGroups.set(key, {
          targetEventId: targetId,
          emoji,
          reactors: [],
          timestamp: reaction.created_at || 0,
        });
      }

      const group = reactionGroups.get(key)!;
      group.reactors.push({ pubkey: reaction.pubkey, event: reaction });
      if (reaction.created_at && reaction.created_at > group.timestamp) {
        group.timestamp = reaction.created_at;
      }
    });

    return Array.from(reactionGroups.entries()).map(([key, group]) => ({
      id: `reaction-${key}`,
      type: 'reaction' as const,
      timestamp: group.timestamp,
      targetEventId: group.targetEventId,
      emoji: group.emoji,
      reactors: group.reactors,
    }));
  },

  repost: (events: NDKEvent[], userEventIds: Set<string>): RepostNotification[] => {
    const repostGroups = new Map<string, { targetEventId: string; reposts: NDKEvent[]; timestamp: number }>();

    events.forEach((repost) => {
      const targetId = repost.tags.find((t) => t[0] === 'e')?.[1];
      if (!targetId || !userEventIds.has(targetId)) return;

      if (!repostGroups.has(targetId)) {
        repostGroups.set(targetId, {
          targetEventId: targetId,
          reposts: [],
          timestamp: repost.created_at || 0,
        });
      }

      const group = repostGroups.get(targetId)!;
      group.reposts.push(repost);
      if (repost.created_at && repost.created_at > group.timestamp) {
        group.timestamp = repost.created_at;
      }
    });

    return Array.from(repostGroups.values()).map((group) => ({
      id: `repost-${group.targetEventId}`,
      type: 'repost' as const,
      timestamp: group.timestamp,
      targetEventId: group.targetEventId,
      reposts: group.reposts,
    }));
  },

  zap: (events: NDKEvent[], userEventIds: Set<string>): ZapNotification[] => {
    const zapGroups = new Map<string, { targetEventId: string; zaps: Array<{ event: NDKEvent; amount: number; sender: string }>; timestamp: number }>();

    events.forEach((zap) => {
      const targetId = zap.tags.find((t) => t[0] === 'e')?.[1];
      if (!targetId || !userEventIds.has(targetId)) return;

      // Extract amount from bolt11 tag
      const bolt11Tag = zap.tags.find((t) => t[0] === 'bolt11')?.[1];
      const amount = extractAmountFromBolt11(bolt11Tag);

      // Extract sender (the person who zapped, from description tag)
      const descriptionTag = zap.tags.find((t) => t[0] === 'description')?.[1];
      let sender = zap.pubkey;
      if (descriptionTag) {
        try {
          const parsed = JSON.parse(descriptionTag);
          sender = parsed.pubkey || sender;
        } catch {}
      }

      if (!zapGroups.has(targetId)) {
        zapGroups.set(targetId, {
          targetEventId: targetId,
          zaps: [],
          timestamp: zap.created_at || 0,
        });
      }

      const group = zapGroups.get(targetId)!;
      group.zaps.push({ event: zap, amount, sender });
      if (zap.created_at && zap.created_at > group.timestamp) {
        group.timestamp = zap.created_at;
      }
    });

    return Array.from(zapGroups.values()).map((group) => ({
      id: `zap-${group.targetEventId}`,
      type: 'zap' as const,
      timestamp: group.timestamp,
      targetEventId: group.targetEventId,
      zaps: group.zaps,
    }));
  },

  invite_acceptance: (events: NDKEvent[]): InviteAcceptanceNotification[] => {
    return events.map((event) => {
      // The 514 event is published by the invitee, tagging the inviter (us) with 'p' tag
      // and the invite event with 'e' tag
      const inviteEventId = event.tags.find((t) => t[0] === 'e')?.[1] || '';
      return {
        id: `invite-${event.id}`,
        type: 'invite_acceptance' as const,
        timestamp: event.created_at || 0,
        event,
        inviteeEventId: inviteEventId,
        inviteePubkey: event.pubkey, // Primary actor who accepted the invite
      };
    });
  },
};

/**
 * Creates a notifications manager that aggregates and groups notifications
 */
export function createNotificationsManager(ndk: NDKSvelte) {
  const currentUser = ndk.$currentUser;

  // Subscription for all notification events
  const notificationsSubscription = ndk.$subscribe(() => {
    if (!currentUser) return undefined;

    return {
      filters: [
        {
          kinds: [...NOTIFICATION_KINDS],
          '#p': [currentUser.pubkey],
          since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30, // last 30 days
          limit: 500,
        },
      ],
      subId: 'notifications',
    };
  });

  // Subscription for user's own events (to identify replies vs mentions)
  const userEventsSubscription = ndk.$subscribe(() => {
    if (!currentUser) return undefined;

    return {
      filters: [
        {
          kinds: [KIND_TEXT_NOTE, KIND_REPLY, 30023], // text, reply, article
          authors: [currentUser.pubkey],
          since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30, // last 30 days
        },
      ],
      subId: 'user-events',
    };
  });

  // Build a Set of user's event IDs for quick lookup
  const userEventIds = $derived.by(() => {
    const events = Array.from(userEventsSubscription.events ?? []);
    return new Set(events.map((e) => e.id));
  });

  // Cache for fetched target events
  const targetEventsCache = $state(new Map<string, NDKEvent>());

  // Filter state
  let currentFilter = $state<NotificationFilter>('all');

  /**
   * Aggregate raw notification events into groups using strategy pattern
   */
  const notificationGroups = $derived.by(() => {
    if (!currentUser) return [];

    const events = Array.from(notificationsSubscription.events ?? []);
    const groups: NotificationGroup[] = [];

    // Categorize events by type
    const categorizedEvents: Record<string, NDKEvent[]> = {
      reply: [],
      mention: [],
      quote: [],
      reaction: [],
      repost: [],
      zap: [],
      invite_acceptance: [],
    };

    events.forEach((event) => {
      const category = categorizeEvent(event, userEventIds);
      if (category) {
        categorizedEvents[category].push(event);
      }
    });

    // Process each category using strategy pattern
    groups.push(...notificationProcessors.reply(categorizedEvents.reply));
    groups.push(...notificationProcessors.mention(categorizedEvents.mention));
    groups.push(...notificationProcessors.quote(categorizedEvents.quote));
    groups.push(...notificationProcessors.reaction(categorizedEvents.reaction, userEventIds));
    groups.push(...notificationProcessors.repost(categorizedEvents.repost, userEventIds));
    groups.push(...notificationProcessors.zap(categorizedEvents.zap, userEventIds));
    groups.push(...notificationProcessors.invite_acceptance(categorizedEvents.invite_acceptance));

    // Sort by timestamp (most recent first)
    return groups.sort((a, b) => b.timestamp - a.timestamp);
  });

  // Fetch target events that are referenced but not yet loaded
  $effect(() => {
    const targetEventIds = new Set<string>();

    notificationGroups.forEach((group) => {
      if (group.type === 'reply') {
        targetEventIds.add(group.replyToEventId);
      } else if (group.type === 'quote') {
        targetEventIds.add(group.quotedEventId);
      } else if (group.type === 'reaction' || group.type === 'repost' || group.type === 'zap') {
        targetEventIds.add(group.targetEventId);
      }
    });

    // Find missing events
    const missing = Array.from(targetEventIds).filter((id) => !targetEventsCache.has(id));

    if (missing.length > 0) {
      // Fetch missing events
      Promise.all(missing.map((id) => ndk.fetchEvent(id))).then((events) => {
        events.forEach((event, index) => {
          if (event) {
            targetEventsCache.set(missing[index], event);
          }
        });
      });
    }
  });

  // Filtered notifications
  const filteredNotifications = $derived.by(() => {
    if (currentFilter === 'all') return notificationGroups;
    if (currentFilter === 'invite') {
      return notificationGroups.filter((group) => group.type === 'invite_acceptance');
    }
    return notificationGroups.filter((group) => group.type === currentFilter);
  });

  // Counts by type
  const counts = $derived.by(() => {
    const result = {
      all: notificationGroups.length,
      reply: 0,
      mention: 0,
      quote: 0,
      reaction: 0,
      repost: 0,
      zap: 0,
      invite: 0,
    };

    notificationGroups.forEach((group) => {
      if (group.type === 'invite_acceptance') {
        result.invite++;
      } else {
        result[group.type]++;
      }
    });

    return result;
  });

  return {
    get notifications() {
      return filteredNotifications;
    },
    get filter() {
      return currentFilter;
    },
    get counts() {
      return counts;
    },
    get targetEventsCache() {
      return targetEventsCache;
    },
    setFilter(filter: NotificationFilter) {
      currentFilter = filter;
    },
  };
}

/**
 * Extract amount in sats from a bolt11 invoice
 */
function extractAmountFromBolt11(bolt11?: string): number {
  if (!bolt11) return 0;

  try {
    // bolt11 format: lnbc{amount}{multiplier}...
    const match = bolt11.match(/lnbc(\d+)([a-z])?/i);
    if (!match) return 0;

    const amount = parseInt(match[1], 10);
    const multiplier = match[2];

    // Convert to sats
    let sats = amount;
    switch (multiplier) {
      case 'm': // milli-btc
        sats = amount * 100000;
        break;
      case 'u': // micro-btc
        sats = amount * 100;
        break;
      case 'n': // nano-btc
        sats = amount / 10;
        break;
      case 'p': // pico-btc
        sats = amount / 10000;
        break;
    }

    return Math.floor(sats);
  } catch {
    return 0;
  }
}
