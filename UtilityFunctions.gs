// ========== UTILITY FUNCTIONS ==========
function getSheets(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  
  // Get or create each required sheet
  const sheets = {
    paymentsSheet: getOrCreateSheet(ss, "Payments"),
    clientsSheet: getOrCreateSheet(ss, "Clients"),
    timeLogsSheet: getOrCreateSheet(ss, "TimeLogs"),
    lawyersSheet: getOrCreateSheet(ss, "Lawyers"),
    lowBalanceSheet: getOrCreateSheet(ss, "LowBalanceWarnings"),
    invoicesSheet: getOrCreateSheet(ss, "Invoices"),
    mattersSheet: getOrCreateSheet(ss, "Matters")
  };
  
  return sheets;
}

function getOrCreateSheet(ss, sheetName) {
  if (!ss) {
    throw new Error("Spreadsheet object is required");
  }
  
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    console.log(`Created new sheet: ${sheetName}`);
  }
  return sheet;
}

function loadSheetData(sheets) {
  return {
    paymentData: sheets.paymentsSheet.getDataRange().getValues(),
    clientData: sheets.clientsSheet.getDataRange().getValues(),
    timeLogs: sheets.timeLogsSheet.getDataRange().getValues(),
    lawyers: sheets.lawyersSheet.getDataRange().getValues(),
    matters: sheets.mattersSheet.getDataRange().getValues()
  };
}

function loadSettings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const welcomeSheet = ss.getSheetByName("Welcome");
  if (!welcomeSheet) {
    throw new Error("Welcome sheet not found. Please run setupWelcomeSheet first.");
  }
  
  const settingsData = welcomeSheet.getRange(4, 1, 7, 4).getValues(); // Get settings from Welcome sheet
  const settings = { ...DEFAULT_SETTINGS }; // Start with defaults
  
  // Process each setting row
  for (const [key, value, description, defaultValue] of settingsData) {
    if (!key) continue;
    
    // Handle special case for Payment Link
    if (key === "Blawby Payment URL") {
      settings[SETTINGS_KEYS.BASE_PAYMENT_URL] = value;
      continue;
    }
    
    // Handle special case for Default Currency
    if (key === "Default Currency") {
      settings[SETTINGS_KEYS.DEFAULT_CURRENCY] = value.toUpperCase();
      continue;
    }
    
    // Handle boolean settings
    if (key === "Email Notifications") {
      settings[SETTINGS_KEYS.EMAIL_NOTIFICATIONS] = value.toLowerCase() === 'true';
      continue;
    }
    
    // Handle numeric settings
    if (key === "Low Balance Threshold") {
      settings[SETTINGS_KEYS.LOW_BALANCE_THRESHOLD] = parseInt(value) || 0;
      continue;
    }
    
    // Handle time settings
    if (key === "Daily Sync Time" || key === "Summary Email Time") {
      settings[key.toLowerCase().replace(/\s+/g, '_')] = value;
      continue;
    }
    
    // Handle other settings based on SETTINGS_KEYS
    const settingKey = Object.entries(SETTINGS_KEYS).find(([_, v]) => v === key)?.[1];
    if (settingKey) {
      settings[settingKey] = value;
    }
  }
  
  // Ensure required settings are present with defaults
  Object.entries(DEFAULT_SETTINGS).forEach(([key, defaultValue]) => {
    if (!settings[key]) {
      settings[key] = defaultValue;
    }
  });
  
  console.log('⚙️ Settings loaded:', settings);
  
  return settings;
}

function buildLawyerMaps(lawyers) {
  const rates = {};
  const emails = {};
  
  for (let i = 1; i < lawyers.length; i++) {
    const [lawyerID, , rate, email] = lawyers[i];
    if (!lawyerID) continue;
    
    rates[lawyerID] = parseFloat(rate) || 0;
    if (email) emails[lawyerID] = email;
  }
  
  return { rates, emails };
}

function buildClientMap(clientData) {
  const clientsById = {};
  
  for (let i = 1; i < clientData.length; i++) {
    const row = clientData[i];
    let clientID = row[9];
    
    if (!clientID) {
      clientID = Utilities.getUuid();
      row[9] = clientID;
    }
    
    clientsById[clientID] = row;
  }
  
  return clientsById;
}

function findClientByEmail(clientsById, email) {
  for (const [id, clientRow] of Object.entries(clientsById)) {
    if (clientRow[0] === email) return id;
  }
  return null;
}

function setupAllSheets(sheets) {
  // Setup welcome sheet first
  setupWelcomeSheet(SpreadsheetApp.getActiveSpreadsheet());
  
  // Setup each sheet with its specific headers and formatting
  setupPaymentsSheet(sheets.paymentsSheet);
  setupClientsSheet(sheets.clientsSheet);
  setupTimeLogsSheet(sheets.timeLogsSheet);
  setupLawyersSheet(sheets.lawyersSheet);
  setupLowBalanceSheet(sheets.lowBalanceSheet);
  setupInvoicesSheet(sheets.invoicesSheet);
  setupMattersSheet(sheets.mattersSheet);
}

function setupPaymentsSheet(sheet) {
  const headers = [
    "Date",
    "Client Email",
    "Amount",
    "Currency",
    "Status",
    "Receipt ID"
  ];
  
  setupSheet(sheet, headers);
}

function setupClientsSheet(sheet) {
  const headers = [
    "Email",
    "Name",
    "Target Balance",
    "Total Paid",
    "Total Hours",
    "Total Used",
    "Balance",
    "Top Up",
    "Payment Link",
    "Client ID"
  ];
  
  setupSheet(sheet, headers);
}

function setupTimeLogsSheet(sheet) {
  const headers = [
    "Date",
    "Client Email",
    "Matter ID",
    "Lawyer ID",
    "Hours"
  ];
  
  setupSheet(sheet, headers);
}

function setupLawyersSheet(sheet) {
  const headers = [
    "Email",
    "Name",
    "Rate",
    "Lawyer ID"
  ];
  
  setupSheet(sheet, headers);
}

function setupLowBalanceSheet(sheet) {
  const headers = [
    "Date",
    "Client Email",
    "Client Name",
    "Current Balance",
    "Target Balance",
    "Status",
    "Last Notification"
  ];
  
  setupSheet(sheet, headers);
}

function setupInvoicesSheet(sheet) {
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
  
  setupSheet(sheet, headers);
}

function setupMattersSheet(sheet) {
  const headers = [
    "Matter ID",
    "Client Email",
    "Client Name",
    "Description",
    "Date Created",
    "Status",
    "Case Value"
  ];
  
  setupSheet(sheet, headers);
}

function setupSheet(sheet, headers) {
  // Clear existing headers
  sheet.clear();
  
  // Add headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#f3f3f3')
             .setFontWeight('bold')
             .setHorizontalAlignment('center');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Get the actual number of rows (including header)
  const numRows = sheet.getLastRow();
  const numCols = headers.length;
  
  // Format header borders
  headerRange.setBorder(true, true, true, true, true, true);
  
  // Only format data rows if they exist
  if (numRows > 1) {
    const dataRange = sheet.getRange(2, 1, numRows - 1, numCols);
    
    // Add borders to data rows
    dataRange.setBorder(true, true, true, true, true, true);
    
    // Apply alternating colors to data rows
    dataRange.applyRowBanding();
    
    // Format date and currency columns
    headers.forEach((header, index) => {
      const col = index + 1;
      if (header.toLowerCase().includes('date')) {
        sheet.getRange(2, col, numRows - 1, 1).setNumberFormat('yyyy-mm-dd');
      } else if (header.toLowerCase().includes('amount') || 
                 header.toLowerCase().includes('balance') || 
                 header.toLowerCase().includes('rate') || 
                 header.toLowerCase().includes('total')) {
        sheet.getRange(2, col, numRows - 1, 1).setNumberFormat('$#,##0.00');
      }
    });
  }
}

function setupWelcomeSheet(ss) {
  const welcomeSheet = getOrCreateSheet(ss, "Welcome");
  
  // Clear existing content
  welcomeSheet.clear();
  
  // Set up the content
  const content = [
    ["Welcome to Blawby Retainer Management", "", "", ""],
    ["", "", "", ""],
    ["⚙️ System Settings", "", "", ""],
    ["Setting", "Value", "Description", "Default"],
    ["Blawby Payment URL", "", "Your Blawby payment page URL (e.g. https://app.blawby.com/...)", "https://app.blawby.com/pay"],
    ["Default Currency", "", "Default currency for all payments (USD, EUR, etc.)", "USD"],
    ["Low Balance Threshold", "", "Amount in default currency that triggers low balance alerts", "1000"],
    ["Email Notifications", "", "Send email notifications (true/false)", "true"],
    ["Test Mode", "", "Enable test mode to try the system safely (true/false)", "false"],
    ["", "", "", ""],
    ["✅ Quick Start Guide", "", "", ""],
    ["Step", "Action", "Details", ""],
    ["1", "Connect Blawby", "Enter your Blawby payment page URL in the settings above", ""],
    ["2", "Add Your Team", "Go to the Lawyers tab and add your legal team members", ""],
    ["3", "Set Up Zapier", "Create a Zap that triggers on new Stripe payments → sends payment info to this sheet", ""],
    ["4", "Start Logging Time", "Use the TimeLogs tab to record billable hours", ""],
    ["5", "Monitor Activity", "Check the daily summary emails for updates", ""],
    ["", "", "", ""],
    ["📊 Sheet Overview", "", "", ""],
    ["Sheet", "Purpose", "Editable?", ""],
    ["Lawyers", "Manage your legal team and their rates", "Yes", ""],
    ["Clients", "Track client balances and payment links", "Auto-updated", ""],
    ["TimeLogs", "Record billable hours and activities", "Yes", ""],
    ["Payments", "Track client payments and receipts", "Auto-updated", ""],
    ["Invoices", "View payment receipts and monthly summaries", "Auto-updated", ""],
    ["Matters", "Track client matters and case values", "Yes", ""],
    ["", "", "", ""],
    ["💡 How Retainers Work", "", "", ""],
    ["•", "Clients are automatically created when they make their first payment", "", ""],
    ["•", "Each payment generates an automatic receipt with current balance", "", ""],
    ["•", "Time is logged against the retainer balance", "", ""],
    ["•", "Monthly summaries show hours used vs. balance", "", ""],
    ["•", "Low balance warnings are sent automatically", "", ""],
    ["•", "Payment links are auto-generated for easy top-ups", "", ""],
    ["", "", "", ""],
    ["❓ Need Help?", "", "", ""],
    ["•", "Email: support@blawby.com", "", ""],
    ["•", "Docs: blawby.com/docs", "", ""]
  ];
  
  // Write content to sheet
  welcomeSheet.getRange(1, 1, content.length, 4).setValues(content);
  
  // Format the sheet
  const headerRange = welcomeSheet.getRange(1, 1, 1, 4);
  headerRange.setFontSize(16)
             .setFontWeight("bold")
             .setBackground("#4285f4")
             .setFontColor("white")
             .setHorizontalAlignment("center")
             .merge();
  
  // Format section headers
  const sectionHeaders = [3, 11, 19, 27, 35];
  sectionHeaders.forEach(row => {
    welcomeSheet.getRange(row, 1, 1, 4)
                .setFontWeight("bold")
                .setBackground("#f3f3f3")
                .setFontSize(14)
                .merge();
  });
  
  // Format settings table
  const settingsRange = welcomeSheet.getRange(4, 1, 6, 4);
  settingsRange.setBorder(true, true, true, true, true, true)
               .setHorizontalAlignment("left");
  
  // Format quick start guide
  const guideRange = welcomeSheet.getRange(12, 1, 6, 4);
  guideRange.setBorder(true, true, true, true, true, true)
            .setHorizontalAlignment("left");
  
  // Format sheet overview
  const overviewRange = welcomeSheet.getRange(20, 1, 7, 4);
  overviewRange.setBorder(true, true, true, true, true, true)
               .setHorizontalAlignment("left");
  
  // Format how retainers work
  const retainersRange = welcomeSheet.getRange(28, 1, 6, 4);
  retainersRange.setHorizontalAlignment("left");
  
  // Format need help
  const helpRange = welcomeSheet.getRange(36, 1, 2, 4);
  helpRange.setHorizontalAlignment("left");
  
  // Auto-resize columns
  welcomeSheet.autoResizeColumns(1, 4);
  
  // Freeze header row
  welcomeSheet.setFrozenRows(1);
  
  // Set column widths
  welcomeSheet.setColumnWidth(1, 200);
  welcomeSheet.setColumnWidth(2, 200);
  welcomeSheet.setColumnWidth(3, 400);
  welcomeSheet.setColumnWidth(4, 200);
} 