import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { Loading, ErrorBox, Empty } from '../components/StateBox';
import { dDayLabel } from '../components/PolicyCard';
import { HelpIcon, CloseIcon } from '../components/Icons';

function readGuideClosed() {
  try {
    return localStorage.getItem('prepGuideClosed') === 'yes';
  } catch {
    return false;
  }
}

const FILTERS = [
  { value: 'ALL', label: '전체' },
  { value: 'INTERESTED', label: '관심' },
  { value: 'PREPARING', label: '준비 중' },
  { value: 'APPLIED', label: '신청 완료' },
];

export default function PrepPage() {
  const list = useApi('/api/v1/me/applications');
  const [filter, setFilter] = useState('ALL');
  const [openId, setOpenId] = useState(null);
  const [guideOpen, setGuideOpen] = useState(() => !readGuideClosed());

  function closeGuide() {
    setGuideOpen(false);
    try { localStorage.setItem('prepGuideClosed', 'yes'); } catch { /* 저장 못 해도 괜찮다 */ }
  }

  if (list.loading) return <Loading />;
  if (list.error) return <ErrorBox error={list.error} onRetry={list.reload} />;

  const count = (status) => list.data.filter((a) => a.status === status).length;
  const shown = filter === 'ALL' ? list.data : list.data.filter((a) => a.status === filter);

  return (
    <>
      <section className="hero">
        <div className="row-between">
          <p className="row-inline">
            준비함
            <button className="icon-btn-white" aria-label="서류 준비 안내" onClick={() => setGuideOpen(!guideOpen)}><HelpIcon size={18} /></button>
          </p>
          <Link className="btn-white-small" to="/custom-policies/new">+ 공고 직접 추가</Link>
        </div>
        <h1>담아 둔 공고를<br />마감 전에 준비해요</h1>
      </section>

      {guideOpen && (
        <section className="guide-box">
          <div className="row-between">
            <strong>서류는 이렇게 준비해요</strong>
            <button className="icon-btn" aria-label="안내 닫기" onClick={closeGuide}><CloseIcon size={18} /></button>
          </div>
          <ol>
            <li>공고를 담으면 필요한 서류가 체크리스트로 만들어져요.</li>
            <li>서류 아래 발급 안내를 눌러 어디서 떼는지 확인하세요.</li>
            <li>준비한 서류는 체크하고, 다 끝나면 상태를 「신청 완료」로 바꿔요.</li>
          </ol>
        </section>
      )}

      <div className="chips">
        {FILTERS.map((f) => (
          <button key={f.value} className={f.value === filter ? 'chip active' : 'chip'} onClick={() => setFilter(f.value)}>
            {f.label} {f.value === 'ALL' ? list.data.length : count(f.value)}
          </button>
        ))}
      </div>

      {shown.length === 0 && <Empty title="담은 공고가 없어요">공고 상세에서 관심 담기를 눌러 보세요.</Empty>}

      {shown.map((a) => (
        <article className="card" key={a.id}>
          <div className="row-between">
            <span className="chip-small">{a.statusLabel}</span>
            <span className={a.deadline.dDay !== null && a.deadline.dDay <= 3 ? 'deadline urgent' : 'deadline'}>
              {a.deadline.dDay === null ? '상시 모집' : dDayLabel(a.deadline.dDay)}
            </span>
          </div>
          <h3>{a.title}</h3>
          <p className="muted">서류 준비 {a.progress.done}/{a.progress.total}</p>
          <progress value={a.progress.done} max={a.progress.total || 1} />
          <button className="link" onClick={() => setOpenId(openId === a.id ? null : a.id)}>
            {openId === a.id ? '접기' : '서류 체크리스트 펼치기'}
          </button>
          {openId === a.id && <Checklist id={a.id} onChanged={list.reload} />}
        </article>
      ))}
    </>
  );
}

function Checklist({ id, onChanged }) {
  const detail = useApi(`/api/v1/me/applications/${id}`);
  const [newItem, setNewItem] = useState('');

  async function run(path, options) {
    await api(path, options);
    detail.reload(); // 체크리스트 다시 받기
    onChanged(); // 바깥 진행률도 다시 받기
  }

  if (detail.loading && !detail.data) return <Loading />;
  if (detail.error) return <ErrorBox error={detail.error} onRetry={detail.reload} />;

  const base = `/api/v1/me/applications/${id}`;

  return (
    <div>
      <label>상태
        <select
          value={detail.data.status}
          onChange={(e) => run(base, { method: 'PATCH', body: { status: e.target.value } })}
        >
          <option value="INTERESTED">관심</option>
          <option value="PREPARING">준비 중</option>
          <option value="APPLIED">신청 완료</option>
        </select>
      </label>

      {detail.data.items.map((item) => (
        <div key={item.id} className="check-row">
          <label className="check">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => run(`${base}/items/${item.id}`, { method: 'PATCH', body: { checked: e.target.checked } })}
            />
            {item.content} {item.optional ? '(선택)' : '(필수)'}
            {item.policyChangeLabel && <span className="badge badge-check">{item.policyChangeLabel}</span>}
          </label>
          {item.guide && <a className="muted" href={item.guide.url} target="_blank" rel="noreferrer">{item.guide.label} →</a>}
          <button className="link" onClick={() => run(`${base}/items/${item.id}`, { method: 'DELETE' })}>삭제</button>
        </div>
      ))}

      <form
        className="row-two"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!newItem.trim()) return;
          await run(`${base}/items`, { method: 'POST', body: { content: newItem } });
          setNewItem('');
        }}
      >
        <input aria-label="서류 이름" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="서류 이름" />
        <button className="btn-secondary">+ 서류 직접 추가</button>
      </form>
      <Link className="link" to={`/policies/${detail.data.policyId}`}>공고 상세 보기 →</Link>
    </div>
  );
}
