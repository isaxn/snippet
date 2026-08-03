import bcrypt from "bcryptjs"
import { createSession } from "../../../auth"
import { query } from "../../../../db"

export async function POST(request: Request) {
  const body = await request.json() as { name?: string; email?: string; password?: string }
  const name = body.name?.trim().slice(0, 80) ?? ""
  const email = body.email?.trim().toLowerCase().slice(0, 190) ?? ""
  const password = body.password ?? ""
  if (name.length < 2) return Response.json({ error: "Nama minimal 2 karakter" }, { status: 400 })
  if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Email tidak valid" }, { status: 400 })
  if (password.length < 8) return Response.json({ error: "Password minimal 8 karakter" }, { status: 400 })
  const exists = await query("SELECT id FROM users WHERE email = $1 LIMIT 1", [email])
  if (exists.rowCount) return Response.json({ error: "Email sudah terdaftar" }, { status: 409 })
  const passwordHash = await bcrypt.hash(password, 12)
  const created = await query<{ id: string }>("INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id::text", [name, email, passwordHash])
  await createSession(created.rows[0].id)
  return Response.json({ user: { name, email } }, { status: 201 })
}
