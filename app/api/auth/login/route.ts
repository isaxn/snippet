import bcrypt from "bcryptjs";
import { createSession } from "../../../../lib/auth";
import { ensureSchema, pool } from "../../../../lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    if (!email || !password) return Response.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    await ensureSchema();
    const result = await pool.query<{ id: string; name: string; email: string; password_hash: string }>(
      "SELECT id::text, name, email, password_hash FROM users WHERE email = $1 LIMIT 1",
      [email]
    );
    const account = result.rows[0];
    if (!account || !(await bcrypt.compare(password, account.password_hash))) {
      return Response.json({ error: "Email atau password salah" }, { status: 401 });
    }
    await createSession(account.id);
    return Response.json({ user: { id: account.id, name: account.name, email: account.email } });
  } catch (error) {
    console.error("login_error", error);
    return Response.json({ error: "Login gagal. Coba lagi." }, { status: 500 });
  }
}
