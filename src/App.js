/* src/App.jsx */
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import AuthWrapper from './components/Auth/AuthWrapper';
import Header from './components/UI/Header';
import Sidebar from './components/UI/Sidebar';
import ChatWindow from './components/Chat/ChatWindow';
import Loader from './components/UI/Loader';
import './styles/App.css';

const AppContent = () => {
  const { currentUser, loading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  if (loading) {
    return <Loader />;
  }

  if (!currentUser) {
    return <AuthWrapper />;
  }

  return (
    <ChatProvider>
      <div className={`app-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
        <Header 
          toggleTheme={toggleTheme}
          isDarkMode={isDarkMode}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={toggleMobileSidebar}
        />

        <div className="app-content">
          {/* Sidebar - hidden on mobile unless toggled */}
          <div className={`sidebar-container ${isMobileSidebarOpen ? 'sidebar-mobile-open' : ''}`}>
            <Sidebar closeMobileSidebar={closeMobileSidebar} />
          </div>

          {/* Backdrop for mobile sidebar */}
          {isMobileSidebarOpen && (
            <div 
              className="backdrop backdrop-visible"
              onClick={closeMobileSidebar}
            ></div>
          )}

          {/* Chat area */}
          <div className="chat-container">
            <ChatWindow />
          </div>
        </div>

        {/* Mobile Theme Toggle */}
        <button 
          className="theme-toggle mobile-theme-toggle"
          onClick={toggleTheme}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </ChatProvider>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;