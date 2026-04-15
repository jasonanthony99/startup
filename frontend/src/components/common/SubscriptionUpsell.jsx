import React, { useState } from 'react';
import { documentAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function SubscriptionUpsell() {
  const [showModal, setShowModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [plan, setPlan] = useState('monthly');
  const [paying, setPaying] = useState(false);

  const handleSubscribe = async () => {
    if (!paymentMethod) return;
    setPaying(true);
    try {
      await documentAPI.subscribe({ payment_method: paymentMethod, plan });
      toast.success('Subscription active! Features unlocked. Please refresh the page.');
      setShowModal(false);
      // Optional: automatically reload to re-fetch user context
      setTimeout(() => window.location.reload(), 1500); 
    } catch (err) {
      toast.error(err.response?.data?.message || 'Subscription failed.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <div className="animate-fade-in" style={{ padding: 'var(--space-2xl) 0', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
          <div style={{ display: 'inline-block', padding: '12px', background: 'rgba(255, 215, 0, 0.1)', borderRadius: '20px', marginBottom: 'var(--space-md)' }}>
            <span style={{ fontSize: '3rem' }}>⭐</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>Unlock Premium Features</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            The Document Requesting System is a premium feature. Upgrade your barangay's plan to modernize your services and boost resident satisfaction.
          </p>
        </div>

        <div className="grid grid-2" style={{ gap: 'var(--space-xl)', alignItems: 'center' }}>
          {/* Features List */}
          <div>
            <h2 style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--primary-500)' }}>✨</span> What's Included?
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {[
                { title: 'Online Document Requests', desc: 'Allow residents to request clearances, certifications, and IDs 24/7 without lining up at the hall.', icon: '📑' },
                { title: 'Simulated E-Payments', desc: 'Accept cashless payments natively via GCash and Maya to reduce cash handling.', icon: '💳' },
                { title: 'Automated Notifications', desc: 'Residents get instant email and in-app alerts when their documents are ready for pickup.', icon: '📧' },
                { title: 'Customizable Fees', desc: 'Set your own processing fees and requirements for different document types.', icon: '⚙️' },
                { title: 'Streamlined Dashboard', desc: 'Effortlessly track all requests, payments, and release statuses in one place.', icon: '📊' },
              ].map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start', padding: 'var(--space-md)', background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '1.5rem', background: 'var(--bg-tertiary)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <div>
                    <h4 style={{ marginBottom: '4px', fontSize: '1.1rem' }}>{f.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Card */}
          <div>
            <div className="card" style={{ 
              border: '2px solid var(--primary-500)', 
              boxShadow: '0 20px 40px rgba(13, 71, 161, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Ribbon */}
              <div style={{ 
                position: 'absolute', top: '20px', right: '-35px', background: 'var(--primary-500)', color: 'white', 
                padding: '6px 40px', transform: 'rotate(45deg)', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px' 
              }}>
                RECOMMENDED
              </div>

              <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0 var(--space-lg)', borderBottom: '1px solid var(--border-color)', marginBottom: 'var(--space-lg)' }}>
                <h3 style={{ color: 'var(--primary-600)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>Premium Plan</h3>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>₱</span>
                  <span style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{plan === 'monthly' ? '999' : '9,990'}</span>
                  <span style={{ color: 'var(--text-muted)' }}>/ {plan === 'monthly' ? 'month' : 'year'}</span>
                </div>
                
                {/* Plan Toggle */}
                <div style={{ display: 'inline-flex', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '50px', marginTop: 'var(--space-md)' }}>
                  <button onClick={() => setPlan('monthly')} style={{ padding: '6px 16px', borderRadius: '50px', border: 'none', background: plan === 'monthly' ? 'white' : 'transparent', boxShadow: plan === 'monthly' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                    Monthly
                  </button>
                  <button onClick={() => setPlan('yearly')} style={{ padding: '6px 16px', borderRadius: '50px', border: 'none', background: plan === 'yearly' ? 'white' : 'transparent', boxShadow: plan === 'yearly' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
                    Yearly <span style={{ color: 'var(--accent-green)', fontSize: '0.8rem' }}>(-16%)</span>
                  </button>
                </div>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-xl)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Unlimited Document Requests', 'Unlimited Resident Accounts', 'Priority Email Support', 'Seamless E-Wallet Integrations', 'Data Export functionality'].map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 800 }}>✓</span> {feature}
                  </li>
                ))}
              </ul>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '16px', fontSize: '1.2rem', fontWeight: 700, borderRadius: 'var(--radius-md)' }}
                onClick={() => setShowModal(true)}
              >
                Subscribe Now
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 'var(--space-md)' }}>
                Instant Activation. Secure Payment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>💳 Subscribe to Premium</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                You are purchasing the Premium {plan === 'monthly' ? 'Monthly' : 'Yearly'} Plan.
              </p>
              
              <div style={{ textAlign: 'center', margin: 'var(--space-lg) 0', fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--primary-500)' }}>
                ₱{plan === 'monthly' ? '999.00' : '9,990.00'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
                {[
                  { key: 'gcash', label: 'GCash', color: '#007bff', letter: 'G' },
                  { key: 'paymaya', label: 'Maya', color: '#019a01', letter: 'M' },
                ].map(m => (
                  <div key={m.key} onClick={() => setPaymentMethod(m.key)} style={{
                    padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                    border: `2px solid ${paymentMethod === m.key ? m.color : 'var(--border-color)'}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 800,
                    }}>{m.letter}</div>
                    <span style={{ fontWeight: 600 }}>{m.label}</span>
                    {paymentMethod === m.key && <span style={{ marginLeft: 'auto', color: m.color }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" disabled={paying} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={!paymentMethod || paying} onClick={handleSubscribe}>
                {paying ? 'Processing...' : `Pay ₱${plan === 'monthly' ? '999' : '9,990'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
