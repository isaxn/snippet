import bcrypt from "bcryptjs";
import { createSession } from "../../../../lib/auth";
import { ensureSchema, pool } from "../../../../lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: string; email?: string; password?: string };
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    if (name.length < 2) return Response.json({ error: "Nama minimal 2 karakter" }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Email tidak valid" }, { status: 400 });
    if (password.length < 8) return Response.json({ error: "Password minimal 8 karakter" }, { status: 400 });
    await ensureSchema();
    const passwordHash = await bcrypt.hash(password, 11);
    const result = await pool.query<{ id: string; name: string; email: string }>(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id::text, name, email",
      [name, email, passwordHash]
    );
    await createSession(result.rows[0].id);
    return Response.json({ user: result.rows[0] }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return Response.json({ error: "Email sudah terdaftar" }, { status: 409 });
    console.error("register_error", error);
    return Response.json({ error: "Pendaftaran gagal. Coba lagi." }, { status: 500 });
  }
}
