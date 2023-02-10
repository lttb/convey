const next = require('next')
const devcert = require('devcert')
const http2 = require('http2')
const {parse} = require('url')

const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'

const app = next({dev, conf: require('../next.config')})
const handle = app.getRequestHandler()

app.prepare().then(async () => {
    http2
        .createSecureServer(
            await devcert.certificateFor('localhost'),
            (req, res) => {
                // Be sure to pass `true` as the second argument to `url.parse`.
                // This tells it to parse the query portion of the URL.
                const parsedUrl = parse(req.url, true)

                handle(req, res, parsedUrl)
            },
        )
        .listen(port, (err) => {
            if (err) throw err
            console.log(`> Ready on https://localhost:${port}`)
        })
})
