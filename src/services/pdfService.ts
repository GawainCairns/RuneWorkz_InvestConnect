import { jsPDF } from 'jspdf';

function safeText(s: any) {
  return s == null ? '' : String(s);
}

export function generateAttendancePDF(event: any, invitees: any[]) {
  const doc = new jsPDF();
  const title = safeText(event.title || event.name || 'Event');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${title} - Attendance`, 14, 20);
  doc.setFont('helvetica', 'normal');

  if (event.date) doc.setFontSize(11).text(`Event Date: ${safeText(event.date)}`, 14, 30);
  if (event.start_time) doc.setFontSize(11).text(`Event Start Time: ${safeText(event.start_time)}`, 14, 36);
  if (event.end_time) doc.setFontSize(11).text(`Event End Time: ${safeText(event.end_time)}`, 14, 42);
  if (event.location) doc.setFontSize(11).text(`Event Location: ${safeText(event.location)}`, 14, 48);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  // center the section caption
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text('Attendance', pageWidth / 2, 60, { align: 'left' });
  doc.setFont('helvetica', 'normal');

  const startY = 68;
  let y = startY;

  // Only include invitees who have paid and RSVP'd yes
  const filteredInvitees = invitees.filter(i => String(i.payment_status).toLowerCase() === 'paid' && String(i.rsvp_status).toLowerCase() === 'yes');

  // Header row
  // Draw table header
  const marginLeft = 14;
  const tableWidth = pageWidth - marginLeft * 2;
  const nameColWidth = tableWidth - 30; // leave 30mm for attendance column
  const attendColWidth = 30;
  const rowHeight = 8;

  // header box
  doc.setDrawColor(0);
  doc.setLineWidth(0.2);
  doc.rect(marginLeft, y - 6, nameColWidth, rowHeight, 'S');
  doc.rect(marginLeft + nameColWidth, y - 6, attendColWidth, rowHeight, 'S');
  // header captions bold and centered
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const nameHeaderX = marginLeft + nameColWidth / 2;
  const markHeaderX = marginLeft + nameColWidth + attendColWidth / 2;
  doc.text('Name', nameHeaderX, y, { align: 'center' });
  doc.text('Mark', markHeaderX, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  y += rowHeight;

  // rows
  filteredInvitees.forEach(inv => {
    if (y + rowHeight > 287) { // leave small bottom margin
      doc.addPage();
      y = 20;
    }

    const name = `${safeText(inv.firstname || inv.name || inv.first || '')} ${safeText(inv.lastname || inv.surname || inv.last || '')}`.trim();
    const displayName = name || safeText(inv.email || '');

    // draw cells
    doc.rect(marginLeft, y - 6, nameColWidth, rowHeight, 'S');
    doc.rect(marginLeft + nameColWidth, y - 6, attendColWidth, rowHeight, 'S');

    // name text
    doc.setFontSize(10).text(displayName, marginLeft + 3, y);

    // small blank box centered in attendance cell for printing mark
    const boxSize = 6;
    const boxX = marginLeft + nameColWidth + (attendColWidth - boxSize) / 2;
    const boxY = y - 6 + (rowHeight - boxSize) / 2;
    doc.rect(boxX, boxY, boxSize, boxSize, 'S');

    y += rowHeight;
  });

  doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}_attendance.pdf`);
}

export function generateDietaryPDF(event: any, invitees: any[]) {
  const doc = new jsPDF();
  const title = safeText(event.title || event.name || 'Event');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${title} - Dietary Summary`, 14, 20);
  doc.setFont('helvetica', 'normal');

  if (event.date) doc.setFontSize(11).text(`Event Date: ${safeText(event.date)}`, 14, 30);
  if (event.start_time) doc.setFontSize(11).text(`Event Start Time: ${safeText(event.start_time)}`, 14, 36);
  if (event.end_time) doc.setFontSize(11).text(`Event End Time: ${safeText(event.end_time)}`, 14, 42);
  if (event.location) doc.setFontSize(11).text(`Event Location: ${safeText(event.location)}`, 14, 48);

  const summaryStart = 60;
  doc.setFontSize(12);
  // center and bold the summary caption
  doc.setFont('helvetica', 'bold');
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text('Dietary Summary', pageWidth / 2, summaryStart, { align: 'left' });
  doc.setFont('helvetica', 'normal');

  // Only include invitees who have paid and RSVP'd yes
  const filteredInvitees = invitees.filter(i => String(i.payment_status).toLowerCase() === 'paid' && String(i.rsvp_status).toLowerCase() === 'yes');

  const counts: Record<string, number> = {};
  filteredInvitees.forEach(i => {
    const d = (i.dietary || i.dietary_requirements || '').toString().trim() || 'None';
    counts[d] = (counts[d] || 0) + 1;
  });

  let y = summaryStart + 8;
  doc.setFontSize(10);

  // draw a small two-column summary table (Dietary | Count)
  const marginLeft = 14;
  const tableWidth = pageWidth - marginLeft * 2;
  const dietColWidth = tableWidth * 0.7;
  const countColWidth = tableWidth - dietColWidth;
  const rowHeight = 8;

  // header row
  doc.setLineWidth(0.2);
  doc.rect(marginLeft, y - 6, dietColWidth, rowHeight, 'S');
  doc.rect(marginLeft + dietColWidth, y - 6, countColWidth, rowHeight, 'S');
  // header captions bold and centered
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const dietHeaderX = marginLeft + dietColWidth / 2;
  const countHeaderX = marginLeft + dietColWidth + countColWidth / 2;
  doc.text('Dietary', dietHeaderX, y, { align: 'center' });
  doc.text('Count', countHeaderX, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  y += rowHeight;

  Object.keys(counts).sort().forEach(k => {
    if (y + rowHeight > 287) {
      doc.addPage();
      y = 20;
    }
    doc.rect(marginLeft, y - 6, dietColWidth, rowHeight, 'S');
    doc.rect(marginLeft + dietColWidth, y - 6, countColWidth, rowHeight, 'S');
    doc.text(k, marginLeft + 3, y);
    doc.text(String(counts[k]), marginLeft + dietColWidth + 6, y);
    y += rowHeight;
  });

  // add total of invitees who have RSVP'd under the same summary table
  const rsvpTotal = filteredInvitees.length;
  if (y + rowHeight > 287) {
    doc.addPage();
    y = 20;
  }
  doc.rect(marginLeft, y - 6, dietColWidth, rowHeight, 'S');
  doc.rect(marginLeft + dietColWidth, y - 6, countColWidth, rowHeight, 'S');
  // label right-aligned in left column; number left-aligned in right column
  doc.setFont('helvetica', 'bold');
  const totalLabelX = marginLeft + dietColWidth - 3; // 3mm padding from right edge
  const totalValueX = marginLeft + dietColWidth + 3; // 3mm padding from left edge of count column
  doc.text("Total", totalLabelX, y, { align: 'right' });
  doc.text(String(rsvpTotal), totalValueX, y, { align: 'left' });
  doc.setFont('helvetica', 'normal');
  y += rowHeight;

  // Details table header
  y += 6;
  if (y + rowHeight > 287) {
    doc.addPage();
    y = 20;
  }
  // center and bold the details caption
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Dietary Details', pageWidth / 2, y, { align: 'left' });
  doc.setFont('helvetica', 'normal');
  y += 8;
  doc.setFontSize(10);

  // Details table columns: Name | Dietary
  const nameColWidth = tableWidth * 0.6;
  const detailsColWidth = tableWidth - nameColWidth;

  // header
  doc.rect(marginLeft, y - 6, nameColWidth, rowHeight, 'S');
  doc.rect(marginLeft + nameColWidth, y - 6, detailsColWidth, rowHeight, 'S');
  // header captions bold and centered
  doc.setFont('helvetica', 'bold');
  const nameHeaderX = marginLeft + nameColWidth / 2;
  const detailsHeaderX = marginLeft + nameColWidth + detailsColWidth / 2;
  doc.text('Name', nameHeaderX, y, { align: 'center' });
  doc.text('Dietary Requirements', detailsHeaderX, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  y += rowHeight;

  filteredInvitees.forEach(inv => {
    if (y + rowHeight > 287) {
      doc.addPage();
      y = 20;
      // redraw header on new page
      doc.rect(marginLeft, y - 6, nameColWidth, rowHeight, 'S');
      doc.rect(marginLeft + nameColWidth, y - 6, detailsColWidth, rowHeight, 'S');
      doc.setFont('helvetica', 'bold');
      doc.text('Name', nameHeaderX, y, { align: 'center' });
      doc.text('Dietary Requirements', detailsHeaderX, y, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      y += rowHeight;
    }

    const name = `${safeText(inv.firstname || inv.name || inv.first || '')} ${safeText(inv.lastname || inv.surname || inv.last || '')}`.trim() || safeText(inv.email || '');
    const dietary = safeText(inv.dietary || inv.dietary_requirements || 'None');

    doc.rect(marginLeft, y - 6, nameColWidth, rowHeight, 'S');
    doc.rect(marginLeft + nameColWidth, y - 6, detailsColWidth, rowHeight, 'S');
    // use splitTextToSize for dietary if it's long
    const dietaryLines = (doc as any).splitTextToSize ? (doc as any).splitTextToSize(dietary, detailsColWidth - 6) : [dietary];
    doc.text(name, marginLeft + 3, y);
    doc.text(dietaryLines, marginLeft + nameColWidth + 3, y);
    y += Math.max(rowHeight, (dietaryLines.length || 1) * 6);
  });

  doc.save(`${title.replace(/[^a-z0-9]/gi, '_')}_dietary.pdf`);
}

export default { generateAttendancePDF, generateDietaryPDF };
