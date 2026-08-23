import React, { useState } from 'react';
import { UserCheck, Shield, Lock, UserPlus, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loginApi, registerApi } from '../lib/api';
import { User } from '../types';

interface AuthViewProps {
  onSuccess: (user: User, token: string) => void;
  defaultPortalRole?: 'user' | 'admin';
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, defaultPortalRole = 'user' }) => {
  const [portalTab, setPortalTab] = useState<'user' | 'admin'>(defaultPortalRole);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fill demo credentials
  const fillDemoAdmin = () => {
    setPortalTab('admin');
    setMode('login');
    setUsername('admin');
    setPassword('admin123');
    setError(null);
  };

  const fillDemoUser1 = () => {
    setPortalTab('user');
    setMode('login');
    setUsername('user1');
    setPassword('user123');
    setError(null);
  };

  const fillDemoUser2 = () => {
    setPortalTab('user');
    setMode('login');
    setUsername('user2');
    setPassword('user123');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginApi(username, password, portalTab);
        setSuccessMsg('Login successful! Redirecting...');
        setTimeout(() => {
          onSuccess(res.user, res.token);
        }, 500);
      } else {
        const res = await registerApi(username, password, name || username, portalTab);
        setSuccessMsg('Account registered successfully! Logging in...');
        setTimeout(() => {
          onSuccess(res.user, res.token);
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-portal-container" className="max-w-md mx-auto py-8">
      <div className="bg-[#0d0f14] border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Portal Header Tabs (User vs Admin) */}
        <div id="portal-tab-header" className="grid grid-cols-2 bg-[#12141a] p-1.5 border-b border-white/5">
          <button
            id="tab-user-portal"
            type="button"
            onClick={() => {
              setPortalTab('user');
              setError(null);
            }}
            className={`py-3 rounded-xl text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              portalTab === 'user'
                ? 'bg-[#0d0f14] text-amber-500 border border-white/5 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>User Portal</span>
          </button>

          <button
            id="tab-admin-portal"
            type="button"
            onClick={() => {
              setPortalTab('admin');
              setMode('login'); // Admin can only login
              setError(null);
            }}
            className={`py-3 rounded-xl text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              portalTab === 'admin'
                ? 'bg-[#0d0f14] text-amber-500 border border-white/5 shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Portal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-1">
              {portalTab === 'admin' ? <Shield className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            <h2 className="text-xl font-serif font-bold text-white tracking-tight">
              {portalTab === 'admin'
                ? 'Administrator Access'
                : mode === 'login'
                ? 'User Portal Login'
                : 'Create New User Account'}
            </h2>
            <p className="text-xs text-gray-400">
              {portalTab === 'admin'
                ? 'Manage text files, assign access authorizations, and view audit logs.'
                : 'Access your authorized text files and personal encrypted documents.'}
            </p>
          </div>

          {/* Mode Switcher for User Portal */}
          {portalTab === 'user' && (
            <div className="flex justify-center space-x-6 border-b border-white/5 pb-4 text-xs font-bold uppercase tracking-widest">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`pb-1 transition-colors ${
                  mode === 'login'
                    ? 'text-amber-500 border-b-2 border-amber-500'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`pb-1 transition-colors ${
                  mode === 'register'
                    ? 'text-amber-500 border-b-2 border-amber-500'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Quick Demo Pre-Fill Helper */}
          <div className="bg-[#12141a] p-3 rounded-xl border border-white/5 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-500 flex items-center justify-between">
              <span>Quick Demo Fill:</span>
              <span className="text-[10px] font-mono text-gray-500">bcrypt protected</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {portalTab === 'admin' ? (
                <button
                  type="button"
                  onClick={fillDemoAdmin}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-mono border border-amber-500/20 transition-colors"
                >
                  Fill Admin (admin)
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={fillDemoUser1}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-mono border border-white/10 transition-colors"
                  >
                    Fill User Alice (user1)
                  </button>
                  <button
                    type="button"
                    onClick={fillDemoUser2}
                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-mono border border-emerald-500/20 transition-colors"
                  >
                    Fill User Bob (user2)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'register' && portalTab === 'user' && (
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-amber-500 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Charlie Brown"
                  className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500/50"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-amber-500 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={portalTab === 'admin' ? 'admin' : 'user1'}
                className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest font-bold text-amber-500 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : mode === 'login' ? (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Login to {portalTab === 'admin' ? 'Admin Portal' : 'User Portal'}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Register Account</span>
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
