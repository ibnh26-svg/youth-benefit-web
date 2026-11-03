import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api, saveLogin } from '../api/client';
import { useCountdown } from '../hooks/useCountdown';
import { CodeInput } from '../components/AuthInputs';
import { ClockIcon, MailIcon, InfoIcon } from '../components/Icons';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const email = useLocation().state?.email; // 가입 화면이 넘겨준 이메일
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const timer = useCountdown(600);

  if (!email) return <div className="state-box"><Link className="link" to="/signup">회원가입부터 해 주세요</Link></div>;

  async function verify(event) {
    event.preventDefault();
    setError(null);
    try {
      const tokens = await api('/api/v1/auth/email/verify', { method: 'POST', body: { email, code } });
      saveLogin(tokens);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err); // CODE_MISMATCH(남은 횟수 포함) 또는 CODE_EXPIRED
    }
  }

  async function resend() {
    setError(null);
    try {
      const sent = await api('/api/v1/auth/email/resend', { method: 'POST', body: { email } });
      timer.restart(sent.expiresInSeconds);
      setCode('');
      setInfo('새 코드를 보냈어요. 이전 코드는 쓸 수 없어요.');
    } catch (err) {
      setError(err); // 1분 안에 다시 누르면 CODE_COOLDOWN
    }
  }

  return (
    <form onSubmit={verify}>
      <section className="hero">
        <Link className="link-white back" to="/signup">← 회원가입</Link>
        <h1>이메일 인증</h1>
        <p className="hero-sub">메일로 보낸 6자리 코드를 입력하세요.</p>
        <span className="email-chip"><MailIcon size={15} />{email}</span>
      </section>
      <section className="card">
        {error && <p className="error-box">{error.message}</p>}
        {info && <p className="hint ok">{info}</p>}
        <div className="row-between">
          <span className="label">인증 코드</span>
          <span className="timer row-inline"><ClockIcon size={15} />{timer.text} 남음</span>
        </div>
        <CodeInput value={code} onChange={setCode} />
        <p className="hint">코드는 10분 동안 유효해요.</p>
        <button className="btn-primary" disabled={code.length !== 6}>확인</button>
        <div className="row-between">
          <span className="hint">메일이 안 왔나요?</span>
          <button type="button" className="link" onClick={resend}>코드 다시 보내기</button>
        </div>
      </section>
      <p className="info-line"><InfoIcon size={16} />스팸함도 확인해 주세요. 코드를 다시 보내면 이전 코드는 쓸 수 없어요.</p>
    </form>
  );
}
