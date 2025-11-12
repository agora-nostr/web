<!--
	Installed from @ndk/svelte@latest
-->

<script lang="ts">
	import { getContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { NotificationContext } from './notification.context';
	import { NOTIFICATION_CONTEXT_KEY } from './notification.context';
	import AvatarGroup from '../../components/avatar-group/avatar-group.svelte';

	interface Props {
		max?: number;
		size?: number;
		spacing?: 'tight' | 'normal' | 'loose';
		snippet?: Snippet<[{ pubkeys: string[]; count: number }]>;
		children?: Snippet;
		class?: string;
	}

	let { max = 5, size = 32, spacing = 'tight', snippet, children, class: className }: Props = $props();

	const context = getContext<NotificationContext>(NOTIFICATION_CONTEXT_KEY);
</script>

{#if children}
	{@render children()}
{:else if snippet}
	{@render snippet({ pubkeys: context.actors, count: context.actors.length })}
{:else}
	<AvatarGroup ndk={context.ndk} pubkeys={context.actors} {max} {size} {spacing} />
{/if}
