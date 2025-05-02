/* src/components/Auth/Login.jsx */
import React, { useState } from 'react';
import { loginUser } from '../../services/firebase';
import '../../styles/Auth.css';

const Login = ({ switchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginUser(email, password);
      // Success - AuthContext will handle the redirect
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Log In</h2>
      
      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`auth-button ${loading ? 'button-loading' : ''}`}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      
      <p className="auth-switch">
        Don't have an account?{' '}
        <button
          onClick={switchToRegister}
          className="auth-switch-button"
        >
          Sign Up
        </button>
      </p>
    </div>
  );
};

export default Login;