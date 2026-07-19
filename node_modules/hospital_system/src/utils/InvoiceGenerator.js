import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateInvoicePDF = (invoiceData, title = 'Invoice') => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(33, 150, 243); // Blue theme
  doc.text('Smart Hospital Management System', 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 105, 30, { align: 'center' });
  
  // Invoice Details
  doc.setFontSize(11);
  doc.text(`Invoice ID: ${invoiceData.id || 'N/A'}`, 14, 45);
  doc.text(`Date: ${new Date(invoiceData.created_at || Date.now()).toLocaleString()}`, 14, 52);
  doc.text(`Status: ${invoiceData.status || 'PAID'}`, 14, 59);
  doc.text(`Payment Method: ${invoiceData.payment_method || 'ONLINE'}`, 14, 66);
  
  if (invoiceData.payment_reference) {
    doc.text(`Transaction Ref: ${invoiceData.payment_reference}`, 14, 73);
  }

  // Items Table
  const tableColumn = ["Description", "Type", "Amount (USD)"];
  const tableRows = [];

  if (invoiceData.items && invoiceData.items.length > 0) {
    invoiceData.items.forEach(item => {
      const rowData = [
        item.description,
        item.type,
        `$${Number(item.amount).toFixed(2)}`
      ];
      tableRows.push(rowData);
    });
  } else {
    // Fallback if no items explicitly provided
    tableRows.push(['Total Amount', 'General', `$${Number(invoiceData.net_amount || invoiceData.total_amount).toFixed(2)}`]);
  }

  doc.autoTable({
    startY: 85,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [33, 150, 243] }
  });

  // Footer / Total
  const finalY = doc.lastAutoTable.finalY || 85;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Amount: $${Number(invoiceData.net_amount || invoiceData.total_amount).toFixed(2)}`, 14, finalY + 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Thank you for choosing Smart Hospital. This is a computer generated invoice.', 105, 280, { align: 'center' });

  // Save the PDF
  doc.save(`Invoice_${invoiceData.id || 'Receipt'}.pdf`);
};
