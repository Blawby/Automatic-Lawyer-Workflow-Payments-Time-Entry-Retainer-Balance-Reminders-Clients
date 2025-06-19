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
  generateInvoicesForAllClients();
  
  console.log("Daily sync completed successfully");
}

// Manual trigger functions
function manualSyncClients() {
  syncPaymentsAndClients();
}

function manualGenerateInvoices() {
  generateInvoicesForAllClients();
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
  
  // Create new trigger to run daily at 6 AM
  ScriptApp.newTrigger("dailySync")
    .timeBased()
    .atHour(6)
    .everyDays(1)
    .create();
    
  console.log("📅 Daily sync trigger created for 06:00");
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
    .addItem('Run Daily Sync', 'manualDailySync')
    .addSeparator()
    .addItem('Generate Invoices', 'generateInvoicesForAllClients')
    .addToUi();
}

/**
 * Manually triggers the daily sync process.
 * Only works when Test Mode is enabled.
 */
function manualDailySync() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
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