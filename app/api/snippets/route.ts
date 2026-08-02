import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "../../../db";
import { snippets, users } from "../../../db/schema";

export async function GET() {
  const db = await getDb();
  const rows = await db.select({ id: snippets.id, slug: snippets.slug, title: snippets.title, description: snippets.description, language: snippets.language, code: snippets.code, authorName: users.name, createdAt: snippets.createdAt, views: snippets.views }).from(snippets).innerJoin(users, eq(snippets.userId, users.id)).where(eq(snippets.visibility, "public")).orderBy(desc(snippets.createdAt)).limit(30);
  return Response.json({ snippets: rows });
}

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  if (!email) return Response.json({ error: "Silakan masuk untuk mengunggah kode" }, { status: 401 });
  const encodedName = requestHeaders.get("oai-authenticated-user-full-name");
  const name = encodedName ? decodeURIComponent(encodedName) : email.split("@")[0];
  const body = await request.json() as { title?: string; description?: string; language?: string; code?: string };
  const title = body.title?.trim() || "";
  const code = body.code?.trim() || "";
  if (!title || !code) return Response.json({ error: "Judul dan kode wajib diisi" }, { status: 400 });
  if (code.length > 100000) return Response.json({ error: "Kode maksimal 100 KB" }, { status: 400 });
  const db = await getDb();
  await db.insert(users).values({ email, name }).onConflictDoUpdate({ target: users.email, set: { name } });
  const [account] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "snippet";
  const slug = `${base}-${crypto.randomUUID().slice(0, 6)}`;
  const [snippet] = await db.insert(snippets).values({ slug, userId: account.id, title, description: body.description?.trim() || "", language: body.language || "Lainnya", code }).returning();
  return Response.json({ snippet: { ...snippet, authorName: name, createdAt: "Baru saja" } }, { status: 201 });
}
