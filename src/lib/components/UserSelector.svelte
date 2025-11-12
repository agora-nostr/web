<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { Button } from '$lib/components/ui/button';
  import { clickOutside } from '$lib/utils/clickOutside';
  import { portal } from '$lib/utils/portal.svelte';
  import UserSelectorDropdown from './UserSelector/UserSelectorDropdown.svelte';

  interface Props {
    selectedPubkeys?: string[];
    onSelect?: (pubkeys: string[]) => void;
    multiple?: boolean;
    buttonClass?: string;
    buttonLabel?: string;
    disabled?: boolean;
    iconOnly?: boolean;
    open?: boolean;
  }

  let {
    selectedPubkeys = $bindable([]),
    onSelect,
    multiple = true,
    buttonClass = '',
    buttonLabel,
    disabled = false,
    iconOnly = true,
    open = $bindable(false)
  }: Props = $props();
  let searchQuery = $state('');
  let buttonElement: HTMLButtonElement | null = $state(null);
  let dropdownPosition = $state({ top: 0, left: 0, width: 0 });

  // Fetch current user's follows
  const contactListSubscription = ndk.$subscribe(
    () => ndk.$currentUser?.pubkey ? ({
      filters: [{ kinds: [3], authors: [ndk.$currentUser.pubkey], limit: 1 }],
      bufferMs: 100,
    }) : undefined
  );

  const userFollows = $derived.by(() => {
    const contactList = contactListSubscription.events[0];
    if (!contactList) return new Set<string>();
    return new Set(contactList.tags.filter(tag => tag[0] === 'p').map(tag => tag[1]));
  });

  let cachedFilteredProfiles = $state<Map<string, { name?: string; displayName?: string; nip05?: string }>>(new Map());

  const filteredFollows = $derived.by(() => {
    if (!searchQuery) return Array.from(userFollows).slice(0, 50);

    // Filter cached profiles that are also in follows
    const filtered = Array.from(cachedFilteredProfiles.entries())
      .filter(([pubkey]) => userFollows.has(pubkey))
      .map(([pubkey]) => pubkey);

    return filtered.slice(0, 50);
  });

  // Update cached profiles when search query changes
  $effect(() => {
    if (!searchQuery.trim() || !ndk.cacheAdapter?.getProfiles) {
      cachedFilteredProfiles = new Map();
      return;
    }

    const search = searchQuery.toLowerCase();

    // Use cache adapter to efficiently search across name, displayName, and nip05
    ndk.cacheAdapter.getProfiles({
      fields: ['name', 'displayName', 'nip05'],
      contains: search
    }).then((profiles) => {
      cachedFilteredProfiles = profiles ?? new Map();
    }).catch(err => {
      console.error('Failed to search profiles:', err);
      cachedFilteredProfiles = new Map();
    });
  });

  function handleClick() {
    if (!open && buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      dropdownPosition = {
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 380)
      };
    }
    open = !open;
  }

  // When used as a modal (button hidden), center the dropdown
  const isModalMode = $derived(buttonClass.includes('hidden'));

  $effect(() => {
    if (open && isModalMode) {
      // Center the dropdown on screen
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const dropdownWidth = 380;
      const dropdownHeight = 400;

      dropdownPosition = {
        top: (viewportHeight - dropdownHeight) / 2,
        left: (viewportWidth - dropdownWidth) / 2,
        width: dropdownWidth
      };
    }
  });

  function toggleUser(pubkey: string) {
    if (multiple) {
      if (selectedPubkeys.includes(pubkey)) {
        selectedPubkeys = selectedPubkeys.filter(p => p !== pubkey);
      } else {
        selectedPubkeys = [...selectedPubkeys, pubkey];
      }
    } else {
      selectedPubkeys = [pubkey];
      open = false;
    }
    onSelect?.(selectedPubkeys);
  }

  function removeUser(pubkey: string) {
    selectedPubkeys = selectedPubkeys.filter(p => p !== pubkey);
    onSelect?.(selectedPubkeys);
  }

  async function addByIdentifier() {
    if (!searchQuery.trim()) return;

    try {
      const input = searchQuery.trim();
      const user = await ndk.fetchUser(input);

      if (user?.pubkey) {
        if (multiple) {
          if (!selectedPubkeys.includes(user.pubkey)) {
            selectedPubkeys = [...selectedPubkeys, user.pubkey];
            onSelect?.(selectedPubkeys);
            toast.success('User added');
          }
        } else {
          selectedPubkeys = [user.pubkey];
          onSelect?.(selectedPubkeys);
          open = false;
        }
        searchQuery = '';
      } else {
        toast.error('User not found');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      toast.error('Failed to fetch user');
    }
  }

  function handleClickOutside() {
    open = false;
  }

  // Check if input looks like an identifier (npub, hex, or NIP-05)
  const isIdentifierInput = $derived.by(() => {
    const query = searchQuery.trim();
    return query.length > 0 && (
      query.startsWith('npub1') ||
      query.startsWith('nprofile1') ||
      query.includes('@') ||
      (query.length === 64 && /^[0-9a-f]+$/i.test(query))
    );
  });
</script>

<div class="relative">
  <Button
    bind:ref={buttonElement}
    type="button"
    variant="ghost"
    size={iconOnly ? 'icon' : 'default'}
    class="{iconOnly ? 'h-8 w-8' : 'w-full justify-start'} {buttonClass}"
    {disabled}
    onclick={handleClick}
    title={buttonLabel || 'Tag people'}
  >
    {#if !iconOnly && buttonLabel}
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <span>{buttonLabel}</span>
      {#if selectedPubkeys.length > 0}
        <span class="ml-auto text-xs bg-primary/20 text-primary rounded-full px-2 py-0.5">
          {selectedPubkeys.length}
        </span>
      {/if}
    {:else}
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      {#if selectedPubkeys.length > 0}
        <span class="absolute -top-1 -right-1 text-[10px] bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
          {selectedPubkeys.length}
        </span>
      {/if}
    {/if}
  </Button>

  {#if open}
    {#if isModalMode}
      <div
        use:portal
        role="presentation"
        onclick={handleClickOutside}
        onkeydown={(e) => e.key === 'Escape' && handleClickOutside()}
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      >
        <div
          role="dialog"
          tabindex="-1"
          onclick={(e) => e.stopPropagation()}
          onkeydown={(e) => e.stopPropagation()}
          style="width: 380px;"
          class="bg-card border border-border rounded-lg shadow-xl overflow-hidden"
        >
          <UserSelectorDropdown
            bind:searchQuery
            {isIdentifierInput}
            {selectedPubkeys}
            {filteredFollows}
            {multiple}
            onSearchQueryChange={(value) => searchQuery = value}
            onAddByIdentifier={addByIdentifier}
            onRemoveUser={removeUser}
            onToggleUser={toggleUser}
          />
        </div>
      </div>
    {:else}
      <div
        use:portal
        use:clickOutside={handleClickOutside}
        style="position: fixed; top: {dropdownPosition.top}px; left: {dropdownPosition.left}px; width: 380px;"
        class="bg-card border border-border rounded-lg shadow-xl z-50 overflow-hidden"
      >
        <UserSelectorDropdown
          bind:searchQuery
          {isIdentifierInput}
          {selectedPubkeys}
          {filteredFollows}
          {multiple}
          onSearchQueryChange={(value) => searchQuery = value}
          onAddByIdentifier={addByIdentifier}
          onRemoveUser={removeUser}
          onToggleUser={toggleUser}
        />
      </div>
    {/if}
  {/if}
</div>
