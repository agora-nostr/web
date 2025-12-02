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
    return DEFAULT_STATE;
  }

  try {
    const stored = sessionStorage.getItem('voces-onboarding');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only restore if there's an active invite, otherwise start fresh at step 1
      if (parsed.invite) {
        return { ...DEFAULT_STATE, ...parsed };
      } else {
        return DEFAULT_STATE;
      }
    } else {
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
    this.state.invite = invite;

    // Pre-fill profile name if available
    if (invite.recipientName && !this.state.profileData.name) {
      this.state.profileData.name = invite.recipientName;
    }

    // Set language based on agora relay
    if (invite.inviteRelay) {
      const agoraLanguage = getAgoraLanguage(invite.inviteRelay);
      if (agoraLanguage) {
        settings.setLanguage(agoraLanguage);
        locale.set(agoraLanguage);
      }
    }

    // Skip to step 3 (features) when using invite
    this.state.currentStep = 3;

    saveState(this.state);
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

    if (this.state.hasPublishedInviteConfirmation) {
      return;
    }

    const invite = this.state.invite;

    if (!invite?.inviteEventId || !invite?.inviter || !invite?.inviteRelay || !invite?.inviteCode) {
      console.warn('[Store] ✗ Missing required invite data for confirmation');
      return;
    }

    try {
      const confirmationEvent = new NDKEvent(ndk);
      confirmationEvent.kind = 514;
      confirmationEvent.content = '';
      confirmationEvent.tags = [
        ['e', invite.inviteEventId],
        ['p', invite.inviter],
        ['code', invite.inviteCode],
      ];
      confirmationEvent.isProtected = true;

      await confirmationEvent.sign();

      // Publish ONLY to the invite relay
      const relay = ndk.pool.getRelay(invite.inviteRelay, true);
      if (relay) {
        const relaySet = new NDKRelaySet(new Set([relay]), ndk);
        await confirmationEvent.publish(relaySet);

        // Set the invite relay as the selected relay in settings
        settings.setSelectedRelay(invite.inviteRelay);

        // Also ensure the relay is in the user's relay list
        const existingRelay = settings.relays.find(r => r.url === invite.inviteRelay);
        if (!existingRelay) {
          settings.addRelay({
            url: invite.inviteRelay,
            read: true,
            write: true,
            enabled: true
          });
        } else {
        }

        // Mark as published
        this.state.hasPublishedInviteConfirmation = true;
        saveState(this.state);
      } else {
        console.error('[Store] ✗ Failed to get relay:', invite.inviteRelay);
      }
    } catch (err) {
      console.error('[Store] ✗ Error publishing invite confirmation:', err);
      throw err;
    }
  }


  async publishProfileAndSetup(signer: NDKPrivateKeySigner) {
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


      // Publish all events to default relays
      for (const event of events) {
        await event.publish();
      }

    } catch (err) {
      console.error('[Store] ✗ Error publishing profile and setup:', err);
      throw err;
    }
  }

  async completeInviteSetup(signer: NDKPrivateKeySigner) {

    if (this.state.hasCompletedInviteSetup) {
      return;
    }

    if (!this.hasInvite) {
      return;
    }

    try {

      // Only publish the kind:514 invite confirmation event
      // Do NOT touch kind:0 (profile) or kind:3 (contacts)
      await this.publishInviteConfirmation(signer);

      this.state.hasCompletedInviteSetup = true;
      saveState(this.state);
    } catch (err) {
      await this.publishInviteConfirmation(signer);
      console.error('[Store] ✗ Error during invite acceptance:', err);
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
