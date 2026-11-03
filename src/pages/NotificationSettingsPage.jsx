import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, isLoggedIn } from '../api/client';
import { Loading, ErrorBox } from '../components/StateBox';

const DAYS = [{ value: 7, label: 'D-7' }, { value: 3, label: 'D-3' }, { value: 1, label: 'D-1' }, { value: 0, label: '당일' }];

// 30분 단위 시각 목록 (00:00 ~ 23:30)
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);

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
  const start = form.quietStart?.slice(0, 5);
  const end = form.quietEnd?.slice(0, 5);

  return (
    <>
      <section className="hero">
        <button className="link-white back" onClick={() => navigate('/notifications')}>← 알림</button>
        <h1>알림 수신 설정</h1>
      </section>

      <p className="section-label">받을 알림</p>
      <section className="card setting-card">
        <div className="setting-row">
          <SettingHead label="새 맞춤 공고" checked={form.newMatches} onChange={(v) => change('newMatches', v)} />
          <div className="chips">
            <button className={form.newMatchVerdicts.includes('MATCH') ? 'chip active' : 'chip'} onClick={() => toggle('newMatchVerdicts', 'MATCH')}>✓ 조건 일치</button>
            <button className={form.newMatchVerdicts.includes('NEEDS_CHECK') ? 'chip active' : 'chip'} onClick={() => toggle('newMatchVerdicts', 'NEEDS_CHECK')}>? 확인 필요</button>
          </div>
          <p className="hint">매일 오전 8시에 새로 올라온 공고를 묶어서 알려 드려요.</p>
        </div>

        <div className="setting-row">
          <SettingHead label="준비함 공고 마감" checked={form.deadline} onChange={(v) => change('deadline', v)} />
          <div className="chips">
            {DAYS.map((d) => (
              <button key={d.value} className={form.deadlineDays.includes(d.value) ? 'chip active' : 'chip'} onClick={() => toggle('deadlineDays', d.value)}>{d.label}</button>
            ))}
          </div>
        </div>

        <div className="setting-row">
          <SettingHead label="공고 변경" checked={form.changes} onChange={(v) => change('changes', v)} />
          <p className="hint">마감 연장·정정·취소 · 준비함에 담은 공고만 알려 드려요.</p>
        </div>

        <div className="setting-row">
          <SettingHead
            label="방해금지 시간"
            onText="켜기"
            checked={quietOn}
            onChange={(v) => setForm({ ...form, quietStart: v ? '22:00' : null, quietEnd: v ? '08:00' : null })}
          />
          {quietOn && (
            <div className="row-inline time-row">
              <select aria-label="시작" className="select-small" value={start} onChange={(e) => change('quietStart', e.target.value)}>
                {[...new Set([start, ...TIMES])].map((t) => <option key={t}>{t}</option>)}
              </select>
              ~
              <select aria-label="끝" className="select-small" value={end} onChange={(e) => change('quietEnd', e.target.value)}>
                {[...new Set([end, ...TIMES])].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          )}
        </div>
      </section>

      <p className="section-label">받는 방법</p>
      <section className="card setting-card">
        <div className="setting-row">
          <SettingHead label="앱 알림" checked={form.app} onChange={(v) => change('app', v)} />
        </div>
        <div className="setting-row">
          <SettingHead label="이메일" checked={form.email} onChange={(v) => change('email', v)} disabled={!isLoggedIn()} />
          <p className="hint">{isLoggedIn() ? '선택 동의 · 켜면 이메일 주소를 확인해요.' : '이메일 알림은 로그인하면 켤 수 있어요.'}</p>
        </div>
      </section>

      <p className="hint footnote">잠금 화면에는 소득·성적 등 조건을 표시하지 않아요.</p>
      {error && <ErrorBox error={error} />}
      <button className="btn-primary" onClick={save}>설정 저장</button>
    </>
  );
}

function SettingHead({ label, checked, onChange, disabled, onText = '받기' }) {
  return (
    <div className="row-between">
      <strong>{label}</strong>
      <label className="check small">
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        {onText}
      </label>
    </div>
  );
}
