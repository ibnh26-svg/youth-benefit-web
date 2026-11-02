// 모든 화면에 필요한 세 가지 상태: 불러오는 중, 오류, 비어 있음
export function Loading() {
  return <p className="state-box">불러오는 중이에요…</p>;
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="state-box">
      <p>{error.message}</p>
      {onRetry && <button className="btn-secondary" onClick={onRetry}>다시 시도</button>}
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="state-box">
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}
