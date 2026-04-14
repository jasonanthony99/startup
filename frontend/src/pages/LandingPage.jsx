import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-brand">
          <div className="logo-icon">🏛</div>
          BAQTS
        </div>
        <ul className="landing-nav-links">
          <li><a href="#features">Features</a></li>
          <li><Link to="/track">Track Application</Link></li>
          <li><Link to="/transparency">Transparency</Link></li>
          <li><Link to="/login" className="btn btn-ghost btn-sm">Login</Link></li>
          <li><Link to="/register" className="btn btn-primary btn-sm">Register</Link></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">🇵🇭 For Philippine Barangays</div>
          <h1>Barangay Assistance Queue & Transparency System</h1>
          <p>
            A modern digital platform that streamlines assistance distribution, ensures fair queuing,
            and promotes transparency in every barangay.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started — It's Free
            </Link>
            <Link to="/track" className="btn btn-secondary btn-lg">
              🔍 Track Application
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <h2>Why Choose BAQTS?</h2>
        <p className="section-subtitle">
          Everything your barangay needs to manage assistance distribution efficiently
        </p>

        <div className="features-grid">
          <div className="feature-card animate-fade-in">
            <div className="feature-icon">📋</div>
            <h3>Smart Queue System</h3>
            <p>
              Automated priority scoring for senior citizens, PWDs, and low-income families.
              No more cutting in line.
            </p>
          </div>

          <div className="feature-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="feature-icon">🔍</div>
            <h3>Real-Time Tracking</h3>
            <p>
              Citizens can track their application status anytime using a unique reference ID.
              Full transparency, zero guesswork.
            </p>
          </div>

          <div className="feature-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="feature-icon">📊</div>
            <h3>Transparency Dashboard</h3>
            <p>
              Public dashboard shows total assistance distributed, approval rates, and monthly breakdowns.
              Build trust in governance.
            </p>
          </div>

          <div className="feature-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="feature-icon">🏛️</div>
            <h3>Multi-Barangay Ready</h3>
            <p>
              SaaS architecture supports multiple barangays. Each with its own data, admins, and settings.
              Scale across the nation.
            </p>
          </div>

          <div className="feature-card animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="feature-icon">📈</div>
            <h3>Reports & Analytics</h3>
            <p>
              Generate comprehensive reports by date, type, and status.
              Make data-driven decisions for your community.
            </p>
          </div>

          <div className="feature-card animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <div className="feature-icon">🔔</div>
            <h3>Instant Notifications</h3>
            <p>
              Citizens receive instant updates when their application status changes.
              Stay informed every step of the way.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{
        padding: 'var(--space-3xl) var(--space-2xl)',
        background: 'var(--bg-tertiary)',
        textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>How It Works</h2>
        <p className="section-subtitle" style={{
          color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)',
          marginBottom: 'var(--space-3xl)'
        }}>
          Three simple steps to get assistance
        </p>

        <div style={{
          display: 'flex', justifyContent: 'center', gap: 'var(--space-2xl)',
          flexWrap: 'wrap', maxWidth: '900px', margin: '0 auto'
        }}>
          {[
            { step: '1', icon: '📝', title: 'Submit Application', desc: 'Fill out a simple form with your details and required documents.' },
            { step: '2', icon: '⏳', title: 'Join the Queue', desc: 'Your application is automatically prioritized based on your needs.' },
            { step: '3', icon: '✅', title: 'Receive Assistance', desc: 'Get notified when your application is approved and assistance is ready.' },
          ].map((item) => (
            <div key={item.step} style={{
              flex: '1', minWidth: '220px', maxWidth: '280px',
              textAlign: 'center', padding: 'var(--space-lg)'
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', margin: '0 auto var(--space-md)',
                boxShadow: '0 4px 15px rgba(13, 71, 161, 0.3)'
              }}>
                {item.icon}
              </div>
              <h4 style={{ marginBottom: 'var(--space-sm)' }}>{item.title}</h4>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: 'var(--space-3xl) var(--space-2xl)',
        textAlign: 'center',
        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
        color: 'white'
      }}>
        <h2 style={{ color: 'white', marginBottom: 'var(--space-md)' }}>
          Ready to modernize your barangay?
        </h2>
        <p style={{
          color: 'rgba(255,255,255,0.8)', fontSize: 'var(--font-size-lg)',
          marginBottom: 'var(--space-xl)', maxWidth: '500px', margin: '0 auto var(--space-xl)'
        }}>
          Join the growing number of barangays using BAQTS for fair and transparent assistance distribution.
        </p>
        <Link to="/register" className="btn btn-gold btn-lg">
          Register Your Barangay
        </Link>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>
          © {new Date().getFullYear()} <a href="/">BAQTS</a> — Barangay Assistance Queue & Transparency System.
          Built for the Filipino community. 🇵🇭
        </p>
      </footer>
    </div>
  );
}
