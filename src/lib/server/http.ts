import type { SessionPayload } from './session'

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export function assertOwn(session: SessionPayload, userId: string): void {
  if (session.user_id !== userId) throw new HttpError(403, 'forbidden')
}

export function toResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return Response.json({ error: err.message }, { status: err.status })
  }
  console.error(err)
  return Response.json({ error: 'internal error' }, { status: 500 })
}
