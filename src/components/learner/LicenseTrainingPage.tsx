import React, { useState, useMemo } from 'react';
import { useLms } from '../../context/LmsContext';
import { LicenseTrainingLesson } from '../../types/lms';
import { useBodyScrollLock } from '../../lib/useBodyScrollLock';
import {
  Award,
  Play,
  FileText,
  Search,
  Download,
  ExternalLink,
  Clock,
  HardDrive,
  X,
  BookOpen,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const LicenseTrainingPage: React.FC = () => {
  const { getPublishedLicenseLessons } = useLms();
  const publishedLessons = getPublishedLicenseLessons();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'pdf'>('all');
  const [selectedVideoLesson, setSelectedVideoLesson] = useState<LicenseTrainingLesson | null>(null);
  const [selectedPdfLesson, setSelectedPdfLesson] = useState<LicenseTrainingLesson | null>(null);

  // Lock body scroll when either modal is open
  useBodyScrollLock(!!selectedVideoLesson || !!selectedPdfLesson);

  const filteredLessons = useMemo(() => {
    let list = publishedLessons;

    if (activeTab !== 'all') {
      list = list.filter((l) => (l.lesson_type || l.content_type) === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          (l.description && l.description.toLowerCase().includes(q))
      );
    }

    return list;
  }, [publishedLessons, activeTab, searchQuery]);

  const videoCount = publishedLessons.filter((l) => (l.lesson_type || l.content_type) === 'video').length;
  const pdfCount = publishedLessons.filter((l) => (l.lesson_type || l.content_type) === 'pdf').length;

  return (
    <div className="space-y-8 py-4 text-left">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#176B98]/10 via-[#176B98]/5 to-transparent p-6 sm:p-8 rounded-3xl border border-[#176B98]/15">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#176B98]/10 text-[#176B98] text-xs font-bold tracking-wide mb-3">
          <Award className="w-3.5 h-3.5 text-[#176B98]" />
          <span>Professional Certification & Compliance Hub</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#176B98] tracking-tight">
          License Training
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
          Official insurance agent certification training, regulatory compliance curriculum, and professional underwriting study materials approved by KBZLIFE.
        </p>

        {/* Filter & Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-[#176B98]/15">
          {/* Tabs */}
          <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#176B98] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-[#176B98]'
              }`}
            >
              All Materials ({publishedLessons.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'video'
                  ? 'bg-[#176B98] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-[#176B98]'
              }`}
            >
              <Play className="w-3 h-3" />
              <span>Video Lessons ({videoCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pdf'
                  ? 'bg-[#176B98] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-[#176B98]'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>PDF Handbooks ({pdfCount})</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search license lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#176B98]/30 focus:border-[#176B98]"
            />
          </div>
        </div>
      </div>

      {/* Content Grid */}
      {filteredLessons.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 max-w-md mx-auto my-8">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No training lessons found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery
              ? `No lessons match "${searchQuery}". Clear your search or switch tabs.`
              : 'There are currently no published lessons in this category.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-[#176B98] bg-[#F3F8FB] hover:bg-[#176B98] hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredLessons.map((lesson) => {
            const isVideo = lesson.lesson_type === 'video';

            return (
              <div
                key={lesson.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-card-elevated hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 text-left"
              >
                {/* Media Header / Thumbnail */}
                <div className="relative aspect-16/9 bg-slate-900 overflow-hidden">
                  {lesson.thumbnail_url ? (
                    <img
                      src={lesson.thumbnail_url}
                      alt={lesson.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-[#176B98] text-white p-4">
                      {isVideo ? (
                        <Play className="w-10 h-10 text-white/80" />
                      ) : (
                        <FileText className="w-10 h-10 text-white/80" />
                      )}
                      <span className="text-[11px] font-bold mt-2 text-white/70">KBZLIFE ACADEMY</span>
                    </div>
                  )}

                  {/* Top Type Pill */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-xs flex items-center gap-1 ${
                        isVideo
                          ? 'bg-[#176B98]/90 text-white'
                          : 'bg-emerald-600/90 text-white'
                      }`}
                    >
                      {isVideo ? (
                        <>
                          <Play className="w-3 h-3" />
                          <span>Video Lesson</span>
                        </>
                      ) : (
                        <>
                          <FileText className="w-3 h-3" />
                          <span>PDF Document</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Play Action Overlay for Videos */}
                  {isVideo && (
                    <button
                      type="button"
                      onClick={() => setSelectedVideoLesson(lesson)}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors cursor-pointer"
                      aria-label={`Play ${lesson.title}`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#176B98] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </button>
                  )}

                  {/* Duration / File Size Badge */}
                  <div className="absolute bottom-2.5 right-2.5">
                    {isVideo && lesson.video_duration && (
                      <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{lesson.video_duration}</span>
                      </span>
                    )}
                    {!isVideo && lesson.file_size_formatted && (
                      <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        <span>{lesson.file_size_formatted}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-extrabold text-[#176B98] tracking-tight group-hover:text-[#12567a] transition-colors leading-snug">
                      {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                        {lesson.description}
                      </p>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      Module #{lesson.display_order}
                    </span>

                    {isVideo ? (
                      <button
                        type="button"
                        onClick={() => setSelectedVideoLesson(lesson)}
                        className="px-3 py-1.5 rounded-xl bg-[#176B98] hover:bg-[#12567a] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Watch Video</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedPdfLesson(lesson)}
                          className="px-2.5 py-1.5 rounded-xl bg-[#176B98] hover:bg-[#12567a] text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Preview</span>
                        </button>
                        <a
                          href={lesson.file_url}
                          download
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-[#176B98] hover:bg-[#F3F8FB] transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          VIDEO PLAYER MODAL (DEDICATED VIEWING EXPERIENCE)
          ========================================================================= */}
      {selectedVideoLesson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedVideoLesson(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-[#F3F8FB]">
              <div className="flex items-center gap-2.5 min-w-0 pr-4">
                <div className="w-8 h-8 rounded-lg bg-[#176B98] text-white flex items-center justify-center shrink-0">
                  <Play className="w-4 h-4 fill-white" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-[#176B98] uppercase tracking-wider block">
                    License Training Video
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                    {selectedVideoLesson.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideoLesson(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative bg-black aspect-16/9 flex items-center justify-center">
              <video
                src={selectedVideoLesson.file_url}
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster={selectedVideoLesson.thumbnail_url}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Video Details */}
            <div className="p-5 sm:p-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {selectedVideoLesson.video_duration && (
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-[#176B98]" />
                      <span>{selectedVideoLesson.video_duration}</span>
                    </span>
                  )}
                  {selectedVideoLesson.file_size_formatted && (
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>{selectedVideoLesson.file_size_formatted}</span>
                    </span>
                  )}
                  <span>Order #{selectedVideoLesson.display_order}</span>
                </div>

                <a
                  href={selectedVideoLesson.file_url}
                  download
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:text-[#176B98] hover:bg-[#F3F8FB] transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Video</span>
                </a>
              </div>

              {selectedVideoLesson.description && (
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedVideoLesson.description}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PDF VIEWER & PREVIEW MODAL
          ========================================================================= */}
      {selectedPdfLesson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedPdfLesson(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-[#F3F8FB] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 pr-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                    License Regulation Document
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                    {selectedPdfLesson.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={selectedPdfLesson.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:text-[#176B98] hover:bg-white transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open in New Tab</span>
                </a>
                <a
                  href={selectedPdfLesson.file_url}
                  download
                  className="px-3 py-1.5 rounded-xl bg-[#176B98] hover:bg-[#12567a] text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedPdfLesson(null)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer ml-1"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Iframe Viewer */}
            <div className="flex-1 bg-slate-100 relative">
              <iframe
                src={selectedPdfLesson.file_url}
                title={selectedPdfLesson.title}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
