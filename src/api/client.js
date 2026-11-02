// 서버와 이야기하는 코드는 전부 이 파일을 거친다.
const BASE_URL = import.meta.env.VITE_API_URL;

// ── 1. 내가 누구인지 ─────────────────────────────
function getAnonymousId() {
  let id = localStorage.getItem('anonymousId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('anonymousId', id);
  }
  return id;
}

export function isLoggedIn() {
  return Boolean(localStorage.getItem('accessToken'));
}

export function saveLogin(tokens) {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
}

// 로그아웃: 토큰을 지우고 익명 UUID도 지워서 다음 요청 때 새로 만든다.
export function clearLogin() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('anonymousId');
}

// ── 2. 오류 모양 통일 ────────────────────────────
export class ApiError extends Error {
  constructor(status, body) {
    super(body?.message || '요청을 처리하지 못했어요.');
    this.status = status;
    this.code = body?.code; // 예: ACCOUNT_LOCKED
    this.errors = body?.errors; // 예: { jobCd: '알 수 없는 코드' }
    this.details = body?.details; // 예: { retryAfterSeconds: 872 }
  }
}

async function readBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// ── 3. 토큰 갱신: 동시에 여러 요청이 와도 딱 한 번만 ──
let refreshing = null;

function refreshTokens() {
  if (!refreshing) {
    refreshing = fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') }),
    })
      .then(async (response) => {
        const body = await readBody(response);
        if (!response.ok) throw new ApiError(response.status, body);
        saveLogin(body);
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

// ── 4. 모든 화면이 쓰는 함수 ─────────────────────
export async function api(path, { method = 'GET', body } = {}, isRetry = false) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = localStorage.getItem('accessToken');
  if (token) headers.Authorization = `Bearer ${token}`;
  else headers['X-Anonymous-Id'] = getAnonymousId();

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await readBody(response);
  if (response.ok) return data;

  const error = new ApiError(response.status, data);

  if (response.status === 401 && token && !isRetry) {
    if (error.code === 'TOKEN_EXPIRED') {
      try {
        await refreshTokens();
      } catch {
        clearLogin();
        window.location.assign('/login');
        throw error;
      }
      return api(path, { method, body }, true);
    }
    if (error.code === 'TOKEN_INVALID') {
      clearLogin();
      window.location.assign('/login');
    }
  }
  throw error;
}
