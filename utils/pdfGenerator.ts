import { jsPDF } from "jspdf";
import { GeneratedImage } from "../types";

export const createColoringBookPDF = (childName: string, theme: string, images: GeneratedImage[], coverImageUrl?: string | null) => {
  // A4 size: 210 x 297 mm
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- Cover Page ---
  
  if (coverImageUrl) {
      // Draw background image covering the whole page
      doc.addImage(coverImageUrl, "JPEG", 0, 0, pageWidth, pageHeight);
      
      // Draw a semi-transparent white box for text readability
      const boxWidth = pageWidth * 0.8;
      const boxHeight = 80;
      const boxX = (pageWidth - boxWidth) / 2;
      const boxY = 70; // Vertically centered-ish top area
      
      doc.setFillColor(255, 255, 255);
      // jsPDF doesn't support alpha for fills easily in standard mode without GState, 
      // but we can just do a solid white box with rounded corners.
      doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 5, 5, "F");
      
      // Text over the box
      doc.setTextColor(0, 0, 0); // Black text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(32);
      doc.text("Coloring Book", pageWidth / 2, boxY + 30, { align: "center" });
      
      doc.setFontSize(24);
      doc.setFont("helvetica", "normal");
      doc.text(`For ${childName}`, pageWidth / 2, boxY + 50, { align: "center" });
      
      doc.setFontSize(16);
      doc.setTextColor(100);
      doc.text(`Theme: ${theme}`, pageWidth / 2, boxY + 65, { align: "center" });
      
  } else {
      // Standard minimal cover
      doc.setFont("helvetica", "bold");
      doc.setFontSize(32);
      doc.text("Coloring Book", pageWidth / 2, 80, { align: "center" });
      
      doc.setFontSize(24);
      doc.setFont("helvetica", "normal");
      doc.text(`For ${childName}`, pageWidth / 2, 100, { align: "center" });

      doc.setFontSize(16);
      doc.setTextColor(100);
      doc.text(`Theme: ${theme}`, pageWidth / 2, 120, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(150);
      doc.text("Created with DreamColor AI", pageWidth / 2, 250, { align: "center" });
  }

  // --- Image Pages ---
  images.forEach((img, index) => {
    doc.addPage();
    
    // Add border text
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Page ${index + 1} - ${childName}'s ${theme} Adventure`, 10, 10);

    // Calculate image dimensions to fit within margins
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2) - 20; // Extra space for caption

    // We assume the image is roughly 3:4.
    // Fit to width
    const imgWidth = maxWidth;
    const imgHeight = (4/3) * imgWidth;

    // If height is too tall, fit to height
    let finalWidth = imgWidth;
    let finalHeight = imgHeight;

    if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = (3/4) * finalHeight;
    }

    const xPos = (pageWidth - finalWidth) / 2;
    const yPos = 25;

    doc.addImage(img.url, "PNG", xPos, yPos, finalWidth, finalHeight);
    
    // Optional: Add the prompt/description at the bottom
    doc.setFontSize(8);
    doc.setTextColor(150);
    // Truncate prompt if too long for one line
    const shortPrompt = img.prompt.length > 80 ? img.prompt.substring(0, 80) + "..." : img.prompt;
    doc.text(shortPrompt, pageWidth / 2, pageHeight - 10, { align: "center" });
  });

  doc.save(`${childName}_Coloring_Book.pdf`);
};
