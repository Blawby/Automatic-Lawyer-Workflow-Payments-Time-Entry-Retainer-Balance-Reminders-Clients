// ========== MAIN ENTRY POINTS ==========
function dailySync() {
  console.log("Starting daily sync...");
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("No active spreadsheet found");
  }
  
  const sheets = getSheets(ss);
  
  // Set up all sheets with proper headers and formatting
  setupAllSheets(sheets);
  
  // Sync payments and clients
  syncPaymentsAndClients();
  
  // Send daily balance digest
  sendDailyBalanceDigest();
  
  // Generate invoices
  generateInvoices();
  
  console.log("Daily sync completed successfully");
}

// Manual trigger functions
function manualSyncClients() {
  syncPaymentsAndClients();
}

function manualGenerateInvoices() {
  generateInvoices();
}

// Time-based triggers
function createDailyTrigger() {
  // Delete any existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === "dailySync") {
      ScriptApp.deleteTrigger(trigger);
    }
  }
  
  // Get settings
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = getSheets(ss);
  const settings = loadSettings(sheets.settingsSheet);
  
  // Parse sync time
  const [syncHour, syncMinute] = settings[SETTINGS_KEYS.DAILY_SYNC_TIME].split(':').map(Number);
  
  // Create new trigger to run daily at specified time
  ScriptApp.newTrigger("dailySync")
    .timeBased()
    .atHour(syncHour)
    .nearMinute(syncMinute)
    .everyDays(1)
    .create();
    
  console.log(`📅 Daily sync trigger created for ${settings[SETTINGS_KEYS.DAILY_SYNC_TIME]}`);
}

function createServiceResumeTrigger() {
  // Delete any existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === "checkServiceResumption") {
      ScriptApp.deleteTrigger(trigger);
    }
  }
  
  // Create new trigger to run every 6 hours
  ScriptApp.newTrigger("checkServiceResumption")
    .timeBased()
    .everyHours(6)
    .create();
}

function checkServiceResumption() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = getSheets(ss);
  const data = loadSheetData(sheets);
  const settings = loadSettings(sheets.settingsSheet);
  
  const lawyerData = buildLawyerMaps(data.lawyers);
  const clientsById = buildClientMap(data.clientData);
  
  for (const [clientID, row] of Object.entries(clientsById)) {
    const email = row[0];
    const clientName = row[1] || "Client";
    const targetBalance = parseFloat(row[2]) || 0;
    
    const balanceInfo = calculateClientBalance(clientID, email, data, lawyerData.rates);
    const balance = balanceInfo.totalPaid - balanceInfo.totalUsed;
    
    // Check if service should be resumed
    if (balance > 0 && balance >= targetBalance) {
      notifyServiceResumed(clientID, email, clientName, balance, settings.today);
    }
  }
} 