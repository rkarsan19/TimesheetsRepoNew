import React, { useState } from 'react';

function AdminDeactivateUser() {
  const [userID, setUserID] = useState('');
  const [message, setMessage] = useState('');

  const handleDeactivate = () => {
    fetch(`http://localhost:8000/api/users/${userID}/deactivate/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => setMessage("Error deactivating user"))
  }

  return (
    <div>
      <h2>Deactivate User Account</h2>
      <input
        type="text"
        placeholder="User ID"
        value={userID}
        onChange={e => setUserID(e.target.value)}
      />
      <button onClick={handleDeactivate}>Deactivate Account</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default AdminDeactivateUser;