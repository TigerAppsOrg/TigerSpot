import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		host: true, // Listen on all network interfaces (accessible via local IP)
		fs: {
			// Allow serving files from the monorepo root node_modules
			allow: ['../..']
		}
	}
});
