import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { Loading, ErrorBox, Empty } from '../components/StateBox';
import { SlidersIcon } from '../components/Icons';

// "오늘 08:00" / "어제 18:00" / "10.20 14:00"
function timeText(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return `오늘 ${hhmm}`;
  if (date.toDateString() === yesterday.toDateString()) return `어제 ${hhmm}`;
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${hhmm}`;
}

const TABS = [
  { value: '', label: '전체' },
  { value: 'NEW', label: '새 공고' },
  { value: 'EXTENDED', label: '마감 연장' },
  { value: 'CORRECTED', label: '정정' },
  { value: 'CANCELLED', label: '취소' },
];

// 알림 종류. 서버 tab 값이 있으면 그걸, 없으면 label 글자로 짐작한다.
function kindOf(n) {
  if (TABS.some((t) => t.value && t.value === n.tab)) return n.tab;
  const label = n.label ?? '';
  if (label.includes('연장')) return 'EXTENDED';
  if (label.includes('정정')) return 'CORRECTED';
  if (label.includes('취소')) return 'CANCELLED';
  if (label.includes('새')) return 'NEW';
  return 'OTHER';
}

// 종류마다 카드 아래 링크
function linkOf(n, kind) {
  if (kind === 'NEW') return { to: '/', text: '맞춤 홈에서 보기 →' };
  if (kind === 'CORRECTED') return { to: '/prep', text: '준비함 체크리스트에 반영돼요 →' };
  if (kind === 'CANCELLED') return { to: '/prep', text: '준비함에서 확인 →' };
  if (n.policyId) return { to: `/policies/${n.policyId}`, text: '공고 보기 →' };
  return null;
}

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
          <span className="row-inline">
            <button className="btn-white-small" onClick={readAll}>모두 읽음</button>
            <Link className="btn-white-small with-icon" to="/notifications/settings"><SlidersIcon size={16} />설정</Link>
          </span>
        </div>
        <h1>새 공고와 바뀐 공고를<br />알려 드려요</h1>
        <p className="hero-sub">새 맞춤 공고와 변경 소식을 모아 봐요.</p>
      </section>

      <div className="chips">
        {TABS.map((t) => (
          <button key={t.value} className={t.value === tab ? 'chip active' : 'chip'} onClick={() => setTab(t.value)}>{t.label}</button>
        ))}
      </div>

      {list.loading && <Loading />}
      {list.error && <ErrorBox error={list.error} onRetry={list.reload} />}
      {list.data?.items.length === 0 && <Empty title="알림이 없어요">담은 공고가 바뀌면 여기에 알려 드려요.</Empty>}

      {list.data?.items.map((n) => {
        const kind = kindOf(n);
        const link = linkOf(n, kind);
        return (
          <article className={n.read ? 'card' : 'card card-unread'} key={n.id}>
            <div className="row-between">
              <span className={`kind-chip kind-${kind}`}>{n.label}</span>
              <span className="row-inline hint">
                {!n.read && <span className="unread-dot" aria-label="안 읽음" />}
                {timeText(n.createdAt)}
              </span>
            </div>
            <h3>{n.policyTitle ?? n.summary}</h3>
            {n.policyTitle && <p className="muted">{n.summary}</p>}
            {link && <Link className="link" to={link.to}>{link.text}</Link>}
          </article>
        );
      })}
    </>
  );
}
