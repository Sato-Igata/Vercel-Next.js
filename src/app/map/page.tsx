"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// const MapPage: React.FC = () => {
export default function MapPage() {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [apiBase, setApiBase] = useState("");
  useEffect(() => {
    const handler = () => router.push('/signIn');
    window.addEventListener('go-signin', handler);
    return () => window.removeEventListener('go-signin', handler);
  }, []);
  // ① API_BASE を window にセット
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_BASE ?? "";
    (window as any).API_BASE = base;
    setApiBase(base);
  }, []);
  // ② ページマウント時のクリーンアップ（
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        const w = window as any;
        if (typeof w.stopMapRenderLoop === "function") {
          w.stopMapRenderLoop();
        }
      }
    };
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      // (window as any).attachMapListeners?.();
    }
    return () => {
      if (typeof window !== "undefined") {
        (window as any).stopMapRenderLoop?.();
        // (window as any).detachMapListeners?.();
      }
    };
  }, []);
  // ③ スクロールブロックの attach/detach
  useEffect(() => {
    const w = window as any;
    w.attachMapScrollBlock?.();
    return () => {
      w.detachMapScrollBlock?.();
    };
  }, []);
  useEffect(() => {
    return () => {
      (window as any).stopMapRenderLoop?.();
    };
  }, []);
  // ④ apiBase がセットされたら initHunterMap を叩く
  useEffect(() => {
    if (!apiBase) return;           // まだ値が入ってないときは何もしない
    const w = window as any;
    if (typeof w.initHunterMap === "function") {
      w.initHunterMap();            // 2回目以降の /map 再訪問で効く
    }
  }, [apiBase]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/signIn");
    }
  };

  return (
    <>
      {/* Leaflet 本体 */}
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        strategy="afterInteractive"
      />
      {/* leaflet-rotate */}
      <Script
        src="https://unpkg.com/leaflet-rotate@0.2.0/dist/leaflet-rotate.js"
        strategy="afterInteractive"
      />
      {/* jQuery（既存 map.js が依存しているため） */}
      <Script
        src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"
        strategy="afterInteractive"
      />
      {/* 既存の map.js（public/js/map.js に配置してください） */}
      {apiBase && (
        <Script 
          src="/js/map.js" 
          strategy="afterInteractive" 
          // type="module"
          // crossOrigin="anonymous"
          onLoad={() => {
            (window as any).initHunterMap?.();
          }}
        />
      )}

      <div className="container">
        <header className="header">
          <div className="header-bar">
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
              <h1 className="map-title">HUNTER×HUNTER</h1>
            <nav id="header-menu">
              <div className="map-container no-scrollbar">
                <form id="menuForm">
                  <div className="map-button-box" id="borderLine">
                    <button
                      type="button"
                      className="map-button"
                      id="main-button"
                    >
                      メインメニューへ
                    </button>
                  </div>
                </form>
              </div>
            </nav>
            <div
              id="hamburger"
              className="hamburger"
              aria-label="メニュー"
              aria-expanded="false"
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
            </div>
          </div>
        </header>

        {/* 地図 */}
        <div id="map" />

        <p style={{ fontSize: "12px" }} className="maps">
          地図表示：
          <a
            href="https://maps.gsi.go.jp/development/ichiran.html"
            target="_blank"
            rel="noreferrer"
          >
            国土地理院 地理院タイル
          </a>
        </p>

        <div className="app-name">© HUNTER×HUNTER</div>
      </div>

      {/* ローディング */}
      <div id="loading">
        <div className="spinner"></div>
        <p>マップを作成しています...</p>
      </div>

      {/* ポイント登録ポップアップ */}
      <div id="pointNew-pop" className="pop-overlay" hidden>
        <div
          className="pop-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pop-title"
          aria-describedby="pop-desc"
        >
          <h2 id="pop-title">ポイント登録</h2>
          <p id="pop-desc">ポイント登録の内容を選択してください。</p>
          <div className="pop-actions">
            <button
              type="button"
              id="pop-next-ba"
              className="pop-btn pop-primary select-btn"
            >
              持ち場
            </button>
            <button
              type="button"
              id="pop-next-car"
              className="pop-btn pop-primary select-btn"
            >
              車　　
            </button>
            <button type="button" id="pop-close" className="pop-btn">
              閉じる
            </button>
          </div>
        </div>
      </div>

      {/* エラーポップアップ */}
      <div id="error-pop" className="pop-overlay" hidden>
        <div
          className="pop-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="errorpop-title"
          aria-describedby="errorpop-desc"
        >
          <h2 id="errorpop-title"></h2>
          <p id="errorpop-desc"></p>
          <div className="pop-actions erroractions">
            <button
              type="button"
              id="errorpop-close"
              className="pop-btn errorbtn"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>

      {/* 編集ロック用シールド */}
      {/* <div id="edit-shield" hidden aria-hidden="true"></div> */}
    </>
  );
}

// export default MapPage;
