import type { ToolRichSeo } from "@/data/seo/toolSeoBundles";

const P =
  "Die meisten Tools laufen im Browser; Cloud-Dateien werden gemäß Richtlinie automatisch gelöscht.";

/** Phase 3 — German knowledge hub body, steps, FAQs. */
export const DE_TOOL_SEO_PHASE3: Record<string, Partial<ToolRichSeo>> = {
  "merge-pdf": {
    bodyParagraphs: [
      "Mehrere PDFs und Bilder (PNG, JPG, WebP, HEIC) zu einer Datei zusammenführen. Per Miniatur sortieren und herunterladen.",
      P,
    ],
    howToSteps: [
      { name: "Hochladen", text: "Zwei oder mehr PDFs oder Fotos ablegen." },
      { name: "Reihenfolge", text: "Miniaturen ziehen." },
      { name: "Zusammenführen", text: "PDF herunterladen." },
    ],
    faqs: [
      { question: "Ist das sicher?", answer: P },
      { question: "Wie viele Dateien?", answer: "Mehrere im Gratis-Tier; große Stapel je nach RAM." },
      { question: "Fotos auch?", answer: "Ja — werden als PDF-Seiten in Ihrer Reihenfolge eingefügt." },
    ],
  },
  "compress-pdf": {
    bodyParagraphs: ["PDF-Größe für E-Mail und Teilen mit klaren Stufen reduzieren.", P],
    howToSteps: [
      { name: "Hochladen", text: "PDF wählen." },
      { name: "Stufe", text: "Empfohlen oder stark." },
      { name: "Download", text: "Kleinere PDF speichern." },
    ],
    faqs: [
      { question: "Qualitätsverlust?", answer: "Digitale PDFs meist lesbar; Scans bei stark mehr Artefakte." },
      { question: "Passwort-PDF?", answer: "Zuerst Entsperren-Tool." },
    ],
  },
  "pdf-to-word": {
    bodyParagraphs: ["PDF mit wählbarem Text in bearbeitbare Ausgabe; Scans brauchen OCR.", P],
    howToSteps: [
      { name: "Hochladen", text: "Text-PDF." },
      { name: "Konvertieren", text: "Lokal oder Cloud." },
      { name: "Download", text: "In Word öffnen." },
    ],
    faqs: [
      { question: "Gleiches Layout?", answer: "Komplexe Layouts können abweichen." },
      { question: "Scan?", answer: "OCR PDF nutzen." },
    ],
  },
  "word-to-pdf": {
    bodyParagraphs: ["Word als teilbares PDF, Tabellen und Bilder möglichst erhalten.", P],
    howToSteps: [
      { name: "Hochladen", text: ".docx." },
      { name: "Konvertieren", text: "Premium-Cloud-Rendering." },
      { name: "Download", text: "PDF speichern." },
    ],
    faqs: [{ question: "Konto nötig?", answer: "Cloud-Konvertierung mit Anmeldung; keine Langzeitspeicherung." }],
  },
  "pdf-editor": {
    bodyParagraphs: ["Kommentieren, markieren, signieren, Seiten sortieren — Sign Pro und Hard Lock.", P],
    howToSteps: [
      { name: "Öffnen", text: "PDF in Workspace laden." },
      { name: "Bearbeiten", text: "Text, Stift, Signatur." },
      { name: "Speichern", text: "Flaches PDF exportieren." },
    ],
    faqs: [
      { question: "Vertrauliche Dateien?", answer: P },
      { question: "Mobil?", answer: "Moderne Browser; Querformat empfohlen." },
    ],
  },
  "sign-pdf": {
    bodyParagraphs: ["Zeichnen, tippen oder Signatur-Bild auf Verträge und Formulare legen.", P],
    howToSteps: [
      { name: "Hochladen", text: "PDF zum Signieren." },
      { name: "Signatur", text: "Erstellen und platzieren." },
      { name: "Download", text: "Signiertes PDF." },
    ],
    faqs: [
      { question: "Rechtsgültig?", answer: "Je nach Land — lokale E-Signatur-Regeln prüfen." },
      { question: "Privat?", answer: P },
    ],
  },
  "ocr-pdf": {
    bodyParagraphs: ["Durchsuchbare Textschicht oder TXT-Export für Scans.", P],
    howToSteps: [
      { name: "Hochladen", text: "Scan-PDF." },
      { name: "Ausgabe", text: "Durchsuchbares PDF oder TXT." },
      { name: "Download", text: "OCR-Ergebnis." },
    ],
    faqs: [{ question: "Genauigkeit?", answer: "Abhängig von Scan und Sprache." }],
  },
  "split-pdf": {
    bodyParagraphs: ["Seiten per Miniatur wählen und neues PDF exportieren.", P],
    howToSteps: [
      { name: "Hochladen", text: "PDF laden." },
      { name: "Auswahl", text: "Seiten markieren." },
      { name: "Export", text: "Geteiltes PDF laden." },
    ],
    faqs: [{ question: "Lesezeichen?", answer: "Basis-Extraktion fokussiert Seiteninhalt." }],
  },
  "protect-pdf": {
    bodyParagraphs: ["Passwort und Rechte für sensible PDFs.", P],
    howToSteps: [
      { name: "Hochladen", text: "PDF." },
      { name: "Passwort", text: "Starkes Passwort setzen." },
      { name: "Download", text: "Geschütztes PDF." },
    ],
    faqs: [{ question: "Schutz entfernen?", answer: "Mit richtigem Passwort über Entsperren." }],
  },
  "unlock-pdf": {
    bodyParagraphs: ["Beschränkungen entfernen, wenn Sie berechtigt sind und das Passwort kennen.", P],
    howToSteps: [
      { name: "Hochladen", text: "Geschütztes PDF." },
      { name: "Passwort", text: "Eingeben." },
      { name: "Entsperren", text: "Kopie ohne Limits." },
    ],
    faqs: [{ question: "Passwort vergessen?", answer: "Keine Garantie — Dateibesitzer kontaktieren." }],
  },
  "rotate-pdf": {
    bodyParagraphs: ["Kopfüber-Scans und Portrait/Landscape-Mix mit 90° korrigieren.", P],
    howToSteps: [
      { name: "Hochladen", text: "PDF." },
      { name: "Drehen", text: "Seiten wählen." },
      { name: "Speichern", text: "Korrigiertes PDF." },
    ],
    faqs: [{ question: "Privat?", answer: P }],
  },
  "watermark-pdf": {
    bodyParagraphs: ["Diagonaler Text für Entwürfe und Vorschau mit Deckkraft.", P],
    howToSteps: [
      { name: "Hochladen", text: "PDF." },
      { name: "Einstellen", text: "Text, Farbe, Opazität." },
      { name: "Export", text: "PDF mit Wasserzeichen." },
    ],
    faqs: [{ question: "Logo?", answer: "Aktuell Text; Bilder im PDF-Editor." }],
  },
  "pdf-to-image": {
    bodyParagraphs: ["Seitenweise JPG/PNG für Präsentationen und Social.", P],
    howToSteps: [
      { name: "Hochladen", text: "PDF." },
      { name: "Format", text: "JPEG oder PNG." },
      { name: "Download", text: "Bilder speichern." },
    ],
    faqs: [{ question: "Große Datei?", answer: "Zuerst teilen, wenn der Browser langsam wird." }],
  },
  "page-numbers": {
    bodyParagraphs: ["Einheitliche Seitenzahlen für Berichte und Akten.", P],
    howToSteps: [
      { name: "Hochladen", text: "PDF." },
      { name: "Konfigurieren", text: "Position und Start." },
      { name: "Anwenden", text: "Nummeriertes PDF." },
    ],
    faqs: [{ question: "Layout?", answer: "Zahlen im Rand — Druckprobe." }],
  },
  "pdf-maker": {
    bodyParagraphs: ["PDF aus Text ohne Word erstellen.", P],
    howToSteps: [
      { name: "Eingabe", text: "Einfügen oder tippen." },
      { name: "Stil", text: "Schrift und Abstand." },
      { name: "PDF", text: "Herunterladen." },
    ],
    faqs: [{ question: "Bilder?", answer: "PDF-Editor nutzen." }],
  },
  "pptx-to-pdf": {
    bodyParagraphs: ["PPTX zu PDF; Animationen werden statisch.", P],
    howToSteps: [
      { name: "Hochladen", text: ".pptx." },
      { name: "Konvertieren", text: "Cloud." },
      { name: "Download", text: "PDF." },
    ],
    faqs: [{ question: "Animationen?", answer: "Statisches Folienbild beim Export." }],
  },
  "generate-qr-code": {
    bodyParagraphs: ["QR für Menüs und Kampagnen — lokal generiert.", P],
    howToSteps: [
      { name: "Inhalt", text: "URL oder Text." },
      { name: "Größe", text: "Pixel." },
      { name: "Download", text: "PNG/SVG." },
    ],
    faqs: [{ question: "Tracking?", answer: "Kein Server beim Generieren." }],
  },
  "translate-pdf": {
    bodyParagraphs: ["Lokale Extraktion — in Ihren Übersetzer einfügen.", P],
    howToSteps: [
      { name: "Hochladen", text: "PDF mit Text." },
      { name: "Extrahieren", text: "Lokal." },
      { name: "Kopieren", text: "Zwischenablage oder RTF." },
    ],
    faqs: [{ question: "Auto-Übersetzung?", answer: "Nein — nur Extraktion." }],
  },
  "remove-watermark": {
    bodyParagraphs: ["Einfache Wasserzeichen ohne generative Cloud-KI.", P],
    howToSteps: [
      { name: "Hochladen", text: "PDF oder Bild." },
      { name: "Maske", text: "Auto oder manuell." },
      { name: "Download", text: "Ergebnis." },
    ],
    faqs: [{ question: "Legal?", answer: "Nur Dateien, die Sie ändern dürfen." }],
  },
  "hard-lock-pdf": {
    bodyParagraphs: ["Jede Seite als Bild — Text und Signaturen nicht editierbar.", P],
    howToSteps: [
      { name: "Hochladen", text: "Finale Version." },
      { name: "Sperren", text: "Hard Lock." },
      { name: "Download", text: "Unveränderliches PDF." },
    ],
    faqs: [{ question: "Rückgängig?", answer: "Nein — Original behalten." }],
  },
  "repair-pdf": {
    bodyParagraphs: ["xref-Fehler und leere Seiten reparieren.", P],
    howToSteps: [
      { name: "Hochladen", text: "Defektes PDF." },
      { name: "Reparieren", text: "Im Browser." },
      { name: "Download", text: "Reparierte Kopie." },
    ],
    faqs: [{ question: "Alles wieder?", answer: "Schwerer Schaden kann Inhalt verlieren." }],
  },
  "redact-pdf": {
    bodyParagraphs: ["E-Mail, Karte, Telefon per Muster schwärzen.", P],
    howToSteps: [
      { name: "Hochladen", text: "PDF." },
      { name: "Muster", text: "Regeln aktivieren." },
      { name: "Download", text: "Geschwärztes PDF." },
    ],
    faqs: [{ question: "Permanent?", answer: "Ja — Ausgabe prüfen." }],
  },
  "pdf-to-html": {
    bodyParagraphs: ["PDF-Text als leichte Webseite.", P],
    howToSteps: [
      { name: "Hochladen", text: "PDF." },
      { name: "Konvertieren", text: "Lokal." },
      { name: "Download", text: ".html." },
    ],
    faqs: [{ question: "Bilder?", answer: "Fokus auf Text." }],
  },
  "document-scanner": {
    bodyParagraphs: ["Foto zu sauberem PDF: Zuschnitt, Drehung, S/W-Filter.", P],
    howToSteps: [
      { name: "Foto", text: "JPG/PNG." },
      { name: "Verbessern", text: "Zuschnitt und Filter." },
      { name: "PDF", text: "Lokal exportieren." },
    ],
    faqs: [{ question: "Upload?", answer: "Nein — vollständig lokal." }],
  },
  "photo-resizer": {
    bodyParagraphs: ["Passfoto auf exakte KB für Formulare.", P],
    howToSteps: [
      { name: "Hochladen", text: "Foto." },
      { name: "KB", text: "Ziel." },
      { name: "Download", text: "Speichern." },
    ],
    faqs: [{ question: "Qualität?", answer: "Balance bis KB-Ziel." }],
  },
  "resume-builder": {
    bodyParagraphs: ["Vorlagen, Live-Vorschau, PDF; Entwurf nur auf dem Gerät.", P],
    howToSteps: [
      { name: "Vorlage", text: "Wählen." },
      { name: "Ausfüllen", text: "Abschnitte." },
      { name: "PDF", text: "Download." },
    ],
    faqs: [{ question: "Server?", answer: "Nein — nur localStorage." }],
  },
  "professional-cv-maker": {
    bodyParagraphs: ["Business-CV, kostenloses PDF.", P],
    howToSteps: [
      { name: "Vorlage", text: "Corporate." },
      { name: "Inhalt", text: "Erfahrung." },
      { name: "Export", text: "PDF." },
    ],
    faqs: [{ question: "Kostenlos?", answer: "Ja." }],
  },
  "government-resume-builder": {
    bodyParagraphs: ["Formelles Layout für öffentlichen Dienst.", P],
    howToSteps: [
      { name: "Vorlage", text: "Formal." },
      { name: "Daten", text: "Alle Felder." },
      { name: "PDF", text: "Download." },
    ],
    faqs: [{ question: "Foto?", answer: "Optional." }],
  },
  "ats-friendly-resume-builder": {
    bodyParagraphs: ["Eine Spalte, klare Überschriften für ATS.", P],
    howToSteps: [
      { name: "Vorlage", text: "ATS." },
      { name: "Keywords", text: "Skills." },
      { name: "PDF", text: "Export." },
    ],
    faqs: [{ question: "Was ist ATS?", answer: "Automatische Bewerbungsfilter." }],
  },
  "universal-converter": {
    bodyParagraphs: ["PDF und Office in einem Workflow.", P],
    howToSteps: [
      { name: "Format", text: "Ein/Aus." },
      { name: "Hochladen", text: "Datei." },
      { name: "Konvertieren", text: "Download." },
    ],
    faqs: [{ question: "Datenschutz?", answer: P }],
  },
  "jpg-to-pdf": {
    bodyParagraphs: ["JPGs zu einem PDF zusammenführen.", P],
    howToSteps: [
      { name: "JPG", text: "Wählen." },
      { name: "Reihenfolge", text: "Sortieren." },
      { name: "PDF", text: "Download." },
    ],
    faqs: [{ question: "Privat?", answer: P }],
  },
  "png-to-pdf": {
    bodyParagraphs: ["PNG mit Transparenz zu klarem PDF.", P],
    howToSteps: [
      { name: "PNG", text: "Hochladen." },
      { name: "Erstellen", text: "PDF." },
      { name: "Download", text: "Speichern." },
    ],
    faqs: [{ question: "Transparenz?", answer: "Hohe Auflösung beim Rasterisieren." }],
  },
  "excel-to-pdf": {
    bodyParagraphs: ["Tabellen als festes PDF.", P],
    howToSteps: [
      { name: "Hochladen", text: "Excel." },
      { name: "Konvertieren", text: "Cloud/Browser." },
      { name: "PDF", text: "Download." },
    ],
    faqs: [{ question: "Formeln?", answer: "PDF nur Ansicht — Excel behalten." }],
  },
  "pdf-to-excel": {
    bodyParagraphs: ["PDF-Tabellen nach filterbarem XLSX.", P],
    howToSteps: [
      { name: "PDF", text: "Mit Tabellen." },
      { name: "Extrahieren", text: "Cloud." },
      { name: "XLSX", text: "Download." },
    ],
    faqs: [{ question: "Scan?", answer: "Zuerst OCR." }],
  },
  "pdf-to-pptx": {
    bodyParagraphs: ["Bearbeitbare Folien aus PDF.", P],
    howToSteps: [
      { name: "Hochladen", text: "PDF." },
      { name: "Konvertieren", text: "Cloud." },
      { name: "PPTX", text: "Download." },
    ],
    faqs: [{ question: "Design?", answer: "Einfache Slide-PDFs am besten." }],
  },
  "pdf-to-epub": {
    bodyParagraphs: ["Text-PDF als E-Book für kleine Displays.", P],
    howToSteps: [
      { name: "PDF", text: "Digitaler Text." },
      { name: "EPUB", text: "Cloud." },
      { name: "Lesen", text: "E-Reader." },
    ],
    faqs: [{ question: "Scan?", answer: "Zuerst OCR." }],
  },
  "tools/ai-scanner": {
    bodyParagraphs: ["OpenCV.js: Perspektive und Schärfe ohne KI-API.", P],
    howToSteps: [
      { name: "Foto", text: "Hochladen." },
      { name: "Optionen", text: "Perspektive/Verbesserung." },
      { name: "Export", text: "PNG/PDF." },
    ],
    faqs: [{ question: "Handschrift?", answer: "Nur Bildbereinigung." }],
  },
};
