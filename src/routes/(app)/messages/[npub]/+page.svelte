<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { ndk } from '$lib/ndk.svelte';
  import { messagesStore } from '$lib/stores/messages.svelte';
  import { User } from '$lib/ndk/ui/user';
  import ConversationThread from '$lib/components/messages/ConversationThread.svelte';
  import MessageComposer from '$lib/components/messages/MessageComposer.svelte';
  import type { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
  import type { NDKMessage, NDKConversation } from '@nostr-dev-kit/messages';

  let participant = $state<NDKUser | null>(null);
  let participantPubkey = $state<string | null>(null);
  let conversation = $state<NDKConversation | null>(null);
  let messages = $state<NDKMessage[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let lastNpub = $state<string>('');

  const npub = $derived($page.params.npub);

  let profile = $state<NDKUserProfile | null>(null);

  $effect(() => {
    if (!participantPubkey) {
      profile = null;
      return;
    }
    ndk.fetchUser(participantPubkey).then(u => {
      u?.fetchProfile().then(p => { profile = p; });
    });
  });

  async function loadConversation() {
    if (!npub || !ndk.$currentUser) {
      error = 'Invalid conversation';
      loading = false;
      return;
    }

    // Prevent reload if npub hasn't changed
    if (npub === lastNpub && participant) {
      return;
    }

    try {
      loading = true;
      error = null;
      lastNpub = npub;

      // Get participant from npub
      participant = ndk.getUser({ npub });
      participantPubkey = participant.pubkey;

      // Get conversation from store
      conversation = await messagesStore.getConversation(npub);

      if (conversation) {
        // Get messages from conversation
        messages = await conversation.getMessages(100);

        // Mark conversation as read
        await messagesStore.markConversationAsRead(conversation.id);

        // Listen for new messages in this conversation
        conversation.on('message', async () => {
          messages = await conversation!.getMessages(100);
        });
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
      error = 'Failed to load conversation';
    } finally {
      loading = false;
    }
  }

  function handleBack() {
    goto('/messages');
  }

  async function handleMessageSent() {
    // Refresh messages from conversation
    if (conversation) {
      messages = await conversation.getMessages(100);
    }
  }

  // Load conversation when component mounts or npub changes
  $effect(() => {
    if (npub && ndk.$currentUser) {
      loadConversation();
    }
  });
</script>

<div class="h-screen fixed top-0 left-0 right-0 bottom-0 z-[10000] md:h-full md:relative md:z-auto flex flex-col">
  <!-- Header -->
  <div class="sticky top-0 z-10 bg-black border-b border-neutral-800/50 px-4 py-3">
    <div class="flex items-center gap-3">
      <!-- Back button -->
      <button
        onclick={handleBack}
        class="p-2 rounded-lg hover:bg-neutral-800/50 transition-colors text-neutral-400 hover:text-white"
        aria-label="Back to messages"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {#if participant}
        <!-- Avatar -->
        <User.Root {ndk} pubkey={participant.pubkey}>
          <User.Avatar class="w-10 h-10" />
        </User.Root>

        <!-- Name -->
        <div class="flex-1 min-w-0">
          <h1 class="text-lg font-bold text-white truncate">
            {profile?.name || profile?.displayName || 'Anonymous'}
          </h1>
          {#if profile?.nip05}
            <p class="text-xs text-neutral-500 truncate">
              {profile.nip05}
            </p>
          {/if}
        </div>

        <!-- Profile button -->
        <button
          onclick={() => participant && goto(`/p/${participant.npub}`)}
          class="p-2 rounded-lg hover:bg-neutral-800/50 transition-colors text-neutral-400 hover:text-primary"
          title="View profile"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      {:else}
        <div class="flex-1">
          <div class="h-5 w-32 bg-neutral-800 rounded animate-pulse"></div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Content -->
  {#if !ndk.$currentUser}
    <!-- Not logged in -->
    <div class="flex-1 flex items-center justify-center px-6 text-center">
      <div>
        <svg class="w-20 h-20 text-neutral-700 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 class="text-xl font-semibold text-white mb-2">Sign in required</h3>
        <p class="text-neutral-400 max-w-sm">
          Please sign in to view and send direct messages
        </p>
      </div>
    </div>
  {:else if loading}
    <!-- Loading -->
    <div class="flex-1 flex items-center justify-center">
      <svg class="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  {:else if error}
    <!-- Error -->
    <div class="flex-1 flex items-center justify-center px-6 text-center">
      <div>
        <svg class="w-20 h-20 text-red-500 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-xl font-semibold text-white mb-2">Error</h3>
        <p class="text-neutral-400">{error}</p>
        <button
          onclick={loadConversation}
          class="mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  {:else if participant}
    <!-- Conversation -->
    <ConversationThread {messages} />
    <MessageComposer recipient={participant} onMessageSent={handleMessageSent} />
  {/if}
</div>
