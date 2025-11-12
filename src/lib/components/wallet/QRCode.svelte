<script lang="ts">
  import QRCode from "qrcode";

  interface Props {
    value: string;
    size?: number;
  }

  let { value, size = 300 }: Props = $props();
  let canvas: HTMLCanvasElement;

  $effect(() => {
    if (value && canvas) {
      generateQR();
    }
  });

  async function generateQR() {
    if (!canvas || !value) return;

    try {
      // Create a temporary element to get computed RGB values from CSS variables
      const tempEl = document.createElement("div");
      tempEl.style.display = "none";
      document.body.appendChild(tempEl);

      // Apply CSS variables and get computed colors
      tempEl.style.color = "var(--color-foreground)";
      const foreground = getComputedStyle(tempEl).color;

      tempEl.style.color = "var(--color-background)";
      const background = getComputedStyle(tempEl).color;

      document.body.removeChild(tempEl);

      await QRCode.toCanvas(canvas, value, {
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    } catch (err) {
      console.error("QR Code generation failed:", err);
    }
  }
</script>

<canvas bind:this={canvas}></canvas>
