import { StoredAccount, User, AuthSession } from '../../types/auth';
import { hashPassword, verifyPassword } from './passwordHash';
import { clearSession, getSession, saveSession } from './session';
import { clearUserData, migrateGuestDataToUser } from '../storage';

const ACCOUNTS_STORAGE_KEY = 'subtrack_accounts';
const FAILED_ATTEMPTS_KEY = 'subtrack_failed_login_attempts';

interface FailedAttemptsRecord {
  count: number;
  lockedUntil?: number;
}

function getStoredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Handled corrupted accounts storage safely:', err);
    return [];
  }
}

function saveStoredAccounts(accounts: StoredAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Failed to save accounts to storage:', err);
  }
}

function getFailedAttempts(): FailedAttemptsRecord {
  try {
    const raw = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    if (!raw) return { count: 0 };
    const parsed: FailedAttemptsRecord = JSON.parse(raw);
    if (parsed.lockedUntil && Date.now() > parsed.lockedUntil) {
      localStorage.removeItem(FAILED_ATTEMPTS_KEY);
      return { count: 0 };
    }
    return parsed;
  } catch {
    return { count: 0 };
  }
}

function recordFailedAttempt(): { isLocked: boolean; lockSecondsRemaining: number } {
  const current = getFailedAttempts();
  const newCount = current.count + 1;

  if (newCount >= 5) {
    const lockedUntil = Date.now() + 30 * 1000; // 30 seconds cooldown
    const record: FailedAttemptsRecord = { count: newCount, lockedUntil };
    try {
      localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify(record));
    } catch {
      // ignore
    }
    return { isLocked: true, lockSecondsRemaining: 30 };
  } else {
    try {
      localStorage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify({ count: newCount }));
    } catch {
      // ignore
    }
    return { isLocked: false, lockSecondsRemaining: 0 };
  }
}

function resetFailedAttempts(): void {
  try {
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
  } catch {
    // ignore
  }
}

export function getCooldownRemainingSeconds(): number {
  const current = getFailedAttempts();
  if (current.lockedUntil && current.lockedUntil > Date.now()) {
    return Math.ceil((current.lockedUntil - Date.now()) / 1000);
  }
  return 0;
}

export async function registerLocal(
  name: string,
  email: string,
  password: string,
  migrateFromGuest = false
): Promise<{ user: User; session: AuthSession }> {
  // Normalise email (trim, lowercase) identically at registration and at login
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getStoredAccounts();

  if (accounts.some((a) => a.email && a.email.toLowerCase() === normalizedEmail)) {
    throw new Error('An account with this email address already exists.');
  }

  // Hash with Web Crypto PBKDF2 (SHA-256, 100,000 iterations, random 16-byte salt). Do not alter password!
  const { hashBase64, saltBase64, iterations } = await hashPassword(password);
  const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  const newUser: StoredAccount = {
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    createdAt: new Date().toISOString(),
    lastSignedIn: new Date().toISOString(),
    passwordHash: hashBase64,
    salt: saltBase64,
    iterations,
    format: 'base64',
  };

  accounts.push(newUser);
  saveStoredAccounts(accounts);

  if (migrateFromGuest) {
    migrateGuestDataToUser(userId);
  }

  const userClean: User = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    createdAt: newUser.createdAt,
    lastSignedIn: newUser.lastSignedIn,
  };

  const session: AuthSession = {
    user: userClean,
    token: 'jwt_local_' + Math.random().toString(36),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    rememberMe: true,
  };

  saveSession(session);
  return { user: userClean, session };
}

export async function loginLocal(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<{ user: User; session: AuthSession }> {
  const cooldownSec = getCooldownRemainingSeconds();
  if (cooldownSec > 0) {
    throw new Error(`Too many failed attempts. Please wait ${cooldownSec}s before retrying.`);
  }

  // Normalise email identically
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getStoredAccounts();
  const account = accounts.find((a) => a.email && a.email.toLowerCase() === normalizedEmail);

  if (!account) {
    const { isLocked, lockSecondsRemaining } = recordFailedAttempt();
    if (isLocked) {
      throw new Error(`Too many failed attempts. Locked for ${lockSecondsRemaining} seconds.`);
    }
    // Never reveal whether email exists
    throw new Error('Incorrect email or password');
  }

  // Verify entered password against stored salt and iterations
  const { isValid, needsMigration } = await verifyPassword(
    password,
    account.salt,
    account.passwordHash,
    account.iterations
  );

  if (!isValid) {
    const { isLocked, lockSecondsRemaining } = recordFailedAttempt();
    if (isLocked) {
      throw new Error(`Too many failed attempts. Locked for ${lockSecondsRemaining} seconds.`);
    }
    throw new Error('Incorrect email or password');
  }

  // Success: reset failed attempts counter immediately
  resetFailedAttempts();

  // If old account had legacy hex or plain format, upgrade on successful login
  if (needsMigration) {
    const newHash = await hashPassword(password);
    account.passwordHash = newHash.hashBase64;
    account.salt = newHash.saltBase64;
    account.iterations = newHash.iterations;
    account.format = 'base64';
  }

  account.lastSignedIn = new Date().toISOString();
  saveStoredAccounts(accounts);

  const userClean: User = {
    id: account.id,
    name: account.name,
    email: account.email,
    createdAt: account.createdAt,
    lastSignedIn: account.lastSignedIn,
  };

  const session: AuthSession = {
    user: userClean,
    token: 'jwt_local_' + Math.random().toString(36),
    expiresAt: rememberMe
      ? Date.now() + 30 * 24 * 60 * 60 * 1000
      : Date.now() + 24 * 60 * 60 * 1000,
    rememberMe,
  };

  saveSession(session);
  return { user: userClean, session };
}

export function loginAsGuest(): { user: User; session: AuthSession } {
  const guestUser: User = {
    id: 'guest',
    name: 'Guest User',
    email: 'guest@subtrack.local',
    createdAt: new Date().toISOString(),
    lastSignedIn: new Date().toISOString(),
    isGuest: true,
  };

  const session: AuthSession = {
    user: guestUser,
    token: 'guest_token_' + Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    rememberMe: false,
  };

  saveSession(session);
  return { user: guestUser, session };
}

export async function changePasswordLocal(
  userId: string,
  currentPass: string,
  newPass: string
): Promise<void> {
  const accounts = getStoredAccounts();
  const account = accounts.find((a) => a.id === userId);
  if (!account) throw new Error('Account not found.');

  const { isValid } = await verifyPassword(
    currentPass,
    account.salt,
    account.passwordHash,
    account.iterations
  );
  if (!isValid) throw new Error('Current password does not match.');

  const { hashBase64, saltBase64, iterations } = await hashPassword(newPass);
  account.passwordHash = hashBase64;
  account.salt = saltBase64;
  account.iterations = iterations;
  account.format = 'base64';
  saveStoredAccounts(accounts);
}

export async function resetPasswordLocal(
  email: string,
  fullName: string,
  newPass: string
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getStoredAccounts();
  const account = accounts.find((a) => a.email && a.email.toLowerCase() === normalizedEmail);

  if (!account) {
    throw new Error('No account matches the provided email and account name.');
  }

  if (account.name.trim().toLowerCase() !== fullName.trim().toLowerCase()) {
    throw new Error('No account matches the provided email and account name.');
  }

  const { hashBase64, saltBase64, iterations } = await hashPassword(newPass);
  account.passwordHash = hashBase64;
  account.salt = saltBase64;
  account.iterations = iterations;
  account.format = 'base64';
  saveStoredAccounts(accounts);
}

export function deleteAccountLocal(userId: string): void {
  const accounts = getStoredAccounts();
  const filtered = accounts.filter((a) => a.id !== userId);
  saveStoredAccounts(filtered);
  clearUserData(userId);
  clearSession();
}
