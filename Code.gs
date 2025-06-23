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
 * Check Gmail for new Blawby payment notifications and process them
 * This function runs automatically via trigger every 15 minutes
 */
function checkForBlawbyPayments() {
  logStart('checkForBlawbyPayments');
  
  try {
    const paymentsSheet = getSheet(SHEET_NAMES.PAYMENTS);
    let newPayments = 0;
    let totalThreads = 0;
    let processedEmails = new Set(); // Track processed emails to avoid duplicates
    
    // Start with unread emails first (most likely to be new)
    const queries = [
      'from:notifications@blawby.com subject:"Payment of" is:unread newer_than:1d',  // Unread emails first
      'from:notifications@blawby.com subject:"Payment of" is:read newer_than:7d',   // Then read emails from last 7 days
      'from:notifications@blawby.com subject:"Payment" is:read newer_than:7d'       // Broader payment search
    ];
    
    for (const query of queries) {
      log(`🔍 Searching with query: "${query}"`);
      const threads = GmailApp.search(query);
      totalThreads += threads.length;
      log(`📧 Found ${threads.length} threads with this query`);
      
      for (const thread of threads) {
        const message = thread.getMessages()[0];
        const messageId = message.getId();
        const subject = message.getSubject();
        
        // Skip if we've already processed this email
        if (processedEmails.has(messageId)) {
          log(`🔄 Skipping already processed email: "${subject}"`);
          continue;
        }
        
        log(`📧 Processing email: "${subject}" from ${message.getFrom()}`);
        
        const htmlBody = message.getBody();
        const parsed = parseBlawbyPaymentEmail(htmlBody);
        
        if (parsed && parsed.paymentId && !paymentExists(paymentsSheet, parsed.paymentId)) {
          // Add payment to sheet
          paymentsSheet.appendRow([
            new Date(),                    // Date
            parsed.clientEmail || '',     // Client Email (primary identifier)
            parsed.amount || 0,           // Amount
            parsed.method || 'card',      // Payment Method
            parsed.paymentId              // Payment ID (for deduplication)
          ]);
          
          log(`💵 New payment recorded: ${parsed.paymentId} - $${parsed.amount} from ${parsed.clientEmail}`);
          newPayments++;
          
          // Mark as read and archive
          if (thread.isUnread()) {
            thread.markRead();
            log(`📧 Marked email as read`);
          }
          thread.moveToArchive();
          log(`📧 Archived email thread`);
          
        } else if (parsed && parsed.paymentId) {
          log(`🔄 Payment ${parsed.paymentId} already exists in sheet, skipping`);
          // Still mark as read and archive to avoid reprocessing
          if (thread.isUnread()) {
            thread.markRead();
            log(`📧 Marked duplicate email as read`);
          }
          thread.moveToArchive();
          log(`📧 Archived duplicate email thread`);
        } else {
          log(`⚠️ Could not parse payment from email: "${subject}"`);
          // Don't archive emails we can't parse - leave them for manual review
        }
        
        // Mark this email as processed
        processedEmails.add(messageId);
      }
    }
    
    log(`📊 Total threads found: ${totalThreads}, processed: ${processedEmails.size}`);
    
    if (newPayments > 0) {
      log(`🔄 Processing ${newPayments} new payment(s) with full sync...`);
      syncPaymentsAndClients(); // Use existing sync function
      log(`✅ Synced ${newPayments} new payment(s) from Gmail`);
    } else {
      log(`📭 No new payments found to process`);
    }
  } catch (error) {
    logError('checkForBlawbyPayments', error);
    throw error;
  }
  
  logEnd('checkForBlawbyPayments');
}

/**
 * Parse Blawby payment notification email HTML
 * @param {string} html - The HTML body of the email
 * @return {Object|null} - Parsed payment data or null if parsing failed
 */
function parseBlawbyPaymentEmail(html) {
  try {
    log('🔍 Parsing Blawby payment email...');
    
    // Extract payment amount - look for the amount in the payment section
    const amountMatch = html.match(/\$([0-9,]+\.?[0-9]*)/);
    
    // Extract client email - look for CLIENT EMAIL section
    const emailMatch = html.match(/CLIENT EMAIL<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>/i);
    
    // Extract client name - look for CLIENT NAME section
    const nameMatch = html.match(/CLIENT NAME<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>/i);
    
    // Extract payment method - look for PAYMENT METHOD section
    const methodMatch = html.match(/PAYMENT METHOD<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>/i);
    
    // Extract payment ID - look for PAYMENT ID section
    const idMatch = html.match(/PAYMENT ID<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>/i);
    
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
    const clientEmail = emailMatch ? emailMatch[1].trim() : null;
    const clientName = nameMatch ? nameMatch[1].trim() : null;
    const method = methodMatch ? methodMatch[1].trim().toLowerCase() : 'card';
    const paymentId = idMatch ? idMatch[1].trim() : null;
    
    log(`📊 Parsed data: amount=${amount}, email=${clientEmail}, name=${clientName}, method=${method}, id=${paymentId}`);
    
    // Validate required fields
    if (!amount || !paymentId) {
      log(`⚠️ Missing required payment data: amount=${amount}, id=${paymentId}`);
      return null;
    }
    
    // For client email, if it's "Not provided", we'll use the client name as identifier
    const finalClientEmail = (clientEmail && clientEmail !== 'Not provided') ? clientEmail : 
                            (clientName ? `${clientName.toLowerCase().replace(/\s+/g, '.')}@client.blawby.com` : null);
    
    // Validate email format (if we have one)
    if (finalClientEmail && !isValidEmail(finalClientEmail)) {
      log(`⚠️ Invalid email format in payment: ${finalClientEmail}`);
      return null;
    }
    
    log(`✅ Successfully parsed payment: $${amount} from ${finalClientEmail} (ID: ${paymentId})`);
    
    return {
      amount: amount,
      clientEmail: finalClientEmail,
      clientName: clientName,
      method: method,
      paymentId: paymentId
    };
  } catch (error) {
    logError('parseBlawbyPaymentEmail', error);
    return null;
  }
}

/**
 * Create trigger for Gmail payment checking
 * Runs every 15 minutes to check for new payment notifications
 */
function createBlawbyPaymentTrigger() {
  logStart('createBlawbyPaymentTrigger');
  
  try {
    // Delete any existing payment checking triggers
    deleteTriggersByFunction('checkForBlawbyPayments');
    
    // Create new trigger to run every 15 minutes
    ScriptApp.newTrigger('checkForBlawbyPayments')
      .timeBased()
      .everyMinutes(15)
      .create();
      
    log('⏱️ Gmail payment checking trigger created (every 15 minutes)');
  } catch (error) {
    logError('createBlawbyPaymentTrigger', error);
    throw error;
  }
  
  logEnd('createBlawbyPaymentTrigger');
}

/**
 * Manual trigger for testing Gmail payment detection
 */
function manualCheckGmailPayments() {
  checkForBlawbyPayments();
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
    .addItem('Check Gmail for Payments', 'manualCheckGmailPayments')
    .addItem('Test Process Existing Emails', 'testProcessExistingBlawbyEmails')
    .addItem('Test Gmail Search', 'testGmailSearch')
    .addItem('Test Gmail Integration', 'testGmailIntegration')
    .addItem('Debug Blawby Emails', 'debugBlawbyEmailSearch')
    .addItem('Check Gmail Authorization', 'checkGmailAuthorization')
    .addItem('Force Reauthorization', 'forceReauthorization')
    .addSeparator()
    .addItem('Send Test Email', 'sendTestEmail')
    .addItem('Fix Firm Email', 'fixFirmEmailField')
    .addItem('Setup System', 'setupSystem')
    .addItem('Enable Gmail Trigger', 'createBlawbyPaymentTrigger')
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
      `• Low balance warnings for sample clients\n` +
      `• Daily balance digest\n` +
      `• Service resumed notifications\n\n` +
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
      `• Low balance warnings for sample clients\n` +
      `• Daily digest emails\n` +
      `• Service resumed notifications\n` +
      `• Test mode email redirection\n` +
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
    createBlawbyPaymentTrigger();
    
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
      '✅ Gmail payment checking trigger has been created (every 15 minutes)\n' +
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
 * Test function to see what emails are found in Gmail
 * This helps debug the Gmail integration
 */
function testGmailSearch() {
  logStart('testGmailSearch');
  
  try {
    // Test different queries to see what's available
    const queries = [
      'from:notifications@blawby.com subject:"Payment of" is:unread newer_than:1d',
      'from:notifications@blawby.com is:unread newer_than:7d',
      'subject:"Payment" is:unread newer_than:7d',
      'from:paulchrisluke@gmail.com is:unread newer_than:7d',
      'is:unread newer_than:7d'
    ];
    
    for (const query of queries) {
      log(`🔍 Testing query: "${query}"`);
      const threads = GmailApp.search(query);
      log(`📧 Found ${threads.length} threads`);
      
      if (threads.length > 0) {
        for (let i = 0; i < Math.min(threads.length, 3); i++) {
          const message = threads[i].getMessages()[0];
          log(`   ${i + 1}. From: ${message.getFrom()} | Subject: ${message.getSubject()}`);
        }
      }
      log('---');
    }
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Gmail Search Test Complete',
      '✅ Gmail search test completed successfully!\n\n' +
      'Check the execution logs in the Apps Script editor to see what emails were found.\n\n' +
      'If no payment emails were found, we may need to adjust the search queries.',
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    logError('testGmailSearch', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Gmail Authorization Error',
      '❌ Gmail API access is not authorized.\n\n' +
      'Please run "Check Gmail Authorization" from the Blawby menu first.\n\n' +
      'Error: ' + error.message,
      ui.ButtonSet.OK
    );
  }
  
  logEnd('testGmailSearch');
}

/**
 * Check and request Gmail API authorization
 * This function ensures the script has permission to access Gmail
 */
function checkGmailAuthorization() {
  logStart('checkGmailAuthorization');
  
  try {
    // Try to access Gmail to trigger authorization
    const threads = GmailApp.search('is:unread newer_than:1d', 0, 1);
    log(`✅ Gmail API access confirmed - found ${threads.length} recent unread threads`);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Gmail Authorization Success',
      '✅ Gmail API access is working correctly!\n\n' +
      'You can now use the Gmail payment integration features:\n' +
      '• "Check Gmail for Payments"\n' +
      '• "Test Gmail Search"\n' +
      '• "Enable Gmail Trigger"',
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    logError('checkGmailAuthorization', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Gmail Authorization Required',
      '❌ Gmail API access is not authorized.\n\n' +
      'To fix this:\n\n' +
      '1. Go to the Apps Script editor\n' +
      '2. Click "Run" on any function\n' +
      '3. When prompted, click "Review Permissions"\n' +
      '4. Grant access to Gmail\n' +
      '5. Run this function again\n\n' +
      'Error: ' + error.message,
      ui.ButtonSet.OK
    );
  }
  
  logEnd('checkGmailAuthorization');
}

/**
 * Simple test function to check Gmail integration
 * This helps debug what emails are available
 */
function testGmailIntegration() {
  logStart('testGmailIntegration');
  
  try {
    log('🔍 Testing Gmail integration...');
    
    // Test basic Gmail access
    const basicQuery = 'is:unread newer_than:7d';
    const basicThreads = GmailApp.search(basicQuery);
    log(`📧 Basic Gmail access: Found ${basicThreads.length} unread threads in last 7 days`);
    
    // Test for Blawby payment emails
    const blawbyQuery = 'from:notifications@blawby.com subject:"Payment of" is:unread newer_than:7d';
    const blawbyThreads = GmailApp.search(blawbyQuery);
    log(`📧 Blawby payment emails: Found ${blawbyThreads.length} payment notifications`);
    
    // Test for any payment-related emails
    const paymentQuery = 'subject:"Payment" is:unread newer_than:7d';
    const paymentThreads = GmailApp.search(paymentQuery);
    log(`📧 Any payment emails: Found ${paymentThreads.length} payment-related emails`);
    
    // Show sample emails if found
    if (basicThreads.length > 0) {
      log('📋 Sample emails found:');
      for (let i = 0; i < Math.min(basicThreads.length, 3); i++) {
        const message = basicThreads[i].getMessages()[0];
        log(`   ${i + 1}. From: ${message.getFrom()} | Subject: ${message.getSubject()}`);
      }
    }
    
    // Test specific to your email
    const yourEmailQuery = `from:paulchrisluke@gmail.com is:unread newer_than:7d`;
    const yourEmailThreads = GmailApp.search(yourEmailQuery);
    log(`📧 Your email threads: Found ${yourEmailThreads.length} unread threads from your email`);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Gmail Integration Test Complete',
      `✅ Gmail integration test completed!\n\n` +
      `📧 Results:\n` +
      `• Total unread emails (7 days): ${basicThreads.length}\n` +
      `• Blawby payment emails: ${blawbyThreads.length}\n` +
      `• Any payment emails: ${paymentThreads.length}\n` +
      `• Your email threads: ${yourEmailThreads.length}\n\n` +
      `Check the execution logs for detailed information about found emails.\n\n` +
      `💡 If no Blawby payment emails are found, you may need to:\n` +
      `1. Send a test payment through Blawby\n` +
      `2. Check if payment emails come from a different address\n` +
      `3. Adjust the search query in the code`,
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    logError('testGmailIntegration', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Gmail Test Failed',
      `❌ Gmail integration test failed:\n\n${error.message}\n\n` +
      `This might indicate an authorization issue. Try running "Check Gmail Authorization" first.`,
      ui.ButtonSet.OK
    );
  }
  
  logEnd('testGmailIntegration');
}

/**
 * Force reauthorization of the script with all required scopes
 * This function will trigger a new authorization prompt
 */
function forceReauthorization() {
  logStart('forceReauthorization');
  
  try {
    // Test each service to trigger authorization
    log('🔐 Testing spreadsheet access...');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    log(`✅ Spreadsheet access: ${ss.getName()}`);
    
    log('📧 Testing Gmail access...');
    const threads = GmailApp.search('is:unread newer_than:1d', 0, 1);
    log(`✅ Gmail access: Found ${threads.length} recent unread threads`);
    
    log('📧 Testing email sending...');
    const testEmail = getFirmEmail();
    MailApp.sendEmail({
      to: testEmail,
      subject: '[TEST] Authorization Test',
      body: 'This is a test email to verify all permissions are working correctly.'
    });
    log(`✅ Email sending: Test email sent to ${testEmail}`);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Authorization Test Complete',
      '✅ All permissions are working correctly!\n\n' +
      '📧 Gmail API access confirmed\n' +
      '📧 Email sending confirmed\n' +
      '📊 Spreadsheet access confirmed\n\n' +
      'You can now use all Gmail integration features.',
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    logError('forceReauthorization', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Authorization Required',
      '❌ Some permissions are missing.\n\n' +
      'To fix this:\n\n' +
      '1. Go to the Apps Script editor\n' +
      '2. Click "Run" on this function\n' +
      '3. When prompted, click "Review Permissions"\n' +
      '4. Grant ALL requested permissions\n' +
      '5. Run this function again\n\n' +
      'Error: ' + error.message,
      ui.ButtonSet.OK
    );
  }
  
  logEnd('forceReauthorization');
}

/**
 * Detailed debugging function to understand Blawby email search issues
 * This will help us figure out why Blawby payment emails aren't being found
 */
function debugBlawbyEmailSearch() {
  logStart('debugBlawbyEmailSearch');
  
  try {
    log('🔍 Starting detailed Blawby email search debugging...');
    
    // Test 1: Search for any emails from Blawby domain
    const blawbyDomainQuery = 'from:*@blawby.com newer_than:30d';
    const blawbyDomainThreads = GmailApp.search(blawbyDomainQuery);
    log(`📧 Emails from any @blawby.com address (30 days): ${blawbyDomainThreads.length}`);
    
    if (blawbyDomainThreads.length > 0) {
      log('📋 Found emails from Blawby domain:');
      for (let i = 0; i < Math.min(blawbyDomainThreads.length, 5); i++) {
        const message = blawbyDomainThreads[i].getMessages()[0];
        log(`   ${i + 1}. From: ${message.getFrom()} | Subject: ${message.getSubject()} | Date: ${message.getDate()}`);
      }
    }
    
    // Test 2: Search for specific Blawby email addresses
    const specificEmails = [
      'notifications@blawby.com',
      'noreply@blawby.com',
      'support@blawby.com',
      'admin@blawby.com',
      'payments@blawby.com'
    ];
    
    for (const email of specificEmails) {
      const query = `from:${email} newer_than:30d`;
      const threads = GmailApp.search(query);
      log(`📧 Emails from ${email}: ${threads.length}`);
      
      if (threads.length > 0) {
        for (let i = 0; i < Math.min(threads.length, 3); i++) {
          const message = threads[i].getMessages()[0];
          log(`   ${i + 1}. Subject: ${message.getSubject()} | Date: ${message.getDate()}`);
        }
      }
    }
    
    // Test 3: Search for payment-related subjects from any sender
    const paymentSubjects = [
      'subject:"Payment of"',
      'subject:"Payment received"',
      'subject:"Payment confirmation"',
      'subject:"Payment"',
      'subject:"Blawby"'
    ];
    
    for (const subject of paymentSubjects) {
      const query = `${subject} newer_than:30d`;
      const threads = GmailApp.search(query);
      log(`📧 Emails with ${subject}: ${threads.length}`);
      
      if (threads.length > 0) {
        for (let i = 0; i < Math.min(threads.length, 2); i++) {
          const message = threads[i].getMessages()[0];
          log(`   ${i + 1}. From: ${message.getFrom()} | Subject: ${message.getSubject()}`);
        }
      }
    }
    
    // Test 4: Search for any emails containing "blawby" in the body or subject
    const blawbyContentQuery = 'blawby newer_than:30d';
    const blawbyContentThreads = GmailApp.search(blawbyContentQuery);
    log(`📧 Emails containing "blawby": ${blawbyContentThreads.length}`);
    
    if (blawbyContentThreads.length > 0) {
      log('📋 Found emails containing "blawby":');
      for (let i = 0; i < Math.min(blawbyContentThreads.length, 5); i++) {
        const message = blawbyContentThreads[i].getMessages()[0];
        log(`   ${i + 1}. From: ${message.getFrom()} | Subject: ${message.getSubject()}`);
      }
    }
    
    // Test 5: Check if emails are marked as read/unread
    const unreadBlawbyQuery = 'from:*@blawby.com is:unread newer_than:30d';
    const unreadBlawbyThreads = GmailApp.search(unreadBlawbyQuery);
    log(`📧 Unread emails from Blawby: ${unreadBlawbyThreads.length}`);
    
    const readBlawbyQuery = 'from:*@blawby.com is:read newer_than:30d';
    const readBlawbyThreads = GmailApp.search(readBlawbyQuery);
    log(`📧 Read emails from Blawby: ${readBlawbyThreads.length}`);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Blawby Email Debug Complete',
      `✅ Detailed Blawby email search completed!\n\n` +
      `📧 Results:\n` +
      `• Any @blawby.com emails: ${blawbyDomainThreads.length}\n` +
      `• Emails containing "blawby": ${blawbyContentThreads.length}\n` +
      `• Unread Blawby emails: ${unreadBlawbyThreads.length}\n` +
      `• Read Blawby emails: ${readBlawbyThreads.length}\n\n` +
      `Check the execution logs for detailed breakdown of found emails.\n\n` +
      `💡 If Blawby emails are found but not payment emails, we may need to:\n` +
      `1. Adjust the search query\n` +
      `2. Check the actual email format\n` +
      `3. Update the parsing logic`,
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    logError('debugBlawbyEmailSearch', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Debug Failed',
      `❌ Blawby email debug failed:\n\n${error.message}`,
      ui.ButtonSet.OK
    );
  }
  
  logEnd('debugBlawbyEmailSearch');
}

/**
 * Manual test function to process existing Blawby payment emails
 * This helps test the parsing and processing logic
 */
function testProcessExistingBlawbyEmails() {
  logStart('testProcessExistingBlawbyEmails');
  
  try {
    const paymentsSheet = getSheet(SHEET_NAMES.PAYMENTS);
    let processedCount = 0;
    let newPayments = 0;
    
    // Search for existing Blawby payment emails (read or unread)
    const query = 'from:notifications@blawby.com subject:"Payment of" newer_than:30d';
    const threads = GmailApp.search(query);
    
    log(`📧 Found ${threads.length} existing Blawby payment emails`);
    
    for (const thread of threads) {
      const message = thread.getMessages()[0];
      const subject = message.getSubject();
      const paymentId = extractPaymentIdFromSubject(subject);
      
      log(`📧 Testing email: "${subject}"`);
      
      // Check if this payment already exists
      if (paymentExists(paymentsSheet, paymentId)) {
        log(`🔄 Payment ${paymentId} already exists, skipping`);
        processedCount++;
        continue;
      }
      
      const htmlBody = message.getBody();
      const parsed = parseBlawbyPaymentEmail(htmlBody);
      
      if (parsed && parsed.paymentId) {
        log(`✅ Successfully parsed payment: $${parsed.amount} from ${parsed.clientEmail} (ID: ${parsed.paymentId})`);
        
        // Ask user if they want to add this payment
        const ui = SpreadsheetApp.getUi();
        const response = ui.alert(
          'Add Payment to Sheet?',
          `Found payment: $${parsed.amount} from ${parsed.clientEmail}\n\n` +
          `Subject: ${subject}\n` +
          `Payment ID: ${parsed.paymentId}\n\n` +
          `Add this payment to the Payments sheet?`,
          ui.ButtonSet.YES_NO
        );
        
        if (response === ui.Button.YES) {
          // Add payment to sheet
          paymentsSheet.appendRow([
            new Date(),                    // Date
            parsed.clientEmail || '',     // Client Email
            parsed.amount || 0,           // Amount
            parsed.method || 'card',      // Payment Method
            parsed.paymentId              // Payment ID
          ]);
          
          log(`💵 Added payment: ${parsed.paymentId} - $${parsed.amount} from ${parsed.clientEmail}`);
          newPayments++;
        } else {
          log(`⏭️ User chose not to add payment ${parsed.paymentId}`);
        }
      } else {
        log(`⚠️ Could not parse payment from email: "${subject}"`);
      }
      
      processedCount++;
    }
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Test Complete',
      `✅ Processed ${processedCount} Blawby payment emails\n\n` +
      `📊 Results:\n` +
      `• Total emails found: ${threads.length}\n` +
      `• Already in sheet: ${processedCount - newPayments}\n` +
      `• New payments added: ${newPayments}\n\n` +
      `Check the execution logs for detailed parsing information.`,
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    logError('testProcessExistingBlawbyEmails', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Test Failed',
      `❌ Test failed: ${error.message}`,
      ui.ButtonSet.OK
    );
  }
  
  logEnd('testProcessExistingBlawbyEmails');
}

/**
 * Extract payment ID from email subject for quick checking
 * @param {string} subject - Email subject line
 * @return {string} - Extracted payment ID or null
 */
function extractPaymentIdFromSubject(subject) {
  // Look for payment ID in subject (if it's included)
  const idMatch = subject.match(/ID[:\s]*([a-zA-Z0-9_-]+)/i);
  return idMatch ? idMatch[1] : null;
}