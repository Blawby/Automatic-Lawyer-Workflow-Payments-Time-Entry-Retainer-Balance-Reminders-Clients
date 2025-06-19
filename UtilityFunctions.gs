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
  
  const settingsData = welcomeSheet.getRange(4, 1, 6, 4).getValues(); // Get settings from Welcome sheet
  console.log('🟦 Raw settingsData from Welcome sheet:', JSON.stringify(settingsData));
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
    if (key === "Email Notifications" || key === "Test Mode") {
      settings[key === "Email Notifications" ? SETTINGS_KEYS.EMAIL_NOTIFICATIONS : SETTINGS_KEYS.TEST_MODE] = value.toString().toLowerCase() === 'true';
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
    
    // Skip instruction rows
    if (!row[0] || row[0].includes("⚠️ INSTRUCTIONS") || row[0].includes("Field")) {
      continue;
    }
    
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
  
  // Get the last row after headers
  const lastRow = Math.max(2, sheet.getLastRow());
  
  // Add data validation
  const dateRange = sheet.getRange(2, 1, Math.max(1, lastRow - 1), 1);
  const emailRange = sheet.getRange(2, 2, Math.max(1, lastRow - 1), 1);
  const amountRange = sheet.getRange(2, 3, Math.max(1, lastRow - 1), 1);
  const currencyRange = sheet.getRange(2, 4, Math.max(1, lastRow - 1), 1);
  const statusRange = sheet.getRange(2, 5, Math.max(1, lastRow - 1), 1);
  
  // Date validation
  dateRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireDate()
      .build()
  );
  
  // Email validation
  emailRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireTextIsEmail()
      .build()
  );
  
  // Amount validation (positive number)
  amountRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireNumberGreaterThan(0)
      .build()
  );
  
  // Currency validation
  currencyRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['USD', 'EUR', 'GBP', 'CAD', 'AUD'], true)
      .build()
  );
  
  // Status validation
  statusRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(['Pending', 'Completed', 'Failed'], true)
      .build()
  );
  
  // Add instructions in a separate section below the data area
  const instructionsStartRow = lastRow + 3;
  const instructions = [
    ["⚠️ INSTRUCTIONS (DO NOT MODIFY OR DELETE THIS SECTION) ⚠️", "", "", "", "", ""],
    ["Field", "Description", "Format", "Required", "Example", "Notes"],
    ["Date", "Date of payment", "YYYY-MM-DD", "Yes", "2025-01-01", "Must be a valid date"],
    ["Client Email", "Client's email address", "email@domain.com", "Yes", "lawyer@firm.com", "Must be valid email"],
    ["Amount", "Payment amount", "Number > 0", "Yes", "1000.00", "Must be positive"],
    ["Currency", "Payment currency", "USD/EUR/GBP/CAD/AUD", "Yes", "USD", "Must be from list"],
    ["Status", "Payment status", "Pending/Completed/Failed", "Yes", "Completed", "Must be from list"],
    ["Receipt ID", "Payment receipt ID", "Any text", "No", "INV-2025-001", "Optional identifier"]
  ];
  
  // Add a visual separator before instructions
  const separatorRange = sheet.getRange(lastRow + 2, 1, 1, 6);
  separatorRange.setBackground('#f3f3f3');
  separatorRange.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  
  // Add and format instructions
  const instructionsRange = sheet.getRange(instructionsStartRow, 1, instructions.length, 6);
  instructionsRange.setValues(instructions);
  
  // Format header row
  const headerRange = sheet.getRange(instructionsStartRow, 1, 1, 6);
  headerRange.merge();
  headerRange.setBackground('#f4cccc');  // Light red background
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  
  // Format the instruction table
  const tableRange = sheet.getRange(instructionsStartRow + 1, 1, instructions.length - 1, 6);
  tableRange.setBackground('#f3f3f3');  // Light gray background
  tableRange.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  
  // Make the "Field" column bold
  sheet.getRange(instructionsStartRow + 1, 1, instructions.length - 1, 1).setFontWeight("bold");
  
  // Add a note to clarify these are instructions
  headerRange.setNote("These instructions are protected. They provide guidance for entering payment data correctly. Please enter your data in the rows above this section.");
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, 6);
  
  // Set column widths to ensure readability
  sheet.setColumnWidth(1, 150);  // Date
  sheet.setColumnWidth(2, 200);  // Email
  sheet.setColumnWidth(3, 100);  // Amount
  sheet.setColumnWidth(4, 100);  // Currency
  sheet.setColumnWidth(5, 100);  // Status
  sheet.setColumnWidth(6, 150);  // Receipt ID
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
  
  // Get the last row after headers
  const lastRow = Math.max(2, sheet.getLastRow());
  
  // Add data validation
  const emailRange = sheet.getRange(2, 1, Math.max(1, lastRow - 1), 1);
  const targetBalanceRange = sheet.getRange(2, 3, Math.max(1, lastRow - 1), 1);
  
  // Email validation
  emailRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireTextIsEmail()
      .build()
  );
  
  // Target Balance validation (positive number)
  targetBalanceRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireNumberGreaterThan(0)
      .build()
  );
  
  // Add instructions in a separate section below the data area
  const instructionsStartRow = lastRow + 4; // Increased spacing
  const instructions = [
    ["⚠️ INSTRUCTIONS (DO NOT MODIFY OR DELETE THIS SECTION) ⚠️", "", "", "", "", "", "", "", "", ""],
    ["Field", "Description", "Format", "Required", "Notes", "", "", "", "", ""],
    ["Email", "Client's email address", "email@domain.com", "Yes", "Must be a valid email", "", "", "", "", ""],
    ["Name", "Client's full name", "Text", "Yes", "Individual or company name", "", "", "", "", ""],
    ["Target Balance", "Desired retainer balance", "Number > 0", "Yes", "Minimum balance to maintain", "", "", "", "", ""],
    ["Total Paid", "Sum of all payments", "Number", "Auto", "Automatically calculated", "", "", "", "", ""],
    ["Total Hours", "Sum of all time logs", "Number", "Auto", "Automatically calculated", "", "", "", "", ""],
    ["Total Used", "Total amount billed", "Number", "Auto", "Automatically calculated", "", "", "", "", ""],
    ["Balance", "Current retainer balance", "Number", "Auto", "Total Paid - Total Used", "", "", "", "", ""],
    ["Top Up", "Suggested payment", "Number", "Auto", "Amount needed to reach target", "", "", "", "", ""],
    ["Payment Link", "Client's payment URL", "URL", "Auto", "Generated payment link", "", "", "", "", ""],
    ["Client ID", "Unique identifier", "UUID", "Auto", "System-generated ID", "", "", "", "", ""]
  ];
  
  addInstructionTable(sheet, instructionsStartRow, instructions, 10);
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
  
  // Get the last row after headers
  const lastRow = Math.max(2, sheet.getLastRow());
  
  // Add data validation
  const dateRange = sheet.getRange(2, 1, Math.max(1, lastRow - 1), 1);
  const emailRange = sheet.getRange(2, 2, Math.max(1, lastRow - 1), 1);
  const hoursRange = sheet.getRange(2, 5, Math.max(1, lastRow - 1), 1);
  
  // Date validation
  dateRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireDate()
      .build()
  );
  
  // Email validation
  emailRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireTextIsEmail()
      .build()
  );
  
  // Hours validation (positive number)
  hoursRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireNumberGreaterThan(0)
      .build()
  );
  
  // Add instructions in a separate section below the data area
  const instructionsStartRow = lastRow + 3;
  const instructions = [
    ["⚠️ INSTRUCTIONS (DO NOT MODIFY OR DELETE THIS SECTION) ⚠️", "", "", "", ""],
    ["Field", "Description", "Format", "Required", "Notes"],
    ["Date", "Date work was performed", "YYYY-MM-DD", "Yes", "Must be a valid date"],
    ["Client Email", "Client's email address", "email@domain.com", "Yes", "Must match an existing client"],
    ["Matter ID", "Matter identifier", "M-YYYY-XXX", "Yes", "Must match an existing matter"],
    ["Lawyer ID", "Lawyer's identifier", "INITIALS", "Yes", "Must match a lawyer in Lawyers sheet"],
    ["Hours", "Time spent (in hours)", "Number > 0", "Yes", "Can use decimals (e.g., 1.5)"]
  ];
  
  addInstructionTable(sheet, instructionsStartRow, instructions, 5);
}

function setupLawyersSheet(sheet) {
  const headers = [
    "Email",
    "Name",
    "Rate",
    "Lawyer ID"
  ];
  
  setupSheet(sheet, headers);
  
  // Get the last row after headers
  const lastRow = Math.max(2, sheet.getLastRow());
  
  // Add data validation
  const emailRange = sheet.getRange(2, 1, Math.max(1, lastRow - 1), 1);
  const rateRange = sheet.getRange(2, 3, Math.max(1, lastRow - 1), 1);
  
  // Email validation
  emailRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireTextIsEmail()
      .build()
  );
  
  // Rate validation (positive number)
  rateRange.setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireNumberGreaterThan(0)
      .build()
  );
  
  // Add instructions in a separate section below the data area
  const instructionsStartRow = lastRow + 3;
  const instructions = [
    ["⚠️ INSTRUCTIONS (DO NOT MODIFY OR DELETE THIS SECTION) ⚠️", "", "", "", ""],
    ["Field", "Description", "Format", "Required", "Notes"],
    ["Email", "Lawyer's email address", "email@firm.com", "Yes", "Must be a valid email"],
    ["Name", "Lawyer's full name", "Text", "Yes", "First and last name"],
    ["Rate", "Hourly billing rate", "Number > 0", "Yes", "In default currency"],
    ["Lawyer ID", "Unique identifier", "INITIALS", "Yes", "Usually lawyer's initials"]
  ];
  
  addInstructionTable(sheet, instructionsStartRow, instructions, 5);
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

  // --- Preserve existing values in the Value column (column 2) for settings rows ---
  // We'll assume settings start at row 5 (after header) and go for 5 rows (update if you add more settings)
  let preservedValues = [];
  try {
    const maybeExisting = welcomeSheet.getRange(5, 1, 5, 2).getValues();
    preservedValues = maybeExisting.map(row => row[1]); // just the Value column
  } catch (e) {
    preservedValues = [];
  }

  // Clear existing content
  welcomeSheet.clear();

  // Set up the content (no Default column, Value column prepopulated)
  const content = [
    ["Welcome to Blawby Retainer Management", "", ""],
    ["", "", ""],
    ["⚙️ System Settings", "", ""],
    ["Setting", "Value", "Description"],
    ["Blawby Payment URL", preservedValues[0] || "https://app.blawby.com/pay", "Your Blawby payment page URL (e.g. https://app.blawby.com/...)",],
    ["Default Currency", preservedValues[1] || "USD", "Default currency for all payments (USD, EUR, etc.)"],
    ["Low Balance Threshold", preservedValues[2] || "1000", "Amount in default currency that triggers low balance alerts"],
    ["Email Notifications", preservedValues[3] || "TRUE", "Send email notifications (true/false)"],
    ["Test Mode", preservedValues[4] || "TRUE", "Enable test mode to try the system safely (true/false)"],
    ["", "", ""],
    ["✅ Quick Start Guide", "", ""],
    ["Step", "Action", "Details"],
    ["1", "Connect Blawby", "Enter your Blawby payment page URL in the settings above"],
    ["2", "Add Your Team", "Go to the Lawyers tab and add your legal team members"],
    ["3", "Set Up Zapier", "Create a Zap that triggers on new Stripe payments → sends payment info to this sheet"],
    ["4", "Start Logging Time", "Use the TimeLogs tab to record billable hours"],
    ["5", "Monitor Activity", "Check the daily summary emails for updates"],
    ["", "", ""],
    ["📊 Sheet Overview", "", ""],
    ["Sheet", "Purpose", "Editable?"],
    ["Lawyers", "Manage your legal team and their rates", "Yes"],
    ["Clients", "Track client balances and payment links", "Auto-updated"],
    ["TimeLogs", "Record billable hours and activities", "Yes"],
    ["Payments", "Track client payments and receipts", "Auto-updated"],
    ["Invoices", "View payment receipts and monthly summaries", "Auto-updated"],
    ["Matters", "Track client matters and case values", "Yes"],
    ["", "", ""],
    ["💡 How Retainers Work", "", ""],
    ["•", "Clients are automatically created when they make their first payment", ""],
    ["•", "Each payment generates an automatic receipt with current balance", ""],
    ["•", "Time is logged against the retainer balance", ""],
    ["•", "Monthly summaries show hours used vs. balance", ""],
    ["•", "Low balance warnings are sent automatically", ""],
    ["•", "Payment links are auto-generated for easy top-ups", ""],
    ["", "", ""],
    ["❓ Need Help?", "", ""],
    ["•", "Email: support@blawby.com", ""],
    ["•", "Docs: blawby.com/docs", ""]
  ];

  // Write content to sheet
  welcomeSheet.getRange(1, 1, content.length, 3).setValues(content);

  // --- Restore preserved values into the Value column ---
  if (preservedValues.length > 0) {
    for (let i = 0; i < preservedValues.length; i++) {
      if (preservedValues[i] !== "" && preservedValues[i] !== undefined && preservedValues[i] !== null) {
        welcomeSheet.getRange(5 + i, 2).setValue(preservedValues[i]);
      }
    }
  }

  // Format the sheet
  const headerRange = welcomeSheet.getRange(1, 1, 1, 3);
  headerRange.setFontSize(16)
             .setFontWeight("bold")
             .setBackground("#4285f4")
             .setFontColor("white")
             .setHorizontalAlignment("center")
             .merge();

  // Format section headers
  const sectionHeaders = [3, 11, 19, 27, 35];
  sectionHeaders.forEach(row => {
    welcomeSheet.getRange(row, 1, 1, 3)
                .setFontWeight("bold")
                .setBackground("#f3f3f3")
                .setFontSize(14)
                .merge();
  });

  // Format settings table
  const settingsRange = welcomeSheet.getRange(4, 1, 6, 3);
  settingsRange.setBorder(true, true, true, true, true, true)
               .setHorizontalAlignment("left");

  // Format quick start guide
  const guideRange = welcomeSheet.getRange(12, 1, 6, 3);
  guideRange.setBorder(true, true, true, true, true, true)
            .setHorizontalAlignment("left");

  // Format sheet overview
  const overviewRange = welcomeSheet.getRange(20, 1, 7, 3);
  overviewRange.setBorder(true, true, true, true, true, true)
               .setHorizontalAlignment("left");

  // Format how retainers work
  const retainersRange = welcomeSheet.getRange(28, 1, 6, 3);
  retainersRange.setHorizontalAlignment("left");

  // Format need help
  const helpRange = welcomeSheet.getRange(36, 1, 2, 3);
  helpRange.setHorizontalAlignment("left");

  // Auto-resize columns
  welcomeSheet.autoResizeColumns(1, 3);

  // Freeze header row
  welcomeSheet.setFrozenRows(1);

  // Set column widths
  welcomeSheet.setColumnWidth(1, 200);
  welcomeSheet.setColumnWidth(2, 200);
  welcomeSheet.setColumnWidth(3, 400);
}

// Add the missing invoice generation function
function generateInvoiceForClient(clientEmail) {
  try {
    if (!clientEmail || typeof clientEmail !== 'string') {
      console.log('Invalid client email provided');
      return false;
    }

    const settings = loadSettings();
    if (!settings.auto_generate_invoices) {
      console.log(`Invoice generation is disabled for ${clientEmail}`);
      return false;
    }

    const today = new Date();
    const invoiceDay = parseInt(settings.invoice_day);
    
    // Only generate invoices on the specified day
    if (today.getDate() !== invoiceDay) {
      console.log(`Not invoice day for ${clientEmail}`);
      return false;
    }

    // Get client's time logs
    const timeLogs = getTimeLogsForClient(clientEmail);
    if (!timeLogs || timeLogs.length === 0) {
      console.log(`No time logs found for ${clientEmail}`);
      return false;
    }

    // Calculate total hours and amount
    let totalHours = 0;
    let totalAmount = 0;
    timeLogs.forEach(log => {
      if (log && log.hours) {
        totalHours += parseFloat(log.hours);
        const lawyerRate = getLawyerRate(log.lawyerId);
        totalAmount += parseFloat(log.hours) * lawyerRate;
      }
    });

    if (totalHours === 0) {
      console.log(`No billable hours found for ${clientEmail}`);
      return false;
    }

    // Create invoice record
    const invoice = {
      clientEmail: clientEmail,
      date: today,
      totalHours: totalHours,
      totalAmount: totalAmount,
      status: 'Pending'
    };

    // Save invoice
    const saved = saveInvoice(invoice);
    if (!saved) {
      console.log(`Failed to save invoice for ${clientEmail}`);
      return false;
    }

    // Send invoice email
    if (settings.email_notifications) {
      const emailSent = sendInvoiceEmail(invoice);
      if (!emailSent) {
        console.log(`Failed to send invoice email to ${clientEmail}`);
      }
    }

    console.log(`✅ Invoice generated for ${clientEmail}`);
    return true;
  } catch (error) {
    console.error(`Error generating invoice for ${clientEmail}: ${error.message}`);
    return false;
  }
}

// Helper functions for invoice generation
function getTimeLogsForClient(clientEmail) {
  try {
    const timeLogsSheet = getSheet('TimeLogs');
    if (!timeLogsSheet) {
      console.log('TimeLogs sheet not found');
      return [];
    }
    
    const data = timeLogsSheet.getDataRange().getValues();
    if (data.length <= 1) {
      console.log('No time logs found in sheet');
      return [];
    }
    
    const headers = data[0];
    
    return data.slice(1)
      .filter(row => row && row[1] === clientEmail) // Client Email is in column 2
      .map(row => ({
        date: row[0],
        clientEmail: row[1],
        matterId: row[2],
        lawyerId: row[3],
        hours: row[4]
      }));
  } catch (error) {
    console.error(`Error getting time logs for ${clientEmail}: ${error.message}`);
    return [];
  }
}

function getLawyerRate(lawyerId) {
  try {
    if (!lawyerId) return 0;
    
    const lawyersSheet = getSheet('Lawyers');
    if (!lawyersSheet) {
      console.log('Lawyers sheet not found');
      return 0;
    }
    
    const data = lawyersSheet.getDataRange().getValues();
    if (data.length <= 1) {
      console.log('No lawyers found in sheet');
      return 0;
    }
    
    const headers = data[0];
    
    const lawyer = data.slice(1)
      .find(row => row && row[3] === lawyerId); // Lawyer ID is in column 4
    
    return lawyer ? parseFloat(lawyer[2]) : 0; // Rate is in column 3
  } catch (error) {
    console.error(`Error getting rate for lawyer ${lawyerId}: ${error.message}`);
    return 0;
  }
}

function saveInvoice(invoice) {
  try {
    if (!invoice || !invoice.clientEmail) {
      console.log('Invalid invoice data');
      return false;
    }

    const invoicesSheet = getSheet('Invoices');
    if (!invoicesSheet) {
      console.log('Invoices sheet not found');
      return false;
    }
    
    invoicesSheet.appendRow([
      invoice.date,
      invoice.clientEmail,
      invoice.totalHours,
      invoice.totalAmount,
      invoice.status
    ]);
    
    return true;
  } catch (error) {
    console.error(`Error saving invoice: ${error.message}`);
    return false;
  }
}

function sendInvoiceEmail(invoice) {
  try {
    if (!invoice || !invoice.clientEmail) {
      console.log('Invalid invoice data for email');
      return false;
    }

    const client = getClientByEmail(invoice.clientEmail);
    if (!client) {
      console.log(`Client not found for email ${invoice.clientEmail}`);
      return false;
    }

    const subject = `Invoice for ${client.name} - ${formatDate(invoice.date)}`;
    const body = `
      Dear ${client.name},

      Please find attached your invoice for ${formatDate(invoice.date)}.

      Total Hours: ${invoice.totalHours}
      Total Amount: ${formatCurrency(invoice.totalAmount)}

      Thank you for your business.

      Best regards,
      Your Law Firm
    `;

    MailApp.sendEmail({
      to: client.email,
      subject: subject,
      body: body
    });
    
    return true;
  } catch (error) {
    console.error(`Error sending invoice email: ${error.message}`);
    return false;
  }
}

// Helper function to add formatted instruction table
function addInstructionTable(sheet, startRow, instructions, columnCount) {
  // Add a visual separator before instructions (2 rows)
  const separatorRange = sheet.getRange(startRow - 2, 1, 2, columnCount);
  separatorRange.setBackground('#f3f3f3');
  separatorRange.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  
  // Add and format instructions
  const instructionsRange = sheet.getRange(startRow, 1, instructions.length, columnCount);
  instructionsRange.setValues(instructions);
  
  // Format header row
  const headerRange = sheet.getRange(startRow, 1, 1, columnCount);
  headerRange.merge();
  headerRange.setBackground('#f4cccc');  // Light red background
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  
  // Format the instruction table
  const tableRange = sheet.getRange(startRow + 1, 1, instructions.length - 1, columnCount);
  tableRange.setBackground('#f3f3f3');  // Light gray background
  tableRange.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  
  // Make the "Field" column bold
  sheet.getRange(startRow + 1, 1, instructions.length - 1, 1).setFontWeight("bold");
  
  // Add a note to clarify these are instructions
  headerRange.setNote("These instructions are protected. They provide guidance for entering data correctly. Please enter your data in the rows above this section.");
  
  // Set reasonable column widths
  for (let i = 1; i <= columnCount; i++) {
    sheet.setColumnWidth(i, 150);
  }
  
  // Make description column wider
  sheet.setColumnWidth(2, 200);
  
  // Freeze the header row
  sheet.setFrozenRows(1);
  
  // Protect the instruction section
  const protection = sheet.protect();
  protection.setDescription('Instructions Section');
  protection.setUnprotectedRanges([sheet.getRange(2, 1, startRow - 3, columnCount)]); // Only allow editing in data area
  protection.setWarningOnly(true);
  
  // Add a named range for the instruction section to help identify it
  const instructionRange = sheet.getRange(startRow, 1, instructions.length, columnCount);
  const ss = sheet.getParent();
  ss.setNamedRange('INSTRUCTIONS_SECTION_' + sheet.getName(), instructionRange);
} 