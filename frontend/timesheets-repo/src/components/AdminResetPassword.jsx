import React, { useState } from 'react';

// AdminResetPassword: allows an admin to reset any user's password by their ID
function AdminResetPassword() {
  const [userID, setUserID] = useState(''); // ID of the user whose password will be reset
  const [newPassword, setNewPassword] = useState(''); // The new password to set for the user
  const [message, setMessage] = useState(''); // Message to display success or error feedback

  // Handles the password reset action when the button is clicked
  const handleReset = () => {
    fetch(`http://localhost:8000/api/users/${userID}/reset-password/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword })
    })
      .then(res => res.json())
      .then(data => setMessage(data.message)) // Display success message from the server response
      .catch(err => setMessage("Error resetting password")) // Display error message if the request fails
  }

  return (
    <div>
      <h2>Reset User Password</h2>
      {/* Input for the user ID */}
      <input
        type="text"
        placeholder="User ID"
        value={userID}
        onChange={e => setUserID(e.target.value)}
      />
      {/* Input for the new password */}
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
      />
      {/* Reset Password button */}
      <button onClick={handleReset}>Reset Password</button>
      {/* Message display area */}
      {message && <p>{message}</p>}
    </div>
  );
}

export default AdminResetPassword;