// 디자인에 쓰인 아이콘을 비슷하게 그린 작은 SVG 모음. 설치할 패키지가 없어도 된다.
// 원본 아이콘 파일을 받으면 이 파일만 바꾸면 된다.
function Svg({ children, size = 22, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p) => <Svg {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></Svg>;
export const SearchIcon = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>;
export const PrepIcon = (p) => <Svg {...p}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="m9 13 2 2 4-4" /></Svg>;
export const BellIcon = (p) => <Svg {...p}><path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z" /><path d="M10 20a2 2 0 0 0 4 0" /></Svg>;
export const UserIcon = (p) => <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>;
export const EyeIcon = (p) => <Svg {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Svg>;
export const EyeOffIcon = (p) => <Svg {...p}><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></Svg>;
export const CloseIcon = (p) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const HelpIcon = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.5v.7" /><path d="M12 17h.01" /></Svg>;
export const ClockIcon = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>;
export const StarIcon = (p) => <Svg {...p}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z" /></Svg>;
export const BuildingIcon = (p) => <Svg {...p}><path d="M4 21h16" /><path d="M6 21V10l6-5 6 5v11" /><path d="M10 21v-5h4v5" /></Svg>;
export const ChevronIcon = (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const SlidersIcon = (p) => <Svg {...p}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></Svg>;
export const ImageIcon = (p) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m21 16-5-5-8 8" /></Svg>;
export const MailIcon = (p) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>;
export const InfoIcon = (p) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Svg>;
export const ChatIcon = (p) => <Svg {...p} fill="currentColor" stroke="none"><path d="M12 4C7 4 3 7.1 3 11c0 2.4 1.6 4.6 4 5.9L6 21l4.3-2.7c.6.1 1.1.1 1.7.1 5 0 9-3.1 9-7s-4-7.4-9-7.4z" /></Svg>;
export const CheckIcon = (p) => <Svg {...p}><path d="m5 12 4.5 4.5L19 7" /></Svg>;
export const LockIcon = (p) => <Svg {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>;

// 머리글 왼쪽의 체크 로고
export function Logo() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <Svg size={16} strokeWidth="3"><path d="m5 12 4.5 4.5L19 7" /></Svg>
    </span>
  );
}

// 맞춤 홈 오른쪽 위 그림: 서류 한 장 + 동전. 원본 그림 파일을 받으면 그걸로 바꾸면 된다.
export function BenefitIllustration() {
  return (
    <svg className="hero-illust" width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <circle cx="18" cy="74" r="3" fill="#8dbdf7" />
      <path d="M84 14v12M78 20h12" stroke="#8dbdf7" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="22" y="10" width="44" height="58" rx="8" fill="#1f5fd9" stroke="#eaf2ff" strokeWidth="3" />
      <path d="M32 26h24M32 35h24M32 44h14" stroke="#eaf2ff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="64" cy="66" r="15" fill="#ffd34d" stroke="#f0b400" strokeWidth="3" />
      <path d="M57 60l3.5 12 3.5-9 3.5 9L71 60M56 65.5h16" stroke="#9a6b00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
