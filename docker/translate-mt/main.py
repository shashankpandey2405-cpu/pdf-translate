"""
Self-hosted batch machine translation (Argos Translate, MIT).
POST /translate  { source, target, texts: string[] }
GET  /health
"""
from __future__ import annotations

import os
from typing import Any

import argostranslate.package
import argostranslate.translate
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="PdfTrusted Classic MT", version="1.0.0")

_installed_pairs: set[tuple[str, str]] = set()


def _refresh_pairs() -> None:
    global _installed_pairs
    _installed_pairs = set()
    for lang in argostranslate.translate.get_installed_languages():
        from_code = lang.code
        for t in lang.translations_from:
            _installed_pairs.add((from_code, t.to_lang.code))


def _norm(code: str) -> str:
    c = (code or "en").strip().lower()
    if c in ("zh-tw", "zh_tw"):
        return "zh"
    if len(c) > 2 and "-" in c:
        return c.split("-")[0]
    return c[:2] if len(c) == 2 else c


def _get_translation(from_code: str, to_code: str):
    from_lang = next(
        (l for l in argostranslate.translate.get_installed_languages() if l.code == from_code),
        None,
    )
    if not from_lang:
        return None
    return from_lang.get_translation(to_code)


class TranslateRequest(BaseModel):
    source: str = Field(..., description="ISO-ish source language code")
    target: str = Field(..., description="ISO-ish target language code")
    texts: list[str] = Field(..., min_length=1, max_length=500)


class TranslateResponse(BaseModel):
    translations: list[str]
    provider: str = "argos"
    pair: str


@app.on_event("startup")
def startup() -> None:
    if os.getenv("ARGOS_SKIP_MODEL_DOWNLOAD") == "1":
        _refresh_pairs()
        return
  # Models baked in Docker image; refresh index only if empty
    if not argostranslate.translate.get_installed_languages():
        argostranslate.package.update_package_index()
        from download_models import main as dl

        dl()
    _refresh_pairs()


@app.get("/health")
def health() -> dict[str, Any]:
    _refresh_pairs()
    return {
        "ok": True,
        "installedPairs": len(_installed_pairs),
        "samplePairs": sorted([f"{a}->{b}" for a, b in list(_installed_pairs)[:12]]),
    }


@app.post("/translate", response_model=TranslateResponse)
def translate_batch(req: TranslateRequest) -> TranslateResponse:
    src = _norm(req.source)
    tgt = _norm(req.target)
    if src == tgt:
        return TranslateResponse(translations=list(req.texts), provider="argos", pair=f"{src}->{tgt}")

    tr = _get_translation(src, tgt)
    if tr is None:
        # Try pivot via English
        if src != "en" and tgt != "en":
            mid_tr = _get_translation(src, "en")
            out_tr = _get_translation("en", tgt)
            if mid_tr and out_tr:
                out: list[str] = []
                for text in req.texts:
                    mid = mid_tr.translate(text or "")
                    out.append(out_tr.translate(mid or ""))
                return TranslateResponse(translations=out, provider="argos-pivot", pair=f"{src}->en->{tgt}")
        raise HTTPException(
            status_code=422,
            detail=f"Language pair not installed: {src} -> {tgt}. Rebuild translate-mt image with download_models.py.",
        )

    translations = [tr.translate(t or "") for t in req.texts]
    return TranslateResponse(translations=translations, provider="argos", pair=f"{src}->{tgt}")
