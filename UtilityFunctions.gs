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
    settingsSheet: getOrCreateSheet(ss, "Settings"),
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

function loadSettings(settingsSheet) {
  const settingsData = settingsSheet.getDataRange().getValues();
  const settings = { ...DEFAULT_SETTINGS }; // Start with defaults
  
  // Process each setting row
  for (let i = 1; i < settingsData.length; i++) {
    const [key, value] = settingsData[i];
    if (!key) continue;
    
    // Handle special case for Payment Link
    if (key === "Payment Link") {
      settings[SETTINGS_KEYS.BASE_PAYMENT_URL] = value;
      continue;
    }
    
    // Handle special case for Default Currency
    if (key === "Default Currency") {
      settings[SETTINGS_KEYS.DEFAULT_CURRENCY] = value.toUpperCase();
      continue;
    }
    
    // Handle other settings based on SETTINGS_KEYS
    const settingKey = Object.entries(SETTINGS_KEYS).find(([_, v]) => v === key)?.[1];
    if (settingKey) {
      settings[settingKey] = value;
    }
  }
  
  // Ensure required settings are present
  if (!settings[SETTINGS_KEYS.BASE_PAYMENT_URL]) {
    settings[SETTINGS_KEYS.BASE_PAYMENT_URL] = DEFAULT_SETTINGS[SETTINGS_KEYS.BASE_PAYMENT_URL];
  }
  if (!settings[SETTINGS_KEYS.DEFAULT_CURRENCY]) {
    settings[SETTINGS_KEYS.DEFAULT_CURRENCY] = DEFAULT_SETTINGS[SETTINGS_KEYS.DEFAULT_CURRENCY];
  }
  if (!settings[SETTINGS_KEYS.TARGET_BALANCE_PERCENTAGE]) {
    settings[SETTINGS_KEYS.TARGET_BALANCE_PERCENTAGE] = DEFAULT_SETTINGS[SETTINGS_KEYS.TARGET_BALANCE_PERCENTAGE];
  }
  if (!settings[SETTINGS_KEYS.MIN_TARGET_BALANCE]) {
    settings[SETTINGS_KEYS.MIN_TARGET_BALANCE] = DEFAULT_SETTINGS[SETTINGS_KEYS.MIN_TARGET_BALANCE];
  }
  
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
  // Setup each sheet with its specific headers and formatting
  setupPaymentsSheet(sheets.paymentsSheet);
  setupClientsSheet(sheets.clientsSheet);
  setupTimeLogsSheet(sheets.timeLogsSheet);
  setupLawyersSheet(sheets.lawyersSheet);
  setupSettingsSheet(sheets.settingsSheet);
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

function setupSettingsSheet(sheet) {
  const headers = [
    "Setting",
    "Value",
    "Description"
  ];
  
  setupSheet(sheet, headers);
  
  // Add default settings with descriptions from the welcome sheet
  const defaultSettings = [
    ["Blawby Payment Page", "", "Your Blawby payment page URL (e.g. https://app.blawby.com/...)"],
    ["Default Currency", "USD", "Default currency for payments and invoices (USD, EUR, etc)"],
    ["Owner Email", "", "Email address for owner notifications and daily summaries"],
    ["Target Balance Percentage", "20", "Percentage of monthly retainer to maintain as minimum balance"],
    ["Minimum Target Balance", "1000", "Minimum target balance in default currency"],
    ["Service Pause Threshold", "0", "Balance threshold at which service is paused"],
    ["Low Balance Warning Threshold", "500", "Balance threshold for low balance warnings"],
    ["Daily Summary Time", "06:30", "Time to send daily summary emails (24-hour format)"],
    ["Zapier Webhook URL", "", "URL for Zapier webhook to receive Stripe payments"],
    ["Support Email", "support@blawby.com", "Email for support requests"],
    ["Documentation URL", "blawby.com/docs", "URL for full documentation"]
  ];
  
  if (sheet.getLastRow() === 1) {
    sheet.getRange(2, 1, defaultSettings.length, 3).setValues(defaultSettings);
    
    // Format the Value column to be editable
    const valueRange = sheet.getRange(2, 2, defaultSettings.length, 1);
    valueRange.setBackground('#ffffff')
              .setBorder(true, true, true, true, true, true);
    
    // Add a note about editing
    sheet.getRange(1, 1, 1, 3).setNote("Edit the 'Value' column to configure your settings. The 'Setting' and 'Description' columns are for reference only.");
  }
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