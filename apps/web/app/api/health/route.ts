import { NextResponse } from 'next/server'
import { prisma } from '@crm/db'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, db: 'connected', uptime: process.uptime() })
  } catch {
    return NextResponse.json({ ok: false, db: 'disconnected' }, { status: 503 })
  }
}
