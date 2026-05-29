import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Send, User, Cpu, Copy, Check, ChevronDown, 
  ChevronUp, Search, Info, MessageSquare, AlertCircle 
} from 'lucide-react';

const Chatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([
    "What security protocols are standard?",
    "Can you explain the partner referral guidelines?",
    "What is the policy for password rotations?",
    "How does database indexing work?"
  ]);
  
  // Search within chat state
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Accordion track state for each message index
  const [expandedSources, setExpandedSources] = useState({});

  // Clipboard copy state tracker
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom of the conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history from DB on startup
  const fetchChatHistory = async () => {
    try {
      const res = await api.get('/chatbot/history');
      if (res.data && res.data.length > 0) {
        // Map history items
        const formattedHistory = res.data.reverse().map(item => ({
          question: item.question,
          response: item.response,
          sources: item.retrievedSources || [],
          timestamp: new Date(item.timestamp)
        }));
        
        // Flatten into linear messages for chat list
        const flattened = [];
        formattedHistory.forEach(h => {
          flattened.push({ sender: 'user', text: h.question, timestamp: h.timestamp });
          flattened.push({ 
            sender: 'bot', 
            text: h.response, 
            sources: h.sources,
            timestamp: h.timestamp 
          });
        });
        setMessages(flattened);
      } else {
        // If empty, add a default welcoming message
        setMessages([
          { 
            sender: 'bot', 
            text: "Hello! I am your Enterprise Domain RAG Assistant. Ask me anything about SaaS security, databases, deployment pipelines, partner referrals, or HR onboarding documents, and I'll retrieve exact source answers!",
            sources: [],
            timestamp: new Date()
          }
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch conversation logs", err);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text: messageText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/ask', { question: messageText });
      const { answer, sources, suggestedQuestions: responseSuggestions } = res.data;
      
      const botMsg = { 
        sender: 'bot', 
        text: answer, 
        sources: sources || [],
        timestamp: new Date() 
      };
      
      setMessages(prev => [...prev, botMsg]);
      
      // Update follow-up question chips
      if (responseSuggestions && responseSuggestions.length > 0) {
        setSuggestedQuestions(responseSuggestions);
      }
    } catch (err) {
      console.error(err);
      const errorMsg = {
        sender: 'bot',
        text: "Sorry, I encountered an internal server error processing your request. Please ensure the backend and MongoDB database are actively running.",
        sources: [],
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  const toggleAccordion = (index) => {
    setExpandedSources(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Filter messages dynamically based on chatSearchQuery
  const filteredMessages = messages.filter(msg => {
    if (!chatSearchQuery) return true;
    return msg.text.toLowerCase().includes(chatSearchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] max-h-[850px] glass-panel border border-slate-200/50 dark:border-slate-800/40 rounded-3xl overflow-hidden shadow-2xl relative fade-in">
      
      {/* Header Controls (Title, Search inside Chat) */}
      <div className="px-6 py-4 bg-slate-100/50 dark:bg-slate-900/60 border-b border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-brand-500" />
          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Conversation Room</span>
        </div>

        {/* Inside Chat Search */}
        <div className="relative max-w-xs w-full flex items-center">
          <input
            type="text"
            placeholder="Search within this chat..."
            value={chatSearchQuery}
            onChange={(e) => setChatSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-all dark:text-white"
          />
          <Search size={14} className="absolute left-3 text-slate-400" />
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {filteredMessages.map((msg, idx) => {
          const isBot = msg.sender === 'bot';
          const hasSources = msg.sources && msg.sources.length > 0;
          const isAccordionOpen = expandedSources[idx];

          return (
            <div 
              key={idx} 
              className={`flex items-start gap-4 ${isBot ? 'justify-start' : 'justify-end'} animate-fade-in`}
            >
              {/* Avatar for Bot */}
              {isBot && (
                <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/20">
                  <Cpu size={18} className="animate-pulse" style={{ animationDuration: '4s' }} />
                </div>
              )}

              {/* Chat Bubble Box */}
              <div className={`max-w-[80%] flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                {/* User/Bot label */}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                  {isBot ? 'RAG Assistant' : user?.name || 'User'}
                </span>

                <div 
                  className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed text-left border relative group
                    ${isBot 
                      ? msg.isError 
                        ? 'bg-red-500/5 border-red-500/20 text-red-700 dark:text-red-400' 
                        : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/40 text-slate-800 dark:text-slate-200' 
                      : 'bg-brand-500 border-brand-500 text-white shadow-brand-500/10'
                    }
                  `}
                >
                  {/* Message content */}
                  <div className="whitespace-pre-line font-medium">{msg.text}</div>

                  {/* Clipboard Copy Button (Bot messages only) */}
                  {isBot && (
                    <button
                      onClick={() => copyToClipboard(msg.text, idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Copy Answer"
                    >
                      {copiedIndex === idx ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>

                {/* Collapsible Source attributions accordion */}
                {isBot && hasSources && (
                  <div className="w-full mt-2 border border-slate-200/50 dark:border-slate-800/40 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
                    <button
                      onClick={() => toggleAccordion(idx)}
                      className="w-full px-3.5 py-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Info size={12} className="text-brand-500" />
                        Referenced Knowledge Base Sources ({msg.sources.length})
                      </span>
                      {isAccordionOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    
                    {isAccordionOpen && (
                      <div className="px-3.5 pb-3 pt-1 space-y-2 border-t border-slate-200/50 dark:border-slate-800/30 divide-y divide-slate-100 dark:divide-slate-800/30 animate-fade-in text-left">
                        {msg.sources.map((src, sIdx) => (
                          <div key={sIdx} className={`${sIdx > 0 ? 'pt-2' : ''} text-xs`}>
                            <div className="flex items-center justify-between gap-2 font-bold mb-1">
                              <span className="text-slate-700 dark:text-slate-300 truncate">{src.filename}</span>
                              <span className="text-brand-600 dark:text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded text-[10px]">
                                {parseInt(src.score * 100)}% Match
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/20 dark:border-slate-800/20 font-serif leading-relaxed">
                              "{src.snippet}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Avatar for User */}
              {!isBot && (
                <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-inner">
                  <User size={18} />
                </div>
              )}
            </div>
          );
        })}

        {/* Dynamic Loading typing animation indicator */}
        {loading && (
          <div className="flex items-start gap-4 justify-start animate-fade-in">
            <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-brand-500 text-white shadow-md shadow-brand-500/20">
              <Cpu size={18} className="animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">RAG Assistant</span>
              <div className="flex items-center gap-1.5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 shadow-sm">
                <div className="h-2 w-2 rounded-full bg-brand-500 typing-dot"></div>
                <div className="h-2 w-2 rounded-full bg-brand-500 typing-dot"></div>
                <div className="h-2 w-2 rounded-full bg-brand-500 typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Follow-up Questions panel */}
      {suggestedQuestions.length > 0 && !loading && (
        <div className="px-6 py-2.5 bg-slate-50/50 dark:bg-slate-900/20 border-t border-slate-200/30 dark:border-slate-800/20 flex flex-wrap gap-2 text-left">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider self-center mr-1">Suggestions:</span>
          {suggestedQuestions.map((q, qIdx) => (
            <button
              key={qIdx}
              onClick={() => handleSendMessage(q)}
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-white hover:bg-brand-500 dark:hover:bg-brand-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-xl transition-all shadow-sm active:scale-95"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Form Box */}
      <div className="p-4 bg-slate-100/50 dark:bg-slate-900/60 border-t border-slate-200/50 dark:border-slate-800/40 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={loading}
          placeholder="Ask a question about server security, password rotations, rate limits, or microservice pipelines..."
          className="flex-1 px-5 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-all font-medium text-sm dark:text-white placeholder-slate-400"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !input.trim()}
          className="px-5 py-3.5 bg-brand-500 hover:bg-brand-600 active:scale-95 disabled:opacity-40 disabled:scale-100 text-white rounded-2xl font-bold transition-all shadow-md shadow-brand-500/10 flex items-center justify-center shrink-0"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default Chatbot;
