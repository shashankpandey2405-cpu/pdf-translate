/**
 * Structured tags for PDF/OCR/conversion pipeline observability.
 */
export type PipelineTags = {
  tool_name?: string;
  pipeline_stage?: string;
  file_type?: string;
  OCR_engine?: string;
  AI_provider?: string;
  queue_name?: string;
  worker_name?: string;
  conversion_engine?: string;
  user_action?: string;
  route_name?: string;
  API_name?: string;
  deployment_version?: string;
  environment?: string;
};

export function pipelineTagsFromToolSlug(
  toolSlug: string,
  stage: string,
  extra?: Partial<PipelineTags>,
): PipelineTags {
  return {
    tool_name: toolSlug,
    pipeline_stage: stage,
    route_name: typeof window !== "undefined" ? window.location.pathname : undefined,
    environment: process.env.NODE_ENV,
    deployment_version:
      (process.env.NEXT_PUBLIC_APP_RELEASE as string | undefined) ||
      (process.env.VITE_APP_RELEASE as string | undefined),
    ...extra,
  };
}

export function pipelineTagsForApi(apiName: string, extra?: Partial<PipelineTags>): PipelineTags {
  return {
    API_name: apiName,
    route_name: apiName,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV,
    deployment_version: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_APP_RELEASE,
    ...extra,
  };
}

export function pipelineTagsForWorker(pool: string, extra?: Partial<PipelineTags>): PipelineTags {
  return {
    queue_name: pool,
    worker_name: pool,
    pipeline_stage: extra?.pipeline_stage ?? "worker_process",
    tool_name: extra?.tool_name,
    OCR_engine: extra?.OCR_engine,
    conversion_engine: extra?.conversion_engine,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    deployment_version: process.env.SENTRY_RELEASE,
    ...extra,
  };
}

export function toSentryTagRecord(tags: PipelineTags): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(tags)) {
    if (v !== undefined && v !== null && String(v).trim()) {
      out[k] = String(v).slice(0, 200);
    }
  }
  return out;
}
