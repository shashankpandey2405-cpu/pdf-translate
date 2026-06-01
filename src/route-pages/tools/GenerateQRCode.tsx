import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { QrCode } from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { useTranslation } from "react-i18next";
import { getPublicSiteOrigin } from "@/lib/publicSite";
import ToolSEO from "@/components/ToolSEO";
import { ToolPageSplit } from "@/components/desktop/ToolPageSplit";
import { MobileToolLayout } from "@/components/mobile/MobileToolLayout";
import { safeDownloadBlob } from "@/lib/download/safeDownload";
import { logToolSuccess } from "@/utils/logger";
import { ToolWorkflowActions } from "@/components/ToolWorkflowActions";
import { ToolResultPanel, type ToolResultPanelGalleryItem } from "@/components/tools/ToolResultPanel";

const FALLBACK_QR = `${getPublicSiteOrigin()}/en/generate-qr-code`;

function readPublicToolUrl(): string {
  if (typeof window === "undefined") return FALLBACK_QR;
  const origin = getPublicSiteOrigin();
  const path = window.location.pathname + window.location.search;
  return `${origin}${path}`.replace(/\/$/, "") || origin;
}

export default function GenerateQRCode() {
  const { t, i18n } = useTranslation();
  const [location] = useLocation();
  const userEditedRef = useRef(false);
  const [text, setText] = useState(FALLBACK_QR);
  const [size, setSize] = useState(220);
  const [format, setFormat] = useState<"png" | "svg">("png");
  const [outputDataUrl, setOutputDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const qrValue = useMemo(() => text.trim() || readPublicToolUrl(), [text, location]);

  /** Default QR payload: canonical https://pdftrusted.com/... URL for whatever tool page is open. */
  useEffect(() => {
    if (userEditedRef.current) return;
    setText(readPublicToolUrl());
  }, [location]);

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      if (cancelled || !canvasRef.current) return;
      if (format === "png") {
        const canvas = canvasRef.current.querySelector("canvas");
        if (canvas) setOutputDataUrl(canvas.toDataURL("image/png"));
      } else {
        const svg = canvasRef.current.querySelector("svg");
        if (!svg) return;
        const data = new XMLSerializer().serializeToString(svg);
        setOutputDataUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(data)}`);
      }
    }, 60);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [qrValue, size, format]);

  const galleryItems = useMemo<ToolResultPanelGalleryItem[]>(() => {
    if (!outputDataUrl) return [];
    return [{ dataUrl: outputDataUrl, filename: `pdftrusted-qr.${format}` }];
  }, [outputDataUrl, format]);

  function resetForm() {
    userEditedRef.current = false;
    setText(readPublicToolUrl());
    setSize(220);
    setFormat("png");
  }

  const settingsPanel = (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-foreground">{t("toolPage.content")}</span>
        <textarea
          value={text}
          onChange={(e) => {
            userEditedRef.current = true;
            setText(e.target.value);
          }}
          className="mt-2 h-28 w-full rounded-2xl border border-border bg-background p-3 text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-foreground">{t("toolPage.size")} ({size}px)</span>
        <input type="range" min={120} max={420} step={10} value={size} onChange={(e) => setSize(Number(e.target.value))} className="mt-2 w-full" />
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={() => setFormat("png")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${format === "png" ? "bg-primary text-white" : "border border-border"}`}>PNG</button>
        <button type="button" onClick={() => setFormat("svg")} className={`rounded-xl px-4 py-2 text-sm font-semibold ${format === "svg" ? "bg-primary text-white" : "border border-border"}`}>SVG</button>
      </div>
    </div>
  );

  const qrPreview = (
    <div ref={canvasRef} className="mx-auto rounded-2xl bg-white p-4 shadow-sm">
      {format === "png" ? <QRCodeCanvas value={qrValue} size={size} includeMargin level="H" /> : <QRCodeSVG value={qrValue} size={size} includeMargin level="H" />}
    </div>
  );

  const desktop = (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <ToolSEO title={t("seo.generateQr.title")} description={t("seo.generateQr.desc")} slug="generate-qr-code" lang={i18n.language} />
      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{t("tools.generate-qr-code.label")}</h1>
      <p className="mt-2 text-muted-foreground">{t("tools.generate-qr-code.desc")}</p>
      <ToolWorkflowActions onReset={resetForm} className="mt-4" />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-foreground">{t("toolPage.content")}</span>
            <textarea
              value={text}
              onChange={(e) => {
                userEditedRef.current = true;
                setText(e.target.value);
              }}
              className="mt-2 h-36 w-full rounded-2xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
              placeholder={t("toolPage.contentPlaceholder")}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-foreground">{t("toolPage.size")} ({size}px)</span>
            <input
              type="range"
              min={120}
              max={420}
              step={10}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFormat("png")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${format === "png" ? "bg-primary text-white" : "border border-border bg-background text-foreground"}`}
            >
              PNG
            </button>
            <button
              type="button"
              onClick={() => setFormat("svg")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${format === "svg" ? "bg-primary text-white" : "border border-border bg-background text-foreground"}`}
            >
              SVG
            </button>
          </div>
        </div>

        <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-border bg-card p-6">
          {qrPreview}
          <QrCode className="sr-only" />
        </div>
      </div>
      <ToolResultPanel
        mode="gallery"
        items={galleryItems}
        itemLabel={format.toUpperCase()}
        title={t("toolPage.download", { defaultValue: "Download" }) + " QR"}
        onProcessAnother={() => {
          resetForm();
          logToolSuccess("generate-qr-code", { reset: true });
        }}
      />
    </div>
  );

  const mobile = (
    <MobileToolLayout
      slug="generate-qr-code"
      toolLabel={t("tools.generate-qr-code.label")}
      title={t("tools.generate-qr-code.label")}
      settingsPanel={settingsPanel}
      processButton={
        outputDataUrl ? (
          <button
            type="button"
            className="w-full rounded-2xl bg-primary py-4 text-sm font-bold text-white"
            onClick={() => {
              void (async () => {
                const res = await fetch(outputDataUrl);
                const blob = await res.blob();
                await safeDownloadBlob(blob, `pdftrusted-qr.${format}`);
              })();
            }}
          >
            {t("toolPage.download", { defaultValue: "Download" })} QR
          </button>
        ) : null
      }
    >
      <ToolSEO title={t("seo.generateQr.title")} description={t("seo.generateQr.desc")} slug="generate-qr-code" lang={i18n.language} />
      <div className="flex justify-center py-6">{qrPreview}</div>
    </MobileToolLayout>
  );

  return <ToolPageSplit desktop={desktop} mobile={mobile} />;
}
