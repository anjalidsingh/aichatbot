// src/components/Chat/Message.jsx - Direct update
import React, { memo, useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import '../../styles/Chat.css';

const Message = memo(({ message, modelInfo }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation entrance effect
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Format timestamp
  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours}h ago`;
    }
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  // Handle copy to clipboard
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  // Get model display with icon
  const getModelDisplay = useCallback(() => {
    if (!message.model) return null;
    
    const model = modelInfo?.[message.model] || { 
      name: message.model?.split('/').pop().replace(':free', '') || 'AI'
    };
    
    let icon = '🤖';
    if (message.model?.includes('llama')) icon = '🦙';
    else if (message.model?.includes('claude')) icon = '🧠';
    else if (message.model?.includes('gpt')) icon = '✨';
    
    return (
      <span className="model-display">
        <span className="model-icon">{icon}</span>
        <span className="model-name">{model.name}</span>
      </span>
    );
  }, [message.model, modelInfo]);

  // Render message based on role
  return (
    <div className={`message ${isUser ? 'message-user' : 'message-ai'} ${isVisible ? 'message-visible' : 'message-hidden'}`}>
      <div className={`message-content ${isUser ? 'message-content-user' : 'message-content-ai premium'}`}>
        {!isUser && message.model && (
          <div className="message-model-info">
            {getModelDisplay()}
            {isStreaming && (
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
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="message-ai-container">
            <ReactMarkdown
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  
                  return !inline && match ? (
                    <div className="code-block-wrapper">
                      <div className="code-block-header">
                        <span className="code-language">{language}</span>
                        <button 
                          className="code-copy-button"
                          onClick={() => {
                            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                          }}
                        >
                          Copy
                        </button>
                      </div>
                      <SyntaxHighlighter
                        language={match[1]}
                        style={vscDarkPlus}
                        showLineNumbers={true}
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className={`${className || ''}`} {...props}>
                      {children}
                    </code>
                  )
                },
                a({node, children, href, ...props}) {
                  const isExternal = href?.startsWith('http');
                  return (
                    <a 
                      href={href} 
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className={isExternal ? "external-link" : ""}
                      {...props}
                    >
                      {children}
                      {isExternal && <span className="external-link-icon">↗</span>}
                    </a>
                  )
                }
              }}
            >
              {message.content || ''}
            </ReactMarkdown>
          </div>
        )}
        
        {message.timestamp && !isStreaming && (
          <div className="message-time">{formatTime(message.timestamp)}</div>
        )}
        
        {!isStreaming && (
          <div className="message-actions">
            <button 
              className={`message-action-button ${copied ? 'copied' : ''}`}
              title={copied ? "Copied!" : "Copy to clipboard"}
              onClick={handleCopy}
            >
              {copied ? "✓" : "📋"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

Message.displayName = 'Message';

export default Message;