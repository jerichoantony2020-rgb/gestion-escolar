import { randomBytes } from "crypto"

const attempts = new Map<string, { count: number; blockedUntil?: number }>()

export function checkRateLimit(key: string): { allowed: boolean; waitMs?: number } {
  const now = Date.now()
  const entry = attempts.get(key)
  if (entry?.blockedUntil && now < entry.blockedUntil) {
    return { allowed: false, waitMs: entry.blockedUntil - now }
  }
  const count = entry?.blockedUntil ? 1 : (entry?.count ?? 0) + 1
  if (count > 5) {
    const blockedUntil = now + 30 * 60 * 1000
    attempts.set(key, { count: 0, blockedUntil })
    return { allowed: false, waitMs: 30 * 60 * 1000 }
  }
  attempts.set(key, { count })
  return { allowed: true }
}

export function resetRateLimit(key: string) {
  attempts.delete(key)
}

export function generatePortalCode(): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = randomBytes(8)
  return Array.from(bytes).map(b => charset[b % charset.length]).join("")
}
