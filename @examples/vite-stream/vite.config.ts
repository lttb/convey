import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import convey from '@convey/vite-plugin'
import type { Plugin } from 'vite'

export default defineConfig({
	plugins: [
		react(),
		convey({
			remote: {
				server: ['**/resolvers/web/**'],
				client: ['**/resolvers/server/**'],
			},
		}),
		cssLinkPlugin(),
	],
})

function cssLinkPlugin(): Plugin {
	return {
		name: 'vite-css-link',
		transformIndexHtml(html, ctx) {
			// Only apply in development
			if (!ctx.server) return html

			// Get all CSS modules from the server
			const cssModules = Array.from(
				ctx.server.moduleGraph.urlToModuleMap.entries(),
			)
				.filter(([url]) => url.endsWith('.css'))
				.map(([url]) => url)

			// Create link tags
			const links = cssModules
				.map((css) => `<link rel="stylesheet" href="${css}">`)
				.join('\n')

			return html.replace('</head>', `${links}</head>`)
		},
	}
}
