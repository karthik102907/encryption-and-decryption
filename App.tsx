import React, { useState, useEffect } from 'react';
import { User, AuthState } from './types';
import { getCurrentUserApi, setAuthToken, clearAuthToken, loginApi } from './lib/api';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { TextEncryptorTool } from './components/TextEncryptorTool';
import { AuthView } from './components/AuthView';
import { AdminDashboard } from './components/AdminDashboard';
import { UserDashboard } from './components/UserDashboard';
import { Footer } from './components/Footer';

export default function App() {
  const [activeTab, setActiveTab] = useState<'landing' | 'tool' | 'admin' | 'user' | 'auth'>('landing');
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Check existing session on load
  useEffect(() => {
    async function checkSession() {
      try {
        const data = await getCurrentUserApi();
        if (data?.user) {
          setAuth({
            user: data.user,
            token: localStorage.getItem('auth_token'),
            isAuthenticated: true,
          });
        }
      } catch (err) {
        // No active session
        clearAuthToken();
      }
    }
    checkSession();
  }, []);

  // Handle successful login or register
  const handleAuthSuccess = (user: User, token: string) => {
    setAuthToken(token);
    setAuth({
      user,
      token,
      isAuthenticated: true,
    });
    showNotification(`Welcome back, ${user.name}!`);

    if (user.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('user');
    }
  };

  // Quick Demo Login helper
  const handleQuickLogin = async (username: string, portalRole: 'user' | 'admin') => {
    try {
      const password = username === 'admin' ? 'admin123' : 'user123';
      const res = await loginApi(username, password, portalRole);
      handleAuthSuccess(res.user, res.token);
    } catch (err: any) {
      showNotification(err.message || 'Quick login failed.', 'error');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    clearAuthToken();
    setAuth({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    setActiveTab('landing');
    showNotification('Logged out successfully.');
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#0a0b0d] text-[#d1d5db] flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      
      {/* Toast Notification */}
      {notification && (
        <div
          id="toast-notification"
          className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl text-xs font-bold border transition-all animate-bounce ${
            notification.type === 'success'
              ? 'bg-[#0d0f14] border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'bg-[#0d0f14] border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={auth.user}
        onLogout={handleLogout}
        onQuickLogin={handleQuickLogin}
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        
        {activeTab === 'landing' && (
          <LandingPage
            onGoToTool={() => setActiveTab('tool')}
            onGoToAuth={() => setActiveTab('auth')}
            onQuickLogin={handleQuickLogin}
          />
        )}

        {activeTab === 'tool' && <TextEncryptorTool />}

        {activeTab === 'auth' && (
          <AuthView onSuccess={handleAuthSuccess} defaultPortalRole="user" />
        )}

        {activeTab === 'admin' && (
          auth.user && auth.user.role === 'admin' ? (
            <AdminDashboard currentUser={auth.user} />
          ) : (
            <AuthView onSuccess={handleAuthSuccess} defaultPortalRole="admin" />
          )
        )}

        {activeTab === 'user' && (
          auth.user ? (
            <UserDashboard currentUser={auth.user} />
          ) : (
            <AuthView onSuccess={handleAuthSuccess} defaultPortalRole="user" />
          )
        )}

      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}
