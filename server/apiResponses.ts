/** R2 staging is optional; return 503 (not 500) when credentials are missing. */
export function stagingUnavailableResponse() {
  return Response.json(
    {
      error: "staging_unavailable",
      message: "Large-file cloud staging is not configured on this deployment.",
    },
    { status: 503 },
  );
}
