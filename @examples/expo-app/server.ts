export const server = Bun.serve({
	fetch(req) {
		return new Response('Bun!')
	},
})

process.on('exit', () => {
	server.stop()
})
