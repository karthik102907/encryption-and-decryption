import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface FileRecord {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  content: string;
  isEncrypted: boolean;
  algorithm?: 'AES-256-GCM' | 'AES-256-CBC' | 'RSA-OAEP-2048' | 'STEGO-ZERO-WIDTH';
  sha256Checksum?: string;
  expiryDate?: string | null;
  maxViews?: number | null;
  viewCount?: number;
  isExpired?: boolean;
  uploaderId: string;
  uploaderName: string;
  uploaderRole: 'admin' | 'user';
  authorizedUserIds: string[];
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLogRecord {
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
  role: 'admin' | 'user';
  details: string;
}

const DB_FILE = path.join(process.cwd(), 'data_store.json');

interface DatabaseSchema {
  users: UserRecord[];
  files: FileRecord[];
  auditLogs: AuditLogRecord[];
}

let dbMemory: DatabaseSchema = {
  users: [],
  files: [],
  auditLogs: [],
};

export async function initDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbMemory = JSON.parse(data);
      console.log('Loaded database store from data_store.json');
      return;
    } catch (e) {
      console.error('Failed to parse existing data_store.json, resetting with defaults');
    }
  }

  // Generate bcrypt hashes
  const adminHash = await bcrypt.hash('admin123', 10);
  const user1Hash = await bcrypt.hash('user123', 10);
  const user2Hash = await bcrypt.hash('user123', 10);

  const defaultUsers: UserRecord[] = [
    {
      id: 'usr_admin',
      username: 'admin',
      passwordHash: adminHash,
      name: 'Security Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_alice',
      username: 'user1',
      passwordHash: user1Hash,
      name: 'Alice Johnson',
      role: 'user',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_bob',
      username: 'user2',
      passwordHash: user2Hash,
      name: 'Bob Smith',
      role: 'user',
      createdAt: new Date().toISOString(),
    },
  ];

  const file1Content = `CONFIDENTIAL PROJECT OVERVIEW\n\nTarget Completion: Q4 2026\nSecurity Protocols: AES-256 End-to-End Encryption enabled.\n\nNotice: This text document contains sensitive information authorized exclusively for Alice Johnson by System Administrator. Keep secret key secure at all times!`;
  const file1Checksum = crypto.createHash('sha256').update(file1Content).digest('hex');

  const file2Content = `ORGANIZATION SECURITY POLICY & COMPLIANCE MANUAL\n\n1. Password Requirements: Passwords must be hashed using bcrypt before storage.\n2. File Protection: All sensitive text files (.txt) must be encrypted using AES-256.\n3. Role-Based Access: Admin assigns permissions to Data Owners.\n4. Principle of Least Privilege: Users only view files specifically assigned to them.`;
  const file2Checksum = crypto.createHash('sha256').update(file2Content).digest('hex');

  const defaultFiles: FileRecord[] = [
    {
      id: 'file_001',
      filename: 'confidential_project_overview.txt',
      originalName: 'confidential_project_overview.txt',
      mimeType: 'text/plain',
      size: 480,
      content: file1Content,
      isEncrypted: false,
      algorithm: 'AES-256-GCM',
      sha256Checksum: file1Checksum,
      viewCount: 0,
      isExpired: false,
      uploaderId: 'usr_admin',
      uploaderName: 'Security Admin',
      uploaderRole: 'admin',
      authorizedUserIds: ['usr_alice'],
      description: 'Authorized text file containing project overview assigned exclusively to Alice.',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 'file_002',
      filename: 'company_security_policies.txt',
      originalName: 'company_security_policies.txt',
      mimeType: 'text/plain',
      size: 620,
      content: file2Content,
      isEncrypted: false,
      algorithm: 'AES-256-GCM',
      sha256Checksum: file2Checksum,
      viewCount: 0,
      isExpired: false,
      uploaderId: 'usr_admin',
      uploaderName: 'Security Admin',
      uploaderRole: 'admin',
      authorizedUserIds: ['usr_alice', 'usr_bob'],
      description: 'Global compliance and security guidelines authorized for Alice and Bob.',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ];

  const defaultAuditLogs: AuditLogRecord[] = [
    {
      id: 'log_001',
      timestamp: new Date(Date.now() - 3600000 * 25).toISOString(),
      action: 'USER_REGISTER',
      performedBy: 'admin',
      role: 'admin',
      details: 'Initial security admin and demo user accounts bootstrapped.',
    },
    {
      id: 'log_002',
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      action: 'ACCESS_GRANTED',
      performedBy: 'admin',
      role: 'admin',
      details: 'Authorized file "confidential_project_overview.txt" to user "user1" (Alice Johnson).',
    },
  ];

  dbMemory = {
    users: defaultUsers,
    files: defaultFiles,
    auditLogs: defaultAuditLogs,
  };

  saveDb();
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbMemory, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data store file:', err);
  }
}

export function getUsers(): UserRecord[] {
  return dbMemory.users;
}

export function getUserById(id: string): UserRecord | undefined {
  return dbMemory.users.find(u => u.id === id);
}

export function getUserByUsername(username: string): UserRecord | undefined {
  return dbMemory.users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function addUser(user: UserRecord): UserRecord {
  dbMemory.users.push(user);
  saveDb();
  return user;
}

export function getFiles(): FileRecord[] {
  // Check for expired files
  const now = new Date().getTime();
  dbMemory.files.forEach(f => {
    if (f.expiryDate && new Date(f.expiryDate).getTime() < now) {
      f.isExpired = true;
    }
    if (f.maxViews && f.viewCount !== undefined && f.viewCount >= f.maxViews) {
      f.isExpired = true;
    }
  });
  return dbMemory.files;
}

export function getFileById(id: string): FileRecord | undefined {
  return dbMemory.files.find(f => f.id === id);
}

export function recordFileView(id: string): FileRecord | undefined {
  const file = dbMemory.files.find(f => f.id === id);
  if (file) {
    file.viewCount = (file.viewCount || 0) + 1;
    if (file.maxViews && file.viewCount >= file.maxViews) {
      file.isExpired = true;
    }
    saveDb();
  }
  return file;
}

export function addFile(file: FileRecord): FileRecord {
  dbMemory.files.unshift(file);
  saveDb();
  return file;
}

export function updateFileAuthorizedUsers(fileId: string, userIds: string[]): FileRecord | undefined {
  const file = dbMemory.files.find(f => f.id === fileId);
  if (file) {
    file.authorizedUserIds = userIds;
    file.updatedAt = new Date().toISOString();
    saveDb();
  }
  return file;
}

export function deleteFile(fileId: string): boolean {
  const initialLen = dbMemory.files.length;
  dbMemory.files = dbMemory.files.filter(f => f.id !== fileId);
  if (dbMemory.files.length !== initialLen) {
    saveDb();
    return true;
  }
  return false;
}

export function addAuditLog(log: Omit<AuditLogRecord, 'id' | 'timestamp'>) {
  const record: AuditLogRecord = {
    ...log,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  dbMemory.auditLogs.unshift(record);
  saveDb();
  return record;
}

export function getAuditLogs(): AuditLogRecord[] {
  return dbMemory.auditLogs;
}
