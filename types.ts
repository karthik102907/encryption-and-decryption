export type UserRole = 'admin' | 'user';

export type EncryptionAlgorithm = 'AES-256-GCM' | 'AES-256-CBC' | 'RSA-OAEP-2048' | 'STEGO-ZERO-WIDTH';

export type HashAlgorithm = 'SHA-256' | 'SHA-512' | 'SHA-384' | 'HMAC-SHA256';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  content: string; // Plaintext or encrypted string format
  isEncrypted: boolean;
  algorithm?: EncryptionAlgorithm;
  sha256Checksum?: string;
  expiryDate?: string | null;
  maxViews?: number | null;
  viewCount?: number;
  isExpired?: boolean;
  uploaderId: string;
  uploaderName: string;
  uploaderRole: UserRole;
  authorizedUserIds: string[]; // User IDs allowed to access
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action:
    | 'USER_REGISTER'
    | 'USER_LOGIN'
    | 'FILE_UPLOAD'
    | 'FILE_ENCRYPT'
    | 'FILE_DECRYPT'
    | 'ACCESS_GRANTED'
    | 'ACCESS_REVOKED'
    | 'FILE_DELETED'
    | 'FILE_VERIFY'
    | 'KEY_GENERATE'
    | 'STEGO_ENCODE'
    | 'STEGO_DECODE'
    | 'BATCH_PROCESS'
    | 'FILE_EXPIRED';
  performedBy: string;
  role: UserRole;
  details: string;
}

export interface KeyStrengthEvaluation {
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  label: string;
  score: number; // 0-4
  entropyBits: number;
  crackTimeEstimate: string;
  feedback: string[];
}

export interface RSAKeyPair {
  publicKeyPem: string;
  privateKeyPem: string;
  createdAt: string;
}

export interface BatchFileEntry {
  id: string;
  name: string;
  content: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: string;
  error?: string;
}

export interface StegoResult {
  coverTextWithPayload: string;
  hiddenLength: number;
  success: boolean;
  error?: string;
}

