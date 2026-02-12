"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import '../css/groupList.css';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";
const USER_ID = 0; // 旧 groupList.js と同じ固定値

type GroupListResponse = {
  idlist: number[];
  textidlist: string[];
  namelist: string[];
  stdata: number[];
  flag: number[];
};

type RequestGroupsResponse = {
  idlist: string[];
  namelist: string[];
  hostuser: string[];
  objectname: (string | null)[];
};

type GroupUserResponse = {
  namelist: (string | null)[];
  stnamelist: (string | null)[];
  ptnamelist: (string | null)[];
};

type RequestGroupUserResponse = {
  idlist: number[];
  namelist: (string | null)[];
  statuslist: number[];
};

type UpdateObjectApprovalResponse = {
  // 任意
};

type GroupMembers = {
  names: (string | null)[];
  statusNames: (string | null)[];
  participationNames: (string | null)[];
};

type GroupRequests = {
  idList: number[];
  nameList: (string | null)[];
  statusList: number[];
};

const trimName = (str: string, max: number) => {
  if (str.length > max) {
    return str.substring(0, max) + "…";
  }
  return str;
};

const GroupListPage: React.FC = () => {
  const router = useRouter();

  // ---- エラーポップ ----
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorTitle] = useState("⚠ エラー");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorStatus, setErrorStatus] = useState(1);

  // ---- グループ一覧 ----
  const [groupIdList, setGroupIdList] = useState<number[]>([]);
  const [groupTextIdList, setGroupTextIdList] = useState<string[]>([]);
  const [groupNameList, setGroupNameList] = useState<string[]>([]);
  const [groupStatusList, setGroupStatusList] = useState<number[]>([]);
  const [groupHostFlag, setGroupHostFlag] = useState<number[]>([]);

  // 各グループのメンバー情報
  const [groupMembers, setGroupMembers] = useState<GroupMembers[]>([]);
  // 各グループの承認待ち情報
  const [groupRequests, setGroupRequests] = useState<GroupRequests[]>([]);

  // ---- リクエスト中グループ ----
  const [requestGroupIdList, setRequestGroupIdList] = useState<string[]>([]);
  const [requestGroupNameList, setRequestGroupNameList] = useState<string[]>([]);
  const [requestGroupHostUser, setRequestGroupHostUser] = useState<string[]>([]);
  const [requestGroupObjectName, setRequestGroupObjectName] = useState<
    (string | null)[]
  >([]);

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

  // ---- pageshow(back_forward) でリロード ----
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (e: any) => {
      const navType =
        window.performance.getEntriesByType("navigation")[0] as any;
      if (e.persisted || navType?.type === "back_forward") {
        window.location.reload();
      }
    };

    window.addEventListener("pageshow", handler);
    return () => {
      window.removeEventListener("pageshow", handler);
    };
  }, []);

  // ---- API ----
  const getGroups = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/groupList`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
      });
      const result: any = await response.json();
      if (response.ok) {
        console.log("取得成功(getGroups):", result);
        setGroupIdList(result.idlist ?? []);
        setGroupTextIdList(result.textidlist ?? []);
        setGroupNameList(result.namelist ?? []);
        setGroupStatusList(result.stdata ?? []);
        setGroupHostFlag(result.flag ?? []);
      } else {
        console.error("取得エラー(getGroups):", result.error);        
        if (result.status === 2) {
          popChange(result.error || "取得エラーが発生しました", result.status || 1);
        }
      }
    } catch (error) {
      console.error("通信エラー(getGroups):", error);
      alert("通信エラーが発生しました");
    }
  };

  const getRequestGroups = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/getRequestGroups`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
      });
      const result: any = await response.json();
      if (response.ok) {
        console.log("取得成功(getRequestGroups):", result);
        setRequestGroupIdList(result.idlist ?? []);
        setRequestGroupNameList(result.namelist ?? []);
        setRequestGroupHostUser(result.hostuser ?? []);
        setRequestGroupObjectName(result.objectname ?? []);
      } else {
        console.error("取得エラー(getRequestGroups):", result.error);
      }
    } catch (error) {
      console.error("通信エラー(getRequestGroups):", error);
      alert("通信エラーが発生しました");
    }
  };

  const fetchGroupUser = async (
    groupId: number
  ): Promise<GroupMembers | null> => {
    try {
      const response = await fetch(`${API_BASE}/api/getGroupUser?groupid=${groupId}`, {
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
        console.log("取得成功(getGroupUser):", result);
        return {
          names: result.namelist ?? [],
          statusNames: result.stnamelist ?? [],
          participationNames: result.ptnamelist ?? [],
        };
      } else {
        console.error("取得エラー(getGroupUser):", result.error);
        return {
          names: [],
          statusNames: [],
          participationNames: [],
        };
      }
    } catch (error) {
      console.error("通信エラー(getGroupUser):", error);
      alert("通信エラーが発生しました");
      return {
        names: [],
        statusNames: [],
        participationNames: [],
      };
    }
  };

  const fetchRequestGroupUser = async (
    groupId: number
  ): Promise<GroupRequests | null> => {
    try {
      const response = await fetch(`${API_BASE}/api/getRequestGroupUser?groupid=${groupId}`, {
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
        console.log("取得成功(getRequestGroupUser):", result);
        return {
          idList: result.idlist ?? [],
          nameList: result.namelist ?? [],
          statusList: result.statuslist ?? [],
        };
      } else {
        console.error("取得エラー(getRequestGroupUser):", result.error);
        return {
          idList: [],
          nameList: [],
          statusList: [],
        };
      }
    } catch (error) {
      console.error("通信エラー(getRequestGroupUser):", error);
      alert("通信エラーが発生しました");
      return {
        idList: [],
        nameList: [],
        statusList: [],
      };
    }
  };

  const updateObjectApproval = async (
    groupId: number,
    requestObjectId: number,
    requestObjectStatus: number
  ) => {
    const setdata = {
      id: requestObjectId,
      stid: requestObjectStatus,
      groupid: groupId,
    };
    try {
      const response = await fetch(`${API_BASE}/api/updateObjectApproval`, {
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
        console.log("取得成功(updateObjectApproval):", result);
      } else {
        console.error("取得エラー(updateObjectApproval):", result.error);
      }
    } catch (error) {
      console.error("通信エラー(updateObjectApproval):", error);
      alert("通信エラーが発生しました");
    }
  };

  // ---- 全グループのメンバー＋承認待ち情報を取得 ----
  const loadAllGroupDetails = async (ids: number[]) => {
    const membersArr: GroupMembers[] = [];
    const requestsArr: GroupRequests[] = [];

    for (const gid of ids) {
      const m = (await fetchGroupUser(gid)) ?? {
        names: [],
        statusNames: [],
        participationNames: [],
      };
      const r = (await fetchRequestGroupUser(gid)) ?? {
        idList: [],
        nameList: [],
        statusList: [],
      };
      membersArr.push(m);
      requestsArr.push(r);
    }
    setGroupMembers(membersArr);
    setGroupRequests(requestsArr);
  };

  const reloadSingleGroup = async (groupIndex: number) => {
    const gid = groupIdList[groupIndex];
    const m = (await fetchGroupUser(gid)) ?? {
      names: [],
      statusNames: [],
      participationNames: [],
    };
    const r = (await fetchRequestGroupUser(gid)) ?? {
      idList: [],
      nameList: [],
      statusList: [],
    };

    setGroupMembers((prev) => {
      const next = [...prev];
      next[groupIndex] = m;
      return next;
    });
    setGroupRequests((prev) => {
      const next = [...prev];
      next[groupIndex] = r;
      return next;
    });
  };

  // ---- 初期ロード ----
  useEffect(() => {
    (async () => {
      await getGroups();
      await getRequestGroups();
    })();
  }, []);

  // グループIDリストが変わったら詳細取得
  useEffect(() => {
    if (!groupIdList.length) return;
    (async () => {
      await loadAllGroupDetails(groupIdList);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIdList.join(",")]);

  // ---- ボタン動作 ----
  const handleEdit = (idx: number) => {
    const groupId = groupIdList[idx];
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("groupid", String(groupId));
    }
    router.push("/groupEdit");
  };

  const handleStart = (idx: number) => {
    const groupId = groupIdList[idx];
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("groupid", String(groupId));
      window.sessionStorage.setItem("mapFlag", "1");
    }
    // 旧: ../pages/map.html
    router.push("/map");
  };

  const handleApproval = async (
    groupIndex: number,
    requestObjectId: number,
    requestObjectStatus: number
  ) => {
    const gid = groupIdList[groupIndex];
    await updateObjectApproval(gid, requestObjectId, requestObjectStatus);
    await reloadSingleGroup(groupIndex);
  };

  // ---- 描画 ----
  const groupCount = groupIdList.length;
  const requestGroupLen = requestGroupIdList.length;

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/signIn");
    }
  };
  
  return (
    <div className="container">

      <div className="group-container" id="g-container">
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
          <h1 className="group-title">グループ一覧画面</h1>
        </div>

        {/* グループ一覧 */}
        {groupIdList.map((gid, i) => {
          const textId = trimName(groupTextIdList[i] ?? "", 15);
          const gname = trimName(groupNameList[i] ?? "", 15);
          const status = groupStatusList[i];
          const hostFlag = groupHostFlag[i];
          const idx = i + 1;

          const members = groupMembers[i] ?? {
            names: [],
            statusNames: [],
            participationNames: [],
          };
          const reqs = groupRequests[i] ?? {
            idList: [],
            nameList: [],
            statusList: [],
          };

          const canStart = status !== 3 && status !== 0;
          const startBtnHTML = canStart ? (
            <div
              className="group-list-start"
              id={`startBtn${idx}`}
              onClick={() => handleStart(i)}
            >
              開始
            </div>
          ) : null;

          // メンバーリスト
          const memberHTML =
            members.names && members.names.length > 0
              ? members.names.map((name, j) => {
                  if (!name) return null;
                  const groupUser = trimName(name, 10);
                  const stName = members.statusNames[j] ?? "";
                  const ptName = members.participationNames[j] ?? "";
                  return (
                    <div
                      className="group-member-list-content"
                      id={`group-member-list${i}-content${j}`}
                      key={`m-${i}-${j}`}
                    >
                      <div>{groupUser}</div>
                      <div>{stName}</div>
                      <div>{ptName}</div>
                    </div>
                  );
                })
              : null;

          // ホスト限定ブロック
          let hostExtra: React.ReactNode = null;
          if (hostFlag === 1) {
            const reqIds = reqs.idList ?? [];
            const reqNames = reqs.nameList ?? [];
            const reqStatuses = reqs.statusList ?? [];
            const hasReq = reqIds.length > 0;
            const requestTitle = hasReq ? "" : "（なし）";

            const requestHTML = reqIds.map((rid, j) => {
              const nm = reqNames[j];
              if (!nm) return null;
              const requestObjectName = trimName(nm, 10);
              const statusId = reqStatuses[j] ?? 0;
              const jdx = j + 1;
              return (
                <div
                  className="request-wait-content"
                  data-id={rid}
                  status-id={statusId}
                  id={`request-wait-content${rid}-status${statusId}`}
                  key={`r-${i}-${rid}-${statusId}`}
                >
                  <div className="request-user-name">{requestObjectName}</div>
                  <input
                    className="input-request-wait"
                    id={`request-box${rid}-status${statusId}`}
                    type="button"
                    onClick={async () =>
                      handleApproval(i, rid, statusId)
                    }
                  />
                  <label
                    htmlFor={`request-box${rid}-status${statusId}`}
                    className="request-wait-sel"
                    id={`approvalBtn${jdx}`}
                  >
                    承認
                  </label>
                </div>
              );
            });

            hostExtra = (
              <>
                <div
                  className="group-list-edit"
                  id={`edit${i}`}
                  onClick={() => handleEdit(i)}
                >
                  編集
                </div>
                <div
                  className="border-line-mini"
                  id={`request-wait-border-line-mini${i}`}
                />
                <div
                  className="request-wait-title"
                  id={`request-wait-title${i}`}
                >
                  リクエスト承認待ち{requestTitle}
                </div>
                <div
                  className="request-wait-container"
                  id={`request-wait-container${i}`}
                >
                  {requestHTML}
                </div>
              </>
            );
          }

          return (
            <div className="group-list-content" key={gid}>
              <div className="group-list-box">
                <div className="group-list-box-flex" data-group-num={i}>
                  <div className="group-text">
                    <div className="group-id" id={`group-id${i}`}>ID：{textId}</div>
                    <div className="group-name" id={`group-name${i}`}>{gname}</div>
                  </div>
                  {startBtnHTML && (
                    <div className="group-start-wrapper">
                      {startBtnHTML}
                    </div>
                  )}
                </div>
                <div className="group-member-list">
                  <details>
                    <summary
                      className="group-member-list-title"
                      id={`group-MemberList${i}`}
                    />
                    {memberHTML}
                    {hostExtra}
                  </details>
                </div>
              </div>
            </div>
          );
        })}

        {/* リクエスト中グループ */}
        <div className="requestnow-title" id="requestnow">
          リクエスト中グループ
          {requestGroupLen === 0 ? "（なし）" : ""}
        </div>
        <div className="requestnow-list" id="requestnowList">
          {requestGroupIdList.map((gid, i) => {
            const gname = requestGroupNameList[i] ?? "";
            const hostUser = requestGroupHostUser[i] ?? "";
            let objName = requestGroupObjectName[i];
            if (objName == null) objName = "";
            return (
              <div
                className="requestnow-content"
                id={`requestnow${i}`}
                key={`${gid}-${i}`}
              >
                <div className="requestnow-group-name">
                  {trimName(gname, 8)}
                </div>
                <div className="requestnow-user-name">
                  {trimName(hostUser, 8)}
                </div>
                <div className="requestnow-object-name">
                  {trimName(objName, 8)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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

export default GroupListPage;
