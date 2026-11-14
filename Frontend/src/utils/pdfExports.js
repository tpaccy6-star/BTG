import jsPDF from 'jspdf';

function safePdfText(val, maxLen = 60) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[\r\n\t]+/g, ' ').trim().slice(0, maxLen);
}

export function buildTablePdfDoc({
  title = 'Report',
  subtitle = '',
  columns = [],
  rows = [],
  orientation = 'landscape'
}) {
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 36;
  const tableWidth = pageWidth - marginX * 2;
  const totalWeight = columns.reduce((sum, col) => sum + (Number(col.weight) || 1), 0) || 1;
  const colWidths = columns.map((col) => ((Number(col.weight) || 1) / totalWeight) * tableWidth);

  const drawHeader = () => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(safePdfText(title, 90), marginX, 38);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(safePdfText(subtitle, 130), marginX, 54);
    }

    const headerY = subtitle ? 68 : 54;
    doc.setFillColor(26, 54, 95);
    doc.rect(marginX, headerY, tableWidth, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);

    let x = marginX + 6;
    columns.forEach((col, i) => {
      const approxChars = Math.max(4, Math.floor((colWidths[i] - 10) / 4.6));
      doc.text(safePdfText(col.label, approxChars), x, headerY + 13);
      x += colWidths[i];
    });

    return headerY + 20;
  };

  let y = drawHeader();

  if (rows.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('No matching records found.', marginX, y + 22);
  } else {
    rows.forEach((row, idx) => {
      if (y > pageHeight - 44) {
        doc.addPage();
        y = drawHeader();
      }
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, y, tableWidth, 18, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      let x = marginX + 6;
      columns.forEach((col, i) => {
        const raw = typeof col.value === 'function' ? col.value(row) : row?.[col.key];
        const approxChars = Math.max(4, Math.floor((colWidths[i] - 10) / 4.2));
        doc.text(safePdfText(raw ?? '—', approxChars), x, y + 12);
        x += colWidths[i];
      });
      y += 18;
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Rise Her · Generation Rise Foundation · Page ${p} of ${pageCount}`,
      marginX,
      pageHeight - 18
    );
  }

  return doc;
}

export function exportAcademicReportPdf({
  activeTab,
  records = [],
  moduleRows = [],
  yearSummaries = []
}) {
  const dateStamp = new Date().toISOString().slice(0, 10);

  if (activeTab === 'modules') {
    const doc = buildTablePdfDoc({
      title: 'Academic Results · All Modules & Credits Report',
      subtitle: `Generated ${dateStamp} · ${moduleRows.length} module row(s)`,
      columns: [
        { label: 'Scholar', weight: 1.5, value: (r) => r.beneficiary_name },
        { label: 'Campus', weight: 0.9, value: (r) => r.campus },
        { label: 'Combo', weight: 0.8, value: (r) => r.combination },
        { label: 'Year', weight: 0.7, value: (r) => r.year_level },
        { label: 'Semester', weight: 0.9, value: (r) => r.term },
        { label: 'Module', weight: 0.9, value: (r) => r.module_code },
        { label: 'Title', weight: 1.4, value: (r) => r.module_name || '—' },
        { label: 'Credits', weight: 0.6, value: (r) => r.credits },
        { label: 'Marks', weight: 0.8, value: (r) => `${Number(r.marks).toFixed(2)}` },
        { label: 'Grade', weight: 0.6, value: (r) => r.aggregate },
        { label: 'Verdict', weight: 1.2, value: (r) => r.verdict }
      ],
      rows: moduleRows
    });
    doc.save(`academic-results-modules-${dateStamp}.pdf`);
    return;
  }

  if (activeTab === 'years') {
    const doc = buildTablePdfDoc({
      title: 'Academic Results · Year Averages Report',
      subtitle: `Generated ${dateStamp} · ${yearSummaries.length} study year summary row(s)`,
      columns: [
        { label: 'Scholar', weight: 1.6, value: (y) => y.beneficiary_name },
        { label: 'Study Year', weight: 0.9, value: (y) => y.year_level },
        { label: 'Academic Year', weight: 1.0, value: (y) => y.academic_year },
        { label: 'Campus / Combo', weight: 1.3, value: (y) => `${y.campus || '—'} · ${y.combination || '—'}` },
        { label: 'Semesters', weight: 1.4, value: (y) => y.semesterTerms?.join(' + ') || y.semesterCount },
        { label: 'Modules', weight: 0.7, value: (y) => y.moduleCount },
        { label: 'Total Credits', weight: 0.9, value: (y) => y.totalCredits },
        { label: 'Year Avg', weight: 0.8, value: (y) => `${y.averageScore.toFixed(2)}%` },
        { label: 'Grade', weight: 0.6, value: (y) => y.overallAggregate },
        { label: 'Year Verdict', weight: 1.3, value: (y) => y.yearVerdict }
      ],
      rows: yearSummaries
    });
    doc.save(`academic-year-averages-${dateStamp}.pdf`);
    return;
  }

  const doc = buildTablePdfDoc({
    title: 'Academic Results · Transcripts Report',
    subtitle: `Generated ${dateStamp} · ${records.length} transcript(s)`,
    columns: [
      { label: 'Scholar', weight: 1.6, value: (r) => r.beneficiary_name || 'Scholar' },
      { label: 'Campus', weight: 0.9, value: (r) => r.campus || '—' },
      { label: 'Combo', weight: 0.8, value: (r) => r.combination || '—' },
      { label: 'Year', weight: 0.7, value: (r) => r.year_level || '—' },
      { label: 'Ac. Year', weight: 0.9, value: (r) => r.academic_year },
      { label: 'Semester', weight: 0.9, value: (r) => r.term },
      { label: 'Modules', weight: 0.7, value: (r) => (r.modules || []).length },
      { label: 'Credits', weight: 0.7, value: (r) => r.total_credits ?? 0 },
      { label: 'Average', weight: 0.8, value: (r) => `${Number(r.average_score ?? 0).toFixed(2)}%` },
      { label: 'Grade', weight: 0.6, value: (r) => r.overall_aggregate },
      { label: 'Verdict', weight: 1.2, value: (r) => r.verdict },
      { label: 'Status', weight: 0.8, value: (r) => r.status }
    ],
    rows: records
  });
  doc.save(`academic-results-report-${dateStamp}.pdf`);
}

export function exportAssistancePdf(records = []) {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const totalAmount = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const doc = buildTablePdfDoc({
    title: 'Financial Support & Stipend Disbursements',
    subtitle: `Generated ${dateStamp} · ${records.length} disbursement(s) · Total: ${totalAmount.toLocaleString()} RWF`,
    columns: [
      { label: 'Scholar', weight: 1.5, value: (r) => r.beneficiary_name },
      { label: 'Institution', weight: 1.3, value: (r) => r.beneficiary_university || 'University of Rwanda' },
      { label: 'Support Type', weight: 1.4, value: (r) => r.support_type },
      { label: 'Amount', weight: 1.0, value: (r) => `${Number(r.amount || 0).toLocaleString()} ${r.currency || 'RWF'}` },
      { label: 'Method', weight: 1.1, value: (r) => r.disbursement_method || 'MTN Mobile Money' },
      { label: 'Reference', weight: 1.1, value: (r) => r.reference_number || '—' },
      { label: 'Date', weight: 0.8, value: (r) => r.support_date || '—' },
      { label: 'Status', weight: 0.8, value: (r) => r.status || 'Disbursed' }
    ],
    rows: records
  });
  doc.save(`support-disbursements-${dateStamp}.pdf`);
}

export function exportProgramReportsPdf(reports = []) {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const doc = buildTablePdfDoc({
    title: 'Rise Her Program · Scholar Reports Summary',
    subtitle: `Generated ${dateStamp} · ${reports.length} report(s)`,
    columns: [
      { label: 'Scholar', weight: 1.4, value: (r) => r.beneficiary_name || 'Scholar' },
      { label: 'Report Title', weight: 1.8, value: (r) => r.title },
      { label: 'PDF Attachment', weight: 1.5, value: (r) => (r.attachments || []).map((f) => f.file_name).join(', ') || 'Summary only' },
      { label: 'Status', weight: 0.8, value: (r) => r.status || 'Pending' },
      { label: 'Submitted', weight: 0.9, value: (r) => (r.created_at ? new Date(r.created_at).toLocaleDateString() : '—') },
      { label: 'Staff Feedback', weight: 1.8, value: (r) => r.staff_feedback || '—' }
    ],
    rows: reports
  });
  doc.save(`program-reports-${dateStamp}.pdf`);
}

export function createSingleReportPdfBlobUrl(report) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const marginX = 44;
  const maxWidth = doc.internal.pageSize.getWidth() - marginX * 2;
  let y = 52;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138);
  doc.text('RISE HER · GENERATION RISE FOUNDATION · SCHOLAR REPORT', marginX, y);
  y += 22;

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(report?.title || 'Progress Report', maxWidth);
  doc.text(titleLines, marginX, y);
  y += titleLines.length * 20 + 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const submitted = report?.created_at ? new Date(report.created_at).toLocaleDateString() : '—';
  doc.text(`Scholar: ${report?.beneficiary_name || 'Scholar'}   |   Status: ${report?.status || 'Pending'}   |   Date: ${submitted}`, marginX, y);
  y += 22;

  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, y, marginX + maxWidth, y);
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  const contentLines = doc.splitTextToSize(report?.content || 'No additional notes.', maxWidth);
  contentLines.forEach((line) => {
    if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = 48;
    }
    doc.text(line, marginX, y);
    y += 16;
  });

  if (report?.staff_feedback) {
    y += 16;
    if (y > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage();
      y = 48;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    doc.text('STAFF FEEDBACK', marginX, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const fbLines = doc.splitTextToSize(report.staff_feedback, maxWidth);
    fbLines.forEach((line) => {
      if (y > doc.internal.pageSize.getHeight() - 50) {
        doc.addPage();
        y = 48;
      }
      doc.text(line, marginX, y);
      y += 15;
    });
  }

  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}
