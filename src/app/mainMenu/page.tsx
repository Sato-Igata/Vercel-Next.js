// app/mainMenu/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import MainMenuClient from "./MainMenuClient";

const API_INTERNAL_BASE =
  process.env.API_INTERNAL_BASE ?? "http://server";

export const dynamic = "force-dynamic";

type MeResponse = {
  user?: { id: number; username: string; email: string | null; tele: string | null };
};

export default async function MainMenuPage() {
  const h = await headers();
  const cookieHeader = h.get("cookie") ?? "";

  let res: Response;
  try {
    res = await fetch(`${API_INTERNAL_BASE}/api/auth/me`, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
        accept: "application/json",
      },
      cache: "no-store",
    });
  } catch (e) {
    console.error("SERVER fetch failed:", API_INTERNAL_BASE, e);
    redirect("/signIn");
  }

  if (!res.ok) redirect("/signIn");

  const data = (await res.json()) as MeResponse;
  if (!data.user) redirect("/signIn");

  return <MainMenuClient user={data.user} />;
}
