import bcrypt from "bcryptjs"
import { createSession } from "../../../auth"
import { query } from "../../../../db"

export async function POST(request: Request) {
  const body = await request.json() as { email?: string; password?: string }
  const email = body.email?.trim().toLowerCase() ?? ""
  const password = body.password ?? ""
  const result = await query<{ id: string; name: string; email: string; password_hash: string }>("SELECT id::text, name, email, password_hash FROM users WHERE email = $1 LIMIT 1", [email])
  const user = result.rows[0]
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return Response.json({ error: "Email atau password salah" }, { status: 401 })
  await createSession(user.id)
  return Response.json({ user: { name: user.name, email: user.email } })
}
