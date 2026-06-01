"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X, SwitchCamera } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  onCapture: (file: File) => void;
  onClose: () => void;
};

export function ScannerCamera({ onCapture, onClose }: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setReady(false);
    stopStream();

    void (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(t("docScanner.cameraUnsupported", { defaultValue: "Camera not supported on this browser." }));
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : t("docScanner.cameraDenied", { defaultValue: "Could not access camera. Check permissions." }),
        );
      }
    })();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facing, stopStream, t]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" }));
        stopStream();
        onClose();
      },
      "image/jpeg",
      0.92,
    );
  }, [onCapture, onClose, stopStream]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <button type="button" onClick={() => { stopStream(); onClose(); }} className="rounded-full p-2 hover:bg-white/10">
          <X className="h-6 w-6" />
        </button>
        <span className="text-sm font-semibold">{t("docScanner.cameraTitle", { defaultValue: "Scan document" })}</span>
        <button
          type="button"
          onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
          className="rounded-full p-2 hover:bg-white/10"
          aria-label={t("docScanner.flipCamera", { defaultValue: "Flip camera" })}
        >
          <SwitchCamera className="h-6 w-6" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        {error ? (
          <p className="absolute bottom-24 left-4 right-4 rounded-xl bg-destructive/90 px-4 py-3 text-center text-sm text-white">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex justify-center pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <button
          type="button"
          disabled={!ready || Boolean(error)}
          onClick={capture}
          className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-primary text-white shadow-lg disabled:opacity-50"
          aria-label={t("docScanner.capture", { defaultValue: "Capture" })}
        >
          <Camera className="h-7 w-7" />
        </button>
      </div>
    </div>
  );
}
