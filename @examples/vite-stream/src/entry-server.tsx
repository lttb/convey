import { StrictMode } from 'react'
import type { RenderToPipeableStreamOptions } from 'react-dom/server'
import { renderToStream } from 'react-streaming/server'
import App from './App'

export function render(_url: string, options?: RenderToPipeableStreamOptions) {
  return renderToStream(
    <StrictMode>
      <App />
    </StrictMode>,
    {
      streamOptions: options,
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  )
}
