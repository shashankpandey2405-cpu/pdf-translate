export const CATEGORY_ICONS = {
  editCompress: "✏️",
  splitMerge: "✂️",
  convertFromPdf: "📄",
  convertToPdf: "📝",
  signSecurity: "🔒",
  studentEssentials: "🎓",
};

/** Per-tool caps; browser enforcement uses deviceAdaptiveLimits (RAM/CPU). */
const DEFAULT_GUEST_MAX_FILES = 1;
const DEFAULT_AUTHED_MAX_FILES = 5;
const DEFAULT_GUEST_MAX_SIZE_MB = 80;
const DEFAULT_AUTHED_MAX_SIZE_MB = 60;

const TOOL_OVERRIDES = {
  "merge-pdf": { maxFilesGuest: 100, maxFilesAuthed: 100 },
  "jpg-to-pdf": { maxFilesGuest: 5, maxFilesAuthed: 20, processor: "conversion" },
  "png-to-pdf": { maxFilesGuest: 5, maxFilesAuthed: 20, processor: "conversion" },
  "excel-to-pdf": { processor: "conversion" },
  "pdf-to-excel": { processor: "conversion" },
  "pdf-to-word": { processor: "conversion" },
  "pdf-to-image": { processor: "conversion" },
  "pdf-to-png": { processor: "conversion" },
  "pdf-to-jpg": { processor: "conversion" },
  "pdf-to-epub": { processor: "conversion" },
  "remove-watermark": {
    routePath: "/magic-eraser",
    accept: ".pdf,application/pdf,image/png,image/jpeg,image/jpg",
    maxSizeMbGuest: 20,
    maxSizeMbAuthed: 50,
  },
  "document-scanner": { routePath: "/document-scanner" },
  "photo-resizer": { routePath: "/photo-resizer" },
  "resume-builder": { routePath: "/resume-builder", accept: "image/*" },
};

function withToolDefaults(item) {
  const override = TOOL_OVERRIDES[item.slug] || {};
  return {
    ...item,
    processor: "passthrough",
    maxFilesGuest: item.multiple ? DEFAULT_GUEST_MAX_FILES * 5 : DEFAULT_GUEST_MAX_FILES,
    maxFilesAuthed: item.multiple ? DEFAULT_AUTHED_MAX_FILES * 2 : DEFAULT_AUTHED_MAX_FILES,
    maxSizeMbGuest: DEFAULT_GUEST_MAX_SIZE_MB,
    maxSizeMbAuthed: DEFAULT_AUTHED_MAX_SIZE_MB,
    ...override,
  };
}

const TOOL_GROUPS_CONFIG = [
  {
    categoryKey: "editCompress",
    items: [
      { slug: "compress-pdf", accept: ".pdf,application/pdf", multiple: false },
      { slug: "pdf-editor", accept: ".pdf,application/pdf", multiple: false },
      { slug: "translate-pdf", accept: ".pdf,application/pdf", multiple: false },
      { slug: "ai-summarize", accept: ".pdf,application/pdf", multiple: false },
      { slug: "chat-pdf", accept: ".pdf,application/pdf", multiple: false },
      { slug: "pdf-to-pdfa", accept: ".pdf,application/pdf", multiple: false },
      { slug: "smart-scan-ai", accept: ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp", multiple: false },
      { slug: "flatten-pdf", accept: ".pdf,application/pdf", multiple: false },
      { slug: "compare-pdf", accept: ".pdf,application/pdf", multiple: true },
      { slug: "ai-question-gen", accept: ".pdf,application/pdf", multiple: false },
      { slug: "ocr-pdf", accept: ".pdf,application/pdf", multiple: false },
      { slug: "redact-pdf", accept: ".pdf,application/pdf", multiple: false },
      { slug: "repair-pdf", accept: ".pdf,application/pdf", multiple: false },
      {
        slug: "ai-scanner",
        routePath: "/tools/ai-scanner",
        accept: "image/jpeg,image/png,image/webp,image/*",
        multiple: false,
      },
    ].map(withToolDefaults),
  },
  {
    categoryKey: "splitMerge",
    items: [
      {
        slug: "merge-pdf",
        accept:
          ".pdf,application/pdf,image/png,image/jpeg,image/jpg,image/webp,image/gif,image/bmp,image/heic,image/heif,image/tiff,image/avif,image/*",
        multiple: true,
      },
      { slug: "split-pdf", accept: ".pdf,application/pdf", multiple: false },
      { slug: "extract-pages", accept: ".pdf,application/pdf", multiple: false },
      { slug: "remove-pages", accept: ".pdf,application/pdf", multiple: false },
      { slug: "organize-pdf", accept: ".pdf,application/pdf", multiple: false },
      { slug: "rotate-pdf", accept: ".pdf,application/pdf", multiple: false },
    ].map(withToolDefaults),
  },
  {
    categoryKey: "signSecurity",
    items: [
      { slug: "unlock-pdf", accept: ".pdf,application/pdf", multiple: false },
      { slug: "protect-pdf", accept: ".pdf,application/pdf", multiple: false },
      { slug: "hard-lock-pdf", accept: ".pdf,application/pdf", multiple: false },
      { slug: "watermark-pdf", accept: ".pdf,application/pdf", multiple: false },
      { slug: "page-numbers", accept: ".pdf,application/pdf", multiple: false },
      { slug: "sign-pdf", accept: ".pdf,application/pdf", multiple: false },
      { slug: "remove-watermark", accept: ".pdf,application/pdf", multiple: false },
      { slug: "generate-qr-code", accept: ".pdf,application/pdf", multiple: false },
    ].map(withToolDefaults),
  },
  {
    categoryKey: "convertFromPdf",
    items: [
      {
        slug: "universal-converter",
        routePath: "/universal-converter",
        accept:
          ".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.heic,.heif,.gif,.bmp,.txt,application/pdf,image/*",
        multiple: false,
      },
      { slug: "pdf-to-word", accept: ".pdf,application/pdf", multiple: false },
      { slug: "pdf-to-image", accept: ".pdf,application/pdf", multiple: false },
      { slug: "pdf-to-png", accept: ".pdf,application/pdf", multiple: false },
      { slug: "pdf-to-epub", accept: ".pdf,application/pdf", multiple: false },
      { slug: "pdf-to-jpg", accept: ".pdf,application/pdf", multiple: false },
      { slug: "pdf-to-pptx", accept: ".pdf,application/pdf", multiple: false },
      { slug: "pdf-to-excel", accept: ".pdf,application/pdf", multiple: false },
      { slug: "pdf-to-html", accept: ".pdf,application/pdf", multiple: false },
    ].map(withToolDefaults),
  },
  {
    categoryKey: "convertToPdf",
    items: [
      { slug: "pdf-maker", accept: ".txt,.doc,.docx,.rtf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document", multiple: false },
      { slug: "word-to-pdf", accept: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document", multiple: false },
      { slug: "png-to-pdf", accept: "image/png,image/*", multiple: true },
      { slug: "jpg-to-pdf", accept: "image/jpeg,image/*", multiple: true },
      { slug: "pptx-to-pdf", accept: ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation", multiple: false },
      { slug: "excel-to-pdf", accept: ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", multiple: false },
    ].map(withToolDefaults),
  },
  {
    categoryKey: "studentEssentials",
    items: [
      {
        slug: "document-scanner",
        accept: "image/jpeg,image/png,image/webp,image/*",
        multiple: false,
      },
      {
        slug: "photo-resizer",
        accept: "image/jpeg,image/png,image/webp,image/*",
        multiple: false,
      },
      {
        slug: "resume-builder",
        accept: "",
        multiple: false,
      },
    ].map(withToolDefaults),
  },
];

export const TOOL_GROUPS = TOOL_GROUPS_CONFIG;
export const RESOURCE_LINKS = [
  { label: "About Us", href: "/about-us" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
];

/** Canonical client route under locale prefix (e.g. `/merge-pdf` or `/tools/ai-scanner`). */
export function getToolHref(tool) {
  const path = tool.routePath ?? `/${tool.slug}`;
  return path.startsWith("/") ? path : `/${path}`;
}

export function getSecurityBadgeText(t) {
  return t("securityBadge.combined");
}

export function getToolGroups(t) {
  return TOOL_GROUPS_CONFIG.map((group) => ({
    category: t(`toolCategories.${group.categoryKey}`),
    categoryKey: group.categoryKey,
    items: group.items.map((tool) => ({
      ...tool,
      label: t(`tools.${tool.slug}.label`),
      desc: t(`tools.${tool.slug}.desc`),
    })),
  }));
}

export function findToolBySlug(slug, t) {
  const groups = getToolGroups(t);
  const lookup = {};
  groups.forEach((group) => {
    group.items.forEach((tool) => {
      lookup[tool.slug] = { ...tool, category: group.category, categoryKey: group.categoryKey };
    });
  });
  return lookup[slug] || null;
}

export function getResourceLinks(t) {
  return [
    { label: t("nav.resources.about"), href: "/about-us" },
    { label: t("nav.resources.helpCenter", { defaultValue: "Help Center" }), href: "/help" },
    { label: t("nav.resources.howTo"), href: "/how-to-use" },
    { label: t("nav.resources.faq"), href: "/faq" },
    { label: t("footer.privacyCenter", { defaultValue: "Privacy Center" }), href: "/privacy-center" },
    { label: t("footer.securityPage", { defaultValue: "Security" }), href: "/security" },
    { label: t("nav.resources.privacy"), href: "/privacy-policy" },
    { label: t("nav.resources.terms"), href: "/terms-of-service" },
    { label: t("nav.resources.cookies"), href: "/cookie-policy" },
    { label: t("nav.resources.disclaimer"), href: "/disclaimer" },
  ];
}

export function getToolGroupsBySlug(t) {
  return getToolGroups(t).reduce((acc, group) => {
    group.items.forEach((tool) => {
      acc[tool.slug] = { ...tool, category: group.category };
    });
    return acc;
  }, {});
}

export const FEATURED_HOME_TOOL_SLUGS = [
  "merge-pdf",
  "compress-pdf",
  "ai-scanner",
  "split-pdf",
  "pdf-to-word",
  "unlock-pdf",
  "watermark-pdf",
  "rotate-pdf",
  "pdf-to-image",
  "page-numbers",
  "generate-qr-code",
  "pdf-editor",
  "word-to-pdf",
];

export const TRUST_FEATURE_KEYS = [
  "browserPrivate",
  "blazingFast",
  "freeUnlimited",
  "multiDevice",
  "privacyFirst",
  "highQuality",
];

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "zh", label: "简体中文" },
  { code: "ar", label: "العربية" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
];

export const TOOL_SLUGS = TOOL_GROUPS_CONFIG.flatMap((group) => group.items.map((item) => item.slug));

export const TOOL_GROUPS_BY_SLUG = TOOL_GROUPS_CONFIG.reduce((acc, group) => {
  group.items.forEach((tool) => {
    acc[tool.slug] = { ...tool, categoryKey: group.categoryKey };
  });
  return acc;
}, {});
