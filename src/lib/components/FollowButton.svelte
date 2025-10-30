<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import { NDKKind, NDKEvent, NDKUser } from '@nostr-dev-kit/ndk';
  import { t } from 'svelte-i18n';
  import { toast } from '$lib/stores/toast.svelte';

  interface Props {
    pubkey: string;
    variant?: 'default' | 'outline' | 'primary';
    showIcon?: boolean;
    class?: string;
  }

  const { pubkey, variant = 'default', showIcon = true, class: className = '' }: Props = $props();

  const follows = $derived(ndk.$sessions?.follows ?? new Set());
  const isFollowing = $derived.by(() => follows.has(pubkey));
  const isOwnProfile = $derived(ndk.$currentUser?.pubkey === pubkey);

  const buttonClasses = $derived.by(() => {
    if (className) return className;

    if (variant === 'primary') {
      return isFollowing
        ? 'px-4 py-2 rounded-full font-medium transition-colors bg-muted text-foreground hover:bg-red-500 hover:text-white text-sm'
        : 'px-4 py-2 rounded-full font-medium transition-colors bg-accent text-accent-foreground hover:bg-accent/90 text-sm';
    }

    return `text-sm font-medium transition-colors inline-flex items-center gap-1 ${
      isFollowing
        ? 'text-muted-foreground hover:text-red-500'
        : 'text-primary hover:underline'
    }`;
  });

  async function handleToggleFollow(event: MouseEvent) {
    if (!ndk.$currentUser) return;

    const wasFollowing = isFollowing;

    try {
      if (isFollowing) {
        ndk.$currentUser.unfollow(pubkey, follows as unknown as Set<string | NDKUser>);
      } else {
        ndk.$currentUser.follow(pubkey, follows as unknown as Set<string | NDKUser>);
      }

      // Dispatch success event
      event.currentTarget?.dispatchEvent(
        new CustomEvent('followsuccess', {
          detail: { pubkey, isFollowing: !wasFollowing },
          bubbles: true,
        })
      );
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error($t('profile.follow_error'));
    }
  }
</script>
{#if !isOwnProfile && ndk.$currentUser}
  <button
    data-testid="follow-button"
    type="button"
    onclick={handleToggleFollow}
    aria-label={isFollowing ? $t('profile.unfollow') : $t('profile.follow')}
    class={buttonClasses}
  >
    {#if showIcon}
      {#if isFollowing}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
        </svg>
      {:else}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      {/if}
    {/if}
    {isFollowing ? $t('profile.unfollow') : $t('profile.follow')}
  </button>
{/if}
