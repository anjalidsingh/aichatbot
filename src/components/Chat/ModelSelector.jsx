/* src/components/Chat/ModelSelector.jsx */
import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { modelConstants } from '../../services/openRouterService';
import '../../styles/Chat.css';

const ModelSelector = () => {
  const { selectedModel, setSelectedModel, extendedThinking, setExtendedThinking } = useChat();
  const [activeCategory, setActiveCategory] = useState('general');
  
  const handleModelSelect = (modelId) => {
    setSelectedModel(modelId);
  };
  
  // Get model capabilities badges
  const getModelBadges = (modelId) => {
    const badges = [];
    
    // Just a simple example - you could enhance this based on actual model data
    if (modelId.includes('vl')) {
      badges.push('Vision');
    }
    if (modelConstants.modelSpecializations.coding.includes(modelId)) {
      badges.push('Code');
    }
    
    return badges;
  };
  
  return (
    <div className="model-selector">
      <h3 className="selector-title">
        <span className="selector-title-icon">🤖</span>
        Select AI Model
      </h3>
      
      {/* Category tabs */}
      <div className="category-tabs">
        {Object.keys(modelConstants.modelSpecializations).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`category-tab ${activeCategory === category ? 'category-tab-active' : ''}`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>
      
      {/* Models list */}
      <div className="models-list">
        {modelConstants.modelSpecializations[activeCategory].map((modelId) => {
          const modelData = modelConstants.modelInfo[modelId] || { 
            name: modelId.split('/').pop().replace(':free', ''),
            description: 'Free tier model'
          };
          const badges = getModelBadges(modelId);
          
          return (
            <div
              key={modelId}
              onClick={() => handleModelSelect(modelId)}
              className={`model-card ${selectedModel === modelId ? 'model-card-selected' : ''}`}
            >
              <div className="model-name">
                {modelData.name}
                {badges.length > 0 && (
                  <span className="model-badge">{badges[0]}</span>
                )}
              </div>
              {modelData.description && (
                <div className="model-description">{modelData.description}</div>
              )}
              <div className="model-meta">
                <span className="model-meta-item">
                  <span>Free Tier</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Extended thinking toggle */}
      <div className="thinking-toggle">
        <div className="toggle-header">
          <label className="toggle-label" htmlFor="thinking-toggle">
            <span>Extended Thinking</span>
            <div className="toggle-switch">
              <input
                id="thinking-toggle"
                type="checkbox"
                checked={extendedThinking}
                onChange={() => setExtendedThinking(!extendedThinking)}
              />
              <span className="toggle-slider"></span>
            </div>
          </label>
        </div>
        <p className="toggle-description">
          Enables deeper reasoning for supported models. This may increase response time but can improve the quality of complex answers.
        </p>
      </div>
    </div>
  );
};

export default ModelSelector;