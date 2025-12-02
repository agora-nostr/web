<script lang="ts">
  import { NDKBlossom } from '@nostr-dev-kit/blossom';
  import { createBlossomUpload } from '@nostr-dev-kit/svelte';
  import { ndk } from '$lib/ndk.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { Button } from '$lib/components/ui/button';
  import { browser } from '$app/environment';

  export interface UploadedImage {
    url: string;
    mimeType: string;
    hash: string;
    blurhash?: string;
    dimensions?: { width: number; height: number };
  }

  interface Props {
    images?: UploadedImage[];
    currentIndex?: number;
    disabled?: boolean;
    autoOpenOnMobile?: boolean;
  }

  let {
    images = $bindable([]),
    currentIndex = $bindable(0),
    disabled = false,
    autoOpenOnMobile = false
  }: Props = $props();

  let fileInput: HTMLInputElement;
  let isDragging = $state(false);

  const blossom = new NDKBlossom(ndk);
  const upload = createBlossomUpload(blossom);
  const isMobile = $derived(browser && window.innerWidth < 768);

  $effect(() => {
    if (autoOpenOnMobile && isMobile && images.length === 0 && fileInput) {
      setTimeout(() => {
        fileInput?.click();
      }, 300);
    }
  });

  async function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      await upload.upload(file, {
        fallbackServer: 'https://blossom.primal.net'
      });

      if (upload.result?.url) {
        const img = new Image();
        const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.src = URL.createObjectURL(file);
        });

        images = [...images, {
          url: upload.result.url,
          mimeType: file.type,
          hash: Array.isArray(upload.result.sha256) ? upload.result.sha256[0] : (upload.result.sha256 || ''),
          blurhash: upload.result.blurhash,
          dimensions
        }];

        currentIndex = images.length - 1;
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image');
    }
  }

  function handleFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files) {
      Array.from(files).forEach(file => handleFileSelect(file));
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;

    const files = event.dataTransfer?.files;
    if (files) {
      Array.from(files).forEach(file => handleFileSelect(file));
    }
  }

  function triggerFileInput() {
    fileInput?.click();
  }

  function removeImage(index: number) {
    images = images.filter((_, i) => i !== index);
    if (currentIndex >= images.length) {
      currentIndex = Math.max(0, images.length - 1);
    }
  }
</script>

<input
  bind:this={fileInput}
  type="file"
  accept="image/*"
  multiple
  onchange={handleFileInputChange}
  class="hidden"
/>

{#if images.length > 0}
  <div class="md:grid md:grid-cols-[2fr,3fr] md:h-full">
    <div class="md:border-r border-border md:p-6 p-0">
      <!-- Main Image Preview -->
      <div class="relative w-full md:aspect-square md:rounded-lg overflow-hidden bg-black">
        <img
          src={images[currentIndex].url}
          alt="Image {currentIndex + 1}"
          class="w-full h-full object-contain"
        />
        <button
          onclick={() => removeImage(currentIndex)}
          {disabled}
          title="Remove this image"
          class="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors backdrop-blur-sm"
          aria-label="Remove image"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {#if images.length > 1}
          <div class="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
            {#each images as _, index}
              <button
                onclick={() => currentIndex = index}
                {disabled}
                title="View image {index + 1}"
                class="w-2 h-2 rounded-full transition-all {currentIndex === index ? 'bg-white w-6' : 'bg-white/50'}"
                aria-label="View image {index + 1}"
              ></button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Thumbnail Navigation (desktop only) -->
      <div class="hidden md:flex items-center gap-2 overflow-x-auto pb-2 mt-4">
        {#each images as img, index}
          <button
            onclick={() => currentIndex = index}
            {disabled}
            title="View image {index + 1}"
            class="w-16 h-16 rounded border-2 transition-all flex-shrink-0 {currentIndex === index ? 'border-primary' : 'border-border'}"
            aria-label="View image {index + 1}"
          >
            <img src={img.url} alt="" class="w-full h-full object-cover rounded" />
          </button>
        {/each}

        <button
          onclick={triggerFileInput}
          {disabled}
          title="Add more images"
          class="w-16 h-16 rounded border-2 border-dashed border-border hover:border-primary hover:bg-muted transition-all flex items-center justify-center flex-shrink-0"
          aria-label="Add more images"
        >
          <svg class="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>

    <slot {triggerFileInput} />
  </div>
{:else}
  <!-- Desktop: Show dropzone when no images -->
  <div class="hidden md:flex items-center justify-center p-12 h-full">
    <div
      role="button"
      tabindex="0"
      onclick={triggerFileInput}
      onkeydown={(e) => e.key === 'Enter' && triggerFileInput()}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      ondrop={handleDrop}
      class="w-full max-w-md aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-muted/50 transition-all flex flex-col items-center justify-center cursor-pointer {isDragging ? 'border-primary bg-muted/50' : ''} {upload.status === 'uploading' ? 'pointer-events-none' : ''}"
    >
      {#if upload.status === 'uploading'}
        <div class="flex flex-col items-center gap-2">
          <div class="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin"></div>
          {#if upload.progress}
            <p class="text-sm text-muted-foreground">{upload.progress.percentage}%</p>
          {/if}
        </div>
      {:else}
        <svg class="w-16 h-16 text-muted-foreground mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-lg font-medium text-foreground mb-2">Drop images here</p>
        <p class="text-sm text-muted-foreground">or click to browse</p>
        <p class="text-xs text-muted-foreground mt-2">Multiple images supported</p>
      {/if}
    </div>
  </div>

  <!-- Mobile: Show loading or prompt to select from camera roll -->
  <div class="md:hidden flex items-center justify-center p-8 h-full min-h-[60vh]">
    <div class="text-center">
      {#if upload.status === 'uploading'}
        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin"></div>
          <p class="text-sm text-muted-foreground">Uploading...</p>
          {#if upload.progress}
            <p class="text-xs text-muted-foreground">{upload.progress.percentage}%</p>
          {/if}
        </div>
      {:else}
        <svg class="w-16 h-16 text-muted-foreground mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-muted-foreground mb-4">No images selected</p>
        <Button onclick={triggerFileInput}>
          Choose Photos
        </Button>
      {/if}
    </div>
  </div>
{/if}
