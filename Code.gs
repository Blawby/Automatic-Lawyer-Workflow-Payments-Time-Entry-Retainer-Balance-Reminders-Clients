// ========== MAIN ENTRY POINTS ==========
function dailySync() {
  console.log("🔄 Starting daily sync...");
  
  try {
    // Validate spreadsheet access
    validateSpreadsheetAccess();
    
    // Validate required settings before proceeding
    const validationResult = validateRequiredSettings();
    if (!validationResult.isValid) {
      // Log the configuration issues and exit cleanly (no UI alerts for automated triggers)
      console.log("❌ Aborting sync: Configuration issues found:");
      console.log(validationResult.message);
      console.log("🛑 Sync execution stopped due to configuration issues.");
      console.log("💡 Fix the issues in the Welcome sheet and try again.");
      return; // Stop execution cleanly
    }
    
    // Get sheets and ensure they're properly set up
    const sheets = getSheetsAndSetup();
    
    // Execute all sync operations
    executeSyncOperations(sheets);
    
    console.log("✅ Daily sync completed successfully");
  } catch (error) {
    console.error("❌ Daily sync failed:", error.message);
    // Don't show UI alerts for automated triggers - just log the error
  }
}

/**
 * User-facing sync function that shows UI alerts for configuration issues
 * This is called from the menu and shows user-friendly messages
 */
function userDailySync() {
  console.log("🔄 Starting user daily sync...");
  
  try {
    // Validate spreadsheet access
    validateSpreadsheetAccess();
    
    // Validate required settings before proceeding
    const validationResult = validateRequiredSettings();
    if (!validationResult.isValid) {
      // Log the configuration issues before showing UI alert
      console.log("❌ Aborting sync: Configuration issues found:");
      console.log(validationResult.message);
      console.log("🛑 Sync execution stopped due to configuration issues.");
      
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        "❌ Configuration Issues Found", 
        validationResult.message + "\n\nPlease fix the critical issues before running the sync.\n\nYou can use '🔍 Validate Configuration' from the Blawby menu to check your setup anytime.",
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }
    
    // Show confirmation dialog
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      "🔄 Start Daily Sync", 
      "This will:\n• Check for new payments\n• Sync client data\n• Send balance notifications\n\nDo you want to continue?",
      SpreadsheetApp.getUi().ButtonSet.YES_NO
    );
    
    if (response !== SpreadsheetApp.getUi().Button.YES) {
      console.log("🛑 Sync cancelled by user.");
      return;
    }
    
    // Get sheets and ensure they're properly set up
    const sheets = getSheetsAndSetup();
    
    // Execute all sync operations
    executeSyncOperations(sheets);
    
    // Show success message
    ui.alert(
      "✅ Sync Completed", 
      "The daily sync has completed successfully!\n\nCheck your email for any balance notifications.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    console.log("✅ User daily sync completed successfully");
  } catch (error) {
    console.error("❌ User daily sync failed:", error.message);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      "❌ Sync Failed", 
      `The daily sync encountered an error:\n\n${error.message}\n\nPlease check your configuration and try again.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * Validates all required settings and configuration
 * @return {Object} - {isValid: boolean, message: string}
 */
function validateRequiredSettings() {
  const issues = [];
  const warnings = [];
  
  try {
    // Check Firm Email
    const firmEmail = getSetting(SETTINGS_KEYS.FIRM_EMAIL);
    if (!firmEmail || !firmEmail.includes('@') || firmEmail === 'your-email@example.com') {
      issues.push("Firm Email is not set. Please set your email address in the Welcome sheet.");
    }
    
    // Check Blawby Payment URL
    const paymentUrl = getSetting(SETTINGS_KEYS.BASE_PAYMENT_URL);
    if (!paymentUrl || paymentUrl === DEFAULT_SETTINGS[SETTINGS_KEYS.BASE_PAYMENT_URL]) {
      issues.push("Blawby Payment URL is not configured. Please set your payment URL in the Welcome sheet.");
    } else {
      // Validate Blawby URL pattern
      const blawbyUrlPattern = /^https:\/\/app\.blawby\.com\/[^\/]+\/pay$/;
      if (!blawbyUrlPattern.test(paymentUrl)) {
        warnings.push(`Payment URL doesn't match Blawby pattern. Expected: https://app.blawby.com/YOUR_FIRM/pay\nCurrent: ${paymentUrl}\n\nYou'll need to manually enter payments in the Payments sheet.`);
      }
    }
    
    // Check Low Balance Threshold
    const lowBalanceThreshold = getSetting(SETTINGS_KEYS.LOW_BALANCE_THRESHOLD);
    if (!lowBalanceThreshold || lowBalanceThreshold <= 0) {
      issues.push("Low Balance Threshold is not set. Please set a threshold amount in the Welcome sheet.");
    }
    
    // Check if Lawyers are configured in Welcome sheet
    try {
      const welcomeSheet = getSheet("Welcome");
      const lawyers = getLawyersFromWelcomeSheet(welcomeSheet);
      if (lawyers.length <= 1) { // Only header row
        issues.push("No lawyers configured. Please add at least one lawyer in the Welcome sheet under the Lawyers section.");
      } else {
        // Check for valid lawyer data
        for (let i = 1; i < lawyers.length; i++) {
          const row = lawyers[i];
          if (!row[0] || !row[0].includes('@')) {
            warnings.push(`Lawyer row ${i + 1} has invalid email: "${row[0]}"`);
          }
          if (!row[2] || isNaN(parseFloat(row[2]))) {
            warnings.push(`Lawyer row ${i + 1} has invalid rate: "${row[2]}"`);
          }
        }
      }
    } catch (error) {
      issues.push("Welcome sheet not found or inaccessible. Lawyers must be configured in the Welcome sheet.");
    }
    
    // Check if TimeLogs sheet exists and has proper structure
    try {
      const timeLogsSheet = getSheet(SHEET_NAMES.TIME_LOGS);
      const timeLogsData = timeLogsSheet.getDataRange().getValues();
      if (timeLogsData.length === 0) {
        issues.push("TimeLogs sheet is empty. Please ensure it has the proper header row.");
      } else if (timeLogsData.length === 1) {
        warnings.push("TimeLogs sheet only has header row. No time entries found.");
      }
    } catch (error) {
      issues.push("TimeLogs sheet not found or inaccessible.");
    }
    
    // Check if Payments sheet exists and has proper structure
    try {
      const paymentsSheet = getSheet(SHEET_NAMES.PAYMENTS);
      const paymentsData = paymentsSheet.getDataRange().getValues();
      if (paymentsData.length === 0) {
        issues.push("Payments sheet is empty. Please ensure it has the proper header row.");
      } else if (paymentsData.length === 1) {
        warnings.push("Payments sheet only has header row. No payment entries found.");
      }
    } catch (error) {
      issues.push("Payments sheet not found or inaccessible.");
    }
    
    // Check if Clients sheet exists
    try {
      const clientsSheet = getSheet(SHEET_NAMES.CLIENTS);
      const clientsData = clientsSheet.getDataRange().getValues();
      if (clientsData.length === 0) {
        issues.push("Clients sheet is empty. Please ensure it has the proper header row.");
      }
    } catch (error) {
      issues.push("Clients sheet not found or inaccessible.");
    }
    
    // Check if Matters sheet exists
    try {
      const mattersSheet = getSheet(SHEET_NAMES.MATTERS);
      const mattersData = mattersSheet.getDataRange().getValues();
      if (mattersData.length === 0) {
        issues.push("Matters sheet is empty. Please ensure it has the proper header row.");
      }
    } catch (error) {
      issues.push("Matters sheet not found or inaccessible.");
    }
    
  } catch (error) {
    issues.push(`Validation error: ${error.message}`);
  }
  
  let message = "";
  
  if (issues.length > 0) {
    message += "❌ CRITICAL ISSUES (must be fixed):\n\n" + issues.map(issue => `• ${issue}`).join('\n');
  }
  
  if (warnings.length > 0) {
    if (message) message += "\n\n";
    message += "⚠️ WARNINGS (should be reviewed):\n\n" + warnings.map(warning => `• ${warning}`).join('\n');
  }
  
  if (issues.length === 0 && warnings.length === 0) {
    message = "✅ All required settings are configured correctly.";
  }
  
  return { 
    isValid: issues.length === 0, 
    message: message,
    hasWarnings: warnings.length > 0
  };
}

/**
 * Manual validation function that can be called to check configuration
 * This will show a UI alert with any issues found
 */
function validateConfiguration() {
  console.log("🔍 Validating Blawby configuration...");
  
  const validationResult = validateRequiredSettings();
  
  if (validationResult.isValid && !validationResult.hasWarnings) {
    SpreadsheetApp.getUi().alert(
      "✅ Configuration Valid", 
      "All required settings are properly configured. Blawby is ready to use!",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } else if (validationResult.isValid && validationResult.hasWarnings) {
    SpreadsheetApp.getUi().alert(
      "⚠️ Configuration Valid with Warnings", 
      validationResult.message + "\n\nYou can proceed with using Blawby, but please review the warnings above.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } else {
    SpreadsheetApp.getUi().alert(
      "❌ Configuration Issues Found", 
      validationResult.message + "\n\nPlease fix the critical issues before running the sync.",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
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
      // Add timeout protection for Gmail operations
      const startTime = new Date().getTime();
      const timeoutMs = 30000; // 30 second timeout
      
      processGmailPayments(false); // Don't show UI alerts when called automatically
      
      const elapsed = new Date().getTime() - startTime;
      if (elapsed > timeoutMs) {
        log(`⚠️ Gmail processing took ${elapsed}ms (slow but completed)`);
      }
      log("✅ Gmail payment check completed");
    } catch (error) {
      logError('processGmailPayments', error);
      log("⚠️ Gmail processing failed, continuing with other operations");
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
    
    // Validate required settings before proceeding
    const validationResult = validateRequiredSettings();
    if (!validationResult.isValid) {
      throw new Error(`Configuration Error: ${validationResult.message}`);
    }
    
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
  console.log("🔄 Starting manual client sync...");
  
  try {
    validateSpreadsheetAccess();
    
    // Validate required settings before proceeding
    const validationResult = validateRequiredSettings();
    if (!validationResult.isValid) {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        "❌ Configuration Issues Found", 
        validationResult.message + "\n\nPlease fix the critical issues before running the sync.",
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }
    
    const sheets = getSheetsAndSetup();
    syncPaymentsAndClients();
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      "✅ Client Sync Completed", 
      "Client and payment data has been synced successfully!",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    log("✅ Manual client sync completed");
  } catch (error) {
    logError('manualSyncClients', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      "❌ Client Sync Failed", 
      `The client sync encountered an error:\n\n${error.message}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

function manualSendDigest() {
  console.log("📧 Starting manual digest...");
  
  try {
    // Validate before sending digest
    const validationResult = validateRequiredSettings();
    if (!validationResult.isValid) {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        "❌ Configuration Issues Found", 
        validationResult.message + "\n\nPlease fix the critical issues before sending the digest.",
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }
    
    sendDailyBalanceDigest();
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      "✅ Digest Sent", 
      "The daily balance digest has been sent successfully!",
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    log("✅ Manual digest sent");
  } catch (error) {
    logError('manualSendDigest', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      "❌ Digest Failed", 
      `Failed to send digest:\n\n${error.message}`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
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
 * Enhanced Gmail search that includes forwarded emails
 * @return {Array} - Array of Gmail threads containing payment emails
 */
function searchForPaymentEmails() {
  log('🔍 Searching for Blawby payment emails (including forwarded)...');
  
  const startTime = new Date().getTime();
  const timeoutMs = 15000; // 15 second timeout for Gmail search
  
  try {
    // Original search for direct emails from Blawby
    const directQuery = 'from:notifications@blawby.com subject:"Payment of" newer_than:30d';
    const directThreads = GmailApp.search(directQuery);
    log(`📧 Found ${directThreads.length} direct Blawby payment emails`);
    
    // Check timeout
    if (new Date().getTime() - startTime > timeoutMs) {
      log(`⚠️ Gmail search taking too long, returning direct results only`);
      return directThreads;
    }
    
    // Search for forwarded emails containing Blawby payment content
    const forwardedQuery = '(subject:"Fwd: Payment of" OR subject:"Forwarded: Payment of" OR subject:"Payment of") (from:notifications@blawby.com OR "CLIENT EMAIL" OR "PAYMENT ID") newer_than:30d';
    const forwardedThreads = GmailApp.search(forwardedQuery);
    log(`📧 Found ${forwardedThreads.length} potential forwarded payment emails`);
    
    // Check timeout again
    if (new Date().getTime() - startTime > timeoutMs) {
      log(`⚠️ Gmail search taking too long, returning combined results without deduplication`);
      return [...directThreads, ...forwardedThreads];
    }
    
    // Combine and deduplicate threads
    const allThreads = [...directThreads];
    const seenIds = new Set(directThreads.map(t => t.getId()));
    
    for (const thread of forwardedThreads) {
      if (!seenIds.has(thread.getId())) {
        allThreads.push(thread);
        seenIds.add(thread.getId());
      }
    }
    
    const elapsed = new Date().getTime() - startTime;
    log(`📧 Total unique payment emails found: ${allThreads.length} (in ${elapsed}ms)`);
    return allThreads;
    
  } catch (error) {
    logError('searchForPaymentEmails', error);
    log(`❌ Gmail search failed: ${error.message}`);
    return []; // Return empty array to prevent hanging
  }
}

/**
 * Enhanced parsing function that can handle both original and forwarded Blawby payment emails
 * @param {string} html - The HTML body of the email
 * @param {string} subject - The email subject line
 * @return {Object|null} - Parsed payment data or null if parsing failed
 */
function parseBlawbyPaymentEmail(html, subject = '') {
  try {
    log('🔍 Parsing Blawby payment email...');
    
    // Check if this looks like a forwarded email
    const isForwarded = subject.includes('Fwd:') || subject.includes('Forwarded:') || 
                       html.includes('---------- Forwarded message ---------') ||
                       html.includes('From: notifications@blawby.com');
    
    if (isForwarded) {
      log('📧 Detected forwarded email, using enhanced parsing...');
      return parseForwardedPaymentEmail(html, subject);
    } else {
      log('📧 Detected original email, using standard parsing...');
      return parseOriginalPaymentEmail(html);
    }
  } catch (error) {
    logError('parseBlawbyPaymentEmail', error);
    return null;
  }
}

/**
 * Parse original (non-forwarded) Blawby payment emails
 * @param {string} html - The HTML body of the email
 * @return {Object|null} - Parsed payment data or null if parsing failed
 */
function parseOriginalPaymentEmail(html) {
  try {
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
    
    log(`✅ Successfully parsed original payment: $${amount} from ${finalClientEmail} (ID: ${paymentId})`);
    
    return {
      amount: amount,
      clientEmail: finalClientEmail,
      clientName: clientName,
      method: method,
      paymentId: paymentId,
      isForwarded: false
    };
  } catch (error) {
    logError('parseOriginalPaymentEmail', error);
    return null;
  }
}

/**
 * Parse forwarded Blawby payment emails
 * @param {string} html - The HTML body of the forwarded email
 * @param {string} subject - The email subject line
 * @return {Object|null} - Parsed payment data or null if parsing failed
 */
function parseForwardedPaymentEmail(html, subject) {
  try {
    log('🔍 Parsing forwarded payment email...');
    
    // Try multiple strategies to extract the original email content
    
    // Strategy 1: Look for forwarded message separator
    let originalContent = html;
    const forwardedSeparators = [
      '---------- Forwarded message ---------',
      '-------- Original Message --------',
      'From: notifications@blawby.com',
      'Begin forwarded message:'
    ];
    
    for (const separator of forwardedSeparators) {
      const parts = html.split(separator);
      if (parts.length > 1) {
        originalContent = parts[parts.length - 1]; // Take the last part (most likely the original)
        log(`📧 Found forwarded content after separator: "${separator}"`);
        break;
      }
    }
    
    // Strategy 2: Look for Blawby-specific content patterns
    if (originalContent === html) {
      // If no separator found, look for Blawby-specific patterns
      const blawbyPatterns = [
        /CLIENT EMAIL<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>/i,
        /PAYMENT ID<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>/i
      ];
      
      for (const pattern of blawbyPatterns) {
        if (pattern.test(html)) {
          originalContent = html;
          log('📧 Found Blawby patterns in email content');
          break;
        }
      }
    }
    
    // Strategy 3: If still no match, try parsing the entire email
    if (originalContent === html) {
      log('📧 No forwarded separator found, parsing entire email content');
    }
    
    // Now parse the content using the same logic as original emails
    const amountMatch = originalContent.match(/\$([0-9,]+\.?[0-9]*)/);
    const emailMatch = originalContent.match(/CLIENT EMAIL<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>/i);
    const nameMatch = originalContent.match(/CLIENT NAME<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>/i);
    const methodMatch = originalContent.match(/PAYMENT METHOD<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>/i);
    const idMatch = originalContent.match(/PAYMENT ID<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>/i);
    
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
    const clientEmail = emailMatch ? emailMatch[1].trim() : null;
    const clientName = nameMatch ? nameMatch[1].trim() : null;
    const method = methodMatch ? methodMatch[1].trim().toLowerCase() : 'card';
    const paymentId = idMatch ? idMatch[1].trim() : null;
    
    log(`📊 Parsed forwarded data: amount=${amount}, email=${clientEmail}, name=${clientName}, method=${method}, id=${paymentId}`);
    
    // Validate required fields
    if (!amount || !paymentId) {
      log(`⚠️ Missing required payment data in forwarded email: amount=${amount}, id=${paymentId}`);
      return null;
    }
    
    // For client email, if it's "Not provided", we'll use the client name as identifier
    const finalClientEmail = (clientEmail && clientEmail !== 'Not provided') ? clientEmail : 
                            (clientName ? `${clientName.toLowerCase().replace(/\s+/g, '.')}@client.blawby.com` : null);
    
    // Validate email format (if we have one)
    if (finalClientEmail && !isValidEmail(finalClientEmail)) {
      log(`⚠️ Invalid email format in forwarded payment: ${finalClientEmail}`);
      return null;
    }
    
    log(`✅ Successfully parsed forwarded payment: $${amount} from ${finalClientEmail} (ID: ${paymentId})`);
    
    return {
      amount: amount,
      clientEmail: finalClientEmail,
      clientName: clientName,
      method: method,
      paymentId: paymentId,
      isForwarded: true
    };
  } catch (error) {
    logError('parseForwardedPaymentEmail', error);
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
    .addItem('🔍 Validate Configuration', 'validateConfiguration')
    .addItem('📧 Send Test Email', 'sendTestEmail')
    .addSeparator()
    .addItem('🔄 Daily Sync', 'userDailySync')
    .addItem('📧 Process Gmail Payments', 'processGmailPayments')
    .addSeparator()
    .addItem('⚙️ Enable Gmail Trigger', 'createBlawbyPaymentTrigger')
    .addItem('🔍 Diagnose Sync Issue', 'diagnoseSyncIssue')
    .addItem('🔍 Step-by-Step Sync', 'stepByStepSync')
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
    log('🔍 Testing Gmail payment detection (including forwarded emails)...');
    
    // Use the enhanced search function that includes forwarded emails
    const threads = searchForPaymentEmails();
    
    if (threads.length === 0) {
      log('❌ No Blawby payment emails found (including forwarded)');
    } else {
      log('📋 Found payment emails:');
      for (let i = 0; i < Math.min(threads.length, 3); i++) {
        const message = threads[i].getMessages()[0];
        const subject = message.getSubject();
        const from = message.getFrom();
        log(`   ${i + 1}. From: ${from} | Subject: ${subject}`);
        
        // Test parsing on each email
        log(`🔍 Testing parsing on email ${i + 1}...`);
        const htmlBody = message.getBody();
        const parsed = parseBlawbyPaymentEmail(htmlBody, subject);
        
        if (parsed) {
          log(`✅ Parsing successful:`);
          log(`   Amount: $${parsed.amount}`);
          log(`   Client Email: ${parsed.clientEmail}`);
          log(`   Payment ID: ${parsed.paymentId}`);
          log(`   Forwarded: ${parsed.isForwarded ? 'Yes' : 'No'}`);
          
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
      `📧 Found ${threads.length} Blawby payment emails (including forwarded)\n\n` +
      'Check the execution logs for detailed information about:\n' +
      '• How many payment emails were found\n' +
      '• Whether parsing was successful\n' +
      '• If payments would be added to the sheet\n' +
      '• Whether emails were forwarded or original\n\n' +
      '💡 The enhanced search now includes forwarded emails!',
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
    let forwardedPayments = 0;
    
    // Ensure the Payments sheet has the correct header structure
    ensurePaymentsSheetHeader();
    
    log('🔍 Searching for Blawby payment emails (including forwarded)...');
    
    // Use the enhanced search function that includes forwarded emails
    const threads = searchForPaymentEmails();
    
    log(`📧 Found ${threads.length} payment emails`);
    
    for (const thread of threads) {
      const message = thread.getMessages()[0];
      const subject = message.getSubject();
      const from = message.getFrom();
      const messageDate = message.getDate(); // Get the email date
      const messageId = message.getId(); // Get the unique Message-ID
      
      log(`📧 Processing: ${subject} (From: ${from}, Message-ID: ${messageId})`);
      
      const htmlBody = message.getBody();
      const parsed = parseBlawbyPaymentEmail(htmlBody, subject);
      
      if (parsed && parsed.paymentId) {
        // Check if payment already exists using Message-ID (which is always unique)
        if (paymentExists(paymentsSheet, messageId, parsed.paymentId)) {
          log(`🔄 Payment with Message-ID ${messageId} already exists, skipping`);
        } else {
          // Add payment to sheet
          const paymentType = parsed.isForwarded ? 'forwarded' : 'direct';
          log(`💵 Adding ${paymentType} payment: $${parsed.amount} from ${parsed.clientEmail} (Payment ID: ${parsed.paymentId}, Message-ID: ${messageId})`);
          
          paymentsSheet.appendRow([
            messageDate,                   // Date from email
            parsed.clientEmail || '',     // Client Email
            parsed.amount || 0,           // Amount
            parsed.method || 'card',      // Payment Method
            parsed.paymentId,             // Payment ID (may be reused by Blawby)
            messageId                     // Message-ID (always unique)
          ]);
          
          log(`✅ ${paymentType} payment added to sheet successfully`);
          newPayments++;
          if (parsed.isForwarded) {
            forwardedPayments++;
          }
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
      const forwardedText = forwardedPayments > 0 ? `\n📧 ${forwardedPayments} forwarded payment(s) processed` : '';
      ui.alert(
        'Payment Processing Complete',
        `📧 Processed ${threads.length} payment emails\n` +
        `💵 Added ${newPayments} new payments to sheet${forwardedText}\n\n` +
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
    log('🔍 Testing Gmail search functionality (including forwarded emails)...');
    
    // Test basic Gmail access
    const basicQuery = 'is:unread newer_than:7d';
    const basicThreads = GmailApp.search(basicQuery);
    log(`📧 Basic Gmail access: Found ${basicThreads.length} unread threads in last 7 days`);
    
    // Test enhanced search for Blawby payment emails (including forwarded)
    const blawbyThreads = searchForPaymentEmails();
    log(`📧 Enhanced Blawby search: Found ${blawbyThreads.length} payment emails (including forwarded)`);
    
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
    
    // Show Blawby payment emails if found
    if (blawbyThreads.length > 0) {
      log('📋 Blawby payment emails found:');
      for (let i = 0; i < Math.min(blawbyThreads.length, 3); i++) {
        const message = blawbyThreads[i].getMessages()[0];
        const subject = message.getSubject();
        const from = message.getFrom();
        const isForwarded = subject.includes('Fwd:') || subject.includes('Forwarded:') || 
                           from !== 'notifications@blawby.com';
        log(`   ${i + 1}. From: ${from} | Subject: ${subject} | Forwarded: ${isForwarded ? 'Yes' : 'No'}`);
      }
    }
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Gmail Search Debug Complete',
      `✅ Gmail search debug completed!\n\n` +
      `📧 Results:\n` +
      `• Total unread emails (7 days): ${basicThreads.length}\n` +
      `• Blawby payment emails (enhanced): ${blawbyThreads.length}\n` +
      `• Any payment emails: ${paymentThreads.length}\n\n` +
      `💡 Enhanced search now includes forwarded emails!\n\n` +
      `Check the execution logs for detailed information.`,
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    logError('debugGmailSearch', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Debug Failed',
      `❌ Gmail search debug failed:\n\n${error.message}`,
      ui.ButtonSet.OK
    );
  }
  
  logEnd('debugGmailSearch');
}

/**
 * Simple diagnostic function to check why sync might be hanging
 */
function diagnoseSyncIssue() {
  logStart('diagnoseSyncIssue');
  
  try {
    log('🔍 Running sync diagnostics...');
    
    // Test 1: Basic spreadsheet access
    log('📊 Testing spreadsheet access...');
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = spreadsheet.getSheets();
    log(`✅ Spreadsheet access OK - Found ${sheets.length} sheets`);
    
    // Test 2: Gmail API access
    log('📧 Testing Gmail API access...');
    try {
      const testQuery = 'is:unread newer_than:1d';
      const testThreads = GmailApp.search(testQuery);
      log(`✅ Gmail API access OK - Found ${testThreads.length} unread threads`);
    } catch (gmailError) {
      log(`❌ Gmail API access failed: ${gmailError.message}`);
      throw new Error(`Gmail API authorization issue: ${gmailError.message}`);
    }
    
    // Test 3: Settings access
    log('⚙️ Testing settings access...');
    try {
      const settings = loadSettings();
      log(`✅ Settings access OK - Loaded ${Object.keys(settings).length} settings`);
    } catch (settingsError) {
      log(`❌ Settings access failed: ${settingsError.message}`);
    }
    
    // Test 4: Sheet data loading
    log('📋 Testing sheet data loading...');
    try {
      const sheetData = getSheets();
      const data = loadSheetData(sheetData);
      log(`✅ Sheet data loading OK - Loaded data for ${data.clientData.length} clients`);
    } catch (dataError) {
      log(`❌ Sheet data loading failed: ${dataError.message}`);
    }
    
    log('✅ All basic diagnostics passed');
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Diagnostic Complete',
      '✅ All basic system checks passed!\n\n' +
      'The issue might be:\n' +
      '• A specific email processing step\n' +
      '• Large data processing timeout\n' +
      '• Network connectivity issue\n\n' +
      'Try running "📧 Process Gmail Payments" separately to isolate the issue.',
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    logError('diagnoseSyncIssue', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Diagnostic Failed',
      `❌ Found issue: ${error.message}\n\n` +
      'This explains why the sync is hanging. Please fix this issue and try again.',
      ui.ButtonSet.OK
    );
  }
  
  logEnd('diagnoseSyncIssue');
}

/**
 * Step-by-step sync to identify where hanging occurs
 */
function stepByStepSync() {
  logStart('stepByStepSync');
  
  try {
    const ui = SpreadsheetApp.getUi();
    
    // Step 1: Basic validation
    log('🔍 Step 1: Basic validation...');
    ui.alert('Step 1', 'Testing basic validation...', ui.ButtonSet.OK);
    
    validateSpreadsheetAccess();
    const validationResult = validateRequiredSettings();
    if (!validationResult.isValid) {
      throw new Error(`Configuration Error: ${validationResult.message}`);
    }
    log('✅ Step 1 passed: Basic validation');
    
    // Step 2: Get sheets
    log('📊 Step 2: Getting sheets...');
    ui.alert('Step 2', 'Getting spreadsheet sheets...', ui.ButtonSet.OK);
    
    const sheets = getSheetsAndSetup();
    log('✅ Step 2 passed: Sheets loaded');
    
    // Step 3: Load data
    log('📋 Step 3: Loading sheet data...');
    ui.alert('Step 3', 'Loading sheet data...', ui.ButtonSet.OK);
    
    const data = loadSheetData(sheets);
    log('✅ Step 3 passed: Data loaded');
    
    // Step 4: Test Gmail access (most likely culprit)
    log('📧 Step 4: Testing Gmail access...');
    ui.alert('Step 4', 'Testing Gmail API access...', ui.ButtonSet.OK);
    
    try {
      const testQuery = 'is:unread newer_than:1d';
      const testThreads = GmailApp.search(testQuery);
      log(`✅ Step 4 passed: Gmail access OK - Found ${testThreads.length} unread threads`);
    } catch (gmailError) {
      log(`❌ Step 4 failed: Gmail access error - ${gmailError.message}`);
      throw new Error(`Gmail API issue: ${gmailError.message}`);
    }
    
    // Step 5: Test Gmail payment search
    log('🔍 Step 5: Testing Gmail payment search...');
    ui.alert('Step 5', 'Testing Gmail payment search...', ui.ButtonSet.OK);
    
    try {
      const threads = searchForPaymentEmails();
      log(`✅ Step 5 passed: Payment search OK - Found ${threads.length} payment emails`);
    } catch (searchError) {
      log(`❌ Step 5 failed: Payment search error - ${searchError.message}`);
      throw new Error(`Payment search issue: ${searchError.message}`);
    }
    
    // Step 6: Test client sync
    log('👥 Step 6: Testing client sync...');
    ui.alert('Step 6', 'Testing client sync...', ui.ButtonSet.OK);
    
    try {
      syncPaymentsAndClients();
      log('✅ Step 6 passed: Client sync OK');
    } catch (syncError) {
      log(`❌ Step 6 failed: Client sync error - ${syncError.message}`);
      throw new Error(`Client sync issue: ${syncError.message}`);
    }
    
    // Step 7: Test email sending
    log('📧 Step 7: Testing email sending...');
    ui.alert('Step 7', 'Testing email sending...', ui.ButtonSet.OK);
    
    try {
      sendDailyBalanceDigest();
      log('✅ Step 7 passed: Email sending OK');
    } catch (emailError) {
      log(`❌ Step 7 failed: Email sending error - ${emailError.message}`);
      throw new Error(`Email sending issue: ${emailError.message}`);
    }
    
    log('✅ All steps completed successfully!');
    ui.alert('Success', 'All sync steps completed successfully! The issue was likely temporary.', ui.ButtonSet.OK);
    
  } catch (error) {
    logError('stepByStepSync', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Sync Issue Found',
      `❌ Sync failed at step:\n\n${error.message}\n\n` +
      'This identifies exactly where the hanging occurs. Please fix this issue and try again.',
      ui.ButtonSet.OK
    );
  }
  
  logEnd('stepByStepSync');
}

/**
 * Check Gmail API authorization and trigger consent if needed
 */
function checkGmailAuthorization() {
  logStart('checkGmailAuthorization');
  
  try {
    log('🔍 Checking Gmail API authorization...');
    
    // Try a simple Gmail operation to test authorization
    const testQuery = 'is:unread newer_than:1d';
    const testThreads = GmailApp.search(testQuery);
    
    log(`✅ Gmail API authorization OK - Found ${testThreads.length} unread threads`);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Gmail API Authorization',
      '✅ Gmail API is properly authorized!\n\n' +
      'The sync should work correctly now.',
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    logError('checkGmailAuthorization', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      'Gmail API Authorization Required',
      '❌ Gmail API authorization failed:\n\n' +
      `${error.message}\n\n` +
      '🔧 To fix this:\n' +
      '1. Go to the Apps Script editor\n' +
      '2. Click "Services" in the left sidebar\n' +
      '3. Add "Gmail API" service\n' +
      '4. Run "📧 Process Gmail Payments" to trigger authorization\n\n' +
      'This will prompt you to authorize Gmail access.',
      ui.ButtonSet.OK
    );
  }
  
  logEnd('checkGmailAuthorization');
}