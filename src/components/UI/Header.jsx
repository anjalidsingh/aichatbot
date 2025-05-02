import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { logoutUser } from '../../services/firebase';
import '../../styles/UI.css';

const Header = ({ 
  toggleTheme, 
  isDarkMode, 
  isMobileSidebarOpen = false, 
  setIsMobileSidebarOpen = () => {} 
}) => {
  const { currentUser } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      setShowDropdown(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!currentUser || !currentUser.email) return '?';
    
    const email = currentUser.email;
    return email.charAt(0).toUpperCase();
  };
  
  return (
    <header className="header">
      {/* Mobile sidebar toggle button */}
      <div className="header-toggle">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="header-toggle-button"
          aria-label="Toggle sidebar"
        >
          {isMobileSidebarOpen ? "×" : "≡"}
        </button>
      </div>
      
      <div className="header-logo">
        <span className="logo-icon">💬</span>
        <h1 className="header-title">AI Free Chat</h1>
      </div>
      
      {currentUser && (
        <div className="header-actions">
          <button 
            className="header-button theme-toggle desktop-only"
            onClick={toggleTheme}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span>{isDarkMode ? '☀️' : '🌙'}</span>
            <span className="header-button-text">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
          
          <div className="user-dropdown">
            <button 
              className="dropdown-toggle"
              onClick={() => setShowDropdown(!showDropdown)}
              title="User menu"
            >
              <div className="user-avatar">{getUserInitials()}</div>
            </button>
            
            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-item">
                  <span className="dropdown-icon">👤</span>
                  <span>{currentUser.email}</span>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-item" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  <span>Log Out</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;