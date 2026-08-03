import { getSessionUser } from "../../auth"
import { query } from "../../../db"

type SnippetRow = { id: string; slug: string; title: string; description: string; language: string; code: string; authorName: string; createdAt: string; views: number }

export async function GET() {
  try {
    const result = await query<SnippetRow>(`
      SELECT s.id::text, s.slug, s.title, s.description, s.language, s.code,
        u.name AS "authorName", s.created_at::text AS "createdAt", s.views
      FROM snippets s
      JOIN users u ON u.id = s.user_id
      WHERE s.visibility = 'public'
      ORDER BY s.created_at DESC
      LIMIT 30
    `)
    return Response.json({ snippets: result.rows })
  } catch {
    return Response.json({ error: "Database belum siap" }, { status: 503 })
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: "Silakan masuk untuk mengunggah kode" }, { status: 401 })
  const body = await request.json() as { title?: string; description?: string; language?: string; code?: string }
  const title = body.title?.trim() ?? ""
  const code = body.code?.trim() ?? ""
  const description = body.description?.trim().slice(0, 180) ?? ""
  const language = body.language?.trim().slice(0, 30) || "Lainnya"
  if (!title || !code) return Response.json({ error: "Judul dan kode wajib diisi" }, { status: 400 })
  if (title.length > 80) return Response.json({ error: "Judul maksimal 80 karakter" }, { status: 400 })
  if (code.length > 100000) return Response.json({ error: "Kode maksimal 100 KB" }, { status: 400 })
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "snippet"
  const slug = `${base}-${crypto.randomUUID().slice(0, 8)}`
  const result = await query<SnippetRow>(`
    INSERT INTO snippets (slug, user_id, title, description, language, code)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id::text, slug, title, description, language, code, $7::text AS "authorName", created_at::text AS "createdAt", views
  `, [slug, user.id, title, description, language, code, user.name])
  return Response.json({ snippet: result.rows[0] }, { status: 201 })
}
