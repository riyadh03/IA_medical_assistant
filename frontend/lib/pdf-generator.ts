import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
    // Create a temporary div to hold the report content
    const reportDiv = document.createElement('div')
    reportDiv.style.width = '210mm' // A4 width
    reportDiv.style.padding = '20mm'
    reportDiv.style.backgroundColor = 'white'
    reportDiv.style.color = '#000'
    reportDiv.style.fontFamily = 'Arial, sans-serif'
    reportDiv.style.position = 'absolute'
    reportDiv.style.left = '-9999px'

    // Generate HTML content
    reportDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">
        <h1 style="margin: 0; color: #1e40af; font-size: 28px;">Clinical Orientation Report</h1>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">AI-Assisted Clinical Workflow System</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 10px;">Patient Information</h2>
        <table style="width: 100%; font-size: 13px; line-height: 1.8;">
          <tr>
            <td style="width: 50%; padding-right: 10px;"><strong>Name:</strong> ${data.patientName}</td>
            <td style="width: 50%;"><strong>Age:</strong> ${data.age} years</td>
          </tr>
          <tr>
            <td style="width: 50%; padding-right: 10px;"><strong>Gender:</strong> ${data.gender}</td>
            <td style="width: 50%;"><strong>Consultation Date:</strong> ${data.consultationDate}</td>
          </tr>
          <tr>
            <td colspan="2"><strong>Chief Complaint:</strong> ${data.chiefComplaint}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 10px;">Patient Interview Summary</h2>
        <div style="font-size: 13px; line-height: 1.6;">
          ${data.questions
            .map(
              (q, idx) => `
            <p style="margin-bottom: 12px;">
              <strong>Q${idx + 1}: ${q.question}</strong><br/>
              <span style="color: #555; margin-left: 10px;">A: ${q.answer}</span>
            </p>
          `
            )
            .join('')}
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 10px;">Clinical Summary</h2>
        <p style="font-size: 13px; line-height: 1.6; color: #333; background-color: #f9fafb; padding: 10px; border-left: 3px solid #1e40af;">
          ${data.clinicalSummary}
        </p>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 10px;">AI Recommendation</h2>
        <p style="font-size: 13px; line-height: 1.6; color: #333; background-color: #fff8e6; padding: 10px; border-left: 3px solid #f59e0b;">
          ${data.aiRecommendation}
        </p>
      </div>

      <div style="margin-bottom: 20px;">
        <h2 style="color: #1e40af; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 10px;">Physician Review</h2>
        <p style="font-size: 13px; line-height: 1.6; color: #333; background-color: #f0fdf4; padding: 10px; border-left: 3px solid #22c55e;">
          ${data.physicianReview}
        </p>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="color: #1e40af; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 10px;">Final Status</h2>
        <p style="font-size: 14px; font-weight: bold; color: #059669; background-color: #d1fae5; padding: 12px; border-radius: 4px; text-align: center;">
          ${data.finalStatus}
        </p>
      </div>

      <div style="border-top: 2px solid #ddd; padding-top: 15px; margin-top: 30px; font-size: 11px; color: #999; text-align: center;">
        <p style="margin: 0;">
          <strong>⚠️ DISCLAIMER:</strong> This system does not replace a medical consultation. 
          All recommendations should be validated by qualified healthcare professionals.
        </p>
        <p style="margin: 5px 0 0 0;">Generated on: ${new Date().toLocaleString()}</p>
      </div>
    `

    document.body.appendChild(reportDiv)

    // Convert HTML to canvas
    const canvas = await html2canvas(reportDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    // Remove temporary div
    document.body.removeChild(reportDiv)

    // Create PDF from canvas
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const imgData = canvas.toDataURL('image/png')
    const pageHeight = pdf.internal.pageSize.getHeight()
    const pageWidth = pdf.internal.pageSize.getWidth()

    // Calculate dimensions to fit A4
    const imgHeight = (canvas.height * pageWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0

    // Add pages as needed
    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Download PDF
    pdf.save(fileName)
  } catch (error) {
    console.error('[v0] PDF generation error:', error)
    throw new Error('Failed to generate PDF')
  }
}
