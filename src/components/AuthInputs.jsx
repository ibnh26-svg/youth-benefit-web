import { useRef, useState } from 'react';
import { EyeIcon, EyeOffIcon, CheckIcon } from './Icons';

// 눈 아이콘으로 비밀번호를 보였다 숨겼다 하는 입력칸
export function PasswordInput({ label, ...props }) {
  const [shown, setShown] = useState(false);
  return (
    <label>{label}
      <span className="password-wrap">
        <input type={shown ? 'text' : 'password'} {...props} />
        <button
          type="button"
          className="icon-btn eye"
          aria-label={shown ? '비밀번호 숨기기' : '비밀번호 보기'}
          onClick={() => setShown(!shown)}
        >
          {shown ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
        </button>
      </span>
    </label>
  );
}

// 인증 코드 여섯 칸. 숫자를 넣으면 다음 칸으로, 지우면 이전 칸으로 간다. 붙여넣기도 된다.
export function CodeInput({ value, onChange }) {
  const boxes = useRef([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  function setAt(index, digit) {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join('').slice(0, 6));
  }

  function handleChange(index, raw) {
    const only = raw.replace(/\D/g, '');
    if (only.length > 1) {
      // 여러 글자 붙여넣기
      onChange((digits.slice(0, index).join('') + only).slice(0, 6));
      boxes.current[Math.min(index + only.length, 5)]?.focus();
      return;
    }
    setAt(index, only);
    if (only && index < 5) boxes.current[index + 1]?.focus();
  }

  function handleKeyDown(index, event) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      setAt(index - 1, '');
      boxes.current[index - 1]?.focus();
    }
  }

  return (
    <div className="code-boxes">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { boxes.current[i] = el; }}
          aria-label={`인증 코드 ${i + 1}번째 자리`}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          className={d ? 'filled' : ''}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
        />
      ))}
    </div>
  );
}

// 개발용: 임시 서버는 메일 대신 응답에 devCode를 준다. 개발 모드(npm run dev)에서만 보인다.
export function DevCodeBox({ code, onUse }) {
  if (!code || !import.meta.env.DEV) return null;
  return (
    <div className="dev-code">
      <span>개발용 인증 코드 <b>{code}</b></span>
      <button type="button" onClick={() => onUse(String(code))}>채우기</button>
    </div>
  );
}

// 비밀번호 규칙 한 줄: 맞으면 초록 ✓, 아니면 회색 ○
export function Rule({ ok, children }) {
  return (
    <p className={ok ? 'rule ok' : 'rule'}>
      {ok ? <CheckIcon size={14} strokeWidth="3" /> : <span className="rule-dot" />}
      {children}
    </p>
  );
}
