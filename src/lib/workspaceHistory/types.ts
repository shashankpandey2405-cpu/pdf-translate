export type WorkspaceHistoryEntry = {
  id: string;
  filename: string;
  toolSlug: string;
  toolLabel: string;
  size: number;
  updatedAt: number;
  mimeType: string;
};

export type WorkspaceSaveInput = {
  filename: string;
  toolSlug: string;
  toolLabel: string;
  data: Blob | Uint8Array;
  mimeType?: string;
};
