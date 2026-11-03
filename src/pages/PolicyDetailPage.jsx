import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useApi } from '../hooks/useApi';
import { Loading, ErrorBox } from '../components/StateBox';
import { VerdictBadge } from '../components/PolicyCard';

const TRUTH_TEXT = { TRUE: '맞음', FALSE: '안 맞음', UNKNOWN: '확인 필요' };

export default function PolicyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const policy = useApi(`/api/v1/policies/${id}`);
  const judged = useApi(`/api/v1/policies/${id}/eligibility`);
  const [saveError, setSaveError] = useState(null);

  async function addToPrep(status) {
    try {
      // status 없이 보내면 "관심", PREPARING 이면 "준비 중"으로 담긴다
      await api('/api/v1/me/applications', {
        method: 'POST',
        body: status ? { policyId: Number(id), status } : { policyId: Number(id) },
      });
      navigate('/prep');
    } catch (error) {
      setSaveError(error);
    }
  }

  if (policy.loading || judged.loading) return <Loading />;
  if (policy.error) return <ErrorBox error={policy.error} onRetry={policy.reload} />;
  if (judged.error) return <ErrorBox error={judged.error} onRetry={judged.reload} />;

  const p = policy.data;
  const j = judged.data;

  return (
    <>
      <button className="link" onClick={() => navigate(-1)}>← 공고 상세</button>

      <section className="card">
        <p className="muted">{p.organization} · {p.categories.join(', ')}</p>
        <h1>{p.title}</h1>
        <p className="amount">{p.support?.label ?? p.support?.summary}</p>
        <VerdictBadge verdict={j.verdict} label={j.verdictLabel} />
      </section>

      <section className="card">
        <h2>내 조건과 비교</h2>
        {j.conditions.map((c) => (
          <div key={c.label} className="condition">
            <div className="row-between">
              <strong>{c.label}</strong>
              <span className={`truth truth-${c.truth}`}>{TRUTH_TEXT[c.truth]}</span>
            </div>
            <p className="muted">공고 · {c.requirement}</p>
            <p className="muted">내 정보 · {c.myValue ?? '비어 있음 (모름)'}</p>
          </div>
        ))}
      </section>

      {j.missingFields.length > 0 && (
        <section className="card card-blue">
          <h2>정보 {j.missingFields.length}개가 비어서 판정할 수 없어요</h2>
          <p>{j.explanation}</p>
          <Link className="btn-white" to="/profile">내 정보 입력하기</Link>
        </section>
      )}

      <section className="card">
        <h2>제출 서류</h2>
        {p.documents.length === 0 ? (
          <p className="muted">공고에 서류 안내가 없어요. 원문에서 확인해 주세요.</p>
        ) : (
          <ul>
            {p.documents.map((d) => (
              <li key={d.name}>{d.name}{d.optional && ' (선택)'}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="row-two">
        {p.sourceUrl && <a className="btn-secondary" href={p.sourceUrl} target="_blank" rel="noreferrer">원문 보기 ↗</a>}
        {p.applyUrl && <a className="btn-secondary" href={p.applyUrl} target="_blank" rel="noreferrer">신청하러 가기 ↗</a>}
      </div>

      {saveError && <ErrorBox error={saveError} />}
      <button className="btn-secondary" onClick={() => addToPrep()}>☆ 관심 담기</button>
      <button className="btn-primary" onClick={() => addToPrep('PREPARING')}>신청 준비 시작</button>
      <p className="notice">조건 일치는 선정 확정이 아니에요. 최종 심사는 운영 기관이 해요.</p>
    </>
  );
}
