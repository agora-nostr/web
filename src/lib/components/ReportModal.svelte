<script lang="ts">
  import { NDKEvent } from '@nostr-dev-kit/ndk';
  import { ndk } from '$lib/ndk.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';
  import { t } from 'svelte-i18n';

  interface Props {
    event: NDKEvent;
    open: boolean;
    onClose: () => void;
  }

  let { event, open, onClose }: Props = $props();

  let selectedReportType = $state<string>('');
  let additionalInfo = $state('');
  let isSubmitting = $state(false);

  const reportTypes = [
    { value: 'nudity', labelKey: 'report.types.nudity' },
    { value: 'malware', labelKey: 'report.types.malware' },
    { value: 'profanity', labelKey: 'report.types.profanity' },
    { value: 'illegal', labelKey: 'report.types.illegal' },
    { value: 'spam', labelKey: 'report.types.spam' },
    { value: 'impersonation', labelKey: 'report.types.impersonation' },
    { value: 'other', labelKey: 'report.types.other' }
  ];

  async function handleSubmit() {
    if (!selectedReportType) {
      toast.error($t('report.errors.selectType'));
      return;
    }

    const currentUser = ndk.activeUser;
    if (!currentUser) {
      toast.error($t('report.errors.notLoggedIn'));
      return;
    }

    try {
      isSubmitting = true;

      // Create NIP-56 report event (kind 1984)
      const reportEvent = new NDKEvent(ndk);
      reportEvent.kind = 1984;

      // Add p tag for the author being reported
      reportEvent.tags.push(['p', event.pubkey, selectedReportType]);

      // Add e tag for the note being reported
      reportEvent.tags.push(['e', event.id, selectedReportType]);

      // Add additional info as content if provided
      if (additionalInfo.trim()) {
        reportEvent.content = additionalInfo.trim();
      }

      await reportEvent.publish();

      toast.success($t('report.success'));
      onClose();

      // Reset form
      selectedReportType = '';
      additionalInfo = '';
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast.error($t('report.errors.failed'));
    } finally {
      isSubmitting = false;
    }
  }

  function handleClose() {
    if (!isSubmitting) {
      selectedReportType = '';
      additionalInfo = '';
      onClose();
    }
  }

  // Watch for dialog close
  $effect(() => {
    if (!open) {
      handleClose();
    }
  });
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-w-md">
    <Dialog.Header>
      <Dialog.Title>{$t('report.title')}</Dialog.Title>
      <Dialog.Description>
        {$t('report.description')}
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-4">
      <!-- Report Type Selection -->
      <div>
        <label class="text-sm font-medium mb-2 block">
          {$t('report.selectReason')}
        </label>
        <div class="space-y-2">
          {#each reportTypes as type}
            <label class="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted cursor-pointer transition-colors">
              <input
                type="radio"
                name="reportType"
                value={type.value}
                bind:group={selectedReportType}
                disabled={isSubmitting}
                class="w-4 h-4"
              />
              <span class="text-sm">{$t(type.labelKey)}</span>
            </label>
          {/each}
        </div>
      </div>

      <!-- Additional Information -->
      <div>
        <label for="report-additional-info" class="text-sm font-medium mb-2 block">
          {$t('report.additionalInfo')} {$t('common.optional')}
        </label>
        <Textarea
          id="report-additional-info"
          bind:value={additionalInfo}
          placeholder={$t('report.additionalInfoPlaceholder')}
          disabled={isSubmitting}
          class="resize-none"
          rows={3}
        />
      </div>

      <!-- Warning -->
      <div class="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p class="text-sm text-yellow-600 dark:text-yellow-400">
          {$t('report.warning')}
        </p>
      </div>
    </div>

    <div class="flex gap-3 justify-end">
      <Button
        variant="outline"
        onclick={handleClose}
        disabled={isSubmitting}
      >
        {$t('common.cancel')}
      </Button>
      <Button
        onclick={handleSubmit}
        disabled={!selectedReportType || isSubmitting}
        variant="destructive"
      >
        {#if isSubmitting}
          {$t('report.submitting')}
        {:else}
          {$t('report.submit')}
        {/if}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
