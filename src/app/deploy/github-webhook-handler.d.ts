declare module 'github-webhook-handler' {
  import type { IncomingMessage, ServerResponse } from 'node:http'

  interface WebhookEvent {
    payload: any
    event: string
  }

  interface Handler {
    (req: IncomingMessage, res: ServerResponse, callback: (err?: Error) => void): void
    on: {
      (event: 'error', listener: (err: Error) => void): void
      (event: 'push' | 'issues' | string, listener: (event: WebhookEvent) => void): void
    }
  }

  interface HandlerOptions {
    path: string
    secret: string
  }

  function createHandler(options: HandlerOptions): Handler
  export default createHandler
}
