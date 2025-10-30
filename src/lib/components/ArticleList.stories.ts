import type { Meta, StoryObj } from '@storybook/svelte';
import ArticleList from './ArticleList.svelte';
import { ndk } from '$lib/ndk.svelte';
import { NDKKind, type NDKArticle } from '@nostr-dev-kit/ndk';

const meta = {
  title: 'Components/Articles/ArticleList',
  component: ArticleList as any,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const RecentArticles: Story = {
  args: {
    articles: [],
  },
  render: () => {
    const articlesSubscription = ndk.$subscribe(() => ({
      filters: [{ kinds: [NDKKind.Article], limit: 10 }],
      closeOnEose: false,
    }));

    return {
      Component: ArticleList,
      props: {
        articles: (articlesSubscription.events || []) as NDKArticle[],
      },
    } as any;
  },
};

export const Empty: Story = {
  args: {
    articles: [],
    emptyMessage: 'No articles found',
  },
};

export const CustomEmptyMessage: Story = {
  args: {
    articles: [],
    emptyMessage: 'Start writing your first article!',
  },
};

// Fetch articles from specific authors
export const FromSpecificAuthors: Story = {
  args: {
    articles: [],
  },
  render: () => {
    const articlesSubscription = ndk.$subscribe(() => ({
      filters: [{
        kinds: [NDKKind.Article],
        authors: [
          'fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52',
          '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2',
        ],
        limit: 20
      }],
      closeOnEose: false,
    }));

    return {
      Component: ArticleList,
      props: {
        articles: (articlesSubscription.events || []) as NDKArticle[],
      },
    } as any;
  },
};

// Fetch articles with specific hashtag
export const WithHashtag: Story = {
  args: {
    articles: [],
  },
  render: () => {
    const articlesSubscription = ndk.$subscribe(() => ({
      filters: [{
        kinds: [NDKKind.Article],
        '#t': ['nostr'],
        limit: 10
      }],
      closeOnEose: false,
    }));

    return {
      Component: ArticleList,
      props: {
        articles: (articlesSubscription.events || []) as NDKArticle[],
      },
    } as any;
  },
};
