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
 * Safely detect the user's email address using the spreadsheet owner
 * @return {string} - Valid email address or fallback placeholder
 */
function detectEmail() {
  try {
    const owner = SpreadsheetApp.getActiveSpreadsheet().getOwner().getEmail();
    if (owner && owner.includes("@") && owner !== "") {
      log(`📧 Detected email from spreadsheet owner: ${owner}`);
      return owner;
    }
  } catch (e) {
    log(`⚠️ Spreadsheet owner detection failed: ${e.message}`);
  }
  
  // Only fallback if owner detection completely fails
  const fallback = "your-email@example.com";
  log(`⚠️ No valid email detected, using fallback: ${fallback}`);
  return fallback;
}

/**
 * Get the firm email address (always the spreadsheet owner)
 * @return {string} - Firm email address
 */
function getFirmEmail() {
  try {
    // Always use the spreadsheet owner's email
    const ownerEmail = SpreadsheetApp.getActiveSpreadsheet().getOwner().getEmail();
    if (ownerEmail && ownerEmail.includes('@') && ownerEmail !== 'your-email@example.com') {
      log(`📧 Using spreadsheet owner email: ${ownerEmail}`);
      return ownerEmail;
    }
    
    // Fallback error
    throw new Error("Could not detect spreadsheet owner email. Please ensure you have access to this spreadsheet.");
  } catch (error) {
    logError('getFirmEmail', error);
    throw new Error("Firm Email not available. Please ensure you have access to this spreadsheet.");
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
    payments: getSheet("Payments"),
    clients: getSheet("Clients"),
    timeLogs: getSheet("TimeLogs"),
    matters: getSheet("Matters"),
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
  const settingsData = welcomeSheet.getRange(5, 1, 3, 2).getValues(); // Get settings from Welcome sheet (rows 5-7, columns 1-2)
  console.log('🟦 Raw settingsData from Welcome sheet:', JSON.stringify(settingsData));
  const settings = { ...SETTINGS_DEFAULTS }; // Start with defaults
  
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
  Object.entries(SETTINGS_DEFAULTS).forEach(([key, defaultValue]) => {
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
  const names = {};
  const practiceAreas = {};
  
  for (let i = 1; i < lawyers.length; i++) {
    const [email, name, rate, lawyerID, practiceAreasStr] = lawyers[i];
    if (!lawyerID) continue;
    
    rates[lawyerID] = parseFloat(rate) || 0;
    if (email) emails[lawyerID] = email;
    if (name) names[lawyerID] = name;
    if (practiceAreasStr) practiceAreas[lawyerID] = practiceAreasStr;
  }
  
  return { rates, emails, names, practiceAreas };
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
  
  // Setup sheets with proper headers
  setupClientsSheet(sheets.clientsSheet);
  setupTimeLogsSheet(sheets.timeLogsSheet);
  setupPaymentsSheet(sheets.paymentsSheet);
  setupMattersSheet(sheets.mattersSheet);
}

function setupPaymentsSheet(sheet) {
  const headers = [
    "Date",
    "Client Email", 
    "Amount",
    "Payment Method",
    "Payment ID",
    "Message-ID"
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

function setupLowBalanceSheet(sheet) {
  const headers = [
    "Client Email",
    "Client Name",
    "Balance ($)",
    "Warning"
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
    "Case Value",
    "Practice Area",
    "Assigned Lawyer",
    "Assigned Lawyer Email"
  ];
  setupSheet(sheet, headers);
}

function setupSheet(sheet, headers) {
  // Clear existing headers
  sheet.clear();
  
  // Add headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

function setupWelcomeSheet(ss) {
  const welcomeSheet = getOrCreateSheet(ss, "Welcome");

  // --- Preserve existing values in the Value column (column 2) for settings rows ---
  let preservedValues = [];
  try {
    const maybeExisting = welcomeSheet.getRange(5, 1, 3, 2).getValues();
    preservedValues = maybeExisting.map(row => row[1]);
  } catch (e) {
    preservedValues = [];
  }

  // --- Get the spreadsheet owner's email (whoever copied the sheet) ---
  let ownerEmail = "your-email@example.com"; // placeholder
  try {
    ownerEmail = ss.getOwner().getEmail();
    log(`📧 Detected spreadsheet owner email: ${ownerEmail}`);
  } catch (e) {
    logError('setupWelcomeSheet owner detection', e);
    ownerEmail = "your-email@example.com";
  }

  // --- Preserve existing lawyers section if present ---
  let preservedLawyers = [];
  try {
    const values = welcomeSheet.getDataRange().getValues();
    const lawyerHeaderRow = values.findIndex(row => row[0] && row[0].toString().includes('Lawyers'));
    if (lawyerHeaderRow > -1) {
      // Get all lawyer rows (up to 5) that have valid email addresses
      const lawyerRows = values.slice(lawyerHeaderRow + 2, lawyerHeaderRow + 7)
        .filter(row => row[0] && row[0].toString().includes('@'))
        .map(row => row.slice(0, 5)); // Ensure we have 5 columns
      preservedLawyers = lawyerRows;
    }
  } catch (e) {
    preservedLawyers = [];
  }
  
  // Clear existing content completely
  welcomeSheet.clear();
  
  // Set up the content - clean and focused on configuration only
  const content = [
    ["Welcome to Blawby Retainer Management", "", "", "", ""],
    ["", "", "", "", ""],
    ["⚙️ System Settings", "", "", "", ""],
    ["Setting", "Value", "Description", "", ""],
    ["Blawby Payment URL", preservedValues[0] || "https://app.blawby.com/pay", "Your Blawby payment page URL", "", ""],
    ["Default Currency", preservedValues[1] || "USD", "Default currency for all payments", "", ""],
    ["Low Balance Threshold", preservedValues[2] || "500", "Target balance amount for all clients", "", ""],
    ["", "", "", "", ""],
    ["👩‍⚖️ Lawyers", "", "", "", ""],
    ["Email", "Name", "Rate", "Lawyer ID", "Practice Areas"]
  ];
  
  // Add preserved lawyers or placeholders if none exist
  if (preservedLawyers.length > 0) {
    // Use preserved lawyers
    preservedLawyers.forEach(lawyer => {
      content.push([lawyer[0] || "", lawyer[1] || "", lawyer[2] || "", lawyer[3] || "", lawyer[4] || ""]);
    });
  } else {
    // Add placeholder lawyers only if no preserved lawyers exist
    content.push(["lawyer1@email.com", "Jane Smith", "250", "JS", "Corporate Law, Contracts"]);
    content.push(["lawyer2@email.com", "John Doe", "300", "JD", "Litigation, Family Law"]);
  }
  
  // Add empty rows to fill up to 17 total rows
  while (content.length < 17) {
    content.push(["", "", "", "", ""]);
  }
  
  // Write content to sheet with exact column count
  welcomeSheet.getRange(1, 1, content.length, 5).setValues(content);

  // --- Restore preserved values into the Value column ---
  if (preservedValues.length > 0) {
    for (let i = 0; i < preservedValues.length; i++) {
      if (preservedValues[i] !== "" && preservedValues[i] !== undefined && preservedValues[i] !== null) {
        // For all settings, preserve the value as-is
        welcomeSheet.getRange(5 + i, 2).setValue(preservedValues[i]);
      }
    }
  }
}


function getLawyersFromWelcomeSheet(welcomeSheet) {
  const values = welcomeSheet.getDataRange().getValues();
  const lawyerHeaderRow = values.findIndex(row => row[0] && row[0].toString().includes('Lawyers'));
  if (lawyerHeaderRow === -1) return [];
  // Lawyers data starts 2 rows below header (header + column names)
  const lawyers = values.slice(lawyerHeaderRow + 2).filter(row => row[0] && row[0].toString().includes('@'));
  // Add header row for compatibility with buildLawyerMaps
  return [["Email", "Name", "Rate", "Lawyer ID", "Practice Areas"], ...lawyers];
}

/**
 * Helper function to convert Zapier timestamp to proper date
 * @param {*} timestamp - The timestamp to parse
 * @return {Date} - Parsed date object
 */
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

/**
 * Delete all triggers for a specific function
 * @param {string} functionName - Name of the function to delete triggers for
 */
function deleteTriggersByFunction(functionName) {
  const triggers = ScriptApp.getProjectTriggers();
  for (const t of triggers) {
    if (t.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(t);
      log(`🗑️ Deleted trigger: ${functionName}`);
    }
  }
} 