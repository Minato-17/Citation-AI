import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>📚 Research Paper Dashboard</h2>
      </div>
      <div className="navbar-menu">
        <div className="navbar-search">
          <input type="text" placeholder="Search papers..." />
          <button className="search-btn">🔍</button>
        </div>
        <div className="navbar-user">
          <span className="user-name">Welcome, {user?.name || 'User'}</span>
          <div 
            className="user-avatar" 
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={user.name} />
            ) : (
              '👤'
            )}
          </div>
          {showDropdown && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <p className="dropdown-name">{user?.name}</p>
                <p className="dropdown-email">{user?.email}</p>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={logout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
