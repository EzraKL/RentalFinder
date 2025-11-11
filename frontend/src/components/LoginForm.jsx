// frontend/src/components/LoginForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../AuthContext';

// IMPORTANT: Use your correct port (e.g., :8080) and folder name ('Rental')
const LOGIN_API = 'http://localhost:8080/Rental/backend/login.php'; 

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('Logging in...');
        
        try {
            const response = await fetch(LOGIN_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const result = await response.json();

            if (result.success) {
                // Store token and user details in context/localStorage
                login({ token: result.token, ...result.user }); 
                setMessage('Login successful! Redirecting...');
            } else {
                setMessage(result.error || 'Login failed.');
            }
        } catch (error) {
            setMessage('Network error during login.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <h2>User Login</h2>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
            <button type="submit">Login</button>
            {message && <p className={`status ${message.includes('successful') ? 'success' : 'error'}`}>{message}</p>}
        </form>
    );
};

export default LoginForm;