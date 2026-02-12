"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
const DonePage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [textMsg, setTextMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("userid", "");
      sessionStorage.setItem("useremail", "");
      sessionStorage.setItem("userpassword", "");
      sessionStorage.setItem("groupid", "");
    }

    const pageid =
      Number(searchParams.get("pagenum") || searchParams.get("pagetrigger")) ||
      0;

    const triggerParam = searchParams.get("pagetrigger");
    if (triggerParam) {
      const text2 =
        "パスワードの変更が完了しました。<br>ログイン画面にて、サインインしてください。";
      setTextMsg(text2);
      return;
    }

    const fetchData = async () => {
      const setdata = {
        id: pageid,
      };
      try {
        const response = await fetch(`${API_BASE}/api/auth/done`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify(setdata),
        });

        const result = await response.json();

        if (response.ok) {
          console.log("確認成功:", result);
          if (typeof window !== "undefined") {
            if (result.tele !== "") {
              sessionStorage.setItem("useremail", result.tele);
            } else {
              sessionStorage.setItem("useremail", result.email);
            }
          }

          let text1 = "";
          if (result.username !== "") {
            text1 = `${result.username}様`;
          }

          let text2 = "";
          if (result.subjectstatus === 1) {
            text2 = `<br>${text1}<br><br>ユーザー情報の登録が完了しました。<br>ログイン画面にて、サインインしてください。`;
          } else if (result.subjectstatus === 2 || result.subjectstatus === 3) {
            text2 = `<br>${text1}<br><br>パスワードの変更が完了しました。<br>ログイン画面にて、サインインしてください。`;
          }
          setTextMsg(text2);
        } else {
          console.error("確認失敗:", result.error);
          alert(result.error || "確認エラー");
        }
      } catch (error) {
        console.error("通信エラー:", error);
        alert("通信エラーが発生しました");
      }
    };

    if (pageid) {
      fetchData();
    }
  }, [searchParams]);

  const goSignIn = () => {
    router.push("/signIn");
  };

  return (
    <div className="container">
      <h1 className="top-title">HUNTER×HUNTER</h1>

      <div className="center-container">
        <form>
          <div className="comp-message">完了しました！</div>
          <div
            className="comp-message text-msg"
            id="textMsg"
            dangerouslySetInnerHTML={{ __html: textMsg }}
          />
          <button
            type="button"
            className="exe-button"
            id="nextBtn"
            onClick={goSignIn}
          >
            ログイン画面へ
          </button>
        </form>
      </div>

      <div className="app-name">© HUNTER×HUNTER</div>
    </div>
  );
};

export default DonePage;
