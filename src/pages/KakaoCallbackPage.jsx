import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api, saveLogin } from '../api/client';

const REDIRECT_URI = `${window.location.origin}/auth/kakao/callback`;

// 로그인 버튼에서 부른다: state를 만들어 저장하고 카카오로 보낸다.
export function startKakaoLogin() {
  const state = crypto.randomUUID();
  sessionStorage.setItem('kakaoState', state);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: import.meta.env.VITE_KAKAO_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state,
  });
  window.location.assign(`https://kauth.kakao.com/oauth/authorize?${params}`);
}

export default function KakaoCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [message, setMessage] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    // 개발 모드에서는 useEffect가 두 번 돈다. 카카오 코드는 한 번만 쓸 수 있어서 막아 둔다.
    if (started.current) return;
    started.current = true;

    const saved = sessionStorage.getItem('kakaoState');
    sessionStorage.removeItem('kakaoState');
    if (!params.get('code') || params.get('state') !== saved) {
      setMessage('로그인 요청이 올바르지 않아요. 다시 시도해 주세요.');
      return;
    }

    api('/api/v1/auth/kakao', {
      method: 'POST',
      body: { code: params.get('code'), redirectUri: REDIRECT_URI },
    })
      .then((tokens) => {
        saveLogin(tokens);
        navigate('/', { replace: true });
      })
      .catch((error) => setMessage(error.message));
  }, [params, navigate]);

  return (
    <div className="state-box">
      <p>{message ?? '카카오 로그인 중이에요…'}</p>
      {message && <Link className="link" to="/login">로그인으로 돌아가기</Link>}
    </div>
  );
}
