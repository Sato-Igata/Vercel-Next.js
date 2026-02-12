"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../css/setting.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''; 

interface SettingResponse {
  plan: string;
  payment: string;
  username: string;
  tele: string;
  email: string;
  mapbtn: number;
  gpsflag: number;
  eneflag: number;
  devicelist: string[];
  devicename: string[];
  error?: string;
  messeage?: string;
  status?: number;
  code?: number;
}

interface CodeUpdateResponse {
  messeage: string;
  tele: string;
  email: string;
  flag?: number;
  error?: string;
}

const MAX_DEVICES = 5;

type DeviceRow = {
  deviceId: string;
  dogName: string;
};

let success = 0;
const SettingPage: React.FC = () => {
  const router = useRouter();
  const [planText, setPlanText] = useState("");
  const [username, setUsername] = useState("");
  const [telHidden, setTelHidden] = useState("");
  const [tel1, setTel1] = useState("");
  const [tel2, setTel2] = useState("");
  const [tel3, setTel3] = useState("");
  const [email, setEmail] = useState("");
  const [mapControl, setMapControl] = useState(false);
  const [gpsToggle, setGpsToggle] = useState(false);
  const [eneToggle, setEneToggle] = useState(false);
  const codeRefs = React.useRef<Array<HTMLInputElement | null>>([]);
  const [devices, setDevices] = useState<DeviceRow[]>(
    Array.from({ length: MAX_DEVICES }, () => ({ deviceId: "", dogName: "" }))
  );

  // コード入力 6桁
  const [codeInputs, setCodeInputs] = useState<string[]>(
    Array.from({ length: 6 }, () => "")
  );

  // const [success, setSuccess] = useState(0);
  const [popCancel, setPopCancel] = useState(0);
  const [oldTele, setOldTele] = useState("");
  const [oldEmail, setOldEmail] = useState("");
  const [popOpen, setPopOpen] = useState(false);
  const [popMessage, setPopMessage] = useState("");
  const [requireCode, setRequireCode] = useState(false); // flag === 1 のとき
  
  // ---- エラーポップ ----
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorTitle] = useState("⚠ エラー");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorStatus, setErrorStatus] = useState(1);

  // 電話数字だけ抽出
  const digits = (s: string) => (s || "").replace(/\D/g, "");

  // telHidden ↔ 3分割同期
  useEffect(() => {
    // initFromHidden 相当
    const d = digits(telHidden);
    if (d) {
      setTel1(d.slice(0, 3));
      setTel2(d.slice(3, 7));
      setTel3(d.slice(7, 11));
    }
  }, []); // 初回だけ

  // t1/t2/t3 変更時 hidden に反映
  useEffect(() => {
    const d = digits(tel1 + tel2 + tel3);
    setTelHidden(d);
  }, [tel1, tel2, tel3]);
  
  // 画面初期取得
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
          console.log("取得成功:", result);
          setOldTele(result.tele);
          setOldEmail(result.email);
          setPlanText(`${result.plan}／${result.payment}`);
          setUsername(result.username);

          const telRaw = digits(result.tele || "");
          setTel1(telRaw.slice(0, 3));
          setTel2(telRaw.slice(3, 7));
          setTel3(telRaw.slice(7, 11));
          setTelHidden(telRaw);

          setEmail(result.email);
          setMapControl(result.mapbtn === 1);
          setGpsToggle(result.gpsflag === 1);
          setEneToggle(result.eneflag === 1);

          // デバイス + 犬名
          const ids = result.devicelist || [];
          const names = result.devicename || [];
          const rows: DeviceRow[] = Array.from({ length: MAX_DEVICES }, (_, i) => {
            const id = ids[i] ?? "";
            const nm = names[i] ?? "";
            return { deviceId: id, dogName: nm };
          });
          setDevices(rows);
        } else {
          console.error("取得失敗:", result.error);
          alert(result.error || "取得エラー");
        }
      } catch (error) {
        console.error("通信エラー:", error);
        alert("通信エラーが発生しました");
      }
    };

    fetchData();
  }, []);

  // 電話入力ハンドラ（数字以外除去 + 桁制限 + 自動フォーカスは簡易再現）
  const handleTelChange =
    (field: "tel1" | "tel2" | "tel3", maxLength: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = digits(e.target.value).slice(0, maxLength);
      if (field === "tel1") setTel1(val);
      if (field === "tel2") setTel2(val);
      if (field === "tel3") setTel3(val);
    };

  // デバイス欄変更
  const handleDeviceChange =
    (index: number, key: keyof DeviceRow) =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setDevices((prev) => {
        const newArr = [...prev];
        newArr[index] = { ...newArr[index], [key]: value };
        return newArr;
      });
    };

  const focusCode = (idx: number) => {
    const el = codeRefs.current[idx];
    if (el) {
      el.focus();
      el.select();
    }
  };
  // コード入力欄
  const handleCodeChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNum = e.target.value.replace(/\D/g, "").slice(0, 1);

    setCodeInputs((prev) => {
      const next = [...prev];
      next[index] = onlyNum;
      return next;
    });

    if (onlyNum && index < codeInputs.length - 1) {
      // state反映前でもフォーカスは動かしてOK
      focusCode(index + 1);
    }
  };
  // Backspaceで空なら前へ、左右キーも対応
  const handleCodeKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;

    if (key === "Backspace") {
      // すでに空なら前へ
      if (!codeInputs[index] && index > 0) {
        e.preventDefault();
        setCodeInputs((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
        focusCode(index - 1);
      }
      return;
    }

    if (key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusCode(index - 1);
      return;
    }

    if (key === "ArrowRight" && index < codeInputs.length - 1) {
      e.preventDefault();
      focusCode(index + 1);
      return;
    }
  };
  // ペースト: 数字列を抽出して分配（6桁以上でも先頭6桁）
  const handleCodePaste = (index: number) => (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text") ?? "";
    const nums = text.replace(/\D/g, "");
    if (!nums) return;

    e.preventDefault();

    setCodeInputs((prev) => {
      const next = [...prev];
      let p = 0;
      for (let i = index; i < next.length; i++) {
        next[i] = nums[p] ?? "";
        p++;
        if (p >= nums.length) break;
      }
      return next;
    });

    const last = Math.min(index + nums.length - 1, codeInputs.length - 1);
    focusCode(last);
  };
  
  const getCodeValue = () => codeInputs.join("");

  // 保存ボタン
  const handleSave = async () => {
    const deviceid: string[] = [];
    const devicename: string[] = [];

    for (let i = 0; i < MAX_DEVICES; i++) {
      const row = devices[i];
      if (row && row.deviceId.trim() !== "") {
        deviceid.push(row.deviceId.trim());
        devicename.push(row.dogName.trim());
      }
    }

    const setdata = {
      name: username,
      tele: telHidden,
      email: email,
      mapbtn: mapControl,
      gps: gpsToggle,
      ene: eneToggle,
      devicelist: deviceid,
      devicename: devicename,
    };
    console.log(
      'name:', username,
      'tele:', telHidden,
      email,
      'mapbtn:', mapControl,
      'gps:', gpsToggle,
      'ene:', eneToggle,
      'devicelist:', deviceid,
      devicename,
    );

    try {
      const response = await fetch(`${API_BASE}/api/settingUpdate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(setdata),
      });

      const result: SettingResponse & { messeage?: string; code?: number } =
        await response.json();

      if (response.ok) {
        console.log("保存成功:", result);
        // setSuccess(1);
        success = 1;
        popChange(result.messeage ?? "", result.code ?? 0);
      } else {
        console.error("保存失敗:", result.error);
        // setSuccess(2);
        success = 2;
        if (result.status === 2) {
          errorPopChange(result.error || "取得エラーが発生しました", result.status || 1);
        } else {
          popChange(result.error ?? "保存エラー", 0);
        }
      }
    } catch (error) {
      console.error("通信エラー:", error);
      alert("通信エラーが発生しました");
    }
  };

  const popChange = (message: string, flag: number) => {
    if (success === 1) {
      if (flag === 1) {
        setRequireCode(true);
        setPopCancel(1);
      } else {
        setRequireCode(false);
        setPopCancel(0);
      }
      setPopMessage(`変更内容が正常に保存されました。${message}`);
    } else {
      setRequireCode(false);
      setPopMessage(message);
    }
    openPop();
  };

  const openPop = () => {
    setPopOpen(true);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  };

  const closePop = () => {
    if (popCancel === 1) {
      // sendCancelUpdate() 相当は元コードでもコメントアウトされているので実行しない
    }
    setPopOpen(false);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  };

  // コード送信ボタン
  const handleCodeSubmit = async () => {
    const inputcode = getCodeValue();
    const setdata = {
      tele: telHidden,
      email,
      text: inputcode,
    };

    try {
      const response = await fetch(`${API_BASE}/api/settingUpdateUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(setdata),
      });

      const result: CodeUpdateResponse = await response.json();

      if (response.ok) {
        console.log("保存成功:", result);
        if (result.flag === 1) {
          await fetch(`${API_BASE}/api/sms/send-latest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to_number: telHidden }),
          });
        } else {
          await fetch(`${API_BASE}/api/mail/send-latest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
        }
        success = 1;
        setOldTele(result.tele);
        setOldEmail(result.email);
        popChange(result.messeage ?? "", 0);
      } else {
        console.error("保存失敗:", result.error);
        success = 2;
        popChange(result.error ?? "保存エラー", 0);
      }
    } catch (error) {
      console.error("通信エラー:", error);
      alert("通信エラーが発生しました");
    }
  };

  const handlePopNext = () => {
    router.push("/myPage");
  };

  const handleChangePlan = () => {
    router.push("/planSelect");
  };

  const handlePassChange = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("usertele", oldTele);
      sessionStorage.setItem("useremail", oldEmail);
    }
    router.push("/passwordChg");
  };

  const errorPopChange = (errortext: string, errorst: number) => {
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

  return (
    <div className="container">

      <div className="setting-container">
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
          <h1 className="setting-title">設定</h1>
        </div>
        <form>
          <details>
            <summary className="form-title">プラン</summary>
            <div className="form-setting">
              <span className="textarea1" id="plantext">
                {planText || "ノーマルプラン／クレジットカード"}
              </span>
              <button
                type="button"
                className="round-btn"
                aria-label="変更"
                id="changeBtn"
                onClick={handleChangePlan}
              >
                変更
              </button>
            </div>
          </details>

          <div className="border-line"></div>

          <details>
            <summary className="form-title">ユーザー名</summary>
            <div className="form-setting">
              <textarea
                id="setting-address-username"
                name="setting-address-username"
                rows={1}
                placeholder="ユーザー名を入力"
                autoComplete="street-address"
                className="textarea1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <button
                type="button"
                className="round-btn"
                aria-label="変更"
                id="passBtn"
                onClick={handlePassChange}
              >
                パスワード変更
              </button>
            </div>
          </details>

          <div className="border-line"></div>

          <details>
            <summary className="form-title">電話番号</summary>
            <div className="form-setting">
              <div className="tel-group" id="tel-group">
                <input
                  type="tel"
                  className="tel-input"
                  id="tel1"
                  maxLength={3}
                  inputMode="numeric"
                  pattern="[0-9]{3}"
                  placeholder="000"
                  aria-label="市外局番"
                  value={tel1}
                  onChange={handleTelChange("tel1", 3)}
                />
                <span className="tel-dash">-</span>
                <input
                  type="tel"
                  className="tel-input"
                  id="tel2"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  placeholder="0000"
                  aria-label="市内局番"
                  value={tel2}
                  onChange={handleTelChange("tel2", 4)}
                />
                <span className="tel-dash">-</span>
                <input
                  type="tel"
                  className="tel-input"
                  id="tel3"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  placeholder="0000"
                  aria-label="加入者番号"
                  autoComplete="tel-national"
                  value={tel3}
                  onChange={handleTelChange("tel3", 4)}
                />
                <input
                  type="hidden"
                  id="setting-address-tel"
                  name="setting-address-tel"
                  value={telHidden}
                  readOnly
                />
              </div>
            </div>
          </details>

          <div className="border-line"></div>

          <details>
            <summary className="form-title">メールアドレス</summary>
            <div className="form-setting">
              <textarea
                id="setting-address-email"
                name="setting-address-email"
                rows={1}
                placeholder="メールアドレスを入力"
                autoComplete="street-address"
                className="textarea1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </details>

          <div className="border-line"></div>

          <details>
            <summary className="form-title">登録デバイス</summary>
            <div className="form-setting" id="device">
              {devices.map((d, i) => (
                <React.Fragment key={i}>
                  <textarea
                    id={`setting-address-device${i + 1}`}
                    name={`setting-address-device${i + 1}`}
                    rows={1}
                    placeholder="デバイスIDを入力"
                    autoComplete="street-address"
                    className="textarea1"
                    value={d.deviceId}
                    onChange={handleDeviceChange(i, "deviceId")}
                  />
                  {/* 犬名 */}
                  {d.deviceId.trim() !== "" && (
                    <>
                      <textarea
                        id={`setting-address-dog${i + 1}`}
                        name={`setting-address-dog${i + 1}`}
                        rows={1}
                        placeholder="犬の名前を設定してください"
                        autoComplete="street-address"
                        className="textarea1 dog-field"
                        value={d.dogName}
                        onChange={handleDeviceChange(i, "dogName")}
                      />
                      {i < MAX_DEVICES - 1 && (
                        <hr className="dashed-line dog-field" />
                      )}
                    </>
                  )}
                </React.Fragment>
              ))}
            </div>
          </details>

          <div className="border-line"></div>

          <details>
            <summary className="form-title">マップ設定</summary>
            <div className="form-setting">
              <label className="toggle-row">
                <span className="toggle-text">コントロールボタンの右寄せ</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    id="map-control"
                    checked={mapControl}
                    onChange={(e) => setMapControl(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </label>
            </div>
          </details>

          <div className="border-line"></div>

          <details>
            <summary className="form-title">GPS</summary>
            <div className="form-setting">
              <label className="toggle-row">
                <span className="toggle-text">端末の位置情報を送信する</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    id="gpsToggle"
                    checked={gpsToggle}
                    onChange={(e) => setGpsToggle(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </label>
            </div>
          </details>
          
          <div className="border-line"></div>

          <details>
            <summary className="form-title">省エネモード</summary>
            <div className="form-setting">
              <label className="toggle-row">
                <span className="toggle-text">簡易な位置情報取得処理に変更する</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    id="eneToggle"
                    checked={eneToggle}
                    onChange={(e) => setEneToggle(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </label>
            </div>
          </details>

          <div className="border-line"></div>
        </form>
      </div>

      <div className="fixed-bar">
        <button
          type="button"
          className="setting-button"
          id="input-data"
          onClick={handleSave}
        >
          保存
        </button>
        <div className="app-name">© HUNTER×HUNTER</div>
      </div>

      {popOpen && (
        <div id="save-pop" className="pop-overlay">
          <div
            className="pop-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pop-title"
            aria-describedby="pop-desc"
          >
            <h2 id="pop-title">
              {success === 1 ? "設定を保存しました" : "設定の保存に失敗しました"}
            </h2>
            <p id="pop-desc">
              {success === 1
                ? popMessage || "変更内容が正常に保存されました。"
                : popMessage}
            </p>

            {/* コード入力部 */}
            {success === 1 && requireCode && (
              <div className="form-group code-data" id="code-dataList">
                <label htmlFor="code">コード入力</label>
                <div className="code-inputs" id="code-box">
                  {codeInputs.map((val, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        codeRefs.current[i] = el;
                      }}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      value={val}
                      onChange={handleCodeChange(i)}
                      onKeyDown={handleCodeKeyDown(i)}
                      onPaste={handleCodePaste(i)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="pop-actions">
              {success === 1 && requireCode && (
                <button
                  type="button"
                  id="pop-code"
                  className="pop-btn pop-primary"
                  onClick={handleCodeSubmit}
                >
                  コード入力
                </button>
              )}
              <button
                type="button"
                id="pop-close"
                className="pop-btn"
                onClick={closePop}
              >
                {success === 1 && requireCode ? "キャンセル" : "閉じる"}
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

export default SettingPage;
