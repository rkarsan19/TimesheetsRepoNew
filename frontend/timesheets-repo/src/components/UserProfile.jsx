import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import timedimebg from '../assets/TimeDimebg.svg';
import greenbg from '../assets/login-bg.svg';
import { faClock, faArrowLeft, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";

function UserProfile({user, setuser, onBack, onLogout}) {
    const [formData, setFormData] = useState({}); //usestate: for editing form data
    const [Message, setMessage] = useState(""); //usestate: confirmation message 
    const [isEditing, setisEditing] = useState(false); //usestate: when user is editing profile
    const [isError, setisError] = useState(false); //usestate: check if Message is an error message
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768); //usestate: check if window width smaller than 768 

    const userName = user?.name; 
    const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase(); //split user name into intials

    const [overtimeLimit, setOvertimeLimit] = useState(''); //usestate: set overtime limit for consultant if user is line manager
    const [overtimeLimitMsg, setOvertimeLimitMsg] = useState(''); //usestate: confrimation message 
    const [savingLimit, setSavingLimit] = useState(false); //usestate: saves overtime limit

    const storeduserid = JSON.parse(localStorage.getItem('user')); 
    const UserID = storeduserid?.userID; //user id
    const isLineManager = (user?.role || storeduserid?.role) === 'LINE_MANAGER'; //to check if user is line manager

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize); //to handle the resizing of the window
    }, []);

    useEffect(() => {
        const fetchUserdata = async () => { //fetches data for user
            try {
              const response = await axios.get(`http://localhost:8000/api/users/${UserID}/`); 
              setFormData(response.data);
              setuser(response.data);
            } catch(error) {
                console.error("Error fetching user data", error);
                setMessage("Failed to load user profile");
                setisError(true); 
            }
        };
        fetchUserdata();

        if (isLineManager) { //check if user is the line manager to set overtime limit
            axios.get('http://localhost:8000/api/settings/overtime-limit/')
                .then(res => setOvertimeLimit(String(res.data.overtime_limit)))
                .catch(() => {});
        }
    }, [UserID]);

    const handleChange = (e) => { 
        setFormData({...formData, [e.target.name]: e.target.value});
    }

    const handleSubmit = async (e) => { //handles updating data on profile
        e.preventDefault();
        try {
            const res = await axios.put(`http://localhost:8000/api/users/${UserID}/update/`, formData);
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const updatedUser = { ...storedUser, ...res.data };
            setFormData(updatedUser);
            setuser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setMessage("Profile updated successfully");
            setisEditing(false);
            setisError(false);
        } catch(error) {
            console.error("Error updating profile", error);
            setMessage("Profile update unsuccessful, Please try again");
            setisError(true);
        }
    }

    const handleSaveOvertimeLimit = async () => { //save overtime limit
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
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      backgroundImage: `url(${timedimebg})`, 
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      margin: 0,
      padding: 0,
      overflowY: 'auto'
    }}>

      {/* TOP NAV BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '14px 16px' : '18px 32px', //if mobile change padding
        background: 'rgba(0,0,0,0.18)',
        backdropFilter: 'blur(6px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px',
            padding: isMobile ? '7px 14px' : '8px 18px',
            cursor: 'pointer',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '500',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          {!isMobile && 'Back'} {/* if not mobile keep "back" inside button */}
        </button>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
          <div style={{
            width: isMobile ? 32 : 40,
            height: isMobile ? 32 : 40,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <FontAwesomeIcon icon={faClock} style={{ fontSize: isMobile ? '0.85rem' : '1rem' }} />
          </div>
          {!isMobile && (
            <span style={{ fontWeight: '600', fontSize: '1rem' }}>TimeDime</span>
          )}
        </div>

        {/* Sign Out button */}
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(141, 217, 211, 0.75)',
              color: '#fff',
              border: '1px solid rgba(141, 217, 211, 0.75)',
              borderRadius: '8px',
              padding: isMobile ? '7px 14px' : '8px 18px',
              cursor: 'pointer',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '500',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(164, 238, 232, 1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(164,238,232,0.75)'}
          >
            <FontAwesomeIcon icon={faRightFromBracket} />
            {!isMobile && 'Sign Out'}
          </button>
        )}
      </div>

      {/* PAGE CONTENT */}
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        padding: isMobile ? '24px 16px 40px' : '36px 16px 60px',
        fontFamily: 'sans-serif',
      }}>
        <h2 style={{
          color: '#e8faf7',
          fontWeight: '300',
          fontSize: isMobile ? '1.6rem' : '2rem',
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          My Profile
        </h2>

        {Message && (
          <p style={{
            color: !isError ? '#9DE09D' : '#ff6b6b', //if there is an error, the message is red
            background: 'rgba(0,0,0,0.25)',
            borderRadius: '8px',
            padding: '10px 16px',
            marginBottom: '16px',
            fontSize: '0.9rem',
            textAlign: 'center',
          }}>
            {Message}
          </p>
        )}

        {/* PROFILE CARD */}
        {!isEditing ? ( //if not editing profile 
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            overflow: 'hidden',
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <div style={{ height: '130px', width: '100%', overflow: 'hidden' }}>
              <img src={greenbg} style={{ height: '100%', width: '100%', objectFit: 'cover' }} alt="" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                border: '4px solid #a8dfe8',
                backgroundColor: '#0d7a7a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '-38px',
                color: 'white',
                fontWeight: '700',
                fontSize: '1.2rem',
                zIndex: 1,
                position: 'relative',
              }}>
                {initials}
              </div>
            </div>
            <div style={{ padding: '16px 24px 28px', textAlign: 'center' }}>
              <p style={{ fontWeight: '600', fontSize: '1.15rem', color: '#1a1a1a', margin: '0 0 4px' }}>
                {formData.name}
              </p>
              <p style={{ color: '#78858F', fontSize: '0.9rem', margin: '0 0 4px' }}>{formData.email}</p>
              <p style={{
                display: 'inline-block',
                background: '#e8faf7',
                color: '#0d7a7a',
                borderRadius: '20px',
                padding: '3px 14px',
                fontSize: '0.8rem',
                fontWeight: '500',
                marginTop: '6px',
                marginBottom: '20px',
              }}>
                {formData.role}
              </p>
              <br />
              <button style={styles.btn} onClick={() => setisEditing(true)}>Edit Profile</button> 
            </div>
          </div>
        ) : ( //if editing profile
          <form onSubmit={handleSubmit} style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '28px 24px',
            width: '100%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            boxSizing: 'border-box',
          }}>
            <label style={styles.label}>Name</label>
            <input style={styles.input} name="name" value={formData.name || ''} onChange={handleChange} />
            <label style={styles.label}>Email</label>
            <input style={{ ...styles.input, marginBottom: '24px' }} name="email" type="email" value={formData.email || ''} onChange={handleChange} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={styles.btn}>Save Changes</button>
              <button type="button" style={{ ...styles.btn, background: '#aaa' }} onClick={() => setisEditing(false)}>Cancel</button>
            </div>
          </form>
        )}

        {/* OVERTIME SETTINGS */}
        {isLineManager && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '24px',
            marginTop: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            boxSizing: 'border-box',
            width: '100%',
          }}>
            <p style={{ fontWeight: '600', marginBottom: '6px', color: '#0d7a7a', fontSize: '1rem' }}>
              Overtime Settings
            </p>
            <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '16px' }}>
              Set the maximum overtime hours a consultant may log per day. This applies to all consultants.
            </p>
            <label style={styles.label}>Max overtime hours per day</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
              <input
                style={{ ...styles.input, width: '110px' }}
                type="number"
                min="0"
                step="0.5"
                value={overtimeLimit}
                onChange={e => { setOvertimeLimit(e.target.value); setOvertimeLimitMsg(''); }}
              />
              <button style={styles.btn} onClick={handleSaveOvertimeLimit} disabled={savingLimit}>
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

//styles for page

const styles = {
  label: {
    display: 'block',
    marginTop: '16px',
    marginBottom: '6px',
    fontWeight: '600',
    color: '#333',
    fontSize: '0.9rem',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    fontSize: '0.95rem',
  },
  btn: {
    padding: '10px 22px',
    background: '#2DB5AA',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
  },
};

export default UserProfile;