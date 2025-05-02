/* src/components/UI/Loader.jsx */
import React from 'react';
import '../../styles/UI.css';

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="loader-spinner"></div>
      <div className="loader-text">Loading AI Free Chat...</div>
    </div>
  );
};

export default Loader;