"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
const PasswordForgetChgPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pageid, setPageId] = useState<number>(0);
  const [useremail, setUseremail] = useState("");
  const [success, setSuccess] = useState(0);
  const [popOpen, setPopOpen] = useState(false);
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("userid", "");
      sessionStorage.setItem("useremail", "");
      sessionStorage.setItem("userpassword", "");
      sessionStorage.setItem("groupid", "");
    }
  }, []);

  useEffect(() => {
    const p = Number(searchParams.get("pagenum")) || 0;
    setPageId(p);

    const fetchUser = async () => {
      const setdata = { id: p };
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
          if (result.userstatus === 1) {
            setUseremail(result.tele);
          } else {
            setUseremail(result.email);
          }
        } else {
          console.error("確認失敗:", result.error);
          alert(result.error || "確認エラー");
        }
      } catch (error) {
        console.error("通信エラー:", error);
        alert("通信エラーが発生しました");
      }
    };

    if (p) fetchUser();
  }, [searchParams]);

  const openPop = () => {
    setPopOpen(true);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  };

  const closePop = () => {
    setPopOpen(false);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
    if (success === 1) {
      router.push(`/done?pagenum=${pageid}`);
    }
  };

  const popTitleText =
    success === 1
      ? "パスワードを再設定しました"
      : success === 2
      ? "パスワードの設定に失敗しました"
      : "確認パスワードが異なります。";

  const popDescText =
    success === 1
      ? "パスワードが正常に設定されました。"
      : success === 2
      ? "基準を満たしていない可能性があります。"
      : "新しいパスワードと確認用パスワードが異なります。";

  const handleSave = async () => {
    if (newPassword1 !== newPassword2) {
      setSuccess(3);
      openPop();
      return;
    }
    const setdata = {
      email: useremail,
      text: newPassword1,
    };
    try {
      const response = await fetch(`${API_BASE}/api/auth/passwordChg`, {
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
        console.log("送信成功:", result);
        setSuccess(1);
      } else {
        console.error("送信失敗:", result.error);
        setSuccess(2);
      }
    } catch (error) {
      console.error("通信エラー:", error);
      alert("通信エラーが発生しました");
      return;
    }
    openPop();
  };
  
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/signIn");
    }
  };

  return (
    <div className="container">
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
      </div>
      <h1 className="top-title">HUNTER×HUNTER</h1>
      <div className="center-container">
        <form>
          <div className="form-group">
            <label htmlFor="new-password">新しいパスワード</label>
            <input
              type="password"
              id="new-password"
              required
              value={newPassword1}
              onChange={(e) => setNewPassword1(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">新しいパスワード（確認用）</label>
            <input
              type="password"
              id="confirm-password"
              required
              value={newPassword2}
              onChange={(e) => setNewPassword2(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="exe-button"
            id="input-data"
            onClick={handleSave}
          >
            登録
          </button>
        </form>
      </div>

      <div className="app-name">© HUNTER×HUNTER</div>

      {popOpen && (
        <div id="save-pop" className="pop-overlay">
          <div
            className="pop-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pop-title"
            aria-describedby="pop-desc"
          >
            <h2 id="pop-title">{popTitleText}</h2>
            <p id="pop-desc">{popDescText}</p>
            <div className="pop-actions">
              <button
                type="button"
                id="pop-close"
                className="pop-btn"
                onClick={closePop}
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

export default PasswordForgetChgPage;
