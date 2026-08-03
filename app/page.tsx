import ShareCodeApp from "./sharecode-app";
import { currentUser } from "../lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await currentUser().catch(() => null);
  return <ShareCodeApp user={user ? { name: user.name, email: user.email } : null} />;
}
