import React from 'react';
import { useState, useEffect } from 'react';
import axios from 'axios';








function UserProfile() {
    const [User, setUser] = useState(null);
    const [FormData, setFormData] = useState({});
    const [Message, setMessage] = useState("");
    const [isEditing, setisEditing] = useState(false);

    const storeduserid = JSON.parse(localStorage.getItem('user'));
    const UserID = storeduserid?.id;    

    useEffect(() => {


        const fetchUserdata = async () => {
            try {
              const response = await axios.get(
                `http://localhost:8000/api/users/${UserID}/`
              );
              setFormData(response.data);
              setUser(response.data);
            } 
            
            catch(error) {
                console.error("Error fetching user data", error);
                setMessage("Failed to load user profile")
            }
          };
          fetchUserdata();
        }, [UserID]);

        const handleChange = (e) => {
            setFormData({...FormData, [e.target.name]: e.target.value});

        }
    
        const handleSubmit = async (e) => {
            e.preventDefault();
            
            try {
                const res = await axios.put(`http://localhost:8000/api/users/${UserID}/update/`);
                setUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data));
                setMessage("Profile updated successfully");
                setisEditing(false);


            }
            
            catch(error){

                console.error("Error updating profile", error);
                setMessage("Profile update unsuccessful, Please try again");

            }



        }




        
    

  return (
    <div>UserProfile</div>
  )
}

export default UserProfile