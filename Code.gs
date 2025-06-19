// ========== MAIN ENTRY POINTS ==========
function dailySync() {
  console.log("🔄 Starting daily sync...");
  
  try {
    // Validate spreadsheet access
    validateSpreadsheetAccess();
    
    // Get sheets and ensure they're properly set up
    const sheets = getSheetsAndSetup();
    
    // Execute all sync operations
    executeSyncOperations(sheets);
    
    console.log("✅ Daily sync completed successfully");
  } catch (error) {
    console.error("❌ Daily sync failed:", error.message);
    throw error;
  }
}

/**
 * Validates that we have access to the active spreadsheet
 */
function validateSpreadsheetAccess() {
  getActiveSpreadsheet();
}

/**
 * Gets sheets and ensures they're properly set up
 * @return {Object} Sheets object with all required sheets
 */
function getSheetsAndSetup() {
  const sheets = getSheets();
  
  // Set up all sheets with proper headers and formatting
  setupAllSheets(sheets);
  
  return sheets;
}

/**
 * Executes all sync operations in the correct order
 * @param {Object} sheets - Sheets object with all required sheets
 */
function executeSyncOperations(sheets) {
  logStart('executeSyncOperations');
  
  try {
    // 1. Sync payments and clients (creates/updates client records)
    log("📊 Syncing payments and clients...");
    try {
      syncPaymentsAndClients();
      log("✅ Payments and clients sync completed");
    } catch (error) {
      logError('syncPaymentsAndClients', error);
      // Continue with other operations even if this fails
    }
    
    // 2. Send daily balance digest (notifies about low balances)
    log("📧 Sending daily balance digest...");
    try {
      sendDailyBalanceDigest();
      log("✅ Daily balance digest sent");
    } catch (error) {
      logError('sendDailyBalanceDigest', error);
      // Continue with other operations even if this fails
    }
    
    // 3. Generate invoices (creates monthly summaries)
    log("🧾 Generating invoices...");
    try {
      generateInvoicesForAllClients();
      log("✅ Invoice generation completed");
    } catch (error) {
      logError('generateInvoicesForAllClients', error);
      // Continue with other operations even if this fails
    }
    
    log("✅ All sync operations completed");
  } catch (error) {
    logError('executeSyncOperations', error);
    throw error;
  }
  
  logEnd('executeSyncOperations');
}

/**
 * Syncs only payments and clients (for manual testing)
 */
function syncPaymentsAndClientsOnly() {
  logStart('syncPaymentsAndClientsOnly');
  
  try {
    validateSpreadsheetAccess();
    const sheets = getSheetsAndSetup();
    syncPaymentsAndClients();
    log("✅ Payments and clients sync completed");
  } catch (error) {
    logError('syncPaymentsAndClientsOnly', error);
    throw error;
  }
  
  logEnd('syncPaymentsAndClientsOnly');
}

/**
 * Sends only the daily balance digest (for manual testing)
 */
function sendDailyBalanceDigestOnly() {
  logStart('sendDailyBalanceDigestOnly');
  
  try {
    validateSpreadsheetAccess();
    sendDailyBalanceDigest();
    log("✅ Daily balance digest sent");
  } catch (error) {
    logError('sendDailyBalanceDigestOnly', error);
    throw error;
  }
  
  logEnd('sendDailyBalanceDigestOnly');
}

/**
 * Generates only invoices (for manual testing)
 */
function generateInvoicesOnly() {
  logStart('generateInvoicesOnly');
  
  try {
    validateSpreadsheetAccess();
    const sheets = getSheetsAndSetup();
    generateInvoicesForAllClients();
    log("✅ Invoice generation completed");
  } catch (error) {
    logError('generateInvoicesOnly', error);
    throw error;
  }
  
  logEnd('generateInvoicesOnly');
}

// Manual trigger functions
function manualSyncClients() {
  syncPaymentsAndClientsOnly();
}

function manualGenerateInvoices() {
  generateInvoicesOnly();
}

function manualSendDigest() {
  sendDailyBalanceDigestOnly();
}

// Time-based triggers
function createDailyTrigger() {
  console.log('📅 Creating daily sync trigger...');
  
  try {
    // Delete any existing daily sync triggers
    deleteTriggersByFunction('dailySync');
    
    // Create new trigger to run daily at 6 AM
    ScriptApp.newTrigger("dailySync")
      .timeBased()
      .atHour(6)
      .everyDays(1)
      .create();
      
    console.log("✅ Daily sync trigger created for 06:00");
  } catch (error) {
    console.error('❌ Failed to create daily trigger:', error.message);
    throw error;
  }
}

function createServiceResumeTrigger() {
  console.log('🔄 Creating service resumption trigger...');
  
  try {
    // Delete any existing service resumption triggers
    deleteTriggersByFunction('checkServiceResumption');
    
    // Create new trigger to run every 6 hours
    ScriptApp.newTrigger("checkServiceResumption")
      .timeBased()
      .everyHours(6)
      .create();
      
    console.log("✅ Service resumption trigger created (every 6 hours)");
  } catch (error) {
    console.error('❌ Failed to create service resumption trigger:', error.message);
    throw error;
  }
}

function checkServiceResumption() {
  const sheets = getSheets();
  const data = loadSheetData(sheets);
  
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
      notifyServiceResumed(clientID, email, clientName, balance, new Date().toISOString().split('T')[0]);
    }
  }
}

/**
 * Creates a custom menu when the spreadsheet is opened.
 * This function is automatically triggered when the spreadsheet is opened.
 */
function onOpen(e) {
  const ui = SpreadsheetApp.getUi();
  
  // Try to automatically fix the Firm Email field if it's showing boolean values
  try {
    const welcomeSheet = getSheet("Welcome");
    const firmEmailCell = welcomeSheet.getRange(9, 2); // Firm Email is in row 9, column 2
    const currentValue = firmEmailCell.getValue();
    
    // Check if the current value is invalid and try to fix it
    if (currentValue === true || currentValue === false || 
        currentValue === "TRUE" || currentValue === "FALSE") {
      
      log(`🔧 Auto-fixing Firm Email field: "${currentValue}"`);
      const fixed = fixFirmEmailField();
      
      if (fixed) {
        log(`✅ Successfully auto-fixed Firm Email field`);
      } else {
        log(`⚠️ Could not auto-fix Firm Email field`);
      }
    }
  } catch (error) {
    logError('onOpen auto-fix', error);
  }
  
  // Validate firm email configuration with improved detection
  try {
    const firmEmail = getFirmEmail();
    if (!firmEmail || !firmEmail.includes('@') || firmEmail === 'your-email@example.com') {
      ui.alert(
        '⚠️ Email Configuration Required',
        'Your firm email is not properly configured.\n\n' +
        '📧 Please go to the Welcome sheet and update the "Firm Email" setting with your actual email address.\n\n' +
        '🔧 This is required for the system to send you notifications and test emails.\n\n' +
        '💡 Tip: Try "Fix Firm Email" in the Blawby menu to auto-detect your email.',
        ui.ButtonSet.OK
      );
    } else {
      // Show success message for first-time users
      log(`✅ Firm email configured: ${firmEmail}`);
    }
  } catch (error) {
    ui.alert(
      '⚠️ Email Configuration Error',
      'There was an error reading your email configuration.\n\n' +
      '📧 Please go to the Welcome sheet and update the "Firm Email" setting.\n\n' +
      '🔧 Error: ' + error.message + '\n\n' +
      '💡 Try "Fix Firm Email" in the Blawby menu to auto-detect your email.',
      ui.ButtonSet.OK
    );
  }
  
  ui.createMenu('Blawby')
    .addItem('Run Full Daily Sync', 'manualDailySync')
    .addSeparator()
    .addItem('Sync Payments & Clients', 'manualSyncClients')
    .addItem('Send Balance Digest', 'manualSendDigest')
    .addItem('Generate Invoices', 'manualGenerateInvoices')
    .addSeparator()
    .addItem('Send Test Email', 'sendTestEmail')
    .addItem('Fix Firm Email', 'fixFirmEmailField')
    .addItem('Validate Email Templates', 'validateTemplates')
    .addItem('Clear Template Cache', 'clearTemplateCache')
    .addItem('Setup System', 'setupSystem')
    .addToUi();
}

/**
 * Manually triggers the daily sync process.
 * Only works when Test Mode is enabled.
 */
function manualDailySync() {
  console.log('🔍 Starting manualDailySync...');
  
  if (!isTestMode()) {
    console.log('❌ Test Mode is disabled, showing alert...');
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Test Mode Required',
      'Please enable Test Mode in the Welcome sheet before running manual sync.',
      ui.ButtonSet.OK
    );
    return;
  }
  
  console.log('🔄 Starting manual daily sync...');
  
  try {
    // Validate email configuration first
    const firmEmail = getFirmEmail();
    if (!firmEmail || !firmEmail.includes('@') || firmEmail === 'your-email@example.com') {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        '⚠️ Email Configuration Required',
        'Your firm email is not properly configured.\n\n' +
        'Please go to the Welcome sheet and update the "Firm Email" setting with your actual email address.\n\n' +
        'Without this, you won\'t receive any emails from the system.',
        ui.ButtonSet.OK
      );
      return;
    }
    
    // Run the daily sync process
    dailySync();
    
    // Show completion message with email info
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Sync Complete',
      `✅ The daily sync process has completed successfully!\n\n` +
      `📧 Test emails have been sent to: ${firmEmail}\n\n` +
      `🔍 Check your inbox for:\n` +
      `• Payment receipts for sample clients\n` +
      `• Daily balance digest\n` +
      `• Any low balance warnings\n\n` +
      `💡 If you don't see emails, check your spam folder or verify your email address in the Welcome sheet.`,
      ui.ButtonSet.OK
    );
  } catch (error) {
    logError('manualDailySync', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Sync Failed',
      `❌ The daily sync process failed:\n\n${error.message}\n\n` +
      `Please check your email configuration in the Welcome sheet and try again.`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * Creates a manual trigger for testing purposes.
 * This function can be run manually from the script editor.
 */
function createManualTrigger() {
  // Delete any existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Create a new trigger for onOpen
  ScriptApp.newTrigger('onOpen')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onOpen()
    .create();
    
  console.log('✅ Manual trigger created successfully');
}

/**
 * Handles GET requests to the web app.
 * This function is required for the web app deployment.
 * @param {Object} e The event object from the request
 * @return {HTMLOutput} The HTML output that redirects to the template
 */
function doGet(e) {
  // Replace this ID with your template spreadsheet ID
  const templateId = SpreadsheetApp.getActiveSpreadsheet().getId();
  const url = `