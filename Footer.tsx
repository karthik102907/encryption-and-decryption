import React from 'react';
import { ShieldCheck, Lock, Key } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="app-footer" className="bg-[#0a0b0d] border-t border-white/5 text-gray-400 py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-bold text-white text-base">CipherVault</span>
              <p className="text-xs text-gray-500">Secure Text Encryption & Role-Based Access Control</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <span className="flex items-center space-x-1.5 px-3 py-1 bg-[#0d0f14] rounded-md border border-white/5 text-amber-400 text-[10px] font-bold uppercase tracking-widest">
              <Lock className="w-3.5 h-3.5" />
              <span>AES-256-GCM Protection</span>
            </span>
            <span className="flex items-center space-x-1.5 px-3 py-1 bg-[#0d0f14] rounded-md border border-white/5 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
              <Key className="w-3.5 h-3.5" />
              <span>PBKDF2 Key Derivation</span>
            </span>
            <span className="flex items-center space-x-1.5 px-3 py-1 bg-[#0d0f14] rounded-md border border-white/5 text-amber-400 text-[10px] font-bold uppercase tracking-widest">
              <span>bcrypt Hashing</span>
            </span>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
          <p>© 2026 CipherVault. All text encryption and decryption operations performed securely.</p>
          <p className="flex items-center space-x-1">
            <span>Designed with simple, beginner-friendly language</span>
          </p>
        </div>

      </div>
    </footer>
  );
};
