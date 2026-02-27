import { GoogleGenerativeAI } from "@google/generative-ai";

// AI Financial Advisor & Chatbot Service
// Uses Gemini API for financial advice and conversational AI

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
if (!API_KEY) {
  console.warn("VITE_GEMINI_API_KEY is missing from environment variables.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface FinancialAdvice {
  topic: string;
  recommendation: string;
  reasoning: string[];
  confidence: number;
  relatedArticles?: string[];
}

export class AIService {
  private static readonly CHAT_STORAGE_KEY = 'wealthnexus_chat_history';

  static async sendMessage(message: string): Promise<ChatMessage> {
    const responseContent = await this.generateResponse(message);
    
    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString(),
    };
    
    // Save to history
    this.saveChatMessage({
      id: `msg_${Date.now() - 1}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });
    this.saveChatMessage(assistantMessage);
    
    return assistantMessage;
  }

  static getChatHistory(): ChatMessage[] {
    const data = localStorage.getItem(this.CHAT_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static clearChatHistory(): void {
    localStorage.removeItem(this.CHAT_STORAGE_KEY);
  }

  private static saveChatMessage(message: ChatMessage): void {
    const history = this.getChatHistory();
    history.push(message);
    
    // Keep only last 100 messages
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    localStorage.setItem(this.CHAT_STORAGE_KEY, JSON.stringify(history));
  }

  private static async generateResponse(message: string): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      const prompt = `You are a helpful and expert AI Financial Advisor. Respond to the user's query thoughtfully and accurately. Maintain a professional yet approachable tone. 
      Use clear formatting and lists if applicable. Add standard financial disclaimers when offering direct advice or predictions.\n\nUser: ${message}`;
      
      const result = await model.generateContent(prompt);
      const output = result.response.text();
      
      return output || "I apologize, but I could not formulate a response at this time. Could you please rephrase your query?";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "I'm currently experiencing communication issues and cannot reach the advisory server. Please try again later. If the problem persists, please check your network connection or the provided API key.";
    }
  }

  static async getFinancialAdvice(context: {
    portfolio?: any;
    riskTolerance?: string;
    goals?: string[];
  }): Promise<FinancialAdvice> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Generate a JSON object representing personalized financial advice based on the following context:
      Risk Tolerance: ${context.riskTolerance || "Moderate"}
      Goals: ${context.goals?.join(", ") || "Growth and wealth preservation"}
      
      The required JSON structure is:
      {
        "topic": "String (e.g., Portfolio Optimization)",
        "recommendation": "String (short specific action)",
        "reasoning": ["String", "String", "String"],
        "confidence": Number (1-100),
        "relatedArticles": ["String", "String"]
      }
      
      Only output valid JSON without any markdown blocks around it.`;
      
      const result = await model.generateContent(prompt);
      let output = result.response.text().trim();
      
      // Clean up markdown quotes if Gemini output them
      if (output.startsWith("\`\`\`json")) {
        output = output.replace(/^\`\`\`json/m, "").replace(/\`\`\`$/m, "").trim();
      }
      
      const parsed = JSON.parse(output);
      return {
        topic: parsed.topic || "Investment Review",
        recommendation: parsed.recommendation || "Review your current holdings against market conditions.",
        reasoning: parsed.reasoning || ["Market dynamics have shifted", "Ensuring alignment with goals"],
        confidence: parsed.confidence || 75,
        relatedArticles: parsed.relatedArticles || []
      };
    } catch (e) {
      console.error("Failed to generate financial advice via API", e);
      return {
        topic: 'Portfolio Status check',
        recommendation: 'Unable to perform deep analysis at this time.',
        reasoning: [
          'Service temporarily unavailable',
        ],
        confidence: 0,
        relatedArticles: [],
      };
    }
  }

  static async analyzeStockSentiment(symbol: string): Promise<{
    sentiment: 'bullish' | 'bearish' | 'neutral';
    score: number;
    signals: string[];
  }> {
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Analyze the current market sentiment for the stock symbol: ${symbol}. 
      Give a JSON response in the exact format:
      {
        "sentiment": "bullish" | "bearish" | "neutral",
        "score": React Number 0 to 100,
        "signals": ["String reasoning 1", "String reasoning 2", "String reasoning 3"]
      }
      Only respond with the valid JSON, no markdown blocks.`;
      
      const result = await model.generateContent(prompt);
      let output = result.response.text().trim();
      
      // Clean up markdown quotes if Gemini output them
      if (output.startsWith("\`\`\`json")) {
        output = output.replace(/^\`\`\`json/m, "").replace(/\`\`\`$/m, "").trim();
      }
      
      const parsed = JSON.parse(output);
      
      return {
        sentiment: parsed.sentiment as 'bullish' | 'bearish' | 'neutral',
        score: parsed.score,
        signals: parsed.signals
      };
      
    } catch (e) {
      console.error("Failed to fetch sentiment analysis from API", e);
      return {
        sentiment: 'neutral',
        score: 50,
        signals: [ 'Could not retrieve data' ],
      };
    }
  }
}
