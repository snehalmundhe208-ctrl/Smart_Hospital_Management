import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Bot, User, Stethoscope, Activity, FileText } from 'lucide-react';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      text: 'Hello! I am NovaCare AI. How can I help you with your health today?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const generateAIResponse = (query) => {
    const q = query.toLowerCase();
    if (q.includes('headache') || q.includes('fever')) {
      return "Based on your symptoms, it's advisable to rest and stay hydrated. If the fever exceeds 102°F or lasts more than 2 days, please book an appointment with our General Physician.";
    } else if (q.includes('book') || q.includes('appointment')) {
      return "You can easily book an appointment by going to the 'Appointments' section in your dashboard. Select your preferred doctor and time slot!";
    } else if (q.includes('prescription') || q.includes('medicine')) {
      return "Always take medications exactly as prescribed by your doctor. If you're experiencing side effects, please contact your prescribing physician or the pharmacy through your dashboard.";
    } else if (q.includes('diet') || q.includes('health tip')) {
      return "Health Tip: A balanced diet rich in leafy greens, lean proteins, and complex carbohydrates, combined with at least 2 liters of water daily, significantly improves overall immunity and energy levels!";
    } else {
      const fallbacks = [
        "I'm currently a demo AI assistant! I can answer basic symptom queries, give health tips, or summarize generic reports. Can you try rephrasing your question?",
        "I'm here to help! As an AI, I'm best at handling specific symptom descriptions or questions about booking appointments.",
        "Could you provide a bit more detail? For complex medical advice, please consider booking an appointment with one of our doctors."
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  };

  const handleQuickAction = (text) => {
    const userMessage = { role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setTimeout(() => {
      const aiResponse = { role: 'assistant', text: generateAIResponse(text) };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const aiResponse = { role: 'assistant', text: generateAIResponse(userMessage.text) };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`relative p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center transition-all bg-gradient-to-r from-teal-500 to-indigo-600 text-white pointer-events-auto border border-white/20 ${isOpen ? 'scale-0 opacity-0 absolute' : 'scale-100 opacity-100'}`}
      >
        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-75"></div>
        <Sparkles size={28} className="animate-pulse relative z-10" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-96 h-[34rem] bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col border border-slate-100 overflow-hidden pointer-events-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 via-teal-500 to-indigo-600 p-5 flex justify-between items-center text-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              <div className="flex items-center space-x-4 relative z-10">
                <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
                  <Bot size={26} className="text-white drop-shadow-md" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl tracking-tight leading-tight drop-shadow-sm">NovaCare AI</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <p className="text-xs text-teal-50 font-medium">Online & ready</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-all relative z-10 hover:rotate-90">
                <X size={20} />
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100 p-3 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
               <button onClick={() => handleQuickAction('Check my symptoms')} className="flex items-center text-[11px] font-bold bg-white border border-slate-200 rounded-full px-4 py-2 whitespace-nowrap hover:border-teal-300 hover:shadow-sm hover:text-teal-700 transition-all text-slate-600"><Stethoscope size={14} className="mr-1.5 text-teal-500"/> Check Symptoms</button>
               <button onClick={() => handleQuickAction('Give me a health tip')} className="flex items-center text-[11px] font-bold bg-white border border-slate-200 rounded-full px-4 py-2 whitespace-nowrap hover:border-amber-300 hover:shadow-sm hover:text-amber-700 transition-all text-slate-600"><Activity size={14} className="mr-1.5 text-amber-500"/> Health Tips</button>
               <button onClick={() => handleQuickAction('Summarize report')} className="flex items-center text-[11px] font-bold bg-white border border-slate-200 rounded-full px-4 py-2 whitespace-nowrap hover:border-indigo-300 hover:shadow-sm hover:text-indigo-700 transition-all text-slate-600"><FileText size={14} className="mr-1.5 text-indigo-500"/> Summarize Report</button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/30">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600 ml-3' : 'bg-gradient-to-tr from-teal-500 to-teal-400 text-white mr-3'}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-3.5 text-sm shadow-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' 
                        : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-sm font-medium'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="flex flex-row max-w-[80%]">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-tr from-teal-500 to-teal-400 text-white mr-3 shadow-sm">
                      <Bot size={16} />
                    </div>
                    <div className="px-4 py-4 bg-white border border-slate-100 rounded-2xl rounded-tl-sm flex space-x-1.5 items-center shadow-sm">
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 shrink-0">
              <div className="flex items-center bg-slate-50 rounded-2xl border border-slate-200 px-2 py-2 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-400 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask NovaCare AI..."
                  className="flex-1 bg-transparent outline-none text-sm px-3 text-slate-700 placeholder:text-slate-400"
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || isTyping}
                  className="p-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-sm flex items-center justify-center hover:scale-105 active:scale-95"
                >
                  <Send size={16} className={input.trim() && !isTyping ? "translate-x-0.5 -translate-y-0.5" : ""} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIAssistant;
