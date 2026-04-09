import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import timedimebg from '../assets/TimeDimebg.svg';
import { faClock } from "@fortawesome/free-solid-svg-icons";








function UserProfile({user, setuser, onBack}) {
    const [formData, setFormData] = useState({});
    const [Message, setMessage] = useState("");
    const [isEditing, setisEditing] = useState(false);

    // Overtime limit (line manager only)
    const [overtimeLimit, setOvertimeLimit] = useState('');
    const [overtimeLimitMsg, setOvertimeLimitMsg] = useState('');
    const [savingLimit, setSavingLimit] = useState(false);

    const storeduserid = JSON.parse(localStorage.getItem('user'));
    const UserID = storeduserid?.userID;
    const isLineManager = (user?.role || storeduserid?.role) === 'LINE_MANAGER';

    useEffect(() => {
        const fetchUserdata = async () => {
            try {
              const response = await axios.get(
                `http://localhost:8000/api/users/${UserID}/`);
              setFormData(response.data);
              setuser(response.data);
            } catch(error) {
                console.error("Error fetching user data", error);
                setMessage("Failed to load user profile");
            }
        };
        fetchUserdata();

        if (isLineManager) {
            axios.get('http://localhost:8000/api/settings/overtime-limit/')
                .then(res => setOvertimeLimit(String(res.data.overtime_limit)))
                .catch(() => {});
        }
    }, [UserID]);

        const handleChange = (e) => {
            setFormData({...formData, [e.target.name]: e.target.value});
        }
    
        const handleSubmit = async (e) => {
            e.preventDefault();
            console.log("user at submit time:", user);
            
            try {
                const res = await axios.put(`http://localhost:8000/api/users/${UserID}/update/`, formData);
                const storedUser = JSON.parse(localStorage.getItem('user'));
                const updatedUser = { ...storedUser, ...res.data };
                // console.log("storedUser:", storedUser);
                // console.log("res.data:", res.data);
                // console.log("updatedUser:", updatedUser);
                setFormData(updatedUser);
                setuser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setMessage("Profile updated successfully");
                setisEditing(false);
                // onBack();
      


            }
            
            catch(error){

                console.error("Error updating profile", error);
                setMessage("Profile update unsuccessful, Please try again");

            }



        }




        
    

  
    const handleSaveOvertimeLimit = async () => {
        const val = parseFloat(overtimeLimit);
        if (isNaN(val) || val < 0) {
            setOvertimeLimitMsg('Please enter a valid number of hours (0 or more).');
            return;
        }
        setSavingLimit(true);
        setOvertimeLimitMsg('');
        try {
            await axios.post('http://localhost:8000/api/settings/overtime-limit/', { overtime_limit: val });
            setOvertimeLimitMsg('Overtime limit updated successfully.');
        } catch {
            setOvertimeLimitMsg('Failed to update overtime limit.');
        } finally {
            setSavingLimit(false);
        }
    };

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundImage: `url(${timedimebg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', margin: 0, padding: 0, overflow: 'hidden'}}>

     {/* Logo */}
          <div className="d-flex gap-2 text-white" style={{bottom: '20px', right: '20px', position: 'fixed'}}>
          
            <div
              className="rounded-circle border border-white border-2 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 46, height: 46 }}
            >
              <FontAwesomeIcon icon={faClock} />
            </div>
            </div>




    <div style={{...styles.container, alignContent: 'center'}}>
      <h2 style={{...styles.heading, color: '#e8faf7'}}>My Profile</h2>
      <div style={{}}>
      <button onClick={onBack} style={{...styles.btn, position: 'fixed', top: '20px', left: '20px' }}>Back</button>
      </div>






      {Message && <p style={{...styles.Message, color: '#e8faf7'}}>{Message}</p>}

      {!isEditing ? (
        <div style={{...styles.card}}>
          <p><strong>Name:</strong> {formData.name}</p>
          <p><strong>Email:</strong> {formData.email}</p>
          <p><strong>Role:</strong> {formData.role}</p>
          <button style={styles.btn} onClick={() => setisEditing(true)}>Edit Profile</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={styles.card}>
          <label style={styles.label}>Name</label>
          <input style={styles.input} name="name" value={formData.name || ''} onChange={handleChange} />

          <label style={styles.label}>Email</label>
          <input style={styles.input} name="email" type="email" value={formData.email || ''} onChange={handleChange} />

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" style={styles.btn}>Save Changes</button>
            <button type="button" style={{ ...styles.btn, background: '#aaa' }} onClick={() => setisEditing(false)}>Cancel</button>
          </div>
        </form>
      )}

      {isLineManager && (
        <div style={{ ...styles.card, marginTop: '20px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Overtime Settings</p>
          <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '12px' }}>
            Set the maximum overtime hours a consultant may log per day. This applies to all consultants.
          </p>
          <label style={styles.label}>Max overtime hours per day</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
            <input
              style={{ ...styles.input, width: '100px' }}
              type="number"
              min="0"
              step="0.5"
              value={overtimeLimit}
              onChange={e => { setOvertimeLimit(e.target.value); setOvertimeLimitMsg(''); }}
            />
            <button
              style={styles.btn}
              onClick={handleSaveOvertimeLimit}
              disabled={savingLimit}
            >
              {savingLimit ? 'Saving…' : 'Save'}
            </button>
          </div>
          {overtimeLimitMsg && (
            <p style={{ marginTop: '8px', fontSize: '0.85rem', color: overtimeLimitMsg.includes('success') ? 'green' : '#c0392b' }}>
              {overtimeLimitMsg}
            </p>
          )}
        </div>
      )}
    </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '500px', margin: '40px auto', fontFamily: 'sans-serif' },
  heading: { color: '#00789A', marginBottom: '20px' },
  card: { background: '#a8dfe8', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  label: { display: 'block', marginTop: '12px', marginBottom: '4px', fontWeight: 'bold', color: '#333' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' },
  btn: { padding: '10px 20px', background: '#2DB5AA', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  message: { color: 'green', marginBottom: '10px' },
};



export default UserProfile






