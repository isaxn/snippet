import { query } from "../../../db"

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const result = await query<{ id: string; code: string }>("SELECT id::text, code FROM snippets WHERE slug = $1 AND visibility = 'public' LIMIT 1", [slug])
  const snippet = result.rows[0]
  if (!snippet) return new Response("Snippet tidak ditemukan", { status: 404 })
  await query("UPDATE snippets SET views = views + 1 WHERE id = $1", [snippet.id])
  return new Response(snippet.code, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=60" } })
}
