import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, ShieldCheck, FileText, ArrowRight, UserCheck, ShieldAlert, Sparkles, CheckCircle2, HelpCircle } from 'lucide-react';
import { encryptText, decryptText } from '../lib/crypto';

interface LandingPageProps {
  onGoToTool: () => void;
  onGoToAuth: () => void;
  onQuickLogin: (username: string, portalRole: 'user' | 'admin') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToTool,
  onGoToAuth,
  onQuickLogin,
}) => {
  // Live beginner sandbox state
  const [sandboxText, setSandboxText] = useState('My secret password is my childhood pet name!');
  const [sandboxPassword, setSandboxPassword] = useState('secret123');
  const [sandboxEncrypted, setSandboxEncrypted] = useState('');
  const [sandboxDecrypted, setSandboxDecrypted] = useState('');
  const [sandboxStatus, setSandboxStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSandboxEncrypt = async () => {
    setIsProcessing(true);
    setSandboxStatus(null);
    const res = await encryptText(sandboxText, sandboxPassword);
    setIsProcessing(false);
    if (res.success) {
      setSandboxEncrypted(res.encryptedText);
      setSandboxDecrypted('');
      setSandboxStatus('🔒 Success! Your message is now locked into secure AES-256 cipher text.');
    } else {
      setSandboxStatus(`❌ ${res.error}`);
    }
  };

  const handleSandboxDecrypt = async () => {
    setIsProcessing(true);
    setSandboxStatus(null);
    const res = await decryptText(sandboxEncrypted, sandboxPassword);
    setIsProcessing(false);
    if (res.success) {
      setSandboxDecrypted(res.plainText);
      setSandboxStatus('🔓 Success! Unlocked back to original readable text.');
    } else {
      setSandboxStatus(`❌ ${res.error}`);
    }
  };

  return (
    <div id="landing-page-wrapper" className="space-y-16 py-6">
      
      {/* ABSTRACT / HERO SECTION */}
      <section id="hero-abstract-section" className="relative overflow-hidden bg-[#0d0f14] rounded-2xl border border-white/5 p-8 sm:p-12 lg:p-16 text-[#d1d5db] shadow-2xl">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] uppercase tracking-widest font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AES-256 Military Grade Security</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white tracking-tight leading-tight">
            Your files, <br/>
            <span className="italic text-amber-400">hidden from prying eyes.</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-400 leading-relaxed font-normal max-w-2xl">
            CipherVault turns your private text files into unbreakable code. No technical degrees required — just choose a secret password and your data is locked away safely until you decide to open it.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 items-center">
            <button
              id="hero-try-tool-btn"
              onClick={onGoToTool}
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/10 flex items-center space-x-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Try Text Encryptor Tool</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              id="hero-login-portal-btn"
              onClick={onGoToAuth}
              className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-lg font-bold text-xs uppercase tracking-widest border border-white/10 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-amber-500" />
              <span>Portal Login</span>
            </button>
          </div>

          {/* Quick Demo Credentials Bar */}
          <div className="pt-4 border-t border-white/5 flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <span className="font-bold text-[10px] uppercase tracking-widest text-amber-500">Quick Demo Logins:</span>
            <button
              onClick={() => onQuickLogin('admin', 'admin')}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-md border border-amber-500/20 transition-colors font-mono text-[11px] cursor-pointer"
            >
              🛡️ Admin (admin / admin123)
            </button>
            <button
              onClick={() => onQuickLogin('user1', 'user')}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded-md border border-white/10 transition-colors font-mono text-[11px] cursor-pointer"
            >
              👤 Alice (user1 / user123)
            </button>
            <button
              onClick={() => onQuickLogin('user2', 'user')}
              className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/20 transition-colors font-mono text-[11px] cursor-pointer"
            >
              👤 Bob (user2 / user123)
            </button>
          </div>
        </div>
      </section>

      {/* "HOW IT WORKS" SECTION */}
      <section id="how-it-works-section" className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h3 className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Simple 3-Step Process</h3>
          <h2 className="text-2xl sm:text-3xl font-serif text-white tracking-tight">
            How Text Locking Works
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm">
            Protecting your plain text notes takes less than 10 seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Step 1 */}
          <div id="step-1-card" className="bg-[#0d0f14] p-6 rounded-2xl border border-white/5 shadow-xl space-y-4 hover:border-amber-500/20 transition-colors">
            <span className="text-amber-500 font-mono text-sm font-bold tracking-widest block">01</span>
            <h3 className="text-base font-semibold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Choose Your Text File</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Start with any plain text file (<span className="text-white font-mono">.txt</span>) or type a note directly. This is your readable <em className="text-gray-300">Plaintext</em>.
            </p>
          </div>

          {/* Step 2 */}
          <div id="step-2-card" className="bg-[#0d0f14] p-6 rounded-2xl border border-white/5 shadow-xl space-y-4 hover:border-amber-500/20 transition-colors">
            <span className="text-amber-500 font-mono text-sm font-bold tracking-widest block">02</span>
            <h3 className="text-base font-semibold text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Lock With Secret Key</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Enter your secret password key. Our system uses military-grade <span className="text-white font-mono">AES-256</span> to scramble text into unreadable code.
            </p>
          </div>

          {/* Step 3 */}
          <div id="step-3-card" className="bg-[#0d0f14] p-6 rounded-2xl border border-white/5 shadow-xl space-y-4 hover:border-amber-500/20 transition-colors">
            <span className="text-amber-500 font-mono text-sm font-bold tracking-widest block">03</span>
            <h3 className="text-base font-semibold text-white flex items-center space-x-2">
              <Unlock className="w-4 h-4 text-emerald-400" />
              <span>Unlock Back to Text</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Upload your locked file, enter your exact password, and unlock back to original readable text instantly.
            </p>
          </div>

        </div>
      </section>

      {/* INTERACTIVE MINI PLAYGROUND */}
      <section id="interactive-playground" className="bg-[#0d0f14] rounded-2xl p-6 sm:p-10 border border-white/5 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center space-x-2 text-amber-500 text-[10px] uppercase tracking-widest font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Live Demonstration</span>
            </div>
            <h3 className="text-2xl font-serif text-white">Interactive Encryption Sandbox</h3>
            <p className="text-xs text-gray-400">Test locking and unlocking a text message right now!</p>
          </div>
          <button
            onClick={onGoToTool}
            className="px-4 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 rounded-full text-xs font-bold uppercase tracking-widest transition-all self-start md:self-auto flex items-center space-x-1 cursor-pointer"
          >
            <span>Full Tool Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Input Text & Password */}
          <div className="bg-[#12141a] p-6 rounded-xl border border-white/5 space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-2">
                1. Your Secret Note (Plaintext)
              </label>
              <textarea
                id="sandbox-input-text"
                value={sandboxText}
                onChange={(e) => setSandboxText(e.target.value)}
                rows={3}
                className="w-full bg-black/40 text-white border border-white/5 rounded-lg p-3 text-xs focus:outline-none focus:border-amber-500/50 transition-all font-sans placeholder:text-gray-700"
                placeholder="Type any message here..."
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-2">
                2. Your Secret Password Key
              </label>
              <input
                id="sandbox-input-password"
                type="text"
                value={sandboxPassword}
                onChange={(e) => setSandboxPassword(e.target.value)}
                className="w-full bg-black/40 text-white border border-white/5 rounded-lg p-3 text-xs focus:outline-none focus:border-amber-500/50 transition-all font-mono placeholder:text-gray-700"
                placeholder="Enter password..."
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                id="sandbox-lock-btn"
                onClick={handleSandboxEncrypt}
                disabled={isProcessing}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Message</span>
              </button>

              <button
                id="sandbox-unlock-btn"
                onClick={handleSandboxDecrypt}
                disabled={isProcessing || !sandboxEncrypted}
                className="flex-1 py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 font-bold rounded-lg text-xs uppercase tracking-widest transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock Message</span>
              </button>
            </div>

            {sandboxStatus && (
              <div className="p-3 bg-black/40 rounded-lg text-xs font-mono border border-white/5 text-amber-300">
                {sandboxStatus}
              </div>
            )}
          </div>

          {/* Right Column: Encrypted Result / Decrypted Result */}
          <div className="bg-[#12141a] p-6 rounded-xl border border-white/5 space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-amber-500 font-bold mb-2">
                Locked Cipher Text Payload
              </label>
              <div className="w-full h-32 bg-black/60 text-amber-300/90 border border-white/5 rounded-lg p-3 font-mono text-xs overflow-y-auto whitespace-pre-wrap">
                {sandboxEncrypted || '(Click "Lock Message" to generate encrypted output...)'}
              </div>
            </div>

            {sandboxDecrypted && (
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2">
                  Restored Unlocked Plaintext
                </label>
                <div className="w-full bg-emerald-950/30 text-emerald-300 border border-emerald-500/30 rounded-lg p-3 text-xs font-medium">
                  {sandboxDecrypted}
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ROLES & WORKFLOWS EXPLANATION */}
      <section id="roles-workflow-section" className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h3 className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Access Control</h3>
          <h2 className="text-2xl font-serif text-white">Role-Based Access Portals</h2>
          <p className="text-xs text-gray-400">
            Administrators assign authorizations; Data Owners access their personal safe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Admin Role */}
          <div className="bg-[#0d0f14] border border-white/5 rounded-2xl p-6 space-y-4 hover:border-amber-500/20 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Administrator Portal</h3>
                <p className="text-[10px] uppercase tracking-widest text-amber-500 font-bold">Security Manager</p>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <span>Upload confidential text files (<span className="font-mono text-white">.txt</span>) to server.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <span>Assign and authorize specific text files to specific Users.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <span>View system audit logs and manage registered users.</span>
              </li>
            </ul>

            <button
              onClick={() => onQuickLogin('admin', 'admin')}
              className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs uppercase tracking-widest font-bold transition-all cursor-pointer"
            >
              Login as Admin (admin)
            </button>
          </div>

          {/* User Role */}
          <div className="bg-[#0d0f14] border border-white/5 rounded-2xl p-6 space-y-4 hover:border-emerald-500/20 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">User (Data Owner) Portal</h3>
                <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Authorized Content Viewer</p>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>View text files authorized specifically for your account.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>Decrypt files using your secret password key in browser.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <span>Upload and lock personal private notes.</span>
              </li>
            </ul>

            <button
              onClick={() => onQuickLogin('user1', 'user')}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs uppercase tracking-widest font-bold transition-all cursor-pointer"
            >
              Login as User (Alice)
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};
