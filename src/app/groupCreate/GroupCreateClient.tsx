"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

type Device = {
  id: number;
  name: string;
  checked: boolean;
};

type Props = {
  initialUserName: string;
  initialDevices: Device[];
};

const GroupCreateClient: React.FC<Props> = ({ initialUserName, initialDevices }) => {
  const router = useRouter();

  // 画面状態
  const [userName, setUserName] = useState(initialUserName ?? "");
  const [groupName, setGroupName] = useState("");
  const [groupPass, setGroupPass] = useState("");
  const [groupStatus, setGroupStatus] = useState<1 | 2>(2); // 2: 勢子, 1: 待ち
  const [participation, setParticipation] = useState(true);
  const [participationChecked, setParticipationChecked] = useState(false);

  const [devices, setDevices] = useState<Device[]>(initialDevices ?? []);

  // 成功ポップアップ
  const [showSavePop, setShowSavePop] = useState(false);
  const [groupTextId, setGroupTextId] = useState("");
  const [createdGroupPass, setCreatedGroupPass] = useState("");

  // エラーポップアップ
  const [showErrorPop, setShowErrorPop] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [errorStatus, setErrorStatus] = useState(1);

  // SSR→CSRの初期値が入っていない場合に備え、props変更も拾う（保険）
  useEffect(() => {
    setUserName(initialUserName ?? "");
  }, [initialUserName]);

  useEffect(() => {
    setDevices(initialDevices ?? []);
  }, [initialDevices]);

  // エラーポップ表示
  const popChange = (errortext: string, errorst: number) => {
    setErrorText(`${errortext}メインメニューへ戻ります。`);
    setErrorStatus(errorst);
    setShowErrorPop(true);
    document.body.style.overflow = "hidden";
  };

  const closeErrorPop = () => {
    setShowErrorPop(false);
    document.body.style.overflow = "";
    if (errorStatus === 2) {
      router.push("/signIn");
    } else {
      router.back();
    }
  };

  const openSavePop = () => {
    setShowSavePop(true);
    document.body.style.overflow = "hidden";
  };

  const closeSavePop = () => {
    setShowSavePop(false);
    document.body.style.overflow = "";
    router.back();
  };

  // API: グループ作成（ここは Client 側で POST のままでOK）
  const setData = async () => {;
    const devicelist = devices.filter((d) => !d.checked).map((d) => d.id);

    const payload = {
      name: groupName,
      pass: groupPass,
      groupid: groupStatus,
      bool: participation,
      devicelist,
    };

    try {
      const response = await fetch(`${API_BASE}/api/groupCreate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(result);
        setGroupTextId(result.id ?? "");
        setCreatedGroupPass(result.pass ?? "");
        openSavePop();
      } else {
        console.log(result);
        popChange(result.error ?? "保存エラーが発生しました。", result.status || 1);
      }
    } catch (error) {
      console.error("通信エラー(setData):", error);
      alert("通信エラーが発生しました");
    }
  };

  // 勢子/待ち 切り替え
  const handleSekoClick = () => setGroupStatus(2);
  const handleMachiClick = () => setGroupStatus(1);

  // 参加/不参加（box0）
  const handleParticipationChange = () => {
    const newChecked = !participationChecked;
    setParticipationChecked(newChecked);
    setParticipation(!newChecked);
  };

  // 犬チェックボックス
  const handleDeviceCheckChange = (id: number) => {
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, checked: !d.checked } : d)));
  };

  // コピーボタン
  const handleCopy = async () => {
    const combined = `グループID: ${groupTextId}\nパスワード: ${createdGroupPass}`;
    await navigator.clipboard.writeText(combined);
    const msg = document.getElementById("copyMsg");
    if (msg) {
      msg.style.display = "block";
      setTimeout(() => {
        msg.style.display = "none";
      }, 2000);
    }
  };

  const handleSaveClick = async () => {
    await setData();
  };

  // 犬表示を2個ずつの行にまとめる
  const deviceRows = useMemo(() => {
    const rows: Device[][] = [];
    for (let i = 0; i < devices.length; i += 2) {
      rows.push(devices.slice(i, i + 2));
    }
    return rows;
  }, [devices]);

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
            <h1 className="group-title">グループ作成画面</h1>
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <input
                type="text"
                id="group-name"
                name="group-name"
                placeholder="グループ名"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

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

            <div className="border-line" />

            <div className="user-name-disp" id="user-name">
              {userName}
            </div>

            <div className="user-choice">
              <div className="btnb-group">
                <input
                  type="radio"
                  name="sel-status"
                  id="seko"
                  checked={groupStatus === 2}
                  onChange={handleSekoClick}
                />
                <label htmlFor="seko" id="sel-seko" onClick={handleSekoClick}>
                  勢子
                </label>

                <input
                  type="radio"
                  name="sel-status"
                  id="machi"
                  checked={groupStatus === 1}
                  onChange={handleMachiClick}
                />
                <label htmlFor="machi" id="sel-machi" onClick={handleMachiClick}>
                  待ち
                </label>
              </div>

              <div className="radiobtn-space" />

              <div className="btn-group" id="participation">
                <input
                  id="box0"
                  type="checkbox"
                  checked={participationChecked}
                  onChange={handleParticipationChange}
                />
                <label htmlFor="box0" className="user-join">
                  参加
                </label>
              </div>
            </div>

            <div className="border-line" />

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
                        checked={d.checked}
                        onChange={() => handleDeviceCheckChange(d.id)}
                      />
                      <label htmlFor={`box${d.id}`} className="dog-choice-sel">
                        {d.name}
                      </label>
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>

            <button type="button" className="exe-button" id="input-data" onClick={handleSaveClick}>
              作成
            </button>
          </form>
        </div>
      </div>

      {/* 作成完了ポップアップ */}
      {showSavePop && (
        <div id="save-pop" className="pop-overlay">
          <div className="pop-modal" role="dialog" aria-modal="true" aria-labelledby="pop-title" aria-describedby="pop-desc">
            <h2 id="pop-title">グループ作成完了</h2>
            <p id="pop-desc">
              グループを作成しました。
              <br />
              作成されたグループのIDは以下になります。
            </p>
            <h2 id="group-id">グループID：{groupTextId}</h2>
            <h2 id="group-pass">パスワード：{createdGroupPass}</h2>
            <button className="text-copy" id="copyBtn" type="button" onClick={handleCopy}>
              ✅ コピーする
            </button>
            <p id="copyMsg" style={{ color: "green", display: "none" }}>
              コピーしました！
            </p>
            <div className="pop-actions">
              <button type="button" id="pop-start" className="pop-btn pop-primary select-btn" onClick={closeSavePop}>
                開始
              </button>
              <button type="button" id="pop-close" className="pop-btn" onClick={closeSavePop}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* エラーポップアップ */}
      {showErrorPop && (
        <div id="error-pop" className="pop-overlay">
          <div
            className="pop-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="errorpop-title"
            aria-describedby="errorpop-desc"
          >
            <h2 id="errorpop-title">⚠ エラー</h2>
            <p id="errorpop-desc">{errorText}</p>
            <div className="pop-actions erroractions">
              <button type="button" id="errorpop-close" className="pop-btn errorbtn" onClick={closeErrorPop}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupCreateClient;
