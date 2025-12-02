<script lang="ts">
  import type { NDKArticle, NDKEvent } from '@nostr-dev-kit/ndk';
  import { NDKBlossom } from '@nostr-dev-kit/blossom';
  import { createBlossomUpload } from '@nostr-dev-kit/svelte';
  import { ndk } from '$lib/ndk.svelte';
  import User from '$lib/components/User.svelte';
  import { Button } from '$lib/components/ui/button';
  import { toast } from '$lib/stores/toast.svelte';
  import UserSelector from '$lib/components/UserSelector.svelte';

  interface Props {
    article: NDKArticle;
    onError: (error: string) => void;
  }

  let { article, onError }: Props = $props();

  let replyContent = $state('');
  let isSubmitting = $state(false);
  let isFocused = $state(false);
  let textareaElement: HTMLTextAreaElement | undefined = $state();
  let fileInput: HTMLInputElement | undefined = $state();
  let selectedMentions = $state<string[]>([]);

  const blossom = new NDKBlossom(ndk);
  const upload = createBlossomUpload(blossom);
  let isUploading = $state(false);

  const hasContent = $derived(replyContent.trim().length > 0);

  async function handleCommentPublish() {
    if (!ndk.$currentUser || !replyContent.trim()) return;

    isSubmitting = true;
    try {
      const replyEvent = article.reply();
      replyEvent.content = replyContent;
      await replyEvent.publish();

      if (replyEvent.publishStatus === 'error') {
        const error = replyEvent.publishError;
        const relayErrors = (error as any)?.relayErrors || {};
        const errorMessages = Object.entries(relayErrors)
          .map(([relay, err]) => `${relay}: ${err}`)
          .join('\n');
        onError(`Failed to publish:\n${errorMessages || 'Unknown error'}`);
        return;
      }

      replyContent = '';
      isFocused = false;
      selectedMentions = [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish comment';
      onError(errorMessage);
    } finally {
      isSubmitting = false;
    }
  }

  function handleFocus() {
    isFocused = true;
  }

  function handleBlur() {
    setTimeout(() => {
      if (!replyContent.trim()) {
        isFocused = false;
      }
    }, 100);
  }

  function handleInput() {
    if (!textareaElement) return;
    textareaElement.style.height = 'auto';
    const newHeight = Math.min(150, Math.max(20, textareaElement.scrollHeight));
    textareaElement.style.height = newHeight + 'px';
  }

  async function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    isUploading = true;
    try {
      await upload.upload(file, {
        fallbackServer: 'https://blossom.primal.net'
      });

      if (upload.result?.url) {
        insertImageUrl(upload.result.url);
        toast.success('Image uploaded');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      isUploading = false;
    }
  }

  function insertImageUrl(url: string) {
    const textarea = textareaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const imageMarkdown = `\n${url}\n`;

    replyContent = replyContent.slice(0, start) + imageMarkdown + replyContent.slice(end);

    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length;
      textarea.focus();
      handleInput();
    }, 0);
  }

  function handleFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    input.value = '';
  }

  function triggerFileInput() {
    fileInput?.click();
  }
</script>

{#if ndk.$currentUser}
  <div class="mb-8">
    <div class="flex gap-2.5 items-end max-md:items-start">
      <User
        pubkey={ndk.$currentUser.pubkey}
        variant="avatar"
        avatarSize={isFocused ? 'w-9 h-9' : 'w-8 h-8'}
        class="transition-all duration-300 max-md:mt-0.5"
      />
      <div class="flex-1 flex flex-col gap-2">
        <div class="bg-neutral-50 dark:bg-card border border rounded-[18px] {isFocused ? 'rounded-[14px] p-3' : 'py-2.5 px-3.5'} transition-all duration-300 {isFocused ? 'border-neutral-300 dark:border-neutral-700' : 'border-neutral-200 dark:border-neutral-800'} flex {isFocused ? 'flex-col' : 'items-center'} gap-2">
          <input bind:this={fileInput} type="file" accept="image/*" onchange={handleFileInputChange} class="hidden" />

          <textarea
            bind:this={textareaElement}
            bind:value={replyContent}
            onfocus={handleFocus}
            onblur={handleBlur}
            oninput={handleInput}
            disabled={isSubmitting}
            placeholder="Share your thoughts..."
            class="w-full bg-transparent text-foreground placeholder-neutral-500 resize-none focus:outline-none text-[15px] leading-[1.4] transition-all duration-300 {isFocused ? 'max-h-[150px]' : 'max-h-9'} overflow-hidden"
            rows="1"
          ></textarea>

          {#if hasContent && !isFocused}
            <button
              type="button"
              onclick={handleCommentPublish}
              disabled={isSubmitting}
              aria-label="Publish comment"
              class="w-7 h-7 bg-accent text-white rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-90"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          {/if}

          {#if isFocused}
            <div class="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800 opacity-100 transition-opacity duration-200">
              <div class="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onclick={triggerFileInput}
                  disabled={isSubmitting || isUploading}
                  class="h-8 w-8"
                >
                  <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </Button>
                <UserSelector
                  bind:selectedPubkeys={selectedMentions}
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="button"
                onclick={handleCommentPublish}
                disabled={!hasContent || isSubmitting}
                class="px-[18px] py-2 bg-accent text-white rounded-[18px] font-semibold text-[14px] transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Posting...' : 'Comment'}
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
