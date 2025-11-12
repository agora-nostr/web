<script lang="ts">
  import { marked } from 'marked';
  import type { NDKEvent } from '@nostr-dev-kit/ndk';
  import { User } from '$lib/ndk/ui/user';
  import { ndk } from '$lib/ndk.svelte';
  import { SvelteMap } from 'svelte/reactivity';

  interface Props {
    content: string;
    emojiTags?: string[][];
    highlights?: NDKEvent[];
    onTextSelected?: (text: string, range: Range) => void;
    onHighlightClick?: (highlight: NDKEvent) => void;
  }

  let { content, emojiTags, highlights = [], onTextSelected, onHighlightClick }: Props = $props();

  let contentElement = $state<HTMLDivElement>();
  let avatarData = $state<Array<{ pubkey: string; top: number; right: string }>>([]);

  const hasMarkdown = $derived.by(() => {
    const markdownPatterns = [
      /^#{1,6}\s/m,
      /\*\*[^*]+\*\*/,
      /\*[^*]+\*/,
      /\[([^\]]+)\]\([^)]+\)/,
      /^[-*+]\s/m,
      /^>\s/m,
      /```[\s\S]*?```/,
      /^\d+\.\s/m,
    ];
    return markdownPatterns.some(pattern => pattern.test(content));
  });

  const htmlContent = $derived.by(() => {
    if (hasMarkdown) {
      return marked.parse(content, { async: false }) as string;
    }
    return content;
  });

  function handleMouseUp() {
    if (!onTextSelected) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length === 0) return;

    // Check if selection is within the article content
    if (!contentElement?.contains(selection.anchorNode)) return;

    const range = selection.getRangeAt(0);
    onTextSelected(selectedText, range);
  }

  $effect(() => {
    if (contentElement && highlights.length > 0) {
      applyHighlights();
    }
  });

  // Recalculate avatar positions on resize
  $effect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      if (avatarData.length > 0) {
        // Re-run the avatar positioning logic
        addHighlightAvatars();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  function applyHighlights() {
    if (!contentElement) return;

    // Reset any existing highlights and avatars
    const existingMarks = contentElement.querySelectorAll('mark.nostr-highlight');
    existingMarks.forEach(mark => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });

    // Remove existing avatar containers
    const existingAvatars = contentElement.querySelectorAll('.highlight-avatar-container');
    existingAvatars.forEach(avatar => avatar.remove());

    // Apply each highlight
    highlights.forEach(highlight => {
      const highlightText = highlight.content.trim();
      if (!highlightText || !contentElement) return;

      try {
        highlightTextInElement(contentElement, highlightText, highlight);
      } catch (err) {
        console.warn('Failed to apply highlight:', err);
      }
    });

    // Add avatars after all highlights are applied
    addHighlightAvatars();
  }

  function highlightTextInElement(element: HTMLElement, searchText: string, highlightEvent: NDKEvent) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    const nodesToHighlight: { node: Text; offset: number }[] = [];
    let currentNode: Text | null;

    while ((currentNode = walker.nextNode() as Text | null)) {
      // Skip if parent is already a highlight
      if (currentNode.parentElement?.classList.contains('nostr-highlight')) continue;

      const text = currentNode.textContent || '';
      const index = text.indexOf(searchText);

      if (index !== -1) {
        nodesToHighlight.push({ node: currentNode, offset: index });
      }
    }

    // Apply highlights (do this after tree walk to avoid modifying while walking)
    nodesToHighlight.forEach(({ node, offset }) => {
      const text = node.textContent || '';
      const before = text.substring(0, offset);
      const highlighted = text.substring(offset, offset + searchText.length);
      const after = text.substring(offset + searchText.length);

      const mark = document.createElement('mark');
      mark.className = 'nostr-highlight';
      mark.dataset.pubkey = highlightEvent.pubkey;
      mark.dataset.highlightId = highlightEvent.id;
      mark.textContent = highlighted;

      // Add click handler if callback is provided
      if (onHighlightClick) {
        mark.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          onHighlightClick(highlightEvent);
        });
      }

      const parent = node.parentNode;
      if (parent) {
        if (before) parent.insertBefore(document.createTextNode(before), node);
        parent.insertBefore(mark, node);
        if (after) parent.insertBefore(document.createTextNode(after), node);
        parent.removeChild(node);
      }
    });
  }

  function addHighlightAvatars() {
    if (!contentElement) return;

    const marks = contentElement.querySelectorAll('mark.nostr-highlight');
    const containerRect = contentElement.getBoundingClientRect();

    // Group marks by their containing block element
    const blockMap = new SvelteMap<HTMLElement, Set<string>>();

    marks.forEach(mark => {
      // Find the containing block element (p, h1, h2, etc.)
      let block = mark.parentElement;
      while (block && block !== contentElement) {
        const tagName = block.tagName.toLowerCase();
        if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'div'].includes(tagName)) {
          break;
        }
        block = block.parentElement;
      }

      if (block && block !== contentElement) {
        const pubkey = (mark as HTMLElement).dataset.pubkey;
        if (pubkey) {
          if (!blockMap.has(block)) {
            blockMap.set(block, new Set());
          }
          blockMap.get(block)?.add(pubkey);
        }
      }
    });

    // Prepare avatar data for rendering with calculated positions
    const newAvatarData: Array<{ pubkey: string; top: number; right: string }> = [];

    blockMap.forEach((pubkeys, block) => {
      const blockRect = block.getBoundingClientRect();
      const topPosition = blockRect.top - containerRect.top;

      // Add avatar data for each pubkey
      Array.from(pubkeys).forEach((pubkey, position) => {
        newAvatarData.push({
          pubkey,
          top: topPosition + (position * 40), // Stack avatars vertically if multiple
          right: '-3rem'
        });
      });
    });

    avatarData = newAvatarData;
  }
</script>

<div class="article-wrapper">
  {#if hasMarkdown}
    <div
      bind:this={contentElement}
      onmouseup={handleMouseUp}
      role="article"
      class="article-content prose prose-lg dark:prose-invert max-w-none select-text"
    >
      {@html htmlContent}
    </div>
  {:else}
    <div
      bind:this={contentElement}
      onmouseup={handleMouseUp}
      role="article"
      class="article-content text-lg leading-[1.8] font-serif whitespace-pre-wrap select-text"
    >
      {content}
    </div>
  {/if}

  <!-- Floating avatars for highlights -->
  {#each avatarData as { pubkey, top, right }, index (pubkey + index)}
    <div
      class="highlight-avatar"
      style="position: absolute; top: {top}px; right: {right};"
    >
      <User.Root {ndk} {pubkey}>
        <User.Avatar class="w-8 h-8 rounded-full ring-2 ring-background shadow-lg" />
      </User.Root>
    </div>
  {/each}
</div>

<style>
  @reference "../../app.css";

  .article-wrapper {
    position: relative;
  }

  .highlight-avatar {
    pointer-events: auto;
    z-index: 10;
  }

  .highlight-avatar:hover {
    transform: scale(1.1);
    transition: transform 0.2s;
  }

  :global(.article-content) {
    color: hsl(var(--foreground));
  }

  :global(.article-content h1) {
    font-size: 1.875rem;
    font-weight: 700;
    margin-top: 3rem;
    margin-bottom: 1.5rem;
    font-family: var(--font-serif);
    color: hsl(var(--foreground));
  }

  @media (min-width: 640px) {
    :global(.article-content h1) {
      font-size: 2.25rem;
    }
  }

  :global(.article-content h2) {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 2.5rem;
    margin-bottom: 1.25rem;
    font-family: var(--font-serif);
    color: hsl(var(--foreground));
  }

  @media (min-width: 640px) {
    :global(.article-content h2) {
      font-size: 1.875rem;
    }
  }

  :global(.article-content h3) {
    font-size: 1.25rem;
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 1rem;
    font-family: var(--font-serif);
    color: hsl(var(--foreground));
  }

  @media (min-width: 640px) {
    :global(.article-content h3) {
      font-size: 1.5rem;
    }
  }

  :global(.article-content p) {
    font-size: 1.125rem;
    line-height: 1.8;
    margin-bottom: 1.5rem;
    font-family: var(--font-serif);
    color: hsl(var(--foreground));
  }

  :global(.article-content a) {
    color: oklch(0.55 0.2 250);
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.15s;
  }

  :global(.article-content a:hover) {
    color: oklch(0.45 0.2 250);
  }

  :global(.dark .article-content a) {
    color: oklch(0.7 0.15 250);
  }

  :global(.dark .article-content a:hover) {
    color: oklch(0.8 0.15 250);
  }

  :global(.article-content img) {
    width: 100%;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    margin-top: 2rem;
    margin-bottom: 2rem;
  }

  :global(.article-content ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-bottom: 1.5rem;
    font-size: 1.125rem;
    font-family: var(--font-serif);
    color: hsl(var(--foreground));
  }

  :global(.article-content ul > * + *) {
    margin-top: 0.5rem;
  }

  :global(.article-content ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin-bottom: 1.5rem;
    font-size: 1.125rem;
    font-family: var(--font-serif);
    color: hsl(var(--foreground));
  }

  :global(.article-content ol > * + *) {
    margin-top: 0.5rem;
  }

  :global(.article-content li) {
    line-height: 1.8;
  }

  :global(.article-content blockquote) {
    border-left: 4px solid;
    border-color: hsl(var(--border));
    padding-left: 1.5rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    font-style: italic;
    font-size: 1.25rem;
    font-family: var(--font-serif);
    line-height: 1.8;
    color: hsl(var(--muted-foreground));
  }

  :global(.article-content code) {
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    background-color: hsl(var(--muted));
    color: hsl(var(--foreground));
  }

  :global(.article-content pre) {
    margin-bottom: 1.5rem;
    overflow: hidden;
    border-radius: 0.5rem;
  }

  :global(.article-content pre code) {
    display: block;
    border: 1px solid;
    border-color: hsl(var(--border));
    border-radius: 0.5rem;
    padding: 1rem;
    overflow-x: auto;
    font-size: 0.875rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    line-height: 1.625;
    background-color: hsl(var(--background));
  }

  :global(.article-content hr) {
    margin-top: 3rem;
    margin-bottom: 3rem;
    border-top: 1px solid;
    border-color: hsl(var(--border));
  }

  :global(.article-content strong) {
    font-weight: 700;
    color: hsl(var(--foreground));
  }

  :global(.article-content em) {
    font-style: italic;
  }

  /* Nostr highlight styles */
  :global(mark.nostr-highlight) {
    background-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
    border-bottom: 2px solid color-mix(in srgb, var(--color-primary) 60%, transparent);
    color: hsl(var(--foreground));
    transition: all 0.2s;
    cursor: pointer;
    padding: 0.125rem 0;
    pointer-events: auto;
    user-select: none;
  }

  :global(mark.nostr-highlight:hover) {
    background-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
    border-bottom-color: var(--color-primary);
  }
</style>
