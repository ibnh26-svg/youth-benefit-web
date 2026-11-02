import { useEffect, useState } from 'react';

// 남은 초를 1초마다 줄인다. restart(600) 처럼 다시 시작할 수 있다.
export function useCountdown(initialSeconds) {
  const [left, setLeft] = useState(initialSeconds);

  useEffect(() => {
    if (left <= 0) return undefined;
    const timer = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  const text = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
  return { left, text, restart: setLeft };
}
