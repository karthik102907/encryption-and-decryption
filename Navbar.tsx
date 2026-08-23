import React from 'react';
import { Shield, KeyRound, Lock, UserCheck, ShieldCheck, LogOut, FileText, UserPlus } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  activeTab: 'landing' | 'tool' | 'admin' | 'user' | 'auth';
  setActiveTab: (tab: 'landing' | 'tool' | 'admin' | 'user' | 'auth') => void;
  user: User | null;
  onLogout: () => void;
  onQuickLogin: (username: string, portalRole: 'user' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onQuickLogin,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-50 bg-[#0d0f14]/95 backdrop-blur border-b border-white/5 text-[#d1d5db]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand Title */}
          <div 
            id="brand-logo-container"
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveTab('landing')}
          >
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-transform group-hover:scale-105">
              <Lock className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif italic text-xl font-bold text-white tracking-tight">CipherVault</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-500 font-mono px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">
                  AES-256
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav id="main-navigation" className="hidden md:flex items-center space-x-6 text-xs uppercase tracking-widest font-medium">
            <button
              id="nav-home-btn"
              onClick={() => setActiveTab('landing')}
              className={`transition-colors pb-1 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'landing'
                  ? 'text-amber-500 border-b border-amber-500 font-bold'
                  : 'text-gray-400 hover:text-amber-500'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>How It Works</span>
            </button>

            <button
              id="nav-tool-btn"
              onClick={() => setActiveTab('tool')}
              className={`transition-colors pb-1 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'tool'
                  ? 'text-amber-500 border-b border-amber-500 font-bold'
                  : 'text-gray-400 hover:text-amber-500'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Encryptor Tool</span>
            </button>

            {/* Dashboard Tabs depending on login status / role */}
            {user ? (
              user.role === 'admin' ? (
                <button
                  id="nav-admin-dashboard-btn"
                  onClick={() => setActiveTab('admin')}
                  className={`transition-colors pb-1 flex items-center space-x-1.5 cursor-pointer ${
                    activeTab === 'admin'
                      ? 'text-amber-500 border-b border-amber-500 font-bold'
                      : 'text-gray-400 hover:text-amber-500'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Portal</span>
                </button>
              ) : (
                <button
                  id="nav-user-dashboard-btn"
                  onClick={() => setActiveTab('user')}
                  className={`transition-colors pb-1 flex items-center space-x-1.5 cursor-pointer ${
                    activeTab === 'user'
                      ? 'text-emerald-400 border-b border-emerald-400 font-bold'
                      : 'text-gray-400 hover:text-amber-500'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>My Authorized Files</span>
                </button>
              )
            ) : null}
          </nav>

          {/* User Auth Status & Quick Switchers */}
          <div id="user-controls-container" className="flex items-center space-x-3">
            {user ? (
              <div id="logged-in-profile" className="flex items-center space-x-3 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-white">{user.name}</span>
                  <span className="text-[10px] text-amber-500 uppercase tracking-widest font-mono">
                    {user.role === 'admin' ? '🛡️ Admin' : '👤 Data Owner'}
                  </span>
                </div>
                <button
                  id="user-logout-btn"
                  onClick={onLogout}
                  title="Logout"
                  className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div id="quick-demo-login-bar" className="flex items-center space-x-2">
                {/* Quick demo buttons */}
                <div className="hidden lg:flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/5">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold px-2">Demo:</span>
                  <button
                    id="quick-login-admin-btn"
                    onClick={() => onQuickLogin('admin', 'admin')}
                    className="px-2.5 py-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs rounded-lg transition-all border border-amber-500/20 font-medium cursor-pointer"
                  >
                    🛡️ Admin
                  </button>
                  <button
                    id="quick-login-user1-btn"
                    onClick={() => onQuickLogin('user1', 'user')}
                    className="px-2.5 py-1 bg-white/5 text-gray-300 hover:bg-white/10 text-xs rounded-lg transition-all border border-white/10 font-medium cursor-pointer"
                  >
                    👤 Alice
                  </button>
                  <button
                    id="quick-login-user2-btn"
                    onClick={() => onQuickLogin('user2', 'user')}
                    className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs rounded-lg transition-all border border-emerald-500/20 font-medium cursor-pointer"
                  >
                    👤 Bob
                  </button>
                </div>

                <button
                  id="open-auth-modal-btn"
                  onClick={() => setActiveTab('auth')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs uppercase tracking-widest transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Portal Login</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
