import React, { useState, useRef, useMemo } from 'react';
import { useLms } from '../../context/LmsContext';
import { SkillDevelopmentResource, SkillContentType } from '../../types/lms';
import { validateLessonFile, uploadLargeFileChunked, uploadImageFile, estimateVideoDuration } from '../../lib/storageUtils';
import { useBodyScrollLock } from '../../lib/useBodyScrollLock';
import {
  Compass,
  Plus,
  Play,
  FileText,
  ExternalLink,
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
  Star,
  Search,
  Layers,
  Link as LinkIcon,
} from 'lucide-react';

interface FormData {
  id?: string;
  title: string;
  description: string;
  topic: string;
  content_type: SkillContentType;
  file_url?: string;
  file_path?: string;
  file_size?: number;
  file_size_formatted?: string;
  external_url?: string;
  video_duration?: string;
  thumbnail_url?: string;
  thumbnail_path?: string;
  instructor_name?: string;
  instructor_title?: string;
  instructor_avatar?: string;
  rating?: number;
  display_order: number;
  is_published: boolean;
}

const COMMON_TOPICS = ['English', 'Excel', 'Leadership', 'Data & Analytics', 'Technology', 'Communication'];

const INITIAL_FORM: FormData = {
  title: '',
  description: '',
  topic: 'English',
  content_type: 'video',
  display_order: 1,
  is_published: true,
  rating: 4.8,
  instructor_name: 'KBZLife Academy',
  instructor_title: 'Lead Instructor',
};

export const SkillDevelopmentManagement: React.FC = () => {
  const {
    skillDevelopmentResources,
    createSkillResource,
    updateSkillResource,
    deleteSkillResource,
    showToast,
  } = useLms();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Upload progress state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Lock body scroll during modal open
  useBodyScrollLock(isModalOpen || !!deleteConfirmId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Collect all unique topics dynamically from current resources plus common topics
  const allKnownTopics = useMemo(() => {
    const set = new Set<string>(COMMON_TOPICS);
    skillDevelopmentResources.forEach((r) => {
      if (r.topic && r.topic.trim()) set.add(r.topic.trim());
    });
    return Array.from(set);
  }, [skillDevelopmentResources]);

  const handleOpenCreate = () => {
    setFormData({
      ...INITIAL_FORM,
      display_order: skillDevelopmentResources.length + 1,
    });
    setCustomTopicInput('');
    setUploadError(null);
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (res: SkillDevelopmentResource) => {
    setFormData({
      id: res.id,
      title: res.title,
      description: res.description || '',
      topic: res.topic,
      content_type: res.content_type,
      file_url: res.file_url,
      file_path: res.file_path,
      file_size: res.file_size,
      file_size_formatted: res.file_size_formatted,
      external_url: res.external_url || '',
      video_duration: res.video_duration,
      thumbnail_url: res.thumbnail_url || '',
      thumbnail_path: res.thumbnail_path,
      instructor_name: res.instructor_name || '',
      instructor_title: res.instructor_title || '',
      instructor_avatar: res.instructor_avatar || '',
      rating: res.rating || 4.8,
      display_order: res.display_order,
      is_published: res.is_published ?? (res.status === 'published'),
    });
    setCustomTopicInput('');
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
    setUploadStatusText('Upload cancelled by administrator.');
    showToast('info', 'Upload Cancelled', 'File upload was halted.');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.content_type === 'link') return;

    const validation = validateLessonFile(file, formData.content_type as 'video' | 'pdf');
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      showToast('error', 'File Rejected', validation.error || 'File validation failed');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatusText(`Preparing ${formData.content_type} upload...`);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let durationStr: string | undefined;
      if (formData.content_type === 'video') {
        try {
          const durationSecs = await estimateVideoDuration(file);
          const mins = Math.floor(durationSecs / 60);
          const secs = Math.floor(durationSecs % 60);
          durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
        } catch {
          durationStr = undefined;
        }
      }

      const result = await uploadLargeFileChunked(
        file,
        'skill_development',
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
        file_url: result.url,
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
      const res = await uploadImageFile(file, 'skill_thumbnails');
      if (res.success && res.url) {
        setFormData((prev) => ({
          ...prev,
          thumbnail_url: res.url,
          thumbnail_path: res.path,
        }));
        showToast('success', 'Thumbnail Saved', 'Resource cover image uploaded.');
      }
    } catch (err: any) {
      showToast('error', 'Upload Failed', err.message);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await uploadImageFile(file, 'instructor_avatars');
      if (res.success && res.url) {
        setFormData((prev) => ({
          ...prev,
          instructor_avatar: res.url,
        }));
        showToast('success', 'Avatar Saved', 'Instructor photo updated.');
      }
    } catch (err: any) {
      showToast('error', 'Avatar Failed', err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const topicToSave = customTopicInput.trim() || formData.topic.trim() || 'General';

    if (!formData.title.trim()) {
      showToast('error', 'Validation Error', 'Resource title is required.');
      return;
    }

    if (formData.content_type === 'link') {
      if (!formData.external_url || !formData.external_url.trim()) {
        showToast('error', 'Validation Error', 'External link URL is required for link resources.');
        return;
      }
    } else {
      if (!formData.file_url) {
        showToast('error', 'Validation Error', `Please upload a ${formData.content_type} file for this resource.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (formData.id) {
        const success = await updateSkillResource(formData.id, {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          topic: topicToSave,
          content_type: formData.content_type,
          file_url: formData.file_url,
          file_path: formData.file_path,
          file_size: formData.file_size,
          file_size_formatted: formData.file_size_formatted,
          external_url: formData.external_url?.trim() || undefined,
          video_duration: formData.video_duration,
          thumbnail_url: formData.thumbnail_url || undefined,
          thumbnail_path: formData.thumbnail_path,
          instructor_name: formData.instructor_name?.trim() || undefined,
          instructor_title: formData.instructor_title?.trim() || undefined,
          instructor_avatar: formData.instructor_avatar || undefined,
          rating: Number(formData.rating) || 4.8,
          display_order: Number(formData.display_order),
          is_published: formData.is_published,
        });
        if (success) setIsModalOpen(false);
      } else {
        const created = await createSkillResource({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          topic: topicToSave,
          content_type: formData.content_type,
          file_url: formData.file_url,
          file_path: formData.file_path,
          file_size: formData.file_size,
          file_size_formatted: formData.file_size_formatted,
          external_url: formData.external_url?.trim() || undefined,
          video_duration: formData.video_duration,
          thumbnail_url: formData.thumbnail_url || undefined,
          thumbnail_path: formData.thumbnail_path,
          instructor_name: formData.instructor_name?.trim() || undefined,
          instructor_title: formData.instructor_title?.trim() || undefined,
          instructor_avatar: formData.instructor_avatar || undefined,
          rating: Number(formData.rating) || 4.8,
          display_order: Number(formData.display_order),
          is_published: formData.is_published,
        });
        if (created) setIsModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteSkillResource(id);
    setDeleteConfirmId(null);
  };

  const filteredResources = skillDevelopmentResources.filter((r) => {
    if (filterTopic !== 'all' && r.topic.toLowerCase() !== filterTopic.toLowerCase()) return false;
    if (filterType !== 'all' && r.content_type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        r.title.toLowerCase().includes(q) ||
        r.topic.toLowerCase().includes(q) ||
        (r.instructor_name && r.instructor_name.toLowerCase().includes(q)) ||
        (r.description && r.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#176B98]/10 text-[#176B98] text-xs font-bold mb-1">
            <Compass className="w-3.5 h-3.5" />
            <span>Admin Management</span>
          </div>
          <h2 className="text-xl font-extrabold text-[#176B98] tracking-tight">
            Skill Development Resources
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage English, Excel, leadership, and digital capability training materials with direct video/PDF upload and external links.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-[#176B98] hover:bg-[#12567a] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Learning Resource</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          {/* Topic Filter */}
          <select
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 text-xs border border-slate-200 rounded-lg font-semibold text-slate-700"
          >
            <option value="all">All Topics ({skillDevelopmentResources.length})</option>
            {allKnownTopics.map((t) => (
              <option key={t} value={t}>
                {t} ({skillDevelopmentResources.filter((r) => r.topic.toLowerCase() === t.toLowerCase()).length})
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 text-xs border border-slate-200 rounded-lg font-semibold text-slate-700"
          >
            <option value="all">All Formats</option>
            <option value="video">Videos</option>
            <option value="pdf">PDFs</option>
            <option value="link">External Links</option>
          </select>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search classes or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#176B98]/30 focus:border-[#176B98]"
          />
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        {filteredResources.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Compass className="w-12 h-12 mx-auto mb-2 opacity-40 text-[#176B98]" />
            <p className="text-sm font-semibold text-slate-600">No skill resources found</p>
            <p className="text-xs text-slate-400 mt-1">Click "Add Learning Resource" to upload a class or external tutorial.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredResources.map((res) => (
              <div
                key={res.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Thumbnail */}
                  <div className="w-20 sm:w-24 aspect-16/10 rounded-xl overflow-hidden bg-slate-900 shrink-0 relative border border-slate-200">
                    {res.thumbnail_url ? (
                      <img src={res.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#176B98] text-white">
                        {res.content_type === 'video' && <Play className="w-6 h-6" />}
                        {res.content_type === 'pdf' && <FileText className="w-6 h-6" />}
                        {res.content_type === 'link' && <ExternalLink className="w-6 h-6" />}
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/70 text-[9px] font-mono text-white">
                      #{res.display_order}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#176B98]/10 text-[#176B98] uppercase">
                        {res.topic}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase flex items-center gap-1">
                        {res.content_type === 'video' && <Play className="w-3 h-3" />}
                        {res.content_type === 'pdf' && <FileText className="w-3 h-3" />}
                        {res.content_type === 'link' && <ExternalLink className="w-3 h-3" />}
                        <span>{res.content_type}</span>
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          res.is_published
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {res.is_published ? <CheckCircle2 className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{res.is_published ? 'Published' : 'Draft'}</span>
                      </span>

                      {res.instructor_name && (
                        <span className="text-[10px] text-slate-500 font-semibold truncate">
                          Instructor: {res.instructor_name}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-extrabold text-[#176B98] truncate">{res.title}</h3>
                    {res.description && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{res.description}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => updateSkillResource(res.id, { is_published: !res.is_published })}
                    className={`p-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      res.is_published
                        ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                    }`}
                    title={res.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {res.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(res)}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-[#176B98] hover:bg-[#F3F8FB] transition-colors cursor-pointer"
                    title="Edit Resource"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(res.id)}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete Resource"
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
          CREATE / EDIT MODAL
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
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {formData.id ? 'Edit Skill Resource' : 'Add Skill Development Resource'}
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    Flexible classes for English, Excel, and technical capabilities
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
              {/* Content Format Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Content Format Type
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, content_type: 'video' }))}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      formData.content_type === 'video'
                        ? 'border-[#176B98] bg-[#176B98]/5 ring-2 ring-[#176B98]/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#176B98]/10 text-[#176B98] flex items-center justify-center">
                      <Play className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 mt-1">Uploaded Video</div>
                    <div className="text-[10px] text-slate-500">Up to 1 GB direct upload</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, content_type: 'pdf' }))}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      formData.content_type === 'pdf'
                        ? 'border-[#176B98] bg-[#176B98]/5 ring-2 ring-[#176B98]/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 mt-1">PDF Document</div>
                    <div className="text-[10px] text-slate-500">Cheat-sheet / Guide</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, content_type: 'link' }))}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      formData.content_type === 'link'
                        ? 'border-[#176B98] bg-[#176B98]/5 ring-2 ring-[#176B98]/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 mt-1">External Link</div>
                    <div className="text-[10px] text-slate-500">YouTube, Loom, Coursera</div>
                  </button>
                </div>
              </div>

              {/* Subject / Topic (Dynamic) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Topic / Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.topic}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, topic: e.target.value }));
                      if (e.target.value !== '__custom__') setCustomTopicInput('');
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {allKnownTopics.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="__custom__">+ Add New Custom Topic...</option>
                  </select>
                </div>

                {formData.topic === '__custom__' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      New Topic Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Underwriting Analytics"
                      value={customTopicInput}
                      onChange={(e) => setCustomTopicInput(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#176B98] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#176B98]/30"
                    />
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resource Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Microsoft Excel Formulas & Pivot Tables"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#176B98]/30 focus:border-[#176B98]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Overview (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of skills learned, prerequisites, and practical exercises..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#176B98]/30 focus:border-[#176B98]"
                />
              </div>

              {/* Content Payload: External URL OR Direct Device Upload */}
              {formData.content_type === 'link' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    External Lesson / Video URL <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      required
                      placeholder="https://www.youtube.com/watch?v=... or https://loom.com/..."
                      value={formData.external_url || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, external_url: e.target.value }))}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#176B98]/30 focus:border-[#176B98]"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#F3F8FB] rounded-2xl border border-[#176B98]/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-[#176B98] flex items-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      <span>
                        Upload {formData.content_type === 'video' ? 'Lesson Video (up to 1 GB)' : 'PDF Document'}
                      </span>
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
                    accept={formData.content_type === 'video' ? 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov' : 'application/pdf,.pdf'}
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
                            File Attached: {formData.file_path || 'Uploaded File'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {formData.file_size_formatted || 'Stored safely'}
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
                        Select {formData.content_type === 'video' ? 'Video File from Device' : 'PDF Document from Device'}
                      </span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        {formData.content_type === 'video' ? 'Supports files up to 1 GB via chunk streaming' : 'Supports standard PDF documents'}
                      </span>
                    </button>
                  )}

                  {/* Upload Progress */}
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
              )}

              {/* Instructor Information (Matches reference card photo layout) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Instructor Profile (Card Display)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Instructor Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe, PMP"
                      value={formData.instructor_name || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, instructor_name: e.target.value }))}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Instructor Role / Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Excel Specialist"
                      value={formData.instructor_title || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, instructor_title: e.target.value }))}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                {/* Instructor Avatar Upload */}
                <div className="flex items-center gap-3 pt-1">
                  {formData.instructor_avatar ? (
                    <img
                      src={formData.instructor_avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : null}

                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  >
                    {formData.instructor_avatar ? 'Change Instructor Photo' : 'Upload Instructor Photo'}
                  </button>
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Card Cover Image (Course Header)
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
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
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

              {/* Display Order, Rating, Publishing Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
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
                    Star Rating (e.g. 4.9)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={1}
                    max={5}
                    value={formData.rating}
                    onChange={(e) => setFormData((prev) => ({ ...prev, rating: parseFloat(e.target.value) || 4.8 }))}
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
                  disabled={isSubmitting || isUploading || (formData.content_type === 'link' ? !formData.external_url : !formData.file_url)}
                  className="px-5 py-2.5 rounded-xl bg-[#176B98] hover:bg-[#12567a] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{formData.id ? 'Save Resource' : 'Publish Resource'}</span>
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
              <h3 className="text-base font-extrabold text-slate-900">Delete Skill Resource?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will remove this skill development resource from the platform. Learners will no longer see it.
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
