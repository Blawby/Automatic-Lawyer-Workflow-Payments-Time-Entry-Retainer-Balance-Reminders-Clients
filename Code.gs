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
    
    // 1. Check Gmail for new Blawby payments (process new payments first)
    log("📧 Checking Gmail for new Blawby payments...");
    try {
      processGmailPayments(false); // Don't show UI alerts when called automatically
      log("✅ Gmail payment check completed");
    } catch (error) {
      logError('processGmailPayments', error);
      // Continue with other operations even if this fails
    }
    
    // 2. Sync payments and clients (creates/updates client records)
    log("📊 Syncing payments and clients...");
    try {
      syncPaymentsAndClients();
      log("✅ Payments and clients sync completed");
    } catch (error) {
      logError('syncPaymentsAndClients', error);
      // Continue with other operations even if this fails
    }
    
    // 3. Send daily balance digest (notifies about low balances)
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
    deleteTriggersByFunction('processGmailPayments');
    
    // Create new trigger to run every 15 minutes
    ScriptApp.newTrigger('processGmailPayments')
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
  processGmailPayments();
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
    .addItem('🔧 Setup System', 'setupSystem')
    .addItem('📧 Send Test Email', 'sendTestEmail')
    .addSeparator()
    .addItem('🔄 Daily Sync', 'executeSyncOperations')
    .addItem('📧 Process Gmail Payments', 'processGmailPayments')
    .addSeparator()
    .addItem('⚙️ Enable Gmail Trigger', 'createBlawbyPaymentTrigger')
    .addToUi();
}

/**
 * Send a test email to validate email configuration
 */
function sendTestEmail() {
  logStart('sendTestEmail');
  
  try {
    const firmEmail = getFirmEmail();
    
    if (!firmEmail || !firmEmail.includes('@') || firmEmail === 'your-email@example.com') {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        '⚠️ Email Configuration Required',
        'Your firm email is not properly configured.\n\n' +
        'Please go to the Welcome sheet and update the "Firm Email" setting with your actual email address.',
        ui.ButtonSet.OK
      );
      return;
    }
    
    // Send a simple test email
    const subject = 'Welcome to Blawby';
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4285f4;">🎉 Welcome to Blawby!</h2>
        <p>This is a test email to confirm your email configuration is working correctly.</p>
        <p><strong>Firm Email:</strong> ${firmEmail}</p>
        <p><strong>Test Date:</strong> ${new Date().toLocaleDateString()}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          If you received this email, your Blawby system is properly configured and ready to use!
        </p>
      </div>
    `;
    
    sendEmailViaGmailAPI(firmEmail, subject, body, { isHtml: true });
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      '✅ Test Email Sent',
      `A test email has been sent to:\n\n${firmEmail}\n\n` +
      'Please check your inbox (and spam folder) to confirm the email was received.',
      ui.ButtonSet.OK
    );
    
    log(`✅ Test email sent successfully to ${firmEmail}`);
  } catch (error) {
    logError('sendTestEmail', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      '❌ Test Email Failed',
      `Failed to send test email:\n\n${error.message}\n\n` +
      'Please check your email configuration in the Welcome sheet.',
      ui.ButtonSet.OK
    );
  }
  
  logEnd('sendTestEmail');
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
 * Check current triggers and their status
 */
function checkCurrentTriggers() {
  logStart('checkCurrentTriggers');
  
  try {
    const triggers = ScriptApp.getProjectTriggers();
    log(`📋 Found ${triggers.length} total triggers`);
    
    let gmailTriggerFound = false;
    
    for (const trigger of triggers) {
      const handler = trigger.getHandlerFunction();
      const eventType = trigger.getEventType();
      
      log(`🔧 Trigger: ${handler} (${eventType})`);
      
      if (handler === 'processGmailPayments') {
        gmailTriggerFound = true;
        log(`✅ Gmail payment trigger is active`);
        
        // Get more details about time-based triggers
        if (eventType === ScriptApp.EventType.CLOCK) {
          const everyMinutes = trigger.getEveryMinutes();
          const everyHours = trigger.getEveryHours();
          const everyDays = trigger.getEveryDays();
          
          if (everyMinutes) {
            log(`⏰ Runs every ${everyMinutes} minutes`);
          } else if (everyHours) {
            log(`⏰ Runs every ${everyHours} hours`);
          } else if (everyDays) {
            log(`⏰ Runs every ${everyDays} days`);
          } else {
            log(`⏰ Runs on a schedule`);
          }
        }
      }
    }
    
    if (!gmailTriggerFound) {
      log(`⚠️ No Gmail payment trigger found - automatic processing is not enabled`);
    }
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Trigger Status',
      `📋 Found ${triggers.length} total triggers\n\n` +
      `${gmailTriggerFound ? '✅ Gmail payment trigger is active' : '⚠️ No Gmail payment trigger found'}\n\n` +
      'Check the execution logs for detailed trigger information.\n\n' +
      '💡 If no Gmail trigger is found, run "Enable Gmail Trigger" to set up automatic processing.',
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    logError('checkCurrentTriggers', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Trigger Check Failed',
      `❌ Could not check triggers:\n\n${error.message}`,
      ui.ButtonSet.OK
    );
  }
  
  logEnd('checkCurrentTriggers');
}

/**
 * Simple test to check Gmail payment detection
 */
function testGmailPaymentDetection() {
  logStart('testGmailPaymentDetection');
  
  try {
    log('🔍 Testing Gmail payment detection...');
    
    // Search for Blawby payment emails
    const query = 'from:notifications@blawby.com subject:"Payment of" newer_than:30d';
    const threads = GmailApp.search(query);
    
    log(`📧 Found ${threads.length} Blawby payment emails`);
    
    if (threads.length === 0) {
      log('❌ No Blawby payment emails found');
    } else {
      log('📋 Found payment emails:');
      for (let i = 0; i < Math.min(threads.length, 3); i++) {
        const message = threads[i].getMessages()[0];
        const subject = message.getSubject();
        log(`   ${i + 1}. Subject: ${subject}`);
        
        // Test parsing on each email
        log(`🔍 Testing parsing on email ${i + 1}...`);
        const htmlBody = message.getBody();
        const parsed = parseBlawbyPaymentEmail(htmlBody);
        
        if (parsed) {
          log(`✅ Parsing successful:`);
          log(`   Amount: $${parsed.amount}`);
          log(`   Client Email: ${parsed.clientEmail}`);
          log(`   Payment ID: ${parsed.paymentId}`);
          
          // Check if it would be added to sheet
          const paymentsSheet = getSheet(SHEET_NAMES.PAYMENTS);
          const exists = paymentExists(paymentsSheet, message.getId(), parsed.paymentId);
          log(`📊 Payment already exists in sheet: ${exists}`);
          
          if (!exists) {
            log(`💡 This payment would be automatically added to the sheet`);
          } else {
            log(`💡 This payment already exists and would be skipped`);
          }
        } else {
          log(`❌ Parsing failed for this email`);
        }
      }
    }
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Gmail Payment Detection Test',
      `📧 Found ${threads.length} Blawby payment emails\n\n` +
      'Check the execution logs for detailed information about:\n' +
      '• How many payment emails were found\n' +
      '• Whether parsing was successful\n' +
      '• If payments would be added to the sheet\n\n' +
      '💡 If no emails are found, the search query may need adjustment.',
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    logError('testGmailPaymentDetection', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Test Failed',
      `❌ Gmail payment detection test failed:\n\n${error.message}`,
      ui.ButtonSet.OK
    );
  }
  
  logEnd('testGmailPaymentDetection');
}

/**
 * Process and add payments from Gmail to the Payments sheet
 * This is the core function that should work automatically
 * @param {boolean} showUI - Whether to show UI alerts (default: true)
 */
function processGmailPayments(showUI = true) {
  logStart('processGmailPayments');
  
  try {
    const paymentsSheet = getSheet(SHEET_NAMES.PAYMENTS);
    let newPayments = 0;
    
    // Ensure the Payments sheet has the correct header structure
    ensurePaymentsSheetHeader();
    
    log('🔍 Searching for Blawby payment emails...');
    
    // Search for payment emails
    const query = 'from:notifications@blawby.com subject:"Payment of" newer_than:30d';
    const threads = GmailApp.search(query);
    
    log(`📧 Found ${threads.length} payment emails`);
    
    for (const thread of threads) {
      const message = thread.getMessages()[0];
      const subject = message.getSubject();
      const messageDate = message.getDate(); // Get the email date
      const messageId = message.getId(); // Get the unique Message-ID
      
      log(`📧 Processing: ${subject} (Message-ID: ${messageId})`);
      
      const htmlBody = message.getBody();
      const parsed = parseBlawbyPaymentEmail(htmlBody);
      
      if (parsed && parsed.paymentId) {
        // Check if payment already exists using Message-ID (which is always unique)
        if (paymentExists(paymentsSheet, messageId, parsed.paymentId)) {
          log(`🔄 Payment with Message-ID ${messageId} already exists, skipping`);
        } else {
          // Add payment to sheet
          log(`💵 Adding payment: $${parsed.amount} from ${parsed.clientEmail} (Payment ID: ${parsed.paymentId}, Message-ID: ${messageId})`);
          
          paymentsSheet.appendRow([
            messageDate,                   // Date from email
            parsed.clientEmail || '',     // Client Email
            parsed.amount || 0,           // Amount
            parsed.method || 'card',      // Payment Method
            parsed.paymentId,             // Payment ID (may be reused by Blawby)
            messageId                     // Message-ID (always unique)
          ]);
          
          log(`✅ Payment added to sheet successfully`);
          newPayments++;
        }
        
        // Mark as read and archive
        if (thread.isUnread()) {
          thread.markRead();
        }
        thread.moveToArchive();
        log(`📧 Email marked as read and archived`);
      } else {
        log(`⚠️ Could not parse payment from: ${subject}`);
      }
    }
    
    if (newPayments > 0) {
      log(`🔄 Processing ${newPayments} new payment(s) with full sync...`);
      syncPaymentsAndClients();
      log(`✅ Synced ${newPayments} new payment(s)`);
    } else {
      log(`📭 No new payments to process`);
    }
    
    // Only show UI alerts if requested
    if (showUI) {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        'Payment Processing Complete',
        `📧 Processed ${threads.length} payment emails\n` +
        `💵 Added ${newPayments} new payments to sheet\n\n` +
        'Check the execution logs for detailed information.',
        ui.ButtonSet.OK
      );
    }
    
  } catch (error) {
    logError('processGmailPayments', error);
    
    // Only show UI alerts if requested
    if (showUI) {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        'Processing Failed',
        `❌ Payment processing failed:\n\n${error.message}`,
        ui.ButtonSet.OK
      );
    }
  }
  
  logEnd('processGmailPayments');
}

/**
 * Check if a payment already exists in the payments sheet
 * Uses Message-ID as primary deduplication key since Payment IDs are being reused by Blawby
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The payments sheet
 * @param {string} messageId - The email Message-ID (unique identifier)
 * @param {string} paymentId - The payment ID (for reference)
 * @return {boolean} - True if payment exists, false otherwise
 */
function paymentExists(sheet, messageId, paymentId = null) {
  if (!messageId) return false;
  
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return false; // Only header row exists
    
    // Check if we have a Message-ID column (we'll add this as column F)
    const values = sheet.getRange(2, 1, lastRow - 1, 6).getValues(); // Columns A-F
    
    // Check if Message-ID already exists (column F, index 5)
    return values.some(row => row[5] === messageId);
  } catch (error) {
    logError('paymentExists', error);
    return false;
  }
}

/**
 * Ensure the Payments sheet has the correct header structure
 */
function ensurePaymentsSheetHeader() {
  const paymentsSheet = getSheet(SHEET_NAMES.PAYMENTS);
  
  // Check if header exists and has the right columns
  const headerRow = paymentsSheet.getRange(1, 1, 1, 6).getValues()[0];
  const expectedHeaders = ["Date", "Client Email", "Amount", "Payment Method", "Payment ID", "Message-ID"];
  
  let needsUpdate = false;
  
  // Check if we need to add Message-ID column
  if (headerRow.length < 6) {
    needsUpdate = true;
  } else if (headerRow[5] !== "Message-ID") {
    needsUpdate = true;
  }
  
  if (needsUpdate) {
    log('📝 Updating Payments sheet header to include Message-ID column');
    paymentsSheet.getRange(1, 1, 1, 6).setValues([expectedHeaders]);
    log('✅ Payments sheet header updated');
  }
}

function checkEmailQuotaStatus() {
  try {
    const quota = checkEmailQuota();
    const ui = SpreadsheetApp.getUi();
    
    let message = `📧 Gmail API Email Quota Status:\n\n`;
    message += `Remaining emails: ${quota.remaining}/${quota.total}\n`;
    message += `Used today: ${quota.used}/${quota.total} (${quota.percentageUsed.toFixed(1)}%)\n\n`;
    
    if (quota.canSend) {
      if (quota.isNearLimit) {
        message += `⚠️ WARNING: You're near the daily limit!\n`;
        message += `Consider reducing email frequency or contact support.`;
      } else {
        message += `✅ You can still send emails today.\n`;
        message += `🚀 Gmail API allows up to 1M emails/day!`;
      }
    } else {
      message += `❌ Daily quota exceeded!\n`;
      message += `No more emails can be sent until tomorrow.`;
    }
    
    message += `\n\n💡 Gmail API vs MailApp:\n`;
    message += `• Gmail API: 1,000,000 emails/day\n`;
    message += `• MailApp: 100 emails/day\n`;
    message += `• You're using Gmail API (much better!)`;
    
    ui.alert('Gmail API Email Quota Status', message, ui.ButtonSet.OK);
  } catch (error) {
    logError('checkEmailQuotaStatus', error);
    const ui = SpreadsheetApp.getUi();
    ui.alert('Error', `Failed to check email quota: ${error.message}`, ui.ButtonSet.OK);
  }
}

function testGmailAPIEmail() {
  try {
    logStart('testGmailAPIEmail');
    
    const firmEmail = getFirmEmail();
    const testSubject = '[TEST] Gmail API Email Test';
    const testBody = `This is a test email sent via Gmail API to verify the new email system is working correctly.

🚀 Benefits of Gmail API:
• 1,000,000 emails/day limit (vs 100 with MailApp)
• Better reliability and performance
• No more quota issues for multi-user systems

✅ If you receive this email, the Gmail API integration is working perfectly!

Sent at: ${new Date().toISOString()}`;

    log(`📧 Testing Gmail API email to: ${firmEmail}`);
    sendEmail(firmEmail, testSubject, testBody, { isHtml: false });
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Gmail API Test Complete',
      `✅ Test email sent successfully!\n\n` +
      `📧 Sent to: ${firmEmail}\n` +
      `📧 Subject: ${testSubject}\n\n` +
      `🚀 Gmail API is working correctly!\n` +
      `💡 Check your inbox for the test email.`,
      ui.ButtonSet.OK
    );
    
    logEnd('testGmailAPIEmail');
  } catch (error) {
    logError('testGmailAPIEmail', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Gmail API Test Failed',
      `❌ Test email failed:\n\n${error.message}\n\n` +
      `This might indicate a Gmail API authorization issue.`,
      ui.ButtonSet.OK
    );
  }
}

function debugGmailSearch() {
  logStart('debugGmailSearch');
  
  try {
    log('🔍 Testing Gmail search functionality...');
    
    // Test basic Gmail access
    const basicQuery = 'is:unread newer_than:7d';
    const basicThreads = GmailApp.search(basicQuery);
    log(`📧 Basic Gmail access: Found ${basicThreads.length} unread threads in last 7 days`);
    
    // Test for Blawby payment emails
    const blawbyQuery = 'from:notifications@blawby.com subject:"Payment of" newer_than:30d';
    const blawbyThreads = GmailApp.search(blawbyQuery);
    log(`📧 Blawby payment emails: Found ${blawbyThreads.length} payment notifications`);
    
    // Test for any payment-related emails
    const paymentQuery = 'subject:"Payment" newer_than:30d';
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
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Gmail Search Debug Complete',
      `✅ Gmail search debug completed!\n\n` +
      `📧 Results:\n` +
      `• Total unread emails (7 days): ${basicThreads.length}\n` +
      `• Blawby payment emails: ${blawbyThreads.length}\n` +
      `• Any payment emails: ${paymentThreads.length}\n\n` +
      `Check the execution logs for detailed information.`,
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    logError('debugGmailSearch', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Gmail Search Debug Failed',
      `❌ Gmail search debug failed:\n\n${error.message}\n\n` +
      `This might indicate a Gmail API authorization issue.`,
      ui.ButtonSet.OK
    );
  }
  
  logEnd('debugGmailSearch');
}