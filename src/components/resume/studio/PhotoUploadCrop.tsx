"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useTranslation } from "react-i18next";
import { ImagePlus, Trash2, X } from "lucide-react";
import type { PhotoShape } from "@/tools/resume/types";

type Props = {
  photo: string | null;
  photoShape: PhotoShape;
  onPhotoChange: (dataUrl: string | null) => void;
  onShapeChange: (shape: PhotoShape) => void;
};

async function cropToDataUrl(imageSrc: string, crop: Area): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return canvas.toDataURL("image/jpeg", 0.92);
}

export function PhotoUploadCrop({ photo, photoShape, onPhotoChange, onShapeChange }: Props) {
  const { t } = useTranslation();
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedArea(pixels);
  }, []);

  const handleFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : null;
      if (url) setRawSrc(url);
    };
    reader.readAsDataURL(file);
  };

  const applyCrop = async () => {
    if (!rawSrc || !croppedArea) return;
    const url = await cropToDataUrl(rawSrc, croppedArea);
    onPhotoChange(url);
    setRawSrc(null);
  };

  const shapes: PhotoShape[] = ["circle", "rounded", "square"];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-foreground border-b border-border pb-2">{t("resumeStudio.photo.title")}</h2>
      <p className="text-xs text-muted-foreground">{t("resumeStudio.photo.hint")}</p>

      <div
        className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center touch-manipulation"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0] ?? null);
        }}
      >
        <ImagePlus className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <label className="cursor-pointer text-sm font-semibold text-primary">
          {t("resumeStudio.photo.upload")}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {photo ? (
        <div className="flex items-center gap-3">
          <img
            src={photo}
            alt=""
            className={`h-16 w-16 object-cover ${
              photoShape === "circle" ? "rounded-full" : photoShape === "square" ? "rounded-none" : "rounded-lg"
            }`}
          />
          <button type="button" onClick={() => onPhotoChange(null)} className="text-xs text-destructive font-medium inline-flex items-center gap-1">
            <Trash2 className="h-3.5 w-3.5" /> {t("resumeStudio.photo.remove")}
          </button>
        </div>
      ) : null}

      <div className="flex gap-2 flex-wrap">
        {shapes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onShapeChange(s)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize ${
              photoShape === s ? "border-primary bg-primary/10 text-primary" : "border-border"
            }`}
          >
            {t(`resumeStudio.photo.shape.${s}`)}
          </button>
        ))}
      </div>

      {rawSrc ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="relative h-64 bg-slate-900">
              <Cropper image={rawSrc} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
            </div>
            <div className="p-4 space-y-3">
              <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setRawSrc(null)} className="rounded-xl border px-4 py-2 text-sm">
                  <X className="h-4 w-4 inline mr-1" />
                  {t("resumeStudio.cancel")}
                </button>
                <button type="button" onClick={() => void applyCrop()} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
                  {t("resumeStudio.photo.applyCrop")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
