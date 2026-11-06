import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, clearLogin, isLoggedIn } from '../api/client';
import { useApi } from '../hooks/useApi';
import { Loading, ErrorBox } from '../components/StateBox';
import { PasswordInput, Rule } from '../components/AuthInputs';

// 내 계정: 닉네임 변경(PATCH /me/account), 비밀번호 변경(POST /me/account/password), 회원 탈퇴(DELETE /me/account)
export default function AccountPage() {
  const navigate = useNavigate();
  const account = useApi(isLoggedIn() ? '/api/v1/me/account' : null);

  if (!isLoggedIn()) {
    return (
      <div className="state-box">
        <p>로그인하면 계정을 관리할 수 있어요.</p>
        <Link className="btn-primary" to="/login">로그인</Link>
      </div>
    );
  }
  if (account.loading) return <Loading />;
  if (account.error) return <ErrorBox error={account.error} onRetry={account.reload} />;

  return (
    <>
      <section className="hero">
        <button className="link-white back" onClick={() => navigate('/profile')}>← 내 정보</button>
        <h1>내 계정</h1>
        <p className="hero-sub">{account.data.email}</p>
      </section>

      <NicknameCard current={account.data.nickname} onSaved={account.reload} />
      {account.data.hasPassword === false ? (
        <section className="card">
          <h2 className="card-title">비밀번호 변경</h2>
          <p className="hint">카카오로 가입한 계정이라 비밀번호가 없어요. 카카오 로그인을 이용해 주세요.</p>
        </section>
      ) : (
        <PasswordCard />
      )}
      <WithdrawCard onDone={() => navigate('/', { replace: true })} />
    </>
  );
}

function NicknameCard({ current, onSaved }) {
  const [nickname, setNickname] = useState(current ?? '');
  const [state, setState] = useState({ error: null, done: false, sending: false });

  useEffect(() => setNickname(current ?? ''), [current]);

  async function save(event) {
    event.preventDefault();
    setState({ error: null, done: false, sending: true });
    try {
      await api('/api/v1/me/account', { method: 'PATCH', body: { nickname } });
      setState({ error: null, done: true, sending: false });
      onSaved();
    } catch (error) {
      setState({ error, done: false, sending: false });
    }
  }

  const valid = nickname.trim().length >= 2 && nickname.trim().length <= 10;

  return (
    <form className="card" onSubmit={save}>
      <h2 className="card-title">닉네임 변경</h2>
      <label>닉네임<input value={nickname} maxLength={10} onChange={(e) => { setNickname(e.target.value); setState((s) => ({ ...s, done: false })); }} /></label>
      <p className="hint">맞춤 홈에서 「{nickname || '홍길동'}님」처럼 불러 드려요. 2~10자</p>
      {state.error && <p className="error-box">{state.error.message}</p>}
      {state.done && <p className="hint ok">닉네임을 바꿨어요.</p>}
      <button className="btn-primary" disabled={!valid || nickname === current || state.sending}>
        {state.sending ? '저장하는 중…' : '닉네임 저장'}
      </button>
    </form>
  );
}

function PasswordCard() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [state, setState] = useState({ error: null, done: false, sending: false });

  const change = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setState((s) => ({ ...s, done: false })); };
  const longEnough = form.newPassword.length >= 8 && form.newPassword.length <= 64;
  const mixed = /[A-Za-z]/.test(form.newPassword) && /[0-9]/.test(form.newPassword);
  const same = form.newPassword !== '' && form.newPassword === form.confirm;

  async function save(event) {
    event.preventDefault();
    setState({ error: null, done: false, sending: true });
    try {
      await api('/api/v1/me/account/password', {
        method: 'POST',
        body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
      });
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
      setState({ error: null, done: true, sending: false });
    } catch (error) {
      setState({ error, done: false, sending: false });
    }
  }

  return (
    <form className="card" onSubmit={save}>
      <h2 className="card-title">비밀번호 변경</h2>
      <PasswordInput label="현재 비밀번호" name="currentPassword" required value={form.currentPassword} onChange={change} autoComplete="current-password" />
      <PasswordInput label="새 비밀번호" name="newPassword" required value={form.newPassword} onChange={change} autoComplete="new-password" />
      <Rule ok={longEnough}>8자 이상</Rule>
      <Rule ok={mixed}>영문과 숫자를 함께 사용</Rule>
      <PasswordInput label="새 비밀번호 확인" name="confirm" required value={form.confirm} onChange={change} autoComplete="new-password" />
      {form.confirm && !same && <p className="field-error">비밀번호가 서로 달라요.</p>}
      {state.error && <p className="error-box">{state.error.message}</p>}
      {state.done && <p className="hint ok">비밀번호를 바꿨어요.</p>}
      <button className="btn-primary" disabled={!form.currentPassword || !longEnough || !mixed || !same || state.sending}>
        {state.sending ? '바꾸는 중…' : '비밀번호 바꾸기'}
      </button>
    </form>
  );
}

function WithdrawCard({ onDone }) {
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  async function withdraw() {
    if (!window.confirm('정말 탈퇴할까요? 프로필, 준비함, 알림이 모두 지워지고 되돌릴 수 없어요.')) return;
    setSending(true);
    setError(null);
    try {
      await api('/api/v1/me/account', { method: 'DELETE' });
      clearLogin();
      onDone();
    } catch (err) {
      setError(err);
      setSending(false);
    }
  }

  return (
    <section className="card">
      <h2 className="card-title">회원 탈퇴</h2>
      <p className="hint">탈퇴하면 프로필, 준비함, 알림 설정이 모두 지워지고 되돌릴 수 없어요.</p>
      <label className="check small">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        위 내용을 확인했어요
      </label>
      {error && <p className="error-box">{error.message}</p>}
      <button type="button" className="btn-danger" disabled={!agree || sending} onClick={withdraw}>
        {sending ? '탈퇴하는 중…' : '회원 탈퇴'}
      </button>
    </section>
  );
}
