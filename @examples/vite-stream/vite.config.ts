import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import convey from '@convey/vite-plugin'

export default defineConfig({
	plugins: [
		react(),
		convey({
			remote: {
				server: ['**/resolvers/web/**'],
				client: ['**/resolvers/server/**'],
			},
		}),
	],
})
