/* src/services/openRouterService.js */
/**
 * Service to handle communication with OpenRouter API
 */
export const modelConstants = {
    // Expert models for different tasks
    expertModels: {
      general: "meta-llama/llama-4-maverick:free",
      coding: "agentica-org/deepcoder-14b-preview:free",
      creative: "qwen/qwq-32b:free",
      analyst: "deepseek/deepseek-r1:free",
      vision: "qwen/qwen2.5-vl-72b-instruct:free",
      science: "allenai/molmo-7b-d:free"
    },
    
    // Model categories and specializations for auto-selection
    modelSpecializations: {
      general: [
        "meta-llama/llama-4-maverick:free", 
        "nvidia/llama-3.3-nemotron-super-49b-v1:free",
        "shisa-ai/shisa-v2-llama3.3-70b:free",
        "google/gemini-2.5-pro-exp-03-25"
      ],
      coding: [
        "agentica-org/deepcoder-14b-preview:free", 
        "open-r1/olympiccoder-32b:free", 
        "open-r1/olympiccoder-7b:free",
        "deepseek/deepseek-r1:free"
      ],
      vision: [
        "qwen/qwen2.5-vl-72b-instruct:free", 
        "moonshotai/kimi-vl-a3b-thinking:free", 
        "qwen/qwen2.5-vl-32b-instruct:free",
        "qwen/qwen2.5-vl-3b-instruct:free",
        "bytedance-research/ui-tars-72b:free",
        "opengvlab/internvl3-14b:free",
        "google/gemma-3-27b-it:free",
        "allenai/molmo-7b-d:free"
      ],
      creative: [
        "qwen/qwq-32b:free", 
        "arliai/qwq-32b-arliai-rpr-v1:free",
        "featherless/qwerky-72b:free",
        "cognitivecomputations/dolphin3.0-mistral-24b:free"
      ],
      reasoning: [
        "deepseek/deepseek-r1:free", 
        "nvidia/llama-3.1-nemotron-ultra-253b-v1:free",
        "deepseek/deepseek-r1-zero:free",
        "google/gemini-2.0-flash-thinking-exp:free"
      ],
      science: [
        "allenai/molmo-7b-d:free", 
        "google/gemma-3-27b-it:free",
        "deepseek/deepseek-chat-v3-0324:free"
      ],
      fast: [
        "google/gemma-3-4b-it:free", 
        "nvidia/llama-3.1-nemotron-nano-8b-v1:free",
        "rekaai/reka-flash-3:free"
      ]
    },
    
    // Model info for display
    modelInfo: {
      "meta-llama/llama-4-maverick:free": {
        name: "Llama 4 Maverick",
        description: "Meta's powerful Llama 4 model with excellent general capabilities.",
        strengths: "Great all-around performance, reasoning, balanced responses."
      },
      "qwen/qwen2.5-vl-72b-instruct:free": {
        name: "Qwen VL 72B",
        description: "Powerful vision-language model that can analyze images and text.",
        strengths: "Image analysis, detailed descriptions, multimodal understanding."
      },
      "deepseek/deepseek-r1:free": {
        name: "DeepSeek R1",
        description: "Research-focused model with strong reasoning capabilities.",
        strengths: "Math, reasoning, detailed explanations, code generation."
      },
      "agentica-org/deepcoder-14b-preview:free": {
        name: "DeepCoder 14B",
        description: "Specialized coding assistant model.",
        strengths: "Code generation, debugging, software development assistance."
      },
      "shisa-ai/shisa-v2-llama3.3-70b:free": {
        name: "Shisa v2 Llama 3.3 70B",
        description: "High-performance Llama-based model with excellent reasoning.",
        strengths: "Long-context reasoning, coherent responses, creative tasks."
      },
      "nvidia/llama-3.3-nemotron-super-49b-v1:free": {
        name: "Nemotron Super 49B",
        description: "NVIDIA's optimized variant of the Llama architecture.",
        strengths: "Balanced capabilities, fast responses, well-tuned outputs."
      },
      "open-r1/olympiccoder-32b:free": {
        name: "OlympicCoder 32B",
        description: "Elite coding model designed for complex programming tasks.",
        strengths: "High-quality code generation, debugging, problem-solving."
      },
      "moonshotai/kimi-vl-a3b-thinking:free": {
        name: "Kimi VL A3B Thinking",
        description: "Vision-language model with reasoning capabilities.",
        strengths: "Detailed image analysis, visual reasoning, precise descriptions."
      }
    }
  };
  
  // OpenRouter API service
  const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
  
  export const sendMessage = async (apiKey, model, messages, extendedThinking = false) => {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin, // Required by OpenRouter
          "X-Title": "AI Free Chat" // Your app name
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
          stream: true, // Enable streaming for more Claude-like experience
          thinking: extendedThinking // For models that support thinking/extended thinking
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Error connecting to OpenRouter API");
      }
  
      return response;
    } catch (error) {
      console.error("OpenRouter API error:", error);
      throw error;
    }
  };