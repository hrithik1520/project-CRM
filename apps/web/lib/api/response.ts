import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 })
}

export function noContent() {
  return new NextResponse(null, { status: 204 })
}

export function badRequest(message: string, code?: string) {
  return NextResponse.json({ error: message, code: code ?? 'BAD_REQUEST' }, { status: 400 })
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export function notFound(entity = 'Resource') {
  return NextResponse.json({ error: `${entity} not found` }, { status: 404 })
}

export function conflict(message: string) {
  return NextResponse.json({ error: message, code: 'CONFLICT' }, { status: 409 })
}

export function serverError(err: unknown) {
  const message = err instanceof Error ? err.message : 'Internal server error'
  console.error('[API Error]', err)
  return NextResponse.json({ error: message }, { status: 500 })
}
