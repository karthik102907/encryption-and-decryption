import { User, FileItem, AuditLog, EncryptionAlgorithm } from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('auth_token');
}

function getHeaders(isJson = true) {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function loginApi(username: string, password: string, portalRole?: 'user' | 'admin') {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ username, password, portalRole }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Login failed.');
  }
  return data;
}

export async function registerApi(username: string, password: string, name: string, role = 'user') {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ username, password, name, role }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed.');
  }
  return data;
}

export async function getCurrentUserApi(): Promise<{ user: User }> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: getHeaders(true),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Session expired.');
  }
  return data;
}

export async function fetchAllUsersApi(): Promise<{ users: User[] }> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'GET',
    headers: getHeaders(true),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch registered users.');
  }
  return data;
}

export async function fetchFilesApi(): Promise<{ files: FileItem[] }> {
  const res = await fetch(`${API_BASE}/files`, {
    method: 'GET',
    headers: getHeaders(true),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch text files.');
  }
  return data;
}

export async function uploadFileApi(
  fileOrContent: File | string,
  filename?: string,
  isEncrypted = false,
  authorizedUserIds: string[] = [],
  description = '',
  algorithm?: EncryptionAlgorithm,
  expiryDate?: string | null,
  maxViews?: number | null
) {
  let body: FormData | string;
  const headers = getHeaders(false);

  if (fileOrContent instanceof File) {
    const formData = new FormData();
    formData.append('file', fileOrContent);
    formData.append('isEncrypted', String(isEncrypted));
    formData.append('authorizedUserIds', JSON.stringify(authorizedUserIds));
    formData.append('description', description);
    if (algorithm) formData.append('algorithm', algorithm);
    if (expiryDate) formData.append('expiryDate', expiryDate);
    if (maxViews) formData.append('maxViews', String(maxViews));
    body = formData;
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({
      content: fileOrContent,
      filename,
      isEncrypted,
      authorizedUserIds,
      description,
      algorithm,
      expiryDate,
      maxViews,
    });
  }

  const res = await fetch(`${API_BASE}/files/upload`, {
    method: 'POST',
    headers,
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to upload text file.');
  }
  return data;
}

export async function recordFileViewApi(fileId: string): Promise<{ file: FileItem }> {
  const res = await fetch(`${API_BASE}/files/${fileId}/view`, {
    method: 'POST',
    headers: getHeaders(true),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to record file view.');
  }
  return data;
}

export async function verifyFileIntegrityApi(fileId: string): Promise<{
  isValid: boolean;
  currentChecksum: string;
  storedChecksum: string;
}> {
  const res = await fetch(`${API_BASE}/files/${fileId}/verify`, {
    method: 'POST',
    headers: getHeaders(true),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Integrity verification failed.');
  }
  return data;
}

export async function updateAuthorizationApi(fileId: string, authorizedUserIds: string[]) {
  const res = await fetch(`${API_BASE}/files/authorize`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify({ fileId, authorizedUserIds }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update user authorization.');
  }
  return data;
}

export async function deleteFileApi(fileId: string) {
  const res = await fetch(`${API_BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers: getHeaders(true),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete text file.');
  }
  return data;
}

export async function fetchAuditLogsApi(): Promise<{ auditLogs: AuditLog[] }> {
  const res = await fetch(`${API_BASE}/admin/audit-logs`, {
    method: 'GET',
    headers: getHeaders(true),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch security audit logs.');
  }
  return data;
}
