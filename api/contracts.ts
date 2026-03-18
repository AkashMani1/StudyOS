import type {
  CoachRequest,
  GeneratePlanRequest,
  GeneratePlanResponse,
  NudgeResponse,
  RescheduleResponse,
  WeeklyInsightResponse
} from "@/types/domain";

export type { CoachRequest, GeneratePlanRequest, GeneratePlanResponse, NudgeResponse, RescheduleResponse, WeeklyInsightResponse };

export interface SessionRequest {
  idToken: string;
}

export interface SubscriptionResponse {
  subscriptionId: string;
  plan: "pro";
}
