# 🔐 CipherVault — Secure Text Encryption Application

A simple and secure web application to **encrypt and decrypt secret text and files** using military-grade **AES-256-GCM** encryption.

---

## 🌐 Live Demo
👉 **[Open CipherVault App](https://secured-text-chipervault-application-2434.ai.studio)**

---

## 💡 What is CipherVault?

CipherVault allows you to lock your confidential messages, passwords, and private notes into unbreakable secret code that only someone with the correct password can unlock.

### ✨ Key Features
* 🔒 **Military-Grade Security**: Uses AES-256-GCM (the global gold standard for encryption).
* 🛡️ **Tamper Detection**: Detects if anyone changed or corrupted your encrypted message.
* 👥 **User Accounts**: Separate portals for Admin and Data Owners to store and share encrypted notes.
* 📱 **Modern & Responsive**: Clean user interface that works on both mobile and desktop.

---

## 🚀 How to Use CipherVault (Step-by-Step)

### 1. How to Encrypt (Lock) Text:
1. Open the [Live App](https://secured-text-chipervault-application-2434.ai.studio).
2. Type or paste your secret message in the **Encrypt** box.
3. Enter a **Secret Password**.
4. Click **Encrypt Data**.
5. Copy the generated secret code and share it safely!

### 2. How to Decrypt (Unlock) Text:
1. Go to the **Decrypt** tab.
2. Paste the encrypted code.
3. Enter the same password used during encryption.
4. Click **Decrypt Data** to read the original message.

---

## 🔑 Demo Login Accounts

You can test the user portals with these pre-created accounts:

* **Admin Portal**: 
  - Username: `admin` | Password: `admin123`
* **User 1 (Alice)**: 
  - Username: `user1` | Password: `user123`
* **User 2 (Bob)**: 
  - Username: `user2` | Password: `user123`

---

## 🛠️ Built With
* **Frontend**: React, TypeScript, Tailwind CSS
* **Backend**: Node.js, Express
* **Cryptography**: Web Crypto API (AES-256-GCM)

---

## 💻 How to Run Locally on Your Computer

1. **Clone this repository**:
   ```bash
   git clone https://github.com/karthik102907/encryption-and-decryption.git
   cd encryption-and-decryption


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
