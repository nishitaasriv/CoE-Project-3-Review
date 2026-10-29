import { AuthSession } from '../../types/auth';

const SESSION_STORAGE_KEY = 'subtrack_auth_session';

export function saveSession(session: AuthSession): void {
  const serialized = JSON.stringify(session);
  if (session.rememberMe) {
    localStorage.setItem(SESSION_STORAGE_KEY, serialized);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } else {
    sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

export function getSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const session: AuthSession = JSON.parse(raw);
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
