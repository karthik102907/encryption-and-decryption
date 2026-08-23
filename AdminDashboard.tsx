import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Lock,
  FileText,
  Upload,
  UserCheck,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  KeyRound,
  Eye,
  Clock,
  Users,
  ShieldAlert,
  Fingerprint,
  Flame,
  Download,
  Filter,
} from 'lucide-react';
import { User, FileItem, AuditLog, EncryptionAlgorithm } from '../types';
import {
  fetchAllUsersApi,
  fetchFilesApi,
  uploadFileApi,
  updateAuthorizationApi,
  deleteFileApi,
  fetchAuditLogsApi,
  verifyFileIntegrityApi,
} from '../lib/api';
import { encryptTextAdvanced, downloadTextFile } from '../lib/crypto';

interface AdminDashboardProps {
  currentUser: User;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'files' | 'upload' | 'users' | 'audit'>('files');

  const [files, setFiles] = useState<FileItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditFilter, setAuditFilter] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload Form State
  const [newFilename, setNewFilename] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [encryptOnUpload, setEncryptOnUpload] = useState(true);
  const [uploadAlgorithm, setUploadAlgorithm] = useState<EncryptionAlgorithm>('AES-256-GCM');
  const [encryptPassword, setEncryptPassword] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [maxViews, setMaxViews] = useState<number | undefined>(undefined);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [uploadedFileObj, setUploadedFileObj] = useState<File | null>(null);

  // File View & Edit Authorization Drawer/Modal
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [editAuthUserIds, setEditAuthUserIds] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load all admin data
  const loadAdminData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [filesData, usersData, auditData] = await Promise.all([
        fetchFilesApi(),
        fetchAllUsersApi(),
        fetchAuditLogsApi(),
      ]);
      setFiles(filesData.files);
      setUsers(usersData.users.filter((u) => u.role === 'user')); // Filter regular users for authorization
      setAuditLogs(auditData.auditLogs);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load admin dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Handle uploading file from device in Admin form
  const handleAdminFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileObj(file);
    setNewFilename(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewContent(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  // Submit Upload File & Authorize
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newFilename.trim()) {
      setErrorMsg('Please enter a filename.');
      return;
    }

    if (!newContent.trim() && !uploadedFileObj) {
      setErrorMsg('Please enter text content or select a .txt file.');
      return;
    }

    setIsLoading(true);

    try {
      let finalContent = newContent;
      let finalIsEncrypted = false;

      if (encryptOnUpload) {
        if (!encryptPassword.trim()) {
          setErrorMsg('Please enter an encryption key password to encrypt before upload.');
          setIsLoading(false);
          return;
        }
        const encResult = await encryptTextAdvanced(newContent, encryptPassword, uploadAlgorithm);
        if (!encResult.success) {
          setErrorMsg(encResult.error || 'Encryption failed.');
          setIsLoading(false);
          return;
        }
        finalContent = encResult.encryptedText;
        finalIsEncrypted = true;
      }

      await uploadFileApi(
        finalContent,
        newFilename,
        finalIsEncrypted,
        selectedUserIds,
        newDescription,
        encryptOnUpload ? uploadAlgorithm : undefined,
        expiryDate ? new Date(expiryDate).toISOString() : null,
        maxViews ? Number(maxViews) : null
      );

      setSuccessMsg(`Text file "${newFilename}" uploaded and authorized for selected users!`);

      // Reset form
      setNewFilename('');
      setNewContent('');
      setNewDescription('');
      setEncryptOnUpload(true);
      setEncryptPassword('');
      setExpiryDate('');
      setMaxViews(undefined);
      setSelectedUserIds([]);
      setUploadedFileObj(null);

      // Refresh list
      loadAdminData();
      setActiveSubTab('files');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload text file.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle user assignment in multi-select checkboxes
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Verify file integrity
  const handleVerifyIntegrity = async (fileId: string, filename: string) => {
    try {
      const res = await verifyFileIntegrityApi(fileId);
      if (res.isValid) {
        setSuccessMsg(`✅ Integrity Verified for "${filename}": SHA-256 checksum confirmed (${res.currentChecksum.substring(0, 12)}...)`);
      } else {
        setErrorMsg(`⚠️ Integrity Mismatch for "${filename}": Hash verification failed!`);
      }
    } catch (err: any) {
      setErrorMsg(`Verification error: ${err.message}`);
    }
  };

  // Save updated user authorizations for existing file
  const handleSaveAuthorizations = async () => {
    if (!editingFile) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await updateAuthorizationApi(editingFile.id, editAuthUserIds);
      setSuccessMsg(`Authorizations updated for "${editingFile.filename}".`);
      setEditingFile(null);
      loadAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update authorizations.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete File
  const handleDeleteFile = async (fileId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete file "${filename}"?`)) return;
    setIsLoading(true);
    try {
      await deleteFileApi(fileId);
      setSuccessMsg(`Deleted "${filename}".`);
      loadAdminData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete file.');
    } finally {
      setIsLoading(false);
    }
  };

  // Export Audit Logs to JSON
  const handleExportAuditLogs = () => {
    const jsonStr = JSON.stringify(auditLogs, null, 2);
    downloadTextFile(`audit_logs_${new Date().toISOString().slice(0, 10)}.json`, jsonStr);
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (auditFilter === 'ALL') return true;
    return log.action === auditFilter;
  });

  return (
    <div id="admin-dashboard-page" className="space-y-8 py-6">
      
      {/* Top Banner */}
      <div className="bg-[#0d0f14] border border-white/5 text-white p-6 sm:p-8 rounded-2xl shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl shadow-lg shadow-amber-500/10">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                Security Operations & RBAC Center
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">
                Upload encrypted text assets, assign multi-user access permissions, verify SHA-256 digests, and inspect forensic audit trails.
              </p>
            </div>
          </div>

          <button
            onClick={loadAdminData}
            disabled={isLoading}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg transition-colors flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Vault</span>
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-white/5">
          <button
            onClick={() => setActiveSubTab('files')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'files'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Vault Files ({files.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('upload')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'upload'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload & Assign</span>
          </button>

          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'users'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users Directory ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 cursor-pointer ${
              activeSubTab === 'audit'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Forensic Audit Trail ({auditLogs.length})</span>
          </button>
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

      {/* SUB-TAB 1: AUTHORIZED FILES MATRIX */}
      {activeSubTab === 'files' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-bold text-white">Cryptographic Vault & Access Permissions</h2>
            <button
              onClick={() => setActiveSubTab('upload')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold uppercase tracking-widest flex items-center space-x-1.5 shadow transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Encrypted File</span>
            </button>
          </div>

          <div className="bg-[#0d0f14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#12141a] text-[10px] uppercase font-bold tracking-widest text-amber-500 border-b border-white/5">
                  <tr>
                    <th className="p-4">File Name / Description</th>
                    <th className="p-4">Cipher / Algorithm</th>
                    <th className="p-4">Authorized Users</th>
                    <th className="p-4">Integrity & TTL</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {files.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No text files found in vault. Click "Upload & Assign" to add one.
                      </td>
                    </tr>
                  ) : (
                    files.map((f) => {
                      const authUserNames = f.authorizedUserIds
                        .map((id) => users.find((u) => u.id === id)?.name || id)
                        .join(', ');

                      return (
                        <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-medium text-white">
                            <div className="flex items-start space-x-3">
                              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold">{f.filename}</div>
                                {f.description && (
                                  <div className="text-[11px] text-gray-400 font-normal">{f.description}</div>
                                )}
                                <div className="text-[10px] text-gray-500 font-mono">By: {f.uploaderName} • {f.size} bytes</div>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            {f.isEncrypted ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-widest border border-amber-500/20">
                                <Lock className="w-3 h-3" />
                                <span>{f.algorithm || 'AES-256'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-widest border border-white/5">
                                <span>Plaintext (.txt)</span>
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-xs font-mono">
                            {f.authorizedUserIds.length > 0 ? (
                              <span className="text-emerald-400 font-medium">
                                {authUserNames} ({f.authorizedUserIds.length})
                              </span>
                            ) : (
                              <span className="text-rose-400 italic">No Users Authorized</span>
                            )}
                          </td>

                          <td className="p-4 text-xs font-mono">
                            <div className="space-y-1">
                              {f.sha256Checksum && (
                                <div className="text-[10px] text-gray-400">
                                  SHA: <span className="text-amber-400">{f.sha256Checksum.substring(0, 8)}...</span>
                                </div>
                              )}
                              {f.maxViews && (
                                <div className="text-[10px] text-rose-400 flex items-center space-x-1">
                                  <Flame className="w-3 h-3" />
                                  <span>Views: {f.viewCount || 0}/{f.maxViews}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="p-4 text-right space-x-1.5">
                            <button
                              onClick={() => handleVerifyIntegrity(f.id, f.filename)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg transition-colors cursor-pointer"
                              title="Verify Integrity Checksum"
                            >
                              <Fingerprint className="w-4 h-4 text-amber-400" />
                            </button>

                            <button
                              onClick={() => {
                                setPreviewFile(f);
                              }}
                              className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg transition-colors cursor-pointer"
                              title="Preview Content"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setEditingFile(f);
                                setEditAuthUserIds([...f.authorizedUserIds]);
                              }}
                              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                            >
                              Edit RBAC
                            </button>

                            <button
                              onClick={() => handleDeleteFile(f.id, f.filename)}
                              className="p-1.5 text-gray-500 hover:text-rose-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                              title="Delete file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: UPLOAD & AUTHORIZE FORM */}
      {activeSubTab === 'upload' && (
        <div className="bg-[#0d0f14] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-3xl mx-auto">
          <div>
            <h2 className="text-xl font-serif font-bold text-white flex items-center space-x-2">
              <Upload className="w-5 h-5 text-amber-500" />
              <span>Upload Text Asset & Configure RBAC</span>
            </h2>
            <p className="text-xs text-gray-400">
              Select an algorithm, enter expiration policies, and authorize specific registered users.
            </p>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
                File Name (.txt)
              </label>
              <input
                type="text"
                required
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                placeholder="classified_briefing.txt"
                className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                  File Text Content
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  onChange={handleAdminFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-amber-400 hover:underline font-bold"
                >
                  📁 Select .txt file from device
                </button>
              </div>

              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={6}
                placeholder="Type or paste confidential text here..."
                className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
                Description / Purpose
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief summary of document..."
                className="w-full bg-[#12141a] text-white border border-white/5 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Cryptographic Options */}
            <div className="bg-[#12141a] border border-white/5 p-4 rounded-xl space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={encryptOnUpload}
                  onChange={(e) => setEncryptOnUpload(e.target.checked)}
                  className="w-4 h-4 text-amber-500 bg-black/50 border-white/10 rounded focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Encrypt this file before saving to server</span>
                </span>
              </label>

              {encryptOnUpload && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Encryption Cipher
                    </label>
                    <select
                      value={uploadAlgorithm}
                      onChange={(e) => setUploadAlgorithm(e.target.value as any)}
                      className="w-full bg-[#0d0f14] text-amber-400 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none"
                    >
                      <option value="AES-256-GCM">AES-256-GCM (Authenticated)</option>
                      <option value="AES-256-CBC">AES-256-CBC (PKCS7)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Secret Password Key
                    </label>
                    <input
                      type="password"
                      value={encryptPassword}
                      onChange={(e) => setEncryptPassword(e.target.value)}
                      placeholder="Enter secret key..."
                      className="w-full bg-[#0d0f14] text-white border border-white/5 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Expiration & Max Views */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#12141a] border border-white/5 p-4 rounded-xl">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Optional Expiry Date
                </label>
                <input
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-[#0d0f14] text-gray-300 border border-white/5 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Max View Count (Self-Destruct)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={maxViews || ''}
                  onChange={(e) => setMaxViews(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 5 views"
                  className="w-full bg-[#0d0f14] text-gray-300 border border-white/5 rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* User Authorization Selection */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                Authorize Specific Registered Users (RBAC)
              </label>
              <div className="bg-[#12141a] p-4 rounded-xl border border-white/5 space-y-2 max-h-48 overflow-y-auto">
                {users.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No registered users available yet.</p>
                ) : (
                  users.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(u.id)}
                          onChange={() => toggleUserSelection(u.id)}
                          className="w-4 h-4 text-amber-500 bg-black/50 border-white/10 rounded focus:ring-amber-500"
                        />
                        <span className="text-xs font-medium text-white">
                          {u.name} (<span className="font-mono text-gray-400">{u.username}</span>)
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">ID: {u.id}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Save & Authorize Text File</span>
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: REGISTERED USERS LIST */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-white">Registered Users & Role Matrix</h2>
          <div className="bg-[#0d0f14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((u) => {
                const assignedCount = files.filter((f) => f.authorizedUserIds.includes(u.id)).length;
                return (
                  <div
                    key={u.id}
                    className="p-4 bg-[#12141a] rounded-xl border border-white/5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{u.name}</span>
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-widest rounded">
                        Data Owner
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">Username: @{u.username}</div>
                    <div className="text-xs text-emerald-400 font-medium">
                      🔑 {assignedCount} Vault File(s) Assigned
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SYSTEM AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-serif font-bold text-white">Security & Access Audit Trail</h2>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 bg-[#12141a] px-3 py-1.5 rounded-lg border border-white/5 text-xs">
                <Filter className="w-3.5 h-3.5 text-amber-500" />
                <select
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  className="bg-transparent text-amber-400 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#0d0f14] text-white">All Actions</option>
                  <option value="USER_LOGIN" className="bg-[#0d0f14] text-white">Logins</option>
                  <option value="FILE_UPLOAD" className="bg-[#0d0f14] text-white">Uploads</option>
                  <option value="FILE_DECRYPT" className="bg-[#0d0f14] text-white">Decryptions</option>
                  <option value="ACCESS_GRANTED" className="bg-[#0d0f14] text-white">Access Granted</option>
                  <option value="FILE_VERIFY" className="bg-[#0d0f14] text-white">Verifications</option>
                </select>
              </div>

              <button
                onClick={handleExportAuditLogs}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs uppercase tracking-widest transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          <div className="bg-[#0d0f14] border border-white/5 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center p-8 text-gray-500 text-xs">No audit logs matching criteria.</div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-[#12141a] rounded-xl border border-white/5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold rounded text-[10px] font-mono">
                        {log.action}
                      </span>
                      <span className="font-bold text-white">
                        By: {log.performedBy} ({log.role})
                      </span>
                    </div>
                    <div className="text-gray-300">{log.details}</div>
                  </div>
                  <div className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PREVIEW CONTENT MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0f14] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-serif font-bold text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <span>{previewFile.filename}</span>
                </h3>
                <div className="text-xs text-gray-400 mt-1">
                  <span>{previewFile.isEncrypted ? `Encrypted with ${previewFile.algorithm || 'AES-256'}` : 'Plaintext Document'}</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-gray-400 hover:text-white font-bold text-xs uppercase tracking-widest"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 bg-[#12141a] text-amber-300 font-mono text-xs rounded-xl border border-white/5 max-h-64 overflow-y-auto whitespace-pre-wrap">
              {previewFile.content}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => downloadTextFile(previewFile.filename, previewFile.content)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs uppercase tracking-widest transition-colors flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .txt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT AUTHORIZATIONS MODAL */}
      {editingFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0f14] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl">
            <h3 className="text-lg font-serif font-bold text-white flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-amber-500" />
              <span>Modify File Access Permissions</span>
            </h3>

            <div className="p-3 bg-[#12141a] border border-white/5 rounded-xl text-xs space-y-1">
              <div className="font-bold text-white">{editingFile.filename}</div>
              <div className="text-gray-500 font-mono">ID: {editingFile.id}</div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">
                Select Authorized Users
              </label>
              <div className="max-h-56 overflow-y-auto space-y-2 border border-white/5 bg-[#12141a] p-3 rounded-xl">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editAuthUserIds.includes(u.id)}
                        onChange={() => {
                          setEditAuthUserIds((prev) =>
                            prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                          );
                        }}
                        className="w-4 h-4 text-amber-500 bg-black/50 border-white/10 rounded focus:ring-amber-500"
                      />
                      <span className="text-xs font-bold text-white">{u.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">@{u.username}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setEditingFile(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-bold uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAuthorizations}
                disabled={isLoading}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs uppercase tracking-widest shadow transition-colors"
              >
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
