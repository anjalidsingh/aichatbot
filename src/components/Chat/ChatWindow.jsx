// Update your ChatWindow.jsx with these changes

import React, { 
  useState, 
  useRef, 
  useEffect, 
  useCallback, 
  useMemo 
} from 'react';
import { useChat } from '../../contexts/ChatContext';
import { modelConstants } from '../../services/openRouterService';
import Message from './Message'; // Use your updated Message component
import '../../styles/Chat.css';

const ChatWindow = () => {
  const { 
    messages, 
    sendMessage, 
    loading, 
    selectedModel, 
    streamingMessage,
    isStreaming,
    currentConversation,
    error,
    clearError
  } = useChat();
  
  const [userInput, setUserInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Memoize model name
  const modelName = useMemo(() => 
    modelConstants.modelInfo[selectedModel]?.name || 'AI', 
    [selectedModel]
  );

  // Auto-focus input on conversation change
  useEffect(() => {
    if (currentConversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentConversation]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: isStreaming ? 'auto' : 'smooth' 
      });
    }
  }, [messages, streamingMessage, isStreaming]);
  
  // Auto-resize textarea and track typing
  const handleInputChange = useCallback((e) => {
    setUserInput(e.target.value);
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
    
    // Set typing indicator
    setIsTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  }, []);
  
  // Process file selection
  const processFiles = useCallback((files) => {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_FILES = 4;
    
    const validFiles = Array.from(files).filter(file => 
      ALLOWED_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE
    ).slice(0, MAX_FILES - attachments.length);
    
    const fileObjects = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type
    }));
    
    setAttachments(prev => [...prev, ...fileObjects]);
    setShowFileUpload(false);
  }, [attachments]);
  
  // Handle file selection
  const handleFileSelect = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    
    // Reset the input
    e.target.value = null;
  }, [processFiles]);
  
  // Remove an attachment
  const removeAttachment = useCallback((index) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      URL.revokeObjectURL(newAttachments[index].preview);
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  }, []);
  
  // Process attachments for API
  const processAttachments = useCallback(async () => {
    if (attachments.length === 0) return [];
    
    try {
      return Promise.all(
        attachments.map(async (attachment) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                type: attachment.type,
                data: e.target.result.split(',')[1] // Remove data URL prefix
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(attachment.file);
          });
        })
      );
    } catch (error) {
      console.error("Error processing attachments:", error);
      return [];
    }
  }, [attachments]);
  
  // Handle message submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Don't submit if no content or already loading
    if ((userInput.trim() === '' && attachments.length === 0) || loading) return;
    
    const messageText = userInput;
    setUserInput('');
    
    // Reset typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      setIsTyping(false);
    }
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    
    try {
      const processedAttachments = await processAttachments();
      await sendMessage(messageText, processedAttachments);
      setAttachments([]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }, [userInput, attachments, loading, processAttachments, sendMessage]);
  
  // Handle key press for textarea
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);
  
  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);
  
  // Image viewer component
  const ImageViewer = useMemo(() => {
    if (!expandedImage) return null;
    
    const handleClose = () => {
      setExpandedImage(null);
    };
    
    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    };
    
    return (
      <div className="image-viewer-backdrop" onClick={handleBackdropClick}>
        <div className="image-viewer-container">
          <button className="image-viewer-close" onClick={handleClose}>×</button>
          <div className="image-viewer-content">
            <img 
              src={expandedImage.preview} 
              alt="Full size preview" 
              className="image-viewer-image"
            />
          </div>
        </div>
      </div>
    );
  }, [expandedImage]);
  
  // Empty state when no conversation is selected
  if (!currentConversation) {
    return (
      <div className="empty-state">
        <div className="empty-icon">💬</div>
        <h2 className="empty-title">Start a new conversation</h2>
        <p className="empty-description">
          Select a model and start chatting with AI. You can create a new conversation from the sidebar.
        </p>
      </div>
    );
  }
  
  return (
    <div 
      className="chat-window"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {error && (
        <div className="error-notification">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button className="error-close" onClick={clearError}>×</button>
        </div>
      )}
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👋</div>
            <h2 className="empty-title">Start the conversation</h2>
            <p className="empty-description">
              Send a message to start chatting with {modelName}.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Message 
                key={message.id || message.timestamp} 
                message={message}
                modelInfo={modelConstants.modelInfo}
              />
            ))}
            
            {isStreaming && streamingMessage && (
              <Message 
                message={{ 
                  role: 'assistant', 
                  content: streamingMessage, 
                  model: selectedModel,
                  isStreaming: true
                }}
                modelInfo={modelConstants.modelInfo}
              />
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="message-input-container">
        {showFileUpload && (
          <div 
            className="file-upload-container"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="file-upload-content">
              <div className="upload-icon">📷</div>
              <div className="upload-text">
                <p className="upload-primary">Drop images here or click to browse</p>
                <p className="upload-secondary">JPEG, PNG, GIF, WebP up to 5MB</p>
              </div>
            </div>
          </div>
        )}
        
        {attachments.length > 0 && (
          <div className="file-previews">
            {attachments.map((attachment, index) => (
              <div className="file-preview-item" key={index}>
                <div className="file-preview-image-container">
                  <img 
                    src={attachment.preview} 
                    alt={`Preview ${index}`} 
                    className="file-preview-image"
                    onClick={() => setExpandedImage(attachment)}
                  />
                  <button 
                    className="file-preview-remove"
                    onClick={() => removeAttachment(index)}
                    title="Remove file"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="message-form">
          <div className="message-input-wrapper">
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${modelName}...`}
              className="message-input"
              disabled={loading}
              rows={1}
            />
            <div className="input-buttons">
              <button 
                type="button" 
                className="input-button"
                onClick={() => {
                  setShowFileUpload(!showFileUpload);
                  if (!showFileUpload && fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                title="Add image"
              >
                📷
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                multiple
                onChange={handleFileSelect}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || (userInput.trim() === '' && attachments.length === 0)}
            className={`send-button ${isTyping ? 'send-button-typing' : ''}`}
            title="Send message"
          >
            {loading ? 
              <span className="loading-icon"></span> : 
              <span className="send-icon">➤</span>
            }
          </button>
        </form>
      </div>
      
      {/* Image viewer for expanded images */}
      {ImageViewer}
    </div>
  );
};

export default ChatWindow;