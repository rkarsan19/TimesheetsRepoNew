import React, { useState } from 'react';

function AdminResetPassword() {
  const [userID, setUserID] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = () => {
    fetch(`http://localhost:8000/api/users/${userID}/reset-password/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword })
    })
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => setMessage("Error resetting password"))
  }

  return (
    <div>
      <h2>Reset User Password</h2>
      <input
        type="text"
        placeholder="User ID"
        value={userID}
        onChange={e => setUserID(e.target.value)}
      />
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
      />
      <button onClick={handleReset}>Reset Password</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default AdminResetPassword;