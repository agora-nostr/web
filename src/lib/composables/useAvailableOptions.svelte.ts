import { ndk } from '$lib/ndk.svelte';
import { settings } from '$lib/stores/settings.svelte';
import type { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';

interface OptionInfo<T extends string = string> {
  id: T;
  name: string;
  icon: string;
}

interface UseAvailableOptionsParams<T extends string = string> {
  tagName: string;
  transform?: (value: string) => T;
  metadata: Record<T, { name?: string; icon: string }>;
  defaultIcon: string;
  allOption: OptionInfo<T>;
  sortBy?: 'id' | 'name';
}

export function useAvailableOptions<T extends string = string>(
  params: UseAvailableOptionsParams<T>
) {
  const {
    tagName,
    transform = (v) => v as T,
    metadata,
    defaultIcon,
    allOption,
    sortBy = 'name'
  } = params;

  const selectedRelay = $derived(settings.selectedRelay);

  const subscription = ndk.$subscribe(() => {
    const opts: {
      filters: NDKFilter[];
      closeOnEose: boolean;
      relayUrls?: string[];
      exclusiveRelay?: boolean;
    } = {
      filters: [{ kinds: [38383 as number], limit: 100 }],
      closeOnEose: false,
    };

    if (selectedRelay) {
      opts.relayUrls = [selectedRelay];
      opts.exclusiveRelay = true;
    }

    return opts;
  });

  const options = $derived.by(() => {
    const optionSet = new Set<T>();

    subscription.events.forEach((event: NDKEvent) => {
      const tags = event.tags;
      const zTag = tags.find((t: string[]) => t[0] === 'z');
      if (zTag && zTag[1] === 'info') return;

      const value = tags.find((t: string[]) => t[0] === tagName)?.[1];
      const status = tags.find((t: string[]) => t[0] === 's')?.[1];

      if (value && status === 'pending') {
        optionSet.add(transform(value));
      }
    });

    const optionList: OptionInfo<T>[] = Array.from(optionSet)
      .map(id => {
        const meta = metadata[id];
        return {
          id,
          name: meta?.name || id,
          icon: meta?.icon || defaultIcon
        };
      })
      .sort((a, b) => {
        const aVal = sortBy === 'id' ? a.id : a.name;
        const bVal = sortBy === 'id' ? b.id : b.name;
        return aVal.localeCompare(bVal);
      });

    return [allOption, ...optionList];
  });

  return {
    get options() {
      return options;
    }
  };
}
