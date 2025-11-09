import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: {
		runes: true
	},
	vitePlugin: {
		dynamicCompileOptions({ filename }) {
			// Disable runes mode for packages that use legacy Svelte syntax ($$restProps)
			if (filename?.includes('node_modules/svelte-motion') ||
					filename?.includes('node_modules/vaul-svelte')) {
				return { runes: false };
			}
		}
	},
	kit: {
		adapter: adapter({
			fallback: 'index.html'
		}),
		alias: {
			'$lib': './src/lib',
			'$i18n': './src/i18n',
			'$ndk': './src/lib/components/ndk'
		}
	},
	onwarn: (warning, handler) => {
		// Suppress legacy export warnings from Storybook addon packages
		if (warning.code === 'legacy_export_invalid' && warning.filename?.includes('node_modules/@storybook')) {
			return;
		}
		handler(warning);
	}
};

export default config;
