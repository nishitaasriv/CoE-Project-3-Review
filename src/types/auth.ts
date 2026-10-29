export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastSignedIn: string;
  isGuest?: boolean;
}

export interface StoredAccount extends User {
  passwordHash: string; // Base64 PBKDF2 hash (or legacy hex/plain for migration)
  salt: string; // Base64 16-byte random salt (or legacy hex)
  iterations?: number; // Defaults to 100,000
  format?: 'base64' | 'hex' | 'plain';
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
  rememberMe: boolean;
}
