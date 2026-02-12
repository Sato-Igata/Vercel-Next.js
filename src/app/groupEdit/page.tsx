"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
let usercheck = 0;

type GetGroupResponse = {
  textid: string;
  name: string;
  pass: string;
};

// /api/auth/me 用（user フィールド or 直下 id/name/username 両対応）
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

type GetMemberListResponse = {
  idlist: number[];
  subjectidlist: number[];
  namelist: (string | null)[];
  statuslist: number[];
};

type SaveResponse = {
  message: string;
  test?: string;
};

const GroupEditPage: React.FC = () => {
  const router = useRouter();
  // ---- セッションから groupId 読み込み ----
  const [groupId, setGroupId] = useState<number | null>(null);

  // ---- エラーポップ ----
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorTitle] = useState("⚠ エラー");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorStatus, setErrorStatus] = useState(1);

  // ---- 画面状態 ----
  const [textMessage, setTextMessage] = useState("");
  const [userNum, setUserNum] = useState(0);
  const [userName, setUserName] = useState("");

  const [groupTextId, setGroupTextId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupPass, setGroupPass] = useState("");
  const [newGroupPass, setNewGroupPass] = useState("");
  const [groupStatus, setGroupStatus] = useState<1 | 2>(2);
  const [participation, setParticipation] = useState<boolean>(true);

  const [deviceNames, setDeviceNames] = useState<string[]>([]);
  const [deviceIds, setDeviceIds] = useState<number[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<number[]>([]);

  const [memberIds, setMemberIds] = useState<number[]>([]);
  const [memberSubjectIds, setMemberSubjectIds] = useState<number[]>([]);
  const [memberNames, setMemberNames] = useState<(string | null)[]>([]);
  const [memberStatusIds, setMemberStatusIds] = useState<number[]>([]);
  const [memberChecked, setMemberChecked] = useState<boolean[]>([]); // チェック状態

  const [userParticipationLocked, setUserParticipationLocked] =
    useState<boolean>(false);
  const [deviceAddedIds, setDeviceAddedIds] = useState<number[]>([]); // 追加済みの犬ID

  // ---- 完了ポップ ----
  const [savePopOpen, setSavePopOpen] = useState(false);

  const popChange = (errortext: string, errorst: number) => {
    setErrorMessage(errortext);
    setErrorStatus(errorst);
    setErrorOpen(true);
  };

  const handleErrorClose = () => {
    setErrorOpen(false);
    if (errorStatus === 2) {
      router.push("/signIn");
    }
  };

  // ==== 初期: groupId 読み込み ====
  useEffect(() => {
    if (typeof window !== "undefined") {
      const gid = Number(window.sessionStorage.getItem("groupid") || "0");
      setGroupId(gid || 0);
    }
  }, []);

  // ==== API 関数 ====
  const getGroup = async (gid: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/getGroup?groupid=${gid}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
      });
      const result: any = await response.json();
      if (response.ok) {
        console.log("取得成功(getGroup):", result);
        const r = result as GetGroupResponse;
        setGroupTextId(r.textid);
        setGroupName(r.name);
        setGroupPass(r.pass);
        setNewGroupPass(r.pass);
      } else {
        console.error("取得エラー(getGroup):", result.error);
        popChange(result.error || "取得エラーが発生しました", result.status || 1);
      }
    } catch (error) {
      console.error("通信エラー(getGroup):", error);
      alert("通信エラーが発生しました");
    }
  };

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
        const id = r.user?.id ?? r.id ?? 0;
        const name =
          r.user?.name ??
          r.user?.username ??
          r.name ??
          r.username ??
          "";
        setUserNum(id);
        setUserName(name);
      } else {
        console.error("取得エラー(/api/auth/me):", result.error);
        popChange(result.error || "取得エラーが発生しました", result.status || 1);
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

  const getMemberList = async (gid: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/getMemberList?groupid=${gid}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          cache: "no-store",
        }
      );
      const result: any = await response.json();
      if (response.ok) {
        console.log("取得成功(getMemberList):", result);
        const r = result as GetMemberListResponse;
        setMemberIds(r.idlist ?? []);
        setMemberSubjectIds(r.subjectidlist ?? []);
        setMemberNames(r.namelist ?? []);
        setMemberStatusIds(r.statuslist ?? []);
        setMemberChecked(
          r.idlist ? new Array(r.idlist.length).fill(false) : []
        );
      } else {
        console.error("取得エラー(getMemberList):", result.error);
      }
    } catch (error) {
      console.error("通信エラー(getMemberList):", error);
      alert("通信エラーが発生しました");
    }
  };

  const deleteMember = async (deleteId: number, statusId: number) => {
    if (groupId == null) return;
    const setdata = {
      id: deleteId,
      stid: statusId,
      groupid: groupId,
    };
    try {
      const response = await fetch(`${API_BASE}/api/deleteMember`, {
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
        console.log("削除成功:", result);
      } else {
        console.error("削除エラー:", result.error);
        popChange(result.error || "削除エラーが発生しました", result.status || 1);
      }
    } catch (error) {
      console.error("通信エラー(deleteMember):", error);
      alert("通信エラーが発生しました");
    }
  };

  const userCheck = async (uId: number) => {
    if (groupId == null) return;
    const setdata = {
      uid: uId,
    };
    try {
      const response = await fetch(`${API_BASE}/api/userCheck`, {
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
        console.log("確認成功(userCheck):", result);
        usercheck = Number(result.check);
      } else {
        console.error("確認エラー(userCheck):", result.error);
        popChange(result.error || "確認エラーが発生しました", result.status || 1);
      }
    } catch (error) {
      console.error("通信エラー(userCheck):", error);
      alert("通信エラーが発生しました");
    }
  };

  const setData = async () => {
    if (groupId == null) return;

    // 犬リスト: チェックされていない ID を送る（旧 JS と同じ）
    const sendDeviceList = deviceIds.filter(
      (id) => !selectedDeviceIds.includes(id)
    );

    const memberLen = memberIds.length;
    const subjectList: number[] = [];
    const statusList: number[] = [];
    const participationList: number[] = [];

    for (let i = 0; i < memberLen; i++) {
      subjectList.push(memberSubjectIds[i] ?? 0);
      statusList.push(memberStatusIds[i] ?? 0);
      // チェックされていたら 0、されていなければ 1（旧 JS と同じ）
      participationList.push(memberChecked[i] ? 0 : 1);
    }

    const payload = {
      textid: groupTextId,
      name: groupName,
      text: groupPass,
      str: newGroupPass,
      groupid: groupStatus,
      bool: participation,
      devicelist: sendDeviceList,
      subjectlist: subjectList,
      statuslist: statusList,
      checkedlist: participationList,
    };

    console.log(
      "送信:",
      groupTextId,
      groupPass,
      groupStatus,
      participation,
      sendDeviceList
    );
    console.log(subjectList, statusList, participationList);

    try {
      const response = await fetch(`${API_BASE}/api/groupEdit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify(payload),
      });
      const result: any = await response.json();
      if (response.ok) {
        console.log("保存成功(groupEdit):", result);
        const r = result as SaveResponse;
        setTextMessage(r.message || "");
        openPop();
      } else {
        console.error("保存エラー(groupEdit):", result.error);
        console.log("保存テストメッセージ:", result.test);
        popChange(result.error || "保存エラーが発生しました", result.status || 1);
      }
    } catch (error) {
      console.error("通信エラー(setData):", error);
      alert("通信エラーが発生しました");
    }
  };

  const openPop = () => {
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

  // ==== 初期ロード（groupId が取れてから） ====
  useEffect(() => {
    if (!groupId) return;
    (async () => {
      await getGroup(groupId);
      await getUser();
      await getUserDevice();
      await getMemberList(groupId);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // ==== メンバーリストから「参加済みユーザー」「追加済み犬」を計算 ====
  useEffect(() => {
    const newDeviceAdded = new Set<number>();
    let userCount = 0;

    for (let i = 0; i < memberIds.length; i++) {
      const name = memberNames[i];
      if (name == null) continue;
      const status = memberStatusIds[i];
      const subj = memberSubjectIds[i];

      if (status !== 3) {
        // ユーザー
        (async () => {
          await userCheck(subj);
        })();
        if (usercheck === 1) {
          userCount += 1;
        }
      } else {
        // 犬（デバイス）
        const idx = deviceIds.indexOf(subj);
        if (idx !== -1) {
          newDeviceAdded.add(subj);
        }
      }
    }

    setUserParticipationLocked(userCount > 0);
    setDeviceAddedIds([...newDeviceAdded]);
  }, [
    memberIds.length,
    memberNames,
    memberStatusIds,
    memberSubjectIds,
    deviceIds,
  ]);

  // ==== 犬チェックトグル ====
  const toggleDevice = (id: number) => {
    // 「追加済み」フラグが立っているものは変更不可
    if (deviceAddedIds.includes(id)) return;

    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  // ==== メンバーチェックトグル ====
  const toggleMemberChecked = (idx: number) => {
    setMemberChecked((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  // ==== 参加チェックトグル（自分自身） ====
  const toggleParticipation = () => {
    // 追加済みなら変更不可
    if (userParticipationLocked) return;
    setParticipation((prev) => !prev);
  };

  // ==== メンバー削除ボタン ====
  const handleDeleteMember = async (idx: number) => {
    const deleteId = memberIds[idx];
    const statusId = memberStatusIds[idx];
    if (deleteId == null || statusId == null) return;

    await deleteMember(deleteId, statusId);
    if (groupId != null) {
      await getMemberList(groupId);
    }
  };

  const handleSave = async () => {
    await setData();
  };

  const participationChecked = !participation;
  const participationLabel = userParticipationLocked ? "追加済み" : "参加";
  const participationColor = userParticipationLocked ? "gray" : "black";

  // 犬+追加済み情報をまとめる
  const devices = deviceIds.map((id, index) => ({
    id,
    name: deviceNames[index] ?? "",
    added: deviceAddedIds.includes(id),
  }));
  // 2個ずつ行に分割
  const deviceRows: { id: number; name: string; added: boolean }[][] = [];
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
          <h1 className="group-title">グループ編集画面</h1>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          {/* グループ設定 */}
          <details>
            <summary className="form-title">グループ設定</summary>
            {/* グループID */}
            <div className="form-group" id="groupId">
              <input
                type="text"
                id="group-id"
                name="group-id"
                autoComplete="off"
                placeholder="グループID"
                value={groupTextId}
                disabled
                onChange={(e) => setGroupTextId(e.target.value)}
              />
            </div>

            {/* グループ名 */}
            <div className="form-group" id="groupName">
              <input
                type="text"
                id="group-name"
                name="group-name"
                autoComplete="off"
                placeholder="グループ名"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            {/* グループパスワード */}
            <div className="form-group" id="groupPassword">
              <input
                type="password"
                id="group-password"
                name="group-password"
                autoComplete="new-password"
                placeholder="パスワード"
                value={newGroupPass}
                onChange={(e) => setNewGroupPass(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="text-copy"
              id="copyBtn"
              onClick={() => {
                const idText = groupTextId;
                const passText = newGroupPass;
                const combined = `グループID: ${idText}\nパスワード: ${passText}`;
                navigator.clipboard.writeText(combined).then(() => {
                  const msg = document.getElementById(
                    "copyMsg"
                  ) as HTMLParagraphElement | null;
                  if (msg) {
                    msg.style.display = "block";
                    setTimeout(() => {
                      msg.style.display = "none";
                    }, 2000);
                  }
                });
              }}
            >
              ✅ コピーする
            </button>
            <p id="copyMsg" style={{ color: "green", display: "none" }}>
              コピーしました！
            </p>
          </details>

          {/* 区切り線 */}
          <div className="border-line" />

          {/* 追加するユーザ */}
          <details>
            <summary className="user-name-disp" id="user-name">
              {userName}
            </summary>
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

              {/* 参加不参加 */}
              <div className="btn-group" id="participation">
                <input
                  id="box0"
                  type="checkbox"
                  checked={participationChecked}
                  onChange={toggleParticipation}
                />
                <label
                  htmlFor="box0"
                  className="user-join"
                  id="participationBtn"
                  style={{ color: participationColor }}
                >
                  {participationLabel}
                </label>
              </div>
            </div>
          </details>

          {/* 区切り線 */}
          <div className="border-line" />

          {/* 追加する犬 */}
          <details>
            <summary className="add-dog-titile">追加する犬</summary>
            <div className="dog-choice" id="dogList">
              {deviceRows.map((row, rowIndex) => (
                <div className="dog-choice-content" key={rowIndex}>
                  {row.map((d) => {
                    const checked = selectedDeviceIds.includes(d.id);
                    const added = d.added;
                    const labelText = d.name
                      ? added
                        ? `${d.name}(追加済み)`
                        : d.name
                      : "";
                    return (
                      <React.Fragment key={d.id}>
                        <input
                          id={`box${d.id}`}
                          type="checkbox"
                          data-id={d.id}
                          checked={checked}
                          onChange={() => toggleDevice(d.id)}
                          disabled={added}
                        />
                        <label
                          htmlFor={`box${d.id}`}
                          id={`labelbox${d.id}`}
                          className="dog-choice-sel"
                          style={{ color: added ? "gray" : "black" }}
                        >
                          {labelText}
                        </label>
                      </React.Fragment>
                    );
                  })}
                </div>
              ))}
            </div>
          </details>

          {/* 区切り線 */}
          <div className="border-line" />

          {/* メンバー編集 */}
          <div className="member-edit-titile">メンバー</div>
          <div className="member-edit-container" id="memberList">
            {memberIds.map((id, i) => {
              const name = memberNames[i];
              if (!name) return null;
              return (
                <div
                  className="member-edit-content"
                  id={`member-edit-content${i}`}
                  key={id}
                >
                  <input
                    id={`member-box${i}`}
                    type="checkbox"
                    data-id={i}
                    checked={memberChecked[i] ?? false}
                    onChange={() => toggleMemberChecked(i)}
                  />
                  <label
                    htmlFor={`member-box${i}`}
                    className="member-edit-sel"
                  >
                    {name}
                  </label>
                  <div className="delete-btn">
                    <button
                      type="button"
                      className="delete-btn-red"
                      id={`member-btn${i}`}
                      onClick={async () => {
                        await handleDeleteMember(i);
                      }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 区切り線 */}
          <div className="border-line" />

          <button
            type="button"
            className="exe-button"
            id="input-data"
            onClick={handleSave}
          >
            更新
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
            <h2 id="pop-title">グループ内容更新完了</h2>
            <p id="pop-desc">
              グループ情報の変更内容を更新しました。
              <br />
            </p>
            <p id="pop-red">{textMessage}</p>
            <div className="pop-actions">
              <button
                type="button"
                id="pop-start"
                className="pop-btn pop-primary select-btn"
                onClick={closePop}
              >
                開始
              </button>
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
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupEditPage;
