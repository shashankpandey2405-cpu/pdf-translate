export type ProcessingMode = "browser" | "enhanced";

export type EnhancedJobStatus = "queued" | "processing" | "done" | "failed" | "cancelled";

export type EnhancedUsageResponse = {
  enabled: boolean;
  enhancedUsed?: number;
  enhancedRemaining?: number;
  dailyLimit?: number;
  resetsAt?: string;
  message?: string;
  daily?: {
    cloudUsed: number;
    browserUsed: number;
    cloudLimit: number;
    cloudRemaining: number;
    resetsAt: string;
  };
  monthly?: { cloudUsed: number; browserUsed: number };
  lifetime?: { cloudUsed: number; browserUsed: number };
  aiTrial?: { trialLimit: number; trialUsed: number; trialRemaining: number };
  credits?: {
    balance: number;
    reserved: number;
    available: number;
    monthlyGrant: number;
    source?: string;
  };
};

export type EnhancedJobResponse = {
  jobId: string;
  traceId?: string;
  status: EnhancedJobStatus;
  progress?: number;
  downloadUrl?: string | null;
  downloadUrlDirect?: string | null;
  outputFilename?: string | null;
  inputR2Key?: string | null;
  outputR2Key?: string | null;
  toolSlug?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
};

export type EnhancedJobRunResult = {
  jobId: string;
  traceId?: string;
  downloadUrl: string;
  filename: string;
  inputR2Key?: string;
  outputR2Key?: string;
};
