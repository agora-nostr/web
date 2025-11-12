<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		onOpenChange,
		breakpoint = '(min-width: 768px)',
		children
	}: {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		breakpoint?: string;
		children: Snippet<[{ isDesktop: boolean }]>;
	} = $props();

	const isDesktop = new MediaQuery(breakpoint);
</script>

<Dialog.Root bind:open {onOpenChange}>
	{@render children({ isDesktop: isDesktop.current })}
</Dialog.Root>
