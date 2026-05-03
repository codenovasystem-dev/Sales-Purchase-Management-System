import React from "react";
import "./LandingPage.css";

function LandingPage({ onGetStarted, onViewDemo }) {
  return (
    <div className="landing-page">
      {/* Header/Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">📊</span>
            <span className="logo-text">SalesIQ</span>
          </div>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><button className="btn-secondary" onClick={onGetStarted}>Sign In</button></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Real-Time Business Analytics for E-Commerce</h1>
          <p>Track sales, manage inventory, and forecast revenue with live data insights</p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={onGetStarted}>Get Started Free</button>
            <button className="btn-secondary" onClick={onViewDemo}>View Demo</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="chart-placeholder">
            <div className="chart-bar bar-1"></div>
            <div className="chart-bar bar-2"></div>
            <div className="chart-bar bar-3"></div>
            <div className="chart-bar bar-4"></div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="features" id="features">
        <h2>Powerful Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Real-Time Sales Tracking</h3>
            <p>Monitor sales as they happen with live WebSocket updates and instant notifications</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📦</div>
            <h3>Inventory Management</h3>
            <p>Track stock levels, set reorder alerts, and calculate inventory value automatically</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔮</div>
            <h3>Revenue Forecasting</h3>
            <p>Predictive analytics to anticipate future revenue trends and plan accordingly</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Role-Based Access</h3>
            <p>Control user permissions with Admin, Manager, Analyst, and Viewer roles</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Responsive Design</h3>
            <p>Access your dashboard from any device with a fully responsive interface</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Enterprise Security</h3>
            <p>JWT authentication, bcrypt encryption, and role-based access control</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Sign Up</h3>
            <p>Create your account in seconds</p>
          </div>
          <div className="arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Connect Data</h3>
            <p>Link your e-commerce platform</p>
          </div>
          <div className="arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Get Insights</h3>
            <p>View real-time analytics instantly</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stat-item">
          <h3>99.9%</h3>
          <p>Uptime</p>
        </div>
        <div className="stat-item">
          <h3>&lt; 100ms</h3>
          <p>Data Latency</p>
        </div>
        <div className="stat-item">
          <h3>24/7</h3>
          <p>Support</p>
        </div>
        <div className="stat-item">
          <h3>4 Roles</h3>
          <p>Access Levels</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Transform Your Business?</h2>
        <p>Join thousands of e-commerce businesses using SalesIQ</p>
        <button className="btn-primary btn-large" onClick={onGetStarted}>Start Free Trial</button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 SalesIQ. All rights reserved. | Privacy Policy | Terms of Service</p>
      </footer>
    </div>
  );
}

export default LandingPage;
