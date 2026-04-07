import './App.css';
import { useState } from 'react';
import Login from './components/Login';
import CalculatePay from "./components/CalculatePay";
import AdminDashboard from './components/AdminDashboard';
import TimesheetList from "./components/ViewTimesheetList";
import ReviewTimesheets from './components/reviewTimesheets';

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

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

  if (user.role === 'ADMIN') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  if (user.role === 'FINANCE') {
    return <CalculatePay onBack={handleLogout} />;
  }

  if (user.role === 'CONSULTANT') {
    return <TimesheetList consultantId={user.consultantId} onLogout={handleLogout} />;
  }

  if (user.role === 'LINE_MANAGER') {
    return (
      <ReviewTimesheets
        lineManagerId={user.lineManagerId}
        user={user}
        onLogout={handleLogout}
      />
    );
  }
}

export default App;
