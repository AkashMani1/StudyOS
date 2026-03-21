import { z } from "zod";

export const subjectInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  estimatedHours: z.number().int().positive().max(500)
});

export const generatePlanSchema = z.object({
  examName: z.string().trim().min(2).max(120),
  deadline: z.string().date().refine(
    (value) => new Date(value) > new Date(new Date().toISOString().slice(0, 10)),
    { message: "Deadline must be a future date." }
  ),
  subjects: z.array(subjectInputSchema).min(1).max(20)
});

export const goalCreateSchema = generatePlanSchema;

export const sessionBootstrapSchema = z.object({
  idToken: z.string().min(1)
});

export const plannerSessionActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    taskId: z.string().min(1),
    sessionId: z.string().min(1),
    plannedDate: z.string().date(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/)
  }),
  z.object({
    action: z.literal("complete"),
    taskId: z.string().min(1),
    sessionId: z.string().min(1)
  }),
  z.object({
    action: z.literal("miss"),
    taskId: z.string().min(1),
    sessionId: z.string().min(1),
    reason: z.string().trim().min(3).max(160)
  })
]);

export const preferencesSchema = z.object({
  preferredStartHour: z.number().int().min(0).max(23),
  preferredEndHour: z.number().int().min(0).max(23),
  blockedSites: z.array(z.string().trim().min(1).max(120)).max(50),
  notificationsEnabled: z.boolean(),
  hardModeEnabled: z.boolean(),
  publicFailureLogEnabled: z.boolean()
}).refine((value) => value.preferredStartHour < value.preferredEndHour, {
  message: "preferredStartHour must be before preferredEndHour"
});

export const bootstrapProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: z.string().email(),
  fcmToken: z.string().min(1).max(512).nullable().optional()
});

export const saveFcmTokenSchema = z.object({
  fcmToken: z.string().min(1).max(512)
});

export const addStudentSchema = z.object({
  email: z.string().trim().email().max(255)
});

export const coachRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(3000)
});

export const createSubscriptionSchema = z.object({
  plan: z.literal("pro")
});

export const rescheduleSchema = z.object({
  taskId: z.string().min(1),
  sessionId: z.string().min(1)
});

export const dailyPlanSchema = z.object({
  date: z.string().date().optional(),
  useAi: z.boolean().optional()
});
