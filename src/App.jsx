import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import PolicyDetailPage from './pages/PolicyDetailPage';
import ProfilePage from './pages/ProfilePage';
import PrepPage from './pages/PrepPage';
import SearchPage from './pages/SearchPage';
import NotificationsPage from './pages/NotificationsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import KakaoCallbackPage from './pages/KakaoCallbackPage';
import CustomPolicyPage from './pages/CustomPolicyPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import Placeholder from './pages/Placeholder';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 아래 탭이 보이는 화면 */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/policies/:id" element={<PolicyDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/prep" element={<PrepPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/notifications/settings" element={<NotificationSettingsPage />} />
          <Route path="/custom-policies/new" element={<CustomPolicyPage />} />
        </Route>
        {/* 아래 탭이 없는 화면 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/password/forgot" element={<ForgotPasswordPage />} />
        <Route path="/auth/kakao/callback" element={<KakaoCallbackPage />} />
        <Route path="*" element={<Placeholder title="페이지를 찾을 수 없어요" />} />
      </Routes>
    </BrowserRouter>
  );
}
