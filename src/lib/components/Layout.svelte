<script lang="ts">
  import { setContext } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { t } from 'svelte-i18n';
  import { ndk, relayFeeds } from '$lib/ndk.svelte';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import { headerStore } from '$lib/stores/header.svelte';
  import { layoutMode } from '$lib/stores/layoutMode.svelte';
  import { settings } from '$lib/stores/settings.svelte';
  import { createPackModal } from '$lib/stores/createPackModal.svelte';
  import { createListingModal } from '$lib/stores/createListingModal.svelte';
  import { createInviteModal } from '$lib/stores/createInviteModal.svelte';
  import { createMediaPostModal } from '$lib/stores/createMediaPostModal.svelte';
  import { createTradeModal } from '$lib/stores/createTradeModal.svelte';
  import { homePageFilter } from '$lib/stores/homePageFilter.svelte';
  import { useRelayInfoCached } from '$lib/utils/relayInfo.svelte';
  import { AGORA_RELAYS, isAgoraRelay, getRelaysToUse } from '$lib/utils/relayUtils';
  import { messagesStore } from '$lib/stores/messages.svelte';
  import { npubCashMonitor } from '$lib/services/npubcashMonitor.svelte';
  import { NDKKind, NDKArticle, NDKSubscriptionCacheUsage } from '@nostr-dev-kit/ndk';
  import { getArticleUrl } from '$lib/utils/articleUrl';
  import { createNotificationsManager } from '$lib/utils/useNotifications.svelte';
  import { formatBalance, formatBalanceLong } from '$lib/utils/formatBalance';
  import RelaySelector from './RelaySelector.svelte';
  import LoginButton from './LoginButton.svelte';
  import UserMenu from './UserMenu.svelte';
  import MarketplaceSidebar from './MarketplaceSidebar.svelte';
  import NewMembersWidget from './NewMembersWidget.svelte';
  import JournalistsSidebar from './JournalistsSidebar.svelte';
  import MobileBottomNav from './MobileBottomNav.svelte';
  import MobileComposeFAB from './MobileComposeFAB.svelte';
  import Icon from './Icon.svelte';
  import Badge from './Badge.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  const { children }: Props = $props();

  // Set NDK in Svelte context for child components
  setContext('ndk', ndk);

  const wallet = ndk.$wallet;
  const notificationsManager = createNotificationsManager(ndk);
  let sidebarCollapsed = $state(false);

  const path = $derived($page.url.pathname);

  const hideRightSidebar = $derived(
    layoutMode.mode === 'article' ||
    layoutMode.mode === 'profile' ||
    layoutMode.mode === 'reads' ||
    path.startsWith('/note/') ||
    path.startsWith('/messages/') ||
    path.startsWith('/packs') ||
    path.startsWith('/agora/invites')
  );

  const shouldCollapseSidebar = $derived(layoutMode.mode === 'article');

  // Get relays to use for sidebar subscriptions
  const sidebarRelaysToUse = $derived(
    getRelaysToUse(
      settings.selectedRelay,
      settings.relays.filter(r => r.enabled && r.read).map(r => r.url)
    )
  );

  // Subscribe to recent articles for the sidebar
  const recentArticlesSubscription = $derived.by(() => {
    if (!hideRightSidebar && !sidebarStore.rightSidebar) {
      return ndk.$subscribe(() => ({
        filters: [{ kinds: [NDKKind.Article], limit: 5 }],
        bufferMs: 500,
        relayUrls: sidebarRelaysToUse.length > 0 ? sidebarRelaysToUse : undefined,
        cacheUsage: sidebarRelaysToUse.length > 0 ? NDKSubscriptionCacheUsage.ONLY_RELAY : NDKSubscriptionCacheUsage.CACHE_FIRST,
        closeOnEose: true,
      }));
    }
    return null;
  });

  const recentArticles = $derived.by(() => {
    if (!recentArticlesSubscription) return [];
    return recentArticlesSubscription.events
      .map(e => NDKArticle.from(e))
      .filter(article => article.title && article.content)
      .sort((a, b) => (b.published_at ?? b.created_at ?? 0) - (a.published_at ?? a.created_at ?? 0))
      .slice(0, 5);
  });

  const selectedRelayInfo = $derived.by(() => {
    if (!settings.selectedRelay) return null;
    return useRelayInfoCached(settings.selectedRelay);
  });

  // Auto-collapse sidebar when viewing articles
  $effect(() => {
    if (shouldCollapseSidebar) {
      sidebarCollapsed = true;
    }
  });

  // Handle messages subscription lifecycle
  $effect(() => {
    if (!ndk.$currentUser) {
      messagesStore.stop();
    }
  });

  // Handle npub.cash monitor lifecycle
  $effect(() => {
    if (ndk.$currentUser) {
      npubCashMonitor.start();
    } else {
      npubCashMonitor.stop();
    }

    return () => {
      npubCashMonitor.stop();
    };
  });
</script>

<div class="h-screen bg-background flex justify-center overflow-hidden">
  <div class="flex w-full max-w-full lg:max-w-[1400px] relative">
    <!-- Left Sidebar - Navigation -->
    <aside class="hidden lg:flex {sidebarCollapsed ? 'w-20' : 'w-64'} flex-col border-r border-border p-4 fixed left-0 top-0 bottom-0 overflow-y-auto overflow-x-visible transition-all duration-300 ease-in-out bg-background">
      <!-- Header: Logo and Toggle -->
      <div class="mb-6 flex items-center {sidebarCollapsed ? 'justify-center' : 'justify-between'} gap-2">
        <!-- Agora Branding -->
        <div class="px-2 {sidebarCollapsed ? 'hidden' : 'flex-1'} transition-opacity duration-300 text-foreground">
        <svg viewBox="0 0 686 250" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
          <style>
            .st0{fill:#F68E1D;}
            .st1{fill:currentColor;}
            .st2{fill:currentColor;opacity:0.9;}
          </style>
          <path class="st0" d="M109.5,196.1h66.7c17.5,0,31.6-14.2,31.6-31.6V97.8c0-17.5-14.2-31.6-31.6-31.6h-66.7
            c-17.5,0-31.6,14.2-31.6,31.6v66.7C77.9,182,92,196.1,109.5,196.1z"/>
          <g>
            <path class="st1" d="M233.9,165.4v-0.9c3.6-0.3,6.4-1.1,8.4-2.4c2-1.3,3.5-3.2,4.7-5.8l24.2-54.9h3.8l28.5,57.6
              c0.7,1.4,1.7,2.6,3.2,3.6c1.4,1,3.6,1.6,6.4,1.9v0.9h-27.7v-0.9c2.9-0.3,4.7-0.9,5.4-1.9c0.8-1,0.8-2.2,0.1-3.6l-21.5-44.6
              L251,156.3c-1.1,2.6-0.9,4.5,0.5,5.8c1.4,1.3,3.9,2.1,7.6,2.4v0.9H233.9z M273.1,87.7h8.8l-7.8,9.2h-3L273.1,87.7z"/>
            <path class="st1" d="M358.3,135.2c0-1.5-0.6-2.7-1.8-3.7c-1.2-0.9-3.3-1.5-6.1-1.8v-0.9H378v0.9c-2.9,0.3-4.9,0.9-6.1,1.8
              c-1.2,0.9-1.8,2.1-1.8,3.7v32.9c0,1.5,0.6,2.7,1.8,3.7c1.2,0.9,3.3,1.5,6.1,1.8v0.9h-29v-0.9c3.5-0.3,5.9-0.9,7.2-1.8
              c1.3-0.9,2-2.1,2-3.7v-11.1c-1.5,2.9-3.7,5.2-6.7,6.7c-2.9,1.6-6.8,2.3-11.5,2.3c-4.5,0-8.7-0.7-12.3-2.2c-3.7-1.5-6.8-3.6-9.4-6.4
              c-2.6-2.8-4.6-6.2-6-10.2c-1.4-4-2.1-8.6-2.1-13.6c0-5.1,0.7-9.6,2.2-13.7c1.5-4.1,3.7-7.5,6.6-10.4c2.9-2.9,6.5-5.1,10.9-6.7
              c4.4-1.6,9.4-2.3,15.1-2.3c3.8,0,7.5,0.3,11.2,1c3.7,0.7,7.2,1.7,10.6,3v15.6h-1.3c-1.1-2.5-2.3-4.8-3.7-6.8c-1.4-2-3-3.8-4.7-5.3
              c-1.8-1.5-3.7-2.6-5.9-3.4c-2.2-0.8-4.6-1.2-7.3-1.2c-3.6,0-6.8,0.7-9.5,2.1c-2.7,1.4-4.9,3.4-6.7,6c-1.8,2.6-3.2,5.7-4,9.3
              c-0.9,3.6-1.3,7.7-1.3,12.2c0,9.2,1.8,16.2,5.5,20.8c3.7,4.7,8.6,7,14.6,7c4.8,0,8.5-1.6,11.3-4.8c2.7-3.2,4.2-8.5,4.5-15.8V135.2z
              "/>
            <path class="st1" d="M480.2,101.4c12.3,0,21.4,1.4,27.3,4.3c5.8,2.9,8.8,6.9,8.8,12.1c0,3.8-1.6,7.1-4.7,9.7
              c-3.2,2.6-8,4.5-14.7,5.6l19,25.9c0.9,1.3,2.2,2.4,3.8,3.5c1.6,1,3.8,1.7,6.7,2v0.9h-27.7v-0.9c2.9-0.3,4.5-1,4.8-2
              c0.3-1,0-2.2-0.9-3.5l-17.9-24.8c-0.7,0.1-1.4,0.1-2.1,0.1c-0.8,0-1.5,0-2.3,0h-7.1V159c0,1.5,0.6,2.7,1.8,3.7
              c1.2,0.9,3.3,1.5,6.1,1.8v0.9h-27.7v-0.9c2.9-0.3,4.9-0.9,6.1-1.8c1.2-0.9,1.8-2.1,1.8-3.7v-51.2c0-1.5-0.6-2.7-1.8-3.7
              c-1.2-0.9-3.3-1.5-6.1-1.8v-0.9H480.2z M480.2,131.6c8.2,0,14.3-1.2,18.1-3.5c3.8-2.3,5.7-5.7,5.7-10.2c0-4.5-1.9-7.9-5.7-10.2
              c-3.8-2.3-9.8-3.5-18.1-3.5h-7.1v27.5H480.2z"/>
            <path class="st1" d="M528.9,165.4v-0.9c3.6-0.3,6.4-1.1,8.4-2.4c2-1.3,3.5-3.2,4.7-5.8l24.2-54.9h3.8l28.5,57.6
              c0.7,1.4,1.7,2.6,3.2,3.6c1.4,1,3.6,1.6,6.4,1.9v0.9h-27.7v-0.9c2.9-0.3,4.7-0.9,5.4-1.9c0.8-1,0.8-2.2,0.1-3.6l-21.5-44.6
              L546,156.3c-1.1,2.6-0.9,4.5,0.5,5.8c1.4,1.3,3.9,2.1,7.6,2.4v0.9H528.9z"/>
            <path class="st1" d="M445.1,120c-1.5-4-3.7-7.5-6.5-10.3c-2.8-2.9-6.2-5.1-10.1-6.6c-4-1.6-8.4-2.3-13.4-2.3
              c-4.9,0-9.3,0.8-13.3,2.3c-4,1.6-7.4,3.8-10.2,6.6c-2.8,2.9-5,6.3-6.5,10.3c-1.5,4-2.3,8.5-2.3,13.5s0.8,9.4,2.3,13.5
              c1.5,4,3.7,7.5,6.5,10.3c2.8,2.9,6.2,5.1,10.2,6.6c4,1.6,8.4,2.3,13.3,2.3c5,0,9.4-0.8,13.4-2.3c3.9-1.6,7.3-3.8,10.1-6.6
              c2.8-2.9,5-6.3,6.5-10.3c1.5-4,2.3-8.5,2.3-13.5S446.6,124,445.1,120z M415,163.4c-12.4,0-20.9-13.4-20.9-30s8.2-30,20.9-30
              c13,0,20.9,13.4,20.9,30S428,163.4,415,163.4z"/>
          </g>
          <path d="M144.2,133.4h-2.9v0.1C142.3,133.5,143.3,133.5,144.2,133.4z"/>
          <polygon class="st2" points="143.9,97.2 101,109.3 101,113.8 186.8,113.8 186.8,109.3 "/>
          <polygon class="st2" points="104.4,115.4 106,117.6 181.2,117.6 182.6,115.4 "/>
          <path class="st2" d="M125,120.4h-11.8h-0.8h-11.8l-1.5,1.8l6.4,4.6h0.1v34.7h14.6v-34.7h0.1l6.4-4.6L125,120.4z M111.2,157h-2.6
            v-29.2h2.6V157z M117.1,157h-2.6v-29.2h2.6V157z"/>
          <path class="st2" d="M185.3,120.4h-11.8h-0.8h-11.8l-1.5,1.8l6.4,4.6h0.1v34.7h14.6v-34.7h0.1l6.4-4.6L185.3,120.4z M171.4,157h-2.6
            v-29.2h2.6V157z M177.3,157h-2.6v-29.2h2.6V157z"/>
          <path class="st2" d="M155.2,120.4h-11.8h-0.8h-11.8l-1.5,1.8l6.4,4.6h0.1v34.7h14.6v-34.7h0.1l6.4-4.6L155.2,120.4z M141.3,157h-2.6
            v-29.2h2.6V157z M147.2,157h-2.6v-29.2h2.6V157z"/>
          <path class="st1" d="M284.4,150.2h-2.6v0.1C282.7,150.3,283.6,150.3,284.4,150.2z"/>
        </svg>
        </div>

        <!-- Toggle Button -->
        <button
          onclick={() => sidebarCollapsed = !sidebarCollapsed}
          class="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary flex-shrink-0"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {#if sidebarCollapsed}
            <Icon name="chevron-right" size="md" />
          {:else}
            <Icon name="chevron-left" size="md" />
          {/if}
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 space-y-2">
        <!-- Following / Relay Selector -->
        <RelaySelector active={path === '/'} collapsed={sidebarCollapsed} />

        <a
          href="/messages"
          class="flex items-center {sidebarCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'} rounded-lg transition-colors {path.startsWith('/messages') ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'} relative"
          title={sidebarCollapsed ? $t('navigation.messages') : undefined}
        >
          <div class="flex items-center {sidebarCollapsed ? '' : 'gap-3'}">
            <Icon name="message" size="lg" />
            {#if !sidebarCollapsed}
              <span class="font-medium">{$t('navigation.messages')}</span>
            {/if}
          </div>
          {#if messagesStore.totalUnreadCount > 0}
            {#if sidebarCollapsed}
              <Badge size="xs" class="absolute top-1.5 right-1.5">
                {messagesStore.totalUnreadCount > 9 ? '9+' : messagesStore.totalUnreadCount}
              </Badge>
            {:else}
              <Badge size="sm">
                {messagesStore.totalUnreadCount > 99 ? '99+' : messagesStore.totalUnreadCount}
              </Badge>
            {/if}
          {/if}
        </a>

        <a
          href="/notifications"
          class="flex items-center {sidebarCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'} rounded-lg transition-colors {path.startsWith('/notifications') ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'} relative"
          title={sidebarCollapsed ? 'Notifications' : undefined}
        >
          <div class="flex items-center {sidebarCollapsed ? '' : 'gap-3'}">
            <Icon name="bell" size="lg" />
            {#if !sidebarCollapsed}
              <span class="font-medium">Notifications</span>
            {/if}
          </div>
          {#if notificationsManager.counts.all > 0}
            {#if sidebarCollapsed}
              <Badge size="xs" class="absolute top-1.5 right-1.5">
                {notificationsManager.counts.all > 9 ? '9+' : notificationsManager.counts.all}
              </Badge>
            {:else}
              <Badge size="sm">
                {notificationsManager.counts.all > 99 ? '99+' : notificationsManager.counts.all}
              </Badge>
            {/if}
          {/if}
        </a>

        <a
          href="/wallet"
          class="flex items-center {sidebarCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'} rounded-lg transition-colors {path.startsWith('/wallet') ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'}"
          title={sidebarCollapsed ? 'Wallet' : undefined}
        >
          <div class="flex items-center {sidebarCollapsed ? '' : 'gap-3'}">
            <Icon name="wallet" size="lg" />
            {#if !sidebarCollapsed}
              <span class="font-medium">Wallet</span>
            {/if}
          </div>
          {#if !sidebarCollapsed && wallet.balance > 0}
            <span class="text-xs text-muted-foreground font-medium">{formatBalance(wallet.balance)}</span>
          {/if}
        </a>

        {#if settings.selectedRelay && isAgoraRelay(settings.selectedRelay)}
          <a
            href="/agora/invites"
            class="flex items-center {sidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-lg transition-colors {path.startsWith('/agora/invites') ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'}"
            title={sidebarCollapsed ? 'Community Invites' : undefined}
          >
            <Icon name="users" size="lg" />
            {#if !sidebarCollapsed}
              <span class="font-medium">Community Invites</span>
            {/if}
          </a>
        {/if}

        <a
          href="/packs"
          class="flex items-center {sidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-lg transition-colors {path.startsWith('/packs') ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'}"
          title={sidebarCollapsed ? $t('navigation.followPacks') : undefined}
        >
          <Icon name="packs" size="lg" />
          {#if !sidebarCollapsed}
            <span class="font-medium">{$t('navigation.followPacks')}</span>
          {/if}
        </a>

        {#if relayFeeds && relayFeeds.relays.length > 0}
          <a
            href="/relay-feeds"
            class="flex items-center {sidebarCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'} rounded-lg transition-colors {path.startsWith('/relay-feeds') ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'}"
            title={sidebarCollapsed ? 'Relay Feeds' : undefined}
          >
            <div class="flex items-center {sidebarCollapsed ? '' : 'gap-3'}">
              <Icon name="relay" size="lg" />
              {#if !sidebarCollapsed}
                <span class="font-medium">Relay Feeds</span>
              {/if}
            </div>
            {#if !sidebarCollapsed}
              <Badge variant="secondary" size="sm" class="gap-1">
                <Icon name="trending" size="xs" />
                {relayFeeds.relays.length}
              </Badge>
            {/if}
          </a>
        {/if}

        <a
          href="/trades"
          class="flex items-center {sidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-lg transition-colors {path === '/trades' ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'}"
          title={sidebarCollapsed ? $t('navigation.trades') : undefined}
        >
          <Icon name="trades" size="lg" />
          {#if !sidebarCollapsed}
            <span class="font-medium">{$t('navigation.trades')}</span>
          {/if}
        </a>

        <a
          href="/marketplace"
          class="flex items-center {sidebarCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-lg transition-colors {path === '/marketplace' ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'}"
          title={sidebarCollapsed ? $t('navigation.marketplace') : undefined}
        >
          <Icon name="marketplace" size="lg" />
          {#if !sidebarCollapsed}
            <span class="font-medium">{$t('navigation.marketplace')}</span>
          {/if}
        </a>

        <button
          onclick={() => {
            if (path === '/marketplace') {
              createListingModal.open();
            } else if (path === '/trades') {
              createTradeModal.open();
            } else if (path.startsWith('/packs')) {
              createPackModal.open();
            } else if (path === '/agora/invites') {
              createInviteModal.open();
            } else if (path === '/' && homePageFilter.selected === 'images') {
              createMediaPostModal.open();
            } else {
              goto('/compose');
            }
          }}
          class="w-full flex items-center justify-center {sidebarCollapsed ? 'p-3' : 'gap-2 px-6 py-3'} bg-primary hover:bg-primary/90 text-foreground font-semibold rounded-full transition-colors mt-4"
          title={sidebarCollapsed ? (path === '/marketplace' ? $t('classifieds.createListing') : path === '/trades' ? 'Create Trade' : path.startsWith('/packs') ? 'Create Pack' : path === '/agora/invites' ? 'Create Invite' : path === '/' && homePageFilter.selected === 'images' ? 'Create media post' : $t('navigation.compose')) : undefined}
        >
          {#if path === '/marketplace'}
            <Icon name="plus" size="md" />
            {#if !sidebarCollapsed}
              <span>{$t('classifieds.createListing')}</span>
            {/if}
          {:else if path === '/trades'}
            <Icon name="plus" size="md" />
            {#if !sidebarCollapsed}
              <span>Create Trade</span>
            {/if}
          {:else if path.startsWith('/packs')}
            <Icon name="plus" size="md" />
            {#if !sidebarCollapsed}
              <span>Create Pack</span>
            {/if}
          {:else if path === '/agora/invites'}
            <Icon name="invite" size="md" />
            {#if !sidebarCollapsed}
              <span>Create Invite</span>
            {/if}
          {:else if path === '/' && homePageFilter.selected === 'images'}
            <Icon name="image" size="md" />
            {#if !sidebarCollapsed}
              <span>Create media post</span>
            {/if}
          {:else}
            <Icon name="edit" size="md" />
            {#if !sidebarCollapsed}
              <span>{$t('navigation.compose')}</span>
            {/if}
          {/if}
        </button>
      </nav>

      <!-- Login/User Section -->
      <div class="mt-auto pt-4 border-t border-border">
        {#if ndk.$currentUser}
          <UserMenu collapsed={sidebarCollapsed} />
        {:else}
          <LoginButton class="w-full flex items-center justify-center {sidebarCollapsed ? 'p-3' : 'gap-2 px-4 py-3'} bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full transition-colors" />
        {/if}
      </div>
    </aside>

    <!-- Main Content Container -->
    <div class="flex-1 flex {sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} transition-all duration-300 ease-in-out h-full">
      <!-- Center column - Main content -->
      <div class={`w-full lg:flex-1 ${hideRightSidebar ? 'lg:max-w-[900px]' : 'lg:max-w-[600px]'} min-w-0 flex flex-col h-full border-x border-border`}>
        <!-- Page content -->
        <main class="flex-1 pb-20 lg:pb-0 bg-background max-w-screen overflow-y-auto">
          <!-- Structured Header Config - rendered by Layout for consistency -->
          {#if headerStore.headerConfig}
            <div class="border-b border-border bg-background">
              <div class="px-4 sm:px-6 lg:px-8 py-3">
                <div class="flex items-center gap-3">
                  <!-- Back Button -->
                  {#if headerStore.headerConfig.backNav}
                    {@const backNav = headerStore.headerConfig.backNav}
                    {#if backNav.href}
                      <a
                        href={backNav.href}
                        class="inline-flex items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
                      >
                        <Icon name="arrow-left" size="lg" />
                      </a>
                    {:else if backNav.onclick}
                      <button
                        onclick={backNav.onclick}
                        class="inline-flex items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
                      >
                        <Icon name="arrow-left" size="lg" />
                      </button>
                    {/if}
                  {/if}

                  <!-- Title and Subtitle -->
                  <div class="flex-1">
                    <h1 class="text-2xl font-bold text-foreground">
                      {headerStore.headerConfig.title}
                    </h1>
                    {#if headerStore.headerConfig.subtitle}
                      <p class="text-sm text-muted-foreground mt-1">
                        {headerStore.headerConfig.subtitle}
                      </p>
                    {/if}
                  </div>

                  <!-- Actions -->
                  {#if headerStore.headerConfig.actions}
                    {@render headerStore.headerConfig.actions()}
                  {/if}
                </div>
              </div>
            </div>
          {:else if headerStore.header}
            <!-- Custom Header Snippet - for full control -->
            {@render headerStore.header()}
          {:else if headerStore.backNav}
            <!-- Standalone Back Navigation - shown only when no header provided -->
            <div class="border-b border-border bg-background">
              <div class="px-4 sm:px-6 lg:px-8 py-3">
                {#if headerStore.backNav.href}
                  <a
                    href={headerStore.backNav.href}
                    class="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                  >
                    <Icon name="arrow-left" size="lg" />
                    {#if headerStore.backNav.label}
                      <span class="font-medium">{headerStore.backNav.label}</span>
                    {/if}
                  </a>
                {:else if headerStore.backNav.onclick}
                  <button
                    onclick={headerStore.backNav.onclick}
                    class="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                  >
                    <Icon name="arrow-left" size="lg" />
                    {#if headerStore.backNav.label}
                      <span class="font-medium">{headerStore.backNav.label}</span>
                    {/if}
                  </button>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Mobile Sidebar Content - shown before main content on mobile when enabled -->
          {#if sidebarStore.showOnMobile && sidebarStore.rightSidebar && !hideRightSidebar}
            <div class="lg:hidden p-3 border-b border-border bg-background">
              {@render sidebarStore.rightSidebar()}
            </div>
          {/if}

          {@render children()}
        </main>
      </div>

      <!-- Right Sidebar - Widgets -->
      {#if !hideRightSidebar}
        <aside class="hidden lg:block w-80 p-4 space-y-4">
          <div class="sticky top-4 space-y-4">
            {#if sidebarStore.rightSidebar}
              {@render sidebarStore.rightSidebar()}
            {:else}
              <!-- New Members Widget (only shown when a relay is selected) -->
              <NewMembersWidget />

              <!-- Recent Articles Widget -->
              <div class="p-4 bg-card rounded-lg border border-border">
                <div class="flex items-center gap-2 mb-4">
                  <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h2 class="text-lg font-semibold text-card-foreground">{$t('feed.mediaTypes.articles')}</h2>
                </div>
                <div class="space-y-3">
                  {#if recentArticles.length === 0}
                    <div class="h-4 bg-muted rounded animate-pulse"></div>
                    <div class="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                    <div class="h-4 bg-muted rounded animate-pulse"></div>
                  {:else}
                    {#each recentArticles as article (article.id)}
                      <a
                        href={getArticleUrl(article, article.author)}
                        class="block text-sm text-muted-foreground hover:text-primary transition-colors line-clamp-2"
                      >
                        {article.title}
                      </a>
                    {/each}
                  {/if}
                </div>
              </div>

              <!-- Journalists Widget -->
              <JournalistsSidebar />

              <!-- Marketplace Widget -->
              <MarketplaceSidebar />

              <!-- Footer -->
              <div class="text-xs text-muted-foreground space-y-2">
                <div class="flex flex-wrap gap-3">
                  <a href="#" class="hover:text-foreground transition-colors">Terms</a>
                  <a href="#" class="hover:text-foreground transition-colors">Privacy</a>
                  <a href="#" class="hover:text-foreground transition-colors">About</a>
                  <a href="#" class="hover:text-foreground transition-colors">Help</a>
                </div>
                <p>© 2024 Agora</p>
              </div>
            {/if}
          </div>
        </aside>
      {/if}
    </div>
  </div>

  <!-- Mobile Bottom Navigation -->
  <MobileBottomNav />

  <!-- Mobile Compose FAB (only on home page, marketplace, and agora invites) -->
  {#if path === '/'}
    <MobileComposeFAB isHomePage={true} />
  {:else if path === '/marketplace'}
    <MobileComposeFAB onclick={() => createListingModal.open()} />
  {:else if path === '/agora/invites'}
    <MobileComposeFAB onclick={() => createInviteModal.open()} />
  {/if}
</div>
