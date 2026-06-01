import { describe, expect, it } from "vitest";
import { cloudPollDeadlineMs, cloudQueuedTimeoutMs } from "./cloudJobTimeouts";

describe("cloudJobTimeouts", () => {
  it("allows longer poll deadline for heavy office/docx tools", () => {
    expect(cloudPollDeadlineMs("pdf-to-word")).toBe(20 * 60 * 1000);
    expect(cloudPollDeadlineMs("merge-pdf")).toBe(12 * 60 * 1000);
  });

  it("allows longer queue wait for heavy tools", () => {
    expect(cloudQueuedTimeoutMs("ocr-pdf")).toBe(120_000);
    expect(cloudQueuedTimeoutMs("compress-pdf")).toBe(90_000);
  });
});
