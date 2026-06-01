"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  TESSERACT_LANGUAGES,
  languageLabelForCode,
  normalizeOcrLanguage,
} from "@/lib/ocr/tesseractLanguages";

type Props = {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
};

export function OcrLanguageSelect({ value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const normalized = normalizeOcrLanguage(value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TESSERACT_LANGUAGES;
    return TESSERACT_LANGUAGES.filter(
      (l) =>
        l.code.includes(q) ||
        l.label.toLowerCase().includes(q) ||
        (l.native?.toLowerCase().includes(q) ?? false),
    );
  }, [query]);

  return (
    <div className="space-y-2">
      <label className="block text-sm">
        <span className="text-muted-foreground">
          {t("ocr.selectLanguage", { defaultValue: "Document language" })}
        </span>
        <select
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
          value={normalized}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          {TESSERACT_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
              {lang.native && lang.native !== lang.label ? ` · ${lang.native}` : ""} ({lang.code})
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="text-muted-foreground">
          {t("ocr.searchLanguage", { defaultValue: "Or type to search" })}
        </span>
        <input
          list="ocr-lang-suggestions"
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
          placeholder={t("ocr.languagePlaceholder", {
            defaultValue: "e.g. English, Hindi, eng…",
          })}
          disabled={disabled}
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            if (v.trim()) onChange(normalizeOcrLanguage(v));
          }}
          onBlur={() => setQuery("")}
        />
        <datalist id="ocr-lang-suggestions">
          {filtered.map((lang) => (
            <option key={lang.code} value={lang.label} />
          ))}
        </datalist>
      </label>

      <p className="text-xs text-muted-foreground">
        {t("ocr.selectedLanguage", {
          defaultValue: "Selected: {{label}} ({{code}})",
          label: languageLabelForCode(normalized),
          code: normalized,
        })}
      </p>
    </div>
  );
}
