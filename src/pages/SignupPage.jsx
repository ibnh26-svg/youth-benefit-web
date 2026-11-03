import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { PasswordInput, Rule } from '../components/AuthInputs';

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirm: '', nickname: '' });
  const [error, setError] = useState(null);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const longEnough = form.password.length >= 8 && form.password.length <= 64;
  const mixed = /[A-Za-z]/.test(form.password) && /[0-9]/.test(form.password);
  const same = form.password !== '' && form.password === form.confirm;

  async function submit(event) {
    event.preventDefault();
    setError(null);
    try {
      const { email, password, nickname } = form;
      await api('/api/v1/auth/signup', { method: 'POST', body: { email, password, nickname } });
      navigate('/verify-email', { state: { email } });
    } catch (err) {
      setError(err); // 409 EMAIL_TAKEN이면 "이미 가입된 이메일이에요" 문구가 그대로 나온다
    }
  }

  return (
    <form onSubmit={submit}>
      <section className="hero">
        <Link className="link-white back" to="/login">← 로그인</Link>
        <h1>회원가입</h1>
        <p className="hero-sub">이메일로 가입하고, 메일로 받은 코드로 인증해요.</p>
      </section>
      <section className="card">
        {error && <p className="error-box">{error.message}</p>}
        <label>이메일<input name="email" type="email" required value={form.email} onChange={change} placeholder="example@email.com" /></label>
        <p className="hint">인증 코드를 이 주소로 보내요.</p>

        <PasswordInput label="비밀번호" name="password" required value={form.password} onChange={change} />
        <Rule ok={longEnough}>8자 이상</Rule>
        <Rule ok={mixed}>영문과 숫자를 함께 사용</Rule>

        <PasswordInput label="비밀번호 확인" name="confirm" required value={form.confirm} onChange={change} />
        {form.confirm && (same
          ? <p className="hint ok">비밀번호가 같아요.</p>
          : <p className="field-error">비밀번호가 서로 달라요.</p>)}

        <label>닉네임<input name="nickname" required minLength={2} maxLength={10} value={form.nickname} onChange={change} /></label>
        <p className="hint">맞춤 홈에서 「{form.nickname || '홍길동'}님」처럼 불러 드려요. 2~10자</p>
      </section>
      <button className="btn-primary" disabled={!longEnough || !mixed || !same}>가입하고 인증 코드 받기</button>
      <p className="notice">이미 계정이 있나요? <Link to="/login">로그인</Link></p>
    </form>
  );
}
