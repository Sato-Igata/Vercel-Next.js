'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import '../css/signIn.css';

const CODE_LENGTH = 6;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

type PopState = 0 | 1 | 2 | 3 | 4;

// login-1 の MeResponse と同等
type MeResponse = {
  user?: {
    id: number;
    username: string;
    email: string | null;
    tele: string | null;
  };
  message?: string;
  status?: string; // code 用で status: "success" を返すケースも想定
};

const SignInPage: React.FC = () => {
  const router = useRouter();

  const [login, setLogin] = useState('');     // 電話番号 or メールアドレス
  const [password, setPassword] = useState('');
  const [codeDigits, setCodeDigits] = useState<string[]>(
    Array(CODE_LENGTH).fill('')
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [busyLogin, setBusyLogin] = useState(false);
  const [busyCode, setBusyCode] = useState(false);

  const [popOpen, setPopOpen] = useState(false);
  const [popTitle, setPopTitle] = useState('');
  const [popDesc, setPopDesc] = useState('');

  // 初期値の復元（メールアドレスなどがあれば）
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedEmail =
      sessionStorage.getItem('useremail') ?? localStorage.getItem('useremail');
    const savedPassword = sessionStorage.getItem('userpassword');

    if (savedEmail) setLogin(savedEmail);
    if (savedPassword) setPassword(savedPassword);
  }, []);

  // コード入力の値を1つの文字列に
  const getCodeValue = () => codeDigits.join('');

  // ポップアップ文言
  const openPopup = (status: PopState, msg?: string) => {
    if (status === 1) {
      setPopTitle('送信しました');
      setPopDesc(
        msg ??
          '電話番号／メールアドレス宛に確認コードが正常に送信されました。'
      );
    } else if (status === 2) {
      setPopTitle('送信失敗');
      setPopDesc(
        msg ??
          '確認コードの送信に失敗しました。電話番号／メールアドレスまたはパスワードが異なります。'
      );
    } else if (status === 3) {
      setPopTitle('ログイン失敗');
      setPopDesc(
        msg ??
          '電話番号／メールアドレス、パスワードまたは確認コードが異なります。'
      );
    } else {
      setPopTitle('ログイン失敗');
      setPopDesc(msg ?? '未入力の項目があります。再度確認してください。');
    }
    setPopOpen(true);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  };

  const closePopup = () => {
    setPopOpen(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  };

  // =========================
  // ① コード送信ボタン
  // =========================
  const handleSendCode = async () => {
    const loginValue = login.trim();
    const pass = password.trim();

    if (!loginValue || !pass) {
      // 未入力エラー
      openPopup(4);
      return;
    }

    setBusyCode(true);

    const setdata = {
      email: loginValue,
      pass: pass,
    };
    try {
      const response = await fetch(`${API_BASE}/api/auth/code`, {
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
        if (result.flag === 1) {
          await fetch(`${API_BASE}/api/sms/send-latest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to_number: loginValue }),
          });
        } else {
          await fetch(`${API_BASE}/api/mail/send-latest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: loginValue }),
          });
        }
        openPopup(1, `${loginValue}宛に確認コードを送信しました。`);
      } else {
        openPopup(2, result.error);
      }
    } catch (err) {
      console.error('通信エラー(/api/auth/code):', err);
      alert('通信エラーが発生しました');
    } finally {
      setBusyCode(false);
    }
  };

  // =========================
  // ② ログインボタン
  // =========================
  const handleLogin = async () => {
    const loginValue = login.trim();
    const pass = password.trim();
    const code = getCodeValue();

    if (!loginValue || !pass || !code) {
      openPopup(4);
      return;
    }

    setBusyLogin(true);

    const body = new URLSearchParams();
    body.set('login', loginValue);
    body.set('password', pass);
    body.set('code', code);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        credentials: 'include',
        body: body.toString(),
      });

      const data = (await res.json().catch(() => ({}))) as MeResponse;

      if (!res.ok) {
        console.error('ログイン失敗(/auth/login):', data);
        openPopup(3, data.message);
        setBusyLogin(false);
        return;
      }

      // login-1 と同様、ログイン後に /api/auth/me で確認
      const meRes = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });

      if (!meRes.ok) {
        console.error('ログイン後の確認に失敗(/auth/me)');
        openPopup(3, 'ログイン後の確認に失敗しました。');
        setBusyLogin(false);
        return;
      }

      // ここまで来ればログイン成功 → メインメニューへ
      router.push('/mainMenu');
    } catch (err) {
      console.error('通信エラー(/auth/login):', err);
      alert('通信エラーが発生しました');
    } finally {
      setBusyLogin(false);
    }
  };

  // =========================
  // コード入力欄の処理
  // =========================
  const handleCodeChange = (index: number, raw: string) => {
    const val = raw.replace(/[^0-9]/g, '').slice(0, 1); // 1文字・数字のみ
    const newDigits = [...codeDigits];
    newDigits[index] = val;
    setCodeDigits(newDigits);

    if (val && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    const numbers = paste.replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);

    const digits = Array(CODE_LENGTH)
      .fill('')
      .map((_, i) => numbers[i] ?? '');
    setCodeDigits(digits);

    const lastFilled = numbers.length - 1;
    if (lastFilled >= 0 && lastFilled < CODE_LENGTH) {
      inputRefs.current[lastFilled]?.focus();
    }
  };

  return (
    <div className="container">
      <h1 className="top-title">HUNTER×HUNTER</h1>

      <div className="center-container">
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <div className="form-group">
            <label htmlFor="userid">電話番号またはメールアドレス</label>
            <input
              type="text"
              id="userid"
              name="userid"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="exe-button"
            id="codeBtn"
            onClick={handleSendCode}
            disabled={busyCode || busyLogin}
          >
            {busyCode ? '送信中...' : 'コード送信'}
          </button>

          <div className="form-group code-data">
            <label htmlFor="code">コード入力</label>
            <div className="code-inputs" id="code-box">
              {Array.from({ length: CODE_LENGTH }, (_, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  value={codeDigits[i]}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  onPaste={handleCodePaste}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            className="exe-button signin-btn"
            id="loginBtn"
            onClick={handleLogin}
            disabled={busyLogin || busyCode}
          >
            {busyLogin ? 'ログイン中...' : 'ログイン'}
          </button>

          <p className="auth-sub">
            コードの確認が取れない場合は再度送信を押してください。
          </p>
          <p className="auth-sub">
            パスワードを忘れた場合、
            <a href="/passwordForget" className="link" id="passwordForget">
              こちら
            </a>
            から変更可能です。
          </p>
          <p className="auth-sub">
            アカウント未作成の方は
            <a href="/signUp" className="link" id="signUp">
              新規登録
            </a>
          </p>
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
            <h2 id="pop-title">{popTitle}</h2>
            <p id="pop-desc">{popDesc}</p>
            <div className="pop-actions">
              <button
                type="button"
                id="pop-close"
                className="pop-btn"
                onClick={closePopup}
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

export default SignInPage;
