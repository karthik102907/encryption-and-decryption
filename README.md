# 🔐 CipherVault — Secure Text Encryption & Cryptographic Vault

A simple, powerful, and secure web application to **encrypt, decrypt, conceal, and securely share secret text and files** using industry-standard cryptography algorithms including **AES-256-GCM**, **AES-CBC**, **ChaCha20**, and **Invisible Steganography**.

---

## 🌐 Live Demo
👉 **[Open CipherVault App](https://secured-text-chipervault-application-2434.ai.studio)**

---

## 💡 What is CipherVault?

CipherVault allows you to lock confidential messages, passwords, and private documents into unbreakable encrypted code that only someone with the correct secret key can unlock. It also includes an administrative management console, proxy re-encryption gateway, user password manager, and password reset reminders.

### ✨ Key Features
* 🔒 **Multi-Algorithm Encryption**: Supports **AES-256-GCM** (authenticated), **AES-256-CBC**, **ChaCha20-Poly1305**, and **RSA-OAEP-2048**.
* 👻 **Invisible Steganography**: Hide secret encrypted text inside innocent plain text using invisible zero-width Unicode characters.
* 🛡️ **Tamper Detection**: Computes SHA-256/SHA-512 hashes and HMAC signatures to ensure data integrity.
* 👥 **Dual Portals (Admin & User)**:
  * **Admin Console**: Manage files, re-encrypt data, view/change user passwords, fulfill password reset requests, and view tamper-proof audit logs.
  * **User Vault**: Encrypt, decrypt, download, shred, and share files with other users.
* 🔑 **Admin Password Manager & Reset Reminders**: Users can request password resets with custom notes, and Admins can fulfill them with 1-click key generation.
* ⚡ **1-Click Quick Unlock**: Dispatched files display passkeys directly with 1-click instant unlock buttons.

---

## 🚀 How to Use CipherVault (Step-by-Step)

### 1. How to Encrypt (Lock) Text:
1. Open the [Live App](https://secured-text-chipervault-application-2434.ai.studio) and log in.
2. Go to the **Encrypt File / Message** tab.
3. Enter a filename and type or paste your secret text.
4. Choose an algorithm (e.g., **AES-256-GCM** or **Invisible Steganography**).
5. Enter a **Secret Password / Passkey** (or click **Generate**).
6. Click **Encrypt & Save to Vault**.

### 2. How to Decrypt (Unlock) Text:
1. Open any file in your vault or in the **Admin-Authorized Files** list.
2. Click **Decrypt**.
3. Enter the secret password (or click **Auto-Fill Admin Passkey** for admin-shared files).
4. View the decrypted message or download it safely!

### 3. How to Reset Forgotten Passwords:
1. On the login screen, click **"Forgot password? Send Reminder to Admin"**.
2. Enter your username and an optional note for the administrator.
3. The Admin opens the **Password Reset Reminders** tab and assigns a new password.

---

## 🔑 Demo Login Accounts

You can test the application with these pre-configured accounts:

| Portal | Username | Password | Role / Access |
|---|---|---|---|
| **Admin Portal** | `admin` | `admin123` | Full Admin Console, User Passwords, Reset Reminders, Gateway & Audit Logs |
| **User 1 (Alice)** | `user1` | `user123` | Vault Encryption, Steganography, File Sharing |
| **User 2 (Bob)** | `user2` | `user123` | Authorized File Decryption & Passkey Unlocking |

---

## 🛠️ Built With
* **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion
* **Backend**: Node.js, Express, tsx
* **Cryptography**: Web Crypto API (`window.crypto.subtle`), bcryptjs, PBKDF2, SHA-256 / SHA-512, HMAC
* **Build Tool**: Vite 6

---

## 💻 How to Run Locally on Your Computer

1. **Clone this repository**:
   ```bash
   git clone https://github.com/karthik102907/encryption-and-decryption.git
   cd encryption-and-decryption
