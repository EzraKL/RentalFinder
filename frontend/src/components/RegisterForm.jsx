// frontend/src/components/RegisterForm.jsx
import React, { useState } from 'react';

// IMPORTANT: Use your correct port (e.g., :8080) and folder name ('Rental')
const REGISTER_API = 'http://localhost:8080/Rental/backend/register.php'; 

const RegisterForm = ({ toggleForm }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'tenant', // Default role
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('Registering user...');
        
        try {
            const response = await fetch(REGISTER_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const result = await response.json();

            if (result.success) {
                setMessage('Registration successful! Please log in.');
                // Automatically switch to the login form after success
                setTimeout(toggleForm, 2000); 
            } else {
                setMessage(result.error || 'Registration failed.');
            }
        } catch (error) {
            setMessage('Network error during registration.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <h2>New User Registration</h2>
            <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" required />
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required />
            
            <label>I want to:</label>
            <select name="role" value={formData.role} onChange={handleChange}>
                <option value="tenant">Find Rentals (Tenant)</option>
                <option value="poster">Post Rentals (Landlord/Poster)</option>
            </select>
            
            <button type="submit">Register</button>
            
            <p className="switch-auth">
                Already have an account? <span onClick={toggleForm}>Login here.</span>
            </p>
            
            {message && <p className={`status ${message.includes('successful') ? 'success' : 'error'}`}>{message}</p>}
        </form>
    );
};

export default RegisterForm;