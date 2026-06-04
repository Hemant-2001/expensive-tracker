import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, authFetch } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authFetch('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Sign in failed.');
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
          <i className="fas fa-lock"></i>
          <h2>Sign In to FinTrack</h2>
        </div>
        <form id="signin-form" onSubmit={handleSubmit}>
          {error && (
            <p style={{ color: 'var(--danger-color)', marginBottom: '15px', textAlign: 'center' }}>
              {error}
            </p>
          )}
          <div className="form-group">
            <label htmlFor="email">
              <i className="fas fa-at"></i> Email
            </label>
            <input
              type="email"
              id="email"
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
          <button type="submit" className="btn btn-primary-full" disabled={loading}>
            <i className="fas fa-sign-in-alt"></i>{' '}
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          <p className="auth-links">
            <Link to="/forgot-password">Forgot Password?</Link>
            <span>|</span>
            <Link to="/signup">Create Account</Link>
          </p>
        </form>
      </div>
    </body>
  );
}