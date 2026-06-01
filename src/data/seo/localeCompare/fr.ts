import type { CompareCompetitor } from "@/data/seo/comparePages";
import type { CompareHubCopy } from "@/lib/seo/localizedCompareSeo";

const SAFE =
  "PDFTrusted s'exécute surtout dans le navigateur. Le mode Confidentialité garde les fichiers en RAM ; le staging expire sous 24 h.";

export const FR_COMPARE: {
  hub: Partial<CompareHubCopy>;
  competitors: Record<string, Partial<CompareCompetitor>>;
} = {
  hub: {
    metaTitle: "PDFTrusted vs autres outils PDF — Comparaisons honnêtes",
    metaDescription:
      "Comparez PDFTrusted avec iLovePDF, Smallpdf et Adobe Acrobat. Gratuit, sans inscription, navigateur d'abord, TrustShield.",
    keywords: "pdftrusted vs ilovepdf, alternative smallpdf, alternative acrobat",
    intro: [
      "Choisir une plateforme PDF, c'est équilibrer vitesse, confidentialité et coût. PDFTrusted vise des résultats pro sans logiciel desktop ni compte obligatoire.",
      "Consultez ces guides sur fusion, compression, signature, édition et sécurité — puis essayez gratuitement dans le navigateur.",
    ],
    faqs: [
      { question: "PDFTrusted est-il gratuit ?", answer: "Les outils de base sont gratuits. Le mode Confidentialité permet de gros lots locaux sans cloud." },
      { question: "Faut-il un compte ?", answer: "Non pour fusion, compression, découpage, signature et édition standard." },
      {
        question: "Différence avec iLovePDF ou Smallpdf ?",
        answer: "PDFTrusted met l'accent sur le navigateur, TrustShield RAM, Hard Lock et un éditeur en progression — sans suite payante pour l'essentiel.",
      },
    ],
  },
  competitors: {
    ilovepdf: {
      tagline: "Workflow PDF familier — face à face avec PDFTrusted.",
      metaTitle: "PDFTrusted vs iLovePDF — Gratuit, sans inscription",
      metaDescription: "Fusion, compression, signature et confidentialité : TrustShield et Hard Lock.",
      keywords: "pdftrusted vs ilovepdf, alternative ilovepdf",
      intro: [
        "iLovePDF a popularisé les tâches PDF en ligne. PDFTrusted couvre les mêmes besoins avec une meilleure histoire confidentialité.",
        "Pour les contrats sensibles, le mode Confidentialité évite les files d'upload. Hard Lock ajoute des exports immuables.",
        SAFE,
      ],
      rows: [
        { feature: "Compte pour outils de base", pdftrusted: "Non requis", competitor: "Souvent optionnel" },
        { feature: "Confidentialité RAM", pdftrusted: "Interrupteur intégré", competitor: "Modèle upload" },
        { feature: "Éditeur + signatures", pdftrusted: "Éditeur Fabric + Sign PDF", competitor: "Édition limitée" },
        { feature: "Hard Lock", pdftrusted: "Oui — aplatissement image", competitor: "Pas central" },
        { feature: "Audit santé document", pdftrusted: "TrustShield", competitor: "Variable" },
        { feature: "OCR / caviardage / réparation", pdftrusted: "Ultra-outils navigateur", competitor: "Souvent serveur" },
      ],
      advantages: [
        { title: "Confidentialité par défaut", body: "Sans staging cloud ; fusionnez jusqu'à 50 PDF localement." },
        { title: "Édition + signature", body: "Annoter, corriger, signer, puis Hard Lock." },
        { title: "Limites transparentes", body: "Seuils de taille et messages honnêtes." },
      ],
      faqs: [
        { question: "Remplacer iLovePDF au bureau ?", answer: "Oui pour fusion, compression, découpage, filigrane, déverrouillage, signature, édition." },
        { question: "Par où commencer ?", answer: "Fusion PDF ou Éditeur PDF." },
      ],
    },
    smallpdf: {
      tagline: "Suite légère vs PDFTrusted — confidentialité et profondeur d'édition.",
      metaTitle: "PDFTrusted vs Smallpdf — Gratuit et sécurisé",
      metaDescription: "Fusion, compression, e-sign et TrustShield comparés.",
      keywords: "pdftrusted vs smallpdf, alternative smallpdf",
      intro: [
        "Smallpdf est une marque soignée. PDFTrusted rivalise avec contrôles de confidentialité explicites et un éditeur riche.",
        "NDA, formulaires médicaux ou financiers : un chemin RAM-only documenté.",
        SAFE,
      ],
      rows: [
        { feature: "Gratuité", pdftrusted: "Cœur sans piège payant", competitor: "Essais ; Pro usage lourd" },
        { feature: "Fusion/compression locale", pdftrusted: "Moteur privé navigateur", competitor: "Hybride cloud" },
        { feature: "Édition texte", pdftrusted: "Édition Core + export", competitor: "Limitée" },
        { feature: "Q&R document", pdftrusted: "Prévu navigateur", competitor: "Add-ons IA Pro" },
        { feature: "Protect PDF AES", pdftrusted: "Paquet .pdftrusted client", competitor: "Variable" },
        { feature: "Transparence", pdftrusted: "Pages compare publiques", competitor: "Marketing" },
      ],
      advantages: [
        { title: "Pas de faux fichiers", body: "Sorties réelles ou erreurs claires." },
        { title: "Éditeur ambitieux", body: "Stylo, correcteur, signatures, pages." },
        { title: "Hubs SEO", body: "Guides longs et FAQ schema." },
      ],
      faqs: [
        { question: "Plus rapide que Smallpdf ?", answer: "Souvent en local pour PDF petits/moyens." },
        { question: "Mobile ?", answer: "Oui pour fusion/compression ; édition lourde sur desktop." },
      ],
    },
    "adobe-acrobat": {
      tagline: "Standard desktop vs PDFTrusted — vitesse, coût, sécurité.",
      metaTitle: "PDFTrusted vs Adobe Acrobat — Alternative navigateur gratuite",
      metaDescription: "Fusion, signature, édition : gratuit en ligne vs abonnement Acrobat.",
      keywords: "alternative acrobat gratuite, pdftrusted vs acrobat",
      intro: [
        "Acrobat reste la référence entreprise pour prépresse et formulaires complexes. PDFTrusted couvre 90 % des tâches bureau en minutes.",
        "PDFTrusted sans Creative Cloud ; gardez Acrobat pour pipelines régulés.",
        SAFE,
      ],
      rows: [
        { feature: "Installation", pdftrusted: "Non — web + PWA", competitor: "Apps desktop/mobile" },
        { feature: "Abonnement", pdftrusted: "Cœur gratuit", competitor: "Acrobat Pro" },
        { feature: "Signer + aplatir", pdftrusted: "Sign PDF + Hard Lock", competitor: "Écosystème Sign" },
        { feature: "Impression/preflight", pdftrusted: "Scan TrustShield", competitor: "Preflight leader" },
        { feature: "Formulaires", pdftrusted: "Basique / à venir", competitor: "AcroForm avancé" },
        { feature: "OCR batch", pdftrusted: "Tesseract navigateur", competitor: "OCR robuste" },
      ],
      advantages: [
        { title: "Accès invités", body: "Un lien — pas de licences Acrobat." },
        { title: "Immuabilité Hard Lock", body: "Texte et signatures figés." },
        { title: "TCO réduit", body: "Moins de sièges pour tâches occasionnelles." },
      ],
      faqs: [
        { question: "Tous les fichiers Acrobat ?", answer: "PDF standard oui ; XFA lourds peut nécessiter Acrobat." },
        { question: "Signature légale ?", answer: "Consultez la réglementation e-signature locale." },
      ],
    },
  },
};
