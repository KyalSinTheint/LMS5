export type UserRole = 'admin' | 'user';
export type AccountStatus = 'active' | 'approved' | 'pending' | 'rejected' | 'suspended' | 'inactive';

export interface Profile {
  id: string;
  username?: string;
  full_name: string;
  email: string;
  role: UserRole;
  account_status: AccountStatus;
  employee_id?: string;
  department?: string;
  avatar_url?: string;
  must_change_password?: boolean;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  category: string;
  published: boolean;
  duration_hours?: number;
  modules_count?: number;
  created_at: string;
  updated_at: string;
  learning_outcomes?: string[];
}

export interface Channel {
  id: string;
  course_id?: string | null;
  title: string;
  description: string;
  thumbnail_url: string;
  published: boolean;
  order_index: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
  key_highlights?: string[];
}

export type EnrollmentStatus = 'enrolled' | 'completed' | 'revoked';

export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: EnrollmentStatus;
  assigned_by: string; // admin profile id
  assigned_at: string;
  expires_at?: string | null;
  restriction_note?: string | null;
}

export type ChannelAccessStatus = 'granted' | 'revoked';

export interface ChannelAccess {
  id: string;
  user_id: string;
  channel_id: string;
  status: ChannelAccessStatus;
  assigned_by: string; // admin profile id
  assigned_at: string;
  expires_at?: string | null;
  restriction_note?: string | null;
}

export type ProgressCompletionStatus = 'not_started' | 'in_progress' | 'completed';

export interface LearningProgress {
  id: string;
  user_id: string;
  course_id?: string | null;
  channel_id?: string | null;
  progress_percentage: number; // 0 to 100
  completion_status: ProgressCompletionStatus;
  last_accessed_at: string;
  updated_at: string;
  completed_modules?: string[];
}

// Company News in Supabase
export interface CompanyNewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string[]; // paragraph blocks
  cover_image_url: string;
  category: string;
  status: 'draft' | 'published';
  is_featured: boolean;
  author_id?: string | null;
  author_name?: string;
  read_time_minutes?: number;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Company Video in Supabase
export interface CompanyVideoItem {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  category: string;
  display_order: number;
  duration?: string;
  status: 'draft' | 'published';
  author_id?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Top Performer in Supabase
export interface TopPerformerEntry {
  id: string;
  employee_name: string;
  employee_title: string;
  department: string;
  channel: 'Alliance Channel' | 'Bancassurance Channel' | 'Corporate Channel';
  achievement_title: string;
  achievement_description: string;
  image_url: string;
  recognition_period: string; // e.g. "January 2026"
  month_index: number; // 1 to 12
  ranking?: number | null;
  award_date?: string | null;
  status: 'draft' | 'published';
  author_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type AuditAction =
  | 'user_status_changed'
  | 'user_approved'
  | 'user_rejected'
  | 'user_suspended'
  | 'user_reactivated'
  | 'user_registered'
  | 'user_role_changed'
  | 'user_invited'
  | 'password_changed'
  | 'password_reset_triggered'
  | 'course_assigned'
  | 'course_revoked'
  | 'channel_granted'
  | 'channel_revoked'
  | 'course_created'
  | 'course_updated'
  | 'course_deleted'
  | 'channel_created'
  | 'channel_updated'
  | 'channel_deleted'
  | 'news_created'
  | 'news_updated'
  | 'news_deleted'
  | 'news_published'
  | 'video_created'
  | 'video_updated'
  | 'video_deleted'
  | 'top_performer_created'
  | 'top_performer_updated'
  | 'top_performer_deleted'
  | 'profile_updated'
  | 'access_restrictions_updated'
  | 'hod_motto_updated'
  | 'team_member_created'
  | 'team_member_updated'
  | 'team_member_deleted'
  | 'team_members_reordered';

export type EntityType =
  | 'user'
  | 'course'
  | 'channel'
  | 'access'
  | 'news'
  | 'video'
  | 'top_performer'
  | 'profile'
  | 'system'
  | 'email'
  | 'hod_motto'
  | 'team_member'
  | 'license_lesson'
  | 'skill_resource';

export interface AdminAuditLog {
  id: string;
  admin_user_id: string;
  admin_name: string;
  target_user_id?: string | null;
  target_user_name?: string | null;
  action: AuditAction;
  entity_type: EntityType;
  entity_id?: string | null;
  details: string;
  created_at: string;
}

export interface EmailLogEntry {
  id: string;
  recipient: string;
  subject: string;
  template: string;
  status: 'sent' | 'failed' | 'queued';
  error_message?: string | null;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  inactiveOrSuspendedUsers: number;
  totalCourses: number;
  totalChannels: number;
  totalEnrollments: number;
  totalNews: number;
  totalVideos: number;
  totalTopPerformers: number;
  totalTeamMembers: number;
  totalLicenseLessons?: number;
  totalSkillResources?: number;
}

// Head of Department (HOD) Motto
export interface HodMotto {
  id: string;
  motto_text: string;
  hod_name?: string;
  hod_title?: string;
  photo_url?: string;
  statement_context?: string;
  is_published: boolean;
  updated_at: string;
}

// Learning and Development Team Member
export type LdMemberType = 'team_member' | 'intern';

export interface LdTeamMember {
  id: string;
  full_name: string;
  position: string;
  department: string;
  member_type: LdMemberType;
  photo_path?: string;
  photo_url?: string;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// License Training Lesson (Video or PDF with direct device upload support up to 1GB)
export type LicenseContentType = 'video' | 'pdf';
export type LessonContentType = LicenseContentType;

export interface LicenseTrainingLesson {
  id: string;
  title: string;
  description?: string;
  content_type?: LicenseContentType;
  lesson_type?: LicenseContentType;
  file_url: string; // Storage URL or persistent path
  file_path?: string;
  storage_path?: string;
  file_name?: string;
  file_size?: number;
  file_size_bytes?: number;
  file_size_formatted?: string;
  duration?: string; // e.g. "18:45"
  video_duration?: string;
  thumbnail_url?: string;
  thumbnail_path?: string;
  category?: string;
  display_order: number;
  status?: 'draft' | 'published';
  is_published?: boolean;
  author_id?: string | null;
  created_at: string;
  updated_at: string;
}

// Skill Development Resource (English, Excel, Leadership, Tech, etc.)
export type SkillContentType = 'video' | 'link' | 'pdf';

export interface SkillDevelopmentResource {
  id: string;
  title: string;
  description?: string;
  topic: string; // Dynamic topic: e.g. "English", "Excel", "Leadership", etc.
  content_type: SkillContentType;
  content_url?: string; // Storage URL or external link
  file_url?: string;
  external_url?: string;
  file_path?: string;
  storage_path?: string;
  file_name?: string;
  file_size?: number;
  file_size_bytes?: number;
  file_size_formatted?: string;
  duration?: string;
  video_duration?: string;
  thumbnail_url?: string;
  thumbnail_path?: string;
  instructor_name?: string;
  instructor_role?: string;
  instructor_title?: string;
  instructor_avatar?: string;
  instructor_avatar_path?: string;
  rating?: number; // 1 to 5
  lesson_count?: number; // e.g. 16
  display_order: number;
  status?: 'draft' | 'published';
  is_published?: boolean;
  author_id?: string | null;
  created_at: string;
  updated_at: string;
}


