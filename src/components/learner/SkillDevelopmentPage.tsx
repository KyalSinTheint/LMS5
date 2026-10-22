import React, { useState, useMemo } from 'react';
import { useLms } from '../../context/LmsContext';
import { SkillDevelopmentResource } from '../../types/lms';
import { useBodyScrollLock } from '../../lib/useBodyScrollLock';
import {
  Compass,
  Search,
  Play,
  FileText,
  ExternalLink,
  Star,
  Download,
  X,
  BookOpen,
  Sparkles,
  Layers,
  Clock,
  HardDrive,
  GraduationCap,
} from 'lucide-react';

export const SkillDevelopmentPage: React.FC = () => {
  const { getPublishedSkillResources } = useLms();
  const publishedResources = getPublishedSkillResources();

  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedContentType, setSelectedContentType] = useState<'all' | 'video' | 'pdf' | 'link'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeResource, setActiveResource] = useState<SkillDevelopmentResource | null>(null);

  // Lock body scroll during active modal
  useBodyScrollLock(!!activeResource);

  // Extract all unique dynamic topics from available resources
  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    publishedResources.forEach((r) => {
      if (r.topic && r.topic.trim()) {
        set.add(r.topic.trim());
      }
    });
    return Array.from(set).sort();
  }, [publishedResources]);

  // Filtered resources
  const filteredResources = useMemo(() => {
    let list = publishedResources;

    if (selectedTopic !== 'all') {
      list = list.filter((r) => r.topic.toLowerCase() === selectedTopic.toLowerCase());
    }

    if (selectedContentType !== 'all') {
      list = list.filter((r) => r.content_type === selectedContentType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.topic.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          (r.instructor_name && r.instructor_name.toLowerCase().includes(q))
      );
    }

    return list;
  }, [publishedResources, selectedTopic, selectedContentType, searchQuery]);

  return (
    <div className="space-y-8 py-4 text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#176B98]/10 via-[#176B98]/5 to-transparent p-6 sm:p-8 rounded-3xl border border-[#176B98]/15">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#176B98]/10 text-[#176B98] text-xs font-bold tracking-wide mb-3">
          <Compass className="w-3.5 h-3.5 text-[#176B98]" />
          <span>Professional Development & Digital Capabilities</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#176B98] tracking-tight">
          Skill Development
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
          Master business English, Microsoft Excel analytics, leadership coaching, and technical skills curated for KBZLIFE insurance teams.
        </p>

        {/* Dynamic Topic Filter Pills */}
        <div className="mt-6 pt-4 border-t border-[#176B98]/15 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Topics:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTopic === 'all'
                ? 'bg-[#176B98] text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Classes ({publishedResources.length})
          </button>
          {availableTopics.map((topic) => {
            const count = publishedResources.filter((r) => r.topic.toLowerCase() === topic.toLowerCase()).length;
            return (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopic(topic)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedTopic.toLowerCase() === topic.toLowerCase()
                    ? 'bg-[#176B98] text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {topic} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Media Format Filter */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setSelectedContentType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedContentType === 'all'
                  ? 'bg-[#176B98] text-white'
                  : 'text-slate-600 hover:text-[#176B98]'
              }`}
            >
              All Formats
            </button>
            <button
              type="button"
              onClick={() => setSelectedContentType('video')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedContentType === 'video'
                  ? 'bg-[#176B98] text-white'
                  : 'text-slate-600 hover:text-[#176B98]'
              }`}
            >
              <Play className="w-3 h-3" />
              <span>Video</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedContentType('pdf')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedContentType === 'pdf'
                  ? 'bg-[#176B98] text-white'
                  : 'text-slate-600 hover:text-[#176B98]'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>PDF Handbook</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedContentType('link')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedContentType === 'link'
                  ? 'bg-[#176B98] text-white'
                  : 'text-slate-600 hover:text-[#176B98]'
              }`}
            >
              <ExternalLink className="w-3 h-3" />
              <span>External Link</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search classes or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#176B98]/30 focus:border-[#176B98]"
            />
          </div>
        </div>
      </div>

      {/* Resource Cards (Matching Reference Layout photo_2026-10-22_14.03.31_8815d33e.jpeg) */}
      {filteredResources.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 max-w-md mx-auto my-8">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No skill resources found</h3>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery
              ? `No classes match "${searchQuery}". Clear your search or choose a different topic.`
              : 'There are no published resources for this topic yet.'}
          </p>
          {(searchQuery || selectedTopic !== 'all' || selectedContentType !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedTopic('all');
                setSelectedContentType('all');
              }}
              className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-[#176B98] bg-[#F3F8FB] hover:bg-[#176B98] hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredResources.map((resource) => {
            const isVideo = resource.content_type === 'video';
            const isPdf = resource.content_type === 'pdf';
            const isLink = resource.content_type === 'link';

            return (
              <div
                key={resource.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-card-elevated hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 text-left"
              >
                {/* 1. TOP CARD MEDIA (Round cover styling matching reference photo) */}
                <div className="p-3.5 pb-0">
                  <div className="relative aspect-16/10 rounded-xl overflow-hidden bg-slate-900 shadow-2xs">
                    {resource.thumbnail_url ? (
                      <img
                        src={resource.thumbnail_url}
                        alt={resource.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-[#176B98] text-white p-4">
                        {isVideo && <Play className="w-10 h-10 text-white/80" />}
                        {isPdf && <FileText className="w-10 h-10 text-white/80" />}
                        {isLink && <ExternalLink className="w-10 h-10 text-white/80" />}
                        <span className="text-[11px] font-bold mt-2 text-white/70 uppercase">
                          {resource.topic} Class
                        </span>
                      </div>
                    )}

                    {/* Top Format / Lesson Badge (Reference photo: "▶ 16x Lesson") */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md bg-black/60 text-white shadow-xs flex items-center gap-1">
                        {isVideo && (
                          <>
                            <Play className="w-3 h-3 fill-white" />
                            <span>{resource.video_duration ? `Video · ${resource.video_duration}` : 'Video Lesson'}</span>
                          </>
                        )}
                        {isPdf && (
                          <>
                            <FileText className="w-3 h-3" />
                            <span>PDF Handbook</span>
                          </>
                        )}
                        {isLink && (
                          <>
                            <ExternalLink className="w-3 h-3" />
                            <span>Interactive Link</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Top Right Star Rating (Reference photo: "★ 4.8") */}
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold backdrop-blur-md bg-black/60 text-amber-300 shadow-xs flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-300" />
                        <span className="text-white font-mono">{resource.rating?.toFixed(1) || '4.9'}</span>
                      </span>
                    </div>

                    {/* Click Overlay Action */}
                    <button
                      type="button"
                      onClick={() => setActiveResource(resource)}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors cursor-pointer"
                      aria-label={`Open ${resource.title}`}
                    >
                      {isVideo && (
                        <div className="w-11 h-11 rounded-full bg-[#176B98] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. CARD TITLE & DESCRIPTION */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3
                      onClick={() => setActiveResource(resource)}
                      className="text-base font-extrabold text-[#176B98] tracking-tight group-hover:text-[#12567a] transition-colors leading-snug cursor-pointer line-clamp-2"
                    >
                      {resource.title}
                    </h3>
                    {resource.description && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {resource.description}
                      </p>
                    )}
                  </div>

                  {/* 3. INSTRUCTOR INFO (LEFT) & TOPIC BADGE (RIGHT) — EXACT MATCH TO REFERENCE PHOTO */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Instructor Profile (Left) */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {resource.instructor_avatar ? (
                        <img
                          src={resource.instructor_avatar}
                          alt={resource.instructor_name || 'Instructor'}
                          className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#176B98]/10 text-[#176B98] flex items-center justify-center font-bold text-xs shrink-0">
                          {resource.instructor_name
                            ? resource.instructor_name.slice(0, 2).toUpperCase()
                            : 'KB'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {resource.instructor_name || 'KBZLife Academy'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {resource.instructor_title || 'Lead Specialist'}
                        </div>
                      </div>
                    </div>

                    {/* Topic Badge (Right) */}
                    <span className="px-2.5 py-1 rounded-lg bg-[#F3F8FB] border border-[#176B98]/20 text-[#176B98] text-[11px] font-bold shrink-0">
                      {resource.topic}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          RESOURCE VIEW MODAL (VIDEO, PDF, OR EXTERNAL LINK)
          ========================================================================= */}
      {activeResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => setActiveResource(null)}
        >
          <div
            className={`bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200 text-left ${
              activeResource.content_type === 'pdf' ? 'h-[85vh] flex flex-col' : ''
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-[#F3F8FB] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 pr-4">
                <div className="w-8 h-8 rounded-lg bg-[#176B98] text-white flex items-center justify-center shrink-0">
                  {activeResource.content_type === 'video' && <Play className="w-4 h-4 fill-white" />}
                  {activeResource.content_type === 'pdf' && <FileText className="w-4 h-4" />}
                  {activeResource.content_type === 'link' && <ExternalLink className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#176B98] uppercase tracking-wider">
                      {activeResource.topic} Class
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {activeResource.content_type.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                    {activeResource.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeResource.content_type === 'link' && activeResource.external_url && (
                  <a
                    href={activeResource.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#176B98] hover:bg-[#12567a] text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Link</span>
                  </a>
                )}
                {activeResource.content_type === 'pdf' && activeResource.file_url && (
                  <a
                    href={activeResource.file_url}
                    download
                    className="px-3 py-1.5 rounded-xl bg-[#176B98] hover:bg-[#12567a] text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setActiveResource(null)}
                  className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {activeResource.content_type === 'video' && (
              <>
                <div className="relative bg-black aspect-16/9 flex items-center justify-center">
                  <video
                    src={activeResource.file_url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    poster={activeResource.thumbnail_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-3">
                      {activeResource.instructor_name && (
                        <span className="font-semibold text-slate-900">
                          Instructor: {activeResource.instructor_name}
                        </span>
                      )}
                      {activeResource.video_duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#176B98]" />
                          <span>{activeResource.video_duration}</span>
                        </span>
                      )}
                    </div>
                    {activeResource.file_url && (
                      <a
                        href={activeResource.file_url}
                        download
                        className="text-xs font-semibold text-[#176B98] hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Video</span>
                      </a>
                    )}
                  </div>
                  {activeResource.description && (
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {activeResource.description}
                    </p>
                  )}
                </div>
              </>
            )}

            {activeResource.content_type === 'pdf' && (
              <div className="flex-1 bg-slate-100 relative">
                <iframe
                  src={activeResource.file_url}
                  title={activeResource.title}
                  className="w-full h-full border-0"
                />
              </div>
            )}

            {activeResource.content_type === 'link' && (
              <div className="p-6 sm:p-8 space-y-4">
                <div className="p-4 rounded-2xl bg-[#F3F8FB] border border-[#176B98]/20 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#176B98] text-white flex items-center justify-center shrink-0">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900">External Resource Target</h4>
                    <p className="text-xs font-mono text-slate-600 mt-1 break-all">
                      {activeResource.external_url}
                    </p>
                    <div className="mt-3">
                      <a
                        href={activeResource.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#176B98] hover:bg-[#12567a] text-white text-xs font-bold transition-all shadow-xs"
                      >
                        <span>Launch Resource in New Tab</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {activeResource.description && (
                  <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {activeResource.description}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
