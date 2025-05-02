/* src/components/UI/NetworkStatus.jsx */
import React, { useState, useEffect } from 'react';
import '../../styles/NetworkStatus.css';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      
      // Hide after 3 seconds
      setTimeout(() => {
        setShowStatus(false);
      }, 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (!showStatus) return null;
  
  return (
    <div className={`network-status ${isOnline ? 'online' : 'offline'}`}>
      <div className="network-status-icon">
        {isOnline ? '🟢' : '🔴'}
      </div>
      <div className="network-status-text">
        {isOnline ? 'Back online' : 'Connection lost'}
      </div>
      <button 
        className="network-status-close"
        onClick={() => setShowStatus(false)}
      >
        ✕
      </button>
    </div>
  );
};

export default NetworkStatus;