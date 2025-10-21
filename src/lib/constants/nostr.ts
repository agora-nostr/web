/**
 * Nostr protocol constants
 */

// Standard Nostr event kinds
export const KIND_TEXT_NOTE = 1;
export const KIND_REPLY = 1111;
export const KIND_REPOST = 6;
export const KIND_GENERIC_REPOST = 16;
export const KIND_REACTION = 7;
export const KIND_ZAP = 9735;

// Custom/extended kinds
export const KIND_INVITE_ACCEPTANCE = 514;

// Common notification kinds
export const NOTIFICATION_KINDS = [
  KIND_TEXT_NOTE,
  KIND_REPLY,
  KIND_REPOST,
  KIND_GENERIC_REPOST,
  KIND_REACTION,
  KIND_ZAP,
  KIND_INVITE_ACCEPTANCE,
] as const;
