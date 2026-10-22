import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Profile,
  Course,
  Channel,
  CourseEnrollment,
  ChannelAccess,
  LearningProgress,
  AdminAuditLog,
  AdminStats,
  AccountStatus,
  UserRole,
  ProgressCompletionStatus,
  CompanyNewsArticle,
  CompanyVideoItem,
  TopPerformerEntry,
  EmailLogEntry,
  HodMotto,
  LdTeamMember,
  LicenseTrainingLesson,
  SkillDevelopmentResource,
} from '../types/lms';
import {
  INITIAL_PROFILES,
  INITIAL_COURSES,
  INITIAL_CHANNELS,
  INITIAL_NEWS,
  INITIAL_VIDEOS,
  INITIAL_TOP_PERFORMERS,
  INITIAL_ENROLLMENTS,
  INITIAL_CHANNEL_ACCESS,
  INITIAL_PROGRESS,
  INITIAL_AUDIT_LOGS,
  INITIAL_EMAIL_LOGS,
  INITIAL_HOD_MOTTO,
  INITIAL_TEAM_MEMBERS,
  INITIAL_LICENSE_LESSONS,
  INITIAL_SKILL_RESOURCES,
} from '../data/seedLmsData';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface LmsContextType {
  currentUser: Profile;
  profiles: Profile[];
  courses: Course[];
  channels: Channel[];
  courseEnrollments: CourseEnrollment[];
  channelAccesses: ChannelAccess[];
  learningProgress: LearningProgress[];
  companyNews: CompanyNewsArticle[];
  companyVideos: CompanyVideoItem[];
  topPerformers: TopPerformerEntry[];
  hodMotto: HodMotto;
  teamMembers: LdTeamMember[];
  licenseTrainingLessons: LicenseTrainingLesson[];
  skillDevelopmentResources: SkillDevelopmentResource[];
  auditLogs: AdminAuditLog[];
  emailLogs: EmailLogEntry[];
  isLoading: boolean;
  isSupabaseLive: boolean;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  showToast: (type: ToastMessage['type'], title: string, message?: string) => void;

  // Session & Authentication
  isAuthenticated: boolean;
  switchUser: (userId: string) => void;
  loginWithCredentials: (identifier: string, password: string) => Promise<{ success: boolean; message: string; mustChangePassword?: boolean; account_status?: AccountStatus; role?: UserRole }>;
  registerUser: (data: { full_name: string; username: string; email: string; password: string; department?: string; employee_id?: string }) => Promise<{ success: boolean; user?: Profile; message: string }>;
  checkUserApprovalStatus: (userId?: string) => Promise<AccountStatus>;
  approveUser: (userId: string) => Promise<boolean>;
  rejectUser: (userId: string, reason: string) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string; isConfigured?: boolean }>;
  updateAdminProfile: (updates: Partial<Profile>) => Promise<boolean>;
  updateProfile: (userId: string, updates: Partial<Profile>) => Promise<{ success: boolean; message: string; profile?: Profile }>;
  fetchProfile: (userId: string) => Promise<Profile | null>;
  signOut: () => void;

  // Computed / Queries
  getStats: () => AdminStats;
  getUserEnrollments: (userId: string) => CourseEnrollment[];
  getUserChannelAccesses: (userId: string) => ChannelAccess[];
  getUserAccessibleCourses: (userId: string) => Course[];
  getUserAccessibleChannels: (userId: string) => Channel[];
  getUserProgress: (userId: string, courseId?: string, channelId?: string) => LearningProgress | undefined;
  getPublishedNews: () => CompanyNewsArticle[];
  getPublishedVideos: () => CompanyVideoItem[];
  getPublishedTopPerformers: () => TopPerformerEntry[];
  getPublishedTeamMembers: () => LdTeamMember[];
  getPublishedHodMotto: () => HodMotto | null;
  getPublishedLicenseLessons: () => LicenseTrainingLesson[];
  getPublishedSkillResources: () => SkillDevelopmentResource[];

  // Administrative mutations
  updateUserStatus: (userId: string, status: AccountStatus, reason?: string) => Promise<boolean>;
  updateUserRole: (userId: string, role: UserRole, reason?: string) => Promise<boolean>;
  assignCourse: (userId: string, courseId: string, expiresAt?: string | null, note?: string) => Promise<boolean>;
  revokeCourse: (userId: string, courseId: string, reason?: string) => Promise<boolean>;
  assignChannel: (userId: string, channelId: string, expiresAt?: string | null, note?: string) => Promise<boolean>;
  revokeChannel: (userId: string, channelId: string, reason?: string) => Promise<boolean>;
  createCourse: (course: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => Promise<Course | null>;
  updateCourse: (courseId: string, updates: Partial<Course>) => Promise<boolean>;
  deleteCourse: (courseId: string) => Promise<boolean>;
  createChannel: (channel: Omit<Channel, 'id' | 'created_at' | 'updated_at'>) => Promise<Channel | null>;
  updateChannel: (channelId: string, updates: Partial<Channel>) => Promise<boolean>;
  deleteChannel: (channelId: string) => Promise<boolean>;

  // Company News mutations
  createNews: (article: Omit<CompanyNewsArticle, 'id' | 'created_at' | 'updated_at'>) => Promise<CompanyNewsArticle | null>;
  updateNews: (id: string, updates: Partial<CompanyNewsArticle>) => Promise<boolean>;
  deleteNews: (id: string) => Promise<boolean>;

  // Company Videos mutations
  createVideo: (video: Omit<CompanyVideoItem, 'id' | 'created_at' | 'updated_at'>) => Promise<CompanyVideoItem | null>;
  updateVideo: (id: string, updates: Partial<CompanyVideoItem>) => Promise<boolean>;
  deleteVideo: (id: string) => Promise<boolean>;

  // Top Performers mutations
  createTopPerformer: (performer: Omit<TopPerformerEntry, 'id' | 'created_at' | 'updated_at'>) => Promise<TopPerformerEntry | null>;
  updateTopPerformer: (id: string, updates: Partial<TopPerformerEntry>) => Promise<boolean>;
  deleteTopPerformer: (id: string) => Promise<boolean>;

  // License Training Lessons mutations (Admin to User Publishing Flow)
  createLicenseLesson: (lesson: Omit<LicenseTrainingLesson, 'id' | 'created_at' | 'updated_at'>) => Promise<LicenseTrainingLesson | null>;
  updateLicenseLesson: (id: string, updates: Partial<LicenseTrainingLesson>) => Promise<boolean>;
  deleteLicenseLesson: (id: string) => Promise<boolean>;

  // Skill Development Resources mutations (Admin to User Publishing Flow)
  createSkillResource: (resource: Omit<SkillDevelopmentResource, 'id' | 'created_at' | 'updated_at'>) => Promise<SkillDevelopmentResource | null>;
  updateSkillResource: (id: string, updates: Partial<SkillDevelopmentResource>) => Promise<boolean>;
  deleteSkillResource: (id: string) => Promise<boolean>;

  // HOD Motto & L&D Team mutations
  updateHodMotto: (updates: Partial<HodMotto>) => Promise<boolean>;
  createTeamMember: (member: Omit<LdTeamMember, 'id' | 'created_at' | 'updated_at'>) => Promise<LdTeamMember | null>;
  updateTeamMember: (id: string, updates: Partial<LdTeamMember>) => Promise<boolean>;
  deleteTeamMember: (id: string) => Promise<boolean>;
  reorderTeamMembers: (orderedIds: string[]) => Promise<boolean>;

  // User invitation & Email Delivery
  inviteUser: (data: { email: string; full_name: string; role: UserRole; department: string; employee_id?: string }) => Promise<boolean>;
  sendCustomEmail: (to: string, subject: string, html: string, template?: string) => Promise<{ success: boolean; message: string }>;

  // Learner Progress mutations
  recordProgress: (
    courseId?: string,
    channelId?: string,
    percentage?: number,
    completionStatus?: ProgressCompletionStatus,
    completedModule?: string
  ) => Promise<boolean>;

  // Data reload
  refreshData: () => Promise<void>;
  resetToInitialData: () => void;
}

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'kbzlife_lms_current_user_id_v2',
  PROFILES: 'kbzlife_lms_profiles_v2',
  COURSES: 'kbzlife_lms_courses_v2',
  CHANNELS: 'kbzlife_lms_channels_v2',
  ENROLLMENTS: 'kbzlife_lms_enrollments_v2',
  CHANNEL_ACCESS: 'kbzlife_lms_channel_access_v2',
  PROGRESS: 'kbzlife_lms_progress_v2',
  AUDIT_LOGS: 'kbzlife_lms_audit_logs_v2',
  NEWS: 'kbzlife_lms_news_v3',
  VIDEOS: 'kbzlife_lms_videos_v3',
  PERFORMERS: 'kbzlife_lms_performers_v2',
  EMAIL_LOGS: 'kbzlife_lms_email_logs_v2',
  HOD_MOTTO: 'kbzlife_lms_hod_motto_v2',
  TEAM_MEMBERS: 'kbzlife_lms_team_members_v2',
  LICENSE_LESSONS: 'kbzlife_lms_license_lessons_v1',
  SKILL_RESOURCES: 'kbzlife_lms_skill_resources_v1',
};

const LmsContext = createContext<LmsContextType | undefined>(undefined);

export const LmsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILES);
      return saved ? JSON.parse(saved) : INITIAL_PROFILES;
    } catch {
      return INITIAL_PROFILES;
    }
  });

  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COURSES);
      return saved ? JSON.parse(saved) : INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  });

  const [channels, setChannels] = useState<Channel[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHANNELS);
      return saved ? JSON.parse(saved) : INITIAL_CHANNELS;
    } catch {
      return INITIAL_CHANNELS;
    }
  });

  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ENROLLMENTS);
      return saved ? JSON.parse(saved) : INITIAL_ENROLLMENTS;
    } catch {
      return INITIAL_ENROLLMENTS;
    }
  });

  const [channelAccesses, setChannelAccesses] = useState<ChannelAccess[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHANNEL_ACCESS);
      return saved ? JSON.parse(saved) : INITIAL_CHANNEL_ACCESS;
    } catch {
      return INITIAL_CHANNEL_ACCESS;
    }
  });

  const [companyNews, setCompanyNews] = useState<CompanyNewsArticle[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NEWS);
      return saved ? JSON.parse(saved) : INITIAL_NEWS;
    } catch {
      return INITIAL_NEWS;
    }
  });

  const [companyVideos, setCompanyVideos] = useState<CompanyVideoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VIDEOS);
      return saved ? JSON.parse(saved) : INITIAL_VIDEOS;
    } catch {
      return INITIAL_VIDEOS;
    }
  });

  const [topPerformers, setTopPerformers] = useState<TopPerformerEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PERFORMERS);
      return saved ? JSON.parse(saved) : INITIAL_TOP_PERFORMERS;
    } catch {
      return INITIAL_TOP_PERFORMERS;
    }
  });

  const [hodMotto, setHodMotto] = useState<HodMotto>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HOD_MOTTO);
      return saved ? JSON.parse(saved) : INITIAL_HOD_MOTTO;
    } catch {
      return INITIAL_HOD_MOTTO;
    }
  });

  const [teamMembers, setTeamMembers] = useState<LdTeamMember[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS);
      return saved ? JSON.parse(saved) : INITIAL_TEAM_MEMBERS;
    } catch {
      return INITIAL_TEAM_MEMBERS;
    }
  });

  const [licenseTrainingLessons, setLicenseTrainingLessons] = useState<LicenseTrainingLesson[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LICENSE_LESSONS);
      return saved ? JSON.parse(saved) : INITIAL_LICENSE_LESSONS;
    } catch {
      return INITIAL_LICENSE_LESSONS;
    }
  });

  const [skillDevelopmentResources, setSkillDevelopmentResources] = useState<SkillDevelopmentResource[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SKILL_RESOURCES);
      return saved ? JSON.parse(saved) : INITIAL_SKILL_RESOURCES;
    } catch {
      return INITIAL_SKILL_RESOURCES;
    }
  });

  const [learningProgress, setLearningProgress] = useState<LearningProgress[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      return saved ? JSON.parse(saved) : INITIAL_PROGRESS;
    } catch {
      return INITIAL_PROGRESS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMAIL_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_EMAIL_LOGS;
    } catch {
      return INITIAL_EMAIL_LOGS;
    }
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (saved && profiles.some((p) => p.id === saved)) {
        return saved;
      }
      return profiles[0]?.id || INITIAL_PROFILES[0].id;
    } catch {
      return INITIAL_PROFILES[0].id;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const stored = sessionStorage.getItem('kbzlife_authenticated');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSupabaseLive, setIsSupabaseLive] = useState<boolean>(isSupabaseConfigured());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persistent storage synchronizer
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
      localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
      localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(channels));
      localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(courseEnrollments));
      localStorage.setItem(STORAGE_KEYS.CHANNEL_ACCESS, JSON.stringify(channelAccesses));
      localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(companyNews));
      localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(companyVideos));
      localStorage.setItem(STORAGE_KEYS.PERFORMERS, JSON.stringify(topPerformers));
      localStorage.setItem(STORAGE_KEYS.HOD_MOTTO, JSON.stringify(hodMotto));
      localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(teamMembers));
      localStorage.setItem(STORAGE_KEYS.LICENSE_LESSONS, JSON.stringify(licenseTrainingLessons));
      localStorage.setItem(STORAGE_KEYS.SKILL_RESOURCES, JSON.stringify(skillDevelopmentResources));
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(learningProgress));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(emailLogs));
    } catch (e) {
      console.warn('Could not sync to localStorage', e);
    }
  }, [
    currentUserId,
    profiles,
    courses,
    channels,
    courseEnrollments,
    channelAccesses,
    companyNews,
    companyVideos,
    topPerformers,
    hodMotto,
    teamMembers,
    licenseTrainingLessons,
    skillDevelopmentResources,
    learningProgress,
    auditLogs,
    emailLogs,
  ]);

  const showToast = useCallback((type: ToastMessage['type'], title: string, message?: string) => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch all tables from Supabase if live
  const refreshData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsSupabaseLive(false);
      return;
    }

    setIsLoading(true);
    try {
      const [
        { data: dbProfiles },
        { data: dbCourses },
        { data: dbChannels },
        { data: dbNews },
        { data: dbVideos },
        { data: dbPerformers },
        { data: dbEnrollments },
        { data: dbChannelAccess },
        { data: dbProgress },
        { data: dbAudit },
        { data: dbHodMotto },
        { data: dbTeamMembers },
        { data: dbLicenseLessons },
        { data: dbSkillResources },
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('courses').select('*'),
        supabase.from('channels').select('*'),
        supabase.from('company_news').select('*'),
        supabase.from('company_videos').select('*'),
        supabase.from('top_performers').select('*'),
        supabase.from('course_enrollments').select('*'),
        supabase.from('channel_access').select('*'),
        supabase.from('learning_progress').select('*'),
        supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('hod_motto').select('*'),
        supabase.from('ld_team_members').select('*').order('display_order', { ascending: true }),
        supabase.from('license_training_lessons').select('*').order('display_order', { ascending: true }),
        supabase.from('skill_development_resources').select('*').order('display_order', { ascending: true }),
      ]);

      if (Array.isArray(dbProfiles) && dbProfiles.length > 0) setProfiles(dbProfiles as Profile[]);
      if (Array.isArray(dbCourses)) setCourses(dbCourses as Course[]);
      if (Array.isArray(dbChannels)) setChannels(dbChannels as Channel[]);
      if (Array.isArray(dbNews)) setCompanyNews(dbNews as CompanyNewsArticle[]);
      if (Array.isArray(dbVideos)) setCompanyVideos(dbVideos as CompanyVideoItem[]);
      if (Array.isArray(dbPerformers)) setTopPerformers(dbPerformers as TopPerformerEntry[]);
      if (Array.isArray(dbEnrollments)) setCourseEnrollments(dbEnrollments as CourseEnrollment[]);
      if (Array.isArray(dbChannelAccess)) setChannelAccesses(dbChannelAccess as ChannelAccess[]);
      if (Array.isArray(dbProgress)) setLearningProgress(dbProgress as LearningProgress[]);
      if (Array.isArray(dbAudit)) setAuditLogs(dbAudit as AdminAuditLog[]);
      if (Array.isArray(dbHodMotto) && dbHodMotto.length > 0) setHodMotto(dbHodMotto[0] as HodMotto);
      if (Array.isArray(dbTeamMembers) && dbTeamMembers.length > 0) setTeamMembers(dbTeamMembers as LdTeamMember[]);
      if (Array.isArray(dbLicenseLessons) && dbLicenseLessons.length > 0) setLicenseTrainingLessons(dbLicenseLessons as LicenseTrainingLesson[]);
      if (Array.isArray(dbSkillResources) && dbSkillResources.length > 0) setSkillDevelopmentResources(dbSkillResources as SkillDevelopmentResource[]);

      setIsSupabaseLive(true);
    } catch (err) {
      console.warn('[KBZLife LMS] Supabase fetch fallback to local store:', err);
      setIsSupabaseLive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      refreshData();
    }
  }, [refreshData]);

  // Realtime synchronization across Admin and User panels
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      const channel = supabase
        .channel('lms-admin-user-sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'company_videos' },
          () => {
            refreshData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'company_news' },
          () => {
            refreshData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'top_performers' },
          () => {
            refreshData();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => {
            refreshData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.warn('[KBZLife LMS] Supabase Realtime subscription notice:', err);
    }
  }, [refreshData]);

  const currentUser = profiles.find((p) => p.id === currentUserId) || profiles[0] || INITIAL_PROFILES[0];

  const switchUser = (userId: string) => {
    const found = profiles.find((p) => p.id === userId);
    if (found) {
      setCurrentUserId(userId);
      showToast(
        'info',
        `Switched User: ${found.full_name}`,
        `Role: ${found.role.toUpperCase()} | Status: ${found.account_status.toUpperCase()}`
      );
    }
  };

  const signOut = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('kbzlife_authenticated');
      sessionStorage.setItem('kbzlife_authenticated', 'false');
    } catch {}
    window.location.hash = '';
    showToast('info', 'Signed Out', 'You have been securely signed out of KBZLife LMS.');
  };

  const logAuditAction = async (
    action: AdminAuditLog['action'],
    entity_type: AdminAuditLog['entity_type'],
    entity_id: string | null,
    details: string,
    target_user_id?: string | null,
    target_user_name?: string | null
  ) => {
    const newLog: AdminAuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      admin_user_id: currentUser.id,
      admin_name: currentUser.full_name,
      target_user_id: target_user_id || null,
      target_user_name: target_user_name || null,
      action,
      entity_type,
      entity_id: entity_id || null,
      details,
      created_at: new Date().toISOString(),
    };

    setAuditLogs((prev) => [newLog, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('admin_audit_logs').insert([newLog]);
      } catch (err) {
        console.warn('Could not write audit log to Supabase:', err);
      }
    }
  };

  // -------------------------------------------------------------
  // AUTHENTICATION & PASSWORD MANAGEMENT
  // -------------------------------------------------------------

  const loginWithCredentials = async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; message: string; mustChangePassword?: boolean; account_status?: AccountStatus; role?: UserRole }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, message: data.message || 'Invalid username or password.' };
      }

      // If user exists in local state, sync
      const matched = profiles.find(
        (p) =>
          p.email.toLowerCase() === data.user.email.toLowerCase() ||
          (p.username && p.username.toLowerCase() === identifier.toLowerCase())
      );

      if (matched) {
        setCurrentUserId(matched.id);
      } else {
        setProfiles((prev) => [data.user, ...prev]);
        setCurrentUserId(data.user.id);
      }

      setIsAuthenticated(true);
      try {
        sessionStorage.setItem('kbzlife_authenticated', 'true');
      } catch {}

      const userRole = ((data.user && data.user.role) || (matched && matched.role) || 'user') as UserRole;
      return {
        success: true,
        message: 'Successfully authenticated.',
        mustChangePassword: data.mustChangePassword,
        account_status: data.account_status,
        role: userRole,
      };
    } catch {
      // Local fallback for offline mode
      if (identifier === 'admin' || identifier === 'admin@kbzlife.com') {
        if (password === 'admin123') {
          setCurrentUserId(INITIAL_PROFILES[0].id);
          setIsAuthenticated(true);
          try {
            sessionStorage.setItem('kbzlife_authenticated', 'true');
          } catch {}
          return { success: true, message: 'Logged in as Administrator.', mustChangePassword: true, account_status: 'active', role: 'admin' };
        }
      }
      return { success: false, message: 'Authentication server unavailable.' };
    }
  };

  const registerUser = async (data: {
    full_name: string;
    username: string;
    email: string;
    password: string;
    department?: string;
    employee_id?: string;
  }): Promise<{ success: boolean; user?: Profile; message: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        return { success: false, message: resData.message || 'Registration failed.' };
      }

      const newProfile: Profile = {
        id: resData.user.id,
        username: resData.user.username,
        full_name: resData.user.full_name,
        email: resData.user.email,
        role: 'user', // NEVER assign admin
        account_status: 'pending', // MUST be pending
        department: resData.user.department,
        employee_id: resData.user.employee_id,
        avatar_url: resData.user.avatar_url,
        must_change_password: false,
        created_at: resData.user.created_at,
        updated_at: new Date().toISOString(),
      };

      setProfiles((prev) => [newProfile, ...prev]);
      setCurrentUserId(newProfile.id);
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem('kbzlife_authenticated', 'true');
      } catch {}

      await logAuditAction(
        'user_registered',
        'user',
        newProfile.id,
        `New learner registered: ${newProfile.full_name} (${newProfile.email}). Account set to pending approval.`,
        newProfile.id,
        newProfile.full_name
      );

      showToast('info', 'Registration Received', 'Your account is pending administrator review.');
      return { success: true, user: newProfile, message: resData.message };
    } catch {
      // Local fallback
      const newId = 'u_' + Date.now();
      const localProfile: Profile = {
        id: newId,
        username: data.username,
        full_name: data.full_name,
        email: data.email,
        role: 'user',
        account_status: 'pending',
        department: data.department || 'General Employee',
        employee_id: data.employee_id || `KBZ-EMP-${Math.floor(100 + Math.random() * 900)}`,
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
        must_change_password: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfiles((prev) => [localProfile, ...prev]);
      setCurrentUserId(localProfile.id);
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem('kbzlife_authenticated', 'true');
      } catch {}

      return {
        success: true,
        user: localProfile,
        message: 'Account registered. Pending administrator approval.',
      };
    }
  };

  const checkUserApprovalStatus = async (userId?: string): Promise<AccountStatus> => {
    const targetId = userId || currentUserId;
    try {
      const res = await fetch(`/api/auth/status?userId=${encodeURIComponent(targetId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.status) {
          setProfiles((prev) =>
            prev.map((p) => (p.id === targetId ? { ...p, account_status: data.status } : p))
          );
          return data.status;
        }
      }
    } catch {
      // fallback to current local state
    }
    const p = profiles.find((pr) => pr.id === targetId);
    return p ? p.account_status : 'pending';
  };

  const approveUser = async (userId: string): Promise<boolean> => {
    return updateUserStatus(userId, 'approved', 'Administrative approval granted');
  };

  const rejectUser = async (userId: string, reason: string): Promise<boolean> => {
    return updateUserStatus(userId, 'rejected', reason || 'Registration declined');
  };

  const changePassword = async (
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          username: currentUser.username,
          oldPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfiles((prev) =>
          prev.map((p) => (p.id === currentUser.id ? { ...p, must_change_password: false } : p))
        );
        await logAuditAction('password_changed', 'user', currentUser.id, 'User password changed successfully.');
        showToast('success', 'Password Updated', 'Your new password has been verified and saved.');
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Failed to update password.' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: msg };
    }
  };

  const requestPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; message: string; isConfigured?: boolean }> => {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.isProviderConfigured) {
        showToast('success', 'Email Sent', `Password reset instructions sent to ${email}`);
      } else {
        showToast('info', 'Password Reset Link Generated', data.message);
      }

      await logAuditAction(
        'password_reset_triggered',
        'user',
        null,
        `Password reset email triggered for ${email}`
      );

      return {
        success: data.success,
        message: data.message,
        isConfigured: data.isProviderConfigured,
      };
    } catch {
      return { success: false, message: 'Password reset request failed. Server offline.' };
    }
  };

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (!error && data) {
          const profile = data as Profile;
          setProfiles((prev) => prev.map((p) => (p.id === userId ? profile : p)));
          return profile;
        }
      } catch (err) {
        console.warn('[KBZLife LMS] Supabase fetchProfile error:', err);
      }
    }
    // Also check server endpoint
    try {
      const res = await fetch(`/api/auth/profile?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.profile) {
          setProfiles((prev) => prev.map((p) => (p.id === userId ? json.profile : p)));
          return json.profile;
        }
      }
    } catch {}

    return profiles.find((p) => p.id === userId) || null;
  };

  const updateProfile = async (
    userId: string,
    updates: Partial<Profile>
  ): Promise<{ success: boolean; message: string; profile?: Profile }> => {
    const now = new Date().toISOString();

    // Whitelist only editable profile fields. Strictly protect role, account_status, and id.
    const safeUpdates: Record<string, any> = {};
    if (updates.full_name !== undefined) safeUpdates.full_name = updates.full_name.trim();
    if (updates.username !== undefined) safeUpdates.username = updates.username.trim();
    if (updates.department !== undefined) safeUpdates.department = updates.department.trim();
    if (updates.avatar_url !== undefined) safeUpdates.avatar_url = updates.avatar_url.trim();
    if (updates.employee_id !== undefined && currentUser.role === 'admin') {
      safeUpdates.employee_id = updates.employee_id.trim();
    }
    if (updates.email !== undefined && updates.email.trim()) {
      safeUpdates.email = updates.email.trim();
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            ...safeUpdates,
            updated_at: now,
          })
          .eq('id', userId)
          .select()
          .single();

        if (error) {
          console.error('[KBZLife LMS] Supabase profile update error:', error);
          showToast('error', 'Profile Update Failed', error.message);
          return { success: false, message: `Database error: ${error.message}` };
        }

        if (data) {
          const updatedProfile = data as Profile;
          setProfiles((prev) =>
            prev.map((p) => (p.id === userId ? updatedProfile : p))
          );
          // Also sync to server-side registry
          try {
            await fetch('/api/auth/profile', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, ...safeUpdates }),
            });
          } catch {}

          await logAuditAction(
            'profile_updated',
            'user',
            userId,
            `Profile details successfully saved to Supabase for ${updatedProfile.full_name}.`
          );
          showToast('success', 'Profile Saved', 'Profile changes successfully written to Supabase database.');
          return { success: true, message: 'Profile updated in Supabase.', profile: updatedProfile };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        showToast('error', 'Database Connection Error', msg);
        return { success: false, message: msg };
      }
    }

    // Try server endpoint fallback
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...safeUpdates }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, ...json.user } : p)));
          showToast('success', 'Profile Saved', 'Profile details updated successfully.');
          return { success: true, message: 'Saved successfully.', profile: json.user };
        }
      }
    } catch {}

    // Local fallback when offline
    let localUpdated: Profile | undefined;
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === userId) {
          localUpdated = { ...p, ...safeUpdates, updated_at: now };
          return localUpdated;
        }
        return p;
      })
    );
    showToast('info', 'Profile Saved Locally', 'Changes saved to browser storage. Connect Supabase to write to live cloud database.');
    return { success: true, message: 'Saved to local store.', profile: localUpdated };
  };

  const updateAdminProfile = async (updates: Partial<Profile>): Promise<boolean> => {
    const res = await updateProfile(currentUser.id, updates);
    return res.success;
  };

  // -------------------------------------------------------------
  // USER INVITATIONS & REAL EMAIL DISPATCH
  // -------------------------------------------------------------

  const inviteUser = async (data: {
    email: string;
    full_name: string;
    role: UserRole;
    department: string;
    employee_id?: string;
  }): Promise<boolean> => {
    if (currentUser.role !== 'admin') {
      showToast('error', 'Access Denied', 'Only administrators can invite users.');
      return false;
    }

    const now = new Date().toISOString();
    const newProfile: Profile = {
      id: 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      username: data.email.split('@')[0],
      full_name: data.full_name,
      email: data.email,
      role: data.role,
      account_status: 'active',
      department: data.department,
      employee_id: data.employee_id || `KBZ-${Math.floor(100 + Math.random() * 900)}`,
      must_change_password: true,
      created_at: now,
      updated_at: now,
    };

    setProfiles((prev) => [newProfile, ...prev]);

    // Call server email invitation endpoint
    try {
      const res = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();

      if (resData.emailDelivery?.success) {
        showToast('success', 'User Invited & Email Sent', `Invitation email delivered to ${data.email}.`);
      } else {
        showToast(
          'info',
          'User Created',
          `Account created for ${data.full_name}. Email queued: ${resData.emailDelivery?.message || 'Provider pending'}`
        );
      }
    } catch {
      showToast('info', 'User Created', `User ${data.full_name} created successfully.`);
    }

    await logAuditAction(
      'user_invited',
      'user',
      newProfile.id,
      `Invited new ${data.role.toUpperCase()} account for ${data.full_name} (${data.email})`,
      newProfile.id,
      newProfile.full_name
    );

    return true;
  };

  const sendCustomEmail = async (
    to: string,
    subject: string,
    html: string,
    template?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html, template }),
      });
      return await res.json();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: msg };
    }
  };

  // -------------------------------------------------------------
  // USER STATUS & ROLE MUTATIONS
  // -------------------------------------------------------------

  const updateUserStatus = async (userId: string, newStatus: AccountStatus, reason?: string): Promise<boolean> => {
    if (currentUser.role !== 'admin') {
      showToast('error', 'Access Denied', 'Only administrators can modify user account statuses.');
      return false;
    }

    const targetUser = profiles.find((p) => p.id === userId);
    if (!targetUser) return false;

    const oldStatus = targetUser.account_status;
    const now = new Date().toISOString();

    setProfiles((prev) =>
      prev.map((p) => (p.id === userId ? { ...p, account_status: newStatus, updated_at: now } : p))
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('profiles').update({ account_status: newStatus, updated_at: now }).eq('id', userId);
      } catch (err) {
        console.warn('Supabase update warning:', err);
      }
    }

    const detailText = `Account status changed from ${oldStatus.toUpperCase()} to ${newStatus.toUpperCase()}${
      reason ? `. Reason: ${reason}` : ''
    }`;
    await logAuditAction('user_status_changed', 'user', userId, detailText, targetUser.id, targetUser.full_name);

    showToast('success', 'Status Updated', `${targetUser.full_name}'s status is now ${newStatus.toUpperCase()}.`);
    return true;
  };

  const updateUserRole = async (userId: string, newRole: UserRole, reason?: string): Promise<boolean> => {
    if (currentUser.role !== 'admin') {
      showToast('error', 'Access Denied', 'Only administrators can promote or demote user roles.');
      return false;
    }

    const targetUser = profiles.find((p) => p.id === userId);
    if (!targetUser) return false;

    const oldRole = targetUser.role;
    const now = new Date().toISOString();

    setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, role: newRole, updated_at: now } : p)));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('profiles').update({ role: newRole, updated_at: now }).eq('id', userId);
      } catch (err) {
        console.warn('Supabase update warning:', err);
      }
    }

    const detailText = `Role changed from ${oldRole.toUpperCase()} to ${newRole.toUpperCase()}${
      reason ? `. Reason: ${reason}` : ''
    }`;
    await logAuditAction('user_role_changed', 'user', userId, detailText, targetUser.id, targetUser.full_name);

    showToast('success', 'User Role Updated', `${targetUser.full_name} is now an ${newRole.toUpperCase()}.`);
    return true;
  };

  // -------------------------------------------------------------
  // COURSE & CHANNEL PERMISSIONS
  // -------------------------------------------------------------

  const assignCourse = async (
    userId: string,
    courseId: string,
    expiresAt?: string | null,
    note?: string
  ): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    const targetUser = profiles.find((p) => p.id === userId);
    const targetCourse = courses.find((c) => c.id === courseId);
    if (!targetUser || !targetCourse) return false;

    const now = new Date().toISOString();
    const existing = courseEnrollments.find((e) => e.user_id === userId && e.course_id === courseId);

    const enrollmentRecord: CourseEnrollment = {
      id: existing ? existing.id : 'enr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      user_id: userId,
      course_id: courseId,
      status: 'enrolled',
      assigned_by: currentUser.id,
      assigned_at: now,
      expires_at: expiresAt || null,
      restriction_note: note || null,
    };

    setCourseEnrollments((prev) => {
      const filtered = prev.filter((e) => !(e.user_id === userId && e.course_id === courseId));
      return [...filtered, enrollmentRecord];
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('course_enrollments').upsert([enrollmentRecord]);
      } catch (err) {
        console.warn('Supabase enrollment upsert warning:', err);
      }
    }

    await logAuditAction(
      'course_assigned',
      'course',
      courseId,
      `Assigned course "${targetCourse.title}" to ${targetUser.full_name}`,
      targetUser.id,
      targetUser.full_name
    );

    showToast('success', 'Course Assigned', `"${targetCourse.title}" is now available to ${targetUser.full_name}.`);
    return true;
  };

  const revokeCourse = async (userId: string, courseId: string, reason?: string): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    const targetUser = profiles.find((p) => p.id === userId);
    const targetCourse = courses.find((c) => c.id === courseId);
    if (!targetUser || !targetCourse) return false;

    setCourseEnrollments((prev) =>
      prev.map((e) =>
        e.user_id === userId && e.course_id === courseId
          ? { ...e, status: 'revoked', restriction_note: reason || 'Access revoked by administrator' }
          : e
      )
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('course_enrollments')
          .update({ status: 'revoked', restriction_note: reason || 'Access revoked by administrator' })
          .match({ user_id: userId, course_id: courseId });
      } catch (err) {
        console.warn('Supabase revoke warning:', err);
      }
    }

    await logAuditAction(
      'course_revoked',
      'course',
      courseId,
      `Revoked course "${targetCourse.title}" access for ${targetUser.full_name}`,
      targetUser.id,
      targetUser.full_name
    );

    showToast('info', 'Access Revoked', `Revoked course "${targetCourse.title}" from ${targetUser.full_name}.`);
    return true;
  };

  const assignChannel = async (
    userId: string,
    channelId: string,
    expiresAt?: string | null,
    note?: string
  ): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    const targetUser = profiles.find((p) => p.id === userId);
    const targetChannel = channels.find((c) => c.id === channelId);
    if (!targetUser || !targetChannel) return false;

    const now = new Date().toISOString();
    const existing = channelAccesses.find((ca) => ca.user_id === userId && ca.channel_id === channelId);

    const accessRecord: ChannelAccess = {
      id: existing ? existing.id : 'ca_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      user_id: userId,
      channel_id: channelId,
      status: 'granted',
      assigned_by: currentUser.id,
      assigned_at: now,
      expires_at: expiresAt || null,
      restriction_note: note || null,
    };

    setChannelAccesses((prev) => {
      const filtered = prev.filter((ca) => !(ca.user_id === userId && ca.channel_id === channelId));
      return [...filtered, accessRecord];
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('channel_access').upsert([accessRecord]);
      } catch (err) {
        console.warn('Supabase channel access upsert warning:', err);
      }
    }

    await logAuditAction(
      'channel_granted',
      'channel',
      channelId,
      `Granted channel access "${targetChannel.title}" to ${targetUser.full_name}`,
      targetUser.id,
      targetUser.full_name
    );

    showToast('success', 'Channel Granted', `Channel "${targetChannel.title}" granted to ${targetUser.full_name}.`);
    return true;
  };

  const revokeChannel = async (userId: string, channelId: string, reason?: string): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    const targetUser = profiles.find((p) => p.id === userId);
    const targetChannel = channels.find((c) => c.id === channelId);
    if (!targetUser || !targetChannel) return false;

    setChannelAccesses((prev) =>
      prev.map((ca) =>
        ca.user_id === userId && ca.channel_id === channelId
          ? { ...ca, status: 'revoked', restriction_note: reason || 'Access revoked by administrator' }
          : ca
      )
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('channel_access')
          .update({ status: 'revoked', restriction_note: reason || 'Access revoked by administrator' })
          .match({ user_id: userId, channel_id: channelId });
      } catch (err) {
        console.warn('Supabase revoke warning:', err);
      }
    }

    await logAuditAction(
      'channel_revoked',
      'channel',
      channelId,
      `Revoked channel "${targetChannel.title}" access for ${targetUser.full_name}`,
      targetUser.id,
      targetUser.full_name
    );

    showToast('info', 'Channel Revoked', `Revoked channel "${targetChannel.title}" from ${targetUser.full_name}.`);
    return true;
  };

  // -------------------------------------------------------------
  // COURSE CRUD
  // -------------------------------------------------------------

  const createCourse = async (
    courseInput: Omit<Course, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Course | null> => {
    if (currentUser.role !== 'admin') return null;

    const now = new Date().toISOString();
    const newCourse: Course = {
      ...courseInput,
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      created_at: now,
      updated_at: now,
    };

    setCourses((prev) => [newCourse, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('courses').insert([newCourse]);
      } catch (err) {
        console.warn('Supabase insert warning:', err);
      }
    }

    await logAuditAction('course_created', 'course', newCourse.id, `Created new course "${newCourse.title}"`);
    showToast('success', 'Course Created', `Course "${newCourse.title}" saved to database.`);
    return newCourse;
  };

  const updateCourse = async (courseId: string, updates: Partial<Course>): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    const now = new Date().toISOString();
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, ...updates, updated_at: now } : c))
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('courses').update({ ...updates, updated_at: now }).eq('id', courseId);
      } catch (err) {
        console.warn('Supabase update warning:', err);
      }
    }

    await logAuditAction('course_updated', 'course', courseId, `Updated course details for ${updates.title || courseId}`);
    showToast('success', 'Course Updated', 'Course changes saved to database.');
    return true;
  };

  const deleteCourse = async (courseId: string): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    const courseToDelete = courses.find((c) => c.id === courseId);
    if (!courseToDelete) return false;

    setCourses((prev) => prev.filter((c) => c.id !== courseId));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('courses').delete().eq('id', courseId);
      } catch (err) {
        console.warn('Supabase delete warning:', err);
      }
    }

    await logAuditAction('course_deleted', 'course', courseId, `Deleted course "${courseToDelete.title}"`);
    showToast('info', 'Course Deleted', `Course "${courseToDelete.title}" removed from catalog.`);
    return true;
  };

  // -------------------------------------------------------------
  // CHANNEL CRUD
  // -------------------------------------------------------------

  const createChannel = async (
    channelInput: Omit<Channel, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Channel | null> => {
    if (currentUser.role !== 'admin') return null;

    const now = new Date().toISOString();
    const newChannel: Channel = {
      ...channelInput,
      id: 'ch_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      created_at: now,
      updated_at: now,
    };

    setChannels((prev) => [newChannel, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('channels').insert([newChannel]);
      } catch (err) {
        console.warn('Supabase insert warning:', err);
      }
    }

    await logAuditAction('channel_created', 'channel', newChannel.id, `Created new channel "${newChannel.title}"`);
    showToast('success', 'Channel Created', `Channel "${newChannel.title}" saved to database.`);
    return newChannel;
  };

  const updateChannel = async (channelId: string, updates: Partial<Channel>): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    const now = new Date().toISOString();
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, ...updates, updated_at: now } : c))
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('channels').update({ ...updates, updated_at: now }).eq('id', channelId);
      } catch (err) {
        console.warn('Supabase update warning:', err);
      }
    }

    await logAuditAction('channel_updated', 'channel', channelId, `Updated channel details for ${updates.title || channelId}`);
    showToast('success', 'Channel Updated', 'Channel changes saved to database.');
    return true;
  };

  const deleteChannel = async (channelId: string): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    const channelToDelete = channels.find((c) => c.id === channelId);
    if (!channelToDelete) return false;

    setChannels((prev) => prev.filter((c) => c.id !== channelId));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('channels').delete().eq('id', channelId);
      } catch (err) {
        console.warn('Supabase delete warning:', err);
      }
    }

    await logAuditAction('channel_deleted', 'channel', channelId, `Deleted channel "${channelToDelete.title}"`);
    showToast('info', 'Channel Deleted', `Channel "${channelToDelete.title}" removed.`);
    return true;
  };

  // -------------------------------------------------------------
  // COMPANY NEWS CRUD
  // -------------------------------------------------------------

  const createNews = async (
    articleInput: Omit<CompanyNewsArticle, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CompanyNewsArticle | null> => {
    if (currentUser.role !== 'admin') return null;

    const now = new Date().toISOString();
    const newArticle: CompanyNewsArticle = {
      ...articleInput,
      id: generateUuid(),
      created_at: now,
      updated_at: now,
    };

    setCompanyNews((prev) => [newArticle, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('company_news').insert([newArticle]);
      } catch (err) {
        console.warn('Supabase news insert warning:', err);
      }
    }

    await logAuditAction('news_created', 'news', newArticle.id, `Created news article "${newArticle.title}"`);
    showToast('success', 'News Created', `"${newArticle.title}" saved to Supabase.`);
    return newArticle;
  };

  const updateNews = async (id: string, updates: Partial<CompanyNewsArticle>): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    const now = new Date().toISOString();
    setCompanyNews((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates, updated_at: now } : n))
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('company_news').update({ ...updates, updated_at: now }).eq('id', id);
      } catch (err) {
        console.warn('Supabase news update warning:', err);
      }
    }

    await logAuditAction('news_updated', 'news', id, `Updated news article "${updates.title || id}"`);
    showToast('success', 'News Updated', 'Changes saved to Supabase.');
    return true;
  };

  const deleteNews = async (id: string): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    const article = companyNews.find((n) => n.id === id);
    if (!article) return false;

    setCompanyNews((prev) => prev.filter((n) => n.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('company_news').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase news delete warning:', err);
      }
    }

    await logAuditAction('news_deleted', 'news', id, `Deleted news article "${article.title}"`);
    showToast('info', 'News Deleted', `"${article.title}" removed.`);
    return true;
  };

  // -------------------------------------------------------------
  // COMPANY VIDEOS CRUD
  // -------------------------------------------------------------

  const createVideo = async (
    videoInput: Omit<CompanyVideoItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CompanyVideoItem | null> => {
    if (currentUser.role !== 'admin') return null;

    const now = new Date().toISOString();
    const newVideo: CompanyVideoItem = {
      ...videoInput,
      id: generateUuid(),
      created_at: now,
      updated_at: now,
    };

    setCompanyVideos((prev) => [newVideo, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('company_videos').insert([newVideo]);
      } catch (err) {
        console.warn('Supabase video insert warning:', err);
      }
    }

    await logAuditAction('video_created', 'video', newVideo.id, `Added video "${newVideo.title}"`);
    showToast('success', 'Video Added', `"${newVideo.title}" saved to Supabase.`);
    return newVideo;
  };

  const updateVideo = async (id: string, updates: Partial<CompanyVideoItem>): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    const now = new Date().toISOString();
    setCompanyVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates, updated_at: now } : v))
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('company_videos').update({ ...updates, updated_at: now }).eq('id', id);
      } catch (err) {
        console.warn('Supabase video update warning:', err);
      }
    }

    await logAuditAction('video_updated', 'video', id, `Updated video "${updates.title || id}"`);
    showToast('success', 'Video Updated', 'Video metadata updated in Supabase.');
    return true;
  };

  const deleteVideo = async (id: string): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    const video = companyVideos.find((v) => v.id === id);
    if (!video) return false;

    setCompanyVideos((prev) => prev.filter((v) => v.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('company_videos').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase video delete warning:', err);
      }
    }

    await logAuditAction('video_deleted', 'video', id, `Deleted video "${video.title}"`);
    showToast('info', 'Video Deleted', `"${video.title}" removed.`);
    return true;
  };

  // -------------------------------------------------------------
  // TOP PERFORMERS CRUD
  // -------------------------------------------------------------

  const createTopPerformer = async (
    performerInput: Omit<TopPerformerEntry, 'id' | 'created_at' | 'updated_at'>
  ): Promise<TopPerformerEntry | null> => {
    if (currentUser.role !== 'admin') return null;

    const now = new Date().toISOString();
    const newPerformer: TopPerformerEntry = {
      ...performerInput,
      id: 'tp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      created_at: now,
      updated_at: now,
    };

    setTopPerformers((prev) => [newPerformer, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('top_performers').insert([newPerformer]);
      } catch (err) {
        console.warn('Supabase performer insert warning:', err);
      }
    }

    await logAuditAction(
      'top_performer_created',
      'top_performer',
      newPerformer.id,
      `Added Top Performer entry for ${newPerformer.employee_name}`
    );
    showToast('success', 'Top Performer Added', `${newPerformer.employee_name} recognized in Supabase.`);
    return newPerformer;
  };

  const updateTopPerformer = async (id: string, updates: Partial<TopPerformerEntry>): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    const now = new Date().toISOString();
    setTopPerformers((prev) =>
      prev.map((tp) => (tp.id === id ? { ...tp, ...updates, updated_at: now } : tp))
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('top_performers').update({ ...updates, updated_at: now }).eq('id', id);
      } catch (err) {
        console.warn('Supabase performer update warning:', err);
      }
    }

    await logAuditAction('top_performer_updated', 'top_performer', id, `Updated Top Performer entry for ${updates.employee_name || id}`);
    showToast('success', 'Top Performer Updated', 'Changes saved to Supabase.');
    return true;
  };

  const deleteTopPerformer = async (id: string): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    const performer = topPerformers.find((tp) => tp.id === id);
    if (!performer) return false;

    setTopPerformers((prev) => prev.filter((tp) => tp.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('top_performers').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase performer delete warning:', err);
      }
    }

    await logAuditAction('top_performer_deleted', 'top_performer', id, `Deleted Top Performer entry for ${performer.employee_name}`);
    showToast('info', 'Top Performer Removed', `${performer.employee_name} entry removed.`);
    return true;
  };

  // -------------------------------------------------------------
  // LICENSE TRAINING LESSONS CRUD (ADMIN UPLOAD & USER VIEWING)
  // -------------------------------------------------------------

  const createLicenseLesson = async (
    lessonInput: Omit<LicenseTrainingLesson, 'id' | 'created_at' | 'updated_at'>
  ): Promise<LicenseTrainingLesson | null> => {
    if (currentUser.role !== 'admin') {
      showToast('error', 'Access Denied', 'Only administrators can create license training lessons.');
      return null;
    }

    const now = new Date().toISOString();
    const contentType = lessonInput.content_type || lessonInput.lesson_type || 'video';
    const newLesson: LicenseTrainingLesson = {
      content_type: contentType,
      lesson_type: contentType,
      status: lessonInput.status || (lessonInput.is_published ? 'published' : 'draft'),
      ...lessonInput,
      id: 'lic_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      created_at: now,
      updated_at: now,
    };

    setLicenseTrainingLessons((prev) => [newLesson, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('license_training_lessons').insert([newLesson]);
      } catch (err) {
        console.warn('Supabase license lesson insert notice:', err);
      }
    }

    await logAuditAction(
      'course_created',
      'license_lesson',
      newLesson.id,
      `Created license training lesson: "${newLesson.title}" (${(newLesson.content_type || contentType).toUpperCase()})`
    );
    showToast('success', 'Lesson Saved', `"${newLesson.title}" has been saved.`);
    return newLesson;
  };

  const updateLicenseLesson = async (
    id: string,
    updates: Partial<LicenseTrainingLesson>
  ): Promise<boolean> => {
    if (currentUser.role !== 'admin') {
      showToast('error', 'Access Denied', 'Only administrators can modify license training lessons.');
      return false;
    }

    const now = new Date().toISOString();
    setLicenseTrainingLessons((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates, updated_at: now } : l))
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('license_training_lessons')
          .update({ ...updates, updated_at: now })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase license lesson update notice:', err);
      }
    }

    await logAuditAction(
      'course_updated',
      'license_lesson',
      id,
      `Updated license training lesson: "${updates.title || id}"`
    );
    showToast('success', 'Lesson Updated', 'Changes saved successfully.');
    return true;
  };

  const deleteLicenseLesson = async (id: string): Promise<boolean> => {
    if (currentUser.role !== 'admin') {
      showToast('error', 'Access Denied', 'Only administrators can delete license training lessons.');
      return false;
    }

    const lesson = licenseTrainingLessons.find((l) => l.id === id);
    if (!lesson) return false;

    setLicenseTrainingLessons((prev) => prev.filter((l) => l.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('license_training_lessons').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase license lesson delete notice:', err);
      }
    }

    await logAuditAction(
      'course_deleted',
      'license_lesson',
      id,
      `Deleted license training lesson: "${lesson.title}"`
    );
    showToast('info', 'Lesson Removed', `"${lesson.title}" has been deleted.`);
    return true;
  };

  // -------------------------------------------------------------
  // SKILL DEVELOPMENT RESOURCES CRUD (ADMIN UPLOAD & USER VIEWING)
  // -------------------------------------------------------------

  const createSkillResource = async (
    resourceInput: Omit<SkillDevelopmentResource, 'id' | 'created_at' | 'updated_at'>
  ): Promise<SkillDevelopmentResource | null> => {
    if (currentUser.role !== 'admin') {
      showToast('error', 'Access Denied', 'Only administrators can create skill development resources.');
      return null;
    }

    const now = new Date().toISOString();
    const newResource: SkillDevelopmentResource = {
      ...resourceInput,
      id: 'sk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      created_at: now,
      updated_at: now,
    };

    setSkillDevelopmentResources((prev) => [newResource, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('skill_development_resources').insert([newResource]);
      } catch (err) {
        console.warn('Supabase skill resource insert notice:', err);
      }
    }

    await logAuditAction(
      'course_created',
      'skill_resource',
      newResource.id,
      `Created skill resource: "${newResource.title}" [${newResource.topic}]`
    );
    showToast('success', 'Resource Created', `"${newResource.title}" saved to ${newResource.topic}.`);
    return newResource;
  };

  const updateSkillResource = async (
    id: string,
    updates: Partial<SkillDevelopmentResource>
  ): Promise<boolean> => {
    if (currentUser.role !== 'admin') {
      showToast('error', 'Access Denied', 'Only administrators can modify skill resources.');
      return false;
    }

    const now = new Date().toISOString();
    setSkillDevelopmentResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, updated_at: now } : r))
    );

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('skill_development_resources')
          .update({ ...updates, updated_at: now })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase skill resource update notice:', err);
      }
    }

    await logAuditAction(
      'course_updated',
      'skill_resource',
      id,
      `Updated skill resource: "${updates.title || id}"`
    );
    showToast('success', 'Resource Updated', 'Changes saved successfully.');
    return true;
  };

  const deleteSkillResource = async (id: string): Promise<boolean> => {
    if (currentUser.role !== 'admin') {
      showToast('error', 'Access Denied', 'Only administrators can delete skill resources.');
      return false;
    }

    const resource = skillDevelopmentResources.find((r) => r.id === id);
    if (!resource) return false;

    setSkillDevelopmentResources((prev) => prev.filter((r) => r.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('skill_development_resources').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase skill resource delete notice:', err);
      }
    }

    await logAuditAction(
      'course_deleted',
      'skill_resource',
      id,
      `Deleted skill resource: "${resource.title}"`
    );
    showToast('info', 'Resource Removed', `"${resource.title}" has been deleted.`);
    return true;
  };

  // -------------------------------------------------------------
  // HOD MOTTO & TEAM MEMBERS MUTATIONS
  // -------------------------------------------------------------

  const updateHodMotto = async (updates: Partial<HodMotto>): Promise<boolean> => {
    if (currentUser.role !== 'admin') {
      showToast('error', 'Unauthorized', 'Only administrators can update the HOD motto.');
      return false;
    }

    const updated: HodMotto = {
      ...hodMotto,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    setHodMotto(updated);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('hod_motto').upsert([updated]);
      } catch (err) {
        console.warn('Supabase HOD motto update warning:', err);
      }
    }

    await logAuditAction('hod_motto_updated', 'hod_motto', updated.id, 'Updated Head of Department (HOD) motto and guidance statement.');
    showToast('success', 'HOD Motto Saved', 'Head of Department leadership motto has been updated.');
    return true;
  };

  const createTeamMember = async (
    member: Omit<LdTeamMember, 'id' | 'created_at' | 'updated_at'>
  ): Promise<LdTeamMember | null> => {
    if (currentUser.role !== 'admin') {
      showToast('error', 'Unauthorized', 'Only administrators can add team members.');
      return null;
    }

    const now = new Date().toISOString();
    const newMember: LdTeamMember = {
      ...member,
      id: 'tm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      created_at: now,
      updated_at: now,
    };

    setTeamMembers((prev) => [...prev, newMember]);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('ld_team_members').insert([newMember]);
      } catch (err) {
        console.warn('Supabase team member insert warning:', err);
      }
    }

    await logAuditAction(
      'team_member_created',
      'team_member',
      newMember.id,
      `Added new ${newMember.member_type === 'intern' ? 'intern' : 'team member'}: ${newMember.full_name} (${newMember.position})`
    );
    showToast('success', 'Member Added', `${newMember.full_name} has been added to the L&D Team.`);
    return newMember;
  };

  const updateTeamMember = async (id: string, updates: Partial<LdTeamMember>): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    const existing = teamMembers.find((m) => m.id === id);
    if (!existing) return false;

    const updated: LdTeamMember = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    setTeamMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('ld_team_members').update(updated).eq('id', id);
      } catch (err) {
        console.warn('Supabase team member update warning:', err);
      }
    }

    await logAuditAction(
      'team_member_updated',
      'team_member',
      id,
      `Updated record for ${updated.full_name} (${updated.position})`
    );
    showToast('success', 'Member Updated', `${updated.full_name}'s record has been updated.`);
    return true;
  };

  const deleteTeamMember = async (id: string): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    const member = teamMembers.find((m) => m.id === id);
    if (!member) return false;

    setTeamMembers((prev) => prev.filter((m) => m.id !== id));

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('ld_team_members').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase team member delete warning:', err);
      }
    }

    await logAuditAction(
      'team_member_deleted',
      'team_member',
      id,
      `Deleted L&D team member: ${member.full_name}`
    );
    showToast('info', 'Member Removed', `${member.full_name} has been removed.`);
    return true;
  };

  const reorderTeamMembers = async (orderedIds: string[]): Promise<boolean> => {
    if (currentUser.role !== 'admin') return false;

    setTeamMembers((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      const reordered: LdTeamMember[] = [];
      orderedIds.forEach((id, idx) => {
        const item = map.get(id);
        if (item) {
          reordered.push({ ...item, display_order: idx + 1 });
          map.delete(id);
        }
      });
      map.forEach((item) => reordered.push(item));
      return reordered;
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        for (let i = 0; i < orderedIds.length; i++) {
          await supabase
            .from('ld_team_members')
            .update({ display_order: i + 1 })
            .eq('id', orderedIds[i]);
        }
      } catch (err) {
        console.warn('Supabase team reorder warning:', err);
      }
    }

    await logAuditAction('team_members_reordered', 'team_member', null, 'Reordered L&D team display sequence.');
    showToast('success', 'Order Saved', 'Team display order updated successfully.');
    return true;
  };

  // -------------------------------------------------------------
  // LEARNING PROGRESS
  // -------------------------------------------------------------

  const recordProgress = async (
    courseId?: string,
    channelId?: string,
    percentage: number = 25,
    completionStatus: ProgressCompletionStatus = 'in_progress',
    completedModule?: string
  ): Promise<boolean> => {
    if (currentUser.account_status === 'suspended') {
      showToast('error', 'Account Suspended', 'Suspended accounts cannot update or record learning progress.');
      return false;
    }

    const now = new Date().toISOString();
    const existing = learningProgress.find(
      (p) =>
        p.user_id === currentUser.id &&
        ((courseId && p.course_id === courseId) || (channelId && p.channel_id === channelId))
    );

    const prevModules = existing?.completed_modules || [];
    const updatedModules =
      completedModule && !prevModules.includes(completedModule)
        ? [...prevModules, completedModule]
        : prevModules;

    const record: LearningProgress = {
      id: existing ? existing.id : 'prog_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      user_id: currentUser.id,
      course_id: courseId || null,
      channel_id: channelId || null,
      progress_percentage: Math.min(100, Math.max(0, percentage)),
      completion_status: percentage >= 100 ? 'completed' : completionStatus,
      last_accessed_at: now,
      updated_at: now,
      completed_modules: updatedModules,
    };

    setLearningProgress((prev) => {
      const filtered = prev.filter(
        (p) =>
          !(
            p.user_id === currentUser.id &&
            ((courseId && p.course_id === courseId) || (channelId && p.channel_id === channelId))
          )
      );
      return [...filtered, record];
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('learning_progress').upsert([record]);
      } catch (err) {
        console.warn('Could not record progress to Supabase:', err);
      }
    }

    showToast('info', 'Progress Saved', `Progress updated to ${record.progress_percentage}%.`);
    return true;
  };

  // -------------------------------------------------------------
  // COMPUTED / HELPERS
  // -------------------------------------------------------------

  const getStats = (): AdminStats => {
    return {
      totalUsers: profiles.length,
      activeUsers: profiles.filter((p) => p.account_status === 'active').length,
      inactiveOrSuspendedUsers: profiles.filter((p) => p.account_status !== 'active').length,
      totalCourses: courses.length,
      totalChannels: channels.length,
      totalEnrollments: courseEnrollments.filter((e) => e.status === 'enrolled').length,
      totalNews: companyNews.length,
      totalVideos: companyVideos.length,
      totalTopPerformers: topPerformers.length,
      totalTeamMembers: teamMembers.length,
      totalLicenseLessons: licenseTrainingLessons.length,
      totalSkillResources: skillDevelopmentResources.length,
    };
  };

  const getUserEnrollments = (userId: string) => {
    return courseEnrollments.filter((e) => e.user_id === userId);
  };

  const getUserChannelAccesses = (userId: string) => {
    return channelAccesses.filter((ca) => ca.user_id === userId);
  };

  const getUserAccessibleCourses = (userId: string): Course[] => {
    const user = profiles.find((p) => p.id === userId);
    if (!user || user.account_status !== 'active') return [];
    if (user.role === 'admin') return courses.filter((c) => c.published);

    const validCourseIds = courseEnrollments
      .filter((e) => {
        if (e.user_id !== userId || e.status !== 'enrolled') return false;
        if (e.expires_at && new Date(e.expires_at) < new Date()) return false;
        return true;
      })
      .map((e) => e.course_id);

    return courses.filter((c) => c.published && validCourseIds.includes(c.id));
  };

  const getUserAccessibleChannels = (userId: string): Channel[] => {
    const user = profiles.find((p) => p.id === userId);
    if (!user || user.account_status !== 'active') return [];
    if (user.role === 'admin') return channels.filter((c) => c.published);

    const validChannelIds = channelAccesses
      .filter((ca) => {
        if (ca.user_id !== userId || ca.status !== 'granted') return false;
        if (ca.expires_at && new Date(ca.expires_at) < new Date()) return false;
        return true;
      })
      .map((ca) => ca.channel_id);

    return channels.filter((c) => c.published && validChannelIds.includes(c.id));
  };

  const getUserProgress = (userId: string, courseId?: string, channelId?: string) => {
    return learningProgress.find(
      (p) =>
        p.user_id === userId &&
        ((courseId && p.course_id === courseId) || (channelId && p.channel_id === channelId))
    );
  };

  const getPublishedNews = (): CompanyNewsArticle[] => {
    return companyNews.filter((n) => n.status === 'published');
  };

  const getPublishedVideos = (): CompanyVideoItem[] => {
    return companyVideos
      .filter((v) => v.status === 'published')
      .sort((a, b) => a.display_order - b.display_order);
  };

  const getPublishedTopPerformers = (): TopPerformerEntry[] => {
    return topPerformers.filter((tp) => tp.status === 'published');
  };

  const getPublishedTeamMembers = (): LdTeamMember[] => {
    return teamMembers
      .filter((m) => m.is_published)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const getPublishedHodMotto = (): HodMotto | null => {
    if (!hodMotto.is_published || !hodMotto.motto_text || !hodMotto.motto_text.trim()) {
      return null;
    }
    return hodMotto;
  };

  const getPublishedLicenseLessons = (): LicenseTrainingLesson[] => {
    return licenseTrainingLessons
      .filter((l) => l.is_published)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const getPublishedSkillResources = (): SkillDevelopmentResource[] => {
    return skillDevelopmentResources
      .filter((r) => r.is_published)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const resetToInitialData = () => {
    setProfiles(INITIAL_PROFILES);
    setCourses(INITIAL_COURSES);
    setChannels(INITIAL_CHANNELS);
    setCompanyNews(INITIAL_NEWS);
    setCompanyVideos(INITIAL_VIDEOS);
    setTopPerformers(INITIAL_TOP_PERFORMERS);
    setHodMotto(INITIAL_HOD_MOTTO);
    setTeamMembers(INITIAL_TEAM_MEMBERS);
    setLicenseTrainingLessons(INITIAL_LICENSE_LESSONS);
    setSkillDevelopmentResources(INITIAL_SKILL_RESOURCES);
    setCourseEnrollments(INITIAL_ENROLLMENTS);
    setChannelAccesses(INITIAL_CHANNEL_ACCESS);
    setLearningProgress(INITIAL_PROGRESS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setEmailLogs(INITIAL_EMAIL_LOGS);
    setCurrentUserId(INITIAL_PROFILES[0].id);
    localStorage.clear();
    showToast('info', 'Reset to Seed Data', 'All tables restored to official KBZLife initial state.');
  };

  return (
    <LmsContext.Provider
      value={{
        currentUser,
        profiles,
        courses,
        channels,
        courseEnrollments,
        channelAccesses,
        learningProgress,
        companyNews,
        companyVideos,
        topPerformers,
        hodMotto,
        teamMembers,
        licenseTrainingLessons,
        skillDevelopmentResources,
        auditLogs,
        emailLogs,
        isLoading,
        isSupabaseLive,
        toasts,
        dismissToast,
        showToast,
        isAuthenticated,
        switchUser,
        loginWithCredentials,
        registerUser,
        checkUserApprovalStatus,
        approveUser,
        rejectUser,
        changePassword,
        requestPasswordReset,
        updateAdminProfile,
        updateProfile,
        fetchProfile,
        signOut,
        getStats,
        getUserEnrollments,
        getUserChannelAccesses,
        getUserAccessibleCourses,
        getUserAccessibleChannels,
        getUserProgress,
        getPublishedNews,
        getPublishedVideos,
        getPublishedTopPerformers,
        getPublishedTeamMembers,
        getPublishedHodMotto,
        getPublishedLicenseLessons,
        getPublishedSkillResources,
        updateUserStatus,
        updateUserRole,
        assignCourse,
        revokeCourse,
        assignChannel,
        revokeChannel,
        createCourse,
        updateCourse,
        deleteCourse,
        createChannel,
        updateChannel,
        deleteChannel,
        createNews,
        updateNews,
        deleteNews,
        createVideo,
        updateVideo,
        deleteVideo,
        createTopPerformer,
        updateTopPerformer,
        deleteTopPerformer,
        createLicenseLesson,
        updateLicenseLesson,
        deleteLicenseLesson,
        createSkillResource,
        updateSkillResource,
        deleteSkillResource,
        updateHodMotto,
        createTeamMember,
        updateTeamMember,
        deleteTeamMember,
        reorderTeamMembers,
        inviteUser,
        sendCustomEmail,
        recordProgress,
        refreshData,
        resetToInitialData,
      }}
    >
      {children}

      {/* Global Toast Notifications Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border text-sm flex items-start justify-between gap-3 transition-all transform translate-y-0 ${
              toast.type === 'success'
                ? 'bg-emerald-900/95 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-red-900/95 text-white border-red-700'
                : toast.type === 'warning'
                ? 'bg-amber-900/95 text-white border-amber-700'
                : 'bg-[#003366]/95 text-white border-sky-600'
            }`}
          >
            <div>
              <p className="font-semibold">{toast.title}</p>
              {toast.message && <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{toast.message}</p>}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-white/60 hover:text-white text-xs font-bold px-1.5 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </LmsContext.Provider>
  );
};

export const useLms = (): LmsContextType => {
  const context = useContext(LmsContext);
  if (!context) {
    throw new Error('useLms must be used within an LmsProvider');
  }
  return context;
};
