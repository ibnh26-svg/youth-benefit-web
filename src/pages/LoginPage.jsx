import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, saveLogin } from '../api/client';
import { startKakaoLogin } from './KakaoCallbackPage';
import { PasswordInput } from '../components/AuthInputs';
import { LockIcon } from '../components/Icons';
import { useCountdown } from '../hooks/useCountdown';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
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
      if (err.code === 'ACCOUNT_LOCKED') lockTimer.restart(err.details?.retryAfterSeconds ?? 900);
      setError(err);
    } finally {
      setSending(false);
    }
  }

  const locked = error?.code === 'ACCOUNT_LOCKED' && lockTimer.left > 0;
  const lockText = `${Math.floor(lockTimer.left / 60)}분 ${String(lockTimer.left % 60).padStart(2, '0')}초`;

  return (
    <form onSubmit={login}>
      <section className="hero"><h1>내 조건에 맞는 혜택,<br />놓치지 않게 챙겨요</h1></section>
      <section className="card">
        {locked && (
          <div className="lock-box">
            <LockIcon size={20} />
            <div>
              <strong>로그인이 잠시 잠겼어요</strong>
              <p>비밀번호를 여러 번 틀렸어요. {lockText} 뒤에 다시 시도해 주세요.</p>
            </div>
          </div>
        )}
        {error && !locked && <p className="error-box">{error.message}</p>}
        <label>이메일
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <PasswordInput label="비밀번호" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn-primary" disabled={sending || locked}>
          {locked ? `${lockText} 후 다시 시도` : '로그인'}
        </button>
        <button type="button" className="btn-kakao" onClick={startKakaoLogin}>카카오로 로그인</button>
      </section>
      <p className="notice"><Link to="/signup">회원가입</Link> | <Link to="/password/forgot">비밀번호 찾기</Link></p>
    </form>
  );
}
