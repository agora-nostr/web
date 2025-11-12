<script lang="ts">
  import { ndk } from '$lib/ndk.svelte';
  import { goto } from '$app/navigation';
  import { NDKPrivateKeySigner, NDKEvent } from '@nostr-dev-kit/ndk';
  import { followPackUsers } from '$lib/utils/followPacks';
  import { onboardingStore } from '$lib/stores/onboarding.svelte';
  import Step1Community from '$lib/pages/onboarding/Step1Community.svelte';
  import Step2FollowPacks from '$lib/pages/onboarding/Step2FollowPacks.svelte';
  import Step3Features from '$lib/pages/onboarding/Step3Features.svelte';
  import Step4Profile from '$lib/pages/onboarding/Step6Profile.svelte';
  import Step5Introduction from '$lib/pages/onboarding/Step7Introduction.svelte';
  import Step6Welcome from '$lib/pages/onboarding/Step8Welcome.svelte';

  let signer = $state<NDKPrivateKeySigner | null>(null);

  // Derived values from store
  const currentStep = $derived(onboardingStore.currentStep);
  const totalSteps = $derived(onboardingStore.totalSteps);
  const progressPercentage = $derived((currentStep / totalSteps) * 100);
  const inviteData = $derived(onboardingStore.invite);
  const hasCompletedInviteSetup = $derived(onboardingStore.hasCompletedInviteSetup);
  const selectedCommunity = $derived(onboardingStore.selectedCommunity);
  const selectedPacks = $derived(onboardingStore.selectedPacks);
  const profileData = $derived(onboardingStore.profileData);

  // Generate key (but don't login yet - that happens at completion)
  $effect(() => {
      if (signer) return;
      signer = NDKPrivateKeySigner.generate();
      console.log('[Onboarding] ✓ Generated new keypair, pubkey:', signer.pubkey);
  });

  // NOTE: completeInviteSetup is now called explicitly in handleStep4Next for invite flow
  // Removed from reactive effect to prevent it from running on every profile data change

  function goToStep(step: number) {
    onboardingStore.setStep(step);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }

  function goBack() {
    if (currentStep > onboardingStore.minStep) {
      goToStep(currentStep - 1);
    }
  }

  async function handleStep2Next() {
    // Just store the packs - they'll be published at completion
    goToStep(3);
  }

  async function handleStep4Next() {
    // Just move to the next step - no publishing yet
    goToStep(5);
  }

  async function completeOnboarding() {
    if (!signer) {
      console.error('[Onboarding] ✗ No signer available');
      return;
    }

    try {
      console.log('[Onboarding] Starting onboarding completion...');

      // 1. Login first
      console.log('[Onboarding] Logging in...');
      await ndk.$sessions?.login(signer);
      console.log('[Onboarding] ✓ Logged in with pubkey:', signer.pubkey);

      // 2. Check if this is an invite flow or regular onboarding
      if (inviteData && !hasCompletedInviteSetup) {
        console.log('[Onboarding] Invite flow: completing invite setup');
        await onboardingStore.completeInviteSetup(signer);
      } else {
        console.log('[Onboarding] Regular flow: publishing profile and setup');
        await onboardingStore.publishProfileAndSetup(signer);
      }

      // 3. Publish follow packs if selected
      if (selectedPacks.length > 0) {
        console.log('[Onboarding] Publishing kind:3 from', selectedPacks.length, 'packs');
        await followPackUsers(ndk, selectedPacks);
      }

      // 4. Publish introduction if provided
      const introText = onboardingStore.introductionText;
      if (introText) {
        console.log('[Onboarding] Publishing introduction post');
        try {
          const introData = JSON.parse(introText);
          const event = new NDKEvent(ndk);
          event.kind = 1;
          event.content = introData.content;
          event.tags = introData.hashtags.map((tag: string) => ['t', tag]);

          if (introData.mentionInviter) {
            event.tags.push(['p', introData.mentionInviter]);
          }

          await event.publish();
          console.log('[Onboarding] ✓ Published introduction');
        } catch (err) {
          console.error('[Onboarding] ✗ Error publishing introduction:', err);
        }
      }

      console.log('[Onboarding] ✓ Onboarding complete');
      onboardingStore.clear();
      goto('/');
    } catch (err) {
      console.error('[Onboarding] ✗ Error during onboarding completion:', err);
    }
  }
</script>

<div class="min-h-screen bg-card">
  <!-- Progress Bar -->
  <div class="fixed top-0 left-0 right-0 z-40 bg-card">
    <div class="h-1 bg-neutral-200 dark:bg-muted">
      <div
        class="h-full bg-background dark:bg-white transition-all duration-300 ease-out"
        style={`width: ${progressPercentage}%`}
      ></div>
    </div>
  </div>

  <!-- Back Button -->
  {#if currentStep > (inviteData ? 3 : 1)}
    <button
      onclick={goBack}
      class="fixed top-6 left-6 z-50 w-9 h-9 bg-card border border rounded-full flex items-center justify-center hover:bg-accent transition-colors"
      aria-label="Go back"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
    </button>
  {/if}

  <!-- Steps -->
  <div class="relative pt-8">
    {#if currentStep === 1 && !inviteData}
      <Step1Community
        {selectedCommunity}
        onSelectCommunity={(c) => onboardingStore.setSelectedCommunity(c)}
        onNext={() => goToStep(2)}
      />
    {/if}

    {#if currentStep === 2 && !inviteData}
      <Step2FollowPacks
        {selectedCommunity}
        {selectedPacks}
        onSelectPacks={(p) => onboardingStore.setSelectedPacks(p)}
        onNext={handleStep2Next}
      />
    {/if}

    {#if currentStep === 3}
      <Step3Features
        onNext={() => goToStep(4)}
      />
    {/if}

    {#if currentStep === 4}
      <Step4Profile
        {profileData}
        onUpdateProfile={(d) => onboardingStore.setProfileData(d)}
        onNext={handleStep4Next}
        inviteRelay={inviteData?.inviteRelay}
        signer={signer ?? undefined}
      />
    {/if}

    {#if currentStep === 5}
      <Step5Introduction
        {profileData}
        inviterPubkey={inviteData?.inviter}
        inviteRelay={inviteData?.inviteRelay}
        onNext={() => goToStep(6)}
        onSkip={() => goToStep(6)}
      />
    {/if}

    {#if currentStep === 6}
      <Step6Welcome
        {selectedPacks}
        {profileData}
        onComplete={completeOnboarding}
      />
    {/if}
  </div>
</div>
