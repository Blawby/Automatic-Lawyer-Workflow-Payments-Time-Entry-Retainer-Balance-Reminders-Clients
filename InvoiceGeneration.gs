// ========== INVOICE GENERATION ==========
function setupInvoiceSheet(invoicesSheet) {
  const headers = [
    "Month",
    "Client Email",
    "Client Name",
    "Total Hours",
    "Total Used ($)",
    "Lawyers Involved",
    "Generated At",
    "Currency",
    "Trust Account",
    "Client Ref",
    "UUID",
    "Invoice ID",
    "Client ID",
    "Invoice Date",
    "Matter Totals",
    "Total Amount",
    "Status"
  ];
  
  // Clear existing headers and set new ones
  invoicesSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format headers
  const headerRange = invoicesSheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#f3f3f3");
  
  // Auto-resize columns
  for (let i = 1; i <= headers.length; i++) {
    invoicesSheet.autoResizeColumn(i);
  }
  
  // Freeze header row
  invoicesSheet.setFrozenRows(1);
}

function generateInvoices() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = getSheets(ss);
  const data = loadSheetData(sheets);
  const settings = loadSettings(sheets.settingsSheet);
  
  // Ensure invoice sheet is properly set up
  setupInvoiceSheet(sheets.invoicesSheet);
  
  const lawyerData = buildLawyerMaps(data.lawyers);
  const clientsById = buildClientMap(data.clientData);
  
  // Get last invoice date from the most recent invoice
  const lastInvoiceDate = getLastInvoiceDate(sheets.invoicesSheet);
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
    
    // Group time logs by matter and lawyer
    const matterTimeLogs = {};
    for (const log of clientTimeLogs) {
      const matterID = log[2] || "General";
      const lawyerID = log[3];
      
      if (!matterTimeLogs[matterID]) {
        matterTimeLogs[matterID] = {};
      }
      if (!matterTimeLogs[matterID][lawyerID]) {
        matterTimeLogs[matterID][lawyerID] = [];
      }
      matterTimeLogs[matterID][lawyerID].push(log);
    }
    
    // Calculate totals for each matter and lawyer
    const matterTotals = {};
    const lawyersInvolved = new Set();
    
    for (const [matterID, lawyerLogs] of Object.entries(matterTimeLogs)) {
      matterTotals[matterID] = {
        hours: 0,
        amount: 0,
        lawyers: []
      };
      
      for (const [lawyerID, logs] of Object.entries(lawyerLogs)) {
        let lawyerHours = 0;
        let lawyerAmount = 0;
        
        for (const log of logs) {
          const hours = parseFloat(log[4]) || 0;
          const rate = lawyerData.rates[lawyerID] || 0;
          
          lawyerHours += hours;
          lawyerAmount += hours * rate;
        }
        
        const lawyerName = lawyerData.emails[lawyerID] || "Unknown Lawyer";
        lawyersInvolved.add(lawyerName);
        
        matterTotals[matterID].lawyers.push({
          name: lawyerName,
          hours: lawyerHours,
          amount: lawyerAmount
        });
        
        matterTotals[matterID].hours += lawyerHours;
        matterTotals[matterID].amount += lawyerAmount;
      }
    }
    
    // Create invoice
    const invoiceID = generateInvoiceID();
    const invoiceDate = today.toISOString().split('T')[0];
    const month = invoiceDate.substring(0, 7); // YYYY-MM format
    
    const totalAmount = Object.values(matterTotals).reduce((sum, m) => sum + m.amount, 0);
    const totalHours = Object.values(matterTotals).reduce((sum, m) => sum + m.hours, 0);
    
    const invoiceRow = new Array(Object.keys(INVOICE_COLUMNS).length).fill('');
    invoiceRow[INVOICE_COLUMNS.MONTH] = month;
    invoiceRow[INVOICE_COLUMNS.CLIENT_EMAIL] = email;
    invoiceRow[INVOICE_COLUMNS.CLIENT_NAME] = clientName;
    invoiceRow[INVOICE_COLUMNS.TOTAL_HOURS] = totalHours;
    invoiceRow[INVOICE_COLUMNS.TOTAL_USED] = totalAmount;
    invoiceRow[INVOICE_COLUMNS.LAWYERS_INVOLVED] = Array.from(lawyersInvolved).join(", ");
    invoiceRow[INVOICE_COLUMNS.GENERATED_AT] = today.toISOString();
    invoiceRow[INVOICE_COLUMNS.CURRENCY] = settings[SETTINGS_KEYS.DEFAULT_CURRENCY];
    invoiceRow[INVOICE_COLUMNS.TRUST_ACCOUNT] = "Yes";
    invoiceRow[INVOICE_COLUMNS.CLIENT_REF] = "Trust-compliant via Stripe";
    invoiceRow[INVOICE_COLUMNS.UUID] = Utilities.getUuid();
    invoiceRow[INVOICE_COLUMNS.INVOICE_ID] = invoiceID;
    invoiceRow[INVOICE_COLUMNS.CLIENT_ID] = clientID;
    invoiceRow[INVOICE_COLUMNS.INVOICE_DATE] = invoiceDate;
    invoiceRow[INVOICE_COLUMNS.MATTER_TOTALS] = JSON.stringify(matterTotals);
    invoiceRow[INVOICE_COLUMNS.TOTAL_AMOUNT] = totalAmount;
    invoiceRow[INVOICE_COLUMNS.STATUS] = "Pending";
    
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
    body += `Total Hours: ${totals.hours.toFixed(2)}\n`;
    
    // Add breakdown by lawyer
    for (const lawyer of totals.lawyers) {
      const lawyerName = lawyer.name;
      body += `  ${lawyerName}: ${lawyer.hours.toFixed(2)} hours at $${lawyerData.rates[lawyerName]}/hour\n`;
    }
    
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

function getLastInvoiceDate(invoicesSheet) {
  const invoices = invoicesSheet.getDataRange().getValues();
  if (invoices.length <= 1) return new Date(0); // No invoices yet
  
  // Get the most recent invoice date
  const lastInvoice = invoices.slice(1).reduce((latest, current) => {
    const currentDate = new Date(current[4]); // Invoice date is in column E
    return currentDate > latest ? currentDate : latest;
  }, new Date(0));
  
  return lastInvoice;
} 