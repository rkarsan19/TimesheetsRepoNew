import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import timedimebg from '../assets/TimeDimebg.svg';
import greenbg from '../assets/login-bg.svg';
import { faClock } from "@fortawesome/free-solid-svg-icons";








function UserProfile({user, setuser, onBack, onLogout}) {
    const [formData, setFormData] = useState({});
    const [Message, setMessage] = useState("");
    const [isEditing, setisEditing] = useState(false);
    // const [image, setImage] = useState(false);
    const [isError, setisError] = useState(false);


    const userName = user?.name;

    const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase();

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
                setisError(true);
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
                setFormData(updatedUser);
                setuser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setMessage("Profile updated successfully");
                setisEditing(false);
                setisError(false);
                
      


            }
            
            catch(error){

                console.error("Error updating profile", error);
                setMessage("Profile update unsuccessful, Please try again");
                setisError(true);

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
    <div style={{ width: '100vw', height: '100vh', backgroundImage: `url(${timedimebg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', margin: 0, padding: 0, overflow: 'hidden', overflowY: 'scroll'}}>

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
      {onLogout && (
        <button onClick={onLogout} style={{...styles.btn, background: '#0d7a7a', position: 'fixed', top: '20px', right: '20px' }}>Sign out</button>
      )}
      </div>






      {Message && <p style={{...styles.Message, color: !isError ? '#9DE09D' : 'red' }}>{Message}</p>}

      {!isEditing ? (
        <div style={{...styles.card}}>
          <div style={{...styles.cardimg}}>
            <img src={greenbg} style={styles.cardimgsvg}/>
           

            

          </div>
          <div style={{...styles.cardavatar}}>

            <p style={{ display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "700", fontSize: "1rem", marginTop: '12px', color: 'white'}}>
              {initials}
            </p>

          </div>
          <p style={{...styles.cardtitle}}>
            {/* <strong>Name:</strong> */}
            <strong>
             {formData.name} </strong></p>
          <p style={{...styles.cardsubtitle}}>{formData.email}</p>
          <p style={{...styles.cardsubtitle, marginBottom: '20px'}}>{formData.role}</p>
          <button style={styles.btn} onClick={() => setisEditing(true)}>Edit Profile</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{...styles.card}}>
          <label style={styles.label}>Name</label>
          <input style={{...styles.input}} name="name" value={formData.name || ''} onChange={handleChange} />

          <label style={styles.label}>Email</label>
          <input style={{...styles.input, marginBottom: '30px'}}  name="email" type="email" value={formData.email || ''} onChange={handleChange} />

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button type="submit" style={styles.btn}>Save Changes</button>
            <button type="button" style={{ ...styles.btn, background: '#aaa' }} onClick={() => setisEditing(false)}>Cancel</button>
          </div>
        </form>
      )}

      {isLineManager && (
        <div style={{ ...styles.card, marginTop: '20px' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333', marginTop: '10px' }}>Overtime Settings</p>
          <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '12px', textAlign: 'center' }}>
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
  // card2: { background: '#a8dfe8', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  card: {
  backgroundColor: 'white',
  position: 'relative',
  width: '400px',
  height: '395px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderRadius: '20px',
} ,

cardimg: {
  height: '140px',
  width: '100%',
},

cardimgsvg: {
  height: '100%',
  width: '100%',
  borderRadius: '20px 20px 0 0',
},

cardavatar: {
  position: 'absolute',
  width: '75px',
  height: '75px',
  borderRadius: '100%',
  border: '5px solid #a8dfe8' , 
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  top: '100px',
  backgroundColor: '#0d7a7a' ,
  
},

cardavatarsvg: {
  width: '100px',
  height: '100px',
},

cardtitle: {
  marginTop: '45px',
  fontWeight: '500',
  fontSize: '18px',
},

cardsubtitle: {
  color: '#78858F',
  fontWeight: '400',
  fontSize: '15px',
  marginTop: '5px',
},

  label: { display: 'block', marginTop: '30px', marginBottom: '10px', fontWeight: 'bold', color: '#333' },
  input: { width: '90%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' },
  btn: { padding: '10px 20px', background: '#2DB5AA', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  message: { color: 'green', marginBottom: '10px' },
};



export default UserProfile






