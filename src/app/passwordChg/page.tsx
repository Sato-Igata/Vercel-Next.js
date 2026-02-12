"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
const PasswordChgPage: React.FC = () => {
  const router = useRouter();
  const [success, setSuccess] = useState(0);
  const [popOpen, setPopOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword1, setNewPassword1] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("userpassword", "");
      sessionStorage.setItem("groupid", "");
    }
  }, []);

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
      router.push("/done?pagetrigger=1");
    }
  };

  const popTitleText =
    success === 1
      ? "パスワードを変更しました"
      : success === 2
      ? "パスワードの設定に失敗しました"
      : success === 3
      ? "確認パスワードが異なります。"
      : "現在パスワードが異なります。";

  const popDescText =
    success === 1
      ? "パスワードが正常に変更されました。"
      : success === 2
      ? "基準を満たしていない可能性があります。"
      : success === 3
      ? "新しいパスワードと確認用パスワードが異なります。"
      : "入力した現在設定されているパスワードが異なります。";

  const handleSave = async () => {
    if (typeof window === "undefined") return;

    let useremail = "";
    if (
      sessionStorage.getItem("usertele") !== "" &&
      sessionStorage.getItem("usertele") !== null
    ) {
      useremail = sessionStorage.getItem("usertele") || "";
    } else {
      useremail = sessionStorage.getItem("useremail") || "";
    }

    if (newPassword1 !== newPassword2) {
      setSuccess(3);
      openPop();
      return;
    }

    const setdata1 = {
      email: useremail,
      text: currentPassword,
    };

    try {
      const response1 = await fetch(`${API_BASE}/api/passwordCheck`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(setdata1),
      });

      const result1 = await response1.json();

      if (response1.ok) {
        console.log("確認成功:", result1);
        const setdata2 = {
          email: useremail,
          text: newPassword1,
        };
        try {
          const response2 = await fetch(`${API_BASE}/api/auth/passwordChg`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include",
            cache: "no-store",
            body: JSON.stringify(setdata2),
          });
          const result2 = await response2.json();
          if (response2.ok) {
            console.log("送信成功:", result2);
            setSuccess(1);
          } else {
            console.error("送信失敗:", result2.error);
            setSuccess(2);
          }
        } catch (error) {
          console.error("通信エラー:", error);
          alert("通信エラーが発生しました");
          return;
        }
      } else {
        console.error("確認失敗:", result1.error);
        setSuccess(4);
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
            <label htmlFor="current-password">現在のパスワード</label>
            <input
              type="password"
              id="current-password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

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
            変更
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

export default PasswordChgPage;
