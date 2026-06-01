import type { ToolRichSeo } from "@/data/seo/toolSeoBundles";

const P = "多数工具在浏览器中运行；云端文件按政策自动删除。";

/** Phase 3 — 中文知识库正文、步骤与 FAQ（元数据见 metaOnly / meta-phase2）。 */
export const ZH_TOOL_SEO_PHASE3: Record<string, Partial<ToolRichSeo>> = {
  "merge-pdf": {
    bodyParagraphs: [
      "将多个 PDF 与图片（PNG、JPG、WebP、HEIC）合并为一个文件。拖拽缩略图排序后一键下载。",
      P,
    ],
    howToSteps: [
      { name: "上传", text: "拖入两个或以上 PDF 或照片。" },
      { name: "排序", text: "拖动缩略图调整页面顺序。" },
      { name: "合并", text: "执行合并并下载 PDF。" },
    ],
    faqs: [
      { question: "合并 PDF 安全吗？", answer: P },
      { question: "最多几个文件？", answer: "免费版支持多文件；超大批次取决于设备内存。" },
      { question: "照片能合并吗？", answer: "可以 — 图片会按顺序转为 PDF 页面。" },
    ],
  },
  "compress-pdf": {
    bodyParagraphs: ["为邮件与分享减小 PDF 体积，可选压缩级别并对比前后大小。", P],
    howToSteps: [
      { name: "上传", text: "选择 PDF。" },
      { name: "级别", text: "选择推荐或强力压缩。" },
      { name: "下载", text: "保存更小的 PDF。" },
    ],
    faqs: [
      { question: "会模糊吗？", answer: "数字 PDF 通常仍清晰；扫描件强力压缩可能有噪点。" },
      { question: "有密码的 PDF？", answer: "请先用解锁工具。" },
    ],
  },
  "pdf-to-word": {
    bodyParagraphs: ["将可选中文字的 PDF 转为可编辑 RTF/DOCX 流程；扫描件建议先 OCR。", P],
    howToSteps: [
      { name: "上传", text: "选择文本型 PDF。" },
      { name: "转换", text: "本地或云端处理。" },
      { name: "下载", text: "在 Word 中打开。" },
    ],
    faqs: [
      { question: "版式会完全一样吗？", answer: "复杂版式可能略有变化。" },
      { question: "扫描件？", answer: "请使用 OCR PDF 工具。" },
    ],
  },
  "word-to-pdf": {
    bodyParagraphs: ["将 Word 文档转为便于分享的 PDF，表格与图片尽量保留。", P],
    howToSteps: [
      { name: "上传", text: "选择 .docx。" },
      { name: "转换", text: "Premium 云端高保真渲染。" },
      { name: "下载", text: "保存 PDF。" },
    ],
    faqs: [{ question: "需要登录吗？", answer: "云端转换需登录；文件不会长期保留。" }],
  },
  "pdf-editor": {
    bodyParagraphs: [
      "在浏览器中注释、高亮、插入签名、重排页面并导出。含 Sign Pro 与 Hard Lock。",
      P,
    ],
    howToSteps: [
      { name: "打开", text: "上传 PDF 进入工作区。" },
      { name: "编辑", text: "选择文本、画笔、签名等工具。" },
      { name: "保存", text: "导出扁平化 PDF。" },
    ],
    faqs: [
      { question: "机密文件安全吗？", answer: P },
      { question: "支持手机吗？", answer: "支持现代移动浏览器，横屏体验更佳。" },
    ],
  },
  "sign-pdf": {
    bodyParagraphs: ["绘制、输入或上传签名，精准放置在合同与表单上。", P],
    howToSteps: [
      { name: "上传", text: "加载待签署 PDF。" },
      { name: "签名", text: "创建并放置签名。" },
      { name: "下载", text: "导出已签署 PDF。" },
    ],
    faqs: [
      { question: "具有法律效力吗？", answer: "各国规定不同，请咨询当地电子签名法规。" },
      { question: "是否私密？", answer: P },
    ],
  },
  "ocr-pdf": {
    bodyParagraphs: ["为扫描 PDF 添加可搜索文字层，或导出纯文本。", P],
    howToSteps: [
      { name: "上传", text: "添加扫描 PDF。" },
      { name: "输出", text: "选择可搜索 PDF 或 TXT。" },
      { name: "下载", text: "保存 OCR 结果。" },
    ],
    faqs: [{ question: "准确度？", answer: "取决于扫描清晰度与语言。" }],
  },
  "split-pdf": {
    bodyParagraphs: ["用缩略图选择页面，导出为新的 PDF 文件。", P],
    howToSteps: [
      { name: "上传", text: "加载 PDF。" },
      { name: "选择", text: "点选要提取的页面。" },
      { name: "导出", text: "下载拆分后的 PDF。" },
    ],
    faqs: [{ question: "会保留书签吗？", answer: "基础拆分侧重页面内容。" }],
  },
  "protect-pdf": {
    bodyParagraphs: ["为合同、税务与敏感 PDF 设置打开密码与权限。", P],
    howToSteps: [
      { name: "上传", text: "选择 PDF。" },
      { name: "密码", text: "设置强密码与权限。" },
      { name: "下载", text: "保存加密 PDF。" },
    ],
    faqs: [{ question: "能取消密码吗？", answer: "凭正确密码可用解锁工具。" }],
  },
  "unlock-pdf": {
    bodyParagraphs: ["在合法且您拥有权限时移除已知密码限制。", P],
    howToSteps: [
      { name: "上传", text: "选择受保护 PDF。" },
      { name: "密码", text: "输入正确密码。" },
      { name: "解锁", text: "下载无限制副本。" },
    ],
    faqs: [{ question: "忘记密码？", answer: "无法保证恢复，请联系文件所有者。" }],
  },
  "rotate-pdf": {
    bodyParagraphs: ["修正倒置扫描与横竖混排，按页旋转 90°。", P],
    howToSteps: [
      { name: "上传", text: "加载 PDF。" },
      { name: "旋转", text: "选择页面并旋转。" },
      { name: "保存", text: "下载校正后的 PDF。" },
    ],
    faqs: [{ question: "是否私密？", answer: P }],
  },
  "watermark-pdf": {
    bodyParagraphs: ["为草稿与预览添加对角文字水印，可调透明度。", P],
    howToSteps: [
      { name: "上传", text: "选择 PDF。" },
      { name: "设置", text: "文字、颜色、透明度。" },
      { name: "导出", text: "下载带水印 PDF。" },
    ],
    faqs: [{ question: "支持图片水印？", answer: "当前以文字为主；图片请用 PDF 编辑器。" }],
  },
  "pdf-to-image": {
    bodyParagraphs: ["逐页导出 JPG/PNG，适合演示与社交媒体。", P],
    howToSteps: [
      { name: "上传", text: "选择 PDF。" },
      { name: "格式", text: "JPEG 或 PNG。" },
      { name: "下载", text: "保存图片。" },
    ],
    faqs: [{ question: "大文件慢？", answer: "可先拆分 PDF。" }],
  },
  "page-numbers": {
    bodyParagraphs: ["为报告与卷宗添加统一页码，可设前缀与字体。", P],
    howToSteps: [
      { name: "上传", text: "加载 PDF。" },
      { name: "配置", text: "位置与起始页码。" },
      { name: "应用", text: "下载编号 PDF。" },
    ],
    faqs: [{ question: "影响版式？", answer: "页码在页边，请打印试样确认。" }],
  },
  "pdf-maker": {
    bodyParagraphs: ["无需 Word，从文本快速生成 PDF。", P],
    howToSteps: [
      { name: "输入", text: "粘贴或键入内容。" },
      { name: "样式", text: "调整字体与行距。" },
      { name: "生成", text: "下载 PDF。" },
    ],
    faqs: [{ question: "插图？", answer: "请使用 PDF 编辑器。" }],
  },
  "pptx-to-pdf": {
    bodyParagraphs: ["将 PPTX 演示转为 PDF；动画会扁平化为静态页。", P],
    howToSteps: [
      { name: "上传", text: "选择 .pptx。" },
      { name: "转换", text: "云端渲染。" },
      { name: "下载", text: "保存 PDF。" },
    ],
    faqs: [{ question: "动画保留吗？", answer: "导出为静态幻灯片外观。" }],
  },
  "generate-qr-code": {
    bodyParagraphs: ["为菜单、活动与 PDF 生成清晰二维码，本地生成不上传。", P],
    howToSteps: [
      { name: "内容", text: "输入 URL 或文本。" },
      { name: "尺寸", text: "调整像素大小。" },
      { name: "下载", text: "PNG 或 SVG。" },
    ],
    faqs: [{ question: "会追踪吗？", answer: "生成过程不发送到服务器。" }],
  },
  "translate-pdf": {
    bodyParagraphs: ["本地提取 PDF 文字，复制到您使用的翻译服务。", P],
    howToSteps: [
      { name: "上传", text: "选择含文字的 PDF。" },
      { name: "提取", text: "本地处理。" },
      { name: "复制", text: "剪贴板或 RTF。" },
    ],
    faqs: [{ question: "自动翻译？", answer: "本工具仅提取文字，不调用云端 LLM。" }],
  },
  "remove-watermark": {
    bodyParagraphs: ["淡化简单平面水印，非生成式云端修复。", P],
    howToSteps: [
      { name: "上传", text: "PDF 或图片。" },
      { name: "区域", text: "自动或手动遮罩。" },
      { name: "下载", text: "保存修复结果。" },
    ],
    faqs: [{ question: "合法使用？", answer: "仅限您有权修改的文件。" }],
  },
  "hard-lock-pdf": {
    bodyParagraphs: ["将每页栅格化为图像层，防止再编辑文字与签名。", P],
    howToSteps: [
      { name: "上传", text: "最终版 PDF。" },
      { name: "锁定", text: "执行 Hard Lock。" },
      { name: "下载", text: "保存不可变 PDF。" },
    ],
    faqs: [{ question: "可逆吗？", answer: "不可逆，请保留原始可编辑副本。" }],
  },
  "repair-pdf": {
    bodyParagraphs: ["修复 xref 错误、空白页等损坏 PDF。", P],
    howToSteps: [
      { name: "上传", text: "损坏的 PDF。" },
      { name: "修复", text: "浏览器内重建。" },
      { name: "下载", text: "保存修复副本。" },
    ],
    faqs: [{ question: "总能恢复？", answer: "严重损坏可能丢失部分内容。" }],
  },
  "redact-pdf": {
    bodyParagraphs: ["对邮箱、卡号、电话等模式涂黑脱敏。", P],
    howToSteps: [
      { name: "上传", text: "选择 PDF。" },
      { name: "模式", text: "启用匹配规则。" },
      { name: "下载", text: "导出脱敏 PDF。" },
    ],
    faqs: [{ question: "永久吗？", answer: "是 — 请核对输出文件。" }],
  },
  "pdf-to-html": {
    bodyParagraphs: ["将 PDF 文字导出为轻量 HTML，便于博客与归档。", P],
    howToSteps: [
      { name: "上传", text: "选择 PDF。" },
      { name: "转换", text: "本地提取。" },
      { name: "下载", text: "保存 .html。" },
    ],
    faqs: [{ question: "含图片吗？", answer: "主要导出文字内容。" }],
  },
  "document-scanner": {
    bodyParagraphs: ["照片转清晰 PDF：裁剪、旋转、黑白滤镜，适合学生与收据。", P],
    howToSteps: [
      { name: "照片", text: "上传 JPG/PNG。" },
      { name: "增强", text: "裁剪与滤镜。" },
      { name: "PDF", text: "本地导出。" },
    ],
    faqs: [{ question: "会上传吗？", answer: "不上传 — 全程本地处理。" }],
  },
  "photo-resizer": {
    bodyParagraphs: ["将证件照压缩到表单要求的精确 KB。", P],
    howToSteps: [
      { name: "上传", text: "选择照片。" },
      { name: "目标", text: "设置 KB。" },
      { name: "下载", text: "保存压缩图。" },
    ],
    faqs: [{ question: "画质？", answer: "在达到 KB 前平衡清晰度。" }],
  },
  "resume-builder": {
    bodyParagraphs: ["精选模板、实时预览、PDF 导出；草稿仅存于本机。", P],
    howToSteps: [
      { name: "模板", text: "选择版式。" },
      { name: "填写", text: "完成各章节。" },
      { name: "PDF", text: "下载简历。" },
    ],
    faqs: [{ question: "数据在服务器？", answer: "否 — 仅 localStorage。" }],
  },
  "professional-cv-maker": {
    bodyParagraphs: ["企业风格简历模板，免费导出 PDF。", P],
    howToSteps: [
      { name: "模板", text: "商务版式。" },
      { name: "内容", text: "填写经历。" },
      { name: "导出", text: "下载 PDF。" },
    ],
    faqs: [{ question: "免费？", answer: "是。" }],
  },
  "government-resume-builder": {
    bodyParagraphs: ["适合公职与正式申请的规范结构。", P],
    howToSteps: [
      { name: "模板", text: "正式版。" },
      { name: "信息", text: "填写全部栏目。" },
      { name: "PDF", text: "下载。" },
    ],
    faqs: [{ question: "照片？", answer: "可选。" }],
  },
  "ats-friendly-resume-builder": {
    bodyParagraphs: ["单栏清晰结构，便于招聘系统解析。", P],
    howToSteps: [
      { name: "模板", text: "ATS 友好版。" },
      { name: "关键词", text: "突出技能与经历。" },
      { name: "导出", text: "下载 PDF。" },
    ],
    faqs: [{ question: "什么是 ATS？", answer: "求职平台的自动简历筛选系统。" }],
  },
  "universal-converter": {
    bodyParagraphs: ["在一条流程中转换 PDF、图片与 Office 格式。", P],
    howToSteps: [
      { name: "格式", text: "选择输入与输出。" },
      { name: "上传", text: "添加文件。" },
      { name: "转换", text: "下载结果。" },
    ],
    faqs: [{ question: "隐私？", answer: P }],
  },
  "jpg-to-pdf": {
    bodyParagraphs: ["将一张或多张 JPG 合成 PDF。", P],
    howToSteps: [
      { name: "JPG", text: "选择图片。" },
      { name: "排序", text: "调整顺序。" },
      { name: "PDF", text: "下载。" },
    ],
    faqs: [{ question: "私密？", answer: P }],
  },
  "png-to-pdf": {
    bodyParagraphs: ["PNG（含透明）转可分享 PDF。", P],
    howToSteps: [
      { name: "PNG", text: "上传。" },
      { name: "生成", text: "创建 PDF。" },
      { name: "下载", text: "保存。" },
    ],
    faqs: [{ question: "透明背景？", answer: "高分辨率栅格化保持边缘清晰。" }],
  },
  "excel-to-pdf": {
    bodyParagraphs: ["表格与报表转为固定版式 PDF。", P],
    howToSteps: [
      { name: "上传", text: "Excel 文件。" },
      { name: "转换", text: "云端或浏览器。" },
      { name: "下载", text: "保存 PDF。" },
    ],
    faqs: [{ question: "公式可编辑？", answer: "PDF 只读，请保留原 Excel。" }],
  },
  "pdf-to-excel": {
    bodyParagraphs: ["将 PDF 表格导出为可筛选的 XLSX。", P],
    howToSteps: [
      { name: "PDF", text: "含表格的文件。" },
      { name: "提取", text: "云端映射。" },
      { name: "XLSX", text: "下载。" },
    ],
    faqs: [{ question: "扫描件？", answer: "请先 OCR。" }],
  },
  "pdf-to-pptx": {
    bodyParagraphs: ["从 PDF 恢复可编辑演示文稿。", P],
    howToSteps: [
      { name: "上传", text: "选择 PDF。" },
      { name: "转换", text: "云端处理。" },
      { name: "PPTX", text: "下载。" },
    ],
    faqs: [{ question: "版式？", answer: "简单幻灯片 PDF 效果最佳。" }],
  },
  "pdf-to-epub": {
    bodyParagraphs: ["文字型 PDF 转为电子书，便于小屏阅读。", P],
    howToSteps: [
      { name: "PDF", text: "数字文本 PDF。" },
      { name: "EPUB", text: "云端生成。" },
      { name: "阅读", text: "导入阅读器。" },
    ],
    faqs: [{ question: "扫描 PDF？", answer: "请先 OCR。" }],
  },
  "tools/ai-scanner": {
    bodyParagraphs: ["OpenCV.js 透视校正与增强，不上传生成式 AI API。", P],
    howToSteps: [
      { name: "照片", text: "上传。" },
      { name: "选项", text: "透视/增强。" },
      { name: "导出", text: "PNG 或 PDF。" },
    ],
    faqs: [{ question: "识别手写？", answer: "仅图像清理，不做 OCR。" }],
  },
};
