<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import { NDKClassified, NDKKind } from '@nostr-dev-kit/ndk';
  import { toast } from '$lib/stores/toast.svelte';
  import { goto } from '$app/navigation';
  import { MediaQuery } from 'svelte/reactivity';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Drawer from '$lib/components/ui/drawer';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { useImageUpload } from '$lib/composables/useImageUpload.svelte';

  const isDesktop = new MediaQuery('(min-width: 768px)');

  interface Props {
    open?: boolean;
    onClose?: () => void;
  }

  let { open = $bindable(false), onClose }: Props = $props();

  let isPublishing = $state(false);

  // Form fields
  let title = $state('');
  let summary = $state('');
  let content = $state('');
  let location = $state('');
  let priceAmount = $state('');
  let priceCurrency = $state('USD');
  let priceFrequency = $state<string | undefined>(undefined);
  let categories = $state<string[]>([]);
  let newCategory = $state('');

  // Image upload using blossom
  const imageUpload = useImageUpload(ndk, {
    fallbackServer: 'https://blossom.primal.net'
  });

  let fileInput: HTMLInputElement;

  const COMMON_CATEGORIES = [
    'electronics',
    'furniture',
    'clothing',
    'books',
    'services',
    'vehicles',
    'real-estate',
    'jobs',
    'free',
    'wanted'
  ];

  const CURRENCIES = ['USD', 'EUR', 'GBP', 'BTC', 'SATS'];

  function addCategory() {
    if (newCategory && !categories.includes(newCategory.toLowerCase())) {
      categories = [...categories, newCategory.toLowerCase()];
      newCategory = '';
    }
  }

  function removeCategory(category: string) {
    categories = categories.filter(c => c !== category);
  }

  async function publishListing() {
    if (!title.trim() || !content.trim() || isPublishing) {
      toast.error('Please provide a title and description');
      return;
    }

    if (!ndk.$currentUser) {
      toast.error('Please log in to create a listing');
      return;
    }

    try {
      isPublishing = true;

      const listing = new NDKClassified(ndk);
      listing.title = title.trim();
      listing.summary = summary.trim() || undefined;
      listing.content = content.trim();
      listing.location = location.trim() || undefined;
      listing.published_at = Math.floor(Date.now() / 1000);

      // Add status tag
      listing.tags.push(['status', 'active']);

      // Add price if provided
      if (priceAmount.trim()) {
        listing.price = {
          amount: parseFloat(priceAmount),
          currency: priceCurrency,
          frequency: priceFrequency && priceFrequency !== 'once' ? priceFrequency : undefined
        };
      }

      // Add categories as hashtags
      categories.forEach(category => {
        listing.tags.push(['t', category]);
      });

      // Add images from blossom uploads
      imageUpload.uploadedImages.forEach(image => {
        listing.tags.push(['image', image.url]);
      });

      await listing.sign();
      await listing.publish();

      if (listing.publishStatus === 'error') {
        const error = listing.publishError;
        const relayErrors = (error as any)?.relayErrors || {};
        const errorMessages = Object.entries(relayErrors)
          .map(([relay, err]) => `${relay}: ${err}`)
          .join('\n');
        toast.error(`Failed to publish:\n${errorMessages || 'Unknown error'}`);
        return;
      }

      toast.success('Listing created successfully');
      resetForm();
      open = false;
      onClose?.();

      // Navigate to marketplace
      goto('/marketplace');
    } catch (error) {
      console.error('Failed to publish listing:', error);
      toast.error(`Failed to create listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      isPublishing = false;
    }
  }

  function resetForm() {
    title = '';
    summary = '';
    content = '';
    location = '';
    priceAmount = '';
    priceCurrency = 'USD';
    priceFrequency = undefined;
    categories = [];
    newCategory = '';
    imageUpload.reset();
  }

  function handleClose() {
    if (!isPublishing) {
      resetForm();
      open = false;
      onClose?.();
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && !isPublishing) {
      handleClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isDesktop.current}
  <Dialog.Root {open} onOpenChange={(newOpen) => {
      open = newOpen;
      if (!newOpen) handleClose();
    }}>
    <Dialog.Content class="max-w-4xl max-h-[90vh] overflow-y-auto">
      <Dialog.Header>
        <div class="flex items-center gap-2">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <Dialog.Title>Create Listing</Dialog.Title>
        </div>
      </Dialog.Header>

      <div class="space-y-6">
          <!-- Basic Details -->
          <div class="space-y-5">
            <div>
              <Label for="title">
                Title <span class="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                bind:value={title}
                placeholder="What are you listing?"
                maxlength={200}
                class="mt-2"
              />
            </div>

            <div>
              <Label for="summary">Summary</Label>
              <Input
                id="summary"
                type="text"
                bind:value={summary}
                placeholder="Brief description"
                maxlength={200}
                class="mt-2"
              />
            </div>

            <div>
              <Label for="content">
                Description <span class="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                bind:value={content}
                placeholder="Detailed description (Markdown supported)"
                rows={6}
                class="mt-2 resize-none"
              />
            </div>

            <div>
              <Label for="location">Location</Label>
              <Input
                id="location"
                type="text"
                bind:value={location}
                placeholder="City, State or Country"
                class="mt-2"
              />
            </div>
          </div>

          <!-- Pricing -->
          <div class="bg-muted/30 rounded-lg p-5 border border-border">
            <h3 class="text-lg font-semibold text-foreground mb-4">Pricing</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label for="price-amount">Amount</Label>
                <Input
                  id="price-amount"
                  type="text"
                  bind:value={priceAmount}
                  placeholder="0.00"
                  class="mt-2"
                />
              </div>

              <div>
                <Label for="currency">Currency</Label>
                <select
                  id="currency"
                  bind:value={priceCurrency}
                  class="mt-2 w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  {#each CURRENCIES as currency}
                    <option value={currency}>{currency}</option>
                  {/each}
                </select>
              </div>

              <div>
                <Label for="frequency">Frequency</Label>
                <select
                  id="frequency"
                  bind:value={priceFrequency}
                  class="mt-2 w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value={undefined}>One time</option>
                  <option value="hour">Per hour</option>
                  <option value="day">Per day</option>
                  <option value="week">Per week</option>
                  <option value="month">Per month</option>
                  <option value="year">Per year</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Categories -->
          <div class="bg-muted/30 rounded-lg p-5 border border-border">
            <h3 class="text-lg font-semibold text-foreground mb-4">Categories</h3>
            <div class="space-y-4">
              <div class="flex gap-2">
                <select
                  bind:value={newCategory}
                  class="flex-1 px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Select a category</option>
                  {#each COMMON_CATEGORIES as cat}
                    <option value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  {/each}
                </select>
                <Input
                  type="text"
                  bind:value={newCategory}
                  placeholder="Or type custom"
                  class="flex-1"
                  onkeydown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCategory();
                    }
                  }}
                />
                <Button
                  type="button"
                  onclick={addCategory}
                  size="icon"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </Button>
              </div>

              {#if categories.length > 0}
                <div class="flex flex-wrap gap-2">
                  {#each categories as category}
                    <div class="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                      <span>{category}</span>
                      <button
                        type="button"
                        onclick={() => removeCategory(category)}
                        class="hover:text-primary"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <!-- Images -->
          <div class="bg-muted/30 rounded-lg p-5 border border-border">
            <h3 class="text-lg font-semibold text-foreground mb-4">Images</h3>
            <div class="space-y-4">
              <!-- File input -->
              <input
                bind:this={fileInput}
                type="file"
                accept="image/*"
                multiple
                onchange={imageUpload.handleFileInputChange}
                class="hidden"
              />

              <!-- Upload area -->
              <button
                type="button"
                onclick={() => fileInput?.click()}
                ondragover={imageUpload.handleDragOver}
                ondragleave={imageUpload.handleDragLeave}
                ondrop={imageUpload.handleDrop}
                disabled={imageUpload.uploadStatus === 'uploading'}
                class={`w-full h-32 rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 ${imageUpload.isDragging ? 'border-primary bg-muted/40' : 'border-border hover:border-primary bg-muted/20 hover:bg-muted/40'}`}
              >
                {#if imageUpload.uploadStatus === 'uploading'}
                  <div class="flex flex-col items-center gap-2">
                    <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-sm text-muted-foreground">{imageUpload.uploadProgress?.percentage || 0}%</span>
                  </div>
                {:else}
                  <svg class="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span class="text-sm text-muted-foreground">Click to upload or drag and drop</span>
                  <span class="text-xs text-muted-foreground">Multiple images supported</span>
                {/if}
              </button>

              <!-- Uploaded images grid -->
              {#if imageUpload.uploadedImages.length > 0}
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {#each imageUpload.uploadedImages as image, index}
                    <div class="relative group">
                      <img
                        src={image.url}
                        alt={`Listing image ${index + 1}`}
                        class="w-full h-32 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onclick={() => imageUpload.removeImage(index)}
                        class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>

      <Dialog.Footer class="flex gap-3 sm:space-x-0">
        <Button
          variant="outline"
          onclick={handleClose}
          disabled={isPublishing}
        >
          Cancel
        </Button>
        <Button
          onclick={publishListing}
          disabled={!title.trim() || !content.trim() || isPublishing}
        >
          {isPublishing ? 'Publishing...' : 'Publish Listing'}
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{:else}
  <Drawer.Root {open} onOpenChange={(newOpen) => {
      open = newOpen;
      if (!newOpen) handleClose();
    }}>
    <Drawer.Content>
      <Drawer.Header class="text-left">
        <div class="flex items-center gap-2">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <Drawer.Title>Create Listing</Drawer.Title>
        </div>
      </Drawer.Header>

      <div class="px-4 space-y-6 overflow-auto flex-1">
          <!-- Basic Details -->
          <div class="space-y-5">
            <div>
              <Label for="title">
                Title <span class="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                type="text"
                bind:value={title}
                placeholder="What are you listing?"
                maxlength={200}
                class="mt-2"
              />
            </div>

            <div>
              <Label for="summary">Summary</Label>
              <Input
                id="summary"
                type="text"
                bind:value={summary}
                placeholder="Brief description"
                maxlength={200}
                class="mt-2"
              />
            </div>

            <div>
              <Label for="content">
                Description <span class="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                bind:value={content}
                placeholder="Detailed description (Markdown supported)"
                rows={6}
                class="mt-2 resize-none"
              />
            </div>

            <div>
              <Label for="location">Location</Label>
              <Input
                id="location"
                type="text"
                bind:value={location}
                placeholder="City, State or Country"
                class="mt-2"
              />
            </div>
          </div>

          <!-- Pricing -->
          <div class="bg-muted/30 rounded-lg p-5 border border-border">
            <h3 class="text-lg font-semibold text-foreground mb-4">Pricing</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label for="price-amount">Amount</Label>
                <Input
                  id="price-amount"
                  type="text"
                  bind:value={priceAmount}
                  placeholder="0.00"
                  class="mt-2"
                />
              </div>

              <div>
                <Label for="currency">Currency</Label>
                <select
                  id="currency"
                  bind:value={priceCurrency}
                  class="mt-2 w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  {#each CURRENCIES as currency}
                    <option value={currency}>{currency}</option>
                  {/each}
                </select>
              </div>

              <div>
                <Label for="frequency">Frequency</Label>
                <select
                  id="frequency"
                  bind:value={priceFrequency}
                  class="mt-2 w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value={undefined}>One time</option>
                  <option value="hour">Per hour</option>
                  <option value="day">Per day</option>
                  <option value="week">Per week</option>
                  <option value="month">Per month</option>
                  <option value="year">Per year</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Categories -->
          <div class="bg-muted/30 rounded-lg p-5 border border-border">
            <h3 class="text-lg font-semibold text-foreground mb-4">Categories</h3>
            <div class="space-y-4">
              <div class="flex gap-2">
                <select
                  bind:value={newCategory}
                  class="flex-1 px-4 py-3 bg-muted border border-border rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="">Select a category</option>
                  {#each COMMON_CATEGORIES as cat}
                    <option value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  {/each}
                </select>
                <Input
                  type="text"
                  bind:value={newCategory}
                  placeholder="Or type custom"
                  class="flex-1"
                  onkeydown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCategory();
                    }
                  }}
                />
                <Button
                  type="button"
                  onclick={addCategory}
                  size="icon"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </Button>
              </div>

              {#if categories.length > 0}
                <div class="flex flex-wrap gap-2">
                  {#each categories as category}
                    <div class="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                      <span>{category}</span>
                      <button
                        type="button"
                        onclick={() => removeCategory(category)}
                        class="hover:text-primary"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <!-- Images -->
          <div class="bg-muted/30 rounded-lg p-5 border border-border">
            <h3 class="text-lg font-semibold text-foreground mb-4">Images</h3>
            <div class="space-y-4">
              <!-- File input -->
              <input
                bind:this={fileInput}
                type="file"
                accept="image/*"
                multiple
                onchange={imageUpload.handleFileInputChange}
                class="hidden"
              />

              <!-- Upload area -->
              <button
                type="button"
                onclick={() => fileInput?.click()}
                ondragover={imageUpload.handleDragOver}
                ondragleave={imageUpload.handleDragLeave}
                ondrop={imageUpload.handleDrop}
                disabled={imageUpload.uploadStatus === 'uploading'}
                class={`w-full h-32 rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 ${imageUpload.isDragging ? 'border-primary bg-muted/40' : 'border-border hover:border-primary bg-muted/20 hover:bg-muted/40'}`}
              >
                {#if imageUpload.uploadStatus === 'uploading'}
                  <div class="flex flex-col items-center gap-2">
                    <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-sm text-muted-foreground">{imageUpload.uploadProgress?.percentage || 0}%</span>
                  </div>
                {:else}
                  <svg class="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span class="text-sm text-muted-foreground">Click to upload or drag and drop</span>
                  <span class="text-xs text-muted-foreground">Multiple images supported</span>
                {/if}
              </button>

              <!-- Uploaded images grid -->
              {#if imageUpload.uploadedImages.length > 0}
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {#each imageUpload.uploadedImages as image, index}
                    <div class="relative group">
                      <img
                        src={image.url}
                        alt={`Listing image ${index + 1}`}
                        class="w-full h-32 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onclick={() => imageUpload.removeImage(index)}
                        class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>

      <Drawer.Footer class="pt-2">
        <Button
          onclick={publishListing}
          disabled={!title.trim() || !content.trim() || isPublishing}
          class="w-full"
        >
          {isPublishing ? 'Publishing...' : 'Publish Listing'}
        </Button>
        <Button
          variant="outline"
          onclick={handleClose}
          disabled={isPublishing}
          class="w-full"
        >
          Cancel
        </Button>
      </Drawer.Footer>
    </Drawer.Content>
  </Drawer.Root>
{/if}
