import React, { useState, useRef } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  Download,
  Copy,
  Trash2,
  Upload,
  FileText,
  Check,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  Cpu,
  Layers,
  FileCode,
  Flame,
  CheckCircle2,
  FileSpreadsheet,
  Sliders,
  Terminal,
  Hash,
  Share2,
} from 'lucide-react';
import {
  encryptTextAdvanced,
  decryptTextAdvanced,
  generateRSAKeyPair,
  encryptWithRSA,
  decryptWithRSA,
  hideTextInCover,
  extractHiddenText,
  computeHash,
  computeHMAC,
  shredTextInMemory,
  generateSecureKey,
  evaluateKeyStrength,
  downloadTextFile,
} from '../lib/crypto';
import { RSAKeyPair, BatchFileEntry } from '../types';

type ToolTab = 'symmetric' | 'asymmetric' | 'stego' | 'hashes' | 'batch' | 'shredder';

export const TextEncryptorTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ToolTab>('symmetric');

  // --- SYMMETRIC STATE ---
  const [symMode, setSymMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [symAlgorithm, setSymAlgorithm] = useState<'AES-256-GCM' | 'AES-256-CBC'>('AES-256-GCM');
  const [symIterations, setSymIterations] = useState<number>(100000);
  const [symInput, setSymInput] = useState('');
  const [symKey, setSymKey] = useState('');
  const [symFilename, setSymFilename] = useState('secure_document.txt');
  const [symOutput, setSymOutput] = useState('');
  const [symShowKey, setSymShowKey] = useState(false);
  const [showKeyGenerator, setShowKeyGenerator] = useState(false);

  // Key Generator options
  const [genLength, setGenLength] = useState(18);
  const [genMode, setGenMode] = useState<'random' | 'passphrase'>('passphrase');
  const [genUpper, setGenUpper] = useState(true);
  const [genLower, setGenLower] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);

  // --- ASYMMETRIC RSA STATE ---
  const [rsaMode, setRsaMode] = useState<'encrypt' | 'decrypt' | 'generate'>('generate');
  const [rsaKeyPair, setRsaKeyPair] = useState<RSAKeyPair | null>(null);
  const [rsaPublicKeyInput, setRsaPublicKeyInput] = useState('');
  const [rsaPrivateKeyInput, setRsaPrivateKeyInput] = useState('');
  const [rsaInputText, setRsaInputText] = useState('');
  const [rsaOutputResult, setRsaOutputResult] = useState('');

  // --- STEGANOGRAPHY STATE ---
  const [stegoMode, setStegoMode] = useState<'encode' | 'decode'>('encode');
  const [stegoCoverText, setStegoCoverText] = useState('Good morning team,\nPlease find attached the agenda for our upcoming quarterly sprint review. Looking forward to your input.');
  const [stegoSecretText, setStegoSecretText] = useState('');
  const [stegoResultText, setStegoResultText] = useState('');
  const [stegoHiddenLength, setStegoHiddenLength] = useState(0);

  // --- HASH & HMAC STATE ---
  const [hashInput, setHashInput] = useState('');
  const [hashHmacKey, setHashHmacKey] = useState('');
  const [computedSha256, setComputedSha256] = useState('');
  const [computedSha512, setComputedSha512] = useState('');
  const [computedHmac, setComputedHmac] = useState('');
  const [verifyTargetHash, setVerifyTargetHash] = useState('');
  const [verifyMatchResult, setVerifyMatchResult] = useState<boolean | null>(null);

  // --- BATCH PROCESSOR STATE ---
  const [batchFiles, setBatchFiles] = useState<BatchFileEntry[]>([]);
  const [batchKey, setBatchKey] = useState('');
  const [batchMode, setBatchMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // --- SHREDDER STATE ---
  const [shredInput, setShredInput] = useState('');
  const [shredPasses, setShredPasses] = useState(3);
  const [shredResult, setShredResult] = useState<{ shreddedLength: number; passesCompleted: number; finalHash: string } | null>(null);

  // Common UI State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  const keyEval = evaluateKeyStrength(symKey);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Clear messages on tab change
  const handleTabChange = (tab: ToolTab) => {
    setActiveTab(tab);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Upload single file for Symmetric
  const handleSingleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSymFilename(file.name);
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setSymInput(text);
      setSuccessMsg(`Loaded "${file.name}" (${text.length} chars).`);
    };
    reader.readAsText(file);
  };

  // Process Symmetric Encryption/Decryption
  const handleSymmetricProcess = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!symInput.trim()) {
      setErrorMsg('Please enter or upload text to process.');
      return;
    }
    if (!symKey.trim()) {
      setErrorMsg('Please enter a secret key/password.');
      return;
    }

    setIsProcessing(true);
    try {
      if (symMode === 'encrypt') {
        const res = await encryptTextAdvanced(symInput, symKey, symAlgorithm, symIterations);
        if (res.success) {
          setSymOutput(res.encryptedText);
          setSuccessMsg(`🔒 Successfully encrypted with ${symAlgorithm} (PBKDF2: ${symIterations.toLocaleString()} iters)!`);
        } else {
          setErrorMsg(res.error || 'Encryption failed.');
        }
      } else {
        const res = await decryptTextAdvanced(symInput, symKey);
        if (res.success) {
          setSymOutput(res.plainText);
          setSuccessMsg(`🔓 Successfully decrypted text (${res.algorithmUsed || 'AES'})!`);
        } else {
          setErrorMsg(res.error || 'Decryption failed.');
        }
      }
    } catch (err: any) {
      setErrorMsg(`Execution error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate Key handler
  const handleGenerateKey = () => {
    const key = generateSecureKey({
      length: genLength,
      useUpper: genUpper,
      useLower: genLower,
      useNumbers: genNumbers,
      useSymbols: genSymbols,
      mode: genMode,
      wordCount: 4,
      wordSeparator: '-',
    });
    setSymKey(key);
    setShowKeyGenerator(false);
    setSuccessMsg('✨ Generated high-entropy cryptographic key!');
  };

  // RSA Key Generation
  const handleGenerateRSA = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const pair = await generateRSAKeyPair();
      setRsaKeyPair(pair);
      setRsaPublicKeyInput(pair.publicKeyPem);
      setRsaPrivateKeyInput(pair.privateKeyPem);
      setSuccessMsg('🔑 Generated new RSA-OAEP 2048-bit Public & Private key pair!');
    } catch (err: any) {
      setErrorMsg(`RSA Generation failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // RSA Process
  const handleRSAProcess = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!rsaInputText.trim()) {
      setErrorMsg('Please enter text to encrypt or decrypt.');
      return;
    }

    setIsProcessing(true);
    try {
      if (rsaMode === 'encrypt') {
        if (!rsaPublicKeyInput.trim()) {
          setErrorMsg('Please enter or provide the recipient\'s RSA Public Key.');
          return;
        }
        const res = await encryptWithRSA(rsaInputText, rsaPublicKeyInput);
        if (res.success) {
          setRsaOutputResult(res.encryptedText);
          setSuccessMsg('🔒 Encrypted with RSA-OAEP 2048-bit! Only the private key holder can unlock.');
        } else {
          setErrorMsg(res.error || 'RSA Encryption failed.');
        }
      } else {
        if (!rsaPrivateKeyInput.trim()) {
          setErrorMsg('Please enter your RSA Private Key to decrypt.');
          return;
        }
        const res = await decryptWithRSA(rsaInputText, rsaPrivateKeyInput);
        if (res.success) {
          setRsaOutputResult(res.plainText);
          setSuccessMsg('🔓 Decrypted successfully with RSA Private Key!');
        } else {
          setErrorMsg(res.error || 'RSA Decryption failed.');
        }
      }
    } catch (err: any) {
      setErrorMsg(`RSA Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Steganography Process
  const handleStegoProcess = () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (stegoMode === 'encode') {
      if (!stegoSecretText.trim()) {
        setErrorMsg('Please enter a secret message to conceal.');
        return;
      }
      const res = hideTextInCover(stegoCoverText, stegoSecretText);
      if (res.success) {
        setStegoResultText(res.coverTextWithPayload);
        setStegoHiddenLength(res.hiddenLength);
        setSuccessMsg(`🎭 Secret message (${res.hiddenLength} chars) invisibly concealed inside cover text!`);
      } else {
        setErrorMsg(res.error || 'Steganography encoding failed.');
      }
    } else {
      const res = extractHiddenText(stegoResultText || stegoCoverText);
      if (res.success) {
        setStegoSecretText(res.extractedText);
        setSuccessMsg(`🔍 Extracted secret hidden payload: "${res.extractedText}"`);
      } else {
        setErrorMsg(res.error || 'No hidden message found.');
      }
    }
  };

  // Hash Computation
  const handleComputeHashes = async () => {
    if (!hashInput.trim()) {
      setErrorMsg('Please enter text to compute cryptographic hashes.');
      return;
    }
    setErrorMsg(null);
    try {
      const sha256 = await computeHash(hashInput, 'SHA-256');
      const sha512 = await computeHash(hashInput, 'SHA-512');
      setComputedSha256(sha256);
      setComputedSha512(sha512);

      if (hashHmacKey.trim()) {
        const hmac = await computeHMAC(hashInput, hashHmacKey);
        setComputedHmac(hmac);
      } else {
        setComputedHmac('');
      }

      if (verifyTargetHash.trim()) {
        setVerifyMatchResult(sha256.toLowerCase() === verifyTargetHash.trim().toLowerCase());
      } else {
        setVerifyMatchResult(null);
      }
      setSuccessMsg('⚡ Computed cryptographic hashes & digital checksums.');
    } catch (err: any) {
      setErrorMsg(`Hash computation error: ${err.message}`);
    }
  };

  // Batch Files Upload
  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFileList = e.target.files;
    if (!rawFileList || rawFileList.length === 0) return;
    const files: File[] = Array.from(rawFileList);

    const newEntries: BatchFileEntry[] = [];
    let readCount = 0;

    files.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = (ev.target?.result as string) || '';
        newEntries.push({
          id: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          content,
          size: file.size,
          status: 'pending',
        });
        readCount++;
        if (readCount === files.length) {
          setBatchFiles((prev) => [...prev, ...newEntries]);
          setSuccessMsg(`Loaded ${files.length} text file(s) for batch processing.`);
        }
      };
      reader.readAsText(file);
    });
  };

  // Run Batch Processing
  const handleRunBatch = async () => {
    if (batchFiles.length === 0) {
      setErrorMsg('Please upload at least one .txt file.');
      return;
    }
    if (!batchKey.trim()) {
      setErrorMsg('Please enter a secret key for batch processing.');
      return;
    }

    setIsBatchProcessing(true);
    setErrorMsg(null);

    const updated = [...batchFiles];
    for (let i = 0; i < updated.length; i++) {
      updated[i].status = 'processing';
      setBatchFiles([...updated]);

      try {
        if (batchMode === 'encrypt') {
          const res = await encryptTextAdvanced(updated[i].content, batchKey, 'AES-256-GCM');
          if (res.success) {
            updated[i].result = res.encryptedText;
            updated[i].status = 'completed';
          } else {
            updated[i].status = 'error';
            updated[i].error = res.error;
          }
        } else {
          const res = await decryptTextAdvanced(updated[i].content, batchKey);
          if (res.success) {
            updated[i].result = res.plainText;
            updated[i].status = 'completed';
          } else {
            updated[i].status = 'error';
            updated[i].error = res.error;
          }
        }
      } catch (err: any) {
        updated[i].status = 'error';
        updated[i].error = err.message;
      }
      setBatchFiles([...updated]);
    }
    setIsBatchProcessing(false);
    setSuccessMsg(`Batch ${batchMode} finished across ${updated.length} files!`);
  };

  // Shredder Execution
  const handleShred = async () => {
    if (!shredInput.trim()) {
      setErrorMsg('Please enter text to securely sanitize/shred.');
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const res = await shredTextInMemory(shredInput, shredPasses);
      setShredResult(res);
      setShredInput(''); // Wipe in React state
      setSuccessMsg(`🗑️ Sanitized ${res.shreddedLength} bytes across ${res.passesCompleted} DoD 5220.22-M overwrite passes!`);
    } catch (err: any) {
      setErrorMsg(`Shred error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="text-encryptor-tool-page" className="max-w-6xl mx-auto space-y-8 py-6">
      
      {/* Header Banner */}
      <div id="tool-header" className="bg-[#0d0f14] text-white p-6 sm:p-8 rounded-2xl border border-white/5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 shadow-lg shadow-amber-500/10">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">Advanced Cryptographic Suite</h1>
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px] font-bold uppercase tracking-widest">
                  v2.5 Upgrade
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-400">
                Symmetric AES-256, Asymmetric RSA-2048, Zero-Width Steganography, Hash Integrity Verifier, and Digital Shredder.
              </p>
            </div>
          </div>
        </div>

        {/* Modular Navigation Tabs */}
        <div id="tool-module-tabs" className="pt-2 flex flex-wrap items-center gap-2 border-t border-white/5">
          <button
            onClick={() => handleTabChange('symmetric')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'symmetric'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Symmetric AES</span>
          </button>

          <button
            onClick={() => handleTabChange('asymmetric')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'asymmetric'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>RSA-OAEP 2048</span>
          </button>

          <button
            onClick={() => handleTabChange('stego')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'stego'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Steganography</span>
          </button>

          <button
            onClick={() => handleTabChange('hashes')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'hashes'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Hashes & Checksums</span>
          </button>

          <button
            onClick={() => handleTabChange('batch')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'batch'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch Files</span>
          </button>

          <button
            onClick={() => handleTabChange('shredder')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'shredder'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Digital Shredder</span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center space-x-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center space-x-3">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* =========================================================================
          MODULE 1: SYMMETRIC AES-256 WORKBENCH
          ========================================================================= */}
      {activeTab === 'symmetric' && (
        <div className="bg-[#0d0f14] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          
          {/* Top Controls Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSymMode('encrypt')}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center space-x-1.5 cursor-pointer ${
                  symMode === 'encrypt'
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Encrypt Text (.txt)</span>
              </button>

              <button
                onClick={() => setSymMode('decrypt')}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center space-x-1.5 cursor-pointer ${
                  symMode === 'decrypt'
                    ? 'bg-emerald-500 text-black shadow'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Decrypt Text (.txt)</span>
              </button>
            </div>

            {/* Cipher & Iteration Settings */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center space-x-2 bg-[#12141a] px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cipher:</span>
                <select
                  value={symAlgorithm}
                  onChange={(e) => setSymAlgorithm(e.target.value as any)}
                  className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="AES-256-GCM" className="bg-[#0d0f14] text-white">AES-256-GCM (Authenticated)</option>
                  <option value="AES-256-CBC" className="bg-[#0d0f14] text-white">AES-256-CBC (PKCS7)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 bg-[#12141a] px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">PBKDF2 Iterations:</span>
                <select
                  value={symIterations}
                  onChange={(e) => setSymIterations(Number(e.target.value))}
                  className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer"
                >
                  <option value={100000} className="bg-[#0d0f14] text-white">100,000 (Standard)</option>
                  <option value={200000} className="bg-[#0d0f14] text-white">200,000 (Hardened)</option>
                  <option value={300000} className="bg-[#0d0f14] text-white">300,000 (Maximum)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Upload File / File Name Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12141a] p-4 rounded-xl border border-white/5">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">
                  Text File (.txt) Name
                </span>
                <input
                  type="text"
                  value={symFilename}
                  onChange={(e) => setSymFilename(e.target.value)}
                  className="font-medium text-xs text-white bg-transparent border-b border-dashed border-gray-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,text/plain"
                onChange={handleSingleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 cursor-pointer shadow-sm"
              >
                <Upload className="w-4 h-4" />
                <span>Upload .txt File</span>
              </button>
            </div>
          </div>

          {/* Input & Password Key Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Input Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                  {symMode === 'encrypt' ? 'Source Plaintext (.txt)' : 'Encrypted Ciphertext Block (.txt)'}
                </label>
                <span className="text-[10px] text-gray-500 font-mono">{symInput.length} chars</span>
              </div>
              <textarea
                value={symInput}
                onChange={(e) => setSymInput(e.target.value)}
                rows={8}
                placeholder={
                  symMode === 'encrypt'
                    ? 'Enter sensitive text document contents to encrypt...'
                    : 'Paste encrypted AES block or upload encrypted .txt file...'
                }
                className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl p-4 text-xs font-mono focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-gray-700"
              />
            </div>

            {/* Right: Secret Key & Password Generator */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                    Secret Password Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKeyGenerator(!showKeyGenerator)}
                    className="text-[10px] font-bold uppercase tracking-widest text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Strong Key</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={symShowKey ? 'text' : 'password'}
                    value={symKey}
                    onChange={(e) => setSymKey(e.target.value)}
                    placeholder="Enter secret password key..."
                    className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl p-3.5 pr-10 text-xs font-mono focus:outline-none focus:border-amber-500/50 placeholder:text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => setSymShowKey(!symShowKey)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-white"
                  >
                    {symShowKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Key Generator Popover */}
                {showKeyGenerator && (
                  <div className="p-4 bg-[#12141a] border border-amber-500/20 rounded-xl space-y-3 shadow-xl">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-widest">
                      <span>Entropy Generator</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setGenMode('passphrase')}
                          className={`px-2 py-0.5 rounded text-[10px] ${genMode === 'passphrase' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400'}`}
                        >
                          Passphrase
                        </button>
                        <button
                          onClick={() => setGenMode('random')}
                          className={`px-2 py-0.5 rounded text-[10px] ${genMode === 'random' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400'}`}
                        >
                          Random Char
                        </button>
                      </div>
                    </div>

                    {genMode === 'random' && (
                      <div className="flex items-center space-x-3 text-xs">
                        <span className="text-gray-400">Length: {genLength}</span>
                        <input
                          type="range"
                          min={12}
                          max={32}
                          value={genLength}
                          onChange={(e) => setGenLength(Number(e.target.value))}
                          className="flex-1 accent-amber-500"
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleGenerateKey}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded-lg transition-colors cursor-pointer"
                    >
                      Apply Generated Key
                    </button>
                  </div>
                )}

                {/* Real-Time Entropy Analysis */}
                {symKey && (
                  <div className="p-3.5 bg-[#12141a] border border-white/5 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Entropy Strength:</span>
                      <span className={`font-bold ${keyEval.strength === 'very-strong' || keyEval.strength === 'strong' ? 'text-emerald-400' : keyEval.strength === 'medium' ? 'text-amber-400' : 'text-rose-400'}`}>
                        {keyEval.label} ({keyEval.entropyBits} bits)
                      </span>
                    </div>
                    <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          keyEval.strength === 'very-strong' || keyEval.strength === 'strong'
                            ? 'bg-emerald-500 w-full'
                            : keyEval.strength === 'medium'
                            ? 'bg-amber-500 w-2/3'
                            : 'bg-rose-500 w-1/3'
                        }`}
                      ></div>
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      Estimated GPU Crack Time: <span className="text-gray-300">{keyEval.crackTimeEstimate}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={handleSymmetricProcess}
                  disabled={isProcessing}
                  className={`flex-1 py-3.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    symMode === 'encrypt'
                      ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/10'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/10'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : symMode === 'encrypt' ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Execute AES-256 Encryption</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Execute AES-256 Decryption</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSymInput('');
                    setSymOutput('');
                  }}
                  title="Clear"
                  className="p-3.5 text-gray-400 hover:text-rose-400 bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Output & Download Section */}
          {symOutput && (
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                  {symMode === 'encrypt' ? 'Encrypted Payload Result (.txt)' : 'Decrypted Plaintext Document'}
                </label>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(symOutput, 'sym')}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    {copiedField === 'sym' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'sym' ? 'Copied!' : 'Copy Result'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const outName = symMode === 'encrypt'
                        ? symFilename.replace('.txt', '') + '_ENCRYPTED.txt'
                        : symFilename.replace('_ENCRYPTED', '').replace('.txt', '') + '_DECRYPTED.txt';
                      downloadTextFile(outName, symOutput);
                    }}
                    className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs uppercase tracking-widest transition-colors flex items-center space-x-1.5 shadow cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .txt</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={symOutput}
                rows={8}
                className="w-full bg-[#12141a] text-amber-300 font-mono text-xs p-4 rounded-xl border border-white/5 focus:outline-none"
              />
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          MODULE 2: ASYMMETRIC RSA-OAEP 2048-BIT STUDIO
          ========================================================================= */}
      {activeTab === 'asymmetric' && (
        <div className="bg-[#0d0f14] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRsaMode('generate')}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center space-x-1.5 cursor-pointer ${
                  rsaMode === 'generate' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>1. Generate Key Pair</span>
              </button>

              <button
                onClick={() => setRsaMode('encrypt')}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center space-x-1.5 cursor-pointer ${
                  rsaMode === 'encrypt' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>2. Encrypt with Public Key</span>
              </button>

              <button
                onClick={() => setRsaMode('decrypt')}
                className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center space-x-1.5 cursor-pointer ${
                  rsaMode === 'decrypt' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>3. Decrypt with Private Key</span>
              </button>
            </div>
          </div>

          {/* RSA Key Pair Generation View */}
          {rsaMode === 'generate' && (
            <div className="space-y-6">
              <div className="p-4 bg-[#12141a] border border-white/5 rounded-xl space-y-2">
                <h3 className="font-serif font-bold text-white text-base">Public-Key Cryptography (Asymmetric)</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Generate a mathematically linked <strong>RSA 2048-bit</strong> key pair. Share your <strong>Public Key</strong> freely with anyone who wants to send you encrypted text. Your <strong>Private Key</strong> remains secret on your machine.
                </p>
                <button
                  onClick={handleGenerateRSA}
                  disabled={isProcessing}
                  className="mt-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded-lg transition-colors flex items-center space-x-2 cursor-pointer shadow"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isProcessing ? 'Generating 2048-bit Key Pair...' : 'Generate New RSA Key Pair'}</span>
                </button>
              </div>

              {rsaKeyPair && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Public Key Card */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                        Public Key (Share Freely)
                      </span>
                      <button
                        onClick={() => copyToClipboard(rsaKeyPair.publicKeyPem, 'pubKey')}
                        className="text-[10px] text-gray-400 hover:text-white font-bold"
                      >
                        {copiedField === 'pubKey' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={rsaKeyPair.publicKeyPem}
                      rows={8}
                      className="w-full bg-[#12141a] text-emerald-300 font-mono text-[11px] p-3 rounded-xl border border-white/5"
                    />
                    <button
                      onClick={() => downloadTextFile('public_key.pem', rsaKeyPair.publicKeyPem)}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest"
                    >
                      Download public_key.pem
                    </button>
                  </div>

                  {/* Private Key Card */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                        Private Key (Keep Secret!)
                      </span>
                      <button
                        onClick={() => copyToClipboard(rsaKeyPair.privateKeyPem, 'privKey')}
                        className="text-[10px] text-gray-400 hover:text-white font-bold"
                      >
                        {copiedField === 'privKey' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={rsaKeyPair.privateKeyPem}
                      rows={8}
                      className="w-full bg-[#12141a] text-rose-300 font-mono text-[11px] p-3 rounded-xl border border-white/5"
                    />
                    <button
                      onClick={() => downloadTextFile('private_key.pem', rsaKeyPair.privateKeyPem)}
                      className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest"
                    >
                      Download private_key.pem
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RSA Encrypt / Decrypt Form */}
          {rsaMode !== 'generate' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">
                    {rsaMode === 'encrypt' ? 'Plaintext to Encrypt' : 'RSA Encrypted Text Payload'}
                  </label>
                  <textarea
                    value={rsaInputText}
                    onChange={(e) => setRsaInputText(e.target.value)}
                    rows={8}
                    placeholder="Enter text..."
                    className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl p-4 text-xs font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">
                    {rsaMode === 'encrypt' ? 'Recipient\'s Public Key (PEM)' : 'Your Private Key (PEM)'}
                  </label>
                  <textarea
                    value={rsaMode === 'encrypt' ? rsaPublicKeyInput : rsaPrivateKeyInput}
                    onChange={(e) => rsaMode === 'encrypt' ? setRsaPublicKeyInput(e.target.value) : setRsaPrivateKeyInput(e.target.value)}
                    rows={8}
                    placeholder="-----BEGIN PUBLIC/PRIVATE KEY----- ..."
                    className="w-full bg-[#12141a] text-amber-300 border border-white/5 rounded-xl p-4 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleRSAProcess}
                disabled={isProcessing}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow cursor-pointer"
              >
                {rsaMode === 'encrypt' ? 'Encrypt with RSA Public Key' : 'Decrypt with RSA Private Key'}
              </button>

              {rsaOutputResult && (
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                      RSA Processed Output
                    </span>
                    <button
                      onClick={() => copyToClipboard(rsaOutputResult, 'rsaOut')}
                      className="text-xs font-bold text-amber-400 hover:underline"
                    >
                      {copiedField === 'rsaOut' ? 'Copied!' : 'Copy Result'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    value={rsaOutputResult}
                    rows={6}
                    className="w-full bg-[#12141a] text-amber-300 font-mono text-xs p-4 rounded-xl border border-white/5"
                  />
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          MODULE 3: ZERO-WIDTH UNICODE STEGANOGRAPHY
          ========================================================================= */}
      {activeTab === 'stego' && (
        <div className="bg-[#0d0f14] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-white/5">
            <button
              onClick={() => setStegoMode('encode')}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center space-x-1.5 cursor-pointer ${
                stegoMode === 'encode' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Conceal Invisible Text</span>
            </button>
            <button
              onClick={() => setStegoMode('decode')}
              className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center space-x-1.5 cursor-pointer ${
                stegoMode === 'decode' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Extract Hidden Payload</span>
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              Steganography encodes your secret text payload into <strong>Zero-Width Unicode characters</strong> (\u200B, \u200C, \uFEFF) embedded inside normal cover text. To humans and word processors, the cover text looks completely ordinary!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">
                  {stegoMode === 'encode' ? 'Public Cover Text (Innocuous Article/Memo)' : 'Text Containing Hidden Payload'}
                </label>
                <textarea
                  value={stegoMode === 'encode' ? stegoCoverText : stegoResultText || stegoCoverText}
                  onChange={(e) => stegoMode === 'encode' ? setStegoCoverText(e.target.value) : setStegoResultText(e.target.value)}
                  rows={6}
                  className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl p-4 text-xs font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">
                  {stegoMode === 'encode' ? 'Secret Text to Conceal Invisibly' : 'Extracted Secret Message'}
                </label>
                <textarea
                  value={stegoSecretText}
                  onChange={(e) => setStegoSecretText(e.target.value)}
                  rows={6}
                  placeholder="Type secret password, token, or coordinates..."
                  className="w-full bg-[#12141a] text-amber-300 border border-white/5 rounded-xl p-4 text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleStegoProcess}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow cursor-pointer"
            >
              {stegoMode === 'encode' ? 'Conceal Message in Cover Text' : 'Extract Hidden Steganographic Message'}
            </button>

            {stegoResultText && stegoMode === 'encode' && (
              <div className="space-y-2 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                    Cover Text with Invisible Zero-Width Payload
                  </span>
                  <button
                    onClick={() => copyToClipboard(stegoResultText, 'stegoOut')}
                    className="text-xs font-bold text-amber-400 hover:underline"
                  >
                    {copiedField === 'stegoOut' ? 'Copied!' : 'Copy Cover Text'}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={stegoResultText}
                  rows={4}
                  className="w-full bg-[#12141a] text-emerald-300 font-mono text-xs p-4 rounded-xl border border-white/5"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 4: CRYPTOGRAPHIC HASH & HMAC VERIFIER
          ========================================================================= */}
      {activeTab === 'hashes' && (
        <div className="bg-[#0d0f14] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-white text-base">Cryptographic Hash & Integrity Verifier</h3>
            <p className="text-xs text-gray-400">
              Calculate deterministic cryptographic digests (SHA-256, SHA-512) and HMAC signatures to verify that text files have not been modified or tampered with.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">
                Input Text to Hash
              </label>
              <textarea
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                rows={4}
                placeholder="Type or paste document content..."
                className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl p-4 text-xs font-mono focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">
                  Optional HMAC Secret Key
                </label>
                <input
                  type="text"
                  value={hashHmacKey}
                  onChange={(e) => setHashHmacKey(e.target.value)}
                  placeholder="Enter HMAC signing key..."
                  className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl p-3 text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">
                  Compare with Target Checksum
                </label>
                <input
                  type="text"
                  value={verifyTargetHash}
                  onChange={(e) => setVerifyTargetHash(e.target.value)}
                  placeholder="Paste SHA-256 hash to compare..."
                  className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl p-3 text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleComputeHashes}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow cursor-pointer"
            >
              Compute Hashes & Verify Integrity
            </button>

            {computedSha256 && (
              <div className="space-y-3 pt-4 border-t border-white/5">
                {verifyMatchResult !== null && (
                  <div className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 ${
                    verifyMatchResult
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}>
                    {verifyMatchResult ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>{verifyMatchResult ? 'MATCH CONFIRMED: File is authentic and unaltered.' : 'CHECKSUM MISMATCH: Content has been modified or corrupted!'}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-mono">SHA-256:</span>
                    <button onClick={() => copyToClipboard(computedSha256, 'sha256')} className="text-amber-400 hover:underline">Copy</button>
                  </div>
                  <div className="p-3 bg-[#12141a] text-amber-300 font-mono text-xs rounded-xl border border-white/5 break-all">
                    {computedSha256}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-mono">SHA-512:</span>
                    <button onClick={() => copyToClipboard(computedSha512, 'sha512')} className="text-amber-400 hover:underline">Copy</button>
                  </div>
                  <div className="p-3 bg-[#12141a] text-amber-300 font-mono text-xs rounded-xl border border-white/5 break-all">
                    {computedSha512}
                  </div>
                </div>

                {computedHmac && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400 font-mono">HMAC-SHA256 Signature:</span>
                      <button onClick={() => copyToClipboard(computedHmac, 'hmac')} className="text-amber-400 hover:underline">Copy</button>
                    </div>
                    <div className="p-3 bg-[#12141a] text-emerald-300 font-mono text-xs rounded-xl border border-white/5 break-all">
                      {computedHmac}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 5: BATCH FILE PROCESSOR
          ========================================================================= */}
      {activeTab === 'batch' && (
        <div className="bg-[#0d0f14] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <h3 className="font-serif font-bold text-white text-base">Batch .txt File Processor</h3>
              <p className="text-xs text-gray-400">
                Bulk encrypt or decrypt multiple text files simultaneously with queue tracking.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setBatchMode('encrypt')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest ${
                  batchMode === 'encrypt' ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-400'
                }`}
              >
                Batch Encrypt
              </button>
              <button
                onClick={() => setBatchMode('decrypt')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest ${
                  batchMode === 'decrypt' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-400'
                }`}
              >
                Batch Decrypt
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">
                  Batch Secret Password Key
                </label>
                <input
                  type="password"
                  value={batchKey}
                  onChange={(e) => setBatchKey(e.target.value)}
                  placeholder="Enter secret password key..."
                  className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl p-3 text-xs font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-end">
                <input
                  ref={batchFileInputRef}
                  type="file"
                  multiple
                  accept=".txt,text/plain"
                  onChange={handleBatchUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => batchFileInputRef.current?.click()}
                  className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Select Multiple .txt Files</span>
                </button>
              </div>
            </div>

            {batchFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Queued Files ({batchFiles.length}):</span>
                  <button
                    onClick={() => setBatchFiles([])}
                    className="text-rose-400 hover:underline"
                  >
                    Clear Queue
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {batchFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 bg-[#12141a] border border-white/5 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <div className="font-bold text-white">{file.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{file.size} bytes</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                          file.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : file.status === 'error'
                            ? 'bg-rose-500/20 text-rose-400'
                            : file.status === 'processing'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-white/5 text-gray-400'
                        }`}>
                          {file.status}
                        </span>

                        {file.result && (
                          <button
                            onClick={() => downloadTextFile(file.name.replace('.txt', '') + (batchMode === 'encrypt' ? '_ENCRYPTED.txt' : '_DECRYPTED.txt'), file.result!)}
                            className="p-1.5 bg-amber-500 text-black rounded hover:bg-amber-400 cursor-pointer"
                            title="Download result"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleRunBatch}
                  disabled={isBatchProcessing}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow cursor-pointer"
                >
                  {isBatchProcessing ? 'Processing Queue...' : `Start Batch ${batchMode.toUpperCase()} (${batchFiles.length} files)`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 6: DIGITAL SHREDDER & MEMORY SANITIZER
          ========================================================================= */}
      {activeTab === 'shredder' && (
        <div className="bg-[#0d0f14] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-white text-base">Digital Shredder & Cryptographic Memory Sanitizer</h3>
            <p className="text-xs text-gray-400">
              Implements <strong>DoD 5220.22-M</strong> and <strong>NIST 800-88</strong> compliant multi-pass memory overwriting to permanently obliterate sensitive text content before closing your session.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-1">
                Confidential Text to Obliterate
              </label>
              <textarea
                value={shredInput}
                onChange={(e) => setShredInput(e.target.value)}
                rows={6}
                placeholder="Paste keys, passwords, or secret memos to securely shred..."
                className="w-full bg-[#12141a] text-white border border-rose-500/20 rounded-xl p-4 text-xs font-mono focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="text-gray-400 font-bold uppercase tracking-widest">Sanitization Passes:</span>
              <select
                value={shredPasses}
                onChange={(e) => setShredPasses(Number(e.target.value))}
                className="bg-[#12141a] text-rose-400 border border-white/5 px-3 py-1.5 rounded-lg font-bold focus:outline-none cursor-pointer"
              >
                <option value={1}>1-Pass (NIST 800-88 Zero Fill)</option>
                <option value={3}>3-Pass (DoD 5220.22-M Standard)</option>
                <option value={7}>7-Pass (Gutmann High-Security Noise)</option>
              </select>
            </div>

            <button
              onClick={handleShred}
              disabled={isProcessing}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow cursor-pointer flex items-center justify-center space-x-2"
            >
              <Flame className="w-4 h-4" />
              <span>{isProcessing ? 'Sanitizing...' : 'Permanently Shred & Wipe from Memory'}</span>
            </button>

            {shredResult && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sanitization Verification Certificate</span>
                </div>
                <div className="text-gray-400 font-mono text-[11px]">
                  <div>Bytes Overwritten: {shredResult.shreddedLength}</div>
                  <div>Completed Passes: {shredResult.passesCompleted}</div>
                  <div>Final Entropy Hash: {shredResult.finalHash.substring(0, 32)}...</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
