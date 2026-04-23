import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

// Initialize the Gemini API client
// Note: Normally, API keys are sensitive, but for client-side chat, AI Studio provides it via process.env
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am your assistant. Ask me anything about the Student Information System.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      // Build context for the AI
      const systemContext = `You are a helpful AI assistant integrated into a Campus Student Identity Inventory and Filtering System. 
      You help students and admins use the dashboard. 
      The current logged-in user is: ${user ? `${user.username || user.email} (Role: ${user.role})` : 'Not logged in'}.
      Keep answers concise, friendly, and helpful.`;

      // Convert history to format needed by Gemini
      const historyStr = messages.map(m => `${m.role === 'model' ? 'Assistant' : 'User'}: ${m.text}`).join('\n');
      
      const contents = `${systemContext}\n\nChat History:\n${historyStr}\n\nUser: ${userText}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
      });

      const replyText = response.text || 'I am sorry, I encountered an error formulating my response.';
      setMessages(prev => [...prev, { role: 'model', text: replyText }]);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'I am sorry, I encountered a connection error. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-emerald-600 text-white rounded-full shadow-xl hover:bg-emerald-700 transition-transform ${isOpen ? 'scale-0' : 'scale-100'} z-50`}
        aria-label="Open Chat"
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-75 opacity-0 pointer-events-none'} z-50`}
        style={{ height: '500px', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="bg-emerald-600 p-4 text-white flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-emerald-300 shadow-sm flex-shrink-0 bg-white">
              <img 
                 src="https://api.dicebear.com/7.x/bottts/svg?seed=BU-Bot&backgroundColor=transparent" 
                 alt="AI Avatar" 
                 className="w-full h-full object-cover" 
                 referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">SYSTEM AI Assistant</h3>
              <p className="text-[10px] text-emerald-100/90 font-medium tracking-wide">Always Online</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-emerald-100 hover:text-white transition-colors bg-emerald-700/50 p-1.5 rounded-full">
            <X size={16} />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 flex flex-col">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex items-end space-x-2 max-w-[90%] ${message.role === 'user' ? 'self-end justify-end' : 'self-start'}`}
            >
              {message.role === 'model' && (
                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-white shadow-sm border border-emerald-100">
                  <img 
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=BU-Bot&backgroundColor=transparent" 
                    alt="AI" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              
              <div 
                className={`p-3 rounded-2xl text-sm shadow-sm ${
                  message.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none markdown-body prose prose-sm prose-emerald'
                }`}
              >
                {message.role === 'user' ? (
                  message.text
                ) : (
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex self-start items-end space-x-2">
              <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-white shadow-sm border border-emerald-100">
                  <img 
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=BU-Bot&backgroundColor=transparent"  
                    alt="AI" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm">
                <Loader2 size={16} className="text-emerald-600 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-gray-100 text-sm px-4 py-2.5 rounded-full outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all border border-transparent focus:border-emerald-500 focus:bg-white"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
