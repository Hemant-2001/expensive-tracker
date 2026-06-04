import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
      } else {
        localStorage.setItem('token', data.token);
        setAuth({ token: data.token, user: data.user, loading: false });
        navigate('/dashboard');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-body">
      <div className="card auth-card">
        <div className="logo-center">
          <i className="fas fa-lock"></i>
          <h2>Reset Your Password</h2>
          <p className="auth-message">
            Enter your new password below.
          </p>
        </div>
        <form id="reset-password-form" onSubmit={handleSubmit}>
          {error && (
            <p style={{ color: 'var(--danger-color)', marginBottom: '15px', textAlign: 'center' }}>
              {error}
            </p>
          )}
          <div className="form-group">
            <label htmlFor="password">
              <i className="fas fa-key"></i> New Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">
              <i className="fas fa-key"></i> Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary-full" disabled={loading}>
            <i className="fas fa-check-circle"></i>{' '}
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
          <p className="auth-links" style={{ marginTop: '20px' }}>
            <Link to="/signin">Back to Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
