import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState('bot'); // 'bot' or 'live'
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);
  const unreadPollingRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load history if switching to live or reopening
  useEffect(() => {
    if (isOpen) {
      loadHistory();
      if (chatMode === 'live') {
        // Start polling for history in live mode
        pollingRef.current = setInterval(loadHistory, 3000);
      }
    }
    
    if (!isOpen) {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [chatMode, isOpen]);

  // Poll for unread count when window is CLOSED
  useEffect(() => {
    if (!isOpen) {
      const fetchUnreadCount = async () => {
        try {
          const res = await chatAPI.getUnreadCount();
          setUnreadCount(res.data.unread_count);
        } catch (err) {
          console.error('Failed to fetch unread count');
        }
      };

      fetchUnreadCount();
      unreadPollingRef.current = setInterval(fetchUnreadCount, 10000); // Check every 10 seconds
    } else {
      if (unreadPollingRef.current) clearInterval(unreadPollingRef.current);
      setUnreadCount(0);
    }

    return () => { if (unreadPollingRef.current) clearInterval(unreadPollingRef.current); };
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      const res = await chatAPI.fetchHistory();
      setMessages(res.data.messages.map(m => ({
        id: m.id,
        text: m.message,
        sender: m.type === 'citizen' ? 'user' : 'bot',
        timestamp: m.created_at
      })));
    } catch (err) {
      console.error('Failed to load chat history');
    }
  };

  useEffect(() => {
    // Initial greeting if no messages yet
    if (messages.length === 0 && chatMode === 'bot') {
      setMessages([
        {
          id: 1,
          text: `Hi ${user?.name}! I'm your Barangay Virtual Assistant. How can I help you today?`,
          sender: 'bot',
          suggestions: ['Talk with Barangay Admin', 'Track my application', 'How to apply?']
        }
      ]);
    }
  }, [user, messages.length, chatMode]);

  const handleSend = async (text) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    // Special case: Switching to Admin
    if (messageText === 'Talk with Barangay Admin') {
      setChatMode('live');
      setMessages(prev => [...prev, { id: Date.now(), text: messageText, sender: 'user' }]);
      
      // Persist the request to DB so admin sees it immediately
      try {
        await chatAPI.sendLive("User requested to talk to an admin.");
      } catch (err) {
        console.error("Failed to notify admin");
      }

      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          text: "Connecting you to a Barangay Admin... You can now type your message directly below. Our staff will get back to you shortly.", 
          sender: 'bot' 
        }]);
      }, 500);
      setInput('');
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    if (chatMode === 'bot') {
      setIsTyping(true);
      try {
        const res = await chatAPI.sendBot(messageText);
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            text: res.data.response,
            sender: 'bot',
            suggestions: res.data.suggestions || []
          };
          setMessages(prev => [...prev, botMessage]);
          setIsTyping(false);
          setLoading(false);
        }, 800);
      } catch (error) {
        setIsTyping(false);
        setLoading(false);
      }
    } else {
      // Live Mode
      try {
        await chatAPI.sendLive(messageText);
        loadHistory(); // Refresh instantly
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    }
  };

  return (
    <>
        {/* Floating Toggle Button */}
      <button 
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '30px',
          background: 'var(--primary-600)',
          color: 'white',
          border: 'none',
          boxShadow: 'var(--shadow-lg)',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          transition: 'transform 0.2s, background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {unreadCount > 0 && !isOpen && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 1001
          }}>
            {unreadCount}
          </span>
        )}
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="chatbot-window animate-slide-up"
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '380px',
            height: '520px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-2xl)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: 'var(--space-md) var(--space-lg)',
            background: 'var(--primary-600)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between', // Add space between info and close button
            gap: 'var(--space-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80' }}></div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Barangay Assistant</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Online • Answers instantly</div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            padding: 'var(--space-lg)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
            background: '#f8fafc'
          }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                gap: 'var(--space-xs)'
              }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.sender === 'user' ? 'var(--primary-600)' : 'white',
                  color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  whiteSpace: 'pre-line'
                }}>
                  {msg.text}
                </div>
                
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 'var(--space-xs)',
                    marginTop: 'var(--space-xs)' 
                  }}>
                    {msg.suggestions.map((s, i) => (
                      <button 
                        key={i}
                        onClick={() => handleSend(s)}
                        className="btn btn-ghost"
                        style={{ 
                          fontSize: '0.8rem', 
                          padding: '4px 12px', 
                          borderRadius: '20px',
                          background: 'white',
                          border: '1px solid var(--primary-200)',
                          color: 'var(--primary-700)'
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', gap: '4px', padding: '12px', background: 'white', borderRadius: '16px', width: '60px' }}>
                <div className="dot" style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out' }}></div>
                <div className="dot" style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.2s' }}></div>
                <div className="dot" style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.4s' }}></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{
              padding: 'var(--space-md)',
              background: 'white',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: 'var(--space-sm)'
            }}
          >
            <input 
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: '#f1f5f9',
                padding: '10px 16px',
                borderRadius: '24px',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !input.trim()}
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ➔
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
