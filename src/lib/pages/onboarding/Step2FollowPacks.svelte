<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import { NDKFollowPack, NDKSubscriptionCacheUsage, type NDKFilter, filterFromId } from '@nostr-dev-kit/ndk';
  import { COMMUNITY_RELAYS, FOLLOW_PACK_KIND, COMMUNITY_METADATA, HARDCODED_COMMUNITY_PACKS } from '$lib/config/followPacks';
  import { FollowPackCompact } from '$lib/ndk/components/follow-pack-compact';
  import { t } from 'svelte-i18n';

  interface Props {
    selectedCommunity: string | null;
    selectedPacks: string[];
    onSelectPacks: (packs: string[]) => void;
    onNext: () => void;
  }

  let { selectedCommunity, selectedPacks, onSelectPacks, onNext }: Props = $props();

  const communityKey = $derived(selectedCommunity || 'venezuela');
  const hardcodedNaddrs = $derived(HARDCODED_COMMUNITY_PACKS[communityKey]);

  const followPacksSubscription = $derived.by(() => {
    if (hardcodedNaddrs && hardcodedNaddrs.length > 0) {
      // Use hardcoded packs with subscription
      const filters = hardcodedNaddrs.map(naddr => filterFromId(naddr));
      return ndk.$subscribe(() => ({
        filters,
        subId: 'followpacks',
        closeOnEose: true
      }));
    } else {
      // Fallback: fetch from relay if no hardcoded packs
      const relayUrls = COMMUNITY_RELAYS[communityKey];
      if (!relayUrls || relayUrls.length === 0) {
        console.warn(`No relay configured for community: ${communityKey}`);
        return null;
      }

      return ndk.$subscribe(() => ({
        filters: [{ kinds: [FOLLOW_PACK_KIND] }],
        subId: 'followpacks',
        closeOnEose: true,
        relayUrls,
        exclusiveRelay: true
      }));
    }
  });

  const followPacks = $derived.by(() => {
    if (!followPacksSubscription) return [];
    const events = Array.from(followPacksSubscription.events ?? []);
    return events.map(event => NDKFollowPack.from(event));
  });

  const loading = $derived((followPacksSubscription as any)?.eoseReceived === false);

  const communityInfo = $derived(COMMUNITY_METADATA[communityKey] || COMMUNITY_METADATA.venezuela);

  function handlePackClick(pack: NDKFollowPack) {
    const packId = pack.encode();
    if (selectedPacks.includes(packId)) {
      onSelectPacks(selectedPacks.filter(id => id !== packId));
    } else {
      onSelectPacks([...selectedPacks, packId]);
    }
  }

  function handleNext() {
    onNext();
  }
</script>

<div class="flex min-h-screen">
  <!-- Left Panel - Visual -->
  <div class="hidden lg:block w-1/2 relative">
    <img
      src="https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&q=80"
      alt="Community leaders"
      class="absolute inset-0 w-full h-full object-cover"
    />
    <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70"></div>
    <div class="absolute bottom-0 left-0 right-0 p-12">
      <div class="mb-8">
        <p class="text-3xl text-foreground/90 italic leading-relaxed">
          "{$t('onboarding.step2FollowPacks.quote')}"
        </p>
      </div>
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-foreground font-semibold">
          MR
        </div>
        <div class="text-foreground">
          <div class="font-semibold">{$t('onboarding.step2FollowPacks.quoteName')}</div>
          <div class="text-sm opacity-75">{$t('onboarding.step2FollowPacks.quoteTitle')}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Right Panel - Follow Packs Grid -->
  <div class="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-12">
    <div class="max-w-xl w-full">
      <div class="mb-6 lg:mb-8">
        <h1 class="text-2xl lg:text-3xl font-bold mb-2 lg:mb-3">{$t('onboarding.step2FollowPacks.title')}</h1>
        <p class="text-sm lg:text-base text-muted-foreground">
          {$t('onboarding.step2FollowPacks.subtitle', { values: { community: communityInfo.name } })}
        </p>
      </div>

        {#if loading}
          <div class="text-center py-12">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p class="mt-4 text-sm text-muted-foreground">{$t('onboarding.step2FollowPacks.loading')}</p>
          </div>
        {:else if followPacks.length === 0}
          <div class="text-center py-8 text-muted-foreground">
            {$t('onboarding.step2FollowPacks.noPacksAvailable')}
          </div>
        {:else}
          <div class="space-y-2 mb-6 lg:mb-8 max-h-[50vh] lg:max-h-[60vh] overflow-y-auto p-2 -m-2">
            {#each followPacks.slice(0, 6) as pack (pack.id)}
              {@const isSelected = selectedPacks.includes(pack.encode())}
              <div class="relative">
                <FollowPackCompact
                  {ndk}
                  followPack={pack}
                  onclick={() => handlePackClick(pack)}
                  class={isSelected ? 'ring-2 ring-orange-500 bg-primary-50 dark:bg-primary-950/20' : ''}
                />

                <!-- Selection checkmark -->
                {#if isSelected}
                  <div class="absolute top-1/2 right-4 -translate-y-1/2 bg-primary text-foreground rounded-full p-1.5 z-10 pointer-events-none">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}

      <button
        onclick={handleNext}
        class={`
          w-full py-3 lg:py-4 px-6 rounded-lg font-medium transition-all text-sm lg:text-base
          bg-primary/80 text-primary-foreground dark:text-foreground hover:bg-primary
          }
        `}
      >
        {selectedPacks.length > 0 ? $t('onboarding.step2FollowPacks.continue') : $t('onboarding.step2FollowPacks.skip')} →
      </button>
    </div>
  </div>
</div>
