import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck,
  BookOpen,
  Layers,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { Profile, AccountStatus, UserRole, CourseEnrollment, ChannelAccess } from '../../types/lms';
import { useBodyScrollLock } from '../../lib/useBodyScrollLock';

export const UserManagement: React.FC = () => {
  const {
    profiles,
    updateUserStatus,
    updateUserRole,
    getUserEnrollments,
    getUserChannelAccesses,
  } = useLms();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Confirmation dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionType: 'suspend' | 'activate' | 'approve' | 'reject' | 'revoke_course' | 'revoke_channel' | 'change_role';
    userId: string;
    targetId?: string; // courseId or channelId or newRole
    reasonRequired?: boolean;
    reasonText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionType: 'suspend',
    userId: '',
  });

  // Count metrics for quick filter badges
  const pendingCount = profiles.filter((u) => u.account_status === 'pending').length;
  const approvedCount = profiles.filter((u) => u.account_status === 'active' || u.account_status === 'approved').length;
  const suspendedCount = profiles.filter((u) => u.account_status === 'suspended').length;
  const rejectedCount = profiles.filter((u) => u.account_status === 'rejected').length;

  // Lock background scroll when drawer or confirmation dialog is open
  useBodyScrollLock(!!selectedUser || confirmDialog.isOpen);

  // Filtered users
  const filteredUsers = profiles.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesStatus = true;
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'active' || statusFilter === 'approved') {
      matchesStatus = user.account_status === 'active' || user.account_status === 'approved';
    } else {
      matchesStatus = user.account_status === statusFilter;
    }

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleOpenStatusConfirm = (user: Profile, newStatus: AccountStatus) => {
    if (newStatus === 'approve' as any || newStatus === 'approved') {
      setConfirmDialog({
        isOpen: true,
        title: `Approve Registration: ${user.full_name}`,
        message: `Grant access to KBZLife LMS for ${user.full_name} (${user.email})? The account will immediately be activated and permitted to log in.`,
        actionType: 'approve',
        userId: user.id,
        reasonRequired: false,
      });
    } else if (newStatus === 'rejected') {
      setConfirmDialog({
        isOpen: true,
        title: `Reject Registration: ${user.full_name}`,
        message: `Decline LMS access for this registration? The applicant will be blocked from accessing portal content.`,
        actionType: 'reject',
        userId: user.id,
        reasonRequired: true,
        reasonText: 'Applicant does not meet departmental LMS enrollment criteria.',
      });
    } else if (newStatus === 'suspended') {
      setConfirmDialog({
        isOpen: true,
        title: `Suspend Account: ${user.full_name}`,
        message: `Are you sure you want to suspend this account? The user will immediately be blocked from accessing protected LMS content and channels across all devices.`,
        actionType: 'suspend',
        userId: user.id,
        reasonRequired: true,
        reasonText: 'Annual compliance review pending / administrative audit.',
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        title: `Reactivate Account: ${user.full_name}`,
        message: `Restore active learning privileges for ${user.full_name}? The user will regain access to their assigned courses and learning channels.`,
        actionType: 'activate',
        userId: user.id,
        reasonRequired: false,
      });
    }
  };

  const handleExecuteConfirm = async () => {
    const { actionType, userId, targetId, reasonText } = confirmDialog;
    if (actionType === 'approve') {
      await updateUserStatus(userId, 'approved', reasonText || 'Administrative approval granted');
    } else if (actionType === 'reject') {
      await updateUserStatus(userId, 'rejected', reasonText || 'Registration declined by administrator');
    } else if (actionType === 'suspend') {
      await updateUserStatus(userId, 'suspended', reasonText || 'Administrative suspension');
    } else if (actionType === 'activate') {
      await updateUserStatus(userId, 'active', 'Administrative account restoration');
    }

    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    // Update selected user view if open
    if (selectedUser && selectedUser.id === userId) {
      const refreshed = profiles.find((p) => p.id === userId);
      if (refreshed) setSelectedUser(refreshed);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-[#176B98]" />
            <span>User Account & Access Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, filter, inspect profiles, configure RBAC roles, and manage course & channel permissions.
          </p>
        </div>
      </div>

      {/* Quick Status Filter Tabs with Live Metrics */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Users', count: profiles.length },
          { id: 'pending', label: 'Pending Approval', count: pendingCount, isAlert: pendingCount > 0 },
          { id: 'active', label: 'Approved & Active', count: approvedCount },
          { id: 'suspended', label: 'Suspended', count: suspendedCount },
          { id: 'rejected', label: 'Rejected', count: rejectedCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-[#176B98] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                statusFilter === tab.id
                  ? 'bg-white/20 text-white'
                  : tab.isAlert
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, username, or department..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#176B98]/20 focus:border-[#176B98] bg-slate-50/50"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#176B98]"
          >
            <option value="all">All Roles</option>
            <option value="admin">Administrator</option>
            <option value="user">Standard User</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#F3F8FB] text-[#176B98] font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">User & Profile</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Account Status</th>
                <th className="px-4 py-3.5">Assigned Courses</th>
                <th className="px-4 py-3.5">Assigned Channels</th>
                <th className="px-4 py-3.5">Registration Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                    No users found matching your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const enrollments = getUserEnrollments(user.id);
                  const channelAccess = getUserChannelAccesses(user.id);
                  const activeEnrollmentCount = enrollments.filter((e: CourseEnrollment) => e.status === 'enrolled').length;
                  const activeChannelCount = channelAccess.filter((ca: ChannelAccess) => ca.status === 'granted').length;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              user.avatar_url ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
                            }
                            alt={user.full_name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{user.full_name}</div>
                            <div className="text-[11px] text-slate-500">
                              {user.email} ·{' '}
                              <span className="font-mono text-[10px]">@{user.username || user.email.split('@')[0]}</span>
                            </div>
                            {user.department && (
                              <div className="text-[10px] text-slate-400 mt-0.5">{user.department}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{user.role}</span>
                        </span>
                      </td>

                      {/* Account Status Badge */}
                      <td className="px-4 py-3.5">
                        {user.account_status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Pending Review</span>
                          </span>
                        ) : user.account_status === 'active' || user.account_status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Active</span>
                          </span>
                        ) : user.account_status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle className="w-3 h-3 text-slate-500" />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 text-red-600" />
                            <span>Suspended</span>
                          </span>
                        )}
                      </td>

                      {/* Course Enrollments */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#00529B]" />
                          <span className="font-bold text-slate-800">{activeEnrollmentCount}</span>
                          <span className="text-slate-400">courses</span>
                        </div>
                      </td>

                      {/* Channel Access */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#00529B]" />
                          <span className="font-bold text-slate-800">{activeChannelCount}</span>
                          <span className="text-slate-400">channels</span>
                        </div>
                      </td>

                      {/* Enrolled date */}
                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {new Date(user.created_at).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {user.account_status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleOpenStatusConfirm(user, 'approved')}
                                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleOpenStatusConfirm(user, 'rejected')}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setSelectedUser(user)}
                                className="px-2.5 py-1 rounded-lg bg-[#176B98] hover:bg-[#12567a] text-white font-semibold text-xs cursor-pointer transition-colors shadow-2xs"
                              >
                                Manage Access
                              </button>

                              {user.account_status === 'active' || user.account_status === 'approved' ? (
                                <button
                                  onClick={() => handleOpenStatusConfirm(user, 'suspended')}
                                  title="Suspend User Account"
                                  className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleOpenStatusConfirm(user, 'active')}
                                  title="Reactivate Account"
                                  className="p-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* USER DETAIL & ACCESS MANAGEMENT MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#176B98] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedUser.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
                  }
                  alt={selectedUser.full_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                />
                <div>
                  <h3 className="text-base font-bold">{selectedUser.full_name}</h3>
                  <p className="text-xs text-white/80">{selectedUser.email} · {selectedUser.department}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-white/60 hover:text-white p-1 rounded-lg text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Pending Approval Priority Action Banner */}
              {selectedUser.account_status === 'pending' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-amber-700 shrink-0" />
                    <div>
                      <p className="font-bold text-xs">This employee registration is waiting for approval.</p>
                      <p className="text-[11px] text-amber-800">
                        Approving activates access to the KBZLife Learning Portal and dispatches confirmation.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenStatusConfirm(selectedUser, 'approved')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Registration</span>
                    </button>
                    <button
                      onClick={() => handleOpenStatusConfirm(selectedUser, 'rejected')}
                      className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Profile Details Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Username</span>
                  <span className="font-mono font-bold text-slate-800">@{selectedUser.username || selectedUser.email.split('@')[0]}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Employee ID</span>
                  <span className="font-bold text-slate-800">{selectedUser.employee_id || 'KBZ-EMP-000'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Department</span>
                  <span className="font-bold text-slate-800 truncate block">{selectedUser.department || 'General'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Registered On</span>
                  <span className="font-bold text-slate-800">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Account Status & Role Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Account Status
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-bold uppercase text-[11px] ${
                        selectedUser.account_status === 'active' || selectedUser.account_status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selectedUser.account_status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : selectedUser.account_status === 'rejected'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedUser.account_status}
                    </span>
                    {selectedUser.account_status === 'active' || selectedUser.account_status === 'approved' ? (
                      <button
                        onClick={() => handleOpenStatusConfirm(selectedUser, 'suspended')}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
                      >
                        Suspend User
                      </button>
                    ) : selectedUser.account_status === 'suspended' ? (
                      <button
                        onClick={() => handleOpenStatusConfirm(selectedUser, 'active')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                      >
                        Reactivate Account
                      </button>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                    Assigned Role
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 font-bold uppercase text-[11px]">
                      {selectedUser.role}
                    </span>
                    <button
                      onClick={() =>
                        updateUserRole(
                          selectedUser.id,
                          selectedUser.role === 'admin' ? 'user' : 'admin',
                          'Manual administrative privilege update'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer"
                    >
                      Switch to {selectedUser.role === 'admin' ? 'User' : 'Admin'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Permissions & Security Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#176B98]" />
                  <span>Portal Access & Security Authorization</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Access Rights</span>
                    <span className="font-bold text-slate-800">
                      {selectedUser.account_status === 'active' || selectedUser.account_status === 'approved'
                        ? 'Granted — Full User Panel Access'
                        : selectedUser.account_status === 'pending'
                        ? 'Locked — Awaiting Administrator Approval'
                        : 'Blocked — Access Suspended or Rejected'}
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Security Governance</span>
                    <span className="font-bold text-slate-800">
                      {selectedUser.role === 'admin'
                        ? 'Administrative Console & RLS Privileged'
                        : 'Standard Employee Learner'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG FOR SENSITIVE ACTIONS */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{confirmDialog.message}</p>
              </div>
            </div>

            {confirmDialog.reasonRequired && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Justification Note (Required for Audit Log)
                </label>
                <textarea
                  rows={2}
                  value={confirmDialog.reasonText}
                  onChange={(e) => setConfirmDialog((prev) => ({ ...prev, reasonText: e.target.value }))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
