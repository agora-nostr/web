<script lang="ts">
  import type { Trustee } from '$lib/backup/types';
  import { ndk } from '$lib/ndk.svelte';
  import User from '$lib/components/User.svelte';
  import { useProfileSearch } from '$lib/composables/useProfileSearch.svelte';

  interface Props {
    trustees: Trustee[];
    maxTrustees: number;
    onTrusteesChange: (trustees: Trustee[]) => void;
  }

  let { trustees, maxTrustees, onTrusteesChange }: Props = $props();

  let searchValue = $state('');

  let followsList = $derived(Array.from(ndk.$sessions?.follows ?? []));

  // Get available follows (excluding already selected trustees)
  const availableFollows = $derived.by(() =>
    followsList.filter(pubkey => !trustees.some(t => t.pubkey === pubkey))
  );

  // Use profile search composable for filtering
  const { filteredPubkeys: filteredFollows } = useProfileSearch({
    searchQuery: () => searchValue,
    availablePubkeys: () => availableFollows,
    limit: 10
  });

  function selectTrustee() {

  }

  function handleAddTrustee(pubkey: string) {
    if (trustees.length >= maxTrustees) return;
    if (trustees.some(t => t.pubkey === pubkey)) return;

    onTrusteesChange([...trustees, { pubkey, selected: true }]);
  }

  function handleRemoveTrustee(pubkey: string) {
    onTrusteesChange(trustees.filter(t => t.pubkey !== pubkey));
  }
</script>

<div class="space-y-4">
  <div>
    <label class="block text-sm font-medium text-foreground mb-2">
      Select Trustees
    </label>
    <p class="text-xs text-muted-foreground mb-3">
      Choose trusted contacts who will receive encrypted pieces of your key
    </p>
  </div>

  <!-- Selected trustees -->
  {#if trustees.length > 0}
    <div class="space-y-2">
      {#each trustees as trustee}
        <div class="flex items-center gap-3 p-3 bg-neutral-100 dark:bg-card border border rounded-lg">
          <User pubkey={trustee.pubkey} variant="avatar-name-handle" showHoverCard={false} class="flex-1 min-w-0" onclick={selectTrustee} />
          <button
            onclick={() => handleRemoveTrustee(trustee.pubkey)}
            class="p-2 hover:bg-neutral-200 dark:hover:bg-muted rounded-lg transition-colors"
          >
            <svg class="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <div class="flex items-center justify-between text-sm mb-2">
    <span class="text-muted-foreground">
      Selected {trustees.length} of {maxTrustees}
    </span>
  </div>

  <!-- Search follows -->
  {#if trustees.length < maxTrustees}
    <div>
      <input
        type="text"
        bind:value={searchValue}
        placeholder="Search your follows..."
        class="w-full px-3 py-2 bg-card border border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>

    {#if filteredFollows.length === 0}
      <div class="text-center py-8 text-muted-foreground text-sm border border rounded-lg">
        {#if followsList.length === 0}
          No follows found. Follow some people first.
        {:else}
          All follows have been selected
        {/if}
      </div>
    {:else}
      <div class="border border rounded-lg max-h-64 overflow-y-auto">
        {#each filteredFollows as pubkey}
          <button
            onclick={() => handleAddTrustee(pubkey)}
            class="w-full p-3 hover:bg-neutral-100 dark:hover:bg-card transition-colors border-b border last:border-b-0"
          >
            <User {pubkey} variant="avatar-name-handle" showHoverCard={false} class="w-full" onclick={() => {}} />
          </button>
        {/each}
      </div>
    {/if}
  {/if}
</div>
