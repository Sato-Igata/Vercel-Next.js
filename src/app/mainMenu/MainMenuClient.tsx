// app/mainMenu/MainMenuClient.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import "../css/mainMenu.css";

type User = { id: number; username: string; email: string | null; tele: string | null };
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export default function MainMenuClient({ user }: { user: User }) {
  const router = useRouter();

  // 支払い設定チェック用
  const [dataFlag, setDataFlag] = useState<number>(0);
  const [popOpen, setPopOpen] = useState<boolean>(false);
  // ---- エラーポップ ----
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorTitle] = useState("⚠ エラー");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorStatus, setErrorStatus] = useState(1);
  // ログアウト用
  const [logoutPop, setLogoutPop] = useState<boolean>(false);
  // ドロップダウン用
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    window.sessionStorage.setItem("groupid", "");

    const getPlanData = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/getPlanData`, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
          cache: "no-store",
        });

        const result = await response.json();

        if (response.ok) {
          // result.flag が 0/1 の想定
          setDataFlag(Number(result.flag ?? 0));
        } else {
          console.error("確認失敗:", result?.error);
          popChange(result.error || "取得エラーが発生しました", result.status || 1);
        }
      } catch (error) {
        console.error("通信エラー:", error);
        alert("通信エラーが発生しました");
      }
    };

    getPlanData();
  }, []);

  // ===== ポップアップ操作 =====
  const openPop = () => {
    document.body.style.overflow = "hidden";
    setPopOpen(true);
  };

  const closePop = () => {
    document.body.style.overflow = "";
    setPopOpen(false);
  };

  const goOrPop = (next: string, before?: () => void) => {
    if (dataFlag === 0) {
      openPop();
      return;
    }
    before?.();
    router.push(next);
  };

  // ===== ログアウトポップアップ操作（MyPageと同じ）=====
  const openLogoutPop = () => {
    setLogoutPop(true);
    setMenuOpen(false);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  };

  const closeLogoutPop = () => {
    setLogoutPop(false);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
      });

      const result = await response.json();

      if (response.ok) {
        console.log("ログイン情報削除成功:", result.message);
      } else {
        console.error("ログイン情報削除失敗:", result.error);
        alert(result.error || "ログイン情報削除エラー");
      }
    } catch (error) {
      console.error("通信エラー:", error);
      alert("通信エラーが発生しました");
    }

    if (typeof window !== "undefined") {
      sessionStorage.setItem("userid", "");
      sessionStorage.setItem("useremail", "");
      sessionStorage.setItem("userpassword", "");
      sessionStorage.setItem("groupid", "");
    }

    closeLogoutPop();
    router.push("/signIn");
  };

  const popChange = (errortext: string, errorst: number) => {
    setErrorMessage(errortext);
    setErrorStatus(errorst); //errorst = 2のときerrorpop-close押下時、/signInに遷移する
    setErrorOpen(true);
  };
  
  const handleErrorClose = () => {
    setErrorOpen(false);

    if (errorStatus === 2) {
      router.push("/signIn");
    }
  };
  
  return (
    <>
      <div className="container">
        {/* ドロップダウン */}
        <div className="dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="material-symbols-outlined"
            onClick={(e) => {
              e.stopPropagation(); // ドキュメントクリックに伝播させない
              setMenuOpen((v) => !v);
            }}
            aria-expanded={menuOpen}
          >
            account_circle
          </button>
          <ul className={`dropdown-menu ${menuOpen ? "show" : ""}`}>
            <li><a href="/myPage" className="dropdown-menu-a">
              <div className="dropdown-menu-a-div">
                マイページ　→
              </div>
            </a></li>
            <li><a href="/contact" className="dropdown-menu-a">
              <div className="dropdown-menu-a-div">
                問い合わせ　→
              </div>
            </a></li>
            <li className="divider"></li>
            <li>
              <a
                href="#" className="dropdown-menu-a danger"
                onClick={(e) => {
                  e.preventDefault();
                  openLogoutPop();
                }}
              >
                <div className="dropdown-menu-a-div">
                  ログアウト　→
                </div>
              </a>
            </li>
          </ul>
        </div>

        <div className="title">メインメニュー</div>

        <button type="button" className="menu-button" onClick={() => goOrPop("/groupList")}>
          グループ一覧
        </button>

        <button type="button" className="menu-button" onClick={() => goOrPop("/groupCreate")}>
          グループ作成
        </button>

        <button type="button" className="menu-button" onClick={() => goOrPop("/groupJoin")}>
          グループ参加
        </button>

        <button
          type="button"
          className="menu-button"
          onClick={() =>
            goOrPop("/map", () => window.sessionStorage.setItem("mapFlag", "2"))
          }
        >
          ポイント確認・編集
        </button>

        <button
          type="button"
          className="menu-button"
          onClick={() =>
            goOrPop("/map", () => window.sessionStorage.setItem("mapFlag", "3"))
          }
        >
          軌跡確認
        </button>

        <div className="app-name">© HUNTER×HUNTER</div>
      </div>

      {/* ポップアップ */}
      {popOpen && (
        <div id="text-pop" className="pop-overlay" onClick={closePop}>
          <div
            className="pop-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pop-title"
            aria-describedby="pop-desc"
            onClick={(e) => e.stopPropagation()} // ★ 背景クリックで閉じる／中身クリックは閉じない
          >
            <h2 id="pop-title">⚠ 注意</h2>
            <p id="pop-desc">
              支払い方法の設定が完了していません。
              <br />
              こちらから支払い設定に遷移できます。
            </p>

            <div className="pop-actions">
              <button
                type="button"
                id="pop-start"
                className="pop-btn pop-primary select-btn"
                onClick={() => {
                  closePop();
                  router.push("/planSelect");
                }}
              >
                支払い設定
              </button>

              <button type="button" id="pop-close" className="pop-btn" onClick={closePop}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ★ログアウト確認ポップアップ（MyPageと同じ） */}
      {logoutPop && (
        <div
          id="save-pop"
          className="pop-overlay"
          onClick={closeLogoutPop} // 背景クリックで閉じる
        >
          <div
            className="pop-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            aria-describedby="logout-desc"
            onClick={(e) => e.stopPropagation()} // 中身クリックは閉じない
          >
            <h2 id="logout-title">ログアウトします。</h2>
            <p id="logout-desc">
              ログアウトして、ログイン画面に遷移します。
              <br />
              よろしいでしょうか。
            </p>
            <div className="pop-actions">
              <button
                type="button"
                id="pop-next"
                className="pop-btn pop-primary"
                onClick={handleLogout}
              >
                はい
              </button>
              <button type="button" id="pop-close" className="pop-btn" onClick={closeLogoutPop}>
                いいえ
              </button>
            </div>
          </div>
        </div>
      )}
      {/* エラーポップ */}
      {errorOpen && (
        <div id="error-pop" className="pop-overlay">
          <div
            className="pop-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="errorpop-title"
            aria-describedby="errorpop-desc"
          >
            <h2 id="errorpop-title">{errorTitle}</h2>
            <p id="errorpop-desc">{errorMessage}</p>
            <div className="pop-actions erroractions">
              <button
                type="button"
                id="errorpop-close"
                className="pop-btn errorbtn"
                onClick={handleErrorClose}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
