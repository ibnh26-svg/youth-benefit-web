import { Link } from 'react-router-dom';

const VERDICT_CLASS = {
  MATCH: 'badge-match',
  NEEDS_CHECK: 'badge-check',
  NO_MATCH: 'badge-nomatch',
};

export function VerdictBadge({ verdict, label }) {
  return <span className={`badge ${VERDICT_CLASS[verdict]}`}>{label}</span>;
}

// "D-22 · 11.14" / "오늘 마감" / "상시 모집"
export function deadlineText(dDay, endDate) {
  if (dDay === null || dDay === undefined) return '상시 모집';
  const date = endDate ? endDate.slice(5).replace('-', '.') : '';
  return dDay === 0 ? `오늘 마감 · ${date}` : `D-${dDay} · ${date}`;
}

const SOURCE_TEXT = {
  ONTONG: '출처: 정부 · 온통청년',
  SCHOOL: '학교 장학',
  USER: '직접 등록',
};

// item = /me/matches 또는 /search 의 content 한 칸
export default function PolicyCard({ item }) {
  const { policy, verdict, verdictLabel, summary, dDay } = item;
  return (
    <article className="card">
      <div className="row-between">
        <VerdictBadge verdict={verdict} label={verdictLabel} />
        <span className="deadline">{deadlineText(dDay, policy.applyEndDate)}</span>
      </div>
      <h3>{policy.title}</h3>
      <p className="amount">{policy.support?.label ?? policy.support?.summary}</p>
      <p className="muted">{policy.organization} · {summary}</p>
      <div className="row-between">
        <span className="chip-small">{SOURCE_TEXT[policy.source]}</span>
        <Link to={`/policies/${policy.id}`} className="link">자세히 보기 →</Link>
      </div>
    </article>
  );
}
