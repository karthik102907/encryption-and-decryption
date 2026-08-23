import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Lock,
  Unlock,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Eye,
  Plus,
  Upload,
  Trash2,
  Fingerprint,
  Clock,
  Flame,
  Check,
  Copy,
} from 'lucide-react';
import { User, FileItem, EncryptionAlgorithm } from '../types';
import { fetchFilesApi, uploadFileApi, deleteFileApi, recordFileViewApi, verifyFileIntegrityApi } from '../lib/api';
import { decryptTextAdvanced, encryptTextAdvanced, downloadTextFile } from '../lib/crypto';

interface UserDashboardProps {
  currentUser: User;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Decryption Drawer/Modal State
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [decryptedOutput, setDecryptedOutput] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isIntegrityVerified, setIsIntegrityVerified] = useState<boolean | null>(null);
  const [isVerifyingIntegrity, setIsVerifyingIntegrity] = useState(false);

  // Upload Personal File State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [personalFilename, setPersonalFilename] = useState('');
  const [personalContent, setPersonalContent] = useState('');
  const [encryptPersonal, setEncryptPersonal] = useState(true);
  const [personalAlgorithm, setPersonalAlgorithm] = useState<EncryptionAlgorithm>('AES-256-GCM');
  const [personalPassword, setPersonalPassword] = useState('');
  const [personalExpiry, setPersonalExpiry] = useState('');
  const [personalMaxViews, setPersonalMaxViews] = useState<number | undefined>(undefined);

  const userFileInputRef = useRef<HTMLInputElement>(null);

  // Load files authorized for this user
  const loadUserFiles = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchFilesApi();
      setFiles(data.files);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch authorized text files.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserFiles();
  }, []);

  // Handle Opening and Recording View
  const handleOpenFile = async (file: FileItem) => {
    setSelectedFile(file);
    setDecryptPassword('');
    setDecryptedOutput(null);
    setDecryptError(null);
    setIsIntegrityVerified(null);

    // Record view on server
    try {
      await recordFileViewApi(file.id);
    } catch (e) {
      // Non-blocking
    }
  };

  // Verify File Integrity Checksum
  const handleVerifyIntegrity = async (fileId: string) => {
    setIsVerifyingIntegrity(true);
    try {
      const res = await verifyFileIntegrityApi(fileId);
      setIsIntegrityVerified(res.isValid);
      if (res.isValid) {
        setSuccessMsg('✅ SHA-256 Checksum Verified: File content matches the exact uploaded version with zero tampering!');
      } else {
        setErrorMsg('⚠️ Integrity Alert: The current file content hash does not match original stored checksum!');
      }
    } catch (err: any) {
      setErrorMsg(`Integrity verification failed: ${err.message}`);
    } finally {
      setIsVerifyingIntegrity(false);
    }
  };

  // Handle Decryption of Selected File
  const handleDecryptFile = async () => {
    if (!selectedFile) return;
    setDecryptError(null);
    setDecryptedOutput(null);

    if (!selectedFile.isEncrypted) {
      // If plaintext, show directly
      setDecryptedOutput(selectedFile.content);
      return;
    }

    if (!decryptPassword.trim()) {
      setDecryptError('Please enter the secret password key to unlock this file.');
      return;
    }

    setIsDecrypting(true);

    try {
      const result = await decryptTextAdvanced(selectedFile.content, decryptPassword);
      if (result.success) {
        setDecryptedOutput(result.plainText);
        setSuccessMsg(`🔓 Successfully unlocked "${selectedFile.filename}" (${result.algorithmUsed || 'AES-256'})!`);
      } else {
        setDecryptError(result.error || 'Decryption failed. Please check your password.');
      }
    } catch (err: any) {
      setDecryptError(`Decryption error: ${err.message}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  // Download raw or decrypted file
  const handleDownloadDecrypted = () => {
    if (!selectedFile) return;
    const contentToDownload = decryptedOutput || selectedFile.content;
    const downloadName = selectedFile.filename.replace('.txt', '') + '_UNLOCKED.txt';
    downloadTextFile(downloadName, contentToDownload);
  };

  // Handle uploading personal file
  const handlePersonalUploadSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPersonalFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPersonalContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleSavePersonalFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personalFilename.trim() || !personalContent.trim()) {
      setErrorMsg('Please enter a filename and content.');
      return;
    }

    setIsLoading(true);
    try {
      let finalContent = personalContent;
      let finalIsEncrypted = false;

      if (encryptPersonal) {
        if (!personalPassword.trim()) {
          setErrorMsg('Please enter a secret key password to lock your personal file.');
          setIsLoading(false);
          return;
        }
        const res = await encryptTextAdvanced(personalContent, personalPassword, personalAlgorithm);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to encrypt personal file.');
          setIsLoading(false);
          return;
        }
        finalContent = res.encryptedText;
        finalIsEncrypted = true;
      }

      await uploadFileApi(
        finalContent,
        personalFilename,
        finalIsEncrypted,
        [currentUser.id], // Authorized for self
        'Personal encrypted text document',
        encryptPersonal ? personalAlgorithm : undefined,
        personalExpiry ? new Date(personalExpiry).toISOString() : null,
        personalMaxViews ? Number(personalMaxViews) : null
      );

      setSuccessMsg(`Saved personal file "${personalFilename}"!`);
      setIsUploadOpen(false);
      setPersonalFilename('');
      setPersonalContent('');
      setPersonalPassword('');
      setPersonalExpiry('');
      setPersonalMaxViews(undefined);
      loadUserFiles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save personal file.');
    } finally {
      setIsLoading(false);
    }
  };

  // Separate files into Admin-authorized vs Personal
  const adminAuthorizedFiles = files.filter((f) => f.uploaderRole === 'admin');
  const myPersonalFiles = files.filter((f) => f.uploaderId === currentUser.id);

  return (
    <div id="user-dashboard-page" className="space-y-8 py-6">
      
      {/* Header Banner */}
      <div className="bg-[#0d0f14] border border-white/5 text-white p-6 sm:p-8 rounded-2xl shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl shadow-lg shadow-amber-500/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                Data Owner Security Vault
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">
                Welcome back, <strong className="text-amber-500">{currentUser.name}</strong>. Here are the encrypted text assets assigned to your account.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Encrypted Note</span>
            </button>

            <button
              onClick={loadUserFiles}
              disabled={isLoading}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg transition-colors text-xs font-bold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex items-center space-x-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center space-x-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SECTION 1: ADMIN AUTHORIZED FILES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <span>Files Authorized for You by Admin ({adminAuthorizedFiles.length})</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminAuthorizedFiles.length === 0 ? (
            <div className="col-span-2 p-8 bg-[#0d0f14] border border-white/5 rounded-2xl text-center text-gray-500 text-xs">
              No files currently assigned by Administrator for your account.
            </div>
          ) : (
            adminAuthorizedFiles.map((file) => (
              <div
                key={file.id}
                className="bg-[#0d0f14] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white text-sm leading-tight">
                      {file.filename}
                    </span>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      {file.algorithm && (
                        <span className="px-2 py-0.5 bg-white/5 text-amber-400 border border-white/10 rounded text-[9px] font-mono font-bold">
                          {file.algorithm}
                        </span>
                      )}
                      {file.isEncrypted ? (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20 text-[10px] font-bold uppercase tracking-widest flex items-center space-x-1">
                          <Lock className="w-3 h-3" />
                          <span>Encrypted</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-white/5 text-gray-400 rounded border border-white/5 text-[10px] font-bold uppercase tracking-widest">
                          Plaintext
                        </span>
                      )}
                    </div>
                  </div>

                  {file.description && (
                    <p className="text-xs text-gray-400">{file.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 font-mono pt-1">
                    <span>From: {file.uploaderName}</span>
                    <span>•</span>
                    <span>Size: {file.size} bytes</span>
                    {file.maxViews && (
                      <>
                        <span>•</span>
                        <span className="text-amber-400 flex items-center space-x-1">
                          <Flame className="w-3 h-3" />
                          <span>Views: {file.viewCount || 0}/{file.maxViews}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenFile(file)}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold uppercase tracking-widest transition-colors shadow flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{file.isEncrypted ? 'Unlock & View File' : 'View Plaintext File'}</span>
                  </button>

                  <button
                    onClick={() => handleVerifyIntegrity(file.id)}
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg transition-colors cursor-pointer"
                    title="Verify SHA-256 Checksum"
                  >
                    <Fingerprint className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => downloadTextFile(file.filename, file.content)}
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg transition-colors cursor-pointer"
                    title="Download .txt file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 2: MY PERSONAL FILES */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-white flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-amber-500" />
            <span>My Personal Encrypted Files ({myPersonalFiles.length})</span>
          </h2>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="text-xs text-amber-400 font-bold uppercase tracking-widest hover:underline"
          >
            + Create New Personal File
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myPersonalFiles.length === 0 ? (
            <div className="col-span-2 p-8 bg-[#0d0f14] border border-white/5 rounded-2xl text-center text-gray-500 text-xs">
              You haven't uploaded any personal notes yet. Click "+ Create New Personal File" above!
            </div>
          ) : (
            myPersonalFiles.map((file) => (
              <div
                key={file.id}
                className="bg-[#0d0f14] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-white text-sm">{file.filename}</span>
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase tracking-widest">
                      Personal
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{file.description || 'Private note'}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenFile(file)}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-bold uppercase tracking-widest transition-colors shadow flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>View / Unlock Note</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (confirm(`Delete personal file "${file.filename}"?`)) {
                        await deleteFileApi(file.id);
                        loadUserFiles();
                      }
                    }}
                    className="p-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg hover:bg-rose-500/20 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* UNLOCK / VIEW FILE MODAL */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0f14] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <span>{selectedFile.filename}</span>
                </h3>
                <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                  <span>{selectedFile.isEncrypted ? `🔒 Secured with ${selectedFile.algorithm || 'AES-256'}` : 'Plaintext file'}</span>
                  {selectedFile.sha256Checksum && (
                    <span className="text-[10px] text-gray-500 font-mono">
                      (SHA256: {selectedFile.sha256Checksum.substring(0, 8)}...)
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-400 hover:text-white font-bold text-xs uppercase tracking-widest cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* If file is encrypted and not yet unlocked */}
            {selectedFile.isEncrypted && !decryptedOutput && (
              <div className="space-y-4">
                <div className="p-4 bg-[#12141a] border border-white/5 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-amber-500 uppercase tracking-widest">
                    🔒 Enter Secret Password to Unlock:
                  </p>
                  <p className="text-gray-400">
                    This text file is encrypted using {selectedFile.algorithm || 'AES-256'}. Please type the secret password key to unlock its contents.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
                    Secret Password Key
                  </label>
                  <input
                    type="password"
                    value={decryptPassword}
                    onChange={(e) => setDecryptPassword(e.target.value)}
                    placeholder="Enter password key..."
                    className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {decryptError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold">
                    {decryptError}
                  </div>
                )}

                <button
                  onClick={handleDecryptFile}
                  disabled={isDecrypting}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{isDecrypting ? 'Unlocking...' : 'Unlock & Decrypt Text'}</span>
                </button>
              </div>
            )}

            {/* Display Decrypted / Unlocked Output */}
            {(decryptedOutput !== null || !selectedFile.isEncrypted) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                    Unlocked Text Contents:
                  </span>
                  <button
                    onClick={handleDownloadDecrypted}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold uppercase tracking-widest transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .txt File</span>
                  </button>
                </div>

                <div className="p-4 bg-[#12141a] text-amber-300 font-mono text-xs rounded-xl border border-white/5 max-h-64 overflow-y-auto whitespace-pre-wrap">
                  {decryptedOutput || selectedFile.content}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CREATE PERSONAL FILE MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0f14] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
            <h3 className="text-lg font-serif font-bold text-white flex items-center space-x-2">
              <Plus className="w-5 h-5 text-amber-500" />
              <span>Create New Encrypted Text File</span>
            </h3>

            <form onSubmit={handleSavePersonalFile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
                  File Name (.txt)
                </label>
                <input
                  type="text"
                  required
                  value={personalFilename}
                  onChange={(e) => setPersonalFilename(e.target.value)}
                  placeholder="my_private_diary.txt"
                  className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                    Text Content
                  </label>
                  <input
                    ref={userFileInputRef}
                    type="file"
                    accept=".txt,text/plain"
                    onChange={handlePersonalUploadSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => userFileInputRef.current?.click()}
                    className="text-xs text-amber-400 font-bold hover:underline"
                  >
                    📁 Select .txt
                  </button>
                </div>
                <textarea
                  required
                  value={personalContent}
                  onChange={(e) => setPersonalContent(e.target.value)}
                  rows={4}
                  placeholder="Type secret personal notes..."
                  className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="p-3 bg-[#12141a] border border-white/5 rounded-xl space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={encryptPersonal}
                    onChange={(e) => setEncryptPersonal(e.target.checked)}
                    className="w-4 h-4 text-amber-500 bg-black/50 border-white/10 rounded focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-500">
                    Encrypt with Military-Grade Cipher
                  </span>
                </label>

                {encryptPersonal && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Algorithm:</span>
                      <select
                        value={personalAlgorithm}
                        onChange={(e) => setPersonalAlgorithm(e.target.value as any)}
                        className="bg-[#0d0f14] text-amber-400 border border-white/5 rounded px-2 py-1 text-xs font-bold focus:outline-none"
                      >
                        <option value="AES-256-GCM">AES-256-GCM (Authenticated)</option>
                        <option value="AES-256-CBC">AES-256-CBC (PKCS7)</option>
                      </select>
                    </div>

                    <input
                      type="password"
                      value={personalPassword}
                      onChange={(e) => setPersonalPassword(e.target.value)}
                      placeholder="Enter secret key password..."
                      className="w-full bg-[#0d0f14] text-white border border-white/5 rounded-lg px-2.5 py-2 text-xs font-mono focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs uppercase tracking-widest shadow transition-colors cursor-pointer"
                >
                  Save File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
