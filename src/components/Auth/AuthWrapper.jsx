/* src/components/Auth/AuthWrapper.jsx */
import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import '../../styles/Auth.css';

const AuthWrapper = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        {isLogin ? (
          <Login switchToRegister={() => setIsLogin(false)} />
        ) : (
          <Register switchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};

export default AuthWrapper;