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
  // 1. Sync payments and clients (creates/updates client records)
  console.log("📊 Syncing payments and clients...");
  syncPaymentsAndClients();
  
  // 2. Send daily balance digest (notifies about low balances)
  console.log("📧 Sending daily balance digest...");
  sendDailyBalanceDigest();
  
  // 3. Generate invoices (creates monthly summaries)
  console.log("🧾 Generating invoices...");
  generateInvoicesForAllClients();
}

/**
 * Syncs only payments and clients (for manual testing)
 */
function syncPaymentsAndClientsOnly() {
  console.log("📊 Syncing payments and clients only...");
  validateSpreadsheetAccess();
  const sheets = getSheetsAndSetup();
  syncPaymentsAndClients();
  console.log("✅ Payments and clients sync completed");
}

/**
 * Sends only the daily balance digest (for manual testing)
 */
function sendDailyBalanceDigestOnly() {
  console.log("📧 Sending daily balance digest only...");
  validateSpreadsheetAccess();
  sendDailyBalanceDigest();
  console.log("✅ Daily balance digest sent");
}

/**
 * Generates only invoices (for manual testing)
 */
function generateInvoicesOnly() {
  console.log("🧾 Generating invoices only...");
  validateSpreadsheetAccess();
  const sheets = getSheetsAndSetup();
  generateInvoicesForAllClients();
  console.log("✅ Invoice generation completed");
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
  ui.createMenu('Blawby')
    .addItem('Run Full Daily Sync', 'manualDailySync')
    .addSeparator()
    .addItem('Sync Payments & Clients', 'manualSyncClients')
    .addItem('Send Balance Digest', 'manualSendDigest')
    .addItem('Generate Invoices', 'manualGenerateInvoices')
    .addSeparator()
    .addItem('Validate Email Templates', 'validateTemplates')
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
  
  // Run the daily sync process
  dailySync();
  
  // Show completion message
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Sync Complete',
    'The daily sync process has completed. Check your email for the digest.',
    ui.ButtonSet.OK
  );
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
  const url = `https://docs.google.com/spreadsheets/d/${templateId}/copy`;
  
  const output = HtmlService.createHtmlOutput(
    `<html>
      <head>
        <title>Redirecting to Blawby Template...</title>
        <script>
          window.location.href = "${url}";
        </script>
      </head>
      <body>
        <p>Redirecting to the Blawby template spreadsheet...</p>
        <p>If you are not redirected, <a href="${url}">click here</a>.</p>
      </body>
    </html>`
  );
  
  return output;
}

/**
 * Sets up the entire system (sheets, triggers, etc.)
 * This function can be run manually for initial setup.
 */
function setupSystem() {
  console.log('🚀 Setting up Blawby system...');
  
  try {
    validateSpreadsheetAccess();
    const sheets = getSheetsAndSetup();
    
    // Create triggers
    createDailyTrigger();
    createServiceResumeTrigger();
    
    console.log('✅ System setup completed successfully');
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Setup Complete',
      'The Blawby system has been set up successfully!\n\n' +
      '• All sheets have been created and formatted\n' +
      '• Daily sync trigger has been created (6 AM)\n' +
      '• Service resumption trigger has been created (every 6 hours)\n\n' +
      'You can now start using the system.',
      ui.ButtonSet.OK
    );
  } catch (error) {
    console.error('❌ System setup failed:', error.message);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Setup Failed',
      `System setup failed: ${error.message}\n\nPlease check the logs and try again.`,
      ui.ButtonSet.OK
    );
  }
}

/**
 * Deletes all triggers for a specific function
 * @param {string} functionName - Name of the function to delete triggers for
 */
function deleteTriggersByFunction(functionName) {
  const triggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;
  
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(trigger);
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    console.log(`🗑️ Deleted ${deletedCount} existing trigger(s) for ${functionName}`);
  }
}

/**
 * Validates all email templates and shows results
 */
function validateTemplates() {
  logStart('validateTemplates');
  
  try {
    const isValid = validateEmailTemplates();
    
    if (isValid) {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        'Template Validation',
        '✅ All email templates are valid and ready to use!',
        ui.ButtonSet.OK
      );
    } else {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        'Template Validation',
        '❌ Some email templates are missing or invalid. Please check the logs.',
        ui.ButtonSet.OK
      );
    }
  } catch (error) {
    logError('validateTemplates', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Template Validation Error',
      `Template validation failed: ${error.message}`,
      ui.ButtonSet.OK
    );
  }
  
  logEnd('validateTemplates');
} 