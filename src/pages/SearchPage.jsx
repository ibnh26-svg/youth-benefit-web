import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Loading, ErrorBox } from '../components/StateBox';
import PolicyCard from '../components/PolicyCard';
import { SearchIcon, ClockIcon, CloseIcon } from '../components/Icons';

function readRecent() {
  try {
    return JSON.parse(localStorage.getItem('recentSearches')) ?? [];
  } catch {
    return [];
  }
}

// 서버가 준 understood 를 화면 칩 목록으로 바꾼다. off 는 ×를 눌렀을 때 붙일 조건이다.
function toChips(u) {
  const chips = [];
  if (u.region) chips.push({ text: u.regionFromProfile ? `내 지역 · ${u.region}` : u.region, off: ['noRegion', 'true'] });
  u.categories.forEach((c) => chips.push({ text: c, off: ['noCategory', 'true'] }));
  if (u.age !== null) chips.push({ text: `만 ${u.age}세`, off: ['noAge', 'true'] });
  if (u.closingSoon) chips.push({ text: '마감 임박', off: ['noClosingSoon', 'true'] });
  [...u.keywords, ...u.audience].forEach((group) => chips.push({ text: group[0], off: ['drop', group[0]] }));
  return chips;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [removed, setRemoved] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState(readRecent);

  function saveRecent(next) {
    setRecent(next);
    try { localStorage.setItem('recentSearches', JSON.stringify(next)); } catch { /* 저장 못 해도 괜찮다 */ }
  }

  async function search(q, nextRemoved = []) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setQuery(q);
    setRemoved(nextRemoved);
    try {
      const params = new URLSearchParams({ q });
      nextRemoved.forEach(([name, value]) => params.append(name, value));
      setResult(await api(`/api/v1/search?${params}`));
      saveRecent([q, ...recent.filter((r) => r !== q)].slice(0, 5));
    } catch (err) {
      setError(err); // 429 RATE_LIMITED면 "검색이 너무 잦아요" 문구가 그대로 나온다
    } finally {
      setLoading(false);
    }
  }

  const needsCheck = result?.content.filter((item) => item.verdict === 'NEEDS_CHECK').length ?? 0;

  return (
    <>
      <section className="hero">
        <button className="link-white back" onClick={() => navigate('/')}>← 홈</button>
        <form onSubmit={(e) => { e.preventDefault(); search(text); }} className="search-box">
          <SearchIcon size={20} />
          <input aria-label="검색어" value={text} onChange={(e) => setText(e.target.value)} placeholder="월세 지원받을 수 있는 거 있어?" />
          <button className="search-btn">검색</button>
        </form>
      </section>

      {loading && <Loading />}
      {error && <ErrorBox error={error} />}

      {result && !loading && (
        <>
          <div className="row-between">
            <p className="label">이 조건으로 찾았어요</p>
            <span className="hint">필요 없는 조건은 ×로 빼세요</span>
          </div>
          <div className="chips">
            {toChips(result.understood).map((chip) => (
              <button key={chip.text} className="chip chip-soft" onClick={() => search(query, [...removed, chip.off])}>
                {chip.text} <CloseIcon size={12} />
              </button>
            ))}
          </div>

          {result.content.length === 0 ? (
            <>
              <section className="card empty-card">
                <SearchIcon size={26} />
                <strong>맞는 공고를 찾지 못했어요</strong>
                <p className="muted">{result.message ?? '조건을 하나 빼고 다시 찾아보거나, 알고 있는 공고를 직접 등록해 주세요.'}</p>
              </section>
              <section className="card card-blue">
                <h2>찾는 공고가 따로 있나요?</h2>
                <p>공고 링크나 캡처를 올리면 준비함에 담아 마감을 챙겨 드려요.</p>
                <Link className="btn-white" to="/custom-policies/new">공고 직접 등록하기</Link>
              </section>
              <p className="notice">등록한 공고는 나만 볼 수 있어요.</p>
            </>
          ) : (
            <>
              {(needsCheck > 0 || result.notice) && (
                <section className="card card-blue compact">
                  {needsCheck > 0 && <strong>확인할 공고 {needsCheck}건이 있어요.</strong>}
                  {result.notice && <p>{result.notice}</p>}
                </section>
              )}
              {result.content.map((item) => <PolicyCard key={item.policy.id} item={item} />)}
              <div className="row-between under-save">
                <span className="hint">찾는 공고가 따로 있나요?</span>
                <Link className="link" to="/custom-policies/new">직접 등록하기 →</Link>
              </div>
            </>
          )}
        </>
      )}

      {recent.length > 0 && !loading && (
        <>
          <h2>최근 검색</h2>
          <section className="card recent-card">
            {recent.map((r) => (
              <button key={r} className="list-row recent-row" onClick={() => { setText(r); search(r); }}>
                <span className="row-inline"><ClockIcon size={16} />{r}</span>
              </button>
            ))}
          </section>
        </>
      )}
    </>
  );
}
