<!--
	Installed from @ndk/svelte@latest
-->

<script lang="ts">
	import { getContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { NotificationContext } from './notification.context';
	import { NOTIFICATION_CONTEXT_KEY } from './notification.context';
	import { createTimeAgo } from '../../utils/time-ago';
	import { cn } from '../../utils/cn.js';

	interface Props {
		snippet?: Snippet<[{ timestamp: number; formatted: string }]>;
		class?: string;
		children?: Snippet;
	}

	let { snippet, class: className, children }: Props = $props();

	const context = getContext<NotificationContext>(NOTIFICATION_CONTEXT_KEY);

	const formatted = createTimeAgo(context.notification.mostRecentAt);
</script>

{#if children}
	{@render children()}
{:else if snippet}
	{@render snippet({
		timestamp: context.notification.mostRecentAt,
		formatted
	})}
{:else}
	<time
		datetime={new Date(context.notification.mostRecentAt * 1000).toISOString()}
		class={cn('text-xs text-muted-foreground', className)}
	>
		{formatted}
	</time>
{/if}
