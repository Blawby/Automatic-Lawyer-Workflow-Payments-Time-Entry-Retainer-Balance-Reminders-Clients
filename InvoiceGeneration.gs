// ========== INVOICE GENERATION ==========
function generateInvoices() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = getSheets(ss);
  const data = loadSheetData(sheets);
  const settings = loadSettings(sheets.settingsSheet);
  
  const lawyerData = buildLawyerMaps(data.lawyers);
  const clientsById = buildClientMap(data.clientData);
  
  // Get last invoice date from settings
  const lastInvoiceDate = new Date(settings.lastInvoiceDate || "2000-01-01");
  const today = new Date();
  
  // Generate invoices for each client
  for (const [clientID, row] of Object.entries(clientsById)) {
    const email = row[0];
    const clientName = row[1] || "Client";
    
    // Get time logs for this client since last invoice
    const clientTimeLogs = data.timeLogs.filter(log => {
      const logDate = new Date(log[0]);
      return log[1] === email && logDate > lastInvoiceDate;
    });
    
    if (clientTimeLogs.length === 0) continue;
    
    // Group time logs by matter
    const matterTimeLogs = {};
    for (const log of clientTimeLogs) {
      const matterID = log[2] || "General";
      if (!matterTimeLogs[matterID]) {
        matterTimeLogs[matterID] = [];
      }
      matterTimeLogs[matterID].push(log);
    }
    
    // Calculate totals for each matter
    const matterTotals = {};
    for (const [matterID, logs] of Object.entries(matterTimeLogs)) {
      let totalHours = 0;
      let totalAmount = 0;
      
      for (const log of logs) {
        const hours = parseFloat(log[4]) || 0;
        const lawyerID = log[3];
        const rate = lawyerData.rates[lawyerID] || 0;
        
        totalHours += hours;
        totalAmount += hours * rate;
      }
      
      matterTotals[matterID] = {
        hours: totalHours,
        amount: totalAmount
      };
    }
    
    // Create invoice
    const invoiceID = generateInvoiceID();
    const invoiceDate = today.toISOString().split('T')[0];
    
    const invoiceRow = [
      invoiceID,
      clientID,
      email,
      clientName,
      invoiceDate,
      JSON.stringify(matterTotals),
      Object.values(matterTotals).reduce((sum, m) => sum + m.amount, 0),
      "Pending"
    ];
    
    sheets.invoicesSheet.appendRow(invoiceRow);
    
    // Send invoice email
    sendInvoiceEmail(
      email,
      clientName,
      invoiceID,
      invoiceDate,
      matterTotals,
      lawyerData
    );
  }
  
  // Update last invoice date
  updateLastInvoiceDate(sheets.settingsSheet, today);
}

function generateInvoiceID() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}-${random}`;
}

function sendInvoiceEmail(email, clientName, invoiceID, invoiceDate, matterTotals, lawyerData) {
  const subject = `Invoice ${invoiceID} - Blawby`;
  
  let body = `Dear ${clientName},\n\n`;
  body += `Please find attached your invoice ${invoiceID} dated ${invoiceDate}.\n\n`;
  body += "Summary of Services:\n\n";
  
  let totalAmount = 0;
  for (const [matterID, totals] of Object.entries(matterTotals)) {
    const matter = getMatterDetails(matterID);
    body += `Matter: ${matter.description}\n`;
    body += `Hours: ${totals.hours.toFixed(2)}\n`;
    body += `Amount: $${totals.amount.toFixed(2)}\n\n`;
    totalAmount += totals.amount;
  }
  
  body += `Total Amount: $${totalAmount.toFixed(2)}\n\n`;
  body += "Thank you for your business.\n\n";
  body += "Best regards,\nThe Blawby Team";
  
  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body
  });
}

function getMatterDetails(matterID) {
  if (matterID === "General") {
    return { description: "General Legal Services" };
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mattersSheet = ss.getSheetByName(SHEET_NAMES.MATTERS);
  const matters = mattersSheet.getDataRange().getValues();
  
  const matter = matters.find(m => m[0] === matterID);
  return matter ? {
    description: matter[3] || "Legal Services"
  } : { description: "Legal Services" };
}

function updateLastInvoiceDate(settingsSheet, date) {
  const settings = settingsSheet.getDataRange().getValues();
  const lastInvoiceRow = settings.findIndex(row => row[0] === "last_invoice_date");
  
  if (lastInvoiceRow === -1) {
    settingsSheet.appendRow(["last_invoice_date", date.toISOString().split('T')[0]]);
  } else {
    settingsSheet.getRange(lastInvoiceRow + 1, 2).setValue(date.toISOString().split('T')[0]);
  }
} 