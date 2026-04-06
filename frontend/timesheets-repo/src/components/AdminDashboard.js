import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faKey, faUserSlash, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

function AdminDashboard({ user, onLogout }) {
  const [activeCard, setActiveCard] = useState(null);
  const [userID, setUserID] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
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
          setUserID('');
          setNewPassword('');
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

  const cards = [
    {
      id: 'reset',
      icon: faKey,
      title: 'Reset Password',
      description: 'Reset a user\'s password by their ID',
    },
    {
      id: 'deactivate',
      icon: faUserSlash,
      title: 'Deactivate Account',
      description: 'Deactivate a user account by their ID',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#f0fafa' }}>

      {/* ── SIDEBAR ── */}
      <div
        className="d-flex flex-column p-4"
        style={{ width: '260px', backgroundColor: '#0d7a7a', minHeight: '100vh' }}
      >
        {/* Logo */}
        <div className="d-flex align-items-center gap-2 text-white mb-5">
          <div
            className="rounded-circle border border-white border-2 d-flex align-items-center justify-content-center"
            style={{ width: 46, height: 46 }}
          >
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div>
            <div className="fw-bold lh-1" style={{ fontSize: '1.3rem' }}>TimeDime</div>
            <div className="opacity-75" style={{ fontSize: '0.7rem' }}>Admin Panel</div>
          </div>
        </div>

        {/* Nav items */}
        <div className="d-flex flex-column gap-2">
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => {
                setActiveCard(activeCard === card.id ? null : card.id);
                setMessage('');
                setUserID('');
                setNewPassword('');
              }}
              className="btn text-start text-white d-flex align-items-center gap-3 px-3 py-2 rounded-3"
              style={{
                backgroundColor: activeCard === card.id ? 'rgba(255,255,255,0.2)' : 'transparent',
                border: 'none',
                fontSize: '0.95rem'
              }}
            >
              <FontAwesomeIcon icon={card.icon} style={{ width: 16 }} />
              {card.title}
            </button>
          ))}
        </div>

        {/* Logout at bottom */}
        <div className="mt-auto">
          <button
            onClick={onLogout}
            className="btn text-white d-flex align-items-center gap-3 px-3 py-2 rounded-3 w-100 text-start"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: 'none' }}
          >
            <FontAwesomeIcon icon={faRightFromBracket} />
            Logout
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-grow-1 p-5">

        {/* Header */}
        <div className="mb-5">
          <h2 style={{ color: '#0d7a7a', fontWeight: '300', fontSize: '2rem' }}>
            Admin Dashboard
          </h2>
          <p className="text-muted mb-0">Welcome back, {user.name}</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className="mb-4 px-4 py-3 rounded-3 text-white"
            style={{
              backgroundColor: messageType === 'success' ? '#00a896' : '#c0392b',
              maxWidth: '500px',
              fontSize: '0.9rem'
            }}
          >
            {messageType === 'success' ? '✅' : '⚠️'} {message}
          </div>
        )}

        {/* Cards */}
        <div className="d-flex gap-4 flex-wrap">
          {cards.map(card => (
            <div
              key={card.id}
              onClick={() => {
                setActiveCard(activeCard === card.id ? null : card.id);
                setMessage('');
                setUserID('');
                setNewPassword('');
              }}
              className="rounded-4 shadow-sm"
              style={{
                backgroundColor: 'white',
                border: activeCard === card.id ? '2px solid #00a896' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                width: activeCard === card.id ? '420px' : '220px',
                overflow: 'hidden'
              }}
            >
              {/* Card Header */}
              <div className="p-4">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                  style={{ width: 48, height: 48, backgroundColor: '#e8faf7' }}
                >
                  <FontAwesomeIcon icon={card.icon} style={{ color: '#00a896', fontSize: '1.2rem' }} />
                </div>
                <h5 style={{ color: '#0d7a7a', fontWeight: '600' }}>{card.title}</h5>
                <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>{card.description}</p>
              </div>

              {/* Expanded Form */}
              {activeCard === card.id && (
                <div className="px-4 pb-4" onClick={e => e.stopPropagation()}>
                  <hr style={{ borderColor: '#e8faf7' }} />

                  <input
                    type="text"
                    className="form-control mb-3"
                    placeholder="User ID"
                    value={userID}
                    onChange={e => setUserID(e.target.value)}
                    style={{ borderColor: '#b2e8e0' }}
                  />

                  {card.id === 'reset' && (
                    <input
                      type="password"
                      className="form-control mb-3"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={{ borderColor: '#b2e8e0' }}
                    />
                  )}

                  <button
                    className="btn w-100 text-white fw-semibold"
                    style={{ backgroundColor: '#00a896' }}
                    onClick={card.id === 'reset' ? handleReset : handleDeactivate}
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