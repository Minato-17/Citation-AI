import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'upload', icon: '📤', label: 'Upload Papers' },
    { id: 'library', icon: '📚', label: 'My Library' },
    { id: 'citations', icon: '📝', label: 'Citations' },
    { id: 'cloud', icon: '☁️', label: 'Cloud' },
    { id: 'favorites', icon: '⭐', label: 'Favorites' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button 
        className="collapse-btn" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand' : 'Collapse'}
      >
        {isCollapsed ? '➡️' : '⬅️'}
      </button>
      
      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-item">
          <span className="sidebar-icon">❓</span>
          {!isCollapsed && <span className="sidebar-label">Help</span>}
        </div>
        <div className="sidebar-item">
          <span className="sidebar-icon">🚪</span>
          {!isCollapsed && <span className="sidebar-label">Logout</span>}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
