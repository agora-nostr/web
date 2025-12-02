<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { ndk } from "$lib/ndk.svelte";
  import { layoutMode } from "$lib/stores/layoutMode.svelte";
  import CommentSection from "$lib/components/CommentSection.svelte";
  import HighlightCard from "$lib/ndk/components/highlight-card-feed/highlight-card-feed.svelte";
  import { NDKArticle } from "@nostr-dev-kit/ndk";
  import type { NDKEvent } from "@nostr-dev-kit/ndk";
  import { ArticleContent } from "$lib/ndk/components/article-content";
  import ArticleCardHero from "$lib/ndk/components/article-card-hero/article-card-hero.svelte";
  import { createFetchEvent } from "@nostr-dev-kit/svelte";

  let error = $state<string | null>(null);
  let showShareMenu = $state(false);
  let copied = $state(false);
  let userError = $state<string | null>(null);
  let selectedHighlight = $state<NDKEvent | null>(null);

  const naddr = $derived($page.params.naddr);

  let articleFetch = createFetchEvent(ndk, () => ({ bech32: naddr, type: 'bech32' }));
  let article = $derived.by(() => {
    if (!articleFetch.event) return null;

    return NDKArticle.from(articleFetch.event);
  });

  function closeDrawer() {
    selectedHighlight = null;
  }

  function handleCopyIdentifier() {
    if (!article) return;

    const identifier = article.encode();
    navigator.clipboard.writeText(identifier);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  function handleShare(platform: string) {
    if (!article) return;

    const title = encodeURIComponent(article.title || "Check out this article");
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(
      `${article.title} by ${article.author.profile?.name || "Anonymous"}`,
    );

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }

    showShareMenu = false;
  }

  function goBack() {
    window.history.back();
  }

  $effect(() => {
    layoutMode.setArticleMode();

    return () => {
      layoutMode.reset();
    };
  });
</script>

{#if !article}
  <div class="flex flex-col items-center justify-center min-h-screen">
    <div
      class="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"
    ></div>
    <p class="mt-4 text-muted-foreground">Loading article...</p>
  </div>
{:else if error || !article}
  <div class="flex flex-col items-center justify-center min-h-screen px-4">
    <h1 class="text-2xl font-bold text-foreground mb-2">Article Not Found</h1>
    <p class="text-muted-foreground mb-4">
      {error || "The article could not be loaded."}
    </p>
    <button
      type="button"
      onclick={() => goto("/")}
      class="px-4 py-2 dark:bg-white text-foreground dark:text-black rounded-full hover:bg-muted dark:hover:bg-neutral-100 transition-colors text-sm font-medium"
    >
      Go Home
    </button>
  </div>
{:else}
  <div class="article-container relative">
    <!-- Header -->
    <div class="absolute left-0 right-0 top-0">
      <header class="article-header">
        <button class="back-btn" aria-label="Go back" onclick={goBack}>
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1>{article.title || "Article"}</h1>
        <div class="article-actions">
          <div class="relative">
            <button
              type="button"
              aria-label="Share article"
              onclick={() => (showShareMenu = !showShareMenu)}
              class="action-btn"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>

            {#if showShareMenu}
              <div class="share-menu">
                <button
                  type="button"
                  onclick={() => handleShare("twitter")}
                  class="share-menu-item"
                >
                  Share on X
                </button>
                <button
                  type="button"
                  onclick={() => handleShare("facebook")}
                  class="share-menu-item"
                >
                  Share on Facebook
                </button>
                <button
                  type="button"
                  onclick={() => handleShare("linkedin")}
                  class="share-menu-item"
                >
                  Share on LinkedIn
                </button>
              </div>
            {/if}
          </div>

          <button
            type="button"
            onclick={handleCopyIdentifier}
            class="action-btn"
          >
            {#if copied}
              <svg
                class="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            {:else}
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            {/if}
          </button>
        </div>
      </header>
    </div>

    <!-- Content -->

    <ArticleCardHero {ndk} event={article} />

    <main class="article-main">
      <article class="article-content">
        {#if userError}
          <div class="error-banner">
            <p>{userError}</p>
            <button type="button" aria-label="Dismiss error" onclick={() => (userError = null)}>
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        {/if}

        <ArticleContent {article} />
      </article>

      <div class="comments-section">
        <CommentSection {article} onError={(err) => (userError = err)} />
      </div>
    </main>
  </div>

  <!-- Highlight Drawer -->
  {#if selectedHighlight}
    <!-- Backdrop -->
    <div
      class="drawer-backdrop"
      onclick={closeDrawer}
      onkeydown={(e) => e.key === 'Enter' || e.key === ' ' ? closeDrawer() : null}
      role="button"
      tabindex="0"
      aria-label="Close drawer"
    ></div>

    <!-- Drawer -->
    <div class="drawer">
      <div class="drawer-header">
        <h2 class="drawer-title">Highlight</h2>
        <button
          type="button"
          onclick={closeDrawer}
          class="drawer-close-btn"
          aria-label="Close"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div class="drawer-content">
        <HighlightCard {ndk} event={selectedHighlight} />
      </div>
    </div>
  {/if}
{/if}

<style>
  .article-container {
    width: 100%;
    min-height: 100vh;
    background: var(--color-card);
  }

  .article-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-background);
    width: 100%;
    z-index: 10;
  }

  .back-btn {
    padding: 0.5rem;
    background: transparent;
    border: none;
    color: var(--color-foreground);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    border-radius: 8px;
    flex-shrink: 0;
  }

  .back-btn:hover {
    background: var(--color-muted);
  }

  .back-btn svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  .article-header h1 {
    font-size: 1.125rem;
    font-weight: 700;
    margin: 0;
    color: var(--color-foreground);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .article-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .action-btn {
    padding: 0.5rem;
    background: transparent;
    border: none;
    color: var(--color-muted-foreground);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    border-radius: 8px;
  }

  .action-btn:hover {
    background: var(--color-muted);
    color: var(--color-foreground);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .share-menu {
    position: absolute;
    right: 0;
    top: calc(100% + 0.5rem);
    min-width: 12rem;
    background: var(--color-popover);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .share-menu-item {
    width: 100%;
    padding: 0.75rem 1rem;
    text-align: left;
    background: transparent;
    border: none;
    color: var(--color-foreground);
    cursor: pointer;
    transition: background 0.2s;
    font-size: 0.875rem;
  }

  .share-menu-item:hover {
    background: var(--color-muted);
  }

  .article-main {
    padding: 2rem 0;
  }

  .article-content {
    max-width: 48rem;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    background: var(--color-card);
    border-radius: 0.75rem;
  }

  .error-banner {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--color-destructive);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
  }

  .error-banner p {
    margin: 0;
    color: var(--color-foreground);
  }

  .error-banner button {
    background: transparent;
    border: none;
    color: var(--color-foreground);
    cursor: pointer;
    padding: 0;
    transition: opacity 0.2s;
  }

  .error-banner button:hover {
    opacity: 0.7;
  }

  .comments-section {
    max-width: 48rem;
    margin: 4rem auto 0;
    padding: 0 1.5rem;
  }

  /* Drawer styles */
  .drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 40;
    animation: fadeIn 0.2s ease-out;
  }

  .drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 90%;
    max-width: 500px;
    background: var(--color-background);
    z-index: 50;
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    animation: slideInRight 0.3s ease-out;
  }

  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
  }

  .drawer-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-foreground);
    margin: 0;
  }

  .drawer-close-btn {
    padding: 0.5rem;
    background: transparent;
    border: none;
    color: var(--color-muted-foreground);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;
    transition: all 0.2s;
  }

  .drawer-close-btn:hover {
    background: var(--color-muted);
    color: var(--color-foreground);
  }

  .drawer-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @media (max-width: 640px) {
    .article-header h1 {
      font-size: 1rem;
    }

    .article-actions {
      gap: 0.25rem;
    }

    .action-btn {
      padding: 0.375rem;
    }

    .article-content {
      padding: 1.5rem 1rem;
    }

    .drawer {
      width: 100%;
      max-width: none;
    }
  }
</style>
