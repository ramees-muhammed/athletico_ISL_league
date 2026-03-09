
// src/utils/generatePlayerPdf.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PlayerData {
  fullname: string;
  phone: string;
  place: string;
  club: string;
  position: string;
  status: string;
  facePhotoUrl?: string;
  fullPhotoUrl?: string;
  [key: string]: any;
}


// Updated to handle both Cloudinary URLs and Local URLs
const getBase64Image = async (url: string, isLocal: boolean = false): Promise<string | null> => {
  try {
    // ADDED f_jpg HERE: Forces Cloudinary to return a JPEG, fixing .heic issues
    const optimizedUrl = isLocal 
      ? url 
      : url.replace('/upload/', '/upload/w_100,h_100,c_fill,q_auto,f_jpg/');
      
    const response = await fetch(optimizedUrl);
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn(`Failed to fetch image for PDF: ${url}`, e);
    return null; 
  }
};

export const generatePlayerPdf = async (players: PlayerData[]): Promise<void> => {

    console.log("playerssss", players);
    
    
  const doc = new jsPDF();
  
  //  Fetch the official logo from the public folder
  const logoBase64 = await getBase64Image('/isl_official_logo.jpeg', true);

 // 2. Setup Header Coordinates (Pushed to the left edge)
  let textStartX = 8; // Changed from 14 to 8 to match new margins
  
  if (logoBase64) {
    // Draw Logo (X: 8, Y: 12, Width: 20, Height: 20)
    doc.addImage(logoBase64, 'JPEG', 8, 12, 20, 20);
    textStartX = 32; // Shift text to right of logo
  }

  // 3. Premium Document Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 138); // Premium Navy Blue
  doc.text("Irumbuzhi Soccer League", textStartX, 22);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100); // Slate Gray
  doc.text(`Registered Players | Total Players: ${players.length}`, textStartX, 28); 
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, textStartX, 33);

  const tableData: any[] = [];
  const imageMap: Record<number, string | null> = {};

  // Process all players
  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    
    tableData.push([
      i + 1,
      '', // Placeholder for Photo
      player.fullname,
      player.phone,
      player.place,
      player.club,
      player.position,
      player.status
    ]);

    const targetPhotoUrl = player.facePhotoUrl || player.fullPhotoUrl;
    if (targetPhotoUrl) {
      imageMap[i] = await getBase64Image(targetPhotoUrl);
    }
  }

// 4. Generate the Aligned, Premium Table
  autoTable(doc, {
    startY: 42,
    // explicitly set tight margins to make the table as wide as possible
    margin: { left: 8, right: 8 }, 
    head: [['#', 'Photo', 'Name', 'Phone', 'Place', 'Club', 'Pos', 'Status']],
    body: tableData,
    theme: 'grid',
    
    styles: {
      fontSize: 9, 
      cellPadding: 3,
      overflow: 'ellipsize', // Keeps rows equal height
    },
    
    headStyles: { 
      fillColor: [30, 58, 138],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center', 
      valign: 'middle',
      minCellHeight: 18,
    }, 
    
    alternateRowStyles: { fillColor: [247, 249, 252] },
    bodyStyles: { 
      minCellHeight: 18,
      valign: 'middle',
      textColor: [40, 40, 40]
    }, 
    
    // --- NEW WIDER COLUMN MATH ---
    // Total usable width is now 194mm (210mm A4 width - 16mm margins)
    columnStyles: { 
      0: { halign: 'center', cellWidth: 10 }, 
      1: { halign: 'center', cellWidth: 16 }, 
      2: { halign: 'left', fontStyle: 'bold', cellWidth: 40 }, // Expanded Name (+5mm)
      3: { halign: 'center', cellWidth: 26 }, 
      4: { halign: 'left', cellWidth: 30 }, 
      5: { halign: 'left', cellWidth: 37 }, // Expanded Club (+7mm for long names)
      6: { halign: 'center', cellWidth: 13 }, 
      7: { halign: 'center', cellWidth: 22 }  
    }, 
    
didDrawCell: (data) => {
      if (data.column.index === 1 && data.cell.section === 'body') {
        const imgData = imageMap[data.row.index];
        if (imgData) {
          const imgSize = 12; 
          const xOffset = data.cell.x + (data.cell.width - imgSize) / 2;
          const yOffset = data.cell.y + (data.cell.height - imgSize) / 2;
          doc.addImage(imgData, 'JPEG', xOffset, yOffset, imgSize, imgSize);
        }
      }
    },
// --- NEW: ADD PAGE NUMBERS ---
    didDrawPage: (data) => {
      // Use the safe, typed data object provided by autoTable
      const str = `Page ${data.pageNumber}`;
      
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      
      // Get exact page dimensions safely
      const pageSize = doc.internal.pageSize;
      const pageWidth = pageSize.width || pageSize.getWidth();
      const pageHeight = pageSize.height || pageSize.getHeight();
      
      // Print at the bottom center (10mm from the bottom)
      doc.text(str, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  });

  doc.save(`ISL_Players_List.pdf`);
};