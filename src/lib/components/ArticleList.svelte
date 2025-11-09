<script lang="ts">
  import type { NDKArticle } from '@nostr-dev-kit/ndk';
  import ArticlePreviewCard from './ArticlePreviewCardNew.svelte';
  import EmptyState from './EmptyState.svelte';

  interface Props {
    articles: NDKArticle[];
    emptyMessage?: string;
  }

  const { articles, emptyMessage = 'No articles yet' }: Props = $props();
</script>

{#if articles.length === 0}
  <EmptyState icon="article" title={emptyMessage} />
{:else}
  <div class="divide-y divide-neutral-800/50">
    {#each articles as article (article.id)}
      <ArticlePreviewCard {article} />
    {/each}
  </div>
{/if}
