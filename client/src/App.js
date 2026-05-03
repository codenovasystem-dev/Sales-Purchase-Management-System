import React, { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import LandingPage from "./LandingPage";

function App() {
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
      setShowAuth(false);
    }
  }, []);

  const handleAuth = async (email, password, role = 'viewer') => {
    setAuthError("");
    setIsSubmitting(true);

    const endpoint = isLogin ? '/api/login' : '/api/register';
    const body = isLogin ? { email, password } : { email, password, role };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token && data.user) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
        } else {
          setAuthError(data.message || 'Authentication succeeded but no token received');
        }
      } else {
        setAuthError(data.message || 'Authentication failed. Check email/password and backend status.');
      }
    } catch (error) {
      setAuthError(`Network error. Please confirm the backend is running on ${API_BASE_URL}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    if (!showAuth) {
      return (
        <LandingPage
          onGetStarted={() => setShowAuth(true)}
          onViewDemo={() => {
            // For demo, login as viewer
            setIsLogin(true);
            setShowAuth(true);
          }}
        />
      );
    }
    return (
      <AuthForm
        isLogin={isLogin}
        setIsLogin={setIsLogin}
        onSubmit={handleAuth}
        authError={authError}
        isSubmitting={isSubmitting}
        onBackClick={() => setShowAuth(false)}
      />
    );
  }

  return (
    <div>
      <header style={{
        backgroundColor: '#1976d2',
        color: 'white',
        padding: '10px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0 }}>SalesIQ Analytics Platform</h1>
        <div>
          <span>Welcome, {user.email} ({user.role})</span>
          <button
            onClick={handleLogout}
            style={{
              marginLeft: '20px',
              padding: '5px 15px',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <Dashboard />
    </div>
  );
}

function AuthForm({ isLogin, setIsLogin, onSubmit, authError, isSubmitting, onBackClick }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password, role);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '400px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ margin: 0 }}>
            {isLogin ? 'Login to SalesIQ' : 'Register for SalesIQ'}
          </h2>
          <button
            onClick={onBackClick}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              fontSize: '24px'
            }}
            title="Back"
          >
            ←
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {authError && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: '#ffebee',
              color: '#c62828',
              border: '1px solid #f44336'
            }}>
              {authError}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Role:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px'
                }}
              >
                <option value="viewer">Viewer</option>
                <option value="analyst">Analyst</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: isSubmitting ? '#90caf9' : '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              marginBottom: '20px'
            }}
          >
            {isSubmitting ? (isLogin ? 'Logging in...' : 'Registering...') : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: '#1976d2',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </div>

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
          <h4>Demo Accounts:</h4>
          <p><strong>Admin:</strong> admin@salesiq.com / password</p>
          <p><strong>Manager:</strong> manager@salesiq.com / password</p>
          <p><strong>Analyst:</strong> analyst@salesiq.com / password</p>
        </div>
      </div>
    </div>
  );
}

export default App;