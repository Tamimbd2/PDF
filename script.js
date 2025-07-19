async function replaceSeatNumber() {
  const fileInput = document.getElementById('pdfFile');
  const seatText = document.getElementById('seatInput').value;
  const downloadLink = document.getElementById('downloadLink');

  if (!fileInput.files[0] || !seatText) {
    alert("Please upload a PDF and enter the new seat number.");
    return;
  }

  const file = fileInput.files[0];
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  // Draw new seat number (overwrite manually using drawText)
  firstPage.drawText(seatText + " (ঘ-১৪, ঘ-১৫)", {
    x: 140,
    y: 390,
    size: 10,
    color: PDFLib.rgb(0, 0, 0)
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });

  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.style.display = 'inline-block';
  downloadLink.click();  // ⬅️ auto-click to trigger download
}
