<script lang="ts">
  import { ndkReady } from "$lib/ndk.svelte";
  import { settings } from "$lib/stores/settings.svelte";
  import { walletStore, WalletSetupModal } from "$lib/features/wallet";
  import { browser } from "$app/environment";
  import { locale } from "svelte-i18n";
  import { initializeI18n } from "$i18n/config";
  import Toaster from "$lib/components/Toaster.svelte";
  import LoginModal from "$lib/components/LoginModal.svelte";
  import RelayAuthModal from "$lib/components/RelayAuthModal.svelte";
  import PWAInstallPrompt from "$lib/components/PWAInstallPrompt.svelte";
  import SplashScreen from "$lib/components/SplashScreen.svelte";
  import { applyThemeColor } from "$lib/theme/colors";
  import { fade } from "svelte/transition";
  import "../app.css";
  import type { Snippet } from "svelte";

  import { defaultContentRenderer } from "$lib/ndk/ui/content-renderer/index.js";

  import "$lib/ndk/components/hashtag/";
  import "$lib/ndk/components/mention-modern/";
  import "$lib/ndk/components/link-inline-basic/";
  import "$lib/ndk/components/article-card-compact/";
  import "$lib/ndk/components/event-card-classic/";
  import "$lib/ndk/components/event-card-compact/";
  import "$lib/ndk/components/media-carousel";
  // import "$lib/ndk/components/event-card-generic/";
  // import Media from "$lib/ndk/components/media-render-bento-grid";
  import { NDKKind, type NDKEvent } from "@nostr-dev-kit/ndk";
  import { goto } from "$app/navigation";

  // defaultContentRenderer.mediaComponent = Media;
  defaultContentRenderer.onEventClick = (event: NDKEvent) => {
    if (event.kind === NDKKind.Article) {
      goto(`/article/${event.encode()}`);
    } else {
      goto(`/e/${event.encode()}`);
    }
  };

  interface Props {
    children: Snippet;
  }

  const { children }: Props = $props();

  let ready = $state(false);
  let showWalletSetup = $state(false);

  // Watch for wallet setup needs when user logs in
  $effect(() => {
    if (ready && walletStore.needsSetup) {
      showWalletSetup = true;
    }
  });

  // Initialize i18n (only in browser)
  if (browser) {
    initializeI18n(settings.language);

    // Sync locale changes with settings
    $effect(() => {
      locale.set(settings.language);
    });
  }

  // Initialize theme immediately to prevent flash
  if (browser) {
    const theme = settings.theme;
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.add("light");
    }

    // Initialize theme color - apply directly to ensure it happens
    applyThemeColor(settings.themeColor);

    // Wait for NDK cache to be initialized before mounting the app
    ndkReady.then(() => {
      walletStore.restore();
      ready = true;
    });
  } else {
    // On server, always render
    ready = true;
  }
</script>

<Toaster />

<SplashScreen visible={!ready} />

{#if ready}
  <div transition:fade={{ duration: 300 }}>
    {@render children()}
    <PWAInstallPrompt />
    <RelayAuthModal />
  </div>
{/if}

<!-- Login Modal - Outside transition wrapper to prevent z-index stacking issues -->
<LoginModal />

<!-- Wallet Setup Modal - For users without a wallet configured -->
<WalletSetupModal bind:open={showWalletSetup} />
