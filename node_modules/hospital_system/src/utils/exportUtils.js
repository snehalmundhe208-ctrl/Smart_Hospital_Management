import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import QRCode from 'qrcode';

export const exportToCSV = (data, filename) => {
  if (!data || !data.length) return;
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (title, columns, data, filename) => {
  if (!data || !data.length) return;
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  
  autoTable(doc, {
    startY: 36,
    head: [columns],
    body: data,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] } // Blue-600
  });
  
  doc.save(`${filename}.pdf`);
};

const hospitalHeader = async (doc, title, reference, qrText) => {
  doc.setFillColor(15, 118, 110);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(18, 17, 8, 'F');
  doc.setTextColor(15, 118, 110);
  doc.setFontSize(16);
  doc.text('+', 15.2, 22);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('NovaCare General Hospital', 31, 15);
  doc.setFontSize(9);
  doc.text('Compassionate care. Clear records.', 31, 22);
  doc.setFontSize(12);
  doc.text(title, 142, 15);
  doc.setFontSize(8);
  doc.text(reference, 142, 22);
  doc.setTextColor(30, 41, 59);
  
  if (qrText) {
    try {
      const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 0, scale: 4 });
      doc.addImage(qrDataUrl, 'PNG', 185, 8, 18, 18);
    } catch (e) {
      console.error('QR Code generation failed', e);
    }
  }
};

export const downloadInvoiceReceipt = async (invoice, patient = {}) => {
  const doc = new jsPDF();
  const receiptNumber = invoice.id?.slice(0, 8).toUpperCase() || 'PAYMENT';
  await hospitalHeader(doc, 'PAYMENT RECEIPT', `Receipt #${receiptNumber}`, `VERIFY:RCPT:${receiptNumber}`);
  doc.setFontSize(11);
  doc.text(`Patient: ${patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Patient'}`, 14, 47);
  doc.text(`Payment method: ${invoice.payment_method || 'Online payment'}`, 14, 54);
  doc.text(`Paid on: ${new Date(invoice.created_at || Date.now()).toLocaleString()}`, 14, 61);
  autoTable(doc, {
    startY: 70,
    head: [['Description', 'Type', 'Amount']],
    body: (invoice.items || []).map((item) => [item.description, item.type || 'Service', `$${Number(item.amount).toFixed(2)}`]),
    theme: 'grid',
    headStyles: { fillColor: [15, 118, 110] },
    styles: { fontSize: 9 },
  });
  const y = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(13);
  doc.text(`Total paid: $${Number(invoice.net_amount || invoice.total_amount || 0).toFixed(2)}`, 142, y);
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('This is a computer-generated receipt. Keep it for your records.', 14, 284);
  doc.save(`novacare-receipt-${receiptNumber}.pdf`);
};

export const downloadMedicalReport = async (report, patient = {}, labReports = []) => {
  const doc = new jsPDF();
  const reportNumber = report.report_number || `REPORT-${report.id?.slice(0, 8).toUpperCase() || 'NOVACARE'}`;
  await hospitalHeader(doc, 'MEDICAL REPORT', reportNumber, `VERIFY:MED:${reportNumber}`);
  const patientName = patient.name || `${report.patient_first_name || patient.first_name || ''} ${report.patient_last_name || patient.last_name || ''}`.trim();
  autoTable(doc, {
    startY: 42,
    body: [
      ['Patient Name', patientName || 'Patient', 'Age / Gender', `${patient.age || 'Not recorded'} / ${patient.gender || 'Not recorded'}`],
      ['Report Date', new Date(report.created_at || Date.now()).toLocaleDateString(), 'Department', report.department_name || report.specialization || 'General Medicine'],
      ['Doctor', `Dr. ${report.doctor_first_name || ''} ${report.doctor_last_name || ''}`.trim(), 'Follow-up Date', report.follow_up_date ? new Date(report.follow_up_date).toLocaleDateString() : 'As advised'],
    ],
    theme: 'grid',
    styles: { fontSize: 8.5 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: [240, 253, 250] }, 2: { fontStyle: 'bold', fillColor: [240, 253, 250] } },
  });
  let y = doc.lastAutoTable.finalY + 9;
  const sections = [
    ['Symptoms', report.symptoms || 'Not recorded'],
    ['Diagnosis', report.diagnosis || 'Not recorded'],
    ['Medical Findings', report.medical_findings || report.notes || 'Not recorded'],
    ['Conclusion', report.conclusion || 'Follow the treatment plan and attend follow-up as advised.'],
  ];
  sections.forEach(([label, value]) => {
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text(label, 14, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    const lines = doc.splitTextToSize(String(value), 180);
    doc.text(lines, 14, y + 5); y += (lines.length * 5) + 10;
  });
  if (labReports.length) {
    autoTable(doc, { startY: y, head: [['Test Results', 'Status']], body: labReports.map((item) => [item.test_name, item.status]), theme: 'grid', headStyles: { fillColor: [15, 118, 110] }, styles: { fontSize: 8 } });
    y = doc.lastAutoTable.finalY + 9;
  }
  autoTable(doc, { startY: y, head: [['Prescribed Medicine', 'Dosage', 'Frequency', 'Duration']], body: (report.items || []).map((item) => [item.medicine_name, item.dosage, item.frequency, item.duration]), theme: 'grid', headStyles: { fillColor: [15, 118, 110] }, styles: { fontSize: 8 } });
  y = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(10); doc.setFont('helvetica', 'italic'); doc.text(`Doctor Signature: Dr. ${report.doctor_first_name || ''} ${report.doctor_last_name || ''}`.trim(), 14, y);
  doc.setFontSize(8); doc.setTextColor(100); doc.text('NovaCare General Hospital | Confidential medical record | Generated electronically', 14, 284);
  doc.save(`novacare-medical-report-${reportNumber}.pdf`);
};

export const downloadMedicalCertificate = async (prescription, patient = {}, details = {}) => {
  const doc = new jsPDF();
  const certNumber = prescription?.report_number ? prescription.report_number.replace('NCR-', 'CERT-') : `CERT-${Date.now().toString().slice(-6)}`;
  
  // 1. Watermark
  doc.setGState(new doc.GState({ opacity: 0.03 }));
  doc.setFillColor(15, 118, 110);
  doc.circle(105, 148, 45, 'F');
  doc.rect(98, 118, 14, 60, 'F');
  doc.rect(75, 141, 60, 14, 'F');
  doc.setGState(new doc.GState({ opacity: 1 }));

  // 2. Borders
  doc.setDrawColor(15, 118, 110);
  doc.setLineWidth(1);
  doc.rect(8, 8, 194, 281);
  doc.setLineWidth(0.3);
  doc.rect(10, 10, 190, 277);

  // 3. Premium Header
  doc.setFillColor(15, 118, 110);
  doc.circle(28, 28, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('+', 23.5, 35.5);
  
  doc.setTextColor(15, 118, 110);
  doc.setFontSize(22);
  doc.text('NOVACARE', 45, 26);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('GENERAL HOSPITAL', 45, 33);
  
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('123 Health Avenue, Medical District, NY 10001', 45, 38);
  doc.text('Phone: +1 (555) 123-4567 | Email: contact@novacare.com | Web: www.novacare.com', 45, 42);
  doc.text('Hospital Reg No: NGH-2023-88741', 45, 46);

  // Certificate Title
  doc.setFillColor(15, 118, 110);
  doc.rect(10, 52, 190, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL MEDICAL CERTIFICATE', 105, 60, { align: 'center' });

  // 4. Certificate Details & QR
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Certificate No:', 15, 75);
  doc.text('Issue Date:', 15, 81);
  doc.text('Issue Time:', 15, 87);
  
  doc.setFont('helvetica', 'normal');
  doc.text(certNumber, 45, 75);
  doc.text(new Date(prescription.created_at || Date.now()).toLocaleDateString(), 45, 81);
  doc.text(new Date(prescription.created_at || Date.now()).toLocaleTimeString(), 45, 87);

  try {
    const qrDataUrl = await QRCode.toDataURL(`VERIFY:CERT:${certNumber}`, { margin: 0, scale: 3 });
    doc.addImage(qrDataUrl, 'PNG', 165, 70, 22, 22);
    doc.setFontSize(7);
    doc.text('Scan to Verify', 176, 95, { align: 'center' });
  } catch (e) {
    console.error(e);
  }

  // 5. Patient & Doctor Information (AutoTable)
  const patientName = patient.name || `${patient.first_name || prescription.patient_first_name || ''} ${patient.last_name || prescription.patient_last_name || ''}`.trim() || 'Not specified';
  const doctorName = `Dr. ${prescription.doctor_first_name || ''} ${prescription.doctor_last_name || prescription.doctor_name || 'NovaCare Physician'}`.trim();

  autoTable(doc, {
    startY: 100,
    body: [
      ['Patient Name', patientName, 'Doctor Name', doctorName],
      ['Patient ID', patient.patient_id || 'N/A', 'Department', prescription.department_name || 'General Medicine'],
      ['Age / Gender', `${patient.age || 'N/A'} / ${patient.gender || 'N/A'}`, 'Specialization', prescription.specialization || 'Consulting Physician'],
      ['Address', patient.address || 'N/A', 'Reg. Number', 'MCI-88329-XY'],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: { 
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [15, 118, 110], cellWidth: 35 },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [15, 118, 110], cellWidth: 35 },
      3: { cellWidth: 60 }
    },
  });

  let currentY = doc.lastAutoTable.finalY + 8;

  // 6. Medical Information Sections
  const addSection = (title, content) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110);
    doc.text(title, 15, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(content || 'Not recorded', 175);
    doc.text(lines, 15, currentY + 5);
    currentY += (lines.length * 5) + 6;
  };

  addSection('Diagnosis:', prescription.diagnosis || details.diagnosis);
  addSection('Medical Findings:', details.findings || prescription.notes);
  addSection('Treatment Summary:', details.treatment || 'Medication and rest advised as per prescription.');
  
  if (prescription.items && prescription.items.length > 0) {
    const meds = prescription.items.map(i => `${i.medicine_name} (${i.dosage}, ${i.frequency})`).join('; ');
    addSection('Prescribed Medicines:', meds);
  }

  const restDays = prescription.rest_days || details.restDays || 0;
  if (restDays > 0) {
    addSection('Rest Duration:', `Advised complete rest for ${restDays} days from ${new Date().toLocaleDateString()}.`);
  }

  addSection('Fitness Status:', details.fitnessStatus || 'Unfit for duty/travel during the rest period.');
  addSection('Follow-up Date:', details.followUp || 'As advised by the consulting physician.');

  // 7. Signature & Stamp Area
  currentY = Math.max(currentY + 15, 230);
  
  // Stamp
  doc.setDrawColor(15, 118, 110);
  doc.setLineWidth(0.5);
  doc.circle(50, currentY + 15, 18, 'S');
  doc.circle(50, currentY + 15, 17, 'S');
  doc.circle(50, currentY + 15, 10, 'S');
  doc.setTextColor(15, 118, 110);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('NOVACARE HOSPITAL', 50, currentY + 4, { align: 'center' });
  doc.text('OFFICIAL SEAL', 50, currentY + 28, { align: 'center' });
  doc.setFontSize(9);
  doc.text('VERIFIED', 50, currentY + 16, { align: 'center' });

  // Signature
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Digital Signature', 160, currentY, { align: 'center' });
  doc.setDrawColor(30, 41, 59);
  doc.line(130, currentY + 20, 190, currentY + 20);
  doc.text(doctorName, 160, currentY + 25, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Authorized Signatory', 160, currentY + 30, { align: 'center' });

  // 8. Footer
  doc.setFillColor(248, 250, 252);
  doc.rect(10, 272, 190, 15, 'F');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.text('DISCLAIMER: This certificate is electronically generated and is valid without a handwritten signature.', 105, 277, { align: 'center' });
  doc.text('For verification, scan the QR code or contact NovaCare administration at +1 (555) 123-4567.', 105, 281, { align: 'center' });
  doc.text(`Reference: ${certNumber}`, 105, 285, { align: 'center' });

  doc.save(`novacare-medical-certificate-${patientName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
};
