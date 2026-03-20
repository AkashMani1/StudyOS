export type UserRole = "user" | "admin";
export type SubscriptionPlan = "free" | "pro";
export type SubscriptionStatus = "inactive" | "active" | "halted" | "cancelled";
export type WalletTransactionType = "credit" | "debit" | "stake";
export type Priority = 1 | 2 | 3 | 4 | 5;

export interface TimestampValue {
  readonly seconds: number;
  readonly nanoseconds: number;
  toDate?: () => Date;
}

export interface SubjectInput {
  name: string;
  estimatedHours: number;
}

export interface GoalDoc {
  examName: string;
  deadline: TimestampValue | string | null;
  subjects: SubjectInput[];
  createdAt: TimestampValue | null;
}

export interface TaskDoc {
  id: string;
  subject: string;
  taskName: string;
  estimatedMinutes: number;
  priority: Priority;
  suggestedDay: string;
  completed: boolean;
  completedAt: TimestampValue | null;
  missedCount: number;
  rescheduledAt: TimestampValue | null;
  splitFromTaskId?: string | null;
  createdAt?: TimestampValue | null;
  updatedAt?: TimestampValue | null;
}

export interface TimeBlock {
  taskId: string;
  startTime: string;
  endTime: string;
}

export interface DailyPlanDoc {
  id: string;
  timeBlocks: TimeBlock[];
  generatedAt?: TimestampValue | null;
}

export interface SessionDoc {
  id: string;
  taskId: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart: TimestampValue | null;
  actualEnd: TimestampValue | null;
  completed: boolean;
  missedReason?: string | null;
  createdAt?: TimestampValue | null;
}

export interface FocusUsageEntry {
  domain: string;
  seconds: number;
}

export interface WeeklyInsightDoc {
  id: string;
  report: string;
  actionItems: string[];
  generatedAt: TimestampValue | null;
}

export interface WalletTransaction {
  type: WalletTransactionType;
  amount: number;
  reason: string;
  timestamp: TimestampValue | null;
}

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  razorpaySubId: string | null;
  validUntil: TimestampValue | string | null;
  status: SubscriptionStatus;
}

export interface StudyPreferences {
  preferredStartHour: number;
  preferredEndHour: number;
  blockedSites: string[];
  notificationsEnabled: boolean;
  hardModeEnabled: boolean;
  publicFailureLogEnabled: boolean;
}

export interface AppUserProfile {
  displayName: string;
  email: string;
  role: UserRole;
  fcmToken: string | null;
  instituteId?: string | null;
  subscription: SubscriptionInfo;
  wallet: {
    coins: number;
    transactions: WalletTransaction[];
  };
  preferences: StudyPreferences;
  createdAt?: TimestampValue | null;
  updatedAt?: TimestampValue | null;
}

export interface LeaderboardScore {
  uid: string;
  displayName: string;
  coins: number;
  completedTasks: number;
  streak: number;
  completionPercentage: number;
  failureSummary?: string | null;
}

export interface PublicFailureLog {
  missedTasks: string[];
  visibleTo: "public";
}

export interface RoomMember {
  name: string;
  currentTask: string;
  joinedAt: number;
  lastLeftAt?: number | null;
  isOnline?: boolean;
  totalTimePreviously?: number;
  lastActiveDay?: string;
}

export interface RoomDoc {
  id: string;
  name: string;
  hostUid: string;
  members: Record<string, RoomMember>;
  isLive: boolean;
  isLocked: boolean;
}

export interface SessionPayload {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  exp: number;
  iat: number;
}

export interface DashboardBarDatum {
  day: string;
  plannedHours: number;
  actualHours: number;
}

export interface SubjectCompletionDatum {
  subject: string;
  total: number;
  completed: number;
}

export interface HourDistributionDatum {
  hour: string;
  minutes: number;
  misses: number;
}

export interface StudyHeatCell {
  dayLabel: string;
  week: number;
  hours: number;
}

export interface StudentAdminRow {
  uid: string;
  name: string;
  email: string;
  completionPercentage: number;
  streak: number;
  coins: number;
  lastActive: string;
  subjects: string[];
}

export interface GeneratePlanRequest {
  examName: string;
  deadline: string;
  subjects: SubjectInput[];
}

export interface GeneratedTaskPayload {
  subject: string;
  taskName: string;
  estimatedMinutes: number;
  priority: Priority;
  suggestedDay: string;
}

export interface GeneratePlanResponse {
  tasks: GeneratedTaskPayload[];
  usedFallback: boolean;
}

export interface CoachRequest {
  prompt: string;
}

export interface RescheduleResponse {
  status: "ok" | "noop";
  updatedTaskIds: string[];
}

export interface WeeklyInsightResponse {
  report: string;
  actionItems: string[];
}

export interface NudgeResponse {
  status: "sent" | "skipped";
  message: string;
}

export interface DailyPlanResponse {
  date: string;
  blockCount: number;
  usedFallback: boolean;
}
