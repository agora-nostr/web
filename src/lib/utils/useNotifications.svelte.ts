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
} from '$lib/constants/nostr';

/**
 * Notification type definitions using $metaSubscribe approach
 */
type BaseNotification = {
  id: string;
  timestamp: number;
  targetEvent: NDKEvent; // The event being interacted with
};

export type ReplyNotification = BaseNotification & {
  type: 'reply';
  replies: NDKEvent[];
};

export type MentionNotification = BaseNotification & {
  type: 'mention';
  mentions: NDKEvent[];
};

export type ReactionNotification = BaseNotification & {
  type: 'reaction';
  reactions: Map<string, Array<{ pubkey: string; event: NDKEvent }>>;
};

export type RepostNotification = BaseNotification & {
  type: 'repost';
  reposts: NDKEvent[];
};

export type ZapNotification = BaseNotification & {
  type: 'zap';
  zaps: Array<{ event: NDKEvent; amount: number; sender: string }>;
};

export type QuoteNotification = BaseNotification & {
  type: 'quote';
  quotes: NDKEvent[];
};

export type InviteAcceptanceNotification = BaseNotification & {
  type: 'invite_acceptance';
  inviteeEvents: NDKEvent[];
};

export type NotificationGroup =
  | ReplyNotification
  | MentionNotification
  | ReactionNotification
  | RepostNotification
  | ZapNotification
  | QuoteNotification
  | InviteAcceptanceNotification;

export type NotificationFilter = 'all' | 'reply' | 'mention' | 'reaction' | 'repost' | 'zap' | 'quote' | 'invite';

/**
 * Extract amount in sats from a bolt11 invoice
 */
function extractAmountFromBolt11(bolt11?: string): number {
  if (!bolt11) return 0;

  try {
    const match = bolt11.match(/lnbc(\d+)([a-z])?/i);
    if (!match) return 0;

    const amount = parseInt(match[1], 10);
    const multiplier = match[2];

    let sats = amount;
    switch (multiplier) {
      case 'm':
        sats = amount * 100000;
        break;
      case 'u':
        sats = amount * 100;
        break;
      case 'n':
        sats = amount / 10;
        break;
      case 'p':
        sats = amount / 10000;
        break;
    }

    return Math.floor(sats);
  } catch {
    return 0;
  }
}

/**
 * Determine if an event is a reply, quote, or mention based on tags
 */
function isReply(event: NDKEvent, userEventIds: Set<string>): boolean {
  const replyMarker = event.tags.find((t) => t[0] === 'e' && t[3] === 'reply');
  return !!(replyMarker && userEventIds.has(replyMarker[1]));
}

function isQuote(event: NDKEvent, userEventIds: Set<string>): boolean {
  const qTag = event.tags.find((t) => t[0] === 'q');
  return !!(qTag && userEventIds.has(qTag[1]));
}

/**
 * Creates a notifications manager using $metaSubscribe
 * This inverts the relationship: we get target events and their interactions
 */
export function createNotificationsManager(ndk: NDKSvelte) {
  // Filter state
  let currentFilter = $state<NotificationFilter>('all');

  // Fetch user's own events to identify what can be replied to
  const userEventsSubscription = ndk.$subscribe(() => {
    if (!ndk.$currentUser) return undefined;

    return {
      filters: [
        {
          kinds: [KIND_TEXT_NOTE, KIND_REPLY, 30023],
          authors: [ndk.$currentUser.pubkey],
          since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30,
        },
      ],
      subId: 'user-events-meta',
    };
  });

  const userEventIds = $derived.by(() => {
    const events = Array.from(userEventsSubscription.events ?? []);
    return new Set(events.map((e) => e.id));
  });

  // Replies and mentions - these point to your events
  const repliesAndMentions = ndk.$metaSubscribe(() => {
    if (!ndk.$currentUser) return undefined;

    return {
      filters: [
        {
          kinds: [KIND_TEXT_NOTE, KIND_REPLY],
          '#p': [ndk.$currentUser.pubkey],
          since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30,
          limit: 200,
        },
      ],
      sort: 'tag-time' as const,
    };
  });

  // Reactions to your content
  const reactions = ndk.$metaSubscribe(() => {
    if (!ndk.$currentUser) return undefined;

    return {
      filters: [
        {
          kinds: [KIND_REACTION],
          '#p': [ndk.$currentUser.pubkey],
          since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30,
          limit: 200,
        },
      ],
      sort: 'tag-time' as const,
    };
  });

  // Reposts of your content
  const reposts = ndk.$metaSubscribe(() => {
    if (!ndk.$currentUser) return undefined;

    return {
      filters: [
        {
          kinds: [KIND_REPOST, KIND_GENERIC_REPOST],
          '#p': [ndk.$currentUser.pubkey],
          since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30,
          limit: 200,
        },
      ],
      sort: 'tag-time' as const,
    };
  });

  // Zaps to your content
  const zaps = ndk.$metaSubscribe(() => {
    if (!ndk.$currentUser) return undefined;

    return {
      filters: [
        {
          kinds: [KIND_ZAP],
          '#p': [ndk.$currentUser.pubkey],
          since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30,
          limit: 200,
        },
      ],
      sort: 'tag-time' as const,
    };
  });

  // Invite acceptances - people who accepted your invites
  const inviteAcceptances = ndk.$metaSubscribe(() => {
    if (!ndk.$currentUser) return undefined;

    return {
      filters: [
        {
          kinds: [KIND_INVITE_ACCEPTANCE],
          '#p': [ndk.$currentUser.pubkey],
          since: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30,
          limit: 200,
        },
      ],
      sort: 'tag-time' as const,
    };
  });

  // Aggregate all notifications
  const notificationGroups = $derived.by(() => {
    if (!ndk.$currentUser) return [];

    const groups: NotificationGroup[] = [];

    // Process replies, mentions, and quotes
    for (const targetEvent of repliesAndMentions.events) {
      const interactions = repliesAndMentions.eventsTagging(targetEvent);
      if (interactions.length === 0) continue;

      const replyEvents = interactions.filter((e) => isReply(e, userEventIds));
      const quoteEvents = interactions.filter((e) => isQuote(e, userEventIds));
      const mentionEvents = interactions.filter((e) => !isReply(e, userEventIds) && !isQuote(e, userEventIds));

      if (replyEvents.length > 0) {
        groups.push({
          id: `reply-${targetEvent.id}`,
          type: 'reply',
          timestamp: Math.max(...replyEvents.map((e) => e.created_at || 0)),
          targetEvent,
          replies: replyEvents,
        });
      }

      if (quoteEvents.length > 0) {
        groups.push({
          id: `quote-${targetEvent.id}`,
          type: 'quote',
          timestamp: Math.max(...quoteEvents.map((e) => e.created_at || 0)),
          targetEvent,
          quotes: quoteEvents,
        });
      }

      if (mentionEvents.length > 0) {
        groups.push({
          id: `mention-${targetEvent.id}`,
          type: 'mention',
          timestamp: Math.max(...mentionEvents.map((e) => e.created_at || 0)),
          targetEvent,
          mentions: mentionEvents,
        });
      }
    }

    // Process reactions - group by emoji
    for (const targetEvent of reactions.events) {
      const reactionEvents = reactions.eventsTagging(targetEvent);
      if (reactionEvents.length === 0) continue;

      const reactionsByEmoji = new Map<
        string,
        Array<{ pubkey: string; event: NDKEvent }>
      >();

      for (const reaction of reactionEvents) {
        let emoji = reaction.content || '👍';
        if (emoji === '+') emoji = '❤️';

        if (!reactionsByEmoji.has(emoji)) {
          reactionsByEmoji.set(emoji, []);
        }
        reactionsByEmoji.get(emoji)!.push({ pubkey: reaction.pubkey, event: reaction });
      }

      groups.push({
        id: `reaction-${targetEvent.id}`,
        type: 'reaction',
        timestamp: Math.max(...reactionEvents.map((e) => e.created_at || 0)),
        targetEvent,
        reactions: reactionsByEmoji,
      });
    }

    // Process reposts
    for (const targetEvent of reposts.events) {
      const repostEvents = reposts.eventsTagging(targetEvent);
      if (repostEvents.length === 0) continue;

      groups.push({
        id: `repost-${targetEvent.id}`,
        type: 'repost',
        timestamp: Math.max(...repostEvents.map((e) => e.created_at || 0)),
        targetEvent,
        reposts: repostEvents,
      });
    }

    // Process zaps
    for (const targetEvent of zaps.events) {
      const zapEvents = zaps.eventsTagging(targetEvent);
      if (zapEvents.length === 0) continue;

      const zapData = zapEvents.map((zap) => {
        const bolt11Tag = zap.tags.find((t) => t[0] === 'bolt11')?.[1];
        const amount = extractAmountFromBolt11(bolt11Tag);

        const descriptionTag = zap.tags.find((t) => t[0] === 'description')?.[1];
        let sender = zap.pubkey;
        if (descriptionTag) {
          try {
            const parsed = JSON.parse(descriptionTag);
            sender = parsed.pubkey || sender;
          } catch {}
        }

        return { event: zap, amount, sender };
      });

      groups.push({
        id: `zap-${targetEvent.id}`,
        type: 'zap',
        timestamp: Math.max(...zapEvents.map((e) => e.created_at || 0)),
        targetEvent,
        zaps: zapData,
      });
    }

    // Process invite acceptances
    for (const targetEvent of inviteAcceptances.events) {
      const acceptanceEvents = inviteAcceptances.eventsTagging(targetEvent);
      if (acceptanceEvents.length === 0) continue;

      groups.push({
        id: `invite-${targetEvent.id}`,
        type: 'invite_acceptance',
        timestamp: Math.max(...acceptanceEvents.map((e) => e.created_at || 0)),
        targetEvent,
        inviteeEvents: acceptanceEvents,
      });
    }

    return groups.sort((a, b) => b.timestamp - a.timestamp);
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
      reaction: 0,
      repost: 0,
      zap: 0,
      quote: 0,
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
    get eosed() {
      return (
        repliesAndMentions.eosed &&
        reactions.eosed &&
        reposts.eosed &&
        zaps.eosed &&
        inviteAcceptances.eosed
      );
    },
    setFilter(filter: NotificationFilter) {
      currentFilter = filter;
    },
  };
}
