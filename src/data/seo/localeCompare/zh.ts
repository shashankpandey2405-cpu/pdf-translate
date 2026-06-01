import type { CompareCompetitor } from "@/data/seo/comparePages";
import type { CompareHubCopy } from "@/lib/seo/localizedCompareSeo";

const SAFE =
  "PDFTrusted 主要在浏览器中运行。隐私优先模式将文件保留在内存中；可选暂存会在 24 小时内自动删除。";

export const ZH_COMPARE: {
  hub: Partial<CompareHubCopy>;
  competitors: Record<string, Partial<CompareCompetitor>>;
} = {
  hub: {
    metaTitle: "PDFTrusted 对比其他 PDF 工具 — 客观评测",
    metaDescription:
      "对比 PDFTrusted 与 iLovePDF、Smallpdf、Adobe Acrobat。免费、免注册、浏览器优先与 TrustShield 隐私。",
    keywords: "pdftrusted对比, ilovepdf替代, smallpdf替代, adobe acrobat替代",
    intro: [
      "选择 PDF 平台需要平衡速度、隐私与成本。PDFTrusted 为希望无需安装桌面软件或反复注册即可获得专业效果的用户而设计。",
      "通过以下指南了解合并、压缩、签署、编辑与安全方面的差异 — 然后在浏览器中免费试用。",
    ],
    faqs: [
      {
        question: "PDFTrusted 真的免费吗？",
        answer: "核心工具免费且额度宽松。隐私优先模式可在本机批量合并（例如最多 50 个 PDF）而无需云端暂存。",
      },
      {
        question: "需要注册吗？",
        answer: "合并、压缩、拆分、签署与编辑等标准流程无需账户。",
      },
      {
        question: "与 iLovePDF 或 Smallpdf 有何不同？",
        answer:
          "PDFTrusted 强调浏览器优先处理、TrustShield 内存隐私、Hard Lock 不可变导出，以及不断完善的编辑器 — 无需为日常任务购买桌面套件。",
      },
    ],
  },
  competitors: {
    ilovepdf: {
      name: "iLovePDF",
      tagline: "熟悉的在线 PDF 流程 — 与 PDFTrusted 并排对比。",
      metaTitle: "PDFTrusted 对比 iLovePDF — 免费免注册 | 更安全替代",
      metaDescription:
        "对比合并、压缩、签署与隐私。了解团队为何转向 TrustShield 内存处理与 Hard Lock。",
      keywords: "pdftrusted对比ilovepdf, ilovepdf替代, 安全pdf工具",
      intro: [
        "iLovePDF 让在线 PDF 任务变得普及。PDFTrusted 覆盖相同场景，并强化隐私与面向进阶用户的编辑能力。",
        "若不愿将敏感合同上传到第三方队列，PDFTrusted 隐私优先模式可在浏览器内存中处理。Hard Lock 提供 iLovePDF 未重点宣传的不可变导出。",
        SAFE,
      ],
      rows: [
        { feature: "基础工具需账户", pdftrusted: "不需要", competitor: "常可选；高级功能推动登录" },
        { feature: "隐私优先（仅内存）", pdftrusted: "内置默认开关", competitor: "以上传为中心" },
        { feature: "PDF 编辑 + 签名", pdftrusted: "Fabric 编辑器 + Sign PDF", competitor: "编辑有限；产品分散" },
        { feature: "Hard Lock 不可变导出", pdftrusted: "支持 — 图像层扁平化", competitor: "非核心功能" },
        { feature: "文档健康预检", pdftrusted: "主要工具含 TrustShield", competitor: "因工具而异" },
        { feature: "OCR / 涂黑 / 修复", pdftrusted: "浏览器超强工具", competitor: "有；常走服务器" },
      ],
      advantages: [
        { title: "默认 TrustShield 隐私", body: "开启隐私优先可跳过云端暂存，设备内存允许时可本地合并多达 50 个 PDF。" },
        { title: "编辑与签署同一品牌", body: "注释、涂白、改字、高分辨率签名 — 下载前可选 Hard Lock。" },
        { title: "限制透明", body: "清晰的文件大小门槛与诚实的“即将推出”标注。" },
      ],
      faqs: [
        {
          question: "能否替代 iLovePDF 做日常办公？",
          answer: "合并、压缩、拆分、水印、解锁、签署与编辑可以。企业制版、DRM 与复杂 Acrobat 插件仍建议专用套件。",
        },
        {
          question: "先试哪个工具？",
          answer: "从合并 PDF 或 PDF 编辑器开始 — 一次会话即可体验速度与隐私。",
        },
      ],
    },
    smallpdf: {
      name: "Smallpdf",
      tagline: "轻量在线套件 vs PDFTrusted — 隐私、编辑深度与定价理念。",
      metaTitle: "PDFTrusted 对比 Smallpdf — 免费免注册 | 安全替代",
      metaDescription: "对比合并、压缩、电子签与隐私。TrustShield 与 Hard Lock 免费核心工具。",
      keywords: "pdftrusted对比smallpdf, smallpdf替代, 在线pdf编辑器",
      intro: [
        "Smallpdf 以简洁品牌著称。PDFTrusted 在同一领域竞争，并投入编辑器级功能与明确的隐私控制。",
        "处理 NDA、医疗或金融 PDF 的团队常需要纯内存路径 — PDFTrusted 公开说明该路径，而非默认全部上传。",
        SAFE,
      ],
      rows: [
        { feature: "免费功能广度", pdftrusted: "核心工具无付费墙套路", competitor: "免费试用；重度使用需 Pro" },
        { feature: "客户端合并/压缩", pdftrusted: "浏览器 Private Engine", competitor: "混合云端" },
        { feature: "PDF 内改字", pdftrusted: "Core 文本编辑 + 导出", competitor: "有限；常需转出" },
        { feature: "文档问答", pdftrusted: "规划中 — 浏览器优先", competitor: "Pro AI 附加" },
        { feature: "AES 保护 PDF", pdftrusted: "客户端 .pdftrusted 包", competitor: "密码工具不一" },
        { feature: "对比透明度", pdftrusted: "公开对比页（本中心）", competitor: "营销导向" },
      ],
      advantages: [
        { title: "无意外原样返回", body: "注册表工具返回真实输出或明确错误。" },
        { title: "向 Acrobat 级编辑器演进", body: "笔、涂白、签名、页面操作与文本编辑同一工作区。" },
        { title: "SEO 知识库", body: "主要工具含长文指南与 FAQ 结构化数据。" },
      ],
      faqs: [
        {
          question: "比 Smallpdf 更快吗？",
          answer: "中小型文件本地处理通常更快。超大文件在关闭隐私模式时可能类似其他混合方案。",
        },
        { question: "手机可用吗？", answer: "现代移动浏览器可合并、压缩与查看；重度编辑建议平板或桌面。" },
      ],
    },
    "adobe-acrobat": {
      name: "Adobe Acrobat",
      tagline: "桌面 PDF 标准 vs PDFTrusted — 速度、成本与安全场景。",
      metaTitle: "PDFTrusted 对比 Adobe Acrobat — 免费浏览器替代",
      metaDescription:
        "对比合并、签署、编辑与安全。免费浏览器工具 vs 桌面订阅 — 客观功能矩阵。",
      keywords: "adobe acrobat免费替代, pdftrusted对比acrobat, 在线pdf编辑",
      intro: [
        "Adobe Acrobat 仍是企业制版、无障碍审计与复杂表单的行业参考。PDFTrusted 不复制每个 Acrobat 面板，而是为 90% 办公任务提供快速免费浏览器流程。",
        "几分钟内完成合并/压缩/签署/编辑而无需安装 Creative Cloud；复杂印刷与旧插件仍用 Acrobat。",
        SAFE,
      ],
      rows: [
        { feature: "需安装", pdftrusted: "否 — 网页 + PWA", competitor: "桌面/移动应用" },
        { feature: "订阅", pdftrusted: "核心免费；可选高级", competitor: "Acrobat Pro 订阅" },
        { feature: "签署 + 扁平化", pdftrusted: "Sign PDF + Hard Lock", competitor: "Acrobat Sign 生态" },
        { feature: "印前检查", pdftrusted: "TrustShield 健康扫描", competitor: "行业领先预检" },
        { feature: "表单设计", pdftrusted: "基础/规划中", competitor: "高级 AcroForm" },
        { feature: "批量 OCR", pdftrusted: "浏览器 Tesseract", competitor: "强大 OCR 与语言包" },
      ],
      advantages: [
        { title: "访客即时使用", body: "分享链接 — 协作者无需 Acrobat 许可证即可合并或签署。" },
        { title: "Hard Lock 不可变", body: "栅格化终稿，任何阅读器都无法再改文字与签名。" },
        { title: "降低团队 TCO", body: "偶尔只需合并或压缩的员工可减少按席位 Acrobat 成本。" },
      ],
      faqs: [
        { question: "能打开所有 Acrobat 文件吗？", answer: "标准 PDF 可以。特殊插件组合或重度 XFA 表单可能仍需 Acrobat。" },
        { question: "电子签具有法律效力吗？", answer: "您控制导出 PDF；合规流程请咨询当地电子签名法规。" },
      ],
    },
  },
};
