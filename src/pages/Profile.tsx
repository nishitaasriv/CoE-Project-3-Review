import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { PageHeader } from '../components/layout/PageHeader';
import { PasswordInput, PasswordStrength } from '../components/auth/PasswordInput';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../lib/dates';
import { CurrencySelect } from '../components/currency/CurrencySelect';
import { authService } from '../lib/auth/authService';
import {
  User as UserIcon,
  Clock,
  KeyRound,
  Trash2,
  LogOut,
  Shield,
  Coins,
  CheckCircle2,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings, setBaseCurrency } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Password change state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  // Account deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [typedConfirm, setTypedConfirm] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (!user || user.isGuest) {
      setPassError('Guest sessions cannot change passwords. Please create an account.');
      return;
    }

    if (newPass.length < 8) {
      setPassError('New password must be at least 8 characters.');
      return;
    }

    if (!/[a-zA-Z]/.test(newPass) || !/[0-9]/.test(newPass)) {
      setPassError('New password must contain at least one letter and one number.');
      return;
    }

    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }

    setIsChangingPass(true);
    try {
      await authService.changePassword(user.id, currentPass, newPass);
      showToast('Password updated successfully!', 'success');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      setPassError(err?.message || 'Current password was incorrect.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (typedConfirm !== 'DELETE') {
      showToast('Please type DELETE to confirm.', 'error');
      return;
    }

    await authService.deleteAccount(user.id);
    showToast('Your account and all associated subscription records have been wiped.', 'info');
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="My Profile & Security"
        description="Manage your account credentials, preferences, and data privacy."
      />

      {/* Account Info Card */}
      <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#26336B]/60">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#3B82F6] flex items-center justify-center font-bold text-white text-2xl font-display shadow-lg">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'GT'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#F4F6FF] font-display">
                  {user?.name || 'Guest User'}
                </h2>
                {user?.isGuest && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#2563EB]/20 text-[#60A5FA] border border-[#3B82F6]/40">
                    Guest Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9AA6D6] mt-0.5">{user?.email || 'Local Browser Storage'}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-[#A78BFA] mt-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Last signed in: {user?.lastSignedIn ? formatDate(user.lastSignedIn.split('T')[0]) : 'Today'}</span>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<LogOut className="w-4 h-4" />}
            onClick={() => {
              logout();
              showToast('You have signed out.', 'info');
              navigate('/login');
            }}
          >
            Sign Out
          </Button>
        </div>

        {/* Preferences: Base Currency */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-[#60A5FA] uppercase tracking-wider mb-2">
              Default Base Currency
            </label>
            <p className="text-xs text-[#9AA6D6] mb-3">
              All dashboard totals, spending charts, and budget warnings are calculated in this currency.
            </p>
            <div className="max-w-xs">
              <CurrencySelect
                value={settings.baseCurrency}
                onChange={(code) => {
                  setBaseCurrency(code);
                  showToast(`Base currency changed to ${code}`, 'success');
                }}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#18234F] border border-[#26336B] text-xs text-[#9AA6D6] space-y-2">
            <div className="flex items-center gap-2 text-[#F4F6FF] font-semibold">
              <Shield className="w-4 h-4 text-[#3B82F6]" />
              <span>Offline Data Isolation</span>
            </div>
            <p className="leading-relaxed">
              SubTrack stores passwords using PBKDF2 Web Crypto hashes and isolates all subscription records per account. No data is sent to external advertising trackers.
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      {!user?.isGuest && (
        <div className="rounded-2xl bg-[#111A40] border border-[#26336B] p-6 shadow-lg">
          <div className="flex items-center gap-2.5 mb-4">
            <KeyRound className="w-5 h-5 text-[#8B5CF6]" />
            <h3 className="text-base font-bold text-[#F4F6FF] font-display">Change Password</h3>
          </div>

          {passError && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-4 p-2.5 rounded-xl bg-[#18234F] border border-[#EC4899]/50 text-xs text-[#F472B6]"
            >
              {passError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-medium text-[#9AA6D6] mb-1">
                Current Password
              </label>
              <PasswordInput
                autoComplete="current-password"
                placeholder="••••••••"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9AA6D6] mb-1">
                New Password (minimum 8 characters, letter & number)
              </label>
              <PasswordInput
                autoComplete="new-password"
                placeholder="••••••••"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
              />
              <PasswordStrength password={newPass} />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9AA6D6] mb-1">
                Confirm New Password
              </label>
              <PasswordInput
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="primary" size="sm" isLoading={isChangingPass}>
              Update Password
            </Button>
          </form>
        </div>
      )}

      {/* Delete Account Danger Zone */}
      <div className="rounded-2xl bg-[#111A40] border border-[#EC4899]/40 p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#F472B6] font-display">Delete Account</h3>
            <p className="text-xs text-[#9AA6D6] mt-1 max-w-lg">
              Permanently wipe your user profile, saved subscriptions, price histories, and proof vault from this browser. This action cannot be undone.
            </p>
          </div>

          <Button
            variant="destructive"
            size="sm"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Typed Deletion Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Permanently Delete Account"
        description="Are you absolutely sure you want to delete your account?"
      >
        <div className="space-y-4 text-xs text-[#9AA6D6]">
          <p>
            This will permanently remove your user credentials and all your tracked subscriptions from this browser.
          </p>
          <div>
            <label className="block text-xs font-medium text-[#F4F6FF] mb-1">
              Please type <strong className="text-[#EC4899]">DELETE</strong> below to confirm:
            </label>
            <input
              type="text"
              placeholder="DELETE"
              value={typedConfirm}
              onChange={(e) => setTypedConfirm(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#18234F] border border-[#26336B] text-sm text-[#F4F6FF] font-mono focus:outline-none focus:border-[#EC4899]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#26336B]/60">
            <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={typedConfirm !== 'DELETE'}
              onClick={handleDeleteAccount}
            >
              Confirm Account Deletion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
