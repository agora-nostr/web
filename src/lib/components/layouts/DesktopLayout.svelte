<script lang="ts">
  import { t } from "svelte-i18n";
  import { ndk } from "$lib/ndk.svelte";
  import {
    NDKKind,
    NDKArticle,
    NDKSubscriptionCacheUsage,
  } from "@nostr-dev-kit/ndk";
  import { sidebarStore } from "$lib/stores/sidebar.svelte";
  import { headerStore } from "$lib/stores/header.svelte";
  import { layoutStore } from "$lib/stores/layout.svelte";
  import { settings } from "$lib/stores/settings.svelte";
  import { getRelaysToUse } from "$lib/utils/relayUtils";
  import { getArticleUrl } from "$lib/utils/articleUrl";
  import SidebarNav from "../navigation/SidebarNav.svelte";
  import NewMembersWidget from "../NewMembersWidget.svelte";
  import JournalistsSidebar from "../JournalistsSidebar.svelte";
  import Icon from "../Icon.svelte";
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
    onSearchClick?: () => void;
    onPrimaryAction?: () => void;
  }

  const { children, onSearchClick, onPrimaryAction }: Props = $props();

  // Get relays to use for sidebar subscriptions
  const sidebarRelaysToUse = $derived(
    getRelaysToUse(
      settings.selectedRelay,
      settings.relays.filter((r) => r.enabled && r.read).map((r) => r.url),
    ),
  );

  // Subscribe to recent articles for the sidebar
  const recentArticlesSubscription = $derived.by(() => {
    if (layoutStore.rightSidebarVisible && !sidebarStore.rightSidebar) {
      return ndk.$subscribe(() => ({
        filters: [{ kinds: [NDKKind.Article], limit: 5 }],
        bufferMs: 500,
        relayUrls:
          sidebarRelaysToUse.length > 0 ? sidebarRelaysToUse : undefined,
        cacheUsage:
          sidebarRelaysToUse.length > 0
            ? NDKSubscriptionCacheUsage.ONLY_RELAY
            : NDKSubscriptionCacheUsage.CACHE_FIRST,
        closeOnEose: true,
      }));
    }
    return null;
  });

  const recentArticles = $derived.by(() => {
    if (!recentArticlesSubscription) return [];
    return recentArticlesSubscription.events
      .map((e) => NDKArticle.from(e))
      .filter((article) => article.title && article.content)
      .sort(
        (a, b) =>
          (b.published_at ?? b.created_at ?? 0) -
          (a.published_at ?? a.created_at ?? 0),
      )
      .slice(0, 5);
  });
</script>

<div
  class="flex w-full max-w-full relative {layoutStore.sidebarCollapsed
    ? 'lg:pl-16'
    : 'lg:pl-64'} {layoutStore.rightSidebarVisible
    ? 'xl:pr-80'
    : ''} transition-all duration-300"
>
  <!-- Left Sidebar Navigation -->
  <SidebarNav
    collapsed={layoutStore.sidebarCollapsed}
    onToggleCollapse={() => layoutStore.toggleSidebar()}
    {onSearchClick}
    {onPrimaryAction}
  />

  <!-- Main Content Container -->
  <div class="w-full lg:flex-1 min-w-0 flex flex-col h-full">
    <main
      class="flex-1 pb-20 lg:pb-0 bg-background max-w-2xl 2xl:max-w-3xl w-full mx-auto border-x border-border min-h-screen"
    >
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

      {@render children()}
    </main>
  </div>

  <!-- Right Sidebar - Widgets -->
  {#if layoutStore.rightSidebarVisible}
    <aside class="hidden xl:block w-80 border-l border-border fixed top-0 right-0 bottom-0 overflow-y-auto">
      <div class="flex flex-col divide-border divide-y">
        {#if sidebarStore.rightSidebar}
          {@render sidebarStore.rightSidebar()}
        {:else}
          <!-- New Members Widget -->
          <NewMembersWidget />

          <!-- Recent Articles Widget -->
          <div class="p-4">
            <div class="flex items-center gap-2 mb-4">
              <svg
                class="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 class="text-lg font-semibold text-card-foreground">
                {$t("feed.mediaTypes.articles")}
              </h2>
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
        {/if}
      </div>
    </aside>
  {/if}
</div>
