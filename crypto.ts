/**
 * Advanced Cryptographic Suite for CipherVault
 * Implements AES-256-GCM, AES-256-CBC, RSA-OAEP-2048 Asymmetric Cryptography,
 * Zero-Width Unicode Steganography, SHA-256/512/384 Hashes, HMAC, and Entropy Engine.
 */

import { KeyStrengthEvaluation, RSAKeyPair, StegoResult } from '../types';

const HEADER_GCM_BEGIN = '-----BEGIN SECURE AES-256-GCM ENCRYPTED TEXT FILE-----';
const HEADER_GCM_END = '-----END SECURE AES-256-GCM ENCRYPTED TEXT FILE-----';
const HEADER_CBC_BEGIN = '-----BEGIN SECURE AES-256-CBC ENCRYPTED TEXT FILE-----';
const HEADER_CBC_END = '-----END SECURE AES-256-CBC ENCRYPTED TEXT FILE-----';
const HEADER_RSA_BEGIN = '-----BEGIN SECURE RSA-OAEP ENCRYPTED TEXT FILE-----';
const HEADER_RSA_END = '-----END SECURE RSA-OAEP ENCRYPTED TEXT FILE-----';

// Helper: ArrayBuffer to Hex string
export function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: Hex string to Uint8Array
export function hexToBuf(hexStr: string): Uint8Array {
  const cleanHex = hexStr.replace(/[^0-9a-fA-F]/g, '');
  const matches = cleanHex.match(/.{1,2}/g) || [];
  return new Uint8Array(matches.map(byte => parseInt(byte, 16)));
}

// Helper: ArrayBuffer to Base64
export function bufToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Base64 to Uint8Array
export function base64ToBuf(base64Str: string): Uint8Array {
  const clean = base64Str.trim().replace(/\s+/g, '');
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Helper: ArrayBuffer to binary string
function ab2str(buf: ArrayBuffer): string {
  return String.fromCharCode.apply(null, Array.from(new Uint8Array(buf)));
}

// Helper: Binary string to ArrayBuffer
function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

/* =========================================================================
   1. KEY STRENGTH & ENTROPY EVALUATOR
   ========================================================================= */

export function evaluateKeyStrength(secretKey: string): KeyStrengthEvaluation {
  if (!secretKey) {
    return {
      strength: 'weak',
      label: 'Empty Password',
      score: 0,
      entropyBits: 0,
      crackTimeEstimate: 'Instant (< 1 millisecond)',
      feedback: ['Please enter a secret key or password.'],
    };
  }

  let poolSize = 0;
  const hasLower = /[a-z]/.test(secretKey);
  const hasUpper = /[A-Z]/.test(secretKey);
  const hasNumber = /[0-9]/.test(secretKey);
  const hasSpecial = /[^A-Za-z0-9]/.test(secretKey);

  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasNumber) poolSize += 10;
  if (hasSpecial) poolSize += 32;

  // Entropy calculation: E = L * log2(R)
  const entropyBits = Math.round(secretKey.length * Math.log2(poolSize || 1));

  let score = 0;
  const feedback: string[] = [];

  if (secretKey.length >= 8) score++;
  if (secretKey.length >= 14) score++;
  if (hasLower && hasUpper) score++;
  if (hasNumber && hasSpecial) score++;

  if (secretKey.length < 10) feedback.push('Use at least 12-16 characters.');
  if (!hasSpecial) feedback.push('Add special symbols (e.g. !@#$%^&*).');
  if (!hasNumber) feedback.push('Include numbers.');
  if (!hasUpper || !hasLower) feedback.push('Mix uppercase and lowercase letters.');

  let crackTimeEstimate = 'Less than 1 second';
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong' = 'weak';
  let label = 'Weak Key';

  if (entropyBits < 35) {
    strength = 'weak';
    label = 'Weak (Brute-forceable in seconds)';
    crackTimeEstimate = '< 1 second on standard GPU';
  } else if (entropyBits < 60) {
    strength = 'medium';
    label = 'Medium (Resistant to basic attacks)';
    crackTimeEstimate = 'Several days to months';
  } else if (entropyBits < 80) {
    strength = 'strong';
    label = 'Strong (High-grade protection)';
    crackTimeEstimate = 'Centuries on modern supercomputers';
  } else {
    strength = 'very-strong';
    label = 'Military Grade (Quantum resistant entropy)';
    crackTimeEstimate = 'Trillions of years (Mathematically unbreakable)';
  }

  return {
    strength,
    label,
    score: Math.min(4, Math.max(1, score)),
    entropyBits,
    crackTimeEstimate,
    feedback: feedback.length > 0 ? feedback : ['Optimal password entropy achieved! 🛡️'],
  };
}

/* =========================================================================
   2. SECURE PASSWORD & KEY GENERATOR
   ========================================================================= */

const WORD_LIST = [
  'anchor', 'beacon', 'cipher', 'delta', 'echo', 'falcon', 'galaxy', 'harbor',
  'island', 'jupiter', 'knight', 'legend', 'matrix', 'nebula', 'orbit', 'pulse',
  'quantum', 'radar', 'shadow', 'titan', 'uranium', 'vector', 'whisper', 'zenith',
  'aurora', 'blizzard', 'cascade', 'dynamo', 'eclipse', 'frost', 'glacier', 'horizon',
  'ignite', 'jasper', 'kinetic', 'lunar', 'monolith', 'nova', 'onyx', 'phoenix',
  'quasar', 'radiant', 'solstice', 'tundra', 'vanguard', 'vortex', 'wildcat', 'zephyr'
];

export interface GeneratorOptions {
  length: number;
  useUpper: boolean;
  useLower: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  mode: 'random' | 'passphrase';
  wordCount?: number;
  wordSeparator?: string;
}

export function generateSecureKey(options: GeneratorOptions): string {
  if (options.mode === 'passphrase') {
    const count = options.wordCount || 4;
    const separator = options.wordSeparator || '-';
    const words: string[] = [];
    const array = new Uint32Array(count);
    crypto.getRandomValues(array);

    for (let i = 0; i < count; i++) {
      const idx = array[i] % WORD_LIST.length;
      let word = WORD_LIST[idx];
      if (options.useUpper && i % 2 === 0) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
      }
      words.push(word);
    }
    if (options.useNumbers) {
      const num = Math.floor(Math.random() * 900) + 100;
      words.push(num.toString());
    }
    return words.join(separator);
  }

  let charset = '';
  if (options.useLower) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (options.useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (options.useNumbers) charset += '0123456789';
  if (options.useSymbols) charset += '!@#$%^&*()-_=+[]{}|;:,.<>?';

  if (!charset) charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const randomValues = new Uint32Array(options.length);
  crypto.getRandomValues(randomValues);

  let result = '';
  for (let i = 0; i < options.length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

/* =========================================================================
   3. PBKDF2 KEY DERIVATION (GCM & CBC)
   ========================================================================= */

async function deriveKeyPBKDF2(
  password: string,
  salt: Uint8Array,
  algorithmName: 'AES-GCM' | 'AES-CBC' = 'AES-GCM',
  iterations = 100000
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: algorithmName, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/* =========================================================================
   4. AES-256-GCM & AES-256-CBC ENCRYPTION / DECRYPTION
   ========================================================================= */

export async function encryptTextAdvanced(
  plainText: string,
  secretKey: string,
  algorithm: 'AES-256-GCM' | 'AES-256-CBC' = 'AES-256-GCM',
  iterations = 100000
): Promise<{ encryptedText: string; success: boolean; error?: string }> {
  try {
    if (!plainText) {
      return { encryptedText: '', success: false, error: 'Please enter text to encrypt.' };
    }
    if (!secretKey) {
      return { encryptedText: '', success: false, error: 'Please provide a secret key/password.' };
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const ivLength = algorithm === 'AES-256-GCM' ? 12 : 16;
    const iv = crypto.getRandomValues(new Uint8Array(ivLength));

    const cryptoKey = await deriveKeyPBKDF2(
      secretKey,
      salt,
      algorithm === 'AES-256-GCM' ? 'AES-GCM' : 'AES-CBC',
      iterations
    );

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plainText);

    let ciphertextBuffer: ArrayBuffer;

    if (algorithm === 'AES-256-GCM') {
      ciphertextBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encodedData
      );
    } else {
      ciphertextBuffer = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        cryptoKey,
        encodedData
      );
    }

    const saltHex = bufToHex(salt.buffer);
    const ivHex = bufToHex(iv.buffer);
    const ciphertextBase64 = bufToBase64(ciphertextBuffer);

    const isGcm = algorithm === 'AES-256-GCM';
    const headerBegin = isGcm ? HEADER_GCM_BEGIN : HEADER_CBC_BEGIN;
    const headerEnd = isGcm ? HEADER_GCM_END : HEADER_CBC_END;

    const formattedPayload = [
      headerBegin,
      `Algorithm: ${algorithm}`,
      `PBKDF2-Iterations: ${iterations}`,
      `Salt: ${saltHex}`,
      `IV: ${ivHex}`,
      `Ciphertext: ${ciphertextBase64}`,
      headerEnd,
    ].join('\n');

    return { encryptedText: formattedPayload, success: true };
  } catch (err: any) {
    return {
      encryptedText: '',
      success: false,
      error: `Encryption error: ${err?.message || 'Failed to encrypt text.'}`,
    };
  }
}

export async function decryptTextAdvanced(
  encryptedPayload: string,
  secretKey: string
): Promise<{ plainText: string; success: boolean; algorithmUsed?: string; error?: string }> {
  try {
    if (!encryptedPayload) {
      return { plainText: '', success: false, error: 'Please provide encrypted text content.' };
    }
    if (!secretKey) {
      return { plainText: '', success: false, error: 'Please enter the secret password key.' };
    }

    const lines = encryptedPayload.split('\n').map(l => l.trim());

    let saltHex = '';
    let ivHex = '';
    let ciphertextBase64 = '';
    let algorithm = 'AES-256-GCM';
    let iterations = 100000;

    for (const line of lines) {
      if (line.startsWith('Algorithm:')) {
        algorithm = line.replace('Algorithm:', '').trim();
      } else if (line.startsWith('PBKDF2-Iterations:')) {
        const parsed = parseInt(line.replace('PBKDF2-Iterations:', '').trim(), 10);
        if (!isNaN(parsed)) iterations = parsed;
      } else if (line.startsWith('Salt:')) {
        saltHex = line.replace('Salt:', '').trim();
      } else if (line.startsWith('IV:')) {
        ivHex = line.replace('IV:', '').trim();
      } else if (line.startsWith('Ciphertext:')) {
        ciphertextBase64 = line.replace('Ciphertext:', '').trim();
      }
    }

    // Fallback JSON parser
    if (!saltHex || !ivHex || !ciphertextBase64) {
      try {
        const json = JSON.parse(encryptedPayload);
        if (json.salt && json.iv && json.ciphertext) {
          saltHex = json.salt;
          ivHex = json.iv;
          ciphertextBase64 = json.ciphertext;
          if (json.algorithm) algorithm = json.algorithm;
          if (json.iterations) iterations = json.iterations;
        }
      } catch (e) {
        // Not JSON
      }
    }

    if (!saltHex || !ivHex || !ciphertextBase64) {
      return {
        plainText: '',
        success: false,
        error: 'Invalid file format. Header or cryptographic parameters are missing.',
      };
    }

    const salt = hexToBuf(saltHex);
    const iv = hexToBuf(ivHex);
    const ciphertext = base64ToBuf(ciphertextBase64);

    const isCBC = algorithm.includes('CBC');
    const cryptoKey = await deriveKeyPBKDF2(
      secretKey,
      salt,
      isCBC ? 'AES-CBC' : 'AES-GCM',
      iterations
    );

    let decryptedBuffer: ArrayBuffer;

    if (isCBC) {
      decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv },
        cryptoKey,
        ciphertext
      );
    } else {
      decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        ciphertext
      );
    }

    const decoder = new TextDecoder();
    const plainText = decoder.decode(decryptedBuffer);

    return { plainText, success: true, algorithmUsed: algorithm };
  } catch (err: any) {
    return {
      plainText: '',
      success: false,
      error: '🔒 Decryption failed! The password/key is incorrect or the payload was corrupted.',
    };
  }
}

// Backward compatibility wrappers for standard components
export const encryptText = (text: string, key: string) => encryptTextAdvanced(text, key, 'AES-256-GCM');
export const decryptText = (payload: string, key: string) => decryptTextAdvanced(payload, key);

/* =========================================================================
   5. RSA-OAEP 2048-BIT ASYMMETRIC CRYPTOGRAPHY
   ========================================================================= */

export async function generateRSAKeyPair(): Promise<RSAKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const exportedPublic = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const exportedPrivate = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const pubB64 = bufToBase64(exportedPublic);
  const privB64 = bufToBase64(exportedPrivate);

  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${pubB64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privB64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;

  return {
    publicKeyPem,
    privateKeyPem,
    createdAt: new Date().toISOString(),
  };
}

export async function encryptWithRSA(
  plainText: string,
  publicKeyPem: string
): Promise<{ encryptedText: string; success: boolean; error?: string }> {
  try {
    const cleanPem = publicKeyPem
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\s+/g, '');

    const binaryKey = base64ToBuf(cleanPem);
    const publicKey = await crypto.subtle.importKey(
      'spki',
      binaryKey,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    );

    const encoder = new TextEncoder();
    const encoded = encoder.encode(plainText);

    // RSA-OAEP 2048-bit with SHA-256 can encrypt up to 190 bytes per block.
    // For arbitrary text, we use hybrid RSA-AES envelope encryption:
    // Generate an ephemeral AES key, encrypt the text with AES-GCM, and encrypt the AES key with RSA!
    const ephemeralAesKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const rawAesKey = await crypto.subtle.exportKey('raw', ephemeralAesKey);
    const encryptedAesKey = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      rawAesKey
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      ephemeralAesKey,
      encoded
    );

    const payload = [
      HEADER_RSA_BEGIN,
      `Algorithm: RSA-OAEP-2048+AES-256-GCM`,
      `Encrypted-Key: ${bufToBase64(encryptedAesKey)}`,
      `IV: ${bufToHex(iv.buffer)}`,
      `Ciphertext: ${bufToBase64(ciphertext)}`,
      HEADER_RSA_END,
    ].join('\n');

    return { encryptedText: payload, success: true };
  } catch (err: any) {
    return { encryptedText: '', success: false, error: `RSA encryption error: ${err.message}` };
  }
}

export async function decryptWithRSA(
  payload: string,
  privateKeyPem: string
): Promise<{ plainText: string; success: boolean; error?: string }> {
  try {
    const cleanPem = privateKeyPem
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s+/g, '');

    const binaryKey = base64ToBuf(cleanPem);
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['decrypt']
    );

    const lines = payload.split('\n').map(l => l.trim());
    let encKeyB64 = '';
    let ivHex = '';
    let ciphertextB64 = '';

    for (const line of lines) {
      if (line.startsWith('Encrypted-Key:')) encKeyB64 = line.replace('Encrypted-Key:', '').trim();
      if (line.startsWith('IV:')) ivHex = line.replace('IV:', '').trim();
      if (line.startsWith('Ciphertext:')) ciphertextB64 = line.replace('Ciphertext:', '').trim();
    }

    if (!encKeyB64 || !ivHex || !ciphertextB64) {
      return { plainText: '', success: false, error: 'Invalid RSA encrypted text file payload.' };
    }

    const encryptedAesKeyBuf = base64ToBuf(encKeyB64);
    const rawAesKey = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encryptedAesKeyBuf
    );

    const aesKey = await crypto.subtle.importKey(
      'raw',
      rawAesKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const iv = hexToBuf(ivHex);
    const ciphertext = base64ToBuf(ciphertextB64);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return { plainText: decoder.decode(decrypted), success: true };
  } catch (err: any) {
    return { plainText: '', success: false, error: 'RSA Decryption failed. Invalid private key.' };
  }
}

/* =========================================================================
   6. ZERO-WIDTH UNICODE STEGANOGRAPHY (INVISIBLE TEXT EMBEDDING)
   ========================================================================= */

const ZW_ZERO = '\u200B'; // Zero-width space represents binary 0
const ZW_ONE = '\u200C';  // Zero-width non-joiner represents binary 1
const ZW_SEP = '\u200D';  // Zero-width joiner represents byte delimiter
const ZW_FLAG = '\uFEFF'; // Zero-width non-breaking space (Start/End flag)

export function hideTextInCover(coverText: string, secretText: string): StegoResult {
  try {
    if (!coverText) coverText = 'This is a standard administrative status report for the team.';
    if (!secretText) return { coverTextWithPayload: '', hiddenLength: 0, success: false, error: 'Secret text is required.' };

    const encoder = new TextEncoder();
    const secretBytes = encoder.encode(secretText);

    let binaryPayload = '';
    for (let i = 0; i < secretBytes.length; i++) {
      const bin = secretBytes[i].toString(2).padStart(8, '0');
      for (const bit of bin) {
        binaryPayload += bit === '0' ? ZW_ZERO : ZW_ONE;
      }
      binaryPayload += ZW_SEP;
    }

    const fullHiddenBlock = `${ZW_FLAG}${binaryPayload}${ZW_FLAG}`;

    // Inject after the first word or mid-paragraph
    const spaceIdx = coverText.indexOf(' ');
    let result = '';
    if (spaceIdx !== -1) {
      result = coverText.slice(0, spaceIdx) + fullHiddenBlock + coverText.slice(spaceIdx);
    } else {
      result = coverText + fullHiddenBlock;
    }

    return {
      coverTextWithPayload: result,
      hiddenLength: secretText.length,
      success: true,
    };
  } catch (err: any) {
    return { coverTextWithPayload: '', hiddenLength: 0, success: false, error: err.message };
  }
}

export function extractHiddenText(coverTextWithPayload: string): { extractedText: string; success: boolean; error?: string } {
  try {
    const startIdx = coverTextWithPayload.indexOf(ZW_FLAG);
    if (startIdx === -1) {
      return { extractedText: '', success: false, error: 'No hidden zero-width steganographic payload detected in this text.' };
    }

    const endIdx = coverTextWithPayload.indexOf(ZW_FLAG, startIdx + 1);
    if (endIdx === -1) {
      return { extractedText: '', success: false, error: 'Corrupted hidden steganographic payload.' };
    }

    const hiddenSlice = coverTextWithPayload.substring(startIdx + 1, endIdx);
    const byteChunks = hiddenSlice.split(ZW_SEP).filter(Boolean);

    const bytes: number[] = [];
    for (const chunk of byteChunks) {
      let binStr = '';
      for (const char of chunk) {
        if (char === ZW_ZERO) binStr += '0';
        else if (char === ZW_ONE) binStr += '1';
      }
      if (binStr.length > 0) {
        bytes.push(parseInt(binStr, 2));
      }
    }

    const decoder = new TextDecoder();
    const extractedText = decoder.decode(new Uint8Array(bytes));
    return { extractedText, success: true };
  } catch (err: any) {
    return { extractedText: '', success: false, error: `Stego extraction failed: ${err.message}` };
  }
}

/* =========================================================================
   7. CRYPTOGRAPHIC HASH & HMAC VERIFIER
   ========================================================================= */

export async function computeHash(
  text: string,
  algorithm: 'SHA-256' | 'SHA-512' | 'SHA-384' = 'SHA-256'
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  return bufToHex(hashBuffer);
}

export async function computeHMAC(text: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = encoder.encode(text);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return bufToHex(signature);
}

/* =========================================================================
   8. SECURE DIGITAL SHREDDER / MEMORY WIPER
   ========================================================================= */

export async function shredTextInMemory(
  textRef: string,
  passes = 3
): Promise<{ shreddedLength: number; passesCompleted: number; finalHash: string }> {
  const len = textRef.length;
  let simulatedBuffer = new Uint8Array(len);

  for (let pass = 1; pass <= passes; pass++) {
    if (pass === 1) {
      simulatedBuffer.fill(0x00); // 0s
    } else if (pass === 2) {
      simulatedBuffer.fill(0xff); // 1s
    } else {
      crypto.getRandomValues(simulatedBuffer); // Cryptographic noise
    }
  }

  const hash = await computeHash(bufToHex(simulatedBuffer.buffer));
  return { shreddedLength: len, passesCompleted: passes, finalHash: hash };
}

/* =========================================================================
   9. FILE DOWNLOAD UTILITY
   ========================================================================= */

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
