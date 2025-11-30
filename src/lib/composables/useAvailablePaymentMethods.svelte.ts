import { useAvailableOptions } from './useAvailableOptions.svelte';

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
  const { options } = useAvailableOptions({
    tagName: 'pm',
    metadata: paymentMethodMetadata,
    defaultIcon: '💳',
    allOption: { id: 'all', name: 'All Methods', icon: '💰' },
    sortBy: 'name'
  });

  return {
    get paymentMethods() {
      return options;
    }
  };
}
