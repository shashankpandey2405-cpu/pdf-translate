import { getQueueRedis } from "@/server/redis/client";
import type { DocumentAnalysis } from "@/server/ai/visionAnalyze";

const ANALYSIS_TTL_SEC = 7200;

function analysisKey(jobId: string): string {
  return `ai:smartscan:analysis:${jobId}`;
}

export function analysesToExcerpt(analyses: DocumentAnalysis[]): string {
  const lines: string[] = [];
  for (const page of analyses) {
    if (page.title?.trim()) lines.push(page.title.trim());
    for (const block of page.blocks) {
      const t = block.text?.trim();
      if (t) lines.push(t);
      if (block.listItems?.length) {
        for (const item of block.listItems) {
          const li = item?.trim();
          if (li) lines.push(`• ${li}`);
        }
      }
      if (block.tableData?.length) {
        for (const row of block.tableData) {
          lines.push(row.filter(Boolean).join(" | "));
        }
      }
    }
  }
  return lines.join("\n").slice(0, 48000);
}

export async function saveSmartScanAnalysis(
  jobId: string,
  userId: string,
  analyses: DocumentAnalysis[],
): Promise<void> {
  const redis = getQueueRedis();
  if (!redis) return;
  await redis.set(
    analysisKey(jobId),
    JSON.stringify({ userId, analyses, savedAt: new Date().toISOString() }),
    { ex: ANALYSIS_TTL_SEC },
  );
}

export async function getSmartScanAnalysis(
  jobId: string,
  userId: string,
): Promise<DocumentAnalysis[] | null> {
  const redis = getQueueRedis();
  if (!redis) return null;
  const raw = await redis.get(analysisKey(jobId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { userId?: string; analyses?: DocumentAnalysis[] };
    if (parsed.userId !== userId || !Array.isArray(parsed.analyses)) return null;
    return parsed.analyses;
  } catch {
    return null;
  }
}

export async function saveSmartScanAnalysisAfterRevise(
  jobId: string,
  userId: string,
  analyses: DocumentAnalysis[],
): Promise<void> {
  await saveSmartScanAnalysis(jobId, userId, analyses);
}
