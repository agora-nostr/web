<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { walletStore } from '../store.svelte.js';
  import WalletTypeSelector from './WalletTypeSelector.svelte';
  import NWCConnectForm from './NWCConnectForm.svelte';

  interface Props {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = $bindable(), onOpenChange }: Props = $props();

  type Step = 'choose' | 'nwc';
  let step = $state<Step>('choose');

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      step = 'choose';
    }
    open = isOpen;
    onOpenChange?.(isOpen);
  }

  function handleSelectNWC() {
    step = 'nwc';
  }

  function handleSelectNip60() {
    walletStore.useNip60();
    handleOpenChange(false);
  }

  function handleNWCSuccess() {
    handleOpenChange(false);
  }

  function handleNWCCancel() {
    step = 'choose';
  }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
  <Dialog.Content class="max-w-md">
    {#if step === 'choose'}
      <Dialog.Header>
        <Dialog.Title>Set Up Your Wallet</Dialog.Title>
        <Dialog.Description>
          Choose how you want to manage your Bitcoin payments
        </Dialog.Description>
      </Dialog.Header>

      <div class="pt-4">
        <WalletTypeSelector
          onSelectNWC={handleSelectNWC}
          onSelectNip60={handleSelectNip60}
        />
      </div>
    {:else if step === 'nwc'}
      <Dialog.Header>
        <Dialog.Title>Connect External Wallet</Dialog.Title>
        <Dialog.Description>
          Enter your NWC connection string from your wallet app
        </Dialog.Description>
      </Dialog.Header>

      <div class="pt-4">
        <NWCConnectForm
          onSuccess={handleNWCSuccess}
          onCancel={handleNWCCancel}
        />
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
