// Function to display messages to the user
function showMessage(message, type = 'error') {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.style.display = 'block';
    messageBox.className = 'message-box'; // Reset classes
    if (type === 'error') {
        messageBox.classList.add('error');
    } else if (type === 'success') {
        messageBox.classList.add('success');
    } else if (type === 'loading') {
        messageBox.classList.add('loading');
    }
    // Hide message after 5 seconds, unless it's a loading message
    if (type !== 'loading') {
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }
}

// Main function to edit the PDF
async function editPDF() {
    const fileInput = document.getElementById('pdfFile');
    const seatNo = document.getElementById('seatNo').value; // This will be your new seat number, e.g., "JHA-16, GHA-15"
    const journeyDate = document.getElementById('journeyDate').value;
    const downloadLink = document.getElementById('downloadLink');
    const generateButton = document.getElementById('generateButton');

    // Hide previous download link and message
    downloadLink.style.display = 'none';
    document.getElementById('messageBox').style.display = 'none';

    // Disable button and show loading message
    generateButton.disabled = true;
    showMessage("Processing PDF, please wait...", 'loading');

    // Validate inputs
    if (!fileInput.files[0]) {
        showMessage("Please upload a PDF file.");
        generateButton.disabled = false;
        return;
    }
    if (!seatNo.trim()) {
        showMessage("Please enter the new Seat No.");
        generateButton.disabled = false;
        return;
    }
    if (!journeyDate.trim()) {
        showMessage("Please enter the new Journey Date.");
        generateButton.disabled = false;
        return;
    }

    try {
        // Read the uploaded PDF file as an ArrayBuffer
        const fileBytes = await fileInput.files[0].arrayBuffer();

        // Load the PDF document
        const pdfDoc = await PDFLib.PDFDocument.load(fileBytes);

        // Get the first page of the PDF
        const pages = pdfDoc.getPages();
        if (pages.length === 0) {
            throw new Error("The uploaded PDF has no pages.");
        }
        const firstPage = pages[0];

        // Define font and color for the new text
        const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
        const textColor = PDFLib.rgb(0, 0, 0); // Black color

        // --- IMPORTANT: COORDINATE ADJUSTMENT GUIDE ---
        // The x and y coordinates below are SAMPLE VALUES.
        // You MUST adjust these values to match the exact layout of YOUR Bangladesh Railway ticket PDF.
        // PDF coordinates start from the BOTTOM-LEFT corner of the page (0,0).
        // X increases to the right, Y increases upwards.

        // HOW TO FIND CORRECT COORDINATES:
        // 1. Open your PDF ticket in a PDF viewer (like Adobe Acrobat Reader or even your web browser).
        // 2. Try to estimate the pixel position of the "Coach Name / Seat(s)" field.
        //    Based on the provided PDF snippet, "GHA-14, GHA-15 (ঘ-১৪, ঘ-১৫)" appears around the middle-left section.
        // 3. Experiment with the 'x' and 'y' values below. Start with small adjustments (e.g., +/- 5 or 10).
        // 4. Remember that the 'y' coordinate for text refers to the baseline of the text.
        // 5. The 'drawRectangle' is used to cover the old text. Ensure its 'x', 'y', 'width', and 'height'
        //    are large enough to completely hide the old text before drawing the new text.

        // For Seat No (e.g., GHA-14, GHA-15 to JHA-16, GHA-15):
        // Draw a white rectangle to cover the old text.
        // Adjust these rectangle coordinates (x, y, width, height) to precisely cover the old seat number area.
        // Based on the provided PDF, the seat number is near "Coach Name / Seat(s)".
        // The previous coordinates were around y: 370-380. Let's try to refine based on the full text.
        // From the PDF snippet, "Coach Name / Seat(s) (কোচের নাম/ আসন)" is followed by "GHA-14, GHA-15 (ঘ-১৪, ঘ-১৫)".
        // The Y-coordinate for "Coach Name / Seat(s)" seems to be higher than "Journey Date".
        // Let's assume the previous estimate of y=375-380 for seat number was for a different layout.
        // Looking at the full text, "Coach Name / Seat(s)" is above "No. of Seats".
        // "No. of Seats" is at y: 340 (from snippet). So "Coach Name / Seat(s)" should be higher.
        // Let's re-estimate based on the overall structure.
        // "Journey Date & Time" is at y: 510.
        // "Class Name" is at y: 390 (from snippet).
        // "Coach Name / Seat(s)" is after "Class Name". So it should be slightly below Class Name.

        // Re-estimating coordinates for Seat No based on the full PDF snippet:
        // "Class Name" is around y=390. "Coach Name / Seat(s)" is likely just below it.
        // Let's try y=360-370 for the seat number.
        firstPage.drawRectangle({
            x: 140,  // Adjust X: move left/right
            y: 360,  // Re-estimated Y: move up/down (lower value = lower on page)
            width: 150, // Adjust width to cover the longest possible seat number including Bengali text
            height: 20, // Adjust height to cover the text vertically
            color: PDFLib.rgb(1, 1, 1), // White color to cover
        });
        // Then, draw the new Seat No.
        firstPage.drawText(seatNo, {
            x: 145,  // Adjust X: should be slightly to the right of rectangle's x
            y: 365,  // Adjust Y: should be slightly above rectangle's y
            size: 10, // Font size (adjust if needed)
            font: font,
            color: textColor,
        });

        // For Journey Date:
        // Draw a white rectangle to cover the old text.
        // Adjust these rectangle coordinates (x, y, width, height) to precisely cover the old journey date area.
        // From the PDF snippet, "Journey Date & Time" is at y: 510. This seems like a reasonable estimate.
        firstPage.drawRectangle({
            x: 140,  // Adjust X
            y: 500,  // Adjust Y
            width: 120, // Adjust width
            height: 20, // Adjust height
            color: PDFLib.rgb(1, 1, 1), // White color to cover
        });
        // Then, draw the new Journey Date.
        firstPage.drawText(journeyDate, {
            x: 145,  // Adjust X
            y: 505,  // Adjust Y
            size: 10, // Font size (adjust if needed)
            font: font,
            color: textColor,
        });

        // Save the modified PDF document
        const editedPdfBytes = await pdfDoc.save();

        // Create a Blob from the bytes and a URL for download
        const blob = new Blob([editedPdfBytes], { type: "application/pdf" });
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.style.display = 'inline-block'; // Show the download link
        downloadLink.textContent = "Download Edited Ticket";
        showMessage("PDF generated successfully! Click the download link.", 'success');

    } catch (error) {
        console.error("Error editing PDF:", error);
        showMessage(`An error occurred: ${error.message}. This might be due to an invalid PDF file or incorrect coordinates. Please check the console for more details.`, 'error');
    } finally {
        // Re-enable the button after process completes or fails
        generateButton.disabled = false;
    }
}
