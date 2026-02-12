"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
const USER_ID = 0; // 旧 groupJoin.js と同じ固定値

// /api/auth/me 用に定義（user フィールド or 直下に id/name/username があるケース両対応）
type MeResponse = {
  user?: {
    id: number;
    name?: string;
    username?: string;
  };
  id?: number;
  name?: string;
  username?: string;
};

type GetUserDeviceResponse = {
  name: string[];
  id: number[];
};

type GroupJoinResponse = {
  id: number;
  message: string;
};

const GroupJoinPage: React.FC = () => {
  const router = useRouter();

  // ---- ポップアップ（エラー） ----
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorTitle] = useState("⚠ エラー");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorStatus, setErrorStatus] = useState(1);

  // ---- 画面状態 ----
  const [userName, setUserName] = useState("");
  const [groupId, setGroupId] = useState<number | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupPass, setGroupPass] = useState("");
  const [groupStatus, setGroupStatus] = useState<1 | 2>(2); // 2=勢子,1=待ち
  const [participation, setParticipation] = useState<boolean>(true); // JS のロジックをそのまま踏襲

  const [deviceNames, setDeviceNames] = useState<string[]>([]);
  const [deviceIds, setDeviceIds] = useState<number[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<number[]>([]); // チェックされた犬

  // ---- 完了ポップアップ ----
  const [savePopOpen, setSavePopOpen] = useState(false);
  const [popRedMessage, setPopRedMessage] = useState("");
  const [popCommentVisible, setPopCommentVisible] = useState(true);
  const [popCheck, setPopCheck] = useState(false); // 1=チェック開始
  const [startVisible, setStartVisible] = useState(false);

  // participation === true のときチェックボックスはオフ
  const participationChecked = !participation;

  // ===== エラーポップ =====
  const popChange = (errortext: string, errorst: number) => {
    setErrorMessage(`${errortext}メインメニューへ戻ります。`);
    setErrorStatus(errorst);
    setErrorOpen(true);
  };

  const handleErrorClose = () => {
    setErrorOpen(false);
    if (errorStatus === 2) {
      router.push("/signIn");
    }
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  // ===== API 呼び出し =====
  const getUser = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
      });

      const result: any = await response.json();

      if (response.ok) {
        console.log("取得成功(/api/auth/me):", result);
        const r = result as MeResponse;
        const name =
          r.user?.name ??
          r.user?.username ??
          r.name ??
          r.username ??
          "";
        setUserName(name);
      } else {
        console.error("取得エラー(/api/auth/me):", result.error);
        if (response.status === 401 || response.status === 419) {
          // 未ログイン → ログイン画面へ
          router.push("/signIn");
        } else {
          popChange(result.error || "取得エラーが発生しました", result.status || 1);
        }
      }
    } catch (error) {
      console.error("通信エラー(/api/auth/me):", error);
      alert("通信エラーが発生しました");
    }
  };

  const getUserDevice = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/getUserDevice`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
      });
      const result: any = await response.json();
      if (response.ok) {
        console.log("取得成功(getUserDevice):", result);
        const r = result as GetUserDeviceResponse;
        setDeviceNames(r.name ?? []);
        setDeviceIds(r.id ?? []);
      } else {
        console.error("取得エラー(getUserDevice):", result.error);
      }
    } catch (error) {
      console.error("通信エラー(getUserDevice):", error);
      alert("通信エラーが発生しました");
    }
  };

  const requestCheck = async () => {
    if (groupId == null) return;
    const setdata = {
      groupid: groupId,
    };
    try {
      const response = await fetch(`${API_BASE}/api/requestCheck`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(setdata),
      });
      const result: any = await response.json();
      if (response.ok) {
        console.log("取得成功(requestCheck):", result);
        requestOk();
      } else {
        console.error("取得エラー(requestCheck):", result.error);
      }
    } catch (error) {
      console.error("通信エラー(requestCheck):", error);
      alert("通信エラーが発生しました");
    }
  };

  const setData = async () => {
    // 元の JS と同じく「チェックされていない」IDを送る
    const sendDeviceList = deviceIds.filter(
      (id) => !selectedDeviceIds.includes(id)
    );

    const setdata = {
      gate: "groupJoin",
      name: groupName,
      text: groupPass,
      groupid: groupStatus,
      bool: participation,
      devicelist: sendDeviceList,
    };
    console.log(groupName, groupPass, groupStatus, participation, sendDeviceList);

    try {
      const response = await fetch(`${API_BASE}/api/groupJoin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(setdata),
      });
      const result: any = await response.json();
      if (response.ok) {
        console.log("保存成功(groupJoin):", result);
        const r = result as GroupJoinResponse;
        setGroupId(r.id);
        setPopRedMessage(r.message);
        openPop();
      } else {
        console.error("保存エラー(groupJoin):", result.error);
        popChange(result.error || "保存エラーが発生しました", result.status || 1);
      }
    } catch (error) {
      console.error("通信エラー(groupJoin):", error);
      alert("通信エラーが発生しました");
    }
  };

  // ===== ポップアップ操作 =====
  const openPop = () => {
    // participation === true → コメント表示
    if (participation === true) {
      setPopCommentVisible(true);
    } else {
      setPopCommentVisible(false);
    }
    setPopCheck(true);
    setStartVisible(false);
    setSavePopOpen(true);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  };

  const closePop = () => {
    setSavePopOpen(false);
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  const requestOk = () => {
    setPopCommentVisible(false);
    setStartVisible(true);
  };

  // ===== 初期ロード =====
  useEffect(() => {
    (async () => {
      await getUser();
      await getUserDevice();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== リクエスト承認ポーリング =====
  useEffect(() => {
    if (!popCheck || !participation || groupId == null) return;

    const timerId = window.setInterval(() => {
      requestCheck();
    }, 3000);

    return () => {
      window.clearInterval(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popCheck, participation, groupId]);

  // ===== 犬チェックボックスのトグル =====
  const toggleDevice = (id: number) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  // ===== 参加チェックボックスのトグル（元 JS と同じロジック） =====
  const toggleParticipation = () => {
    // participation true → チェック OFF
    // participation false → チェック ON
    setParticipation((prev) => !prev);
  };

  const handleSubmit = async () => {
    await setData();
  };

  // 犬配列を { id, name } にまとめる
  const devices = deviceIds.map((id, index) => ({
    id,
    name: deviceNames[index] ?? "",
  }));

  // 2個ずつの行に分割
  const deviceRows: { id: number; name: string }[][] = [];
  for (let i = 0; i < devices.length; i += 2) {
    deviceRows.push(devices.slice(i, i + 2));
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
      <div className="group-container">
        
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
          <h1 className="group-title">グループ参加画面</h1>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          {/* グループID */}
          <div className="form-group">
            <input
              type="text"
              id="group-id"
              name="group-id"
              placeholder="グループID"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {/* グループパスワード */}
          <div className="form-group">
            <input
              type="password"
              id="group-password"
              name="group-password"
              placeholder="パスワード"
              required
              value={groupPass}
              onChange={(e) => setGroupPass(e.target.value)}
            />
          </div>

          {/* 区切り線 */}
          <div className="border-line" />

          {/* 追加するユーザ */}
          <div className="user-name-disp" id="user-name">
            {userName}
          </div>
          <div className="user-choice">
            {/* ステータス選択 */}
            <div className="btnb-group">
              <input
                type="radio"
                name="sel-status"
                id="seko"
                checked={groupStatus === 2}
                onChange={() => setGroupStatus(2)}
              />
              <label htmlFor="seko" id="sel-seko">
                勢子
              </label>

              <input
                type="radio"
                name="sel-status"
                id="machi"
                checked={groupStatus === 1}
                onChange={() => setGroupStatus(1)}
              />
              <label htmlFor="machi" id="sel-machi">
                待ち
              </label>
            </div>

            {/* スペース */}
            <div className="radiobtn-space" />

            {/* 参加不参加選択 */}
            <div className="btn-group" id="participation">
              <input
                id="box0"
                type="checkbox"
                checked={participationChecked}
                onChange={toggleParticipation}
              />
              <label htmlFor="box0" className="user-join">
                参加
              </label>
            </div>
          </div>

          {/* 区切り線 */}
          <div className="border-line" />

          {/* 追加する犬 */}
          <div>追加する犬</div>
          <div className="dog-choice" id="dogList">
            {deviceRows.map((row, rowIndex) => (
              <div className="dog-choice-content" key={rowIndex}>
                {row.map((d) => (
                  <React.Fragment key={d.id}>
                    <input
                      id={`box${d.id}`}
                      type="checkbox"
                      data-id={d.id}
                      checked={selectedDeviceIds.includes(d.id)}
                      onChange={() => toggleDevice(d.id)}
                    />
                    <label
                      htmlFor={`box${d.id}`}
                      className="dog-choice-sel"
                    >
                      {d.name}
                    </label>
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>

          <button
            type="button"
            className="exe-button"
            id="input-data"
            onClick={handleSubmit}
          >
            参加リクエスト
          </button>
        </form>
      </div>

      {/* 完了ポップ */}
      {savePopOpen && (
        <div id="save-pop" className="pop-overlay">
          <div
            className="pop-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pop-title"
            aria-describedby="pop-desc"
          >
            <h2 id="pop-title">グループ参加リクエスト送信完了</h2>
            <p id="pop-desc">
              指定したグループに参加リクエストを送りました。
              <br />
            </p>
            {popCommentVisible ? (
              <p id="pop-comment" style={{ color: "blue" }}>
                ステータス：リクエスト承認待ち……
              </p>
            ) : (
              <p id="pop-comment" style={{ color: "blue" }} hidden />
            )}
            <p id="pop-red">{popRedMessage}</p>
            <div className="pop-actions">
              {!startVisible && (
                <button
                  type="button"
                  id="pop-start"
                  className="pop-btn pop-primary select-btn"
                  hidden
                >
                  開始
                </button>
              )}
              {startVisible && (
                <button
                  type="button"
                  id="pop-start"
                  className="pop-btn pop-primary select-btn"
                  onClick={closePop}
                >
                  開始
                </button>
              )}
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
                戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupJoinPage;
