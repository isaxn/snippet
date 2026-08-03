import { createHash, randomBytes } from "node:crypto"
import { cookies } from "next/headers"
import { query } from "../db"

const cookieName = "sharecode_session"
const sessionDays = 30

export type SessionUser = { id: string; name: string; email: string }

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + sessionDays * 86400000)
  await query("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)", [userId, hashToken(token), expiresAt])
  const store = await cookies()
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  })
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(cookieName)?.value
  if (!token) return null
  const result = await query<SessionUser>(`
    SELECT u.id::text, u.name, u.email
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = $1 AND s.expires_at > NOW()
    LIMIT 1
  `, [hashToken(token)])
  return result.rows[0] ?? null
}

export async function destroySession() {
  const store = await cookies()
  const token = store.get(cookieName)?.value
  if (token) await query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)])
  store.delete(cookieName)
}
