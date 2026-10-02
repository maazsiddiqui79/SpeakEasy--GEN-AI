import { SpeechAnalysis, RecoverySuggestion } from '@/types/speech';
import { SessionExchange } from '@/types/session';

interface PDFReportData {
  mode: string;
  topic?: string;
  transcript?: string;
  aiFeedback?: string;
  speechAnalysis?: SpeechAnalysis;
  suggestions?: RecoverySuggestion[];
  exchanges?: SessionExchange[];
}

export async function generatePDFReport(data: PDFReportData) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  let yPos = 20;
  const margin = 20;
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  const checkPageBreak = (height: number) => {
    if (yPos + height > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('Speak Easy', margin, yPos);
  
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(`${data.mode} - Performance Report`, margin, yPos + 8);
  yPos += 25;
  doc.setTextColor(0, 0, 0);

  if (data.topic) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Topic:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    const topicLines = doc.splitTextToSize(data.topic, pageWidth - margin * 2 - 20);
    doc.text(topicLines, margin + 20, yPos);
    yPos += (topicLines.length * 6) + 10;
  }

  // Pressure Mode style report
  if (data.transcript) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Your Response:', margin, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const transcriptLines = doc.splitTextToSize(data.transcript, pageWidth - margin * 2);
    doc.text(transcriptLines, margin, yPos);
    yPos += (transcriptLines.length * 6) + 10;
  }

  if (data.aiFeedback) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Feedback & Recommendations:', margin, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    // Strip markdown bold/italic asterisks for PDF
    const cleanFeedback = data.aiFeedback.replace(/[*#_]/g, '');
    const feedbackLines = doc.splitTextToSize(cleanFeedback, pageWidth - margin * 2);
    doc.text(feedbackLines, margin, yPos);
    yPos += (feedbackLines.length * 6) + 10;
  }

  if (data.speechAnalysis) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Speech Analysis:', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const stats = [
      `Overall Score: ${data.speechAnalysis.overallScore}/100`,
      `Words Per Minute: ${data.speechAnalysis.pacing.wordsPerMinute} (Ideal: 120-160)`,
      `Total Pauses: ${data.speechAnalysis.pacing.pauses.length}`,
      `Filler Words: ${data.speechAnalysis.fillers.totalCount} used`
    ];

    stats.forEach(stat => {
      checkPageBreak(10);
      doc.text(`• ${stat}`, margin + 5, yPos);
      yPos += 6;
    });
    yPos += 5;
  }

  if (data.suggestions && data.suggestions.length > 0) {
    checkPageBreak(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Areas for Improvement:', margin, yPos);
    yPos += 8;

    doc.setFontSize(11);
    data.suggestions.forEach(sug => {
      checkPageBreak(15);
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${sug.type}:`, margin + 5, yPos);
      doc.setFont('helvetica', 'normal');
      const sugText = `${sug.explanation} (e.g., "${sug.problematicText}"). Try: "${sug.suggestedPhrase}"`;
      const sugLines = doc.splitTextToSize(sugText, pageWidth - margin * 2 - 25);
      doc.text(sugLines, margin + 25, yPos);
      yPos += (sugLines.length * 6) + 4;
    });
    yPos += 5;
  }

  // Conversation style report (Opposite / Document Interview)
  if (data.exchanges && data.exchanges.length > 0) {
    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Interview Transcript & Mistakes:', margin, yPos);
    yPos += 10;

    data.exchanges.forEach(ex => {
      checkPageBreak(20);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(ex.role === 'ai' ? 'Interviewer / Coach:' : 'You:', margin, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      const cleanContent = ex.content.replace(/[*#_]/g, '');
      const contentLines = doc.splitTextToSize(cleanContent, pageWidth - margin * 2);
      
      contentLines.forEach((line: string) => {
        checkPageBreak(10);
        doc.text(line, margin, yPos);
        yPos += 6;
      });
      yPos += 4;

      if (ex.role === 'user' && ex.suggestions && ex.suggestions.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 0, 0);
        ex.suggestions.forEach(sug => {
          checkPageBreak(10);
          const sugText = `Mistake (${sug.type}): ${sug.explanation} - Try: "${sug.suggestedPhrase}"`;
          const sugLines = doc.splitTextToSize(sugText, pageWidth - margin * 2 - 10);
          doc.text(sugLines, margin + 10, yPos);
          yPos += (sugLines.length * 6);
        });
        doc.setTextColor(0, 0, 0);
        yPos += 4;
      }
    });
  }

  doc.save(`SpeakEasy_${data.mode}_Report.pdf`);
}
