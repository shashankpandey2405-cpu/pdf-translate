import type { ToolRichSeo } from "@/data/seo/toolSeoBundles";

const P =
  "La plupart des outils s'exécutent dans votre navigateur ; les fichiers cloud sont supprimés automatiquement selon notre politique.";

/** Phase 3 — French knowledge hub body, steps, FAQs. */
export const FR_TOOL_SEO_PHASE3: Record<string, Partial<ToolRichSeo>> = {
  "merge-pdf": {
    bodyParagraphs: [
      "Fusionnez plusieurs PDF et images (PNG, JPG, WebP, HEIC) en un seul fichier. Réordonnez par miniatures puis téléchargez.",
      P,
    ],
    howToSteps: [
      { name: "Importer", text: "Déposez deux PDF ou plus, ou des photos." },
      { name: "Ordre", text: "Glissez les miniatures." },
      { name: "Fusionner", text: "Lancez et téléchargez le PDF." },
    ],
    faqs: [
      { question: "La fusion est-elle sécurisée ?", answer: P },
      { question: "Combien de fichiers ?", answer: "Plusieurs en gratuit ; gros lots selon la RAM." },
      { question: "Photos incluses ?", answer: "Oui — converties en pages PDF dans l'ordre choisi." },
    ],
  },
  "compress-pdf": {
    bodyParagraphs: ["Réduisez la taille pour e-mail et partage avec des niveaux clairs.", P],
    howToSteps: [
      { name: "Importer", text: "Choisissez un PDF." },
      { name: "Niveau", text: "Recommandé ou fort." },
      { name: "Télécharger", text: "Enregistrez le PDF allégé." },
    ],
    faqs: [
      { question: "Perte de qualité ?", answer: "PDF numériques souvent lisibles ; scans plus d'artefacts en fort." },
      { question: "PDF protégé ?", answer: "Utilisez d'abord l'outil déverrouiller." },
    ],
  },
  "pdf-to-word": {
    bodyParagraphs: ["Convertissez un PDF à texte sélectionnable ; les scans nécessitent l'OCR.", P],
    howToSteps: [
      { name: "Importer", text: "PDF textuel." },
      { name: "Convertir", text: "Traitement local ou cloud." },
      { name: "Télécharger", text: "Ouvrez dans Word." },
    ],
    faqs: [
      { question: "Mise en page identique ?", answer: "Les mises en page complexes peuvent varier." },
      { question: "Scan ?", answer: "Utilisez OCR PDF." },
    ],
  },
  "word-to-pdf": {
    bodyParagraphs: ["Word en PDF partageable, tableaux et images préservés au mieux.", P],
    howToSteps: [
      { name: "Importer", text: "Fichier .docx." },
      { name: "Convertir", text: "Rendu cloud Premium." },
      { name: "Télécharger", text: "Enregistrez le PDF." },
    ],
    faqs: [{ question: "Compte requis ?", answer: "Conversion cloud avec connexion ; pas de stockage long." }],
  },
  "pdf-editor": {
    bodyParagraphs: ["Annoter, surligner, signer, réorganiser — Sign Pro et Hard Lock inclus.", P],
    howToSteps: [
      { name: "Ouvrir", text: "Importez le PDF." },
      { name: "Éditer", text: "Texte, stylo, signature." },
      { name: "Enregistrer", text: "Export PDF aplati." },
    ],
    faqs: [
      { question: "Fichiers confidentiels ?", answer: P },
      { question: "Mobile ?", answer: "Navigateurs récents ; paysage conseillé." },
    ],
  },
  "sign-pdf": {
    bodyParagraphs: ["Dessinez, tapez ou importez une signature sur contrats et formulaires.", P],
    howToSteps: [
      { name: "Importer", text: "PDF à signer." },
      { name: "Signer", text: "Créez et placez la signature." },
      { name: "Télécharger", text: "PDF signé." },
    ],
    faqs: [
      { question: "Valeur légale ?", answer: "Variable selon le pays — consultez la réglementation e-signature." },
      { question: "Privé ?", answer: P },
    ],
  },
  "ocr-pdf": {
    bodyParagraphs: ["Couche de texte recherchable ou export TXT pour scans.", P],
    howToSteps: [
      { name: "Importer", text: "PDF scanné." },
      { name: "Sortie", text: "PDF recherchable ou TXT." },
      { name: "Télécharger", text: "Résultat OCR." },
    ],
    faqs: [{ question: "Précision ?", answer: "Dépend de la netteté et de la langue." }],
  },
  "split-pdf": {
    bodyParagraphs: ["Sélectionnez des pages via miniatures et exportez un nouveau PDF.", P],
    howToSteps: [
      { name: "Importer", text: "Chargez le PDF." },
      { name: "Sélection", text: "Choisissez les pages." },
      { name: "Exporter", text: "Téléchargez le PDF extrait." },
    ],
    faqs: [{ question: "Signets ?", answer: "L'extraction de base cible le contenu des pages." }],
  },
  "protect-pdf": {
    bodyParagraphs: ["Mot de passe et permissions pour PDF sensibles.", P],
    howToSteps: [
      { name: "Importer", text: "PDF." },
      { name: "Mot de passe", text: "Définissez un mot de passe fort." },
      { name: "Télécharger", text: "PDF sécurisé." },
    ],
    faqs: [{ question: "Retirer la protection ?", answer: "Avec le bon mot de passe via déverrouiller." }],
  },
  "unlock-pdf": {
    bodyParagraphs: ["Retirez les restrictions si vous avez l'autorisation et le mot de passe.", P],
    howToSteps: [
      { name: "Importer", text: "PDF protégé." },
      { name: "Mot de passe", text: "Saisissez-le." },
      { name: "Déverrouiller", text: "Téléchargez la copie ouverte." },
    ],
    faqs: [{ question: "Mot de passe oublié ?", answer: "Pas de garantie — contactez le propriétaire." }],
  },
  "rotate-pdf": {
    bodyParagraphs: ["Corrigez scans inversés et mix portrait/paysage à 90°.", P],
    howToSteps: [
      { name: "Importer", text: "PDF." },
      { name: "Pivoter", text: "Pages et angle." },
      { name: "Enregistrer", text: "PDF corrigé." },
    ],
    faqs: [{ question: "Privé ?", answer: P }],
  },
  "watermark-pdf": {
    bodyParagraphs: ["Filigrane texte diagonal pour brouillons et aperçus.", P],
    howToSteps: [
      { name: "Importer", text: "PDF." },
      { name: "Réglages", text: "Texte, couleur, opacité." },
      { name: "Exporter", text: "PDF filigrané." },
    ],
    faqs: [{ question: "Logo ?", answer: "Texte pour l'instant ; images dans l'éditeur PDF." }],
  },
  "pdf-to-image": {
    bodyParagraphs: ["Export page par page JPG/PNG pour présentations et réseaux.", P],
    howToSteps: [
      { name: "Importer", text: "PDF." },
      { name: "Format", text: "JPEG ou PNG." },
      { name: "Télécharger", text: "Images." },
    ],
    faqs: [{ question: "Gros fichier ?", answer: "Scindez d'abord si le navigateur ralentit." }],
  },
  "page-numbers": {
    bodyParagraphs: ["Numérotation cohérente pour rapports et dossiers.", P],
    howToSteps: [
      { name: "Importer", text: "PDF." },
      { name: "Configurer", text: "Position et début." },
      { name: "Appliquer", text: "PDF numéroté." },
    ],
    faqs: [{ question: "Mise en page ?", answer: "Numéros en marge — vérifiez l'impression." }],
  },
  "pdf-maker": {
    bodyParagraphs: ["Créez un PDF depuis du texte sans Word.", P],
    howToSteps: [
      { name: "Saisir", text: "Collez ou tapez." },
      { name: "Style", text: "Police et interligne." },
      { name: "PDF", text: "Téléchargez." },
    ],
    faqs: [{ question: "Images ?", answer: "Utilisez l'éditeur PDF." }],
  },
  "pptx-to-pdf": {
    bodyParagraphs: ["PPTX en PDF ; animations aplaties en pages statiques.", P],
    howToSteps: [
      { name: "Importer", text: ".pptx." },
      { name: "Convertir", text: "Cloud." },
      { name: "Télécharger", text: "PDF." },
    ],
    faqs: [{ question: "Animations ?", answer: "Apparence statique à l'export." }],
  },
  "generate-qr-code": {
    bodyParagraphs: ["QR pour menus et campagnes — génération locale.", P],
    howToSteps: [
      { name: "Contenu", text: "URL ou texte." },
      { name: "Taille", text: "Pixels." },
      { name: "Télécharger", text: "PNG/SVG." },
    ],
    faqs: [{ question: "Suivi ?", answer: "Pas d'envoi serveur à la génération." }],
  },
  "translate-pdf": {
    bodyParagraphs: ["Extraction locale — collez dans votre traducteur.", P],
    howToSteps: [
      { name: "Importer", text: "PDF avec texte." },
      { name: "Extraire", text: "Local." },
      { name: "Copier", text: "Presse-papiers ou RTF." },
    ],
    faqs: [{ question: "Traduction auto ?", answer: "Non — extraction uniquement." }],
  },
  "remove-watermark": {
    bodyParagraphs: ["Atténue filigranes simples sans IA générative cloud.", P],
    howToSteps: [
      { name: "Importer", text: "PDF ou image." },
      { name: "Masque", text: "Auto ou manuel." },
      { name: "Télécharger", text: "Résultat." },
    ],
    faqs: [{ question: "Légal ?", answer: "Fichiers que vous pouvez modifier uniquement." }],
  },
  "hard-lock-pdf": {
    bodyParagraphs: ["Chaque page en image — texte et signatures non modifiables.", P],
    howToSteps: [
      { name: "Importer", text: "Version finale." },
      { name: "Verrouiller", text: "Hard Lock." },
      { name: "Télécharger", text: "PDF immuable." },
    ],
    faqs: [{ question: "Réversible ?", answer: "Non — gardez l'original." }],
  },
  "repair-pdf": {
    bodyParagraphs: ["Répare xref et pages blanches.", P],
    howToSteps: [
      { name: "Importer", text: "PDF cassé." },
      { name: "Réparer", text: "Dans le navigateur." },
      { name: "Télécharger", text: "Copie réparée." },
    ],
    faqs: [{ question: "Tout récupéré ?", answer: "Dommages graves peuvent perdre du contenu." }],
  },
  "redact-pdf": {
    bodyParagraphs: ["Masquage e-mail, carte, téléphone par motifs.", P],
    howToSteps: [
      { name: "Importer", text: "PDF." },
      { name: "Motifs", text: "Activez les règles." },
      { name: "Télécharger", text: "PDF caviardé." },
    ],
    faqs: [{ question: "Permanent ?", answer: "Oui — vérifiez la sortie." }],
  },
  "pdf-to-html": {
    bodyParagraphs: ["Texte PDF en page web légère.", P],
    howToSteps: [
      { name: "Importer", text: "PDF." },
      { name: "Convertir", text: "Local." },
      { name: "Télécharger", text: ".html." },
    ],
    faqs: [{ question: "Images ?", answer: "Focus texte." }],
  },
  "document-scanner": {
    bodyParagraphs: ["Photo en PDF propre : recadrage, rotation, filtre N&B.", P],
    howToSteps: [
      { name: "Photo", text: "JPG/PNG." },
      { name: "Améliorer", text: "Recadrage et filtre." },
      { name: "PDF", text: "Export local." },
    ],
    faqs: [{ question: "Upload ?", answer: "Non — 100 % local." }],
  },
  "photo-resizer": {
    bodyParagraphs: ["Photo d'identité au Ko exact pour formulaires.", P],
    howToSteps: [
      { name: "Importer", text: "Photo." },
      { name: "Ko", text: "Cible." },
      { name: "Télécharger", text: "Image." },
    ],
    faqs: [{ question: "Qualité ?", answer: "Équilibre jusqu'à la cible Ko." }],
  },
  "resume-builder": {
    bodyParagraphs: ["Modèles, aperçu live, PDF ; brouillon sur l'appareil.", P],
    howToSteps: [
      { name: "Modèle", text: "Choisir." },
      { name: "Remplir", text: "Sections." },
      { name: "PDF", text: "Télécharger." },
    ],
    faqs: [{ question: "Serveur ?", answer: "Non — localStorage." }],
  },
  "professional-cv-maker": {
    bodyParagraphs: ["CV corporate, export PDF gratuit.", P],
    howToSteps: [
      { name: "Modèle", text: "Business." },
      { name: "Contenu", text: "Expérience." },
      { name: "Export", text: "PDF." },
    ],
    faqs: [{ question: "Gratuit ?", answer: "Oui." }],
  },
  "government-resume-builder": {
    bodyParagraphs: ["Mise en page formelle secteur public.", P],
    howToSteps: [
      { name: "Modèle", text: "Officiel." },
      { name: "Données", text: "Toutes sections." },
      { name: "PDF", text: "Télécharger." },
    ],
    faqs: [{ question: "Photo ?", answer: "Optionnelle." }],
  },
  "ats-friendly-resume-builder": {
    bodyParagraphs: ["Une colonne, titres clairs pour ATS.", P],
    howToSteps: [
      { name: "Modèle", text: "ATS." },
      { name: "Mots-clés", text: "Compétences." },
      { name: "PDF", text: "Export." },
    ],
    faqs: [{ question: "Qu'est-ce qu'ATS ?", answer: "Filtrage automatique des candidatures." }],
  },
  "universal-converter": {
    bodyParagraphs: ["PDF et Office dans un flux unique.", P],
    howToSteps: [
      { name: "Format", text: "Entrée/sortie." },
      { name: "Importer", text: "Fichier." },
      { name: "Convertir", text: "Télécharger." },
    ],
    faqs: [{ question: "Confidentialité ?", answer: P }],
  },
  "jpg-to-pdf": {
    bodyParagraphs: ["Assembler des JPG en un PDF.", P],
    howToSteps: [
      { name: "JPG", text: "Choisir." },
      { name: "Ordre", text: "Organiser." },
      { name: "PDF", text: "Télécharger." },
    ],
    faqs: [{ question: "Privé ?", answer: P }],
  },
  "png-to-pdf": {
    bodyParagraphs: ["PNG transparent en PDF net.", P],
    howToSteps: [
      { name: "PNG", text: "Importer." },
      { name: "Créer", text: "PDF." },
      { name: "Télécharger", text: "Enregistrer." },
    ],
    faqs: [{ question: "Transparence ?", answer: "Rasterisation haute résolution." }],
  },
  "excel-to-pdf": {
    bodyParagraphs: ["Tableurs en PDF fixe.", P],
    howToSteps: [
      { name: "Importer", text: "Excel." },
      { name: "Convertir", text: "Cloud/navigateur." },
      { name: "PDF", text: "Télécharger." },
    ],
    faqs: [{ question: "Formules ?", answer: "PDF lecture seule — gardez Excel." }],
  },
  "pdf-to-excel": {
    bodyParagraphs: ["Tableaux PDF vers XLSX filtrable.", P],
    howToSteps: [
      { name: "PDF", text: "Avec tableaux." },
      { name: "Extraire", text: "Cloud." },
      { name: "XLSX", text: "Télécharger." },
    ],
    faqs: [{ question: "Scan ?", answer: "OCR d'abord." }],
  },
  "pdf-to-pptx": {
    bodyParagraphs: ["Diapos éditables depuis PDF.", P],
    howToSteps: [
      { name: "Importer", text: "PDF." },
      { name: "Convertir", text: "Cloud." },
      { name: "PPTX", text: "Télécharger." },
    ],
    faqs: [{ question: "Design ?", answer: "PDF slides simples idéal." }],
  },
  "pdf-to-epub": {
    bodyParagraphs: ["PDF textuel en ebook lisible.", P],
    howToSteps: [
      { name: "PDF", text: "Texte numérique." },
      { name: "EPUB", text: "Cloud." },
      { name: "Lire", text: "Liseuse." },
    ],
    faqs: [{ question: "Scan ?", answer: "OCR avant." }],
  },
  "tools/ai-scanner": {
    bodyParagraphs: ["OpenCV.js : perspective et netteté sans API IA.", P],
    howToSteps: [
      { name: "Photo", text: "Importer." },
      { name: "Options", text: "Perspective/amélioration." },
      { name: "Export", text: "PNG/PDF." },
    ],
    faqs: [{ question: "Écriture manuscrite ?", answer: "Nettoyage image seulement." }],
  },
};
