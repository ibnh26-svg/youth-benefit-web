import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Loading, ErrorBox, Empty } from '../components/StateBox';
import PolicyCard from '../components/PolicyCard';

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
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [removed, setRemoved] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState(readRecent);

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
      const nextRecent = [q, ...recent.filter((r) => r !== q)].slice(0, 5);
      setRecent(nextRecent);
      localStorage.setItem('recentSearches', JSON.stringify(nextRecent));
    } catch (err) {
      setError(err); // 429 RATE_LIMITED면 "검색이 너무 잦아요" 문구가 그대로 나온다
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section className="hero">
        <form onSubmit={(e) => { e.preventDefault(); search(text); }} className="row-two">
          <input aria-label="검색어" value={text} onChange={(e) => setText(e.target.value)} placeholder="월세 지원받을 수 있는 거 있어?" />
          <button className="btn-white-small">검색</button>
        </form>
      </section>

      {loading && <Loading />}
      {error && <ErrorBox error={error} />}

      {result && (
        <>
          <p className="label">이 조건으로 찾았어요 <span className="muted">필요 없는 조건은 ×로 빼세요</span></p>
          <div className="chips">
            {toChips(result.understood).map((chip) => (
              <button key={chip.text} className="chip" onClick={() => search(query, [...removed, chip.off])}>
                {chip.text} ×
              </button>
            ))}
          </div>
          {result.notice && <p className="muted">{result.notice}</p>}
          {result.content.length === 0 && (
            <Empty title="맞는 공고를 찾지 못했어요">{result.message ?? '조건을 하나 빼고 다시 찾아보세요.'}</Empty>
          )}
          {result.content.map((item) => <PolicyCard key={item.policy.id} item={item} />)}
          <Link className="link" to="/custom-policies/new">찾는 공고가 따로 있나요? 직접 등록하기 →</Link>
        </>
      )}

      {!result && recent.length > 0 && (
        <section className="card">
          <h2>최근 검색</h2>
          {recent.map((r) => (
            <button key={r} className="link" onClick={() => { setText(r); search(r); }}>{r}</button>
          ))}
        </section>
      )}
    </>
  );
}
