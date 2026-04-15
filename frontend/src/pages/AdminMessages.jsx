import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { maskEmail } from '../utils/helpers';
import toast from 'react-hot-toast';

const avatarColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];
const getAvatarColor = (name) => avatarColors[name?.charCodeAt(0) % avatarColors.length] || '#6366f1';
const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

export default function AdminMessages() {
  const [sessions, setSessions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchHistory(selectedUser.id);
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => fetchHistory(selectedUser.id), 3000);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [selectedUser]);

  const fetchSessions = async () => {
    try { const res = await chatAPI.adminListSessions(); setSessions(res.data.sessions); }
    catch (err) { console.error('Failed to fetch sessions'); }
  };

  const fetchHistory = async (userId) => {
    try { const res = await chatAPI.adminFetchHistory(userId); setMessages(res.data.messages); }
    catch (err) { console.error('Failed to fetch history'); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedUser) return;
    setLoading(true);
    try {
      await chatAPI.adminSendMessage(selectedUser.id, input);
      setInput('');
      fetchHistory(selectedUser.id);
    } catch (err) { toast.error('Failed to send message'); }
    finally { setLoading(false); }
  };

  const filteredSessions = sessions.filter(s =>
    s.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 4px' }}>
          <span style={{ fontSize: '1.5rem' }}>💬</span> Citizen Inquiries
        </h1>
        <p style={{ color: 'var(--text-tertiary)', margin: 0, fontSize: '0.9rem' }}>
          Respond to citizen messages and manage conversations
        </p>
      </div>

      {/* Main Chat Container */}
      <div style={{
        flex: 1, display: 'flex', borderRadius: '16px', overflow: 'hidden',
        border: '1px solid var(--border-color)', background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>

        {/* ── Left: Sessions Panel ──────────────────────────────────── */}
        <div style={{
          width: '340px', minWidth: '340px', borderRight: '1px solid var(--border-color)',
          display: 'flex', flexDirection: 'column', background: 'white'
        }}>
          {/* Search */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>🔍</span>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px 10px 36px', borderRadius: '10px',
                  border: '1px solid var(--border-color)', fontSize: '0.88rem',
                  background: 'var(--bg-secondary)', outline: 'none', transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--primary-300)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>
          </div>

          {/* Sessions List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredSessions.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
                <p style={{ fontWeight: '500', color: 'var(--text-secondary)', margin: '0 0 4px', fontSize: '0.95rem' }}>No conversations</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', margin: 0 }}>
                  Messages from citizens will appear here
                </p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isSelected = selectedUser?.id === session.user_id;
                const color = getAvatarColor(session.user?.name);
                return (
                  <div
                    key={session.user_id}
                    onClick={() => setSelectedUser(session.user)}
                    style={{
                      padding: '14px 16px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)',
                      background: isSelected ? 'var(--primary-50)' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--primary-500)' : '3px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {/* Avatar */}
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '12px',
                        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '700', fontSize: '1rem', flexShrink: 0,
                        boxShadow: `0 2px 6px ${color}33`
                      }}>
                        {getInitial(session.user?.name)}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <span style={{ fontWeight: '600', fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                            {session.user?.name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {session.unread_count > 0 && !isSelected && (
                              <span style={{
                                padding: '2px 7px', borderRadius: '10px', background: '#ef4444',
                                color: 'white', fontSize: '0.7rem', fontWeight: 'bold', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                              }}>
                                {session.unread_count}
                              </span>
                            )}
                            {session.latest_message && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                                {formatTime(session.latest_message.created_at)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginBottom: '3px' }}>
                          {maskEmail(session.user?.email)}
                        </div>
                        <div style={{
                          fontSize: '0.82rem', color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                          {session.latest_message?.message || 'Chat started'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sessions Footer */}
          <div style={{
            padding: '12px 16px', borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)', fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'center'
          }}>
            {sessions.length} active conversation{sessions.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* ── Right: Chat Area ──────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div style={{
                padding: '14px 20px', background: 'white',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: `linear-gradient(135deg, ${getAvatarColor(selectedUser.name)}, ${getAvatarColor(selectedUser.name)}cc)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: '700', fontSize: '0.95rem'
                  }}>
                    {getInitial(selectedUser.name)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{selectedUser.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{maskEmail(selectedUser.email)}</div>
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '4px 12px', borderRadius: '20px',
                  background: '#ecfdf5', color: '#065f46', fontSize: '0.78rem', fontWeight: '600'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                  Active
                </div>
              </div>

              {/* Messages Area */}
              <div style={{
                flex: 1, padding: '24px', overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: '16px',
                background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)'
              }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    No messages yet. The conversation will appear here.
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isAdmin = msg.type === 'admin';
                  const showAvatar = i === 0 || messages[i - 1]?.type !== msg.type;
                  return (
                    <div key={msg.id} style={{
                      display: 'flex', flexDirection: isAdmin ? 'row-reverse' : 'row',
                      gap: '10px', alignItems: 'flex-end'
                    }}>
                      {/* Avatar */}
                      <div style={{ width: '30px', flexShrink: 0 }}>
                        {showAvatar && (
                          <div style={{
                            width: '30px', height: '30px', borderRadius: '8px',
                            background: isAdmin
                              ? 'linear-gradient(135deg, var(--primary-500), var(--primary-700))'
                              : `linear-gradient(135deg, ${getAvatarColor(selectedUser.name)}, ${getAvatarColor(selectedUser.name)}cc)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: '700', fontSize: '0.7rem'
                          }}>
                            {isAdmin ? '🛡️' : getInitial(selectedUser.name)}
                          </div>
                        )}
                      </div>

                      {/* Bubble */}
                      <div style={{ maxWidth: '65%' }}>
                        <div style={{
                          padding: '10px 16px',
                          borderRadius: isAdmin ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          background: isAdmin
                            ? 'linear-gradient(135deg, var(--primary-500), var(--primary-700))'
                            : 'white',
                          color: isAdmin ? 'white' : 'var(--text-primary)',
                          fontSize: '0.92rem', lineHeight: '1.5',
                          boxShadow: isAdmin ? '0 2px 8px rgba(13,71,161,0.2)' : '0 1px 3px rgba(0,0,0,0.06)',
                          border: isAdmin ? 'none' : '1px solid var(--border-color)'
                        }}>
                          {msg.message}
                        </div>
                        <div style={{
                          fontSize: '0.7rem', color: 'var(--text-tertiary)',
                          marginTop: '4px', textAlign: isAdmin ? 'right' : 'left', padding: '0 4px'
                        }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={{
                padding: '16px 20px', background: 'white',
                borderTop: '1px solid var(--border-color)'
              }}>
                <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type your reply..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    style={{
                      flex: 1, padding: '12px 20px', borderRadius: '24px',
                      border: '1px solid var(--border-color)', fontSize: '0.92rem',
                      outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
                      background: 'var(--bg-secondary)'
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--primary-300)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    style={{
                      padding: '12px 24px', borderRadius: '24px', border: 'none',
                      background: input.trim() ? 'linear-gradient(135deg, var(--primary-500), var(--primary-700))' : 'var(--bg-tertiary)',
                      color: input.trim() ? 'white' : 'var(--text-tertiary)',
                      fontWeight: '600', fontSize: '0.9rem', cursor: input.trim() ? 'pointer' : 'default',
                      transition: 'all 0.15s ease',
                      boxShadow: input.trim() ? '0 2px 8px rgba(13,71,161,0.25)' : 'none',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    Send
                    <span style={{ fontSize: '1rem' }}>↗</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State */
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '16px'
            }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '20px',
                background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem'
              }}>
                💬
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: '600', fontSize: '1.1rem', color: 'var(--text-primary)', margin: '0 0 6px' }}>
                  Select a conversation
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', margin: 0, maxWidth: '280px' }}>
                  Choose a citizen from the left panel to view their messages and reply
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
