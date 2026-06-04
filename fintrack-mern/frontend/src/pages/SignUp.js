import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Sign up failed.');
      } else {
        login(data.token, data.user);
        navigate('/');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <body className="auth-body">
      <div className="card auth-card">
        <div className="logo-center">
          <i className="fas fa-user-plus"></i>
          <h2>Create Your FinTrack Account</h2>
        </div>
        <form id="signup-form" onSubmit={handleSubmit}>
          {error && (
            <p style={{ color: 'var(--danger-color)', marginBottom: '15px', textAlign: 'center' }}>
              {error}
            </p>
          )}
          <div className="form-group">
            <label htmlFor="username">
              <i className="fas fa-signature"></i> Username
            </label>
            <input
              type="text"
              id="username"
              placeholder="e.g., janedoe99"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">
              <i className="fas fa-at"></i> Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="e.g., user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">
              <i className="fas fa-key"></i> Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">
              <i className="fas fa-lock"></i> Confirm Password
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary-full" disabled={loading}>
            <i className="fas fa-check-circle"></i>{' '}
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
          <p className="auth-links">
            Already have an account? <Link to="/signin">Sign In</Link>
          </p>
        </form>
      </div>
    </body>
  );
}
