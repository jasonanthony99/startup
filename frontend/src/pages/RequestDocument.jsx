import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RequestDocument() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState([]); // multi-select
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [createdRequests, setCreatedRequests] = useState([]); // array of created requests
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Return locked screen if tenant is not subscribed
  if (!user?.tenant?.is_subscribed) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-md)' }}>🔒</div>
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>Feature Locked</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', lineHeight: 1.6 }}>
          The Barangay Document Requesting feature is currently locked because your barangay is not subscribed to the premium plan. Please contact your barangay hall for more information.
        </p>
      </div>
    );
  }

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await documentAPI.types();
      setTypes(res.data.document_types || []);
    } catch {
      toast.error('Failed to load document types.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (type) => {
    setSelectedTypes(prev => {
      const exists = prev.find(t => t.id === type.id);
      if (exists) return prev.filter(t => t.id !== type.id);
      return [...prev, type];
    });
  };

  const isSelected = (id) => selectedTypes.some(t => t.id === id);

  const totalFee = selectedTypes.reduce((sum, t) => sum + parseFloat(t.fee || 0), 0);

  const handleSubmit = async () => {
    if (selectedTypes.length === 0) return;
    setSubmitting(true);
    try {
      // Submit each request individually
      const results = [];
      for (const type of selectedTypes) {
        const res = await documentAPI.create({
          document_type_id: type.id,
          purpose,
        });
        results.push(res.data.document_request);
      }

      const unpaid = results.filter(r => r.amount > 0 && r.payment_status === 'unpaid');
      if (unpaid.length > 0) {
        setCreatedRequests(unpaid);
        setShowCheckout(true);
      } else {
        toast.success(`${results.length} document(s) submitted! No payment required.`);
        navigate('/citizen/documents');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentMethod || createdRequests.length === 0) return;
    setPaying(true);
    try {
      for (const req of createdRequests) {
        await documentAPI.simulatePayment(req.id, { payment_method: paymentMethod });
      }
      setPaymentSuccess(true);
      toast.success('All payments successful!');
      setTimeout(() => navigate('/citizen/documents'), 2000);
    } catch (err) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  };

  const checkoutTotal = createdRequests.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

  if (loading) return <div className="loader"><div className="loader-spinner" /></div>;

  // ─── Payment Success Screen ───
  if (paymentSuccess) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-lg)' }}>🎉</div>
        <h2 style={{ marginBottom: 'var(--space-md)' }}>Payment Confirmed!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          Your {createdRequests.length} document(s) are now being processed. You'll be notified when they're ready for pickup.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
          {createdRequests.map(r => (
            <code key={r.id} style={{ color: 'var(--primary-500)', fontSize: 'var(--font-size-sm)' }}>{r.reference_id}</code>
          ))}
        </div>
      </div>
    );
  }

  // ─── Checkout ───
  if (showCheckout && createdRequests.length > 0) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h1>💳 Checkout</h1>
            <p className="page-header-subtitle">Complete payment for {createdRequests.length} document(s)</p>
          </div>
          <button className="btn btn-secondary" onClick={() => { setShowCheckout(false); navigate('/citizen/documents'); }}>
            Pay Later
          </button>
        </div>

        <div className="grid grid-2" style={{ maxWidth: '900px' }}>
          {/* Order Summary */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📄 Order Summary ({createdRequests.length} item{createdRequests.length > 1 ? 's' : ''})
            </h3>
            {createdRequests.map((req, i) => (
              <div key={req.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--space-md) 0',
                borderBottom: i < createdRequests.length - 1 ? '1px solid var(--border-color)' : 'none',
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{req.document_type?.name}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{req.reference_id}</div>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--primary-500)' }}>
                  ₱{parseFloat(req.amount).toFixed(2)}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 'var(--font-size-lg)', marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)', borderTop: '2px solid var(--border-color)' }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary-500)' }}>₱{checkoutTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="card">
            <h3 style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📱 Select Payment Method
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
              {[
                { key: 'gcash', label: 'GCash', sub: 'Pay with GCash e-wallet', color: '#007bff', letter: 'G' },
                { key: 'paymaya', label: 'Maya', sub: 'Pay with Maya e-wallet', color: '#019a01', letter: 'M' },
              ].map(m => (
                <div key={m.key} onClick={() => setPaymentMethod(m.key)} className="doc-type-card" style={{
                  padding: 'var(--space-lg)',
                  border: `2px solid ${paymentMethod === m.key ? m.color : 'var(--border-color)'}`,
                  background: paymentMethod === m.key ? `${m.color}08` : 'var(--bg-primary)',
                  display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: '0.75rem',
                  }}>
                    {m.letter}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{m.label}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{m.sub}</div>
                  </div>
                  {paymentMethod === m.key && <span style={{ marginLeft: 'auto', color: m.color, fontSize: '1.2rem' }}>✓</span>}
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px' }}
              disabled={!paymentMethod || paying}
              onClick={handlePayment}
            >
              {paying ? 'Processing Payment...' : `Pay ₱${checkoutTotal.toFixed(2)}`}
            </button>

            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--space-md)' }}>
              🔒 Secure simulated payment for demo purposes
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Service Catalog ───
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1>📑 Request a Document</h1>
          <p className="page-header-subtitle">Select one or more document types and submit your request</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          {selectedTypes.length > 0 && (
            <span className="badge badge-dot badge-blue" style={{ fontSize: 'var(--font-size-sm)', padding: '6px 14px' }}>
              {selectedTypes.length} selected — ₱{totalFee.toFixed(2)}
            </span>
          )}
          {types.length > 0 && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedTypes(selectedTypes.length === types.length ? [] : [...types])}
            >
              {selectedTypes.length === types.length ? '☐ Deselect All' : '☑ Select All'}
            </button>
          )}
        </div>
      </div>

      {types.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No Documents Available</h3>
            <p>Your barangay hasn't set up any document types yet. Please check back later.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 'var(--space-xl)', alignItems: 'flex-start' }}>
          {/* Left: Document Grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="grid grid-2">
              {types.map(type => (
                <div
                  key={type.id}
                  className={`card doc-type-card ${isSelected(type.id) ? 'doc-type-card--selected' : ''}`}
                  onClick={() => toggleSelect(type)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-base)', margin: 0 }}>{type.name}</h3>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '6px',
                      border: isSelected(type.id) ? '2px solid var(--primary-500)' : '2px solid var(--border-color)',
                      background: isSelected(type.id) ? 'var(--primary-500)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease', flexShrink: 0,
                    }}>
                      {isSelected(type.id) && <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>✓</span>}
                    </div>
                  </div>
                  {type.description && (
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)', lineHeight: 1.5 }}>
                      {type.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Fee</span>
                    <span style={{ fontWeight: 700, color: type.fee > 0 ? 'var(--primary-500)' : 'var(--accent-green)' }}>
                      {type.fee > 0 ? `₱${parseFloat(type.fee).toFixed(2)}` : 'FREE'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Processing</span>
                    <span style={{ fontSize: 'var(--font-size-sm)' }}>{type.processing_time}</span>
                  </div>
                  {type.requirements && (
                    <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Requirements</span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>{type.requirements}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Sticky Cart */}
          <div style={{ width: '320px', flexShrink: 0, position: 'sticky', top: 'calc(var(--navbar-height) + 24px)' }}>
            <div className="card" style={{ animation: 'fadeIn 0.3s ease' }}>
              <h3 style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🛒 Your Request {selectedTypes.length > 0 && <span className="badge badge-dot badge-blue">{selectedTypes.length}</span>}
              </h3>

              {selectedTypes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>📄</div>
                  <p style={{ fontSize: 'var(--font-size-sm)' }}>Select documents from the left to get started</p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 'var(--space-md)' }}>
                    {selectedTypes.map((t, i) => (
                      <div key={t.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: 'var(--space-sm) 0',
                        borderBottom: i < selectedTypes.length - 1 ? '1px solid var(--border-color)' : 'none',
                        fontSize: 'var(--font-size-sm)',
                      }}>
                        <span style={{ flex: 1, marginRight: 'var(--space-sm)' }}>{t.name}</span>
                        <span style={{ fontWeight: 600, color: t.fee > 0 ? 'var(--primary-500)' : 'var(--accent-green)', whiteSpace: 'nowrap' }}>
                          {t.fee > 0 ? `₱${parseFloat(t.fee).toFixed(2)}` : 'FREE'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purpose (optional)</label>
                    <textarea
                      className="form-textarea"
                      placeholder="e.g., For employment..."
                      value={purpose}
                      onChange={e => setPurpose(e.target.value)}
                      rows={2}
                      style={{ fontSize: 'var(--font-size-sm)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) var(--space-md)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Total</span>
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)', color: 'var(--primary-500)' }}>
                      {totalFee > 0 ? `₱${totalFee.toFixed(2)}` : 'FREE'}
                    </span>
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? 'Submitting...' : totalFee > 0 ? `Submit & Pay ₱${totalFee.toFixed(2)}` : 'Submit Request'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
