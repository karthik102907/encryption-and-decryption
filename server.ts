import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  initDb,
  getUsers,
  getUserById,
  getUserByUsername,
  addUser,
  getFiles,
  getFileById,
  addFile,
  updateFileAuthorizedUsers,
  deleteFile,
  recordFileView,
  addAuditLog,
  getAuditLogs,
  UserRecord,
  FileRecord,
} from './server/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'encryption_app_secret_jwt_key_2026';
const PORT = 3000;

// Setup multer in-memory storage for text files
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for text files
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    name: string;
    role: 'admin' | 'user';
  };
}

// Middleware to authenticate JWT token
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token.' });
    }
    req.user = decoded;
    next();
  });
}

// Middleware to check Admin role
function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Administrator privilege required.' });
  }
  next();
}

async function startServer() {
  // Initialize Database Store
  await initDb();

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // User Registration (User Portal)
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { username, password, name, role } = req.body;

      if (!username || !password || !name) {
        return res.status(400).json({ error: 'Username, password, and name are required.' });
      }

      if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const existingUser = getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
      }

      // Password hashing using bcrypt
      const passwordHash = await bcrypt.hash(password, 10);
      const userRole: 'admin' | 'user' = role === 'admin' ? 'admin' : 'user';

      const newUser: UserRecord = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        username: username.trim(),
        passwordHash,
        name: name.trim(),
        role: userRole,
        createdAt: new Date().toISOString(),
      };

      addUser(newUser);

      // Audit Log
      addAuditLog({
        action: 'USER_REGISTER',
        performedBy: newUser.username,
        role: newUser.role,
        details: `Registered new account (${newUser.name}) as ${newUser.role}.`,
      });

      // Issue JWT token
      const token = jwt.sign(
        { id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'Registration successful!',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: `Registration error: ${err.message}` });
    }
  });

  // Portal Login (User or Admin)
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password, portalRole } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }

      const user = getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      // Role check for specific portal
      if (portalRole === 'admin' && user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied. You do not have Administrator permissions for this portal.',
        });
      }

      // Verify password hash
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      // Issue JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Audit Log
      addAuditLog({
        action: 'USER_LOGIN',
        performedBy: user.username,
        role: user.role,
        details: `Logged into ${portalRole || user.role} portal successfully.`,
      });

      res.json({
        message: 'Login successful!',
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: `Login error: ${err.message}` });
    }
  });

  // Get current session profile
  app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const user = getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  });

  // List all users (Admin only)
  app.get('/api/users', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
    const allUsers = getUsers().map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt,
    }));
    res.json({ users: allUsers });
  });

  // Get accessible files
  app.get('/api/files', authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const allFiles = getFiles();

    if (req.user.role === 'admin') {
      // Admin gets all files
      return res.json({ files: allFiles });
    }

    // Regular User gets files explicitly authorized for them OR files they uploaded themselves
    const userId = req.user.id;
    const userFiles = allFiles.filter(
      f => f.authorizedUserIds.includes(userId) || f.uploaderId === userId
    );

    res.json({ files: userFiles });
  });

  // Record file view (increment view counter / TTL check)
  app.post('/api/files/:id/view', authenticateToken, (req: AuthRequest, res: Response) => {
    const fileId = req.params.id;
    const file = recordFileView(fileId);
    if (!file) return res.status(404).json({ error: 'File not found.' });

    addAuditLog({
      action: 'FILE_DECRYPT',
      performedBy: req.user?.username || 'user',
      role: req.user?.role || 'user',
      details: `Viewed/accessed text file "${file.filename}". View count: ${file.viewCount || 1}/${file.maxViews || '∞'}`,
    });

    res.json({ file });
  });

  // Verify file integrity checksum
  app.post('/api/files/:id/verify', authenticateToken, (req: AuthRequest, res: Response) => {
    const fileId = req.params.id;
    const file = getFileById(fileId);
    if (!file) return res.status(404).json({ error: 'File not found.' });

    const currentChecksum = crypto.createHash('sha256').update(file.content).digest('hex');
    const isValid = file.sha256Checksum ? file.sha256Checksum === currentChecksum : true;

    addAuditLog({
      action: 'FILE_VERIFY',
      performedBy: req.user?.username || 'user',
      role: req.user?.role || 'user',
      details: `Integrity check for "${file.filename}": ${isValid ? 'PASSED (Match)' : 'FAILED (Tampered)'}`,
    });

    res.json({
      isValid,
      currentChecksum,
      storedChecksum: file.sha256Checksum || currentChecksum,
    });
  });

  // Upload or create a text file (.txt)
  app.post(
    '/api/files/upload',
    authenticateToken,
    upload.single('file'),
    async (req: AuthRequest, res: Response) => {
      try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        let content = '';
        let filename = '';
        let originalName = '';
        let size = 0;

        if (req.file) {
          content = req.file.buffer.toString('utf-8');
          filename = req.file.originalname;
          originalName = req.file.originalname;
          size = req.file.size;
        } else if (req.body.content) {
          content = req.body.content;
          filename = req.body.filename || `text_file_${Date.now()}.txt`;
          originalName = filename;
          size = Buffer.byteLength(content, 'utf-8');
        } else {
          return res.status(400).json({ error: 'Please provide a .txt file or text content.' });
        }

        if (!filename.endsWith('.txt')) {
          filename = `${filename}.txt`;
        }

        const isEncrypted =
          req.body.isEncrypted === 'true' ||
          req.body.isEncrypted === true ||
          content.includes('BEGIN SECURE AES-256') ||
          content.includes('BEGIN SECURE RSA-OAEP');

        const algorithm = req.body.algorithm || (isEncrypted ? 'AES-256-GCM' : undefined);
        const description = req.body.description || '';
        const expiryDate = req.body.expiryDate ? req.body.expiryDate : null;
        const maxViews = req.body.maxViews ? parseInt(req.body.maxViews, 10) : null;
        const sha256Checksum = crypto.createHash('sha256').update(content).digest('hex');

        const authorizedUserIds: string[] = req.body.authorizedUserIds
          ? typeof req.body.authorizedUserIds === 'string'
            ? JSON.parse(req.body.authorizedUserIds)
            : req.body.authorizedUserIds
          : [];

        const newFile: FileRecord = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          filename,
          originalName,
          mimeType: 'text/plain',
          size,
          content,
          isEncrypted,
          algorithm,
          sha256Checksum,
          expiryDate,
          maxViews,
          viewCount: 0,
          isExpired: false,
          uploaderId: req.user.id,
          uploaderName: req.user.name,
          uploaderRole: req.user.role,
          authorizedUserIds,
          description,
          createdAt: new Date().toISOString(),
        };

        addFile(newFile);

        // Audit Log
        addAuditLog({
          action: 'FILE_UPLOAD',
          performedBy: req.user.username,
          role: req.user.role,
          details: `Uploaded text file "${filename}" (${isEncrypted ? algorithm || 'Encrypted' : 'Plain Text'}). Authorized users: [${authorizedUserIds.length}]`,
        });

        res.status(201).json({
          message: 'Text file uploaded successfully!',
          file: newFile,
        });
      } catch (err: any) {
        res.status(500).json({ error: `File upload error: ${err.message}` });
      }
    }
  );

  // Authorize / Assign file to specific users (Admin only)
  app.post(
    '/api/files/authorize',
    authenticateToken,
    requireAdmin,
    (req: AuthRequest, res: Response) => {
      try {
        const { fileId, authorizedUserIds } = req.body;

        if (!fileId || !Array.isArray(authorizedUserIds)) {
          return res.status(400).json({ error: 'fileId and authorizedUserIds array are required.' });
        }

        const file = getFileById(fileId);
        if (!file) {
          return res.status(404).json({ error: 'File not found.' });
        }

        const updatedFile = updateFileAuthorizedUsers(fileId, authorizedUserIds);

        // Audit Log
        const userNames = authorizedUserIds
          ? authorizedUserIds
              .map(id => getUserById(id)?.username)
              .filter(Boolean)
              .join(', ')
          : 'None';

        addAuditLog({
          action: 'ACCESS_GRANTED',
          performedBy: req.user?.username || 'admin',
          role: 'admin',
          details: `Updated access authorizations for file "${file.filename}". Assigned to users: [${userNames || 'None'}]`,
        });

        res.json({
          message: 'User authorization updated successfully!',
          file: updatedFile,
        });
      } catch (err: any) {
        res.status(500).json({ error: `Authorization error: ${err.message}` });
      }
    }
  );

  // Delete file
  app.delete('/api/files/:id', authenticateToken, (req: AuthRequest, res: Response) => {
    try {
      const fileId = req.params.id;
      const file = getFileById(fileId);

      if (!file) {
        return res.status(404).json({ error: 'File not found.' });
      }

      // Check permission: caller must be Admin or original uploader
      if (req.user?.role !== 'admin' && file.uploaderId !== req.user?.id) {
        return res.status(403).json({ error: 'Permission denied to delete this file.' });
      }

      deleteFile(fileId);

      // Audit Log
      addAuditLog({
        action: 'FILE_DELETED',
        performedBy: req.user?.username || 'user',
        role: req.user?.role || 'user',
        details: `Deleted text file "${file.filename}".`,
      });

      res.json({ message: 'Text file deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: `Delete error: ${err.message}` });
    }
  });

  // Audit Logs endpoint (Admin only)
  app.get(
    '/api/admin/audit-logs',
    authenticateToken,
    requireAdmin,
    (req: AuthRequest, res: Response) => {
      res.json({ auditLogs: getAuditLogs() });
    }
  );

  // --- VITE MIDDLEWARE SETUP FOR DEV / STATIC IN PRODUCTION ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at:`);
    console.log(`  > Local:   http://localhost:${PORT}`);
    console.log(`  > Network: http://127.0.0.1:${PORT}`);
  });
}

startServer();
