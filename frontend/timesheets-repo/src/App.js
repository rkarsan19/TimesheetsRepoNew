import './App.css';
import { useState } from 'react';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import CalculatePay from "./components/CalculatePay";
import AdminDashboard from './components/AdminDashboard';
import TimesheetList from "./components/ViewTimesheetList";
import ReviewTimesheets from './components/reviewTimesheets';
import UserProfile from './components/UserProfile';

// Supabase redirects after a password reset with the access token in the URL hash:
// e.g. http://localhost:3000#access_token=XXX&type=recovery
const getSupabaseRecoveryToken = () => {
  const hash = window.location.hash;
  if (!hash) return null;
  const params = new URLSearchParams(hash.substring(1)); // strip leading '#'
  if (params.get('type') === 'recovery') {
    return params.get('access_token') || null;
  }
  return null;
};

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [currentPage, setPage] = useState('dashboard');

  // If the URL hash contains a Supabase recovery token show the reset form immediately
  const [resetToken] = useState(getSupabaseRecoveryToken);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setPage('dashboard');
  };

  // Password reset link opened in browser
  if (resetToken) {
    return (
      <ResetPassword
        token={resetToken}
        onSuccess={() => {
          // Remove the token from the URL then show login
          window.history.replaceState({}, document.title, '/');
          window.location.reload();
        }}
      />
    );
  }

  if (!user) {
    if (currentPage === 'forgotPassword') {
      return <ForgotPassword onBack={() => setPage('dashboard')} />;
    }
    return <Login onLogin={handleLogin} onForgotPassword={() => setPage('forgotPassword')} />;
  }

  if (currentPage === 'profile') {
    return <UserProfile user={user} setuser={setUser} onBack={() => setPage('dashboard')} onLogout={handleLogout} />;
  }

  if (user.role === 'ADMIN') {
    return <AdminDashboard user={user} onLogout={handleLogout} onProfileClick={() => setPage('profile')} />;
  }

  if (user.role === 'FINANCE') {
    return <CalculatePay user={user} onLogout={handleLogout} onProfileClick={() => setPage('profile')} />;
  }

 

  if (user.role === 'CONSULTANT') {
    const storedUser = JSON.parse(localStorage.getItem('user')); //had to add this as there were issues with timesheet data not loading when pressing back button
    return <TimesheetList consultantId={user.consultantId || storedUser?.consultantId} onLogout={handleLogout} onProfileClick={() => setPage('profile')} />;
  }

  if (user.role === 'LINE_MANAGER') {
    return (
      <ReviewTimesheets
        lineManagerId={user.lineManagerId}
        user={user}
        onLogout={handleLogout}
        onProfileClick={() => setPage('profile')}
      />
    );
  }
}

export default App;
