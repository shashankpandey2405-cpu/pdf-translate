import type { CompareCompetitor } from "@/data/seo/comparePages";
import type { CompareHubCopy } from "@/lib/seo/localizedCompareSeo";

const SAFE =
  "PDFTrusted läuft größtenteils im Browser. Privacy-First hält Dateien im RAM; Staging läuft innerhalb von 24 Stunden ab.";

export const DE_COMPARE: {
  hub: Partial<CompareHubCopy>;
  competitors: Record<string, Partial<CompareCompetitor>>;
} = {
  hub: {
    metaTitle: "PDFTrusted vs andere PDF-Tools — Ehrliche Vergleiche",
    metaDescription:
      "Vergleichen Sie PDFTrusted mit iLovePDF, Smallpdf und Adobe Acrobat. Kostenlos, ohne Anmeldung, Browser-first, TrustShield.",
    keywords: "pdftrusted vs ilovepdf, smallpdf alternative, acrobat alternative",
    intro: [
      "Die Wahl einer PDF-Plattform balanciert Geschwindigkeit, Datenschutz und Kosten. PDFTrusted liefert Profi-Ergebnisse ohne Desktop-Installation oder Pflichtkonto.",
      "Lesen Sie diese Guides zu Merge, Komprimieren, Signieren, Bearbeiten und Sicherheit — dann kostenlos im Browser testen.",
    ],
    faqs: [
      { question: "Ist PDFTrusted wirklich kostenlos?", answer: "Kern-Tools sind gratis. Privacy-First erlaubt große lokale Stapel ohne Cloud." },
      { question: "Anmeldung nötig?", answer: "Nein für Standard-Merge, Komprimieren, Teilen, Signieren und Bearbeiten." },
      {
        question: "Unterschied zu iLovePDF oder Smallpdf?",
        answer: "PDFTrusted betont Browser-Verarbeitung, TrustShield RAM, Hard Lock und einen wachsenden Editor — ohne Desktop-Abo für Basics.",
      },
    ],
  },
  competitors: {
    ilovepdf: {
      tagline: "Bekannter Online-Workflow — im Vergleich mit PDFTrusted.",
      metaTitle: "PDFTrusted vs iLovePDF — Kostenlos, ohne Anmeldung",
      metaDescription: "Merge, Komprimieren, Signieren und Datenschutz: TrustShield und Hard Lock.",
      keywords: "pdftrusted vs ilovepdf, ilovepdf alternative",
      intro: [
        "iLovePDF hat schnelle Online-PDF-Aufgaben populär gemacht. PDFTrusted deckt dieselben Jobs mit stärkerer Privatsphäre ab.",
        "Für sensible Verträge: Privacy-First ohne Upload-Warteschlange. Hard Lock für unveränderliche Exporte.",
        SAFE,
      ],
      rows: [
        { feature: "Konto für Basis-Tools", pdftrusted: "Nicht nötig", competitor: "Oft optional" },
        { feature: "Privacy-First (nur RAM)", pdftrusted: "Eingebauter Schalter", competitor: "Upload-zentriert" },
        { feature: "PDF-Editor + Signaturen", pdftrusted: "Fabric-Editor + Sign PDF", competitor: "Begrenzte Bearbeitung" },
        { feature: "Hard Lock Export", pdftrusted: "Ja — Bild-Flatten", competitor: "Kein Kernfeature" },
        { feature: "Dokument-Gesundheit", pdftrusted: "TrustShield", competitor: "Je nach Tool" },
        { feature: "OCR / Schwärzen / Reparatur", pdftrusted: "Browser-Ultra-Tools", competitor: "Oft serverseitig" },
      ],
      advantages: [
        { title: "TrustShield standardmäßig", body: "Ohne Cloud-Staging; bis 50 PDFs lokal mergen." },
        { title: "Editor + Signatur", body: "Kommentieren, signieren, optional Hard Lock." },
        { title: "Transparente Limits", body: "Klare Größengrenzen und ehrliche Labels." },
      ],
      faqs: [
        { question: "iLovePDF im Büro ersetzen?", answer: "Ja für Merge, Komprimieren, Teilen, Wasserzeichen, Entsperren, Signieren, Bearbeiten." },
        { question: "Womit starten?", answer: "Merge PDF oder PDF-Editor." },
      ],
    },
    smallpdf: {
      tagline: "Leichte Suite vs PDFTrusted — Privatsphäre und Editor-Tiefe.",
      metaTitle: "PDFTrusted vs Smallpdf — Kostenlos & sicher",
      metaDescription: "Merge, Komprimieren, E-Sign und TrustShield im Vergleich.",
      keywords: "pdftrusted vs smallpdf, smallpdf alternative",
      intro: [
        "Smallpdf ist eine polierte Marke. PDFTrusted konkurriert mit expliziten Privacy-Controls und Editor-Features.",
        "NDAs und Finanz-PDFs brauchen oft RAM-only — PDFTrusted dokumentiert diesen Pfad.",
        SAFE,
      ],
      rows: [
        { feature: "Gratis-Umfang", pdftrusted: "Kern ohne Paywall-Tricks", competitor: "Trials; Pro bei Heavy Use" },
        { feature: "Client-Merge/Kompress", pdftrusted: "Private Engine im Browser", competitor: "Hybrid-Cloud" },
        { feature: "Text in PDF bearbeiten", pdftrusted: "Core-Textedit + Export", competitor: "Begrenzt" },
        { feature: "Dokument-Q&A", pdftrusted: "Geplant — browser-first", competitor: "Pro-KI-Add-ons" },
        { feature: "AES Protect PDF", pdftrusted: "Client-.pdftrusted-Paket", competitor: "Variabel" },
        { feature: "Transparenz", pdftrusted: "Öffentliche Compare-Seiten", competitor: "Marketing" },
      ],
      advantages: [
        { title: "Keine Fake-Dateien", body: "Echte Ausgaben oder klare Fehler." },
        { title: "Editor-Roadmap", body: "Stift, Korrektor, Signaturen, Seiten." },
        { title: "SEO Knowledge Hubs", body: "Lange Guides und FAQ-Schema." },
      ],
      faqs: [
        { question: "Schneller als Smallpdf?", answer: "Oft lokal für kleine/mittlere PDFs." },
        { question: "Mobil?", answer: "Ja für Merge/Komprimieren; schwere Edits am Desktop." },
      ],
    },
    "adobe-acrobat": {
      tagline: "Desktop-Standard vs PDFTrusted — Geschwindigkeit, Kosten, Sicherheit.",
      metaTitle: "PDFTrusted vs Adobe Acrobat — Kostenlose Browser-Alternative",
      metaDescription: "Merge, Signieren, Bearbeiten: gratis online vs Acrobat-Abo.",
      keywords: "acrobat alternative kostenlos, pdftrusted vs acrobat",
      intro: [
        "Acrobat bleibt Enterprise-Referenz für Druck und komplexe Formulare. PDFTrusted liefert schnelle Browser-Workflows für 90 % der Büroaufgaben.",
        "Nutzen Sie PDFTrusted für Minuten-Jobs ohne Creative Cloud; Acrobat für regulierte Pipelines.",
        SAFE,
      ],
      rows: [
        { feature: "Installation", pdftrusted: "Nein — Web + PWA", competitor: "Desktop/Mobile-Apps" },
        { feature: "Abo", pdftrusted: "Kern gratis", competitor: "Acrobat Pro" },
        { feature: "Signieren + Flatten", pdftrusted: "Sign PDF + Hard Lock", competitor: "Acrobat Sign" },
        { feature: "Druck/Preflight", pdftrusted: "TrustShield-Scan", competitor: "Branchenführer" },
        { feature: "Formulare", pdftrusted: "Basis / demnächst", competitor: "AcroForm-Designer" },
        { feature: "Batch-OCR", pdftrusted: "Browser-Tesseract", competitor: "Starkes OCR" },
      ],
      advantages: [
        { title: "Sofort für Gäste", body: "Link teilen — keine Acrobat-Lizenzen." },
        { title: "Hard Lock", body: "Finale PDFs nicht mehr editierbar." },
        { title: "Geringere TCO", body: "Weniger Sitze für Gelegenheitsnutzer." },
      ],
      faqs: [
        { question: "Alle Acrobat-Dateien?", answer: "Standard-PDF ja; schwere XFA evtl. Acrobat." },
        { question: "Rechtlich bindende E-Signatur?", answer: "Prüfen Sie lokale E-Signatur-Regeln." },
      ],
    },
  },
};
