import React, { useState, useRef } from 'react';
import { useLms } from '../../context/LmsContext';
import { LicenseTrainingLesson, LessonContentType } from '../../types/lms';
import { validateLessonFile, uploadLargeFileChunked, uploadImageFile, estimateVideoDuration } from '../../lib/storageUtils';
import { useBodyScrollLock } from '../../lib/useBodyScrollLock';
import {
  Award,
  Plus,
  Play,
  FileText,
  Upload,
  X,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Clock,
  Layers,
  ArrowUpDown,
  Search,
} from 'lucide-react';

interface FormData {
  id?: string;
  title: string;
  description: string;
  lesson_type: LessonContentType;
  display_order: number;
  is_published: boolean;
  file_url: string;
  file_path?: string;
  file_size?: number;
  file_size_formatted?: string;
  video_duration?: string;
  thumbnail_url?: string;
  thumbnail_path?: string;
}

const INITIAL_FORM: FormData = {
  title: '',
  description: '',
  lesson_type: 'video',
  display_order: 1,
  is_published: true,
  file_url: '',
  thumbnail_url: '',
};

export const LicenseTrainingManagement: React.FC = () => {
  const {
    licenseTrainingLessons,
    createLicenseLesson,
    updateLicenseLesson,
    deleteLicenseLesson,
    showToast,
  } = useLms();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'pdf'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Upload progress state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Lock background scroll when modal or delete confirmation is open
  useBodyScrollLock(isModalOpen || !!deleteConfirmId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCreate = () => {
    setFormData({
      ...INITIAL_FORM,
      display_order: licenseTrainingLessons.length + 1,
    });
    setUploadError(null);
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lesson: LicenseTrainingLesson) => {
    setFormData({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description || '',
      lesson_type: (lesson.lesson_type || lesson.content_type || 'video') as LessonContentType,
      display_order: lesson.display_order,
      is_published: lesson.is_published ?? (lesson.status === 'published'),
      file_url: lesson.file_url,
      file_path: lesson.file_path,
      file_size: lesson.file_size,
      file_size_formatted: lesson.file_size_formatted,
      video_duration: lesson.video_duration,
      thumbnail_url: lesson.thumbnail_url || '',
      thumbnail_path: lesson.thumbnail_path,
    });
    setUploadError(null);
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatusText('Upload cancelled by user.');
    showToast('info', 'Upload Cancelled', 'File upload was halted.');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (up to 1 GB for videos, 50 MB for PDFs)
    const validation = validateLessonFile(file, formData.lesson_type);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      showToast('error', 'File Rejected', validation.error || 'File validation failed');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatusText(`Preparing ${formData.lesson_type} upload...`);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Estimate video duration if video
      let durationStr: string | undefined;
      if (formData.lesson_type === 'video') {
        try {
          const durationSeconds = await estimateVideoDuration(file);
          const mins = Math.floor(durationSeconds / 60);
          const secs = Math.floor(durationSeconds % 60);
          durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        } catch {
          durationStr = undefined;
        }
      }

      const result = await uploadLargeFileChunked(
        file,
        'license_training',
        (pct, loaded, total) => {
          setUploadProgress(pct);
          setUploadStatusText(`Uploading: ${pct}% (${(loaded / 1024 / 1024).toFixed(1)}MB of ${(total / 1024 / 1024).toFixed(1)}MB)`);
        },
        abortController.signal
      );

      if (!result.success || !result.url) {
        throw new Error(result.error || 'Upload failed');
      }

      setFormData((prev) => ({
        ...prev,
        file_url: result.url || prev.file_url,
        file_path: result.path,
        file_size: result.size,
        file_size_formatted: result.formattedSize,
        video_duration: durationStr || prev.video_duration,
      }));

      setUploadStatusText(`Upload complete (${result.formattedSize})`);
      showToast('success', 'File Uploaded', `${file.name} uploaded successfully.`);
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        setUploadStatusText('Upload cancelled.');
      } else {
        const msg = err.message || 'File upload failed';
        setUploadError(msg);
        showToast('error', 'Upload Error', msg);
      }
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadImageFile(file, 'lesson_thumbnails');
      if (res.success && res.url) {
        setFormData((prev) => ({
          ...prev,
          thumbnail_url: res.url,
          thumbnail_path: res.path,
        }));
        showToast('success', 'Cover Saved', 'Lesson thumbnail cover updated.');
      } else {
        showToast('error', 'Thumbnail Error', res.error || 'Failed to upload cover');
      }
    } catch (err: any) {
      showToast('error', 'Thumbnail Error', err.message || 'Upload failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast('error', 'Validation Error', 'Lesson title is required.');
      return;
    }

    if (!formData.file_url) {
      showToast('error', 'Validation Error', `Please upload a ${formData.lesson_type} file for this lesson.`);
      return;
    }

    setIsSubmitting(true);
    try {
      if (formData.id) {
        const success = await updateLicenseLesson(formData.id, {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          lesson_type: formData.lesson_type,
          display_order: Number(formData.display_order),
          is_published: formData.is_published,
          file_url: formData.file_url,
          file_path: formData.file_path,
          file_size: formData.file_size,
          file_size_formatted: formData.file_size_formatted,
          video_duration: formData.video_duration,
          thumbnail_url: formData.thumbnail_url || undefined,
          thumbnail_path: formData.thumbnail_path,
        });
        if (success) {
          setIsModalOpen(false);
        }
      } else {
        const created = await createLicenseLesson({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          lesson_type: formData.lesson_type,
          display_order: Number(formData.display_order),
          is_published: formData.is_published,
          file_url: formData.file_url,
          file_path: formData.file_path,
          file_size: formData.file_size,
          file_size_formatted: formData.file_size_formatted,
          video_duration: formData.video_duration,
          thumbnail_url: formData.thumbnail_url || undefined,
          thumbnail_path: formData.thumbnail_path,
        });
        if (created) {
          setIsModalOpen(false);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteLicenseLesson(id);
    setDeleteConfirmId(null);
  };

  const filteredLessons = licenseTrainingLessons.filter((l) => {
    if (filterType !== 'all' && l.lesson_type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return l.title.toLowerCase().includes(q) || (l.description && l.description.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#176B98]/10 text-[#176B98] text-xs font-bold mb-1">
            <Award className="w-3.5 h-3.5" />
            <span>Admin Management</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#176B98] tracking-tight">
            License Training Lessons
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage professional licensing curriculum. Directly upload lessons up to 1 GB with real-time chunk streaming.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-[#176B98] hover:bg-[#12567a] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Lesson</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="inline-flex p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all' ? 'bg-white text-[#176B98] shadow-2xs' : 'text-slate-600 hover:text-[#176B98]'
            }`}
          >
            All ({licenseTrainingLessons.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('video')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              filterType === 'video' ? 'bg-white text-[#176B98] shadow-2xs' : 'text-slate-600 hover:text-[#176B98]'
            }`}
          >
            Videos ({licenseTrainingLessons.filter((l) => l.lesson_type === 'video').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('pdf')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              filterType === 'pdf' ? 'bg-white text-[#176B98] shadow-2xs' : 'text-slate-600 hover:text-[#176B98]'
            }`}
          >
            PDFs ({licenseTrainingLessons.filter((l) => l.lesson_type === 'pdf').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B98]/30 focus:border-[#176B98]"
          />
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {filteredLessons.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Award className="w-12 h-12 mx-auto mb-2 opacity-40 text-[#176B98]" />
            <p className="text-sm font-semibold text-slate-600">No license lessons found</p>
            <p className="text-xs text-slate-400 mt-1">Click "Add New Lesson" to upload a video or PDF handbook.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Thumbnail / Icon */}
                  <div className="w-20 sm:w-24 aspect-16/10 rounded-xl overflow-hidden bg-slate-900 shrink-0 relative border border-slate-200">
                    {lesson.thumbnail_url ? (
                      <img src={lesson.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#176B98] text-white">
                        {lesson.lesson_type === 'video' ? <Play className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/70 text-[9px] font-mono text-white">
                      #{lesson.display_order}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                          lesson.lesson_type === 'video'
                            ? 'bg-[#176B98]/10 text-[#176B98]'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {lesson.lesson_type === 'video' ? <Play className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        <span>{lesson.lesson_type}</span>
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          lesson.is_published
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {lesson.is_published ? <CheckCircle2 className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{lesson.is_published ? 'Published' : 'Draft'}</span>
                      </span>

                      {lesson.file_size_formatted && (
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          <span>{lesson.file_size_formatted}</span>
                        </span>
                      )}

                      {lesson.video_duration && (
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{lesson.video_duration}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-extrabold text-[#176B98] truncate">{lesson.title}</h3>
                    {lesson.description && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{lesson.description}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {/* Quick publish toggle */}
                  <button
                    type="button"
                    onClick={() => updateLicenseLesson(lesson.id, { is_published: !lesson.is_published })}
                    className={`p-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      lesson.is_published
                        ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                    }`}
                    title={lesson.is_published ? 'Unpublish (hide from users)' : 'Publish (show to users)'}
                  >
                    {lesson.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(lesson)}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-[#176B98] hover:bg-[#F3F8FB] transition-colors cursor-pointer"
                    title="Edit Lesson"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(lesson.id)}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete Lesson"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          CREATE / EDIT MODAL (BACKGROUND FIXED WITH useBodyScrollLock)
          ========================================================================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => {
            if (!isUploading) setIsModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-[#F3F8FB] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#176B98] text-white flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {formData.id ? 'Edit License Training Lesson' : 'Upload New License Lesson'}
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    Direct local device upload supporting videos up to 1 GB
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={isUploading}
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* Lesson Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Content Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, lesson_type: 'video' }))}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      formData.lesson_type === 'video'
                        ? 'border-[#176B98] bg-[#176B98]/5 ring-2 ring-[#176B98]/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#176B98]/10 text-[#176B98] flex items-center justify-center shrink-0">
                      <Play className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">Video Lesson</div>
                      <div className="text-[10px] text-slate-500">MP4, WebM up to 1 GB</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, lesson_type: 'pdf' }))}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      formData.lesson_type === 'pdf'
                        ? 'border-[#176B98] bg-[#176B98]/5 ring-2 ring-[#176B98]/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">PDF Document</div>
                      <div className="text-[10px] text-slate-500">PDF Guide, handbook</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lesson Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Life Insurance Licensing: Principles & Regulations"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#176B98]/30 focus:border-[#176B98]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Study Objectives (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of topics covered, key regulatory compliance items, and licensing requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#176B98]/30 focus:border-[#176B98]"
                />
              </div>

              {/* Direct File Upload Control (No URL pasting requirement) */}
              <div className="p-4 bg-[#F3F8FB] rounded-2xl border border-[#176B98]/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-[#176B98] flex items-center gap-1.5">
                    <Upload className="w-4 h-4" />
                    <span>Upload {formData.lesson_type === 'video' ? 'Lesson Video (up to 1 GB)' : 'Lesson PDF Document'}</span>
                  </label>
                  {formData.file_size_formatted && (
                    <span className="text-[10px] font-mono text-slate-500">
                      Size: {formData.file_size_formatted}
                    </span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={formData.lesson_type === 'video' ? 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov' : 'application/pdf,.pdf'}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {formData.file_url ? (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          File Ready: {formData.file_path || 'Uploaded File'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {formData.file_size_formatted || 'Stored in persistent storage'}
                          {formData.video_duration && ` · Duration: ${formData.video_duration}`}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs font-semibold text-[#176B98] hover:bg-[#F3F8FB] rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      Replace File
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-6 border-2 border-dashed border-[#176B98]/40 hover:border-[#176B98] rounded-xl flex flex-col items-center justify-center bg-white/80 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-8 h-8 text-[#176B98] mb-1.5 opacity-80" />
                    <span className="text-xs font-bold text-slate-800">
                      Select {formData.lesson_type === 'video' ? 'Video File from Device' : 'PDF File from Device'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {formData.lesson_type === 'video' ? 'Supports files up to 1 GB with chunk streaming' : 'Supports standard PDF documents'}
                    </span>
                  </button>
                )}

                {/* Live Upload Progress */}
                {isUploading && (
                  <div className="p-3 bg-white rounded-xl border border-sky-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-sky-800">{uploadStatusText}</span>
                      <span className="font-mono font-bold text-[#176B98]">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#176B98] transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={handleCancelUpload}
                        className="text-[11px] text-red-600 hover:underline font-semibold"
                      >
                        Cancel Upload
                      </button>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs flex items-start gap-2 border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Upload Error</p>
                      <p className="text-[11px] mt-0.5">{uploadError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Thumbnail Cover Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional Thumbnail Cover Image
                </label>
                <div className="flex items-center gap-3">
                  {formData.thumbnail_url ? (
                    <div className="w-20 aspect-16/10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <img src={formData.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : null}

                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  >
                    {formData.thumbnail_url ? 'Change Cover' : 'Upload Cover Image'}
                  </button>
                  {formData.thumbnail_url && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, thumbnail_url: '' }))}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Display Order & Publishing Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.display_order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Publishing Status
                  </label>
                  <select
                    value={formData.is_published ? 'published' : 'draft'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_published: e.target.value === 'published' }))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="published">Published (Visible to learners)</option>
                    <option value="draft">Draft (Hidden from learners)</option>
                  </select>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isSubmitting || isUploading}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading || !formData.file_url}
                  className="px-5 py-2.5 rounded-xl bg-[#176B98] hover:bg-[#12567a] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{formData.id ? 'Save Lesson Changes' : 'Publish Lesson'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
          ========================================================================= */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Delete License Lesson?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will permanently delete this lesson and its uploaded content. Learners will no longer be able to access it.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
