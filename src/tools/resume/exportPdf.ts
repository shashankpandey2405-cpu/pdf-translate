/** Export resume preview DOM to PDF via html2canvas + jsPDF (matches on-screen layout). */
export async function exportResumeElementToPdf(element: HTMLElement): Promise<Blob> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const width = 816;

  const canvas = await html2canvas(element, {
    scale: 2,
    width,
    windowWidth: width,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    onclone: (doc) => {
      doc.querySelectorAll("[data-resume-scale-wrap]").forEach((node) => {
        if (node instanceof HTMLElement) {
          node.style.transform = "none";
          node.style.scale = "1";
        }
      });
      doc.querySelectorAll("[data-placeholder]").forEach((node) => {
        if (node instanceof HTMLElement) node.style.visibility = "hidden";
      });
      const root = doc.getElementById(element.id) ?? doc.querySelector("[id^='resume-preview']");
      if (root instanceof HTMLElement) {
        root.style.transform = "none";
        root.style.margin = "0";
      }
    },
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.96);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const contentW = pageW - margin * 2;
  const imgH = (canvas.height * contentW) / canvas.width;

  let heightLeft = imgH;
  let position = margin;

  pdf.addImage(imgData, "JPEG", margin, position, contentW, imgH);
  heightLeft -= pageH - margin * 2;

  while (heightLeft > 0) {
    position = margin - (imgH - heightLeft);
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", margin, position, contentW, imgH);
    heightLeft -= pageH - margin * 2;
  }

  return pdf.output("blob");
}
