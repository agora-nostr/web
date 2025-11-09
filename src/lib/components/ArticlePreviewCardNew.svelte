<script lang="ts">
  import type { NDKArticle } from '@nostr-dev-kit/ndk';
  import { ndk } from '$lib/ndk.svelte';
  import { getArticleUrl } from '$lib/utils/articleUrl';

  // Import registry components based on variant
  import ArticleCardMedium from '$lib/ndk/components/article/cards/basic/article-card-medium.svelte';
  import ArticleCardHero from '$lib/ndk/components/article/cards/hero/article-card-hero.svelte';
  import ArticleCardPortrait from '$lib/ndk/components/article/cards/portrait/article-card-portrait.svelte';

  interface Props {
    article: NDKArticle;
    variant?: 'default' | 'compact' | 'hero' | 'portrait';
  }

  let { article, variant = 'default' }: Props = $props();

  // Handle click to navigate to article
  function handleClick(e: MouseEvent) {
    e.preventDefault();
    const author = article.author;
    const articleUrl = getArticleUrl(article, author);
    window.location.href = articleUrl;
  }
</script>

{#if variant === 'hero'}
  <ArticleCardHero
    {ndk}
    {article}
    onclick={handleClick}
    height="h-96"
    class="mb-6"
  />
{:else if variant === 'portrait'}
  <ArticleCardPortrait
    {ndk}
    {article}
    onclick={handleClick}
    class="hover:shadow-lg transition-shadow"
  />
{:else}
  <!-- Default and compact use medium variant with different image sizes -->
  <ArticleCardMedium
    {ndk}
    {article}
    imageSize={variant === 'compact' ? 'small' : 'medium'}
    onclick={handleClick}
    class="hover:bg-accent/50 transition-colors"
  />
{/if}