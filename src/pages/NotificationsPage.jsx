import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { Loading, ErrorBox, Empty } from '../components/StateBox';
import { SlidersIcon, ChevronIcon, CloseIcon } from '../components/Icons';
import { VerdictBadge, dDayLabel, shortDate } from '../components/PolicyCard';

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

// 알림 종류 → 화면 탭 이름. 서버는 type(CHANGE·NEW_MATCHES·DEADLINE)과 kind(변경 종류)를 준다.
function kindOf(n) {
  if (n.type === 'NEW_MATCHES') return 'NEW';
  if (n.type === 'DEADLINE') return 'DEADLINE';
  if (n.kind === 'EXTENDED') return 'EXTENDED';
  if (n.kind === 'CANCELLED' || n.kind === 'REMOVED' || n.kind === 'CLOSED') return 'CANCELLED';
  if (n.kind === 'CORRECTED' || n.kind === 'UPDATED' || n.kind === 'RESTORED') return 'CORRECTED';
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

// 알림 상세(GET /me/notifications/{id}). 열면 서버가 읽음 처리한다.
// changes(전/후), newPolicies(새 공고 목록), deadline(마감) 중 하나만 채워져 온다.
function NotificationDetail({ id, onLoaded }) {
  const detail = useApi(`/api/v1/me/notifications/${id}`);

  useEffect(() => {
    if (detail.data) onLoaded();
    // onLoaded는 목록 새로고침이라 한 번만 부르면 된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.data]);

  if (detail.loading) return <p className="hint">불러오는 중이에요…</p>;
  if (detail.error) return <ErrorBox error={detail.error} onRetry={detail.reload} />;

  const d = detail.data;
  return (
    <div className="noti-detail">
      {d.changes?.map((c) => (
        <div className="change-pair" key={c.field ?? c.label}>
          <div className="before">
            <span className="hint">변경 전 · {c.label}</span>
            <s>{c.before ?? '없음'}</s>
          </div>
          <div className="after">
            <span className="hint">변경 후 · {c.label}</span>
            <strong>{c.after ?? '없음'}</strong>
          </div>
        </div>
      ))}

      {d.newPolicies?.length > 0 && (
        <ul className="new-list">
          {d.newPolicies.map((p, i) => {
            const pid = p.policyId ?? p.id ?? p.policy?.id;
            const title = p.title ?? p.policyTitle ?? p.policy?.title;
            return (
              <li key={pid ?? i}>
                {pid ? <Link to={`/policies/${pid}`}>{title}</Link> : <span>{title}</span>}
                {p.verdict && <VerdictBadge verdict={p.verdict} label={p.verdictLabel} />}
              </li>
            );
          })}
        </ul>
      )}

      {d.deadline && (
        <p className="deadline-line">
          {dDayLabel(d.deadline.dDay)}
          {d.deadline.applyEndDate && ` · ${shortDate(d.deadline.applyEndDate)} 마감`}
        </p>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const [tab, setTab] = useState('');
  const list = useApi(`/api/v1/me/notifications${tab ? `?tab=${tab}` : ''}`);
  const [openId, setOpenId] = useState(null);

  async function remove(id) {
    await api(`/api/v1/me/notifications/${id}`, { method: 'DELETE' });
    if (openId === id) setOpenId(null);
    list.reload();
  }

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
        const open = openId === n.id;
        return (
          <article className={n.read ? 'card' : 'card card-unread'} key={n.id}>
            <div className="row-between">
              <span className={`kind-chip kind-${kind}`}>{n.label}</span>
              <span className="row-inline hint">
                {!n.read && <span className="unread-dot" aria-label="안 읽음" />}
                {timeText(n.createdAt)}
                <button className="icon-btn" aria-label="알림 삭제" onClick={() => remove(n.id)}><CloseIcon size={14} /></button>
              </span>
            </div>
            <h3>{n.policyTitle ?? n.summary}</h3>
            {n.policyTitle && <p className="muted">{n.summary}</p>}
            {open && <NotificationDetail id={n.id} onLoaded={() => { if (!n.read) list.reload(); }} />}
            <div className="row-between card-links">
              {link ? <Link className="link" to={link.to}>{link.text}</Link> : <span />}
              <button className={open ? 'link-muted fold up' : 'link-muted fold'} onClick={() => setOpenId(open ? null : n.id)}>
                {open ? '접기' : '자세히'} <ChevronIcon size={14} />
              </button>
            </div>
          </article>
        );
      })}
    </>
  );
}
