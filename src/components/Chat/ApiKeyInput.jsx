import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import '../../styles/Chat.css';

const ApiKeyInput = () => {
  const { currentUser } = useAuth();
  const { apiKey, setApiKey } = useChat();
  const [inputKey, setInputKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load API key from Firestore on component mount
  useEffect(() => {
    const loadApiKey = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.openRouterApiKey) {
            setInputKey(userData.openRouterApiKey);
            setApiKey(userData.openRouterApiKey);
          }
        }
      } catch (err) {
        console.error('Error loading API key:', err);
        setError('Failed to load API key');
      } finally {
        setIsLoading(false);
      }
    };

    loadApiKey();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setError('You must be logged in to save an API key');
      return;
    }

    if (!inputKey.trim()) {
      setError('API key cannot be empty');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      // Save API key to Firestore
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        openRouterApiKey: inputKey.trim()
      }, { merge: true });

      // Update local state
      setApiKey(inputKey.trim());
      
      // Optional: Add a success toast or notification
      alert('API Key saved successfully!');
    } catch (err) {
      console.error('Error saving API key:', err);
      setError('Failed to save API key. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Secure key display (show only last 4 characters)
  const maskApiKey = (key) => {
    if (!key) return '';
    return key.length > 4 
      ? `${'*'.repeat(key.length - 4)}${key.slice(-4)}` 
      : key;
  };

  if (isLoading) {
    return (
      <div className="api-key-input loading">
        <span className="loading-spinner">Loading...</span>
      </div>
    );
  }

  return (
    <div className="api-key-input">
      <h3 className="api-key-title">
        <span className="api-key-icon">🔑</span>
        OpenRouter API Key
      </h3>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit} className="api-key-form">
        <div className="api-key-field">
          <input
            type={showKey ? "text" : "password"}
            value={showKey ? inputKey : maskApiKey(inputKey)}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="Enter your OpenRouter API key"
            className="api-key-input-field"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="toggle-visibility-button"
          >
            {showKey ? "Hide" : "Show"}
          </button>
        </div>

        <button
          type="submit"
          disabled={!inputKey || inputKey === apiKey || isSaving}
          className={`save-key-button ${(!inputKey || inputKey === apiKey || isSaving) ? 'button-disabled' : ''}`}
        >
          {isSaving ? 'Saving...' : 'Save API Key'}
        </button>
      </form>

      <p className="api-key-note">
        Your API key is securely stored with encryption.
        <br />
        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="external-link"
        >
          Get an OpenRouter API key <span>→</span>
        </a>
      </p>
    </div>
  );
};

export default ApiKeyInput;