import { eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { snippets } from "../../../db/schema";

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const db = await getDb();
  const [snippet] = await db.select().from(snippets).where(eq(snippets.slug, slug)).limit(1);
  if (!snippet || snippet.visibility !== "public") return new Response("Snippet tidak ditemukan", { status: 404 });
  await db.update(snippets).set({ views: sql`${snippets.views} + 1` }).where(eq(snippets.id, snippet.id));
  return new Response(snippet.code, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=60" } });
}
