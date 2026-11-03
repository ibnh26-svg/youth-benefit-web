import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { Loading, ErrorBox, Empty } from '../components/StateBox';
import { dDayLabel, shortDate } from '../components/PolicyCard';
import { HelpIcon, CloseIcon, ClockIcon, ChevronIcon } from '../components/Icons';

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

// "D-22 · 11.14 마감" / "오늘 마감" / "상시 모집"
function prepDeadline(deadline) {
  if (!deadline || deadline.dDay === null || deadline.dDay === undefined) return '상시 모집';
  const date = shortDate(deadline.date ?? deadline.endDate ?? deadline.applyEndDate);
  if (deadline.dDay === 0) return date ? `오늘 마감 · ${date}` : '오늘 마감';
  return date ? `${dDayLabel(deadline.dDay)} · ${date} 마감` : dDayLabel(deadline.dDay);
}

export default function PrepPage() {
  const list = useApi('/api/v1/me/applications');
  const [filter, setFilter] = useState('ALL');
  const [openId, setOpenId] = useState(null);

  if (list.loading) return <Loading />;
  if (list.error) return <ErrorBox error={list.error} onRetry={list.reload} />;

  const count = (status) => list.data.filter((a) => a.status === status).length;
  const shown = filter === 'ALL' ? list.data : list.data.filter((a) => a.status === filter);

  async function cancel(a) {
    if (!window.confirm(`「${a.title}」을(를) 준비함에서 뺄까요?`)) return;
    await api(`/api/v1/me/applications/${a.id}`, { method: 'DELETE' });
    if (openId === a.id) setOpenId(null);
    list.reload();
  }

  return (
    <>
      <section className="hero">
        <div className="row-between">
          <p>준비함</p>
          <Link className="btn-white-small" to="/custom-policies/new">+ 공고 직접 추가</Link>
        </div>
        <h1>담아 둔 공고를<br />마감 전에 준비해요</h1>
        <p className="hero-sub">서류와 마감을 한곳에서 챙겨요.</p>
      </section>

      <div className="chips">
        {FILTERS.map((f) => (
          <button key={f.value} className={f.value === filter ? 'chip active' : 'chip'} onClick={() => setFilter(f.value)}>
            {f.label} {f.value === 'ALL' ? list.data.length : count(f.value)}
          </button>
        ))}
      </div>

      {shown.length === 0 && <Empty title="담은 공고가 없어요">공고 상세에서 관심 담기를 눌러 보세요.</Empty>}

      {shown.map((a) => {
        const open = openId === a.id;
        const urgent = a.deadline?.dDay !== null && a.deadline?.dDay !== undefined && a.deadline.dDay <= 3;

        // 신청 완료 카드는 짧게
        if (a.status === 'APPLIED' && !open) {
          return (
            <article className="card" key={a.id}>
              <div className="row-between">
                <span className="badge badge-match">✓ 신청 완료</span>
                <span className="hint">{a.appliedAt ? `${shortDate(a.appliedAt)} 완료 표시` : ''}</span>
              </div>
              <h3>{a.title}</h3>
              <p className="hint">신청 완료 공고는 마감 알림을 보내지 않아요.</p>
              <button className="link" onClick={() => setOpenId(a.id)}>상태 바꾸기</button>
            </article>
          );
        }

        return (
          <article className={open ? 'card prep-card open' : 'card prep-card'} key={a.id}>
            <div className="row-between">
              <span className="chip-small status">{a.statusLabel}</span>
              <span className={urgent ? 'deadline urgent row-inline' : 'deadline row-inline'}>
                <ClockIcon size={15} />{prepDeadline(a.deadline)}
              </span>
            </div>
            <h3>{a.title}</h3>
            <div className="row-between progress-head">
              <span className="hint">서류 준비</span>
              <strong>{a.progress.done}/{a.progress.total}</strong>
            </div>
            <div className="bar"><span style={{ width: `${a.progress.total ? (a.progress.done / a.progress.total) * 100 : 0}%` }} /></div>

            {open ? (
              <Checklist id={a.id} onChanged={list.reload} />
            ) : (
              <div className="row-between card-links">
                <Link className="link" to={`/policies/${a.policyId}`}>공고 상세 보기 →</Link>
                <button className="link-muted" onClick={() => cancel(a)}>담기 취소</button>
              </div>
            )}
            {open && (
              <div className="row-between card-links">
                <Link className="link" to={`/policies/${a.policyId}`}>공고 상세 보기 →</Link>
                <button className="link-muted" onClick={() => cancel(a)}>담기 취소</button>
              </div>
            )}

            <button className={open ? 'fold-btn up' : 'fold-btn'} onClick={() => setOpenId(open ? null : a.id)}>
              {open ? '접기' : '서류 체크리스트 펼치기'} <ChevronIcon size={16} />
            </button>
          </article>
        );
      })}
    </>
  );
}

function Checklist({ id, onChanged }) {
  const detail = useApi(`/api/v1/me/applications/${id}`);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [guideOpen, setGuideOpen] = useState(() => !readGuideClosed());

  function closeGuide() {
    setGuideOpen(false);
    try { localStorage.setItem('prepGuideClosed', 'yes'); } catch { /* 저장 못 해도 괜찮다 */ }
  }

  async function run(path, options) {
    await api(path, options);
    detail.reload(); // 체크리스트 다시 받기
    onChanged(); // 바깥 진행률도 다시 받기
  }

  if (detail.loading && !detail.data) return <Loading />;
  if (detail.error) return <ErrorBox error={detail.error} onRetry={detail.reload} />;

  const base = `/api/v1/me/applications/${id}`;

  return (
    <div className="checklist">
      <div className="row-between status-row">
        <span className="hint">상태</span>
        <select
          aria-label="상태"
          className="select-small"
          value={detail.data.status}
          onChange={(e) => run(base, { method: 'PATCH', body: { status: e.target.value } })}
        >
          <option value="INTERESTED">관심</option>
          <option value="PREPARING">준비 중</option>
          <option value="APPLIED">신청 완료</option>
        </select>
      </div>

      <h3 className="row-inline">
        서류 체크리스트
        <button className="help-dot" aria-label="서류 준비 안내" onClick={() => setGuideOpen(!guideOpen)}><HelpIcon size={16} /></button>
      </h3>

      {guideOpen && (
        <section className="guide-box">
          <div className="row-between">
            <strong>서류는 이렇게 준비해요</strong>
            <button className="icon-btn" aria-label="안내 닫기" onClick={closeGuide}><CloseIcon size={16} /></button>
          </div>
          <ul>
            <li>준비한 서류는 체크만 하세요. 파일은 올리지 않고, 제출은 신청 사이트에서 해요.</li>
            <li>서류마다 발급 기준일이 달라요. 공고 원문을 꼭 확인하세요.</li>
            <li>공고에 없는 서류는 + 서류 직접 추가로 넣을 수 있어요.</li>
          </ul>
        </section>
      )}

      {detail.data.items.map((item) => (
        <div key={item.id} className="check-row">
          <input
            type="checkbox"
            aria-label={item.content}
            checked={item.checked}
            onChange={(e) => run(`${base}/items/${item.id}`, { method: 'PATCH', body: { checked: e.target.checked } })}
          />
          <div className="check-body">
            {editingId === item.id ? (
              <form
                className="row-two tight"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (editText.trim()) await run(`${base}/items/${item.id}`, { method: 'PATCH', body: { content: editText } });
                  setEditingId(null);
                }}
              >
                <input aria-label="서류 이름 수정" value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
                <button className="btn-white-small">저장</button>
              </form>
            ) : (
              <span className="row-inline wrap">
                {item.content}
                <span className={item.optional ? 'pill-opt' : 'pill-req'}>{item.optional ? '선택' : '필수'}</span>
                {item.policyChangeLabel && <span className="badge badge-check">{item.policyChangeLabel}</span>}
              </span>
            )}
            {item.guide && <a className="hint" href={item.guide.url} target="_blank" rel="noreferrer">{item.guide.label} →</a>}
          </div>
          {editingId !== item.id && (
            <span className="row-actions">
              <button className="link-muted" onClick={() => { setEditingId(item.id); setEditText(item.content); }}>수정</button>
              <button className="link-muted" onClick={() => run(`${base}/items/${item.id}`, { method: 'DELETE' })}>삭제</button>
            </span>
          )}
        </div>
      ))}

      {adding ? (
        <form
          className="row-two tight add-row"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newItem.trim()) return;
            await run(`${base}/items`, { method: 'POST', body: { content: newItem } });
            setNewItem('');
            setAdding(false);
          }}
        >
          <input aria-label="서류 이름" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="서류 이름" autoFocus />
          <button className="btn-white-small">추가</button>
        </form>
      ) : (
        <button className="dashed-btn" onClick={() => setAdding(true)}>+ 서류 직접 추가</button>
      )}
    </div>
  );
}
