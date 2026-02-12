// app/groupCreate/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import GroupCreateClient from "./GroupCreateClient";

export const dynamic = "force-dynamic";

// Docker 内で Laravel に到達できる URL（mainMenu と同じ）
const API_INTERNAL_BASE = process.env.API_INTERNAL_BASE ?? "http://server";

type Device = {
  id: number;
  name: string;
  checked: boolean;
};

type UserRes = {
  user?: { id: number; name?: string; username?: string };
};

export default async function GroupCreatePage() {
  const h = await headers();
  const cookieHeader = h.get("cookie") ?? "";

  // 1) 未ログインなら /login-1 へ
  const meRes = await fetch(`${API_INTERNAL_BASE}/api/auth/me`, {
    method: "GET",
    headers: {
      cookie: cookieHeader,
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (!meRes.ok) redirect("/signIn");

  // 2) ユーザー名取得（/api/user）
  let userName = "";
  try {
    const userRes = await fetch(`${API_INTERNAL_BASE}/api/user`, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (userRes.ok) {
      const u = (await userRes.json()) as UserRes;
      userName = (u.user?.name ?? u.user?.username ?? "") as string;
    } else {
      console.log('NO(user)');
    }
  } catch {
    console.log('エラー(user)');
  }

  // 3) デバイス取得（/api/getUserDevice.php）
  let devices: Device[] = [];
  try {
    const devRes = await fetch(`${API_INTERNAL_BASE}/api/getUserDevice`, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (devRes.ok) {
      const result = await devRes.json();
      const names: string[] = result.name ?? result.namelist ?? [];
      const ids: number[] = result.id ?? result.idlist ?? [];

      devices = ids.map((id: number, idx: number) => ({
        id,
        name: names[idx] ?? "",
        checked: false,
      }));
    } else {
      console.log('NO(getUserDevice)', devRes);
    }
  } catch {
    console.log('エラー(getUserDevice)');
  }

  return <GroupCreateClient initialUserName={userName} initialDevices={devices} />;
}
