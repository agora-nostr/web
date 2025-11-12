<script lang="ts">
  import { page } from '$app/stores';
  import { sidebarStore } from '$lib/stores/sidebar.svelte';
  import { headerStore } from '$lib/stores/header.svelte';
  import { layoutMode } from '$lib/stores/layoutMode.svelte';
  import MobileBottomNav from '../MobileBottomNav.svelte';
  import SmartFAB from '../navigation/SmartFAB.svelte';
  import Icon from '../Icon.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    onComposeClick?: () => void;
    onListingClick?: () => void;
    onInviteClick?: () => void;
    onTradeClick?: () => void;
  }

  const {
    children,
    onComposeClick,
    onListingClick,
    onInviteClick,
    onTradeClick
  }: Props = $props();

  const path = $derived($page.url.pathname);

  // Determine if right sidebar content should be shown on mobile
  const hideRightSidebar = $derived(
    layoutMode.mode === 'article' ||
    layoutMode.mode === 'profile' ||
    layoutMode.mode === 'reads' ||
    path.startsWith('/note/') ||
    path.startsWith('/messages/') ||
    path.startsWith('/packs') ||
    path.startsWith('/agora/invites')
  );
</script>

<div class="bg-background">
  <div class="flex flex-col min-h-screen">
    <!-- Main Content -->
    <main class="flex-1 pb-20 bg-background">
      <!-- Structured Header Config - rendered by Layout for consistency -->
      {#if headerStore.headerConfig}
        <div class="border-b border-border bg-background">
          <div class="px-4 py-3">
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
                <h1 class="text-xl font-bold text-foreground">
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
          <div class="px-4 py-3">
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
        <div class="p-3 border-b border-border bg-background">
          {@render sidebarStore.rightSidebar()}
        </div>
      {/if}

      {@render children()}
    </main>

    <!-- Mobile Bottom Navigation -->
    <MobileBottomNav />

    <!-- Smart FAB -->
    <SmartFAB
      {onComposeClick}
      {onListingClick}
      {onInviteClick}
      {onTradeClick}
    />
  </div>
</div>