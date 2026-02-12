"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../css/myPage.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''; 

interface SettingResponse {
  plan: string;
  payment: string;
  username: string;
  tele: string;
  email: string;
  gpsflag: number;
  eneflag: number;
  devicelist: string[];
  devicename: string[];
  status?: number;
  error?: string;
}

const MyPage: React.FC = () => {
  const router = useRouter();
  const [data, setData] = useState<SettingResponse | null>(null);
  const [devices, setDevices] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoutPop, setLogoutPop] = useState(false);
  // ---- エラーポップ ----
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorTitle] = useState("⚠ エラー");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorStatus, setErrorStatus] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/setting`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
          cache: "no-store",
        });

        const result: SettingResponse = await response.json();

        if (response.ok) {
          // console.log("取得成功:", result);
          setData(result);
          const devs: { id: string; name: string }[] = [];
          const ids = result.devicelist || [];
          const names = result.devicename || [];
          ids.forEach((id, i) => {
            devs.push({
              id,
              name: names[i] ?? "",
            });
          });
          setDevices(devs);
        } else {
          console.error("取得失敗:", result.error);
          popChange(result.error || "取得エラーが発生しました", result.status || 1);
        }
      } catch (error) {
        console.error("通信エラー:", error);
        alert("通信エラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openLogoutPop = () => {
    setLogoutPop(true);
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
  
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/signIn");
    }
  };

  if (loading) {
    return <div className="container">読み込み中...</div>;
  }

  return (
    <div className="container">
      <div className="mypage-container">

        <div className="back-header">
          {/* <button
            type="button"
            className="back-button"
            onClick={handleBack}
            aria-label="前の画面に戻る"
          >
            <span className="back-icon" aria-hidden="true">＜</span>
          </button> */}
          <button
            type="button"
            className="back-circle-button"
            onClick={handleBack}
            aria-label="前の画面に戻る"
          >
            ←
          </button>
          <h1 className="mypage-title">マイページ</h1>
        </div>

        <form>
          <div className="border-line"></div>

          <div className="form-title">設定情報</div>
          <div className="mypage-wait-container">
            <div className="mypage-wait-content">
              <div className="mypage-user-name">プラン：</div>
              <div className="mypage-wait-text">
                <div className="mypage-text" id="plan">
                  {data?.plan}
                </div>
              </div>
            </div>

            <div className="mypage-wait-content">
              <div className="mypage-user-name">支払い方法：</div>
              <div className="mypage-wait-text">
                <div className="mypage-text" id="payment">
                  {data?.payment}
                </div>
              </div>
            </div>

            <div className="mypage-wait-content">
              <div className="mypage-user-name">ユーザー名：</div>
              <div className="mypage-wait-text">
                <div className="mypage-text" id="username">
                  {data?.username}
                </div>
              </div>
            </div>

            <div className="mypage-wait-content">
              <div className="mypage-user-name">電話番号：</div>
              <div className="mypage-wait-text">
                <div className="mypage-text" id="tele">
                  {data?.tele}
                </div>
              </div>
            </div>

            <div className="mypage-wait-content">
              <div className="mypage-user-name">メールアドレス：</div>
              <div className="mypage-wait-text">
                <div className="mypage-text" id="email">
                  {data?.email}
                </div>
              </div>
            </div>

            <div className="mypage-wait-content">
              <div className="mypage-user-name">登録デバイス：</div>
              <div className="mypage-wait-text" id="device">
                {devices.map((d, i) => (
                  <div key={i} className="mypage-text">
                    {d.name} ({d.id})
                  </div>
                ))}
              </div>
            </div>

            <div className="mypage-wait-content">
              <div className="mypage-user-name">GPS状態：</div>
              <div className="mypage-wait-text">
                <div className="mypage-text" id="gpsflag">
                  {data?.gpsflag === 1 ? "オン" : "オフ"}
                </div>
              </div>
            </div>

            <div className="mypage-wait-content">
              <div className="mypage-user-name">省エネモード：</div>
              <div className="mypage-wait-text">
                <div className="mypage-text" id="eneflag">
                  {data?.eneflag === 1 ? "オン" : "オフ"}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="setting-button"
            id="setting"
            onClick={() => router.push("/setting")}
          >
            設定変更
          </button>

          <div className="border-line"></div>

          <button
            type="button"
            className="logout-button"
            id="logout"
            onClick={openLogoutPop}
          >
            ログアウト
          </button>
          
          <button
            type="button"
            className="logout-button"
            id="kaiyaku"
            onClick={openLogoutPop}
          >
            解約
          </button>
        </form>
      </div>

      <div className="app-name">© HUNTER×HUNTER</div>

      {/* ログアウトポップアップ */}
      {logoutPop && (
        <div id="save-pop" className="pop-overlay">
          <div
            className="pop-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pop-title"
            aria-describedby="pop-desc"
          >
            <h2 id="pop-title">ログアウトします。</h2>
            <p id="pop-desc">
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
              <button
                type="button"
                id="pop-close"
                className="pop-btn"
                onClick={closeLogoutPop}
              >
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
    </div>
  );
};

export default MyPage;
