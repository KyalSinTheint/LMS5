import React, { useState } from 'react';
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { Channel } from '../../types/lms';

interface LearnerChannelsViewerProps {
  onSelectCourse?: (courseId: string) => void;
}

export const LearnerChannelsViewer: React.FC<LearnerChannelsViewerProps> = ({ onSelectCourse }) => {
  const { currentUser, getUserAccessibleChannels, courses, recordProgress, getUserProgress } = useLms();

  const accessibleChannels = getUserAccessibleChannels(currentUser.id);
  const [currentIndex, setCurrentIndex] = useState(0);

  // If user account is suspended
  if (currentUser.account_status === 'suspended') {
    return (
      <div className="bg-white rounded-3xl border border-red-200 shadow-sm p-8 text-center max-w-xl mx-auto space-y-4 my-8">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          Learning Channel Access Suspended
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Your employee account (<span className="font-semibold text-slate-800">{currentUser.email}</span>) has been suspended by an administrator. Channel viewing, streaming, and progress recording are locked. Please contact LMS Administration for clearance.
        </p>
      </div>
    );
  }

  // If user has no accessible channels
  if (accessibleChannels.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-8 text-center max-w-xl mx-auto space-y-4 my-8">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Learning Channels Assigned</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          You currently do not have any authorized learning channels. When an administrator grants channel access in the Admin Panel, your assigned channel cards will appear here in real time.
        </p>
      </div>
    );
  }

  // Ensure index is within range
  const safeIndex = Math.min(currentIndex, accessibleChannels.length - 1);
  const currentChannel: Channel = accessibleChannels[safeIndex];
  const linkedCourse = courses.find((c) => c.id === currentChannel.course_id);
  const progress = getUserProgress(currentUser.id, undefined, currentChannel.id);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : accessibleChannels.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < accessibleChannels.length - 1 ? prev + 1 : 0));
  };

  const handleCompleteChannel = async () => {
    await recordProgress(undefined, currentChannel.id, 100, 'completed', 'Channel Core Highlights Completed');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Single-Channel Navigation Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#00529B]/10 text-[#003366] mb-1">
            <Layers className="w-3.5 h-3.5 text-[#00529B]" />
            <span>Interactive Learning Channels (One-at-a-Time Navigation)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {currentChannel.title}
          </h2>
        </div>

        {/* Navigation Controls: Previous / Next & Index indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-2">
            Channel {safeIndex + 1} of {accessibleChannels.length}
          </span>
          <button
            onClick={handlePrev}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            title="Previous Channel"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-2.5 rounded-xl bg-[#003366] text-white hover:bg-[#00529B] shadow-2xs transition-colors cursor-pointer"
            title="Next Channel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Single-Channel Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Left: Thumbnail & Linked Course */}
        <div className="md:w-5/12 relative min-h-[260px] md:min-h-full bg-slate-100 overflow-hidden">
          <img
            src={currentChannel.thumbnail_url}
            alt={currentChannel.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-[#003366] backdrop-blur-xs shadow-xs">
              Channel #{currentChannel.order_index}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
            {linkedCourse && (
              <div className="text-[11px] text-sky-200 flex items-center gap-1.5 font-medium">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="truncate">Linked: {linkedCourse.title}</span>
              </div>
            )}
            <p className="text-xs text-white/80 line-clamp-2">{currentChannel.description}</p>
          </div>
        </div>

        {/* Right: Channel Directives, Key Highlights & Actions */}
        <div className="md:w-7/12 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Tags */}
            {currentChannel.tags && currentChannel.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {currentChannel.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#EDF4FB] text-[#00529B] border border-sky-100"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                Operational Highlights & Directives
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Mandatory operational focus areas for authorized channel personnel.
              </p>
            </div>

            {/* Highlights checklist */}
            <div className="space-y-2.5">
              {currentChannel.key_highlights && currentChannel.key_highlights.length > 0 ? (
                currentChannel.key_highlights.map((highlight, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3 text-xs text-slate-700"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#00529B] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{highlight}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-500 italic">
                  Standard channel operational briefings active.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Completion & Navigation Strip */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              {progress?.completion_status === 'completed' ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Channel Directives Completed</span>
                </span>
              ) : (
                <span className="text-slate-500">
                  Authorized access for <strong className="text-slate-800">{currentUser.full_name}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {progress?.completion_status !== 'completed' && (
                <button
                  onClick={handleCompleteChannel}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Mark Channel Complete
                </button>
              )}

              {linkedCourse && onSelectCourse && (
                <button
                  onClick={() => onSelectCourse(linkedCourse.id)}
                  className="px-4 py-2 rounded-xl bg-[#003366] hover:bg-[#00529B] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Course</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
