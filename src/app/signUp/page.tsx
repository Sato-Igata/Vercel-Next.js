"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "../css/signUp.css";

type PlanListResponse = {
  idlist: (number | null)[];
  namelist: (string | null)[];
  typelist: (string | null)[];
};

type PaymentListResponse = {
  idlist: (number | null)[];
  namelist: (string | null)[];
  typelist: (string | null)[];
};

type SetDataPayload = {
  name: string;
  tele: string;
  email: string;
  pass: string;
};

type ApiErrorResponse = {
  error?: string;
  message?: string;
};

type Option = { value: string; label: string };

const NG_CHARS = /['"`]/;

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

export default function SignUpPage() {
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

  // --- フォーム状態 ---
  const [username, setUsername] = useState("");
  const [tele, setTele] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [checkPass, setCheckPass] = useState("");

  const [paymentValue, setPaymentValue] = useState("");
  const [planValue, setPlanValue] = useState("");

  // device inputs（表示数＝plusCount、最大＝planMax）
  const [plusCount, setPlusCount] = useState(1);
  const [devices, setDevices] = useState<Array<{ deviceId: string; dogName: string }>>([
    { deviceId: "", dogName: "" },
  ]);

  // --- select options ---
  const [planOptions, setPlanOptions] = useState<Option[]>([]);
  const [paymentOptions, setPaymentOptions] = useState<Option[]>([]);

  // --- エラーメッセージ（idごとに持つ） ---
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- ポップ ---
  const [savePopOpen, setSavePopOpen] = useState(false);
  const [savePopTitle, setSavePopTitle] = useState("設定を保存しました");
  const [savePopDesc, setSavePopDesc] = useState("");
  const [errorPopOpen, setErrorPopOpen] = useState(false);
  const [errorPopDesc, setErrorPopDesc] = useState("");

  const savePopCloseRef = useRef<HTMLButtonElement | null>(null);
  const errorPopCloseRef = useRef<HTMLButtonElement | null>(null);

  const anyPopOpen = savePopOpen || errorPopOpen;
  useBodyScrollLock(anyPopOpen);

  // planに応じて device 最大数を決める（あなたのJSと同じ）
  const planMax = useMemo(() => {
    if (planValue === "normal") return 3;
    if (planValue === "premium") return 5;
    return 0; // free or 未選択は device欄を隠す
  }, [planValue]);

  const showDeviceList = useMemo(() => {
    return !(planValue === "" || planValue === "free");
  }, [planValue]);

  // plan変更で表示数と配列を調整
  useEffect(() => {
    if (!showDeviceList) {
      setPlusCount(1);
      setDevices([{ deviceId: "", dogName: "" }]);
      return;
    }
    // 表示数が最大を超えたら丸める
    setPlusCount((prev) => Math.min(prev, planMax || 1));

    setDevices((prev) => {
      const targetLen = Math.min(Math.max(prev.length, 1), planMax || 1);
      return prev.slice(0, targetLen);
    });
  }, [showDeviceList, planMax]);

  // plusCount 変化で devices 配列長を合わせる
  useEffect(() => {
    if (!showDeviceList) return;
    setDevices((prev) => {
      const next = [...prev];
      while (next.length < plusCount) next.push({ deviceId: "", dogName: "" });
      return next.slice(0, plusCount);
    });
  }, [plusCount, showDeviceList]);

  // --- 初期ロード：plan/payment取得 ---
  useEffect(() => {
    const abort = new AbortController();

    async function loadPlans() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/planList`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
          cache: "no-store",
        });
        const json: PlanListResponse & ApiErrorResponse = await res.json().catch(() => ({} as any));
        if (!res.ok) throw new Error(json.error || json.message || "planList 取得に失敗しました");

        const options: Option[] = [];
        const len = json.idlist?.length ?? 0;
        for (let i = 0; i < len; i++) {
          const value = json.typelist?.[i];
          const label = json.namelist?.[i];
          if (value) options.push({ value, label: label ?? value });
        }
        setPlanOptions(options);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error(e);
      }
    }

    async function loadPayments() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/paymentList`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
          cache: "no-store",
        });
        const json: PaymentListResponse & ApiErrorResponse = await res.json().catch(() => ({} as any));
        if (!res.ok) throw new Error(json.error || json.message || "paymentList 取得に失敗しました");

        const options: Option[] = [];
        const len = json.idlist?.length ?? 0;
        for (let i = 0; i < len; i++) {
          const value = json.typelist?.[i];
          const label = json.namelist?.[i];
          if (value) options.push({ value, label: label ?? value });
        }
        setPaymentOptions(options);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        console.error(e);
      }
    }

    loadPlans();
    loadPayments();

    return () => abort.abort();
  }, [API_BASE]);

  // --- ポップ open/close ---
  useEffect(() => {
    if (savePopOpen) setTimeout(() => savePopCloseRef.current?.focus(), 0);
  }, [savePopOpen]);

  useEffect(() => {
    if (errorPopOpen) setTimeout(() => errorPopCloseRef.current?.focus(), 0);
  }, [errorPopOpen]);

  function openSavePop(desc: string) {
    setSavePopTitle("確認メールを送信しました");
    setSavePopDesc(desc);
    setSavePopOpen(true);
  }
  function closeSavePop() {
    setSavePopOpen(false);
    router.push("/signIn");
  }
  function openErrorPop(desc: string) {
    setErrorPopDesc(desc);
    setErrorPopOpen(true);
  }
  function closeErrorPop() {
    setErrorPopOpen(false);
  }

  // --- 入力エラーをまとめてクリア ---
  function clearErrors() {
    setErrors({});
  }

  function setErr(key: string, msg: string) {
    setErrors((prev) => ({ ...prev, [key]: msg }));
  }

  // --- 送信 ---
  async function onSubmit() {
    clearErrors();

    // device 取り出し（あなたのJSと同じ：deviceIdが空でないものだけ送る）
    const devicelist: string[] = [];
    const devicename: string[] = [];
    if (showDeviceList && planMax > 0) {
      for (let i = 0; i < Math.min(plusCount, planMax); i++) {
        const d = devices[i];
        const did = (d?.deviceId ?? "").trim();
        const dn = (d?.dogName ?? "").trim();
        if (did !== "") {
          devicelist.push(did);
          devicename.push(dn);
        }
      }
    }

    // --- バリデーション（あなたのJSの順序に合わせる） ---
    if (pass !== checkPass) {
      setErr("message", "*確認パスワードが異なります。");
      openErrorPop("確認パスワードが異なります。");
      return;
    }
    if (username === "") {
      setErr("name", "*こちらの入力は必須です。");
      openErrorPop("ユーザー名が未入力です。");
      return;
    }
    if (tele === "" && email === "") {
      setErr("tele", "*どちらかを必ず入力してください。");
      setErr("email", "*どちらかを必ず入力してください。");
      openErrorPop("電話番号またはメールアドレスのどちらかを必ず入力してください。");
      return;
    }
    if (pass === "") {
      setErr("password", "*こちらの入力は必須です。");
      openErrorPop("パスワードが未入力です。");
      return;
    }
    if (!pass || pass.length < 8) {
      setErr("password", "*パスワードは8桁以上にしてください。");
      openErrorPop("パスワードは8桁以上にしてください。");
      return;
    }
    if (NG_CHARS.test(pass)) {
      setErr("password", "*パスワードに使用不可の特殊文字が含まれています。");
      openErrorPop("パスワードに使用不可の特殊文字が含まれています。");
      return;
    }
    if (checkPass === "") {
      setErr("passwordcheck", "*こちらの入力は必須です。");
      openErrorPop("確認パスワードが未入力です。");
      return;
    }
    // if (paymentValue === "") {
    //   setErr("payment", "*こちらの選択は必須です。");
    //   openErrorPop("支払い方法が未選択です。");
    //   return;
    // }
    // if (planValue === "") {
    //   setErr("plan", "*こちらの選択は必須です。");
    //   openErrorPop("プランが未選択です。");
    //   return;
    // }

    const payload: SetDataPayload = {
      name: username,
      tele,
      email,
      pass,
    };

    try {
      const res = await fetch(`${API_BASE}/api/auth/setUserData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const json: ApiErrorResponse = await res.json().catch(() => ({}));
      if (res.ok) {
        if (tele !== "") {
          await fetch(`${API_BASE}/api/sms/send-latest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to_number: tele }),
          });
        } else {
          await fetch(`${API_BASE}/api/mail/send-latest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
        }
        const to = tele !== "" ? tele : email;
        const msg = `ユーザー登録はまだ完了していません。${to}宛に確認メールを送信しました。`;
        openSavePop(msg);
      } else {
        openErrorPop(json.error || json.message || "登録に失敗しました。");
      }
    } catch (e) {
      console.error("通信エラー:", e);
      openErrorPop("通信エラーが発生しました");
    }
  }

  // device入力更新
  function updateDevice(idx: number, patch: Partial<{ deviceId: string; dogName: string }>) {
    setDevices((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  // 追加ボタン（あなたのJS：plusCount <= planId の条件と同じ）
  function onAddDevice() {
    if (!showDeviceList) return;
    const nextCount = plusCount + 1;
    if (nextCount <= planMax) setPlusCount(nextCount);
  }

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
        <form onSubmit={(e) => e.preventDefault()}>
          {/* ユーザー名 */}
          <div className="form-group">
            <label htmlFor="name">ユーザー名（必須）</label>
            <input
              type="text"
              id="name"
              placeholder="ユーザー名を入力"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <div id="name-err-message" className="errorMessage">
              {errors.name || ""}
            </div>
          </div>

          <hr className="dashed-line" />

          <p className="auth-sub">電話番号またはメールアドレスはどちらかを必ず入力してください。</p>

          {/* tele */}
          <div className="form-group">
            <label htmlFor="tele">電話番号（*任意）</label>
            <input
              type="text"
              name="tele"
              id="tele"
              placeholder="電話番号を入力"
              value={tele}
              onChange={(e) => setTele(e.target.value)}
            />
            <div id="tele-err-message" className="errorMessage">
              {errors.tele || ""}
            </div>
          </div>

          {/* email */}
          <div className="form-group">
            <label htmlFor="email">メールアドレス（*任意）</label>
            <input
              type="text"
              name="email"
              id="email"
              placeholder="メールアドレスを入力"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div id="email-err-message" className="errorMessage">
              {errors.email || ""}
            </div>
          </div>

          <hr className="dashed-line" />

          {/* password */}
          <div className="form-group">
            <label htmlFor="password">
              登録パスワード（必須）
              <br />
              ※8桁の数字+英文字(一部特殊文字も使用可能)
            </label>
            <input
              type="password"
              id="password"
              placeholder="登録パスワードを入力"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
            <div id="password-err-message" className="errorMessage">
              {errors.password || ""}
            </div>
          </div>

          {/* passwordcheck */}
          <div className="form-group">
            <label htmlFor="passwordcheck">確認パスワード（必須）</label>
            <input
              type="password"
              id="passwordcheck"
              placeholder="確認パスワードを入力"
              value={checkPass}
              onChange={(e) => setCheckPass(e.target.value)}
            />
            <div id="passwordcheck-err-message" className="errorMessage">
              {errors.passwordcheck || ""}
            </div>
          </div>

          <hr className="dashed-line" />

          {/* payment */}
          {/* <div className="form-group">
            <label htmlFor="payment">支払い方法（必須）</label>
            <select id="payment" value={paymentValue} onChange={(e) => setPaymentValue(e.target.value)}>
              <option value="">支払い方法を選択</option>
              {paymentOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div id="payment-err-message" className="errorMessage">
              {errors.payment || ""}
            </div>
          </div> */}

          {/* <hr className="dashed-line" /> */}

          {/* plan */}
          {/* <div className="form-group">
            <label htmlFor="plan">プラン選択（必須）</label>
            <select id="plan" value={planValue} onChange={(e) => setPlanValue(e.target.value)}>
              <option value="">プランを選択</option>
              {planOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div id="plan-err-message" className="errorMessage">
              {errors.plan || ""}
            </div>
          </div> */}

          {/* <p className="auth-sub">
            プラン内容の詳細は
            <a href="" className="link" id="passwordForget" onClick={(e) => e.preventDefault()}>
              こちら
            </a>
            から確認できます。
          </p> */}

          {/* deviceList */}
          {/* <div
            className="form-group device-list"
            id="deviceList"
            data-plan-id={String(planMax)}
            style={{ display: showDeviceList ? undefined : "none" }}
          >
            <label htmlFor="device">登録デバイス（任意）</label> */}

            {/* {devices.map((d, i) => {
              const idx = i + 1;
              return (
                <React.Fragment key={idx}>
                  <input
                    type="text"
                    className="device"
                    id={`device${idx}`}
                    data-id={String(idx)}
                    placeholder="登録デバイスID"
                    value={d.deviceId}
                    onChange={(e) => updateDevice(i, { deviceId: e.target.value })}
                  />
                  <div id={`device-err-message${idx}-1`} className="errorMessage">
                    {errors[`device${idx}-1`] || ""}
                  </div>

                  <input
                    type="text"
                    className="device device-name"
                    id={`dog${idx}`}
                    data-id={String(idx)}
                    placeholder="登録する名前を入力"
                    value={d.dogName}
                    onChange={(e) => updateDevice(i, { dogName: e.target.value })}
                  />
                  <div id={`device-err-message${idx}-2`} className="errorMessage">
                    {errors[`device${idx}-2`] || ""}
                  </div>
                </React.Fragment>
              );
            })} */}

            {/* <div className="device-button" id="plus-div">
              <button
                type="button"
                className="exe-button device-plus"
                id="plus"
                onClick={onAddDevice}
                disabled={!showDeviceList || plusCount >= planMax}
              >
                登録デバイス追加
              </button>
            </div>
          </div> */}

          {/* <hr className="dashed-line" /> */}
          {/* <hr className="dashed-line" /> */}

          {/* submit */}
          <button type="button" className="exe-button signUp-btn" id="signUpBtn" onClick={onSubmit}>
            新規登録
          </button>

          <div id="message" className="errorMessage">
            {errors.message || ""}
          </div>
        </form>
      </div>

      <div className="app-name">© HUNTER×HUNTER</div>

      {/* 保存ポップ */}
      <div id="save-pop" className="pop-overlay" hidden={!savePopOpen}>
        <div className="pop-modal" role="dialog" aria-modal="true" aria-labelledby="pop-title" aria-describedby="pop-desc">
          <h2 id="pop-title">{savePopTitle}</h2>
          <p id="pop-desc">{savePopDesc}</p>
          <div className="pop-actions">
            <button type="button" id="pop-close" className="pop-btn" onClick={closeSavePop} ref={savePopCloseRef}>
              閉じる
            </button>
          </div>
        </div>
      </div>

      {/* エラーポップ */}
      <div id="error-pop" className="pop-overlay" hidden={!errorPopOpen}>
        <div
          className="pop-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="errorpop-title"
          aria-describedby="errorpop-desc"
        >
          <h2 id="errorpop-title">⚠ エラー</h2>
          <p id="errorpop-desc">{errorPopDesc}</p>
          <div className="pop-actions erroractions">
            <button
              type="button"
              id="errorpop-close"
              className="pop-btn errorbtn"
              onClick={closeErrorPop}
              ref={errorPopCloseRef}
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
