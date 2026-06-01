import type { ToolRichSeo } from "@/data/seo/toolSeoBundles";

const PRIVACY_ES =
  "Muchas herramientas se ejecutan en tu navegador; los archivos en la nube se eliminan automáticamente según nuestra política.";

/** Spanish SEO overrides — top tools. */
export const ES_TOOL_SEO: Record<string, Partial<ToolRichSeo>> = {
  "merge-pdf": {
    title: "Unir PDF online — Combinar archivos | PDFTrusted",
    description:
      "Combina varios PDF y fotos en un solo archivo. Reordena con miniaturas y descarga al instante en el navegador.",
    keywords: "unir pdf, combinar pdf, merge pdf gratis, juntar pdf online, fusionar pdf",
    bodyParagraphs: [
      "Combina PDF e imágenes (PNG, JPG, WebP, HEIC) en un documento. Arrastra miniaturas para ordenar y descarga un solo PDF.",
      PRIVACY_ES,
    ],
    howToSteps: [
      { name: "Subir", text: "Suelta dos o más PDF o fotos." },
      { name: "Ordenar", text: "Arrastra miniaturas para definir el orden." },
      { name: "Unir", text: "Ejecuta unir y descarga tu PDF." },
    ],
    faqs: [
      { question: "¿Es seguro unir PDF?", answer: PRIVACY_ES },
      { question: "¿Cuántos archivos?", answer: "Varios en la sesión gratuita; lotes grandes dependen del dispositivo." },
      { question: "¿Fotos también?", answer: "Sí — las imágenes se convierten en páginas PDF en el orden elegido." },
      { question: "¿Sin cuenta?", answer: "No hace falta registrarse para unir en modo básico." },
    ],
  },
  "compress-pdf": {
    title: "Comprimir PDF online — Reducir tamaño | PDFTrusted",
    description: "Reduce el tamaño del PDF para email y compartir. Presets inteligentes en el navegador.",
    keywords: "comprimir pdf, reducir tamaño pdf, compress pdf gratis, optimizar pdf",
    bodyParagraphs: [
      "Reduce el peso del PDF sin instalar software de escritorio. Elige nivel y compara antes de descargar.",
      PRIVACY_ES,
    ],
    howToSteps: [
      { name: "Subir", text: "Elige un PDF." },
      { name: "Nivel", text: "Selecciona compresión recomendada o fuerte." },
      { name: "Descargar", text: "Guarda el PDF más ligero." },
    ],
    faqs: [
      { question: "¿Se pierde calidad?", answer: "PDF digitales suelen mantener texto legible; escaneos pueden mostrar más artefactos." },
      { question: "¿PDF con contraseña?", answer: "Desbloquéala primero con nuestra herramienta unlock." },
    ],
  },
  "pdf-to-word": {
    title: "PDF a Word — Convertir a DOCX | PDFTrusted",
    description: "Convierte PDF a Word editable. OCR en Trusted Pro para escaneos.",
    keywords: "pdf a word, convertir pdf docx, pdf word online gratis, ocr pdf word",
    bodyParagraphs: [
      "Extrae texto y diseño a DOCX. PDF simples en el navegador; escaneos con OCR en la nube dan mejor resultado.",
      PRIVACY_ES,
    ],
    howToSteps: [
      { name: "Subir", text: "Sube tu PDF." },
      { name: "Modo", text: "Elige Standard o Trusted Pro (OCR)." },
      { name: "Descargar", text: "Guarda el DOCX." },
    ],
    faqs: [
      { question: "¿PDF escaneado?", answer: "Trusted Pro OCR mejora texto buscable y diseño en Word." },
      { question: "¿Se conserva el formato?", answer: "Depende de la complejidad; documentos simples salen mejor." },
    ],
  },
  "word-to-pdf": {
    title: "Word a PDF — Convertir DOCX | PDFTrusted",
    description: "Convierte Word a PDF de alta fidelidad. Conversión en la nube con layout preservado.",
    keywords: "word a pdf, docx a pdf, convertir word pdf online",
    bodyParagraphs: [
      "Transforma DOCX/DOC en PDF listos para imprimir. Fuentes y espaciado vía motor cloud.",
      PRIVACY_ES,
    ],
    howToSteps: [
      { name: "Subir", text: "Selecciona Word." },
      { name: "Convertir", text: "Espera el procesamiento." },
      { name: "Descargar", text: "Guarda el PDF." },
    ],
    faqs: [
      { question: "¿Qué formatos?", answer: "DOCX y DOC (limitado)." },
      { question: "¿Requiere cuenta?", answer: "La conversión cloud puede pedir inicio de sesión." },
    ],
  },
  "pdf-editor": {
    title: "Editor PDF online — Anotar y editar | PDFTrusted",
    description: "Anota, firma, reordena páginas y exporta PDF en el navegador.",
    keywords: "editor pdf online, editar pdf gratis, anotar pdf, pdf editor español",
    bodyParagraphs: [
      "Añade texto, resaltado, trazos, imágenes y firmas. Reordena páginas y descarga el PDF actualizado.",
      PRIVACY_ES,
    ],
    howToSteps: [
      { name: "Abrir", text: "Sube el PDF." },
      { name: "Editar", text: "Usa herramientas de anotación." },
      { name: "Guardar", text: "Descarga el PDF editado." },
    ],
    faqs: [
      { question: "¿En móvil?", answer: "Navegadores modernos permiten edición básica." },
      { question: "¿Es gratis?", answer: "Edición core gratis; trabajos cloud pesados tienen límites." },
    ],
  },
  "sign-pdf": {
    title: "Firmar PDF online — Firma electrónica | PDFTrusted",
    description: "Firma PDF dibujando o escribiendo. Proceso privado en el navegador.",
    keywords: "firmar pdf, firma electronica pdf, sign pdf español, firmar documento online",
    bodyParagraphs: [
      "Crea firma con pad o texto y colócala en el PDF. Arrastra para posicionar y descarga.",
      PRIVACY_ES,
    ],
    howToSteps: [
      { name: "Subir", text: "Carga el PDF." },
      { name: "Firmar", text: "Crea y coloca la firma." },
      { name: "Descargar", text: "Guarda el PDF firmado." },
    ],
    faqs: [
      { question: "¿Validez legal?", answer: "Depende del uso y la jurisdicción; consulta normas locales." },
      { question: "¿Imagen de firma?", answer: "Sí — sube PNG/JPG." },
    ],
  },
  "ocr-pdf": {
    title: "OCR PDF — Texto en escaneos | PDFTrusted",
    description: "Haz buscables tus PDF escaneados. OCR seguro en la nube.",
    keywords: "ocr pdf, pdf escaneado texto, reconocimiento texto pdf",
    bodyParagraphs: [
      "Extrae texto de escaneos para buscar y copiar. OCR en la nube ofrece mayor precisión.",
      PRIVACY_ES,
    ],
    howToSteps: [
      { name: "Subir", text: "Sube PDF escaneado." },
      { name: "OCR", text: "Inicia procesamiento cloud." },
      { name: "Descargar", text: "Obtén PDF buscable." },
    ],
    faqs: [
      { question: "¿Idiomas?", answer: "Varios idiomas; la calidad del escaneo importa." },
      { question: "¿OCR en navegador?", answer: "Esta herramienta usa OCR en la nube." },
    ],
  },
  "split-pdf": {
    title: "Dividir PDF — Extraer páginas | PDFTrusted",
    description: "Extrae páginas seleccionadas a un nuevo PDF. Miniaturas para elegir fácil.",
    keywords: "dividir pdf, extraer paginas pdf, split pdf gratis, separar pdf",
    bodyParagraphs: [
      "Separa solo las páginas que necesitas de un PDF grande.",
      PRIVACY_ES,
    ],
    howToSteps: [
      { name: "Subir", text: "Carga el PDF." },
      { name: "Elegir", text: "Marca páginas en miniaturas." },
      { name: "Dividir", text: "Descarga el nuevo PDF." },
    ],
    faqs: [
      { question: "¿Páginas no seguidas?", answer: "Sí — cualquier combinación." },
      { question: "¿Privacidad?", answer: PRIVACY_ES },
    ],
  },
  "protect-pdf": {
    title: "Proteger PDF — Contraseña | PDFTrusted",
    description: "Añade contraseña a tu PDF. Cifrado en el navegador.",
    keywords: "proteger pdf, contraseña pdf, encrypt pdf online",
    bodyParagraphs: [
      "Protege PDF sensibles con contraseña fuerte.",
      PRIVACY_ES,
    ],
    howToSteps: [
      { name: "Subir", text: "Elige PDF." },
      { name: "Contraseña", text: "Define contraseña segura." },
      { name: "Descargar", text: "Guarda PDF protegido." },
    ],
    faqs: [
      { question: "¿Olvidé la clave?", answer: "Tras cifrar no hay recuperación — guarda la contraseña." },
    ],
  },
  "unlock-pdf": {
    title: "Desbloquear PDF — Quitar contraseña | PDFTrusted",
    description: "Elimina restricciones cuando tengas derecho legal a hacerlo.",
    keywords: "desbloquear pdf, quitar contraseña pdf, unlock pdf online",
    bodyParagraphs: [
      "Quita contraseña o restricciones si eres titular del documento.",
      PRIVACY_ES,
    ],
    howToSteps: [
      { name: "Subir", text: "Sube PDF bloqueado." },
      { name: "Desbloquear", text: "Introduce la contraseña." },
      { name: "Descargar", text: "Descarga PDF libre." },
    ],
    faqs: [
      { question: "¿Siempre funciona?", answer: "Cifrado fuerte puede fallar." },
    ],
  },
};
