import { User, AuthSession } from '../../types/auth';
import {
  registerLocal,
  loginLocal,
  loginAsGuest,
  changePasswordLocal,
  deleteAccountLocal,
  getCooldownRemainingSeconds,
  resetPasswordLocal,
} from './localAuth';
import { clearSession, getSession } from './session';

export interface IAuthService {
  getCurrentSession(): AuthSession | null;
  login(email: string, pass: string, rememberMe: boolean): Promise<{ user: User; session: AuthSession }>;
  register(name: string, email: string, pass: string, migrateGuest?: boolean): Promise<{ user: User; session: AuthSession }>;
  loginGuest(): { user: User; session: AuthSession };
  logout(): void;
  changePassword(userId: string, currentPass: string, newPass: string): Promise<void>;
  deleteAccount(userId: string): Promise<void>;
  getCooldownSeconds(): number;
  resetPassword(email: string, fullName: string, newPass: string): Promise<void>;
}

export const authService: IAuthService = {
  getCurrentSession() {
    return getSession();
  },
  async login(email: string, pass: string, rememberMe: boolean) {
    return loginLocal(email, pass, rememberMe);
  },
  async register(name: string, email: string, pass: string, migrateGuest = false) {
    return registerLocal(name, email, pass, migrateGuest);
  },
  loginGuest() {
    return loginAsGuest();
  },
  logout() {
    clearSession();
  },
  async changePassword(userId: string, currentPass: string, newPass: string) {
    return changePasswordLocal(userId, currentPass, newPass);
  },
  async deleteAccount(userId: string) {
    deleteAccountLocal(userId);
  },
  getCooldownSeconds() {
    return getCooldownRemainingSeconds();
  },
  async resetPassword(email: string, fullName: string, newPass: string) {
    return resetPasswordLocal(email, fullName, newPass);
  },
};
