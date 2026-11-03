import { Link } from 'react-router-dom';

const VERDICT_CLASS = {
  MATCH: 'badge-match',
  NEEDS_CHECK: 'badge-check',
  NO_MATCH: 'badge-nomatch',
};

export function VerdictBadge({ verdict, label }) {
  return <span className={`badge ${VERDICT_CLASS[verdict]}`}>{label}</span>;
}

// 짧은 표시: "D-22" / "오늘 마감" / "상시"
export function dDayLabel(dDay) {
  if (dDay === null || dDay === undefined) return '상시';
  return dDay === 0 ? '오늘 마감' : `D-${dDay}`;
}

// "11.14" 처럼 월.일만
export function shortDate(date) {
  return date ? date.slice(5, 10).replace('-', '.') : '';
}

// "D-22 · 11.14" / "오늘 마감 · 11.02" / "상시 모집"
export function deadlineText(dDay, endDate) {
  if (dDay === null || dDay === undefined) return '상시 모집';
  return `${dDayLabel(dDay)} · ${shortDate(endDate)}`;
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
        <span className={dDay !== null && dDay <= 3 ? 'deadline urgent' : 'deadline'}>{deadlineText(dDay, policy.applyEndDate)}</span>
      </div>
      <h3 className="title-clamp">{policy.title}</h3>
      <p className="amount">{policy.support?.label ?? policy.support?.summary}</p>
      <p className="muted">{policy.organization} · {summary}</p>
      <div className="row-between">
        <span className="chip-small">{SOURCE_TEXT[policy.source]}</span>
        <Link to={`/policies/${policy.id}`} className="link">자세히 보기 →</Link>
      </div>
    </article>
  );
}

// 「이번 주 마감」 줄에 쓰는 작은 카드: D-day, 판정, 제목, 마감일만
export function ClosingCard({ item }) {
  const { policy, verdict, verdictLabel, dDay } = item;
  return (
    <Link to={`/policies/${policy.id}`} className="card closing-card">
      <span className={dDay !== null && dDay <= 3 ? 'dday urgent' : 'dday'}>{dDayLabel(dDay)}</span>
      <VerdictBadge verdict={verdict} label={verdictLabel} />
      <strong className="title-clamp">{policy.title}</strong>
      <span className="muted">{shortDate(policy.applyEndDate)} 마감</span>
    </Link>
  );
}
