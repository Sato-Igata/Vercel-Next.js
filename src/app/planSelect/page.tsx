// app/planSelect/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "../css/planSelect.css";

type Plan = {
  id: number;
  name: string;
  monthly: number;
  type: string;
  text: string;
};

let paymentFlag = 0;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export default function PlanSelectPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  // main pop
  const [popOpen, setPopOpen] = useState(false);
  const [popTitle, setPopTitle] = useState("");
  const [popDesc, setPopDesc] = useState("");

  // error pop
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorDesc, setErrorDesc] = useState("");
  const [errorStatus, setErrorStatus] = useState(1);

  const canUseApiBase = useMemo(() => API_BASE && API_BASE.length > 0, []);

  // 背景スクロール抑止
  useEffect(() => {
    const open = popOpen || errorOpen;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [popOpen, errorOpen]);

  // 初回：プラン取得
  useEffect(() => {
    const load = async () => {
      if (!canUseApiBase) {
        setErrorDesc("API_BASE が未設定です。環境変数 NEXT_PUBLIC_API_BASE を確認してください。");
        setErrorStatus(1);
        setErrorOpen(true);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/getPlan`, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
          cache: "no-store",
        });

        const result = await res.json();

        if (!res.ok) {
          setErrorDesc(`${result?.error ?? "取得に失敗しました"}メインメニューへ戻ります。`);
          setErrorStatus(result?.status ?? 1);
          setErrorOpen(true);
          return;
        }

        const idlist: number[] = result?.idlist ?? [];
        const name: string[] = result?.name ?? [];
        const monthly: number[] = result?.monthly ?? [];
        const type: string[] = result?.type ?? [];
        const text: string[] = result?.text ?? [];
        paymentFlag = result?.paymentflag ?? 0;

        const merged: Plan[] = idlist.map((id, i) => ({
          id,
          name: name[i] ?? "",
          monthly: Number(monthly[i] ?? 0),
          type: type[i] ?? "",
          text: text[i] ?? "",
        }));

        setPlans(merged);
      } catch (e) {
        console.error(e);
        setErrorDesc("通信エラーが発生しました。メインメニューへ戻ります。");
        setErrorStatus(1);
        setErrorOpen(true);
      }
    };

    load();
  }, [canUseApiBase]);

  const openMainPop = (plan: Plan) => {
    setSelectedPlan(plan);
    setPopTitle("");
    setPopDesc(`登録するプランは${plan.name}でよろしいでしょうか？`);
    setPopOpen(true);
  };

  const closeMainPop = () => {
    setPopOpen(false);
  };

  const decidePlan = async () => {
    if (!selectedPlan) return;
    try {
      const res = await fetch(`${API_BASE}/api/setPlan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ id: selectedPlan.id }),
      });

      const result = await res.json();

      if (res.ok) {
        if (paymentFlag === 1) {
          // router.push("/");
        }
      } else {
        setPopOpen(false);
        setErrorDesc(`${result?.error ?? "保存に失敗しました"}メインメニューへ戻ります。`);
        setErrorStatus(result?.status ?? 1);
        setErrorOpen(true);
        return;
      }
    } catch (e) {
      console.error(e);
      setPopOpen(false);
      setErrorDesc("通信エラーが発生しました。メインメニューへ戻ります。");
      setErrorStatus(1);
      setErrorOpen(true);
    }
  };

  const closeErrorPop = () => {
    setErrorOpen(false);
    // 元JSと同じ：history.back()
    if (errorStatus === 2) {
      router.push("/signIn");
    } else {
      history.back();
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/signIn");
    }
  };

  return (
    <>
      <div className="container">
        <div className="plan-container" id="p-container">
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
            <h1 className="plan-title">プラン選択</h1>
          </div>
          <div>以下よりプランを選択してください。</div>

          {plans.map((p, i) => (
            <div className="plan-list-content" key={p.id ?? i}>
              <div className="plan-list-box">
                {/* JSの plan-Num クリック領域 */}
                <button
                  type="button"
                  className="plan-list-box-flex"
                  onClick={() => openMainPop(p)}
                  style={{ width: "100%", textAlign: "left", background: "transparent", border: "none" }}
                >
                  <div id={`plan-name${i}`}>{p.name}</div>
                  <div id={`plan-monthly${i}`}>{p.monthly}円／月</div>
                </button>

                <div className="plan-data-list">
                  <details>
                    <summary className="plan-data-list-title"></summary>
                    <div className="plan-text" id={`plantext${i}`}>
                      {p.text}
                    </div>
                  </details>
                </div>
              </div>
            </div>
          ))}
        </div>
        {paymentFlag === 0 && (
          <p>
            支払い方法の変更は <Link href="/">こちら</Link> からできます。
          </p>
        )}

        <div className="app-name">© HUNTER×HUNTER</div>
      </div>

      {/* main pop */}
      {popOpen && (
        <div id="main-pop" className="pop-overlay" onClick={closeMainPop}>
          <div
            className="pop-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pop-title"
            aria-describedby="pop-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="pop-title">{popTitle}</h2>
            <p id="pop-desc">{popDesc}</p>
            <div className="pop-actions">
              <button type="button" id="pop-next" className="pop-btn pop-primary select-btn" onClick={decidePlan}>
                決定
              </button>
              <button type="button" id="pop-close" className="pop-btn" onClick={closeMainPop}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* error pop */}
      {errorOpen && (
        <div id="error-pop" className="pop-overlay">
          <div
            className="pop-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="errorpop-title"
            aria-describedby="errorpop-desc"
          >
            <h2 id="errorpop-title">⚠ エラー</h2>
            <p id="errorpop-desc">{errorDesc}</p>
            <div className="pop-actions erroractions">
              <button type="button" id="errorpop-close" className="pop-btn errorbtn" onClick={closeErrorPop}>
                戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
