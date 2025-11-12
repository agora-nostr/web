import { ndk } from '$lib/ndk.svelte';
import { NDKEvent, NDKRelaySet, isValidPubkey, type NDKPrivateKeySigner, NDKKind, NDKCashuMintList } from '@nostr-dev-kit/ndk';
import { NDKCashuWallet } from '@nostr-dev-kit/wallet';
import { settings } from './settings.svelte';
import { getAgoraLanguage, WALLET_DEFAULT_RELAYS } from '$lib/utils/relayUtils';
import { locale } from 'svelte-i18n';
import { npubCash } from './npubcash.svelte';

export interface InviteData {
  welcomeMessage?: string;
  recipientName?: string;
  cashuToken?: string;
  inviter?: string;
  inviteEventId?: string;
  inviteRelay?: string;
  inviteCode?: string;
}

export interface ProfileData {
  name: string;
  bio: string;
  location: string;
  banner?: string;
  picture?: string;
  nip05: string;
}

interface OnboardingState {
  invite: InviteData | null;
  currentStep: number;
  selectedCommunity: string | null;
  selectedPacks: string[];
  profileData: ProfileData;
  introductionText?: string;
  hasPublishedInviteConfirmation: boolean;
  hasCompletedInviteSetup: boolean;
}

const DEFAULT_STATE: OnboardingState = {
  invite: null,
  currentStep: 1,
  selectedCommunity: null,
  selectedPacks: [],
  profileData: {
    name: '',
    bio: '',
    location: '',
    banner: undefined,
    picture: undefined,
    nip05: '',
  },
  introductionText: undefined,
  hasPublishedInviteConfirmation: false,
  hasCompletedInviteSetup: false,
};

function loadState(): OnboardingState {
  if (typeof window === 'undefined') {
    console.log('[Store] Server-side, returning DEFAULT_STATE');
    return DEFAULT_STATE;
  }

  try {
    const stored = sessionStorage.getItem('voces-onboarding');
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('[Store] Loaded state from sessionStorage:', parsed);
      // Only restore if there's an active invite, otherwise start fresh at step 1
      if (parsed.invite) {
        return { ...DEFAULT_STATE, ...parsed };
      } else {
        console.log('[Store] No active invite, ignoring stored state and starting fresh');
        return DEFAULT_STATE;
      }
    } else {
      console.log('[Store] No stored state found, using DEFAULT_STATE');
    }
  } catch (e) {
    console.error('[Store] Failed to load onboarding state:', e);
  }

  return DEFAULT_STATE;
}

function saveState(state: OnboardingState) {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem('voces-onboarding', JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save onboarding state:', e);
  }
}

class OnboardingStore {
  private state = $state<OnboardingState>(loadState());

  get invite() {
    return this.state.invite;
  }

  get currentStep() {
    return this.state.currentStep;
  }

  get selectedCommunity() {
    return this.state.selectedCommunity;
  }

  get selectedPacks() {
    return this.state.selectedPacks;
  }

  get profileData() {
    return this.state.profileData;
  }

  get introductionText() {
    return this.state.introductionText;
  }

  get hasInvite() {
    return !!this.state.invite;
  }

  get hasCompletedInviteSetup() {
    return this.state.hasCompletedInviteSetup;
  }

  get totalSteps() {
    return this.hasInvite ? 4 : 6;
  }

  get minStep() {
    return this.hasInvite ? 3 : 1;
  }

  setInvite(invite: InviteData) {
    console.log('[Store] setInvite called with:', invite);
    this.state.invite = invite;

    // Pre-fill profile name if available
    if (invite.recipientName && !this.state.profileData.name) {
      console.log('[Store] Pre-filling profile name:', invite.recipientName);
      this.state.profileData.name = invite.recipientName;
    }

    // Set language based on agora relay
    if (invite.inviteRelay) {
      const agoraLanguage = getAgoraLanguage(invite.inviteRelay);
      if (agoraLanguage) {
        console.log(`[Store] Setting language to ${agoraLanguage} based on agora relay ${invite.inviteRelay}`);
        settings.setLanguage(agoraLanguage);
        locale.set(agoraLanguage);
      }
    }

    // Skip to step 3 (features) when using invite
    console.log('[Store] Setting step to 3 (features)');
    this.state.currentStep = 3;

    saveState(this.state);
    console.log('[Store] ✓ Invite data saved to sessionStorage');
  }

  setStep(step: number) {
    this.state.currentStep = step;
    saveState(this.state);
  }

  setSelectedCommunity(community: string | null) {
    this.state.selectedCommunity = community;

    // Set language based on selected community
    if (community) {
      const communityToLocale: Record<string, 'en' | 'es' | 'fa' | 'km' | 'sn'> = {
        venezuela: 'es',
        nicaragua: 'es',
        cambodia: 'km',
        zimbabwe: 'sn',
        afghanistan: 'fa',
        iran: 'fa',
      };

      const newLocale = communityToLocale[community];
      if (newLocale) {
        console.log(`[Store] Setting language to ${newLocale} based on community ${community}`);
        settings.setLanguage(newLocale);
        locale.set(newLocale);
      }
    }

    saveState(this.state);
  }

  setSelectedPacks(packs: string[]) {
    this.state.selectedPacks = packs;
    saveState(this.state);
  }

  setProfileData(data: Partial<ProfileData>) {
    this.state.profileData = { ...this.state.profileData, ...data };
    saveState(this.state);
  }

  setIntroductionText(text: string) {
    this.state.introductionText = text;
    saveState(this.state);
  }

  async publishInviteConfirmation(signer: NDKPrivateKeySigner) {
    console.log('[Store] publishInviteConfirmation called:', {
      hasPublished: this.state.hasPublishedInviteConfirmation,
      inviteData: this.state.invite
    });

    if (this.state.hasPublishedInviteConfirmation) {
      console.log('[Store] ⊘ Invite confirmation already published');
      return;
    }

    const invite = this.state.invite;
    console.log('[Store] Checking invite data:', {
      hasInvite: !!invite,
      inviteEventId: invite?.inviteEventId,
      inviter: invite?.inviter,
      inviteRelay: invite?.inviteRelay,
      inviteCode: invite?.inviteCode
    });

    if (!invite?.inviteEventId || !invite?.inviter || !invite?.inviteRelay || !invite?.inviteCode) {
      console.warn('[Store] ✗ Missing required invite data for confirmation');
      return;
    }

    try {
      console.log('[Store] Creating kind:514 event...');
      const confirmationEvent = new NDKEvent(ndk);
      confirmationEvent.kind = 514;
      confirmationEvent.content = '';
      confirmationEvent.tags = [
        ['e', invite.inviteEventId],
        ['p', invite.inviter],
        ['code', invite.inviteCode],
      ];
      confirmationEvent.isProtected = true;

      console.log('[Store] Signing event...');
      await confirmationEvent.sign();
      console.log('[Store] ✓ Event signed');

      // Publish ONLY to the invite relay
      console.log('[Store] Getting relay:', invite.inviteRelay);
      const relay = ndk.pool.getRelay(invite.inviteRelay, true);
      if (relay) {
        console.log('[Store] ✓ Relay obtained:', relay.url);
        const relaySet = new NDKRelaySet(new Set([relay]), ndk);
        console.log('[Store] Publishing kind:514 invite confirmation to', invite.inviteRelay);
        await confirmationEvent.publish(relaySet);
        console.log('[Store] ✓ Successfully published kind:514 invite confirmation');

        // Set the invite relay as the selected relay in settings
        console.log('[Store] Setting selected relay in settings...');
        settings.setSelectedRelay(invite.inviteRelay);

        // Also ensure the relay is in the user's relay list
        const existingRelay = settings.relays.find(r => r.url === invite.inviteRelay);
        if (!existingRelay) {
          console.log('[Store] Adding relay to settings...');
          settings.addRelay({
            url: invite.inviteRelay,
            read: true,
            write: true,
            enabled: true
          });
        } else {
          console.log('[Store] Relay already in settings');
        }

        // Mark as published
        this.state.hasPublishedInviteConfirmation = true;
        saveState(this.state);
        console.log('[Store] ✓ Marked as published in state');
      } else {
        console.error('[Store] ✗ Failed to get relay:', invite.inviteRelay);
      }
    } catch (err) {
      console.error('[Store] ✗ Error publishing invite confirmation:', err);
      throw err;
    }
  }


  async publishProfileAndSetup(signer: NDKPrivateKeySigner) {
    console.log('[Store] publishProfileAndSetup called for non-invited user');
    const profile = this.state.profileData;

    if (!profile.name) {
      console.warn('[Store] ✗ No profile name, skipping');
      return;
    }

    if (!ndk.$sessions) {
      console.error('[Store] ✗ No sessions manager available');
      return;
    }

    try {
      // Get npub from signer for npub.cash address
      const user = await signer.user();

      // Enable npub.cash and get Lightning address
      npubCash.setEnabled(true);
      const lud16 = npubCash.getLightningAddress();

      // Build default relay list
      const relays = new Set<string>();
      relays.add('wss://purplepag.es');
      relays.add('wss://relay.primal.net');

      // Use createAccount with existing signer to get signed events WITHOUT publishing
      console.log('[Store] Creating account with createAccount() using existing signer...');
      const { events } = await ndk.$sessions.createAccount(
        {
          profile: {
            name: profile.name,
            about: profile.bio,
            ...(profile.location && { location: profile.location }),
            ...(profile.picture && { picture: profile.picture }),
            ...(profile.nip05 && { nip05: profile.nip05 }),
            ...(lud16 && { lud16 })
          },
          relays: Array.from(relays),
          wallet: {
            mints: ['https://mint.minibits.cash/Bitcoin'],
            relays: [...WALLET_DEFAULT_RELAYS]
          }
        },
        { publish: false, signer }
      );

      console.log('[Store] ✓ Created signed events:', events.length);

      // Publish all events to default relays
      console.log('[Store] Publishing events to default relays...');
      for (const event of events) {
        await event.publish();
        console.log(`[Store] ✓ Published kind:${event.kind} to default relays`);
      }

      console.log('[Store] ✓ Profile and setup complete');
    } catch (err) {
      console.error('[Store] ✗ Error publishing profile and setup:', err);
      throw err;
    }
  }

  async completeInviteSetup(signer: NDKPrivateKeySigner) {
    console.log('[Store] completeInviteSetup called:', {
      hasCompletedSetup: this.state.hasCompletedInviteSetup,
      hasInvite: this.hasInvite
    });

    if (this.state.hasCompletedInviteSetup) {
      console.log('[Store] ⊘ Invite setup already completed, skipping');
      return;
    }

    if (!this.hasInvite) {
      console.log('[Store] ⊘ No invite data, skipping invite setup');
      return;
    }

    // Capture these values ONCE at the start to avoid reactive dependencies
    const invite = this.state.invite;
    const profile = { ...this.state.profileData };

    try {
      console.log('[Store] Starting invite setup sequence...');

      // 1. Fetch inviter's contacts to copy
      let followsList: string[] = [];
      if (invite?.inviter) {
        console.log('[Store] Fetching inviter contacts for:', invite.inviter);
        const inviterContactEvent = await ndk.fetchEvent({
          kinds: [3],
          authors: [invite.inviter]
        });

        if (inviterContactEvent) {
          console.log('[Store] ✓ Found inviter contact list');
          const pTags = new Set(
            inviterContactEvent.tags
              .filter(tag => tag[0] === 'p')
              .map(tag => tag[1])
              .filter(isValidPubkey)
          );
          pTags.add(invite.inviter);
          followsList = Array.from(pTags);
          console.log(`[Store] Found ${followsList.length} contacts from inviter`);
        } else {
          console.log('[Store] ⊘ No contact list found for inviter, only following inviter');
          followsList = [invite.inviter];
        }
      }

      // 2. Fetch inviter's mint list for wallet
      let mints: string[] = ['https://mint.minibits.cash/Bitcoin'];
      if (invite?.inviter) {
        console.log('[Store] Fetching inviter mint list (kind 10019) for:', invite.inviter);
        const inviterMintListEvent = await ndk.fetchEvent({
          kinds: [NDKKind.CashuMintList],
          authors: [invite.inviter]
        });

        if (inviterMintListEvent) {
          console.log('[Store] ✓ Found inviter mint list event');
          const inviterMintList = NDKCashuMintList.from(inviterMintListEvent);
          if (inviterMintList?.mints && inviterMintList.mints.length > 0) {
            mints = [...inviterMintList.mints, ...mints];
            console.log('[Store] Using inviter mints + default:', mints);
          }
        } else {
          console.log('[Store] ⊘ No mint list found for inviter, using defaults');
        }
      }

      // 3. Build relay list
      const relays = new Set<string>();
      if (invite?.inviteRelay) {
        relays.add(invite.inviteRelay);
      }
      relays.add('wss://purplepag.es');
      relays.add('wss://relay.primal.net');

      if (!ndk.$sessions) {
        console.error('[Store] ✗ No sessions manager available');
        return;
      }

      // 4. Get npub from signer for npub.cash address
      const user = await signer.user();
      const npub = user.npub;

      // 5. Enable npub.cash and get Lightning address
      npubCash.setEnabled(true);
      const lud16 = npubCash.getLightningAddress();

      // 6. Use createAccount with existing signer to get signed events WITHOUT publishing
      console.log('[Store] Creating account with createAccount() using existing signer...');
      const { events } = await ndk.$sessions.createAccount(
        {
          profile: {
            name: profile.name,
            about: profile.bio,
            ...(profile.location && { location: profile.location }),
            ...(profile.picture && { picture: profile.picture }),
            ...(profile.nip05 && { nip05: profile.nip05 }),
            ...(lud16 && { lud16 })
          },
          relays: Array.from(relays),
          wallet: {
            mints,
            relays: [...WALLET_DEFAULT_RELAYS]
          },
          follows: followsList
        },
        { publish: false, signer }
      );

      console.log('[Store] ✓ Created signed events:', events.length);

      // 7. CRITICAL: Publish 514 confirmation FIRST before any other events
      await this.publishInviteConfirmation(signer);

      // 8. Publish events to invite relay first, then default relays
      if (invite?.inviteRelay) {
        console.log('[Store] Publishing events to invite relay:', invite.inviteRelay);
        const relay = ndk.pool.getRelay(invite.inviteRelay, true);
        if (relay) {
          const relaySet = NDKRelaySet.fromRelayUrls([invite.inviteRelay], ndk);
          for (const event of events) {
            await event.publish(relaySet);
            console.log(`[Store] ✓ Published kind:${event.kind} to invite relay`);
          }
        }
      }

      // 9. Publish to default relays
      console.log('[Store] Publishing events to default relays...');
      for (const event of events) {
        await event.publish();
        console.log(`[Store] ✓ Published kind:${event.kind} to default relays`);
      }

      this.state.hasCompletedInviteSetup = true;
      saveState(this.state);
      console.log('[Store] ✓ Invite setup complete');
    } catch (err) {
      console.error('[Store] ✗ Error during invite setup:', err);
      throw err;
    }
  }

  clear() {
    this.state = { ...DEFAULT_STATE };
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('voces-onboarding');
    }
  }
}

export const onboardingStore = new OnboardingStore();
