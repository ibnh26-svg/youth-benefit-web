import { Link, NavLink, Outlet } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { HomeIcon, SearchIcon, PrepIcon, BellIcon, UserIcon, Logo } from './Icons';

const TABS = [
  { to: '/', label: '맞춤 홈', end: true, Icon: HomeIcon },
  { to: '/search', label: '검색', Icon: SearchIcon },
  { to: '/prep', label: '준비함', Icon: PrepIcon },
  { to: '/notifications', label: '알림', Icon: BellIcon },
  { to: '/profile', label: '내 정보', Icon: UserIcon },
];

export default function Layout() {
  const { data } = useApi('/api/v1/me/notifications?size=1');
  const unread = data?.unreadCount ?? 0;

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="brand"><Logo />청년혜택 길잡이</Link>
        <Link to="/profile" className="header-user" aria-label="내 정보"><UserIcon size={20} /></Link>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <nav className="tab-bar">
        {TABS.map(({ to, label, end, Icon }) => (
          <NavLink key={to} to={to} end={end}>
            <span className="tab-icon">
              <Icon />
              {to === '/notifications' && unread > 0 && <span className="dot">{unread > 99 ? '99+' : unread}</span>}
            </span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
