import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import logo from "../assets/logo.svg"
import { 
  faKey, 
  faUserSlash, 
  faPercentage, 
  faCalendarCheck, 
  faClock, 
  faRightFromBracket,
  faUserPlus,
  faBars,
  faTimes
} from '@fortawesome/free-solid-svg-icons';

function AdminDashboard({ user, onProfileClick }) {
  const [activeCard, setActiveCard] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [userID, setUserID] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Admin features states
  const [inputValue, setInputValue] = useState(''); 
  const [period, setPeriod] = useState(''); 
  
  // Create User states
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('consultant');

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleCreateUser = () => {
    if (!newUserName || !newUserEmail || !newPassword) {
      showMessage('Please fill in name, email, and password', 'error');
      return;
    }
    fetch(`http://localhost:8000/api/users/create-user/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: newUserName,
        email: newUserEmail,
        password: newPassword,
        role: newUserRole })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) showMessage(data.error, 'error');
        else {
          showMessage('User created successfully!', 'success');
          setNewUserName(''); setNewUserEmail(''); setNewPassword('');
        }
      })
      .catch(() => showMessage('Could not connect to server', 'error'));
  };

  const handleReset = () => {
    if (!userID || !newPassword) {
      showMessage('Please fill in all fields', 'error');
      return;
    }
    fetch(`http://localhost:8000/api/users/${userID}/reset-password/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) showMessage(data.error, 'error');
        else {
          showMessage('Password reset successfully!', 'success');
          setUserID(''); setNewPassword('');
        }
      })
      .catch(() => showMessage('Could not connect to server', 'error'));
  };

  const handleDeactivate = () => {
    if (!userID) {
      showMessage('Please enter a User ID', 'error');
      return;
    }
    fetch(`http://localhost:8000/api/users/${userID}/deactivate/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) showMessage(data.error, 'error');
        else {
          showMessage('User deactivated successfully!', 'success');
          setUserID('');
        }
      })
      .catch(() => showMessage('Could not connect to server', 'error'));
  };

  const userName = user?.name || "Admin";
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase();

  const cards = [
    { id: 'create', icon: faUserPlus, title: 'Create User', description: 'Add a new employee to the system' },
    { id: 'reset', icon: faKey, title: 'Reset Password', description: 'Reset a user\'s password by their ID' },
    { id: 'deactivate', icon: faUserSlash, title: 'Deactivate Account', description: 'Deactivate a user account by their ID' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#f0fafa', position: 'relative' }}>

      {/* Mobile Hamburger Button — only shown when sidebar is CLOSED */}
      {isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 1050,
            background: '#0d7a7a',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1.2rem'
          }}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
      )}

      {/* Sidebar Overlay — clicking outside closes sidebar */}
      {sidebarOpen && isMobile && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1040
          }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <div className="d-flex flex-column p-4" style={{ 
        width: '260px', 
        backgroundColor: '#0d7a7a', 
        minHeight: '100vh',
        position: isMobile ? 'fixed' : 'relative',
        left: isMobile ? (sidebarOpen ? 0 : '-260px') : 0,
        top: 0,
        zIndex: 1045,
        transition: 'left 0.3s ease',
        boxShadow: isMobile && sidebarOpen ? '2px 0 8px rgba(0,0,0,0.2)' : 'none'
      }}>
        {/* Close button inside sidebar — top right corner */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'absolute',
              top: '14px',
              right: '14px',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '0.95rem',
              zIndex: 1046
            }}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}

        {/* Logo / Brand */}
        <div className="d-flex align-items-center gap-2 text-white mb-5" style={{ marginTop: isMobile ? '8px' : 0 }}>
          <div>
            <img src={logo} style={{width: 46, height: 46}}/>
          </div>
          <div>
            <div className="fw-bold lh-1" style={{ fontSize: '1.3rem' }}>TimeDime</div>
            <div className="opacity-75" style={{ fontSize: '0.7rem' }}>Admin Panel</div>
          </div>
        </div>

        {/* Nav Buttons */}
        <div className="d-flex flex-column gap-2">
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => {
                setActiveCard(activeCard === card.id ? null : card.id);
                setMessage(''); setUserID(''); setNewPassword(''); setInputValue(''); setPeriod('');
                if (isMobile) setSidebarOpen(false);
              }}
              className="btn text-start text-white d-flex align-items-center gap-3 px-3 py-2 rounded-3"
              style={{
                backgroundColor: activeCard === card.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: 'none',
                fontSize: '1rem'
              }}
            >
              <FontAwesomeIcon icon={card.icon} style={{ width: 16 }} />
              {card.title}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-grow-1" style={{ padding: isMobile ? '70px 1.5rem 2rem' : '2rem 3rem' }}>

        {/* Top-right user profile */}
        <div className="position-absolute d-flex align-items-center gap-2" style={{ top: isMobile ? '16px' : '20px', right: isMobile ? '1.5rem' : '30px', zIndex: 100 }}>
          <span style={{ color: '#0d7a7a', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>{user.name}</span>
          <div
            onClick={onProfileClick}
            style={{
              width: isMobile ? '36px' : '42px',
              height: isMobile ? '36px' : '42px',
              borderRadius: '50%',
              backgroundColor: 'rgba(49, 163, 142, 0.51)',
              border: '2px solid rgba(78, 203, 194, 0.6)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: isMobile ? '0.85rem' : '1rem',
              cursor: 'pointer'
            }}
          >
            {initials}
          </div>
        </div>

        {/* Page heading */}
        <div className="mb-5" style={{ marginTop: isMobile ? '2rem' : 0 }}>
          <h2 style={{ color: '#0d7a7a', fontWeight: '300', fontSize: isMobile ? '1.5rem' : '2rem' }}>Admin Dashboard</h2>
          <p className="text-muted mb-0" style={{ fontSize: isMobile ? '0.9rem' : undefined }}>Welcome back, {user.name}</p>
        </div>

        {message && (
          <div className="mb-4 px-4 py-3 rounded-3 text-white" style={{ backgroundColor: messageType === 'success' ? '#00a896' : '#c0392b', maxWidth: '500px', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
            {messageType === 'success' ? '✅' : '⚠️'} {message}
          </div>
        )}

        {/* Cards */}
        <div className="d-flex gap-4 flex-wrap" style={{ justifyContent: isMobile ? 'center' : 'flex-start' }}>
          {cards.map(card => (
            <div
              key={card.id}
              onClick={() => setActiveCard(activeCard === card.id ? null : card.id)}
              className="rounded-4 shadow-sm"
              style={{ 
                backgroundColor: 'white', 
                border: activeCard === card.id ? '2px solid #00a896' : '2px solid transparent', 
                cursor: 'pointer',
                transition: 'all 0.3s ease', 
                width: isMobile ? 'calc(100% - 1.5rem)' : activeCard === card.id ? '500px' : '280px', 
                overflow: 'hidden' 
              }}
            >
              <div className="p-4">
                <div className="rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: 48, height: 48, backgroundColor: '#e8faf7' }}>
                  <FontAwesomeIcon icon={card.icon} style={{ color: '#00a896', fontSize: '1.2rem' }} />
                </div>
                <h5 style={{ color: '#0d7a7a', fontWeight: '600' }}>{card.title}</h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{card.description}</p>
              </div>

              {activeCard === card.id && (
                <div className="px-4 pb-4" onClick={e => e.stopPropagation()}>
                  <hr style={{ borderColor: '#e8faf7' }} />
                  
                  {card.id === 'create' && (
                    <>
                      <input type="text" className="form-control mb-3" placeholder="Full Name" value={newUserName} onChange={e => setNewUserName(e.target.value)} style={{ borderColor: '#b2e8e0' }} />
                      <input type="email" className="form-control mb-3" placeholder="Email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} style={{ borderColor: '#b2e8e0' }} />
                      <input type="password" className="form-control mb-3" placeholder="Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ borderColor: '#b2e8e0' }} />
                      <select className="form-select mb-3" value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={{ borderColor: '#b2e8e0' }}>
                        <option value="consultant">Consultant</option>
                        <option value="finance_team">Finance Team Member</option>
                        <option value="line_manager">Line Manager</option>
                      </select>
                    </>
                  )}

                  {(card.id === 'reset' || card.id === 'deactivate') && (
                    <input type="text" className="form-control mb-3" placeholder="User ID" value={userID} onChange={e => setUserID(e.target.value)} style={{ borderColor: '#b2e8e0' }} />
                  )}
                  {card.id === 'reset' && (
                    <input type="password" className="form-control mb-3" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ borderColor: '#b2e8e0' }} />
                  )}

                  <button 
                    className="btn w-100 text-white fw-semibold" 
                    style={{ backgroundColor: '#00a896' }}
                    onClick={() => {
                      if (card.id === 'create') handleCreateUser();
                      else if (card.id === 'reset') handleReset();
                      else if (card.id === 'deactivate') handleDeactivate();
                    }}
                  >
                    {card.title}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;