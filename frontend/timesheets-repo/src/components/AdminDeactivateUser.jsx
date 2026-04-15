import React, { useState } from 'react';

// AdminDeactivateUser: allows an admin to deactivate any user's account by their ID
function AdminDeactivateUser() {
  const [userID, setUserID] = useState(''); // ID of the user whose account will be deactivated
  const [message, setMessage] = useState(''); // Message to display success or error feedback

  // Handles the account deactivation action when the button is clicked
  const handleDeactivate = () => {
    fetch(`http://localhost:8000/api/users/${userID}/deactivate/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => setMessage(data.message)) // Display success message from the server response
      .catch(err => setMessage("Error deactivating user")) // Display error message if the request fails
  }

  return (
    <div>
      <h2>Deactivate User Account</h2>
      {/* Input for the user ID */}
      <input
        type="text"
        placeholder="User ID"
        value={userID}
        onChange={e => setUserID(e.target.value)}
      />
      {/* Deactivate Account button */}
      <button onClick={handleDeactivate}>Deactivate Account</button>
      {message && <p>{message}</p>}
    </div>
  );
}

export default AdminDeactivateUser;