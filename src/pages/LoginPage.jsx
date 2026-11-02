import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, saveLogin } from '../api/client';
import { startKakaoLogin } from './KakaoCallbackPage';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

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
      setError(err);
    } finally {
      setSending(false);
    }
  }

  const locked = error?.code === 'ACCOUNT_LOCKED';
  const minutes = locked ? Math.ceil(error.details.retryAfterSeconds / 60) : 0;

  return (
    <form onSubmit={login}>
      <section className="hero"><h1>내 조건에 맞는 혜택,<br />놓치지 않게 챙겨요</h1></section>
      <section className="card">
        {error && <p className="error-box">{locked ? `로그인이 잠겼어요. 약 ${minutes}분 뒤에 다시 시도해 주세요.` : error.message}</p>}
        <label>이메일
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>비밀번호
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="btn-primary" disabled={sending || locked}>로그인</button>
        <button type="button" className="btn-kakao" onClick={startKakaoLogin}>카카오로 로그인</button>
      </section>
      <p className="notice"><Link to="/signup">회원가입</Link> | <Link to="/password/forgot">비밀번호 찾기</Link></p>
    </form>
  );
}
