import { NDKMessenger, CacheModuleStorage, type NDKConversation, type NDKMessage } from '@nostr-dev-kit/messages';
import { ndk } from '../ndk.svelte';
import { messagesLogger as logger } from '$lib/utils/logger';

/**
 * Svelte 5 store for managing DM state using @nostr-dev-kit/messages
 */
class MessagesStore {
  private messenger: NDKMessenger | null = null;
  private _conversations = $state<NDKConversation[]>([]);
  private _totalUnreadCount = $state(0);
  private isStarted = false;

  constructor() {
    // Components should call start() when ready
    // Auto-start logic removed to avoid effect_orphan error
  }

  async start() {
    if (this.isStarted || !ndk.$currentUser || !ndk.signer) return;

    this.isStarted = true;

    // Create messenger instance with persistent storage
    const storage = new CacheModuleStorage(ndk.cacheAdapter!, ndk.$currentUser.pubkey);
    this.messenger = new NDKMessenger(ndk, { storage });

    // Listen for new messages
    this.messenger.on('message', (message: NDKMessage) => {
      this.refreshConversations();
    });

    this.messenger.on('error', (error: unknown) => {
      logger.error('Messenger error:', error);
    });

    // Start the messenger
    await this.messenger.start();

    // Load initial conversations
    await this.refreshConversations();
  }

  private async refreshConversations() {
    if (!this.messenger) return;

    try {
      this._conversations = await this.messenger.getConversations();

      // Calculate total unread count
      this._totalUnreadCount = this._conversations.reduce(
        (total, conv) => total + conv.getUnreadCount(),
        0
      );
    } catch (error) {
      logger.error('Failed to refresh conversations:', error);
    }
  }

  async stop() {
    if (this.messenger) {
      this.messenger.destroy();
      this.messenger = null;
      this.isStarted = false;
      this._conversations = [];
      this._totalUnreadCount = 0;
    }
  }

  async getConversation(participantNpub: string): Promise<NDKConversation | null> {
    if (!this.messenger) return null;

    const user = ndk.getUser({ npub: participantNpub });
    return await this.messenger.getConversation(user);
  }

  async sendMessage(recipientNpub: string, content: string): Promise<NDKMessage | null> {
    if (!this.messenger) return null;

    const recipient = ndk.getUser({ npub: recipientNpub });
    const message = await this.messenger.sendMessage(recipient, content);

    // Refresh conversations after sending
    await this.refreshConversations();

    return message;
  }

  async markConversationAsRead(conversationId: string) {
    const conversation = this._conversations.find(c => c.id === conversationId);
    if (conversation) {
      await conversation.markAsRead();
      // Update unread count
      this._totalUnreadCount = this._conversations.reduce(
        (total, conv) => total + conv.getUnreadCount(),
        0
      );
    }
  }

  get conversations() {
    // Sort by last message timestamp (most recent first)
    return [...this._conversations].sort((a, b) => {
      const aTime = a.getLastMessage()?.timestamp || 0;
      const bTime = b.getLastMessage()?.timestamp || 0;
      return bTime - aTime;
    });
  }

  get totalUnreadCount() {
    return this._totalUnreadCount;
  }

  getMessenger(): NDKMessenger | null {
    return this.messenger;
  }
}

// Create singleton instance
export const messagesStore = new MessagesStore();
