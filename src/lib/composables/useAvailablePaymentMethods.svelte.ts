import { ndk } from '$lib/ndk.svelte';
import { settings } from '$lib/stores/settings.svelte';
import type { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';

interface PaymentMethodInfo {
  id: string;
  name: string;
  icon: string;
}

const paymentMethodMetadata: Record<string, { icon: string }> = {
  'Cash': { icon: '💵' },
  'PIX': { icon: '🔄' },
  'BLIK': { icon: '📱' },
  'Revolut': { icon: '💳' },
  'revolut': { icon: '💳' },
  'Zelle': { icon: '🏦' },
  'CashApp': { icon: '📲' },
  'CVU': { icon: '🏧' },
  'MercadoPago': { icon: '🏧' },
  'f2f': { icon: '🤝' },
  'Bank Transfer': { icon: '🏦' },
  'Wire': { icon: '🏦' },
  'SEPA': { icon: '🇪🇺' },
  'PayPal': { icon: '💰' },
  'Venmo': { icon: '💸' },
  'Strike': { icon: '⚡' },
  'Wise': { icon: '🌐' },
  'N26': { icon: '💳' },
  'Monzo': { icon: '💳' },
  'Starling': { icon: '💳' },
  'TransferWise': { icon: '🌐' },
  'Instant': { icon: '⚡' },
};

export function useAvailablePaymentMethods() {
  const selectedRelay = $derived(settings.selectedRelay);

  const subscription = ndk.$subscribe(() => {
    const opts: {
      filters: NDKFilter[];
      closeOnEose: boolean;
      relayUrls?: string[];
      exclusiveRelay?: boolean;
    } = {
      filters: [{ kinds: [38383], limit: 100 }],
      closeOnEose: false,
    };

    if (selectedRelay) {
      opts.relayUrls = [selectedRelay];
      opts.exclusiveRelay = true;
    }

    return opts;
  });

  const paymentMethods = $derived.by(() => {
    const methodSet = new Set<string>();

    subscription.events.forEach((event: NDKEvent) => {
      const tags = event.tags;
      const zTag = tags.find((t: string[]) => t[0] === 'z');
      if (zTag && zTag[1] === 'info') return;

      const paymentMethod = tags.find((t: string[]) => t[0] === 'pm')?.[1];
      const status = tags.find((t: string[]) => t[0] === 's')?.[1];

      if (paymentMethod && status === 'pending') {
        methodSet.add(paymentMethod);
      }
    });

    const methodList: PaymentMethodInfo[] = Array.from(methodSet)
      .map(id => {
        const metadata = paymentMethodMetadata[id];
        return {
          id,
          name: id,
          icon: metadata?.icon || '💳'
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return [{ id: 'all', name: 'All Methods', icon: '💰' }, ...methodList];
  });

  return {
    get paymentMethods() {
      return paymentMethods;
    }
  };
}
