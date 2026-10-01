import { RecoverySuggestion, SpeechAnalysis } from '@/types/speech';
import { SessionExchange } from '@/types/session';

export interface PdfReportData {
  mode: string;
  subject: string;
  analysis: SpeechAnalysis;
  suggestions: RecoverySuggestion[];
  positiveMessage: string;
  focusArea: string;
  exchanges: SessionExchange[];
}

/** Creates a selectable, text-based PDF. It never screenshots or prints the page. */
export async function downloadPdfReport(data: PdfReportData) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 22;
  let page = 1;
  const footer = () => {
    pdf.setDrawColor(220, 225, 230);
    pdf.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    pdf.setFontSize(8); pdf.setTextColor(105, 115, 125);
    pdf.text('Speak Easy AI - Confidential practice report', margin, pageHeight - 8);
    pdf.text(`Page ${page}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  };
  const nextPage = () => { footer(); pdf.addPage(); page += 1; y = 20; };
  const ensure = (height: number) => { if (y + height > pageHeight - 20) nextPage(); };
  const heading = (text: string) => {
    ensure(12); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.setTextColor(25, 85, 105);
    pdf.text(text, margin, y); y += 8;
  };
  const paragraph = (text: string, indent = 0) => {
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(40, 45, 52);
    const lines = pdf.splitTextToSize(text.replace(/\s+/g, ' ').trim(), contentWidth - indent);
    ensure(lines.length * 5 + 3); pdf.text(lines, margin + indent, y); y += lines.length * 5 + 3;
  };
  const row = (label: string, value: string) => {
    ensure(8); pdf.setFillColor(245, 248, 250); pdf.roundedRect(margin, y - 4, contentWidth, 7, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(45, 65, 75); pdf.text(label, margin + 3, y);
    pdf.setFont('helvetica', 'normal'); pdf.text(value, margin + 58, y); y += 9;
  };
  pdf.setFillColor(20, 184, 166); pdf.rect(0, 0, pageWidth, 10, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(21); pdf.setTextColor(20, 184, 166); pdf.text('Speak Easy AI', margin, y); y += 9;
  pdf.setFontSize(16); pdf.setTextColor(30, 35, 43); pdf.text('Speech Practice Analysis', margin, y); y += 10;
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(105, 115, 125); pdf.text(`Generated ${new Date().toLocaleString()}`, margin, y); y += 11;
  heading('Session overview');
  row('Practice mode', data.mode); row('Topic / document', data.subject || 'Not specified'); row('Overall score', `${data.analysis.overallScore}/100`);
  row('Words spoken', String(data.analysis.pacing.totalWords)); row('Speaking pace', `${data.analysis.pacing.wordsPerMinute} words per minute (${data.analysis.pacing.rating})`);
  heading('Performance breakdown');
  row('Fluency', `${data.analysis.fluencyScore}/100`); row('Clarity', `${data.analysis.clarityScore}/100`); row('Relevance', `${data.analysis.relevanceScore}/100`);
  row('Filler words', String(data.analysis.fillers.totalCount)); row('Fumbling incidents', String(data.analysis.fumbling.totalCount)); row('Vague wording', String(data.analysis.weakWords.totalCount));
  heading('Key feedback');
  if (data.positiveMessage) paragraph(data.positiveMessage);
  if (data.focusArea) paragraph(data.focusArea);
  if (!data.positiveMessage && !data.focusArea) paragraph('Continue practicing clear, structured answers and deliberate pacing.');
  heading('Recommended improvements');
  if (data.suggestions.length === 0) paragraph('No critical recovery suggestions were recorded for this response.');
  else data.suggestions.forEach((suggestion, index) => paragraph(`${index + 1}. ${suggestion.explanation} Recovery: ${suggestion.technique} Try instead: ${suggestion.suggestedPhrase}`));
  heading('Conversation transcript');
  if (data.exchanges.length === 0) paragraph('No conversation entries were recorded.');
  else data.exchanges.forEach((exchange) => paragraph(`${exchange.role === 'ai' ? 'AI interviewer' : 'You'}: ${exchange.content.replace(/[*#|]/g, '')}`));
  footer(); pdf.save(`speak-easy-analysis-${Date.now()}.pdf`);
}
