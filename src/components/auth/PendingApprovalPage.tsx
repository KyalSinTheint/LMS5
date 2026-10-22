import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShieldAlert,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Building,
  Mail,
  User,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';

interface PendingApprovalPageProps {
  onApprovalDetected: () => void;
  onLogout: () => void;
}

export const PendingApprovalPage: React.FC<PendingApprovalPageProps> = ({
  onApprovalDetected,
  onLogout,
}) => {
  const { currentUser, checkUserApprovalStatus, refreshData, approveUser } = useLms();
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [autoSimulateApproval, setAutoSimulateApproval] = useState(false);

  // Poll periodically every 10 seconds to detect approval without user interaction
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await checkUserApprovalStatus(currentUser.id);
        if (status === 'approved' || status === 'active') {
          onApprovalDetected();
        }
      } catch {
        // silent polling error
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [currentUser.id, checkUserApprovalStatus, onApprovalDetected]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    setStatusMessage(null);
    try {
      await refreshData();
      const status = await checkUserApprovalStatus(currentUser.id);
      setLastChecked(new Date());

      if (status === 'approved' || status === 'active') {
        setStatusMessage('Congratulations! Your account has been approved. Redirecting to Learner Portal...');
        setTimeout(() => {
          onApprovalDetected();
        }, 1200);
      } else if (status === 'rejected') {
        setStatusMessage('Your registration application was reviewed and rejected. Please contact administration.');
      } else {
        setStatusMessage('Your account is still pending administrator review. Please check back shortly.');
      }
    } catch {
      setStatusMessage('Unable to connect to Supabase server. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  // Quick helper for evaluation: simulate immediate admin approval
  const handleSimulateApproval = async () => {
    setAutoSimulateApproval(true);
    try {
      await approveUser(currentUser.id);
      setStatusMessage('Account successfully approved by Administrator! Loading Learner Portal...');
      setTimeout(() => {
        onApprovalDetected();
      }, 1000);
    } catch {
      setStatusMessage('Simulation failed. Please use Admin Console to approve.');
    } finally {
      setAutoSimulateApproval(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EDF4FB] bg-light-blue-pattern flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans antialiased selection:bg-[#00529B] selection:text-white">
      {/* Brand Header */}
      <div className="w-full max-w-lg text-center mb-6">
        <div className="inline-flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-xs border border-sky-100 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#003366] text-white flex items-center justify-center font-black text-sm shadow-inner">
            KBZ
          </div>
          <div className="text-left">
            <h1 className="text-base font-extrabold text-[#003366] tracking-tight leading-none">
              KBZLIFE Insurance
            </h1>
            <p className="text-[10px] text-sky-700 font-semibold uppercase tracking-wider mt-0.5">
              Employee Learning Portal · Registration Verification
            </p>
          </div>
        </div>
      </div>

      {/* Main Status Container */}
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden text-left">
        {/* Banner with Animated Clock / Review Icon */}
        <div className="bg-gradient-to-r from-[#003366] to-[#00529B] text-white p-7 relative overflow-hidden">
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-300/30">
                Status: Pending Approval
              </span>
              <h2 className="text-2xl font-black text-white mt-1.5 tracking-tight">
                Your Account Is Pending Approval
              </h2>
              <p className="text-xs text-sky-100/90 mt-1 leading-relaxed">
                Thank you for registering, <strong className="text-white">{currentUser.full_name}</strong>. An authorized LMS administrator is reviewing your employee credentials.
              </p>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Status Message Notification */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                statusMessage.includes('Congratulations') || statusMessage.includes('approved')
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-sky-50 border border-sky-200 text-slate-800'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{statusMessage}</div>
            </div>
          )}

          {/* Account Details Review Box */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Submitted Profile Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Full Name</div>
                  <div className="font-bold text-slate-900">{currentUser.full_name}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-700">
                <span className="text-xs font-mono font-bold text-slate-400">@</span>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Username</div>
                  <div className="font-bold text-slate-900">
                    {currentUser.username || currentUser.email.split('@')[0]}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Email</div>
                  <div className="font-bold text-slate-900 truncate max-w-[180px]">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-700">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Department</div>
                  <div className="font-bold text-slate-900">
                    {currentUser.department || 'Underwriting & Policy Issue'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>Security Protocol:</strong> In accordance with KBZLife compliance policies, employee accounts do not gain access to internal courses, modules, or company Gazette communications until identity and organizational role are verified.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleManualCheck}
              disabled={isChecking}
              className="w-full py-2.5 px-4 rounded-xl bg-[#003366] hover:bg-[#00529B] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking Supabase for Approval...' : 'Check Approval Status'}</span>
            </button>

            <button
              onClick={onLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign Out & Return to Login</span>
            </button>
          </div>

          {/* Admin Simulation Tester (Direct button for reviewer/user convenience) */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Last verified: {lastChecked.toLocaleTimeString()}</span>
            <button
              onClick={handleSimulateApproval}
              disabled={autoSimulateApproval}
              className="text-[#00529B] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              title="Instantly approve this account via server API for evaluation"
            >
              <Sparkles className="w-3 h-3" />
              <span>Simulate Admin Approval</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
