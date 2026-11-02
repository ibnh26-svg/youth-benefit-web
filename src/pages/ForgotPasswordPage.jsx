import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, saveLogin } from '../api/client';

// 디자인은 두 화면(이메일 → 코드+새 비밀번호)인데, 서버는 세 번 부른다.
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState(null);

  async function sendCode(event) {
    event.preventDefault();
    setError(null);
    try {
      await api('/api/v1/auth/password/forgot', { method: 'POST', body: { email } });
      setStep(2);
    } catch (err) {
      setError(err);
    }
  }

  async function reset(event) {
    event.preventDefault();
    setError(null);
    try {
      const ticket = await api('/api/v1/auth/password/verify-code', { method: 'POST', body: { email, code } });
      const tokens = await api('/api/v1/auth/password/reset', {
        method: 'POST',
        body: { resetToken: ticket.resetToken, newPassword },
      });
      saveLogin(tokens);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err); // CODE_MISMATCH, CODE_EXPIRED, RESET_EXPIRED
    }
  }

  return (
    <>
      <section className="hero">
        <Link className="link-white" to="/login">← 로그인</Link>
        <h1>{step === 1 ? '비밀번호 찾기' : '새 비밀번호 설정'}</h1>
      </section>
      <section className="card">
        {error && <p className="error-box">{error.message}</p>}
        {step === 1 ? (
          <form onSubmit={sendCode}>
            <label>가입한 이메일<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <button className="btn-primary">코드 받기</button>
          </form>
        ) : (
          <form onSubmit={reset}>
            <label>인증 코드<input inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)} /></label>
            <label>새 비밀번호<input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></label>
            <button className="btn-primary">비밀번호 바꾸고 로그인</button>
          </form>
        )}
      </section>
    </>
  );
}
