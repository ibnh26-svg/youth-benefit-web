import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

// 화면이 열릴 때 GET 하나를 부르고 { data, loading, error, reload } 를 돌려준다.
// path 가 null 이면 아무것도 부르지 않는다 (로그인했을 때만 부르는 API 등).
export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: Boolean(path), error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path) return undefined;
    let cancelled = false; // 화면을 떠난 뒤 도착한 응답은 버린다
    api(path)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, loading: false, error });
      });
    return () => {
      cancelled = true;
    };
  }, [path, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
