<script lang="ts">
  import { t } from 'svelte-i18n';
  import { page } from '$app/stores';
  import { ndk, relayFeeds } from '$lib/ndk.svelte';
  import { walletStore } from '$lib/features/wallet';
  import { settings } from '$lib/stores/settings.svelte';
  import { messagesStore } from '$lib/stores/messages.svelte';
  import { formatBalance } from '$lib/utils/formatBalance';
  import { isAgoraRelay } from '$lib/utils/relayUtils';
  import { createNotificationsManager } from '$lib/utils/useNotifications.svelte';
  import RelaySelector from '../RelaySelector.svelte';
  import LoginButton from '../LoginButton.svelte';
  import UserMenu from '../UserMenu.svelte';
  import Icon, { type IconName } from '../Icon.svelte';
  import Badge from '../Badge.svelte';

  interface Props {
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    onSearchClick?: () => void;
    onPrimaryAction?: () => void;
  }

  const {
    collapsed = false,
    onToggleCollapse,
    onSearchClick,
    onPrimaryAction
  }: Props = $props();

  const notificationsManager = createNotificationsManager(ndk);
  const currentPath = $derived($page.url.pathname);

  // Navigation item configuration
  interface NavItem {
    type: 'link' | 'button' | 'component';
    component?: any;
    componentProps?: Record<string, any>;
    href?: string;
    icon?: IconName;
    label?: string;
    active?: (path: string) => boolean;
    badge?: () => number | null;
    onClick?: () => void;
    visible?: () => boolean;
    rightContent?: () => string | null;
  }

  const navItems: NavItem[] = [
    {
      type: 'component',
      component: RelaySelector,
      componentProps: {
        active: currentPath === '/',
        collapsed
      }
    },
    {
      type: 'link',
      href: '/messages',
      icon: 'message',
      label: 'navigation.messages',
      active: (path) => path.startsWith('/messages'),
      badge: () => messagesStore.totalUnreadCount || null
    },
    {
      type: 'button',
      icon: 'search',
      label: 'Search',
      onClick: onSearchClick
    },
    {
      type: 'link',
      href: '/notifications',
      icon: 'bell',
      label: 'Notifications',
      active: (path) => path.startsWith('/notifications'),
      badge: () => notificationsManager.counts.all || null
    },
    {
      type: 'link',
      href: '/wallet',
      icon: 'wallet',
      label: 'Wallet',
      active: (path) => path.startsWith('/wallet'),
      rightContent: () => { const bal = walletStore.getBalanceAmount(); return bal && bal > 0 ? formatBalance(bal) : null; }
    },
    {
      type: 'link',
      href: '/agora/invites',
      icon: 'users',
      label: 'Community Invites',
      active: (path) => path.startsWith('/agora/invites'),
      visible: () => settings.selectedRelay ? isAgoraRelay(settings.selectedRelay) : false
    },
    {
      type: 'link',
      href: '/packs',
      icon: 'packs',
      label: 'navigation.followPacks',
      active: (path) => path.startsWith('/packs')
    },
    {
      type: 'link',
      href: '/relay-feeds',
      icon: 'relay',
      label: 'Relay Feeds',
      active: (path) => path.startsWith('/relay-feeds'),
      visible: () => (relayFeeds?.relays?.length ?? 0) > 0,
      rightContent: () => relayFeeds?.relays?.length ? String(relayFeeds.relays.length) : null
    },
    {
      type: 'link',
      href: '/trades',
      icon: 'trades',
      label: 'navigation.trades',
      active: (path) => path === '/trades'
    },
    {
      type: 'link',
      href: '/marketplace',
      icon: 'marketplace',
      label: 'navigation.marketplace',
      active: (path) => path === '/marketplace'
    }
  ];

  // Filter visible items
  const visibleNavItems = $derived(
    navItems.filter(item => !item.visible || item.visible())
  );

  // Primary action button configuration based on route
  interface PrimaryActionConfig {
    icon: IconName;
    label: string;
  }

  const primaryActionConfig = $derived.by((): PrimaryActionConfig => {
    if (currentPath === '/marketplace') {
      return {
        icon: 'plus',
        label: $t('classifieds.createListing')
      };
    } else if (currentPath === '/trades') {
      return {
        icon: 'plus',
        label: 'Create Trade'
      };
    } else if (currentPath === '/agora/invites') {
      return {
        icon: 'invite',
        label: 'Create Invite'
      };
    } else {
      return {
        icon: 'edit',
        label: $t('navigation.compose')
      };
    }
  });
</script>

<aside class="hidden lg:flex {collapsed ? 'w-16' : 'w-64'} p-2 flex-col border-r border-border fixed left-0 top-0 bottom-0 overflow-y-auto overflow-x-visible transition-all duration-300 ease-in-out bg-background">
  <!-- Header: Logo and Toggle -->
  <div class="mb-6 flex items-center {collapsed ? 'justify-center' : 'justify-between'} gap-2">
    <!-- Agora Branding -->
    <a href="/" class="px-2 {collapsed ? 'hidden' : 'flex-1'} transition-opacity duration-300 text-foreground hover:opacity-80">
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
    </a>

    <!-- Toggle Button -->
    <button
      onclick={onToggleCollapse}
      class="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary flex-shrink-0"
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {#if collapsed}
        <Icon name="chevron-right" size="md" />
      {:else}
        <Icon name="chevron-left" size="md" />
      {/if}
    </button>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 space-y-2">
    {#each visibleNavItems as item}
      {#if item.type === 'component' && item.component}
        <svelte:component this={item.component} {...item.componentProps} />
      {:else if item.type === 'link' && item.href}
        {@const isActive = item.active ? item.active(currentPath) : false}
        <a
          href={item.href}
          class="flex items-center {collapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'} rounded-lg transition-colors {isActive ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-muted'} relative"
          title={collapsed && item.label ? $t(item.label) : undefined}
        >
          <div class="flex items-center {collapsed ? '' : 'gap-3'}">
            {#if item.icon}
              <Icon name={item.icon} size="lg" />
            {/if}
            {#if !collapsed && item.label}
              <span class="font-medium">{$t(item.label)}</span>
            {/if}
          </div>
          {#if item.badge && item.badge() !== null}
            {@const badgeValue = item.badge()}
            {#if badgeValue !== null}
              {#if collapsed}
                <Badge size="xs" class="absolute top-1.5 right-1.5">
                  {badgeValue > 9 ? '9+' : badgeValue}
                </Badge>
              {:else}
                <Badge size="sm">
                  {badgeValue > 99 ? '99+' : badgeValue}
                </Badge>
              {/if}
            {/if}
          {:else if !collapsed && item.rightContent && item.rightContent()}
            {#if item.href === '/relay-feeds'}
              <Badge variant="secondary" size="sm" class="gap-1">
                <Icon name="trending" size="xs" />
                {item.rightContent()}
              </Badge>
            {:else}
              <span class="text-xs text-muted-foreground font-medium">{item.rightContent()}</span>
            {/if}
          {/if}
        </a>
      {:else if item.type === 'button' && item.onClick}
        <button
          onclick={item.onClick}
          class="w-full flex items-center {collapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'} rounded-lg transition-colors text-foreground hover:bg-muted"
          title={collapsed && item.label ? item.label : undefined}
        >
          {#if item.icon}
            <Icon name={item.icon} size="lg" />
          {/if}
          {#if !collapsed && item.label}
            <span class="font-medium">{item.label}</span>
          {/if}
        </button>
      {/if}
    {/each}

    <!-- Primary Action Button (only shown when logged in) -->
    {#if ndk.$currentUser && onPrimaryAction}
      <button
        onclick={onPrimaryAction}
        class="w-full flex items-center justify-center {collapsed ? 'p-3' : 'gap-2 px-6 py-3'} bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full transition-colors mt-4"
        title={collapsed ? primaryActionConfig.label : undefined}
      >
        <Icon name={primaryActionConfig.icon} size="md" />
        {#if !collapsed}
          <span>{primaryActionConfig.label}</span>
        {/if}
      </button>
    {/if}
  </nav>

  <!-- Login/User Section -->
  <div class="mt-auto pt-4 border-t border-border">
    {#if ndk.$currentUser}
      <UserMenu {collapsed} />
    {:else}
      <LoginButton class="w-full flex items-center justify-center {collapsed ? 'p-3' : 'gap-2 px-4 py-3'} bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full transition-colors" />
    {/if}
  </div>
</aside>