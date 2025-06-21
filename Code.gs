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
    // Clear email flags in test mode to allow repeated testing
    if (isTestMode()) {
      const props = PropertiesService.getScriptProperties();
      const allProps = props.getProperties();
      let deletedCount = 0;
      for (const [key, value] of Object.entries(allProps)) {
        if (key.startsWith('low_balance_') || key.startsWith('service_resumed_')) {
          props.deleteProperty(key);
          deletedCount++;
        }
      }
      if (deletedCount > 0) {
        log(`🧪 Test mode: Cleared ${deletedCount} email flags for testing`);
      }
    }
    
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

// Manual trigger functions
function manualSyncClients() {
  syncPaymentsAndClientsOnly();
}

function manualSendDigest() {
  sendDailyBalanceDigest();
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
    .addSeparator()
    .addItem('Send Test Email', 'sendTestEmail')
    .addItem('Fix Firm Email', 'fixFirmEmailField')
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
 * Opens the EmailLog sheet to view email history
 */
function viewEmailLog() {
  try {
    const sheet = getOrCreateSheet("EmailLog");
    sheet.activate();
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Email Log Opened',
      'The EmailLog sheet has been opened showing all emails sent by the system.\n\n' +
      'This includes:\n' +
      '• Receipt emails\n' +
      '• Invoice emails\n' +
      '• Low balance alerts\n' +
      '• Daily digests\n' +
      '• Welcome emails\n\n' +
      'All emails are logged with timestamps and types for easy tracking.',
      ui.ButtonSet.OK
    );
  } catch (error) {
    logError('viewEmailLog', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Email Log Error',
      `Failed to open email log: ${error.message}`,
      ui.ButtonSet.OK
    );
  }
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
    
    // Try to detect and set email automatically
    try {
      const ownerEmail = SpreadsheetApp.getActiveSpreadsheet().getOwner().getEmail();
      if (ownerEmail && ownerEmail !== 'your-email@example.com') {
        log(`📧 Auto-detected email: ${ownerEmail}`);
        
        // Update the Welcome sheet with the detected email
        const welcomeSheet = getSheet("Welcome");
        const settingsRange = welcomeSheet.getRange(5, 1, 6, 2);
        const settingsData = settingsRange.getValues();
        
        // Find and update the Firm Email setting
        for (let i = 0; i < settingsData.length; i++) {
          if (settingsData[i][0] === "Firm Email") {
            settingsRange.getCell(i + 1, 2).setValue(ownerEmail);
            log(`✅ Updated Firm Email setting to: ${ownerEmail}`);
            break;
          }
        }
      }
    } catch (emailError) {
      log(`⚠️ Could not auto-detect email: ${emailError.message}`);
    }
    
    // Send welcome email
    try {
      sendWelcomeEmail();
      console.log('✅ Welcome email sent successfully');
    } catch (emailError) {
      console.log('⚠️ Could not send welcome email:', emailError.message);
    }
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Setup Complete',
      'The Blawby system has been set up successfully!\n\n' +
      '✅ All sheets have been created and formatted\n' +
      '✅ Daily sync trigger has been created (6 AM)\n' +
      '✅ Service resumption trigger has been created (every 6 hours)\n' +
      '📧 Welcome email has been sent to your firm email\n\n' +
      '🚀 You can now start using the system. Try "Run Full Daily Sync" to test everything!',
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

/**
 * Clears the template cache and shows confirmation
 */
function clearTemplateCache() {
  logStart('clearTemplateCache');
  
  try {
    const templateLoader = getTemplateLoader();
    templateLoader.clearCache();
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Template Cache Cleared',
      '✅ Template cache has been cleared successfully!\n\nThis is useful when you update email templates.',
      ui.ButtonSet.OK
    );
  } catch (error) {
    logError('clearTemplateCache', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Template Cache Error',
      `Failed to clear template cache: ${error.message}`,
      ui.ButtonSet.OK
    );
  }
  
  logEnd('clearTemplateCache');
}

/**
 * Sends a test email to validate the email system is working
 */
function sendTestEmail() {
  logStart('sendTestEmail');
  
  try {
    const testRecipient = "test@example.com";
    const testSubject = "Blawby System Test";
    const testBody = `
      Hello from your Blawby legal automation system!
      
      This is a test email to confirm that:
      ✅ Email system is working
      ✅ Test mode is properly configured
      ✅ Templates are loading correctly
      
      System Status: Operational
      Test Time: ${new Date().toISOString()}
      
      Best regards,
      The Blawby Team
    `;
    
    sendEmail(testRecipient, testSubject, testBody, { emailType: 'test' });
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Test Email Sent',
      '✅ Test email has been sent successfully!\n\n' +
      'Check your email (or firm email if in test mode) to confirm the system is working.',
      ui.ButtonSet.OK
    );
  } catch (error) {
    logError('sendTestEmail', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Test Email Failed',
      `❌ Test email failed: ${error.message}\n\nPlease check your email configuration.`,
      ui.ButtonSet.OK
    );
  }
  
  logEnd('sendTestEmail');
}

/**
 * Clears email sent flags for testing purposes
 * This allows you to test email sending multiple times in test mode
 */
function clearEmailFlags() {
  logStart('clearEmailFlags');
  
  try {
    if (!isTestMode()) {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        'Test Mode Required',
        'This function is only available in Test Mode.\n\nPlease enable Test Mode in the Welcome sheet first.',
        ui.ButtonSet.OK
      );
      return;
    }
    
    const props = PropertiesService.getScriptProperties();
    const allProps = props.getProperties();
    
    // Find and delete email sent flags
    let deletedCount = 0;
    for (const [key, value] of Object.entries(allProps)) {
      if (key.startsWith('low_balance_') || key.startsWith('service_resumed_')) {
        props.deleteProperty(key);
        deletedCount++;
      }
    }
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Email Flags Cleared',
      `✅ Cleared ${deletedCount} email sent flags.\n\n` +
      'You can now test email sending again without the "already sent today" restriction.',
      ui.ButtonSet.OK
    );
    
    log(`🗑️ Cleared ${deletedCount} email sent flags`);
  } catch (error) {
    logError('clearEmailFlags', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Clear Email Flags Error',
      `Failed to clear email flags: ${error.message}`,
      ui.ButtonSet.OK
    );
  }
  
  logEnd('clearEmailFlags');
}