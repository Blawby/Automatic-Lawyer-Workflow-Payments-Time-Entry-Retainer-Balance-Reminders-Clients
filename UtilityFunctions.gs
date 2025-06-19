// ========== UTILITY FUNCTIONS ==========

/**
 * Get all settings as a map from the Welcome sheet
 * @return {Object} Map of setting key -> value
 */
function getConfigMap() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Welcome");
  if (!sheet) {
    throw new Error("Welcome sheet not found");
  }
  
  const values = sheet.getRange(5, 1, 6, 2).getValues(); // Settings are in rows 5-10
  const configMap = {};
  
  for (const [key, value] of values) {
    if (key && key.trim()) {
      configMap[key.trim()] = value;
    }
  }
  
  return configMap;
}

/**
 * Get a setting value by key with fallback to defaults
 * @param {string} key - The setting key to retrieve
 * @param {*} defaultValue - Default value if setting not found
 * @return {*} - The setting value or default
 */
function getSetting(key, defaultValue = null) {
  const configMap = getConfigMap();
  const value = configMap[key];
  
  // Handle boolean settings
  if (key === "Email Notifications" || key === "Test Mode") {
    return value === true || value === "TRUE" || value === "true";
  }
  
  // Handle numeric settings
  if (key === "Low Balance Threshold") {
    return parseInt(value) || defaultValue || 0;
  }
  
  // Handle Firm Email validation
  if (key === "Firm Email") {
    if (value && typeof value === 'string' && value.includes('@')) {
      return value;
    }
    return defaultValue || "your-email@example.com";
  }
  
  return value !== undefined ? value : defaultValue;
}

/**
 * Check if the system is in test mode
 * @return {boolean} - True if test mode is enabled
 */
function isTestMode() {
  return getSetting("Test Mode", false);
}

/**
 * Safely detect the user's email address with multiple fallback methods
 * @return {string} - Valid email address or fallback placeholder
 */
function detectEmail() {
  let email = "your-email@example.com"; // fallback
  
  // Method 1: Try Session.getActiveUser() (most reliable when authorized)
  try {
    const user = Session.getActiveUser().getEmail();
    if (user && user.includes("@") && user !== "") {
      log(`📧 Detected email from Session: ${user}`);
      return user;
    }
  } catch (e) {
    log(`⚠️ Session.getActiveUser() failed: ${e.message}`);
  }
  
  // Method 2: Try spreadsheet owner (works even without authorization)
  try {
    const owner = SpreadsheetApp.getActiveSpreadsheet().getOwner().getEmail();
    if (owner && owner.includes("@") && owner !== "") {
      log(`📧 Detected email from Owner: ${owner}`);
      return owner;
    }
  } catch (e) {
    log(`⚠️ Spreadsheet owner detection failed: ${e.message}`);
  }
  
  // Method 3: Try to get from current user (alternative method)
  try {
    const currentUser = Session.getActiveUser();
    if (currentUser && currentUser.getEmail) {
      const currentEmail = currentUser.getEmail();
      if (currentEmail && currentEmail.includes("@") && currentEmail !== "") {
        log(`📧 Detected email from Current User: ${currentEmail}`);
        return currentEmail;
      }
    }
  } catch (e) {
    log(`⚠️ Current user detection failed: ${e.message}`);
  }
  
  log(`⚠️ No valid email detected, using fallback: ${email}`);
  return email;
}

/**
 * Automatically fix the Firm Email field if it's showing boolean values
 * This function can be called to clean up invalid email values
 */
function fixFirmEmailField() {
  try {
    const welcomeSheet = getSheet("Welcome");
    const firmEmailCell = welcomeSheet.getRange(9, 2); // Firm Email is in row 9, column 2
    const currentValue = firmEmailCell.getValue();
    
    // Check if the current value is invalid
    if (currentValue === true || currentValue === false || 
        currentValue === "TRUE" || currentValue === "FALSE" ||
        !currentValue || !currentValue.includes('@') || 
        currentValue === 'your-email@example.com') {
      
      // Try to detect a valid email
      const detectedEmail = detectEmail();
      
      if (detectedEmail && detectedEmail !== 'your-email@example.com') {
        firmEmailCell.setValue(detectedEmail);
        log(`✅ Fixed Firm Email field: "${currentValue}" → "${detectedEmail}"`);
        return true;
      } else {
        log(`⚠️ Could not detect valid email to replace "${currentValue}"`);
        return false;
      }
    } else {
      log(`✅ Firm Email field already has valid value: ${currentValue}`);
      return true;
    }
  } catch (error) {
    logError('fixFirmEmailField', error);
    return false;
  }
}

/**
 * Get the firm email address with improved detection
 * @return {string} - Firm email address
 */
function getFirmEmail() {
  try {
    // First try to get from settings
    const settings = loadSettings();
    const firmEmail = settings[SETTINGS_KEYS.FIRM_EMAIL];
    
    // If it's a valid email, use it
    if (firmEmail && typeof firmEmail === 'string' && firmEmail.includes('@') && firmEmail !== 'your-email@example.com') {
      log(`📧 Using firm email from settings: ${firmEmail}`);
      return firmEmail;
    }
    
    // If not valid, try to detect email
    const detectedEmail = detectEmail();
    if (detectedEmail && detectedEmail.includes('@') && detectedEmail !== 'your-email@example.com') {
      log(`📧 Using detected email: ${detectedEmail}`);
      return detectedEmail;
    }
    
    // Final fallback - this will cause a clear error
    throw new Error("No valid email found. Please set your email address in the Welcome sheet under 'Firm Email' setting.");
  } catch (error) {
    logError('getFirmEmail', error);
    throw new Error("Firm Email not configured. Please set your email address in the Welcome sheet under 'Firm Email' setting.");
  }
}

/**
 * Get the base payment URL
 * @return {string} - Base payment URL
 */
function getPaymentUrl() {
  return getSetting("Blawby Payment URL", "https://app.blawby.com/pay");
}

/**
 * Get the default currency
 * @return {string} - Default currency code
 */
function getDefaultCurrency() {
  return getSetting("Default Currency", "USD");
}

// ========== LOGGING UTILITIES ==========

/**
 * Simple logging function with timestamp
 * @param {string} message - Message to log
 */
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Log the start of a function
 * @param {string} funcName - Name of the function
 */
function logStart(funcName) {
  log(`→ START ${funcName}`);
}

/**
 * Log the end of a function
 * @param {string} funcName - Name of the function
 */
function logEnd(funcName) {
  log(`✓ END ${funcName}`);
}

/**
 * Log an error with context
 * @param {string} funcName - Name of the function where error occurred
 * @param {Error} error - The error object
 */
function logError(funcName, error) {
  log(`❌ ERROR in ${funcName}: ${error.message}`);
  console.error(error);
}

// ========== SHEET ACCESS HELPERS ==========

/**
 * Get a sheet by name with error handling
 * @param {string} name - Sheet name
 * @return {GoogleAppsScript.Spreadsheet.Sheet} - The sheet object
 */
function getSheet(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sheet) {
    throw new Error(`Sheet '${name}' not found`);
  }
  return sheet;
}

/**
 * Get the active spreadsheet with error handling
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet} - The active spreadsheet
 */
function getActiveSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("No active spreadsheet found");
  }
  return ss;
}

/**
 * Get all required sheets in one call
 * @return {Object} Object containing all required sheets
 */
function getAllSheets() {
  const ss = getActiveSpreadsheet();
  
  return {
    welcome: getSheet("Welcome"),
    payments: getSheet("Payments"),
    clients: getSheet("Clients"),
    timeLogs: getSheet("TimeLogs"),
    matters: getSheet("Matters"),
    invoices: getSheet("Invoices"),
    lowBalance: getSheet("LowBalanceWarnings")
  };
}

/**
 * Get or create a sheet by name
 * @param {string|GoogleAppsScript.Spreadsheet.Spreadsheet} nameOrSs - Sheet name or spreadsheet object
 * @param {string} name - Sheet name (optional, only if first param is spreadsheet)
 * @return {GoogleAppsScript.Spreadsheet.Sheet} - The sheet object
 */
function getOrCreateSheet(nameOrSs, name) {
  let ss, sheetName;
  
  // Handle both function signatures for backward compatibility
  if (typeof nameOrSs === 'string') {
    // Called as getOrCreateSheet(name)
    ss = getActiveSpreadsheet();
    sheetName = nameOrSs;
  } else {
    // Called as getOrCreateSheet(ss, name)
    ss = nameOrSs;
    sheetName = name;
  }
  
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    log(`📄 Created new sheet: ${sheetName}`);
  }
  
  return sheet;
}

function getSheets(ss) {
  if (!ss) {
    ss = getActiveSpreadsheet();
  }
  
  // Get or create each required sheet (no Lawyers tab)
  const sheets = {
    paymentsSheet: getOrCreateSheet("Payments"),
    clientsSheet: getOrCreateSheet("Clients"),
    timeLogsSheet: getOrCreateSheet("TimeLogs"),
    lowBalanceSheet: getOrCreateSheet("LowBalanceWarnings"),
    invoicesSheet: getOrCreateSheet("Invoices"),
    mattersSheet: getOrCreateSheet("Matters"),
    welcomeSheet: getOrCreateSheet("Welcome")
  };
  
  return sheets;
}

function loadSheetData(sheets) {
  return {
    paymentData: sheets.paymentsSheet.getDataRange().getValues(),
    clientData: sheets.clientsSheet.getDataRange().getValues(),
    timeLogs: sheets.timeLogsSheet.getDataRange().getValues(),
    lawyers: getLawyersFromWelcomeSheet(sheets.welcomeSheet),
    matters: sheets.mattersSheet.getDataRange().getValues()
  };
}

function loadSettings() {
  const welcomeSheet = getSheet("Welcome");
  const settingsData = welcomeSheet.getRange(5, 1, 6, 2).getValues(); // Get settings from Welcome sheet (rows 5-10, columns 1-2)
  console.log('🟦 Raw settingsData from Welcome sheet:', JSON.stringify(settingsData));
  const settings = { ...DEFAULT_SETTINGS }; // Start with defaults
  
  // Process each setting row
  for (const [key, value] of settingsData) {
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
    
    // Handle Firm Email setting - treat as text, not boolean
    if (key === "Firm Email") {
      settings[SETTINGS_KEYS.FIRM_EMAIL] = value;
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
  
  // If Firm Email is not set or is invalid, set a placeholder
  if (!settings[SETTINGS_KEYS.FIRM_EMAIL] || 
      settings[SETTINGS_KEYS.FIRM_EMAIL] === true || 
      settings[SETTINGS_KEYS.FIRM_EMAIL] === "TRUE" ||
      !settings[SETTINGS_KEYS.FIRM_EMAIL].includes('@')) {
    // Try to detect email using the improved function
    try {
      const detectedEmail = detectEmail();
      if (detectedEmail && detectedEmail !== 'your-email@example.com') {
        settings[SETTINGS_KEYS.FIRM_EMAIL] = detectedEmail;
        log(`📧 Auto-detected email in loadSettings: ${detectedEmail}`);
      } else {
        settings[SETTINGS_KEYS.FIRM_EMAIL] = "your-email@example.com";
      }
    } catch (e) {
      logError('loadSettings email detection', e);
      settings[SETTINGS_KEYS.FIRM_EMAIL] = "your-email@example.com";
    }
  }
  
  console.log('⚙️ Settings loaded:', settings);
  
  return settings;
}

function buildLawyerMaps(lawyers) {
  const rates = {};
  const emails = {};
  
  for (let i = 1; i < lawyers.length; i++) {
    const [email, name, rate, lawyerID] = lawyers[i];
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
    
    // Skip empty rows
    if (!row[0]) {
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
  setupWelcomeSheet(getActiveSpreadsheet());
  
  // Setup each sheet with its specific headers and formatting (no Lawyers tab)
  setupPaymentsSheet(sheets.paymentsSheet);
  setupClientsSheet(sheets.clientsSheet);
  setupTimeLogsSheet(sheets.timeLogsSheet);
  setupLowBalanceSheet(sheets.lowBalanceSheet);
  setupInvoicesSheet(sheets.invoicesSheet);
  setupMattersSheet(sheets.mattersSheet);
}

function setupPaymentsSheet(sheet) {
  const headers = [
    "Date",
    "Client Email",
    "Amount",
    "Payment Method"
  ];
  setupSheet(sheet, headers);
  
  // Add sample payment data for testing
  const samplePayments = [
    ["2025-01-15", "client1@example.com", "2500", "card - 4242"],
    ["2025-01-16", "client2@example.com", "1500", "card - 5555"],
    ["2025-01-17", "client1@example.com", "1000", "card - 4242"]
  ];
  
  sheet.getRange(2, 1, samplePayments.length, 4).setValues(samplePayments);
  
  // Add note to explain sample data
  sheet.getRange(1, 1).setNote("Sample data for testing. Delete these rows and add your real payment data from Zapier.");
  // No instructions or protection
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
  // No instructions or protection
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
  
  // Add sample time log data for testing
  const sampleTimeLogs = [
    ["2025-01-15", "client1@example.com", "M-2025-001", "JS", "2.5"],
    ["2025-01-16", "client1@example.com", "M-2025-001", "JS", "1.5"],
    ["2025-01-17", "client2@example.com", "M-2025-002", "JD", "3.0"],
    ["2025-01-18", "client1@example.com", "M-2025-001", "JS", "4.0"],
    ["2025-01-19", "client2@example.com", "M-2025-002", "JD", "2.0"]
  ];
  
  sheet.getRange(2, 1, sampleTimeLogs.length, 5).setValues(sampleTimeLogs);
  
  // Add note to explain sample data
  sheet.getRange(1, 1).setNote("Sample data for testing. Replace with your real time logs. Lawyer IDs must match those in Welcome sheet.");
  // No instructions or protection
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
  // No instructions or protection
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
  // No instructions or protection
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
  
  // Add sample matter data for testing
  const sampleMatters = [
    ["M-2025-001", "client1@example.com", "John Smith", "Contract Review", "2025-01-15", "Active", "50000"],
    ["M-2025-002", "client2@example.com", "Jane Doe", "Litigation Case", "2025-01-16", "Active", "100000"]
  ];
  
  sheet.getRange(2, 1, sampleMatters.length, 7).setValues(sampleMatters);
  
  // Add note to explain sample data
  sheet.getRange(1, 1).setNote("Sample matters for testing. Replace with your real matters. Matter IDs should match those in TimeLogs.");
  // No instructions or protection
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
  let preservedValues = [];
  try {
    const maybeExisting = welcomeSheet.getRange(5, 1, 6, 2).getValues();
    preservedValues = maybeExisting.map(row => row[1]);
  } catch (e) {
    preservedValues = [];
  }

  // --- Get the current user's email using improved detection ---
  let userEmail = "your-email@example.com"; // placeholder
  try {
    userEmail = detectEmail();
    log(`📧 Detected email for Welcome sheet: ${userEmail}`);
  } catch (e) {
    logError('setupWelcomeSheet email detection', e);
    userEmail = "your-email@example.com";
  }

  // --- Preserve existing lawyers section if present ---
  let preservedLawyers = [];
  try {
    const values = welcomeSheet.getDataRange().getValues();
    const lawyerHeaderRow = values.findIndex(row => row[0] && row[0].toString().includes('Lawyers'));
    if (lawyerHeaderRow > -1) {
      preservedLawyers = values.slice(lawyerHeaderRow + 2, lawyerHeaderRow + 7).map(row => row.slice(0, 4));
    }
  } catch (e) {
    preservedLawyers = [];
  }

  // Clear existing content
  welcomeSheet.clear();

  // Set up the content (ensure every row has exactly 4 columns)
  const content = [
    ["Welcome to Blawby Retainer Management v2.0", "", "", ""],
    ["", "", "", ""],
    ["⚙️ System Settings", "", "", ""],
    ["Setting", "Value", "Description", ""],
    ["Blawby Payment URL", preservedValues[0] || "https://app.blawby.com/pay", "Your Blawby payment page URL (e.g. https://app.blawby.com/...)", ""],
    ["Default Currency", preservedValues[1] || "USD", "Default currency for all payments (USD, EUR, etc.)", ""],
    ["Low Balance Threshold", preservedValues[2] || "1000", "Amount in default currency that triggers low balance alerts", ""],
    ["Email Notifications", preservedValues[3] || "TRUE", "Send email notifications (true/false)", ""],
    ["Firm Email", preservedValues[4] || userEmail, "Email address for system notifications", ""],
    ["Test Mode", preservedValues[5] || "TRUE", "Enable test mode to try the system safely (true/false)", ""],
    ["", "", "", ""],
    ["👩‍⚖️ Lawyers", "", "", ""],
    ["Email", "Name", "Rate", "Lawyer ID"],
    ["lawyer1@email.com", "Jane Smith", "250", "JS"],
    ["lawyer2@email.com", "John Doe", "300", "JD"],
    ["", "", "", ""],
    ["", "", "", ""],
    ["", "", "", ""],
    ["", "", "", ""],
    ["", "", "", ""],
    ["", "", "", ""],
    ["", "", "", ""],
    ["✅ Quick Start Guide", "", "", ""],
    ["Step", "Action", "Details", ""],
    ["1", "Test the System", "Click 'Run Full Daily Sync' in the Blawby menu to process sample data", ""],
    ["2", "Send Test Email", "Use 'Send Test Email' to validate your email configuration", ""],
    ["3", "Connect Blawby", "Enter your Blawby payment page URL in the settings above", ""],
    ["4", "Add Your Team", "Add your lawyers in the section above", ""],
    ["5", "Set Up Zapier", "Create a Zap that triggers on new Stripe payments → sends payment info to this sheet", ""],
    ["6", "Replace Sample Data", "Delete sample rows and add your real data", ""],
    ["", "", "", ""],
    ["🎯 Menu Features", "", "", ""],
    ["Feature", "Purpose", "When to Use", ""],
    ["Run Full Daily Sync", "Complete system synchronization", "Daily automation or manual testing", ""],
    ["Sync Payments & Clients", "Process payments and update clients", "After new payments arrive", ""],
    ["Send Balance Digest", "Send low balance summary to firm", "Daily monitoring of client balances", ""],
    ["Generate Invoices", "Create invoices for all clients", "Monthly billing cycle", ""],
    ["Send Test Email", "Validate email configuration", "After setup or troubleshooting", ""],
    ["Validate Email Templates", "Check all templates are working", "After template updates", ""],
    ["Clear Template Cache", "Refresh email templates", "After template modifications", ""],
    ["Setup System", "Initial setup and triggers", "First-time setup only", ""],
    ["", "", "", ""],
    ["🧪 Testing Features", "", "", ""],
    ["Feature", "How to Test", "Expected Result", ""],
    ["System Validation", "Click 'Send Test Email' in menu", "Test email sent to verify configuration", ""],
    ["Template Validation", "Click 'Validate Email Templates'", "Confirms all email templates are working", ""],
    ["Client Creation", "Run 'Run Full Daily Sync' with sample payments", "Clients sheet populated with client1@example.com and client2@example.com", ""],
    ["Low Balance Warnings", "Add time logs to reduce balance below threshold", "Professional HTML email notifications sent to clients", ""],
    ["Matter Tracking", "Time logs are linked to matters by Matter ID", "Matter breakdown shown in invoices", ""],
    ["Email Notifications", "Set Email Notifications to TRUE and run sync", "Receipt emails sent to sample clients", ""],
    ["Template Cache", "Click 'Clear Template Cache' to refresh templates", "Useful when updating email templates", ""],
    ["", "", "", ""],
    ["📊 Sheet Overview", "", "", ""],
    ["Sheet", "Purpose", "Editable?", ""],
    ["Lawyers (in Welcome)", "Manage your legal team and their rates", "Yes", ""],
    ["Clients", "Track client balances and payment links", "Auto-updated", ""],
    ["TimeLogs", "Record billable hours and activities", "Yes", ""],
    ["Payments", "Track client payments and receipts", "Auto-updated", ""],
    ["Invoices", "View payment receipts and monthly summaries", "Auto-updated", ""],
    ["Matters", "Track client matters and case values", "Yes", ""],
    ["", "", "", ""],
    ["💡 How Retainers Work", "", "", ""],
    ["•", "Clients are automatically created when they make their first payment", "", ""],
    ["•", "Each payment generates a beautiful HTML receipt with current balance", "", ""],
    ["•", "Time is logged against the retainer balance with lawyer rates", "", ""],
    ["•", "Professional monthly summaries show hours used vs. balance", "", ""],
    ["•", "Low balance warnings are sent automatically with payment links", "", ""],
    ["•", "Payment links are auto-generated for easy client top-ups", "", ""],
    ["", "", "", ""],
    ["✨ What's New in v2.0", "", "", ""],
    ["Feature", "Benefit", "Impact", ""],
    ["Professional Email System", "Beautiful HTML emails with templates", "Better client communication", ""],
    ["Comprehensive Logging", "Detailed monitoring and debugging", "Easier troubleshooting", ""],
    ["Error Resilience", "Graceful error handling throughout", "More reliable operation", ""],
    ["Testing Utilities", "Built-in validation and testing tools", "Confidence in system setup", ""],
    ["Menu Integration", "Easy access to all features", "Better user experience", ""],
    ["Template Caching", "Fast template loading with validation", "Improved performance", ""],
    ["", "", "", ""],
    ["❓ Need Help?", "", "", ""],
    ["•", "Email: support@blawby.com", "", ""],
    ["•", "Docs: blawby.com/docs", "", ""],
    ["•", "GitHub Issues: Report bugs or request features", "", ""]
  ];

  // Write content to sheet
  welcomeSheet.getRange(1, 1, content.length, 4).setValues(content);

  // --- Restore preserved values into the Value column ---
  if (preservedValues.length > 0) {
    for (let i = 0; i < preservedValues.length; i++) {
      if (preservedValues[i] !== "" && preservedValues[i] !== undefined && preservedValues[i] !== null) {
        // Special handling for Firm Email field (index 4)
        if (i === 4) { // Firm Email is the 5th setting (index 4)
          const preservedEmail = preservedValues[i];
          // If the preserved value is a boolean or invalid, use the detected email
          if (preservedEmail === true || preservedEmail === false || 
              preservedEmail === "TRUE" || preservedEmail === "FALSE" ||
              !preservedEmail.includes('@') || preservedEmail === 'your-email@example.com') {
            welcomeSheet.getRange(5 + i, 2).setValue(userEmail);
            log(`📧 Replaced invalid Firm Email value "${preservedEmail}" with detected email: ${userEmail}`);
          } else {
            // Valid email, keep it
            welcomeSheet.getRange(5 + i, 2).setValue(preservedEmail);
            log(`📧 Preserved valid Firm Email: ${preservedEmail}`);
          }
        } else {
          // For all other settings, preserve the value as-is
          welcomeSheet.getRange(5 + i, 2).setValue(preservedValues[i]);
        }
      }
    }
  }

  // --- Restore preserved lawyers ---
  if (preservedLawyers.length > 0) {
    for (let i = 0; i < Math.min(preservedLawyers.length, 5); i++) {
      const lawyer = preservedLawyers[i];
      if (lawyer[0] && lawyer[0].includes('@')) {
        welcomeSheet.getRange(13 + i, 1, 1, 4).setValues([lawyer]);
      }
    }
  }

  // Format the sheet
  const headerRange = welcomeSheet.getRange(1, 1, 1, 4);
  headerRange.setFontSize(16)
             .setFontWeight("bold")
             .setBackground("#4285f4")
             .setFontColor("white")
             .setHorizontalAlignment("center")
             .merge();

  // Format section headers
  const sectionHeaders = [3, 11, 22, 30, 38, 46, 55, 63, 71, 79];
  sectionHeaders.forEach(row => {
    welcomeSheet.getRange(row, 1, 1, 4)
                .setFontWeight("bold")
                .setBackground("#f3f3f3")
                .setFontSize(14)
                .merge();
  });

  // Format settings table
  const settingsRange = welcomeSheet.getRange(4, 1, 7, 4);
  settingsRange.setBorder(true, true, true, true, true, true)
               .setHorizontalAlignment("left");

  // Format lawyers table
  const lawyersRange = welcomeSheet.getRange(12, 1, 8, 4);
  lawyersRange.setBorder(true, true, true, true, true, true)
              .setHorizontalAlignment("left");

  // Format quick start guide
  const guideRange = welcomeSheet.getRange(23, 1, 6, 4);
  guideRange.setBorder(true, true, true, true, true, true)
            .setHorizontalAlignment("left");

  // Format sheet overview
  const overviewRange = welcomeSheet.getRange(31, 1, 7, 4);
  overviewRange.setBorder(true, true, true, true, true, true)
               .setHorizontalAlignment("left");

  // Format testing features
  const testingRange = welcomeSheet.getRange(39, 1, 5, 4);
  testingRange.setBorder(true, true, true, true, true, true)
              .setHorizontalAlignment("left");

  // Format how retainers work
  const retainersRange = welcomeSheet.getRange(47, 1, 6, 4);
  retainersRange.setHorizontalAlignment("left");

  // Format need help
  const helpRange = welcomeSheet.getRange(55, 1, 2, 4);
  helpRange.setHorizontalAlignment("left");

  // Auto-resize columns
  welcomeSheet.autoResizeColumns(1, 4);

  // Freeze header row
  welcomeSheet.setFrozenRows(1);

  // Set column widths
  welcomeSheet.setColumnWidth(1, 200);
  welcomeSheet.setColumnWidth(2, 200);
  welcomeSheet.setColumnWidth(3, 200);
  welcomeSheet.setColumnWidth(4, 150);
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
    
    const welcomeSheet = getSheet('Welcome');
    if (!welcomeSheet) {
      console.log('Welcome sheet not found');
      return 0;
    }
    
    const data = welcomeSheet.getDataRange().getValues();
    if (data.length <= 1) {
      console.log('No lawyers found in sheet');
      return 0;
    }
    
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

    sendEmail(client.email, subject, body, { emailType: 'invoice' });
    log(`✅ Invoice email sent to ${client.email}`);
    
    return true;
  } catch (error) {
    console.error(`Error sending invoice email: ${error.message}`);
    return false;
  }
}

// Helper to parse lawyers from Welcome sheet
function getLawyersFromWelcomeSheet(welcomeSheet) {
  const values = welcomeSheet.getDataRange().getValues();
  const lawyerHeaderRow = values.findIndex(row => row[0] && row[0].toString().includes('Lawyers'));
  if (lawyerHeaderRow === -1) return [];
  // Lawyers data starts 2 rows below header (header + column names)
  const lawyers = values.slice(lawyerHeaderRow + 2).filter(row => row[0] && row[0].toString().includes('@'));
  // Add header row for compatibility with buildLawyerMaps
  return [["Email", "Name", "Rate", "Lawyer ID"], ...lawyers];
}

// Helper function to convert Zapier timestamp to proper date
function parseZapierTimestamp(timestamp) {
  try {
    // If it's already a Date object, return it
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    // Handle Excel serial number format (like 45824.6001)
    if (typeof timestamp === 'number' || !isNaN(parseFloat(timestamp))) {
      const serialNumber = parseFloat(timestamp);
      // Excel dates start from January 1, 1900, but Google Sheets uses January 1, 1899
      const date = new Date((serialNumber - 25569) * 86400 * 1000);
      return date;
    }
    
    // Handle string date formats
    if (typeof timestamp === 'string') {
      // Try parsing as ISO string first
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // Try parsing as other common formats
      const parsed = Date.parse(timestamp);
      if (!isNaN(parsed)) {
        return new Date(parsed);
      }
    }
    
    // If all else fails, return current date
    console.log(`Could not parse timestamp: ${timestamp}, using current date`);
    return new Date();
  } catch (error) {
    console.log(`Error parsing timestamp ${timestamp}: ${error.message}`);
    return new Date();
  }
} 