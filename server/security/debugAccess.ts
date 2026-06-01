import { isProductionDeployment } from "@/server/qa/isQaMode";
import { isQaSecretValid } from "@/server/qa/isQaMode";

/** Debug routes: 404 in production unless QA secret header matches. */
export function isDebugRouteAllowed(req: Request): boolean {
  if (!isProductionDeployment()) return true;
  return isQaSecretValid(req);
}
