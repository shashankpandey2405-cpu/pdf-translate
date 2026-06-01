# PDF → Word quality & size (May 2026)
#
# Problem: 700KB PDF → 46MB DOCX, blank page 1, slow.
# Causes: append-mode raster (pdf2docx + full PNG pages), 260 DPI PNG, DOCX_REMOVE_LEADING_BG=0.
#
# Fixes in backend-service (redeploy docx worker):
# - Raster fallback uses replace mode + JPEG q82 @ 200 DPI (max 2048px)
# - Bloated pdf2docx (size_ratio > 6) triggers raster replace instead of keeping hollow DOCX
# - remove_leading_blank_pdf2docx_page enabled by default
# - OCR preflight: balanced_preserve for graphic forms (faster than 300dpi accurate)
#
# Railway variables (pdftrusted-worker-docx):
#   DOCX_EMBED_IMAGE_DPI=200
#   DOCX_EMBED_IMAGE_JPEG_QUALITY=82
#   DOCX_EMBED_IMAGE_MAX_PX=2048
#   DOCX_RASTER_ALLOW_APPEND=0
#   DOCX_REMOVE_LEADING_BG=1
#   DOCX_OCR_PREFLIGHT_MODE=balanced_preserve
#
# See: backend-service/railway/docx.v4.env
