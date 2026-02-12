"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
const PasswordForgetPage: React.FC = () => {
  const router = useRouter();
  const [success, setSuccess] = useState(0);
  const [popOpen, setPopOpen] = useState(false);
  const [userInput, setUserInput] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("userid", "");
      sessionStorage.setItem("useremail", "");
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
  };

  const handleSave = async () => {
    const setdata = {
      email: userInput,
    };
    try {
      const response = await fetch(`${API_BASE}/api/auth/passwordForget`, {
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
        if (result.flag === 1) {
          await fetch(`${API_BASE}/api/sms/send-latest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to_number: userInput }),
          });
        } else {
          await fetch(`${API_BASE}/api/mail/send-latest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userInput }),
          });
        }
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

  const popTitleText =
    success === 1 ? "送信しました" : "送信に失敗しました";
  const popDescText =
    success === 1
      ? "メッセージが正常に送信されました。メッセージ内容を確認してください。"
      : "メッセージの送信に失敗しました。画面を更新した後、再度入力から行ってください。";

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
            <label htmlFor="userid">電話番号／メールアドレス</label>
            <input
              type="text"
              id="userid"
              required
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="exe-button"
            id="input-data"
            onClick={handleSave}
          >
            送信
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

export default PasswordForgetPage;
