import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, authFetch, logout } = useAuth();
  const navigate = useNavigate();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      return setError('New passwords do not match.');
    }

    setLoading(true);
    try {
      const res = await authFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to update password.');
      } else {
        setMessage(data.message);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        setShowChangePassword(false);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="container profile-layout">
        {/* User Info Card */}
        <section className="card profile-card">
          <h3>User Information</h3>
          <div className="profile-avatar">
            <i className="fas fa-user-circle fa-5x"></i>
          </div>
          <div className="profile-details-list">
            <div className="profile-detail">
              <strong>
                <i className="fas fa-signature"></i> Username:
              </strong>
              <span id="profile-username">{user?.username || 'Loading...'}</span>
            </div>
            <div className="profile-detail">
              <strong>
                <i className="fas fa-envelope"></i> Email:
              </strong>
              <span id="profile-email">{user?.email || 'Loading...'}</span>
            </div>
            <div className="profile-detail">
              <strong>
                <i className="fas fa-lock"></i> Password:
              </strong>
              <span id="profile-password">**********</span>
            </div>
          </div>

          <hr className="separator" />

          {message && (
            <p style={{ color: 'var(--success-color)', marginBottom: '15px', textAlign: 'center' }}>
              {message}
            </p>
          )}

          <div className="profile-actions">
            <button
              className="btn btn-secondary"
              id="change-password-btn"
              onClick={() => {
                setShowChangePassword((v) => !v);
                setError('');
                setMessage('');
              }}
            >
              <i className="fas fa-key"></i> Change Password
            </button>
            <button className="btn btn-danger" id="logout-btn-profile" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </section>

        {/* Change Password Section */}
        {showChangePassword && (
          <section id="change-password-section" className="card form-card">
            <h3>Update Password</h3>
            <form id="change-password-form" onSubmit={handleChangePassword}>
              {error && (
                <p style={{ color: 'var(--danger-color)', marginBottom: '15px' }}>{error}</p>
              )}
              <div className="form-group">
                <label htmlFor="current-password">Current Password</label>
                <input
                  type="password"
                  id="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <input
                  type="password"
                  id="new-password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirm-new-password">Confirm New Password</label>
                <input
                  type="password"
                  id="confirm-new-password"
                  value={passwordForm.confirmNewPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })
                  }
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary-full"
                disabled={loading}
              >
                <i className="fas fa-check-circle"></i>{' '}
                {loading ? 'Updating...' : 'Update'}
              </button>
            </form>
          </section>
        )}
      </main>
    </>
  );
}
