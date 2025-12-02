<script lang="ts">
  import { ndk } from "$lib/ndk.svelte";
  import { goto } from "$app/navigation";
  import { NDKPrivateKeySigner, NDKEvent } from "@nostr-dev-kit/ndk";
  import { followPackUsers } from "$lib/utils/followPacks";
  import { onboardingStore } from "$lib/stores/onboarding.svelte";
  import Step1Community from "$lib/pages/onboarding/Step1Community.svelte";
  import Step2FollowPacks from "$lib/pages/onboarding/Step2FollowPacks.svelte";
  import Step3Features from "$lib/pages/onboarding/Step3Features.svelte";
  import Step4Profile from "$lib/pages/onboarding/Step6Profile.svelte";
  import Step5Introduction from "$lib/pages/onboarding/Step7Introduction.svelte";
  import Step6Welcome from "$lib/pages/onboarding/Step8Welcome.svelte";

  let signer = $state<NDKPrivateKeySigner | null>(null);
  let hasExistingProfile = $state(false);
  let checkedForProfile = $state(false);

  // Derived values from store
  const currentStep = $derived(onboardingStore.currentStep);
  const totalSteps = $derived(onboardingStore.totalSteps);
  const progressPercentage = $derived((currentStep / totalSteps) * 100);
  const inviteData = $derived(onboardingStore.invite);
  const hasCompletedInviteSetup = $derived(
    onboardingStore.hasCompletedInviteSetup,
  );
  const selectedCommunity = $derived(onboardingStore.selectedCommunity);
  const selectedPacks = $derived(onboardingStore.selectedPacks);
  const profileData = $derived(onboardingStore.profileData);

  // Check if user already has a profile (for existing users signing in via invite)
  $effect(() => {
    const activeUser = ndk.$activeUser;
    if (!activeUser || checkedForProfile) return;

    (async () => {
      try {
        const profile = await activeUser.fetchProfile();
        if (profile && (profile.name || profile.displayName || profile.about)) {
          hasExistingProfile = true;
        } else {
          hasExistingProfile = false;
        }
      } catch (err) {
        hasExistingProfile = false;
      } finally {
        checkedForProfile = true;
      }
    })();
  });

  // Generate key for new users (but don't login yet - that happens at completion)
  $effect(() => {
    // Don't generate a key if user is already logged in
    if (signer || ndk.$activeUser) return;
    signer = NDKPrivateKeySigner.generate();
  });

  // NOTE: completeInviteSetup is now called explicitly in handleStep4Next for invite flow
  // Removed from reactive effect to prevent it from running on every profile data change

  function goToStep(step: number) {
    // Skip profile step (4) if user already has a profile
    if (step === 4 && hasExistingProfile) {
      step = 5;
    }
    onboardingStore.setStep(step);
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }

  function goBack() {
    if (currentStep > onboardingStore.minStep) {
      let prevStep = currentStep - 1;
      // When going back, skip profile step if user has existing profile
      if (prevStep === 4 && hasExistingProfile) {
        prevStep = 3;
      }
      goToStep(prevStep);
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
    // For existing users, they're already logged in. Only new users need the signer.
    const activeUser = ndk.$activeUser;
    const isExistingUser = hasExistingProfile && activeUser;

    if (!isExistingUser && !signer) {
      console.error("[Onboarding] ✗ No signer available for new user");
      return;
    }

    try {

      // 1. Login first (only for new users)
      if (!isExistingUser && signer) {
        await ndk.$sessions?.login(signer);
      } else {
      }

      // 2. Get the signer to use (either new user's signer or existing user's signer from session)
      const signerToUse = signer || ndk.signer;
      if (!signerToUse) {
        alert("[Onboarding] ✗ No signer available");
        return;
      }

      // 3. Check if this is an invite flow or regular onboarding
      if (inviteData && !hasCompletedInviteSetup) {
        await onboardingStore.completeInviteSetup(signerToUse as NDKPrivateKeySigner);
      } else if (!isExistingUser) {
        // Only publish profile and setup for new users
        await onboardingStore.publishProfileAndSetup(signerToUse as NDKPrivateKeySigner);
      } else {
      }

      // 4. Publish follow packs if selected
      if (selectedPacks.length > 0) {
        await followPackUsers(ndk, selectedPacks);
      }

      // 5. Publish introduction if provided
      const introText = onboardingStore.introductionText;
      if (introText) {
        try {
          const introData = JSON.parse(introText);
          const event = new NDKEvent(ndk);
          event.kind = 1;
          event.content = introData.content;
          event.tags = introData.hashtags.map((tag: string) => ["t", tag]);

          if (introData.mentionInviter) {
            event.tags.push(["p", introData.mentionInviter]);
          }

          await event.publish();
        } catch (err) {
          console.error("[Onboarding] ✗ Error publishing introduction:", err);
        }
      }

      onboardingStore.clear();
      goto("/");
    } catch (err) {
      console.error("[Onboarding] ✗ Error during onboarding completion:", err);
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
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
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
      <Step3Features onNext={() => goToStep(4)} />
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
