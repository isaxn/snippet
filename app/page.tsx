import ShareCodeApp from "./sharecode-app";
import { getSessionUser } from "./auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSessionUser();
  return <ShareCodeApp user={user ? { name: user.name, email: user.email } : null} />;
}
