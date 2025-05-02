import React, { 
    useState, 
    useRef, 
    useEffect, 
    useCallback, 
    useMemo 
  } from 'react';
  import { useChat } from '../../contexts/ChatContext';
  import { modelConstants } from '../../services/openRouterService';
  import ReactMarkdown from 'react-markdown';
  import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
  import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
  import '../../styles/Chat.css';
  
  const ChatWindow = () => {
    const { 
      messages, 
      sendMessage, 
      loading, 
      selectedModel, 
      streamingMessage,
      isStreaming,
      currentConversation
    } = useChat();
    
    const [userInput, setUserInput] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [expandedImage, setExpandedImage] = useState(null);
    
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    
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
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, [messages, streamingMessage]);
    
    // Auto-resize textarea based on content
    const handleInputChange = useCallback((e) => {
      setUserInput(e.target.value);
      e.target.style.height = 'auto';
      e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
    }, []);
    
    // Process file selection
    const processFiles = useCallback((files) => {
      const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      const MAX_FILES = 4;
      
      const validFiles = files.filter(file => 
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
      const files = Array.from(e.target.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length > 0) {
        processFiles(imageFiles);
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
    }, [attachments]);
    
    // Handle message submission
    const handleSubmit = useCallback(async (e) => {
      e.preventDefault();
      if ((userInput.trim() === '' && attachments.length === 0) || loading) return;
      
      const messageText = userInput;
      setUserInput('');
      
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
    
    // Memoized Message Component
    const MessageComponent = useCallback(({ message }) => {
      const isUser = message.role === 'user';
      const isThisStreaming = message.isStreaming;
      
      return (
        <div className={`message ${isUser ? 'message-user' : 'message-ai'}`}>
          <div className={`message-content ${isUser ? 'message-content-user' : 'message-content-ai'}`}>
            {isUser ? (
              <>
                <p className="message-text">{message.content}</p>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="message-attachments">
                    {message.attachments.map((attachment, index) => (
                      <div className="message-attachment" key={index}>
                        <img 
                          src={`data:${attachment.type};base64,${attachment.data}`} 
                          alt="User uploaded" 
                          className="message-attachment-image"
                          onClick={() => setExpandedImage({
                            preview: `data:${attachment.type};base64,${attachment.data}`,
                            type: attachment.type
                          })}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {message.timestamp && (
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                <div className="message-actions">
                  <button 
                    className="message-action-button" 
                    title="Copy to clipboard"
                    onClick={() => navigator.clipboard.writeText(message.content)}
                  >
                    📋
                  </button>
                </div>
              </>
            ) : (
              <div className="message-ai-container">
                {message.model && (
                  <div className="message-model-info">
                    <span>{modelConstants.modelInfo[message.model]?.name || message.model}</span>
                    {isThisStreaming && (
                      <span className="streaming-indicator">
                        <span className="typing-indicator">
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                          <span className="typing-dot"></span>
                        </span>
                      </span>
                    )}
                  </div>
                )}
                <ReactMarkdown
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          language={match[1]}
                          style={vscDarkPlus}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={`${className || ''}`} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {message.content || ''}
                </ReactMarkdown>
                {message.timestamp && !isThisStreaming && (
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                <div className="message-actions">
                  <button 
                    className="message-action-button" 
                    title="Copy to clipboard"
                    onClick={() => navigator.clipboard.writeText(message.content)}
                  >
                    📋
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }, []);
    
    // Drag and drop handlers
    const handleDragOver = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);
    
    const handleDrop = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(Array.from(e.dataTransfer.files));
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
            <button className="image-viewer-close" onClick={handleClose}>✕</button>
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
              {messages.map((message, index) => (
                <MessageComponent 
                  key={message.id || index} 
                  message={message}
                />
              ))}
              
              {isStreaming && streamingMessage && (
                <MessageComponent 
                  message={{ 
                    role: 'assistant', 
                    content: streamingMessage, 
                    model: selectedModel,
                    isStreaming: true
                  }}
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
                  <p className="upload-secondary">JPEG, PNG, GIF up to 5MB</p>
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
                      ✕
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Type your message or drop files here..."
                className="message-input"
                disabled={loading}
                rows={1}
              />
              <div className="input-buttons">
                <button 
                  type="button" 
                  className="input-button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowFileUpload(!showFileUpload);
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
              className="send-button"
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