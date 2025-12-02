/**
 * Shared subscription properties for feed components.
 * Used to pass filtering configuration to feed components.
 */
export interface SubscriptionProps {
  /** Relay URLs to fetch from. If provided, uses exclusive relay mode. */
  relayUrls?: string[];
  /** Hashtag filters to apply (#t tags) */
  hashtags?: string[];
  /** Author pubkeys to filter by */
  authors?: string[];
}
