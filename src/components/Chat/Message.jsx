import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import '../../styles/Chat.css';

const Message = memo(({ message, modelInfo }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.isStreaming;

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Action buttons for message
  const MessageActions = React.useCallback(() => (
    <div className="message-actions">
      <button
        className="message-action-button"
        title="Copy to clipboard"
        onClick={() => navigator.clipboard.writeText(message.content)}
      >
        📋
      </button>
    </div>
  ), [message.content]);

  // Memoized render of AI message content
  const AiMessageContent = React.useMemo(() => {
    return (
      <div className="message-ai-container">
        {message.model && (
          <div className="message-model-info">
            <span>{modelInfo[message.model]?.name || message.model}</span>
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
        {message.timestamp && !isStreaming && (
          <div className="message-time">{formatTime(message.timestamp)}</div>
        )}
        {!isStreaming && <MessageActions />}
      </div>
    );
  }, [message, modelInfo, isStreaming, formatTime]);

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-ai'}`}>
      <div className={`message-content ${isUser ? 'message-content-user' : 'message-content-ai'}`}>
        {isUser ? (
          <>
            <p className="message-text">{message.content || ''}</p>
            {message.timestamp && (
              <div className="message-time">{formatTime(message.timestamp)}</div>
            )}
            <MessageActions />
          </>
        ) : (
          AiMessageContent
        )}
      </div>
    </div>
  );
});

Message.displayName = 'Message';

export default Message;