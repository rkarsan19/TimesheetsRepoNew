import './App.css';
import { useState } from 'react';
import Login from './components/Login';
import CalculatePay from "./components/CalculatePay";
import AdminDashboard from './components/AdminDashboard';
import TimesheetList from "./components/ViewTimesheetList";
import ReviewTimesheets from './components/reviewTimesheets';
import UserProfile from './components/UserProfile';

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [currentPage, setPage] = useState('dashboard');

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentPage === 'profile') {
    return <UserProfile user={user} setuser= {setUser} onBack={() => setPage('dashboard')} />;
  }

  if (user.role === 'ADMIN') {
    return <AdminDashboard user={user} onLogout={handleLogout} onProfileClick={() => setPage('profile')} />;
  }

  if (user.role === 'FINANCE') {
    return <CalculatePay user={user} onBack={handleLogout} onProfileClick={() => setPage('profile')} />;
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
