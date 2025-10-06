import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { ChatMessage } from '../types';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your NeoCure AI assistant. How can I help you today?',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');

    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(inputMessage),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('side effect') || lowerQuery.includes('allerg')) {
      return 'I can help you understand medication side effects and allergies. Please check your Risk Dashboard for detailed assessments, or describe your symptoms and I\'ll provide relevant information.';
    } else if (lowerQuery.includes('reminder')) {
      return 'You can set up medication reminders in the Medicine Reminders section. Would you like me to guide you through setting one up?';
    } else if (lowerQuery.includes('alternative') || lowerQuery.includes('replace')) {
      return 'Based on your risk assessment, I can suggest safer alternative medications. Check the Medication Alternatives section for personalized recommendations.';
    } else {
      return 'I\'m here to assist with medication information, allergy detection, reminders, and health guidance. What would you like to know more about?';
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full gradient-blue-purple glow-blue flex items-center justify-center transition-all hover:scale-110 z-50"
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-8 right-8 w-96 h-[32rem] glass rounded-3xl glow-soft flex flex-col z-50">
          <div className="gradient-blue-purple p-4 rounded-t-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-white" />
              <div>
                <h3 className="font-semibold text-white">NeoCure AI Assistant</h3>
                <p className="text-xs text-white/80">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'gradient-blue-purple text-white'
                      : 'bg-white/50 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 rounded-full bg-white/50 border border-gray-200/50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={handleSendMessage}
                className="w-10 h-10 rounded-full gradient-blue-purple flex items-center justify-center hover:scale-105 transition"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
