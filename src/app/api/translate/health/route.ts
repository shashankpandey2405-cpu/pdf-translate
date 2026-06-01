import { withSentryRoute } from "@/server/monitoring/withSentryRoute";
import { getOpenSourceTranslationProvider } from "@/server/translate/providers/OpenSourceTranslationProvider";
import { isClassicMtConfigured, TRANSLATE_MT_URL } from "@/server/translate/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getHealth() {
  const configured = isClassicMtConfigured();
  let mtOk = false;
  if (configured) {
    mtOk = await getOpenSourceTranslationProvider().healthCheck();
  }
  return Response.json({
    classicMtConfigured: configured,
    translateMtUrl: configured ? TRANSLATE_MT_URL : null,
    mtServiceHealthy: mtOk,
    ok: configured && mtOk,
  });
}

export const GET = withSentryRoute("translate_health", getHealth);
