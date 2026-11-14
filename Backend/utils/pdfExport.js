function sanitizePdfText(value, maxLen = 40) {
  if (value === null || value === undefined) return '';
  const ascii = String(value)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^\x20-\x7E]/g, '?')
    .trim()
    .slice(0, maxLen);
  return ascii.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Generates a valid multi-page landscape A4 PDF (%PDF-1.4) table document using Type1 Helvetica fonts.
 */
export function buildTablePdfBuffer({ title = 'Report', subtitle = '', columns = [], rows = [] }) {
  const pageWidth = 842; // A4 landscape
  const pageHeight = 595;
  const marginX = 36;
  const topY = pageHeight - 40;
  const bottomMargin = 42;
  const tableWidth = pageWidth - marginX * 2;
  const rowHeight = 16;

  const colCount = Math.max(1, columns.length);
  const totalWeight = columns.reduce((sum, col) => sum + (Number(col.weight) || 1), 0);
  const colWidths = columns.map((col) => ((Number(col.weight) || 1) / totalWeight) * tableWidth);

  const pagesContent = [];
  let rowIndex = 0;

  const drawPage = () => {
    const ops = [];
    let y = topY;

    // Header Title
    ops.push('BT');
    ops.push('/F2 13 Tf');
    ops.push('0.10 0.21 0.37 rg');
    ops.push(`1 0 0 1 ${marginX} ${y} Tm`);
    ops.push(`(${sanitizePdfText(title, 95)}) Tj`);
    ops.push('ET');
    y -= 16;

    if (subtitle) {
      ops.push('BT');
      ops.push('/F1 8.5 Tf');
      ops.push('0.35 0.41 0.50 rg');
      ops.push(`1 0 0 1 ${marginX} ${y} Tm`);
      ops.push(`(${sanitizePdfText(subtitle, 130)}) Tj`);
      ops.push('ET');
      y -= 16;
    } else {
      y -= 6;
    }

    // Table Header Bar
    ops.push('0.10 0.21 0.37 rg');
    ops.push(`${marginX} ${y - 14} ${tableWidth.toFixed(2)} 18 re f`);

    let curX = marginX + 4;
    columns.forEach((col, i) => {
      const approxChars = Math.max(4, Math.floor((colWidths[i] - 8) / 4.8));
      ops.push('BT');
      ops.push('/F2 7.5 Tf');
      ops.push('1 1 1 rg');
      ops.push(`1 0 0 1 ${curX.toFixed(2)} ${(y - 8).toFixed(2)} Tm`);
      ops.push(`(${sanitizePdfText(col.label, approxChars)}) Tj`);
      ops.push('ET');
      curX += colWidths[i];
    });
    y -= 20;

    if (rows.length === 0) {
      ops.push('BT');
      ops.push('/F1 9 Tf');
      ops.push('0.40 0.45 0.53 rg');
      ops.push(`1 0 0 1 ${marginX} ${(y - 12).toFixed(2)} Tm`);
      ops.push('(No matching records found.) Tj');
      ops.push('ET');
      rowIndex = rows.length;
    }

    while (rowIndex < rows.length && y - rowHeight >= bottomMargin) {
      const row = rows[rowIndex];
      if (rowIndex % 2 === 1) {
        ops.push('0.96 0.97 0.99 rg');
        ops.push(`${marginX} ${(y - 12).toFixed(2)} ${tableWidth.toFixed(2)} ${rowHeight} re f`);
      }
      // Subtle bottom divider
      ops.push('0.88 0.91 0.95 RG');
      ops.push('0.4 w');
      ops.push(`${marginX} ${(y - 12).toFixed(2)} m ${(marginX + tableWidth).toFixed(2)} ${(y - 12).toFixed(2)} l S`);

      let cellX = marginX + 4;
      columns.forEach((col, i) => {
        const val = typeof col.value === 'function' ? col.value(row) : row?.[col.key];
        const approxChars = Math.max(4, Math.floor((colWidths[i] - 8) / 4.4));
        ops.push('BT');
        ops.push('/F1 7.5 Tf');
        ops.push('0.12 0.16 0.24 rg');
        ops.push(`1 0 0 1 ${cellX.toFixed(2)} ${(y - 8).toFixed(2)} Tm`);
        ops.push(`(${sanitizePdfText(val, approxChars)}) Tj`);
        ops.push('ET');
        cellX += colWidths[i];
      });

      y -= rowHeight;
      rowIndex += 1;
    }

    // Footer Page Number
    ops.push('BT');
    ops.push('/F1 7.5 Tf');
    ops.push('0.45 0.50 0.58 rg');
    ops.push(`1 0 0 1 ${marginX} 20 Tm`);
    ops.push(`(Rise Her · Generation Rise Foundation · Page ${pagesContent.length + 1}) Tj`);
    ops.push('ET');

    pagesContent.push(ops.join('\n'));
  };

  if (rows.length === 0) {
    drawPage();
  } else {
    while (rowIndex < rows.length) {
      drawPage();
    }
  }

  // Build PDF Objects: 1=Catalog, 2=Pages, 3=Font F1, 4=Font F2, then pairs of Page + Content Stream
  const objects = new Map();
  const pageIds = [];
  let nextId = 5;

  pagesContent.forEach((streamText) => {
    const pageId = nextId++;
    const contentId = nextId++;
    pageIds.push(pageId);
    const streamLen = Buffer.byteLength(streamText, 'latin1');
    objects.set(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.set(contentId, `<< /Length ${streamLen} >>\nstream\n${streamText}\nendstream`);
  });

  objects.set(1, '<< /Type /Catalog /Pages 2 0 R >>');
  objects.set(2, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
  objects.set(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.set(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  const parts = [Buffer.from('%PDF-1.4\n', 'latin1')];
  let byteOffset = parts[0].length;
  const offsets = new Map();
  const totalObjects = nextId - 1;

  for (let id = 1; id <= totalObjects; id += 1) {
    offsets.set(id, byteOffset);
    const chunk = Buffer.from(`${id} 0 obj\n${objects.get(id)}\nendobj\n`, 'latin1');
    parts.push(chunk);
    byteOffset += chunk.length;
  }

  const xrefStart = byteOffset;
  const xrefLines = [`xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`];
  for (let id = 1; id <= totalObjects; id += 1) {
    xrefLines.push(`${String(offsets.get(id)).padStart(10, '0')} 00000 n \n`);
  }
  const trailer = `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  parts.push(Buffer.from(xrefLines.join('') + trailer, 'latin1'));

  return Buffer.concat(parts);
}
