<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ndk } from '$lib/ndk.svelte';
	import { User as UserUI } from '$lib/ndk/ui/user';
	import UserCardClassic from '$lib/ndk/components/user-card-classic/user-card-classic.svelte';
	import { Popover } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { NDKUserProfile, NDKUser } from '@nostr-dev-kit/ndk';

	interface Props {
		pubkey: string;
		variant?: 'avatar' | 'avatar-name' | 'avatar-name-handle' | 'avatar-name-bio' | 'avatar-name-meta';
		avatarSize?: string;
		nameSize?: string;
		handleSize?: string;
		bioSize?: string;
		meta?: Snippet;
		showHoverCard?: boolean;
		onclick?: (e: MouseEvent) => void;
		class?: string;
	}

	const {
		pubkey,
		variant = 'avatar',
		avatarSize = 'w-10 h-10',
		nameSize = 'text-base font-semibold',
		handleSize = 'text-sm text-muted-foreground',
		bioSize = 'text-sm text-muted-foreground',
		meta,
		showHoverCard = true,
		onclick,
		class: className = ''
	}: Props = $props();

	let user = $state<NDKUser | undefined>(undefined);
	let profile = $state<NDKUserProfile | null>(null);

	$effect(() => {
		ndk.fetchUser(pubkey).then(u => {
			user = u;
			u?.fetchProfile().then(p => { profile = p; });
		});
	});

	let open = $state(false);
	let hoverTimeout: ReturnType<typeof setTimeout> | null = null;

	function handleMouseEnter() {
		if (!showHoverCard) return;
		if (hoverTimeout) clearTimeout(hoverTimeout);
		hoverTimeout = setTimeout(() => {
			open = true;
		}, 500);
	}

	function handleMouseLeave() {
		if (hoverTimeout) clearTimeout(hoverTimeout);
		hoverTimeout = setTimeout(() => {
			open = false;
		}, 100);
	}

	function handleClick(e: MouseEvent) {
		if (onclick) {
			onclick(e);
		} else if (user?.npub) {
			window.location.href = `/p/${user.npub}`;
		}
	}

	const displayName = $derived(profile?.displayName || profile?.name || `${pubkey?.slice(0, 8)}...`);
	const handle = $derived(profile?.name || pubkey?.slice(0, 8));
</script>

<Popover.Root bind:open>
	{#if variant === 'avatar'}
		<Popover.Trigger
			type="button"
			onclick={handleClick}
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
			class={cn("flex-shrink-0", className)}
		>
			<UserUI.Root {ndk} {pubkey}>
				<UserUI.Avatar class={cn(avatarSize, "cursor-pointer hover:opacity-80 transition-opacity")} />
			</UserUI.Root>
		</Popover.Trigger>
	{:else if variant === 'avatar-name'}
		<Popover.Trigger
			type="button"
			onclick={handleClick}
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
			class={cn("flex items-center gap-3 cursor-pointer", className)}
		>
			<UserUI.Root {ndk} {pubkey}>
				<UserUI.Avatar class={cn(avatarSize, "hover:opacity-80 transition-opacity")} />
			</UserUI.Root>
			<p class={cn(nameSize, "text-foreground truncate hover:underline flex-1 min-w-0 text-left")}>{displayName}</p>
		</Popover.Trigger>
	{:else if variant === 'avatar-name-handle'}
		<Popover.Trigger
			type="button"
			onclick={handleClick}
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
			class={cn("flex items-center gap-3 cursor-pointer text-left w-full", className)}
		>
			<UserUI.Root {ndk} {pubkey}>
				<UserUI.Avatar class={cn(avatarSize, "hover:opacity-80 transition-opacity flex-shrink-0")} />
			</UserUI.Root>
			<div class="flex-1 min-w-0 flex flex-col">
				<p class={cn(nameSize, "text-foreground truncate hover:underline")}>{displayName}</p>
				<p class={cn(handleSize, "truncate")}>@{handle}</p>
			</div>
		</Popover.Trigger>
	{:else if variant === 'avatar-name-bio'}
		<Popover.Trigger
			type="button"
			onclick={handleClick}
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
			class={cn("flex items-center gap-3 cursor-pointer text-left w-full", className)}
		>
			<UserUI.Root {ndk} {pubkey}>
				<UserUI.Avatar class={cn(avatarSize, "hover:opacity-80 transition-opacity flex-shrink-0")} />
			</UserUI.Root>
			<div class="flex-1 min-w-0">
				<p class={cn(nameSize, "text-foreground truncate hover:underline")}>{displayName}</p>
				{#if profile?.about}
					<p class={cn(bioSize, "truncate line-clamp-2")}>{profile.about}</p>
				{/if}
			</div>
		</Popover.Trigger>
	{:else if variant === 'avatar-name-meta'}
		<div
			role="button"
			tabindex="0"
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
			class={cn("flex items-center gap-3", className)}
		>
			<Popover.Trigger
				type="button"
				onclick={handleClick}
				class="flex-shrink-0"
			>
				<UserUI.Root {ndk} {pubkey}>
					<UserUI.Avatar class={cn(avatarSize, "cursor-pointer hover:opacity-80 transition-opacity")} />
				</UserUI.Root>
			</Popover.Trigger>
			<div class="flex-1 min-w-0">
				<Popover.Trigger
					type="button"
					onclick={handleClick}
					class="text-left w-full min-w-0"
				>
					<p class={cn(nameSize, "text-foreground truncate hover:underline")}>{displayName}</p>
				</Popover.Trigger>
				{#if meta}
					{@render meta()}
				{/if}
			</div>
		</div>
	{/if}

	{#if showHoverCard}
		<Popover.Portal>
			<Popover.Content
				class="z-50"
				sideOffset={8}
				onmouseenter={handleMouseEnter}
				onmouseleave={handleMouseLeave}
			>
				<UserCardClassic {ndk} {pubkey} />
			</Popover.Content>
		</Popover.Portal>
	{/if}
</Popover.Root>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
