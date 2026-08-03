import { currentUser } from "../../../lib/auth";
import { ensureSchema, pool } from "../../../lib/db";

export async function GET() {
  try {
    await ensureSchema();
    const result = await pool.query(`
      SELECT s.id, s.slug, s.title, s.description, s.language, s.code,
             u.name AS "authorName", s.created_at AS "createdAt", s.views
      FROM snippets s JOIN users u ON u.id = s.user_id
      WHERE s.visibility = 'public'
      ORDER BY s.created_at DESC LIMIT 30
    `);
    return Response.json({ snippets: result.rows });
  } catch (error) {
    console.error("snippets_get_error", error);
    return Response.json({ snippets: [] });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return Response.json({ error: "Silakan masuk untuk mengunggah kode" }, { status: 401 });
    const body = await request.json() as { title?: string; description?: string; language?: string; code?: string };
    const title = body.title?.trim() ?? "";
    const code = body.code?.trim() ?? "";
    if (!title || !code) return Response.json({ error: "Judul dan kode wajib diisi" }, { status: 400 });
    if (code.length > 100000) return Response.json({ error: "Kode maksimal 100 KB" }, { status: 400 });
    await ensureSchema();
    const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "snippet";
    const slug = `${base}-${crypto.randomUUID().slice(0, 6)}`;
    const result = await pool.query(`
      INSERT INTO snippets (slug, user_id, title, description, language, code)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, slug, title, description, language, code, created_at AS "createdAt", views
    `, [slug, user.id, title, body.description?.trim() ?? "", body.language ?? "Lainnya", code]);
    return Response.json({ snippet: { ...result.rows[0], authorName: user.name } }, { status: 201 });
  } catch (error) {
    console.error("snippets_post_error", error);
    return Response.json({ error: "Gagal mempublikasikan snippet" }, { status: 500 });
  }
}
