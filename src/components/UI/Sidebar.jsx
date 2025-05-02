/* src/components/UI/Sidebar.jsx */
import React from 'react';
import { useChat } from '../../contexts/ChatContext';
import ApiKeyInput from '../Chat/ApiKeyInput';
import ModelSelector from '../Chat/ModelSelector';
import { modelConstants } from '../../services/openRouterService'; // Add this import
import '../../styles/UI.css';

const Sidebar = ({ closeMobileSidebar = () => {} }) => {  // Add default empty function
  const { 
    conversations, 
    currentConversation, 
    setCurrentConversation, 
    createConversation,
    deleteConversation
  } = useChat();
  
  const handleNewChat = async () => {
    await createConversation();
    // Safely call the function with an optional check
    if (typeof closeMobileSidebar === 'function') {
      closeMobileSidebar();
    }
  };
  
  const handleSelectConversation = (convoId) => {
    setCurrentConversation(convoId);
    // Safely call the function with an optional check
    if (typeof closeMobileSidebar === 'function') {
      closeMobileSidebar();
    }
  };
  
  const handleDeleteConversation = (e, convoId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(convoId);
    }
  };
  
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  // Safely get model name with fallback
  const getModelName = (modelId) => {
    if (!modelId) return 'AI';
    
    // Safely access modelInfo, provide fallback if not found
    return modelConstants.modelInfo[modelId]?.name || modelId.split('/').pop().replace(':free', '') || 'AI';
  };
  
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <button
          onClick={handleNewChat}
          className="new-chat-button"
        >
          <span className="plus-icon">+</span>
          <span>New Chat</span>
        </button>
      </div>
      
      <div className="sidebar-content">
        <div className="sidebar-section">
          <ApiKeyInput />
        </div>
        
        <div className="sidebar-section">
          <ModelSelector />
        </div>
        
        <div className="sidebar-section">
          <h3 className="sidebar-title">
            Conversations
            <button 
              className="section-action"
              onClick={handleNewChat}
              title="New conversation"
            >
              +
            </button>
          </h3>
          
          <div className="conversations-list">
            {conversations.length === 0 ? (
              <p className="no-conversations">No conversations yet</p>
            ) : (
              conversations.map((convo) => (
                <div
                  key={convo.id}
                  onClick={() => handleSelectConversation(convo.id)}
                  className={`conversation-item ${
                    currentConversation === convo.id ? 'conversation-active' : ''
                  }`}
                >
                  <span className="conversation-icon">💬</span>
                  <div className="conversation-content">
                    <div className="conversation-title">{convo.title}</div>
                    <div className="conversation-meta">
                      <span>{getModelName(convo.model)}</span>
                      <span className="conversation-time">{formatDate(convo.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="conversation-actions">
                    <button 
                      className="conversation-action"
                      onClick={(e) => handleDeleteConversation(e, convo.id)}
                      title="Delete conversation"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="sidebar-footer">
        AI Free Chat &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
};

export default Sidebar;