"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { trimCanvas } from "@/lib/trimCanvas";

export type PenThickness = "fine" | "medium" | "bold";

const PEN_PRESETS: Record<PenThickness, { minWidth: number; maxWidth: number; dotSize: number }> = {
  fine:   { minWidth: 0.3, maxWidth: 1.6, dotSize: 1.0 },
  medium: { minWidth: 0.7, maxWidth: 3.5, dotSize: 2.0 },
  bold:   { minWidth: 1.8, maxWidth: 6.5, dotSize: 3.5 },
};

type Options = {
  enabled: boolean;
  heightCss: number;
  penColor?: string;
  thickness?: PenThickness;
};

/**
 * Touch-accurate signature pad: canvas CSS size matches layout, bitmap uses devicePixelRatio.
 */
export function useSmoothSignaturePad({ enabled, heightCss, penColor = "#0a162a", thickness = "medium" }: Options) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [hasInk, setHasInk] = useState(false);
  const [ready, setReady] = useState(false);

  const syncHasInk = useCallback(() => {
    setHasInk(!(padRef.current?.isEmpty() ?? true));
  }, []);

  const resizePad = useCallback(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const cssW = Math.max(200, Math.floor(wrap.clientWidth));
    const cssH = heightCss;
    const ratio = Math.max(1, Math.min(3, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1));

    const existingData = padRef.current && !padRef.current.isEmpty() ? padRef.current.toData() : null;

    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.floor(cssW * ratio);
    canvas.height = Math.floor(cssH * ratio);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    if (padRef.current) {
      padRef.current.off();
      padRef.current = null;
    }

    const preset = PEN_PRESETS[thickness] ?? PEN_PRESETS.medium;
    padRef.current = new SignaturePad(canvas, {
      penColor,
      backgroundColor: "rgba(0,0,0,0)",
      velocityFilterWeight: 0.7,
      minWidth: preset.minWidth,
      maxWidth: preset.maxWidth,
      minDistance: 0.5,
      throttle: 0,
      dotSize: preset.dotSize,
      onBegin: () => {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
        }
      },
      onEnd: syncHasInk,
    });

    if (existingData?.length) {
      padRef.current.fromData(existingData);
      syncHasInk();
    } else {
      setHasInk(false);
    }

    setReady(true);
  }, [heightCss, penColor, thickness, syncHasInk]);

  useLayoutEffect(() => {
    if (!enabled) {
      setReady(false);
      setHasInk(false);
      return;
    }
    resizePad();
  }, [enabled, resizePad]);

  useEffect(() => {
    if (!enabled) return;
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") return;

    let tmr: number;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(tmr);
      tmr = window.setTimeout(() => resizePad(), 80);
    });
    ro.observe(wrap);
    return () => {
      window.clearTimeout(tmr);
      ro.disconnect();
    };
  }, [enabled, resizePad]);

  useEffect(() => {
    if (!enabled) return;
    setHasInk(false);
    padRef.current?.clear();
  }, [enabled]);

  useEffect(
    () => () => {
      padRef.current?.off();
      padRef.current = null;
    },
    [],
  );

  const clear = useCallback(() => {
    padRef.current?.clear();
    setHasInk(false);
  }, []);

  const getCanvas = useCallback(() => padRef.current?.canvas ?? null, []);

  const isEmpty = useCallback(() => padRef.current?.isEmpty() ?? true, []);

  /** PNG data URL of trimmed signature strokes. */
  const exportSignaturePng = useCallback((): string | null => {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) return null;

    const canvas = pad.canvas;
    const copy = document.createElement("canvas");
    copy.width = canvas.width;
    copy.height = canvas.height;
    const ctx = copy.getContext("2d");
    if (!ctx) return pad.toDataURL("image/png");

    ctx.drawImage(canvas, 0, 0);
    try {
      const trimmed = trimCanvas(copy);
      if (trimmed.width < 2 || trimmed.height < 2) return null;
      return trimmed.toDataURL("image/png");
    } catch {
      return pad.toDataURL("image/png");
    }
  }, []);

  return {
    wrapRef,
    canvasRef,
    ready,
    hasInk,
    clear,
    getCanvas,
    isEmpty,
    exportSignaturePng,
    syncHasInk,
  };
}
