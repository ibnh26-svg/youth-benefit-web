import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, isLoggedIn } from '../api/client';
import { Loading, ErrorBox } from '../components/StateBox';

const DAYS = [{ value: 7, label: 'D-7' }, { value: 3, label: 'D-3' }, { value: 1, label: 'D-1' }, { value: 0, label: '당일' }];

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('/api/v1/me/notification-settings').then(setForm).catch(setError);
  }, []);

  if (error && !form) return <ErrorBox error={error} />;
  if (!form) return <Loading />;

  const change = (name, value) => setForm({ ...form, [name]: value });
  const toggle = (name, value) => change(
    name,
    form[name].includes(value) ? form[name].filter((v) => v !== value) : [...form[name], value],
  );

  async function save() {
    setError(null);
    try {
      await api('/api/v1/me/notification-settings', { method: 'PUT', body: form });
      navigate('/notifications');
    } catch (err) {
      setError(err);
    }
  }

  const quietOn = Boolean(form.quietStart);

  return (
    <>
      <section className="hero"><h1>알림 수신 설정</h1></section>

      <section className="card">
        <Switch label="새 맞춤 공고" checked={form.newMatches} onChange={(v) => change('newMatches', v)} />
        <div className="chips">
          <button className={form.newMatchVerdicts.includes('MATCH') ? 'chip active' : 'chip'} onClick={() => toggle('newMatchVerdicts', 'MATCH')}>조건 일치</button>
          <button className={form.newMatchVerdicts.includes('NEEDS_CHECK') ? 'chip active' : 'chip'} onClick={() => toggle('newMatchVerdicts', 'NEEDS_CHECK')}>확인 필요</button>
        </div>

        <Switch label="준비함 공고 마감" checked={form.deadline} onChange={(v) => change('deadline', v)} />
        <div className="chips">
          {DAYS.map((d) => (
            <button key={d.value} className={form.deadlineDays.includes(d.value) ? 'chip active' : 'chip'} onClick={() => toggle('deadlineDays', d.value)}>{d.label}</button>
          ))}
        </div>

        <Switch label="공고 변경" checked={form.changes} onChange={(v) => change('changes', v)} />

        <Switch
          label="방해금지 시간"
          checked={quietOn}
          onChange={(v) => setForm({ ...form, quietStart: v ? '22:00' : null, quietEnd: v ? '08:00' : null })}
        />
        {quietOn && (
          <div className="row-two">
            <input aria-label="시작" type="time" value={form.quietStart.slice(0, 5)} onChange={(e) => change('quietStart', e.target.value)} />
            <input aria-label="끝" type="time" value={form.quietEnd.slice(0, 5)} onChange={(e) => change('quietEnd', e.target.value)} />
          </div>
        )}
      </section>

      <section className="card">
        <Switch label="앱 알림" checked={form.app} onChange={(v) => change('app', v)} />
        <Switch label="이메일" checked={form.email} onChange={(v) => change('email', v)} disabled={!isLoggedIn()} />
        {!isLoggedIn() && <p className="muted">이메일 알림은 로그인하면 켤 수 있어요.</p>}
      </section>

      {error && <ErrorBox error={error} />}
      <button className="btn-primary" onClick={save}>설정 저장</button>
    </>
  );
}

function Switch({ label, checked, onChange, disabled }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
