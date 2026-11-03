import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isLoggedIn } from '../api/client';
import { useApi } from '../hooks/useApi';
import { Loading, ErrorBox, Empty } from '../components/StateBox';
import PolicyCard, { ClosingCard } from '../components/PolicyCard';

const CATEGORIES = ['전체', '일자리', '주거', '교육', '복지문화', '참여권리'];

export default function HomePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('전체');
  const [sort, setSort] = useState('recommended');
  const [verdict, setVerdict] = useState('');
  const [showNoMatch, setShowNoMatch] = useState(false);
  const [page, setPage] = useState(0); // 공고는 20개씩 나뉘어 온다

  // 주소 뒤 조건(쿼리)을 만든다. 한글은 URLSearchParams가 알아서 처리한다.
  const params = new URLSearchParams({ sort, includeNoMatch: showNoMatch, page });
  if (category !== '전체') params.set('category', category);
  if (verdict) params.set('verdict', verdict);

  const matches = useApi(`/api/v1/me/matches?${params}`);
  const closing = useApi('/api/v1/me/matches?closingWithinDays=7&sort=deadline&size=10');
  const suggestions = useApi('/api/v1/me/suggestions');
  const profile = useApi('/api/v1/me/profile');
  const account = useApi(isLoggedIn() ? '/api/v1/me/account' : null);
  const codes = useApi('/api/v1/codes');

  // "인천 미추홀구 · 대학 재학": 학력 코드를 /codes 의 이름으로 바꾼다
  const schoolLabel = codes.data?.schoolCd?.find((c) => c.code === profile.data?.schoolCd)?.label;
  const heroSub = [profile.data?.residenceName, schoolLabel].filter(Boolean).join(' · ');

  // 프로필이 없으면(404) 처음 온 사람이다. "나중에 입력"을 안 눌렀으면 내 정보로 보낸다.
  useEffect(() => {
    if (profile.error?.status === 404 && !localStorage.getItem('skipOnboarding')) {
      navigate('/profile', { replace: true });
    }
  }, [profile.error, navigate]);

  const banner = suggestions.data?.items?.[0];
  const counts = matches.data?.counts;

  return (
    <>
      <section className="hero">
        <p>{account.data ? `${account.data.nickname} 님 맞춤 혜택` : '내 맞춤 혜택'}</p>
        <h1>받을 수 있는 혜택 <em>{counts ? counts.match + counts.needsCheck : 0}건</em></h1>
        {heroSub && <p className="hero-sub">{heroSub}</p>}
        <Link to="/search" className="search-entry">궁금한 혜택을 물어보세요</Link>
        {banner && (
          <div className="banner">
            <span>{banner.message}</span>
            <Link to="/profile">입력하기 →</Link>
          </div>
        )}
      </section>

      <h2>이번 주 마감 {closing.data ? closing.data.totalElements : ''}</h2>
      {closing.data?.content.length === 0 && (
        <Empty title="이번 주 마감인 공고가 없어요">
          7일 안에 마감하는 공고가 생기면 여기에 모아 드려요.
        </Empty>
      )}
      <div className="scroll-row">
        {closing.data?.content.map((item) => (
          <ClosingCard key={item.policy.id} item={item} />
        ))}
      </div>

      {counts && (
        <div className="count-box card">
          <div><b className="c-match">{counts.match}</b>조건 일치</div>
          <div><b className="c-check">{counts.needsCheck}</b>확인 필요</div>
          <div><b className="c-nomatch">{counts.noMatch}</b>조건 불일치</div>
        </div>
      )}

      <div className="chips">
        {CATEGORIES.map((name) => (
          <button
            key={name}
            className={name === category ? 'chip active' : 'chip'}
            onClick={() => { setCategory(name); setPage(0); }}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="row-between">
        <h2>공고 {matches.data?.totalElements ?? 0}건</h2>
        <select aria-label="판정" value={verdict} onChange={(e) => { setVerdict(e.target.value); setPage(0); }}>
          <option value="">일치 + 확인 필요</option>
          <option value="MATCH">조건 일치</option>
          <option value="NEEDS_CHECK">확인 필요</option>
        </select>
      </div>
      <div className="chips">
        <button className={sort === 'recommended' ? 'chip active' : 'chip'} onClick={() => { setSort('recommended'); setPage(0); }}>추천순</button>
        <button className={sort === 'deadline' ? 'chip active' : 'chip'} onClick={() => { setSort('deadline'); setPage(0); }}>마감순</button>
      </div>

      {matches.loading && <Loading />}
      {matches.error && <ErrorBox error={matches.error} onRetry={matches.reload} />}
      {matches.data?.content.map((item) => (
        <PolicyCard key={item.policy.id} item={item} />
      ))}

      {matches.data?.totalPages > 1 && (
        <div className="row-two">
          <button className="btn-secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>이전</button>
          <button className="btn-secondary" disabled={page + 1 >= matches.data.totalPages} onClick={() => setPage(page + 1)}>다음</button>
        </div>
      )}

      {counts?.noMatch > 0 && !showNoMatch && !verdict && (
        <button className="btn-secondary" onClick={() => setShowNoMatch(true)}>
          조건 불일치 {counts.noMatch}건도 보기
        </button>
      )}
      <p className="notice">입력한 정보로 비교한 결과이며, 선정을 보장하지 않아요.</p>
    </>
  );
}
