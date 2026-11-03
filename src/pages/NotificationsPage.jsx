import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { Loading, ErrorBox, Empty } from '../components/StateBox';

// "오늘 08:00" / "어제 21:30" / "11.02"
function timeText(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return `오늘 ${hhmm}`;
  if (date.toDateString() === yesterday.toDateString()) return `어제 ${hhmm}`;
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

const TABS = [
  { value: '', label: '전체' },
  { value: 'NEW', label: '새 공고' },
  { value: 'EXTENDED', label: '마감 연장' },
  { value: 'CORRECTED', label: '정정' },
  { value: 'CANCELLED', label: '취소' },
];

export default function NotificationsPage() {
  const [tab, setTab] = useState('');
  const list = useApi(`/api/v1/me/notifications${tab ? `?tab=${tab}` : ''}`);

  async function readAll() {
    await api('/api/v1/me/notifications/read-all', { method: 'POST' });
    list.reload();
  }

  return (
    <>
      <section className="hero">
        <div className="row-between">
          <p>알림</p>
          <span>
            <button className="btn-white-small" onClick={readAll}>모두 읽음</button>{' '}
            <Link className="btn-white-small" to="/notifications/settings">설정</Link>
          </span>
        </div>
        <h1>새 공고와 바뀐 공고를<br />알려 드려요</h1>
      </section>

      <div className="chips">
        {TABS.map((t) => (
          <button key={t.value} className={t.value === tab ? 'chip active' : 'chip'} onClick={() => setTab(t.value)}>{t.label}</button>
        ))}
      </div>

      {list.loading && <Loading />}
      {list.error && <ErrorBox error={list.error} onRetry={list.reload} />}
      {list.data?.items.length === 0 && <Empty title="알림이 없어요">담은 공고가 바뀌면 여기에 알려 드려요.</Empty>}

      {list.data?.items.map((n) => (
        <article className="card" key={n.id}>
          <div className="row-between">
            <span className="row-inline">
              {!n.read && <span className="unread-dot" aria-label="안 읽음" />}
              <span className="chip-small">{n.label}</span>
            </span>
            <span className="muted">{timeText(n.createdAt)}</span>
          </div>
          <h3>{n.policyTitle ?? n.summary}</h3>
          {n.policyTitle && <p className="muted">{n.summary}</p>}
          {n.policyId && <Link className="link" to={`/policies/${n.policyId}`}>공고 보기 →</Link>}
        </article>
      ))}
    </>
  );
}
