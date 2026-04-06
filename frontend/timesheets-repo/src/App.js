import './App.css';
import { useState } from 'react';
import Login from './components/Login';
import CalculatePay from "./components/CalculatePay";
import TimesheetList from "./components/ViewTimesheetList";
import AdminDashboard from './components/AdminDashboard';
import Timesheet from "./components/Timesheet";
import ConsultantDashboard from "./components/ConsultantDashboard";

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  //return <ConsultantDashboard consultantId={1} />;
  //view consultant dashboard

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  //If user not logged in, show login page
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // return <TimesheetList consultantId={1}/>
  // To view my pages uncomment the previous line and comment all other lines in the function. Aqib
  //If logged in as ADMIN, show admin dashboard
  if (user.role === 'ADMIN') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  //If logged in as FINANCE, show finance dashboard
  if (user.role === 'FINANCE') {
    return <CalculatePay onBack={handleLogout} />;
  }

  //If logged in as CONSULTANT, show timesheet list
  if (user.role === 'CONSULTANT') {
    return <TimesheetList consultantId={user.id} onLogout={handleLogout} />;
  }

  
 

}

export default App;
