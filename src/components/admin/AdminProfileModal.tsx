import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Key,
  Mail,
  LogOut,
  AlertCircle,
  Lock,
  Upload,
  RefreshCw,
  CheckCircle2,
  Camera,
  X,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { uploadImageFile, validateImageFile } from '../../lib/storageUtils';
import { useBodyScrollLock } from '../../lib/useBodyScrollLock';

interface AdminProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile, fetchProfile, changePassword, signOut } = useLms();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile fields state
  const [fullName, setFullName] = useState(currentUser.full_name);
  const [username, setUsername] = useState(currentUser.username || 'admin');
  const [email, setEmail] = useState(currentUser.email);
  const [department, setDepartment] = useState(currentUser.department || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || '');

  // Loading & status states
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Scroll Container Ref
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Image Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Background scroll locking with exact scroll restoration
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load latest profile from Supabase whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingProfile(true);
      setProfileSuccessMsg(null);
      setProfileErrorMsg(null);
      setUploadError(null);

      fetchProfile(currentUser.id)
        .then((fresh) => {
          if (fresh) {
            setFullName(fresh.full_name);
            setUsername(fresh.username || '');
            setEmail(fresh.email);
            setDepartment(fresh.department || '');
            setAvatarUrl(fresh.avatar_url || '');
          }
        })
        .finally(() => {
          setIsLoadingProfile(false);
        });
    }
  }, [isOpen, currentUser.id]);

  if (!isOpen) return null;

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setProfileSuccessMsg(null);

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid image file.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await uploadImageFile(file, 'profile-pictures');
      if (res.success && res.url) {
        setAvatarUrl(res.url);
        setProfileSuccessMsg('Profile picture uploaded to Supabase Storage. Click Save to persist to profile.');
      } else {
        setUploadError(res.error || 'Failed to upload profile picture.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(msg || 'Network error while uploading avatar.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Preserve exact scroll position before saving
    const savedScrollTop = modalBodyRef.current ? modalBodyRef.current.scrollTop : 0;
    const savedWindowY = window.scrollY;

    setIsSavingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    const res = await updateProfile(currentUser.id, {
      full_name: fullName,
      username,
      email,
      department,
      avatar_url: avatarUrl,
    });

    setIsSavingProfile(false);
    if (res.success) {
      setProfileSuccessMsg('Profile information successfully saved to Supabase database.');
    } else {
      setProfileErrorMsg(res.message || 'Failed to save profile changes to Supabase.');
    }

    // Restore scroll positions safely
    requestAnimationFrame(() => {
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTop = savedScrollTop;
      }
      window.scrollTo({ top: savedWindowY, behavior: 'instant' });
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New password and confirm password do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    const res = await changePassword(currentPassword, newPassword);
    if (res.success) {
      setPasswordStatus({ type: 'success', message: 'Password successfully updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordStatus({ type: 'error', message: res.message || 'Failed to update password.' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overscroll-contain text-left font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-profile-title"
    >
      {/* Clickable Backdrop Overlay - clicking anywhere outside returns to previous position */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-10 bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#176B98] text-white p-6 relative shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={
                    avatarUrl ||
                    currentUser.avatar_url ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80'
                  }
                  alt={fullName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-white/40 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  title="Upload profile image"
                  className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#135A80] hover:bg-[#0F4766] text-white shadow-xs cursor-pointer border border-white/30"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <h3 id="admin-profile-title" className="text-xl font-bold text-white">
                  {fullName}
                </h3>
                <p className="text-xs text-white/80">
                  {department || 'Administrator'} ·{' '}
                  <span className="font-bold text-emerald-300 uppercase">{currentUser.role}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-5 border-t border-white/20 pt-3">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-white text-[#176B98] shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile Details</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-white text-[#176B98] shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Security & Password</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div ref={modalBodyRef} className="p-6 overflow-y-auto overscroll-contain space-y-4 flex-1">
          {activeTab === 'profile' ? (
            <div className="space-y-4">
              {isLoadingProfile && (
                <div className="p-2.5 rounded-lg bg-[#F3F8FB] text-[#176B98] text-xs flex items-center gap-2 border border-[#176B98]/20">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#176B98]" />
                  <span>Loading profile from Supabase...</span>
                </div>
              )}

              {/* Hidden File Input for Device Photo Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarFileSelect}
                className="hidden"
              />

              {/* Direct Image Upload Component */}
              <div className="p-3 bg-[#F3F8FB] border border-slate-200 rounded-xl space-y-2">
                <label className="block text-xs font-semibold text-slate-800">
                  Profile Picture (Supabase Storage)
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={
                      avatarUrl ||
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80'
                    }
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-2xs"
                  />
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#176B98] hover:bg-[#135A80] text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      {isUploadingAvatar ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{isUploadingAvatar ? 'Uploading...' : 'Upload Image from Device'}</span>
                    </button>
                    <p className="text-[10px] text-[#737373] mt-1">
                      Supported: JPG, PNG, WebP (Max 5 MB)
                    </p>
                  </div>
                </div>

                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Or paste direct image URL (https://...)"
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-[#176B98] focus:outline-none font-mono text-[11px]"
                />
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#176B98] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#176B98] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#176B98] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-[#176B98] focus:outline-none"
                />
              </div>

              {/* Protected Fields Display */}
              <div className="p-3 bg-[#F3F8FB] rounded-xl border border-slate-200 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#737373]">Administrative Role:</span>
                <span className="font-bold uppercase text-[#176B98] bg-white border border-[#176B98]/20 px-2 py-0.5 rounded">
                  {currentUser.role} (Immutable)
                </span>
              </div>

              {/* Status Message Directly Above Buttons (Ensures 100% In-View Visibility) */}
              {profileSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{profileSuccessMsg}</span>
                </div>
              )}

              {profileErrorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-lg text-[#737373] hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveProfile()}
                    disabled={isSavingProfile || isUploadingAvatar}
                    className="px-4 py-2.5 rounded-lg bg-[#176B98] hover:bg-[#135A80] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>{isSavingProfile ? 'Saving to Supabase...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {currentUser.must_change_password && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">First-Time Login Password Change Required</strong>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      As an authorized KBZLife administrator, please change your default password to protect LMS administrative workflows.
                    </p>
                  </div>
                </div>
              )}

              {passwordStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    passwordStatus.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {passwordStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#176B98] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#176B98] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#176B98] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-lg text-[#737373] hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-lg bg-[#176B98] hover:bg-[#135A80] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Update Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
