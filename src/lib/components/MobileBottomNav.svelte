<script lang="ts">
  import { page } from '$app/stores';
  import { ndk } from '$lib/ndk.svelte';
  import { User } from '$lib/ndk/ui/user';
  import { loginModal } from '$lib/stores/loginModal.svelte';
  import { settings } from '$lib/stores/settings.svelte';
  import { useRelayInfoCached } from '$lib/utils/relayInfo.svelte';
  import { messagesStore } from '$lib/stores/messages.svelte';
  import { goto } from '$app/navigation';
  import { t } from 'svelte-i18n';
  import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
  import { createNotificationsManager } from '$lib/utils/useNotifications.svelte';
  import Icon from './Icon.svelte';
  import Badge from './Badge.svelte';

  const currentPath = $derived($page.url.pathname);
  const notificationsManager = createNotificationsManager(ndk);

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  const selectedRelayInfo = $derived.by(() => {
    if (!settings.selectedRelay) return null;
    return useRelayInfoCached(settings.selectedRelay);
  });

  let showDropdown = $state(false);
  let dropdownRef: HTMLDivElement | undefined = $state();
  let buttonRef: HTMLButtonElement | undefined = $state();

  let profile = $state<NDKUserProfile | null>(null);

  $effect(() => {
    const pubkey = ndk.$currentUser?.pubkey;
    if (!pubkey) {
      profile = null;
      return;
    }
    ndk.fetchUser(pubkey).then(u => {
      u?.fetchProfile().then(p => { profile = p; });
    });
  });

  const displayName = $derived(profile?.displayName || profile?.name || 'Anonymous');
  const npub = $derived(ndk.$currentUser?.npub);

  function handleProfileClick() {
    if (ndk.$currentUser) {
      showDropdown = !showDropdown;
    } else {
      loginModal.open('signup');
    }
  }

  function closeDropdown() {
    showDropdown = false;
  }

  function handleLogout() {
    if (!ndk.$sessions) return;
    ndk.$sessions.logout();
    closeDropdown();
  }

  function navigateToProfile() {
    if (npub) {
      goto(`/p/${npub}`);
      closeDropdown();
    }
  }

  function navigateToSettings() {
    goto('/settings');
    closeDropdown();
  }

  function toggleTheme() {
    const currentTheme = settings.theme;
    if (currentTheme === 'light') {
      settings.setTheme('dark');
    } else if (currentTheme === 'dark') {
      settings.setTheme('system');
    } else {
      settings.setTheme('light');
    }
  }

  function handleNavigation(path: string) {
    if (!ndk.$currentUser) {
      loginModal.open('signup');
      return;
    }
    goto(path);
  }

  $effect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef && !dropdownRef.contains(event.target as Node) &&
          buttonRef && !buttonRef.contains(event.target as Node)) {
        showDropdown = false;
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });
</script>

<nav class="block lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border z-[1000]">
  <div class="flex justify-around items-center px-2 py-3 safe-bottom">
    <!-- Home / Relay Icon -->
    <a
      href="/"
      class="flex items-center justify-center p-3 rounded-lg transition-colors {isActive('/') ? 'text-primary' : 'text-muted-foreground'}"
      aria-label="Home"
    >
      {#if settings.selectedRelay && selectedRelayInfo?.info?.icon}
        <!-- Relay icon -->
        <img src={selectedRelayInfo.info.icon} alt="" class="w-6 h-6 rounded" />
      {:else if settings.selectedRelay}
        <Icon name="relay" size="lg" />
      {:else}
        <Icon name="users" size="lg" />
      {/if}
    </a>

    <!-- Messages -->
    <button
      onclick={() => handleNavigation('/messages')}
      class="flex items-center justify-center p-3 rounded-lg transition-colors {isActive('/messages') ? 'text-primary' : 'text-muted-foreground'} relative"
      aria-label="Messages"
    >
      <Icon name="message" size="lg" />
      {#if messagesStore.totalUnreadCount > 0}
        <Badge indicator class="absolute top-1.5 right-1.5" />
      {/if}
    </button>

    <!-- Notifications -->
    <button
      onclick={() => handleNavigation('/notifications')}
      class="flex items-center justify-center p-3 rounded-lg transition-colors {isActive('/notifications') ? 'text-primary' : 'text-muted-foreground'} relative"
      aria-label="Notifications"
    >
      <Icon name="bell" size="lg" />
      {#if notificationsManager.counts.all > 0}
        <Badge indicator class="absolute top-1.5 right-1.5" />
      {/if}
    </button>

    <!-- Wallet -->
    <button
      onclick={() => handleNavigation('/wallet')}
      class="flex items-center justify-center p-3 rounded-lg transition-colors {isActive('/wallet') ? 'text-primary' : 'text-muted-foreground'}"
      aria-label="Wallet"
    >
      <Icon name="wallet" size="lg" />
    </button>

    <!-- Profile / User Menu -->
    <button
      bind:this={buttonRef}
      onclick={handleProfileClick}
      class="flex items-center justify-center p-2 rounded-lg transition-colors"
      aria-label="Profile"
    >
      {#if ndk.$currentUser}
        <User.Root {ndk} pubkey={ndk.$currentUser.pubkey}>
          <User.Avatar class="w-8 h-8 rounded-full" />
        </User.Root>
      {:else}
        <Icon name="user" size="lg" class="text-muted-foreground" />
      {/if}
    </button>
  </div>
</nav>

<!-- Dropdown Menu (Same as Desktop UserMenu) -->
{#if showDropdown && buttonRef && ndk.$currentUser}
  {#key showDropdown}
    <svelte:element this={'div'} style="display: contents">
      <div
        bind:this={dropdownRef}
        class="w-56 bg-popover border border-border rounded-lg shadow-xl overflow-hidden"
        style="position: fixed; bottom: {window.innerHeight - buttonRef.getBoundingClientRect().top + 8}px; left: {buttonRef.getBoundingClientRect().left - 224 + buttonRef.getBoundingClientRect().width}px; z-index: 9999;"
      >
        <!-- Profile Link -->
        <button
          onclick={navigateToProfile}
          class="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
        >
          <User.Root {ndk} pubkey={ndk.$currentUser.pubkey}>
            <User.Avatar class="w-12 h-12" />
          </User.Root>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm truncate text-popover-foreground">
              {displayName}
            </p>
            <p class="text-xs text-muted-foreground">{$t('profile.editProfile')}</p>
          </div>
        </button>

        <div class="h-px bg-border"></div>

        <!-- Theme Toggle -->
        <button
          onclick={toggleTheme}
          class="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left text-popover-foreground"
        >
          {#if settings.theme === 'light'}
            <Icon name="sun" size="sm" />
            <span>{$t('settings.sections.appearance.themes.light')}</span>
          {:else if settings.theme === 'dark'}
            <Icon name="moon" size="sm" />
            <span>{$t('settings.sections.appearance.themes.dark')}</span>
          {:else}
            <Icon name="monitor" size="sm" />
            <span>{$t('settings.sections.appearance.themes.system')}</span>
          {/if}
        </button>

        <!-- Settings Link -->
        <button
          onclick={navigateToSettings}
          class="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left text-popover-foreground"
        >
          <Icon name="settings" size="sm" />
          <span>{$t('navigation.settings')}</span>
        </button>

        <div class="h-px bg-border"></div>

        <!-- Logout Button -->
        <button
          onclick={handleLogout}
          class="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left text-destructive hover:text-destructive/90"
        >
          <Icon name="logout" size="sm" />
          <span>{$t('navigation.logout')}</span>
        </button>
      </div>
    </svelte:element>
  {/key}
{/if}

<style>
  /* Support for iPhone notch/safe area */
  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
</style>
