import { NavLink, Outlet } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

const TABS = [
  { to: '/', label: '맞춤 홈', end: true },
  { to: '/search', label: '검색' },
  { to: '/prep', label: '준비함' },
  { to: '/notifications', label: '알림' },
  { to: '/profile', label: '내 정보' },
];

export default function Layout() {
  const { data } = useApi('/api/v1/me/notifications?size=1');
  const unread = data?.unreadCount ?? 0;

  return (
    <div className="app">
      <header className="app-header">청년혜택 길잡이</header>
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="tab-bar">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end}>
            {tab.label}
            {tab.to === '/notifications' && unread > 0 && (
              <span className="dot">{unread}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
