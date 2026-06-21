import jsPDF from 'jspdf'

export interface ConsultationReportData {
  patientName: string
  age: number
  gender: string
  chiefComplaint: string
  consultationDate: string
  questions: Array<{
    question: string
    answer: string
  }>
  clinicalSummary: string
  aiRecommendation: string
  physicianReview: string
  finalStatus: string
}

export async function generateConsultationPDF(
  data: ConsultationReportData,
  fileName: string = 'clinical-report.pdf'
): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    let y = 20

    // Helper to print text and handle page breaks
    const addText = (text: string, fontSize: number, isBold: boolean, color: [number, number, number] = [0, 0, 0], spacingAfter: number = 5) => {
      doc.setFont('Helvetica', isBold ? 'bold' : 'normal')
      doc.setFontSize(fontSize)
      doc.setTextColor(color[0], color[1], color[2])

      const lines = doc.splitTextToSize(text || '', contentWidth)
      
      // Check if we need a new page
      const blockHeight = lines.length * (fontSize * 0.352) + spacingAfter // Convert pt to mm
      if (y + blockHeight > pageHeight - margin) {
        doc.addPage()
        y = margin
      }

      doc.text(lines, margin, y)
      y += lines.length * (fontSize * 0.352) + spacingAfter
    }

    // Header
    addText("Clinical AI Orientation Report", 22, true, [30, 64, 175], 2)
    addText("AI-Assisted Clinical Workflow System", 10, false, [107, 114, 128], 10)

    // Divider Line
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    // Patient Information Section
    addText("Patient Information", 14, true, [30, 64, 175], 6)
    
    addText(`Name: ${data.patientName}`, 11, false, [0, 0, 0], 3)
    addText(`Age: ${data.age} years`, 11, false, [0, 0, 0], 3)
    addText(`Gender: ${data.gender}`, 11, false, [0, 0, 0], 3)
    addText(`Date: ${data.consultationDate}`, 11, false, [0, 0, 0], 3)
    addText(`Chief Complaint: ${data.chiefComplaint}`, 11, false, [0, 0, 0], 8)

    // Interview Questions Section
    addText("Patient Interview Summary", 14, true, [30, 64, 175], 6)
    if (data.questions && data.questions.length > 0) {
      data.questions.forEach((q, idx) => {
        addText(`Q${idx + 1}: ${q.question}`, 10, true, [15, 23, 42], 2)
        addText(`A: ${q.answer}`, 10, false, [71, 85, 105], 4)
      })
    } else {
      addText("No questions answered.", 10, false, [107, 114, 128], 4)
    }
    y += 4

    // Clinical Summary
    addText("Clinical Summary", 14, true, [30, 64, 175], 6)
    addText(data.clinicalSummary, 10, false, [0, 0, 0], 8)

    // AI Recommendation
    addText("AI Recommendation", 14, true, [30, 64, 175], 6)
    addText(data.aiRecommendation, 10, false, [0, 0, 0], 8)

    // Physician Review
    addText("Physician Review & Treatment Plan", 14, true, [30, 64, 175], 6)
    addText(data.physicianReview, 10, false, [0, 0, 0], 8)

    // Status
    addText(`Final Status: ${data.finalStatus}`, 12, true, [5, 150, 105], 10)

    // Footer Disclaimer
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    addText("⚠️ DISCLAIMER: This system does not replace a medical consultation.", 9, true, [239, 68, 68], 2)
    addText("All recommendations should be validated by qualified healthcare professionals.", 9, false, [107, 114, 128], 4)
    addText(`Generated on: ${new Date().toLocaleString()}`, 8, false, [156, 163, 175], 0)

    doc.save(fileName)
  } catch (error) {
    console.error('[App] PDF generation error:', error)
    throw new Error('Failed to generate PDF')
  }
}
