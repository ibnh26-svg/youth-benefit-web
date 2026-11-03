import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, saveLogin } from '../api/client';
import { startKakaoLogin } from './KakaoCallbackPage';
import { PasswordInput } from '../components/AuthInputs';
import { LockIcon, ChatIcon, CheckIcon } from '../components/Icons';
import { useCountdown } from '../hooks/useCountdown';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [unlockAt, setUnlockAt] = useState(null);
  const lockTimer = useCountdown(0);

  async function login(event) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      // 아직 토큰이 없으니 api()가 X-Anonymous-Id를 함께 보낸다 → 서버가 로그인 전 데이터를 계정으로 옮긴다
      const tokens = await api('/api/v1/auth/login', { method: 'POST', body: { email, password } });
      saveLogin(tokens);
      navigate('/');
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify-email', { state: { email } });
        return;
      }
      if (err.code === 'ACCOUNT_LOCKED') {
        const seconds = err.details?.retryAfterSeconds ?? 900;
        lockTimer.restart(seconds);
        setUnlockAt(new Date(Date.now() + seconds * 1000));
      }
      setError(err);
    } finally {
      setSending(false);
    }
  }

  const locked = error?.code === 'ACCOUNT_LOCKED' && lockTimer.left > 0;
  const lockText = `${Math.floor(lockTimer.left / 60)}분 ${String(lockTimer.left % 60).padStart(2, '0')}초`;
  const unlockClock = unlockAt
    ? `${String(unlockAt.getHours()).padStart(2, '0')}:${String(unlockAt.getMinutes()).padStart(2, '0')}`
    : '';

  return (
    <form onSubmit={login}>
      <section className="hero hero-auth">
        <span className="hero-logo"><CheckIcon size={30} strokeWidth="3" /></span>
        <h1>내 조건에 맞는 혜택,<br />놓치지 않게 챙겨요</h1>
        <p className="hero-sub">로그인하면 맞춤 공고와 마감 알림을 받을 수 있어요.</p>
      </section>

      <section className="card">
        {locked && (
          <div className="lock-box">
            <LockIcon size={18} />
            <div>
              <strong>로그인이 15분 동안 잠겼어요</strong>
              <p>비밀번호를 5번 틀렸어요. {unlockClock} 이후에 다시 시도하거나, 비밀번호를 새로 설정해 주세요.</p>
            </div>
          </div>
        )}
        {error && !locked && <p className="error-box">{error.message}</p>}
        <label>이메일
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
        </label>
        <PasswordInput
          label="비밀번호"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className={locked ? 'is-invalid' : ''}
        />
        <button className="btn-primary" disabled={sending || locked}>
          {locked ? `${lockText} 후에 다시 로그인할 수 있어요` : '로그인'}
        </button>
        {locked ? (
          <Link className="btn-outline" to="/password/forgot">비밀번호 찾기</Link>
        ) : (
          <>
            <div className="or-divider"><span>또는</span></div>
            <button type="button" className="btn-kakao" onClick={startKakaoLogin}><ChatIcon size={18} />카카오로 로그인</button>
          </>
        )}
      </section>

      <p className="notice links">
        <Link to="/signup">회원가입</Link>
        <span>|</span>
        {locked ? <Link to="/">처음으로</Link> : <Link to="/password/forgot">비밀번호 찾기</Link>}
      </p>
      {!locked && <p className="notice">비밀번호를 5번 틀리면 15분 동안 로그인이 잠겨요.</p>}
    </form>
  );
}
