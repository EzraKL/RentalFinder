// frontend/src/components/AuthScreen.jsx
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import '../Auth.css'; // New CSS file for authentication forms

const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);

    const toggleForm = () => {
        setIsLogin(prev => !prev);
    };

    return (
        <div className="auth-container">
            {isLogin ? 
                <LoginForm /> : 
                <RegisterForm toggleForm={toggleForm} />
            }
            {/* The Login form will include the switch link within its own component */}
            {isLogin && (
                <p className="switch-auth">
                    Don't have an account? <span onClick={toggleForm}>Register here.</span>
                </p>
            )}
        </div>
    );
};

export default AuthScreen;