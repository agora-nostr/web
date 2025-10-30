import type { Meta, StoryObj } from '@storybook/svelte';
import ArticlePreviewCard from './ArticlePreviewCard.svelte';
import { ndk } from '$lib/ndk.svelte';
import { NDKKind } from '@nostr-dev-kit/ndk';

const meta = {
  title: 'Components/Articles/ArticlePreviewCard',
  component: ArticlePreviewCard as any,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Fetch a single article for display
export const Default: Story = {
  render: () => {
    const articlesSubscription = ndk.$subscribe(() => ({
      filters: [{ kinds: [NDKKind.Article], limit: 1 }],
      closeOnEose: false,
    }));

    const article = articlesSubscription.events?.[0];

    return {
      Component: ArticlePreviewCard,
      props: {
        article: article || undefined,
        variant: 'default',
      },
    } as any;
  },
};

export const Compact: Story = {
  render: () => {
    const articlesSubscription = ndk.$subscribe(() => ({
      filters: [{ kinds: [NDKKind.Article], limit: 1 }],
      closeOnEose: false,
    }));

    const article = articlesSubscription.events?.[0];

    return {
      Component: ArticlePreviewCard,
      props: {
        article: article || undefined,
        variant: 'compact',
      },
    } as any;
  },
};

// Show multiple cards in different variants
export const Comparison: Story = {
  render: () => {
    const articlesSubscription = ndk.$subscribe(() => ({
      filters: [{ kinds: [NDKKind.Article], limit: 3 }],
      closeOnEose: false,
    }));

    const articles = articlesSubscription.events || [];

    return {
      Component: ArticlePreviewCard,
      props: {
        article: articles[0] || undefined,
      },
    } as any;
  },
};
