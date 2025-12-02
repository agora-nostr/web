<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";

	interface Props extends DialogPrimitive.RootProps {
		open?: boolean;
	}

	let { open = $bindable(false), onOpenChange, ...restProps }: Props = $props();
</script>

<DialogPrimitive.Root bind:open {onOpenChange} {...restProps} />
