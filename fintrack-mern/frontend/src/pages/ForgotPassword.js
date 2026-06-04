import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
      } else {
        setMessage(data.message);
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
          <i className="fas fa-question-circle"></i>
          <h2>Password Reset Request</h2>
          <p className="auth-message">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
        <form id="forgot-password-form" onSubmit={handleSubmit}>
          {error && (
            <p style={{ color: 'var(--danger-color)', marginBottom: '15px', textAlign: 'center' }}>
              {error}
            </p>
          )}
          {message && (
            <p style={{ color: 'var(--success-color)', marginBottom: '15px', textAlign: 'center' }}>
              {message}
            </p>
          )}
          <div className="form-group">
            <label htmlFor="email">
              <i className="fas fa-at"></i> Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary-full" disabled={loading}>
            <i className="fas fa-envelope"></i>{' '}
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <p className="auth-links" style={{ marginTop: '20px' }}>
            <Link to="/signin">Back to Sign In</Link>
          </p>
        </form>
      </div>
    </body>
  );
}
