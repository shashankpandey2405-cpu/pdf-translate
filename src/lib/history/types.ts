export type LocalHistoryEntry = {
  id: string;
  jobId: string;
  toolSlug: string;
  toolName: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: number;
  inputR2Key?: string;
  outputR2Key?: string;
};

export type LocalHistorySaveInput = {
  jobId: string;
  toolSlug: string;
  toolName: string;
  fileName: string;
  blob: Blob;
  inputR2Key?: string;
  outputR2Key?: string;
};
