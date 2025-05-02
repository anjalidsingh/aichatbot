/* src/contexts/ChatContext.jsx */
import React, { createContext, useState, useContext, useEffect } from 'react';
import { sendMessage, modelConstants } from '../services/openRouterService';
import { useAuth } from './AuthContext';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(modelConstants.expertModels.general);
  const [extendedThinking, setExtendedThinking] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  // Load API key from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openrouter_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    
    // Load selected model
    const savedModel = localStorage.getItem('selected_model');
    if (savedModel) {
      setSelectedModel(savedModel);
    }
    
    // Load extended thinking preference
    const savedThinking = localStorage.getItem('extended_thinking') === 'true';
    setExtendedThinking(savedThinking);
  }, []);

  // Save API key to localStorage
  const saveApiKey = (key) => {
    localStorage.setItem('openrouter_api_key', key);
    setApiKey(key);
  };
  
  // Save selected model
  useEffect(() => {
    localStorage.setItem('selected_model', selectedModel);
  }, [selectedModel]);
  
  // Save extended thinking preference
  useEffect(() => {
    localStorage.setItem('extended_thinking', extendedThinking.toString());
  }, [extendedThinking]);

  // Load conversations from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const conversationsRef = collection(db, `users/${currentUser.uid}/conversations`);
    const q = query(conversationsRef, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setConversations(conversationList);
      
      // Select first conversation if none is selected
      if (!currentConversation && conversationList.length > 0) {
        setCurrentConversation(conversationList[0].id);
      }
    }, (error) => {
      console.error("Error loading conversations:", error);
      setError("Failed to load conversations");
    });

    return unsubscribe;
  }, [currentUser, currentConversation]);

  // Load messages for current conversation
  useEffect(() => {
    if (!currentUser || !currentConversation) {
      setMessages([]);
      return;
    }

    const messagesRef = collection(db, `users/${currentUser.uid}/conversations/${currentConversation}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messageList);
    }, (error) => {
      console.error("Error loading messages:", error);
      setError("Failed to load messages");
    });

    return unsubscribe;
  }, [currentUser, currentConversation]);

  // Create a new conversation
  const createConversation = async (title = 'New Chat') => {
    if (!currentUser) return;

    try {
      const conversationRef = collection(db, `users/${currentUser.uid}/conversations`);
      const newConversation = await addDoc(conversationRef, {
        title,
        model: selectedModel,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setCurrentConversation(newConversation.id);
      return newConversation.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      setError("Failed to create new conversation");
      return null;
    }
  };
  
  // Delete conversation
  const deleteConversation = async (conversationId) => {
    if (!currentUser || !conversationId) return;
    
    try {
      // Delete the conversation document
      const conversationRef = doc(db, `users/${currentUser.uid}/conversations/${conversationId}`);
      await deleteDoc(conversationRef);
      
      // If deleted conversation was current, select another one
      if (currentConversation === conversationId) {
        const otherConversation = conversations.find(c => c.id !== conversationId);
        if (otherConversation) {
          setCurrentConversation(otherConversation.id);
        } else {
          setCurrentConversation(null);
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      setError("Failed to delete conversation");
    }
  };

  // Process streaming response
  const processStream = async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedData = "";
    let assistantMessage = "";

    setIsStreaming(true);
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        accumulatedData += chunk;
        
        // Process the lines
        const lines = accumulatedData.split('\n');
        accumulatedData = lines.pop() || ""; // Keep the last incomplete line for next iteration
        
        for (const line of lines) {
          if (!line.trim() || line.trim() === "data: [DONE]") continue;
          
          try {
            const dataMatch = line.match(/^data: (.+)$/);
            if (!dataMatch) continue;
            
            const data = JSON.parse(dataMatch[1]);
            const content = data.choices[0]?.delta?.content || "";
            
            if (content) {
              assistantMessage += content;
              setStreamingMessage(assistantMessage);
            }
          } catch (error) {
            console.error("Error parsing stream chunk:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error reading stream:", error);
    } finally {
      setIsStreaming(false);
      return assistantMessage;
    }
  };

  // Send a message
  const sendChatMessage = async (userMessage, attachments = []) => {
    if (!apiKey) {
      setError("OpenRouter API key is required");
      throw new Error("OpenRouter API key is required");
    }
    
    if (!currentConversation) {
      await createConversation();
    }
    
    setError(null);
    
    // Add user message to messages state
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
      attachments: attachments
    };
    
    try {
      // Save user message to Firestore
      const messagesRef = collection(db, `users/${currentUser.uid}/conversations/${currentConversation}/messages`);
      await addDoc(messagesRef, newUserMessage);
      
      // Prepare messages for API call
      const messagesForApi = messages.map(msg => {
        const msgContent = { role: msg.role, content: msg.content };
        
        // Add attachments if present
        if (msg.attachments && msg.attachments.length > 0) {
          msgContent.images = msg.attachments.map(attachment => 
            `data:${attachment.type};base64,${attachment.data}`
          );
        }
        
        return msgContent;
      });
      
      // Add the current message
      const userMsgForApi = { role: 'user', content: userMessage };
      
      // Add attachments if present
      if (attachments.length > 0) {
        userMsgForApi.images = attachments.map(attachment => 
          `data:${attachment.type};base64,${attachment.data}`
        );
      }
      
      messagesForApi.push(userMsgForApi);
      
      setLoading(true);
      
      // Send to OpenRouter API
      const response = await sendMessage(apiKey, selectedModel, messagesForApi, extendedThinking);
      
      // Process the streaming response
      const assistantResponse = await processStream(response);
      
      // Save assistant message to Firestore
      const newAssistantMessage = {
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date().toISOString(),
        model: selectedModel
      };
      
      await addDoc(messagesRef, newAssistantMessage);
      
      // Update the conversation timestamp and title if it's the first message
      const conversationRef = doc(db, `users/${currentUser.uid}/conversations/${currentConversation}`);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const conversationData = conversationDoc.data();
        
        // If it's a new conversation, update the title based on the first message
        const updateData = { updatedAt: serverTimestamp() };
        
        if (messages.length === 0 && conversationData.title === 'New Chat') {
          // Generate a title from the first message
          updateData.title = userMessage.length > 30 
            ? userMessage.substring(0, 30) + '...' 
            : userMessage;
        }
        
        await setDoc(conversationRef, updateData, { merge: true });
      }
      
      return assistantResponse;
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message: " + (error.message || "Unknown error"));
      throw error;
    } finally {
      setLoading(false);
      setStreamingMessage('');
    }
  };
  
  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    messages,
    conversations,
    currentConversation,
    setCurrentConversation,
    loading,
    apiKey,
    setApiKey: saveApiKey,
    selectedModel,
    setSelectedModel,
    extendedThinking,
    setExtendedThinking,
    sendMessage: sendChatMessage,
    createConversation,
    deleteConversation,
    streamingMessage,
    isStreaming,
    error,
    clearError
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;