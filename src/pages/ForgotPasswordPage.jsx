import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, saveLogin } from '../api/client';
import { PasswordInput, CodeInput, Rule } from '../components/AuthInputs';
import { useCountdown } from '../hooks/useCountdown';
import { ClockIcon, MailIcon } from '../components/Icons';

// 디자인은 두 화면(이메일 → 코드+새 비밀번호)인데, 서버는 세 번 부른다.
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const timer = useCountdown(0);

  const longEnough = newPassword.length >= 8 && newPassword.length <= 64;
  const mixed = /[A-Za-z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const same = newPassword !== '' && newPassword === confirm;

  async function sendCode(event) {
    event?.preventDefault();
    setError(null);
    try {
      const sent = await api('/api/v1/auth/password/forgot', { method: 'POST', body: { email } });
      timer.restart(sent?.expiresInSeconds ?? 600);
      setCode('');
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
        {step === 1
          ? <Link className="link-white back" to="/login">← 로그인</Link>
          : <button className="link-white back" onClick={() => { setStep(1); setError(null); }}>← 이메일 다시 입력</button>}
        <div className="steps"><span className="on" /><span className={step === 2 ? 'on' : ''} /></div>
        <h1>{step === 1 ? '비밀번호 찾기' : '새 비밀번호 설정'}</h1>
        <p className="hero-sub">{step === 1 ? '가입한 이메일로 6자리 코드를 보내 드려요.' : '메일로 받은 코드와 새 비밀번호를 입력하세요.'}</p>
        {step === 2 && <span className="email-chip"><MailIcon size={15} />{email}</span>}
      </section>

      {step === 1 ? (
        <>
          <form className="card" onSubmit={sendCode}>
            {error && <p className="error-box">{error.message}</p>}
            <label>가입한 이메일<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" /></label>
            <button className="btn-primary">코드 받기</button>
          </form>
          <p className="notice">카카오로 가입했다면 카카오 로그인을 이용해 주세요.</p>
        </>
      ) : (
        <form onSubmit={reset}>
          <section className="card">
            {error && <p className="error-box">{error.message}</p>}
            <div className="row-between">
              <span className="label">인증 코드</span>
              <span className="timer row-inline"><ClockIcon size={15} />{timer.text} 남음</span>
            </div>
            <CodeInput value={code} onChange={setCode} />
            <div className="row-between">
              <span className="hint">코드는 10분 동안 유효해요.</span>
              <button type="button" className="link" onClick={() => sendCode()}>다시 보내기</button>
            </div>

            <PasswordInput label="새 비밀번호" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <Rule ok={longEnough}>8자 이상</Rule>
            <Rule ok={mixed}>영문과 숫자를 함께 사용</Rule>
            <PasswordInput label="새 비밀번호 확인" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {confirm && !same && <p className="field-error">비밀번호가 서로 달라요.</p>}
          </section>
          <button className="btn-primary" disabled={code.length !== 6 || !longEnough || !mixed || !same}>비밀번호 바꾸고 로그인</button>
        </form>
      )}
    </>
  );
}
