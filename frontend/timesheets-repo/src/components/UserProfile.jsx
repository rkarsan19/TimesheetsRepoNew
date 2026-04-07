import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import timedimebg from '../assets/TimeDimebg.svg';
import { faClock } from "@fortawesome/free-solid-svg-icons";








function UserProfile({user, setuser, onBack}) {
    // const [User, setUser] = useState(null);
    const [formData, setFormData] = useState({});
    const [Message, setMessage] = useState("");
    const [isEditing, setisEditing] = useState(false);

    const storeduserid = JSON.parse(localStorage.getItem('user'));
    const UserID = storeduserid?.userID;    

    useEffect(() => {

      console.log("stored:", localStorage.getItem('user'));
      console.log("UserID:", UserID);


        const fetchUserdata = async () => {
            try {
              const response = await axios.get(
                `http://localhost:8000/api/users/${UserID}/`);
                console.log("fetched user data:", response.data);
              setFormData(response.data);
              setuser(response.data);
            } 
            
            catch(error) {
                console.error("Error fetching user data", error);
                setMessage("Failed to load user profile")
            }
          };
          fetchUserdata();
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






