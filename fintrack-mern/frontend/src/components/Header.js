import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <header>
      <div className="logo">
        <i className="fas fa-chart-line"></i>
        <h2>FinTrack</h2>
      </div>

      {/* Desktop nav */}
      <nav className="nav-desktop">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          <i className="fas fa-home"></i> Dashboard
        </Link>
        <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
          <i className="fas fa-user-circle"></i> Profile
        </Link>
        <button id="theme-toggle-btn" className="btn-icon" onClick={toggleTheme}>
          <i className={`fas fa-${theme === 'dark' ? 'sun' : 'moon'}`}></i>
        </button>
        <button id="logout-btn-nav" className="btn-icon" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </nav>

      {/* Hamburger button - mobile only */}
      <button
        className="hamburger-btn"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
      >
        <i className={`fas fa-${menuOpen ? 'times' : 'bars'}`}></i>
      </button>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="mobile-menu" ref={menuRef}>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            <i className="fas fa-home"></i> Dashboard
          </Link>
          <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
            <i className="fas fa-user-circle"></i> Profile
          </Link>
          <button className="btn-icon" onClick={toggleTheme}>
            <i className={`fas fa-${theme === 'dark' ? 'sun' : 'moon'}`}></i>
            {theme === 'dark' ? ' Light Mode' : ' Dark Mode'}
          </button>
          <button id="logout-btn-nav" className="btn-icon" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      )}
    </header>
  );
}
