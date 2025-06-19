// ========== EMAIL FUNCTIONS ==========

/**
 * Universal email sending function that handles test mode automatically
 * @param {string} recipient - Email recipient
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {Object} options - Additional options for MailApp.sendEmail
 */
function sendEmail(recipient, subject, body, options = {}) {
  const isTest = isTestMode();
  const firmEmail = getFirmEmail();
  
  const finalRecipient = isTest ? firmEmail : recipient;
  const finalSubject = isTest ? `[TEST] ${subject}` : subject;
  
  // Validate email address
  if (!finalRecipient || !finalRecipient.includes('@') || finalRecipient === 'your-email@example.com') {
    const errorMsg = `Invalid email recipient: "${finalRecipient}". Please set your email address in the Welcome sheet under 'Firm Email' setting.`;
    logError('sendEmail', new Error(errorMsg));
    throw new Error(errorMsg);
  }
  
  log(`📧 Sending email to: ${finalRecipient} | Subject: ${finalSubject}`);
  
  try {
    const emailOptions = {
      to: finalRecipient,
      subject: finalSubject,
      ...options
    };
    
    // Handle HTML content properly
    if (options.isHtml) {
      emailOptions.htmlBody = body;
      delete emailOptions.isHtml; // Remove our custom option
      log("📧 Using HTML email format");
    } else {
      emailOptions.body = body;
      log("📧 Using plain text email format");
    }
    
    MailApp.sendEmail(emailOptions);
    
    log(`✅ Email sent successfully to ${finalRecipient}`);
  } catch (error) {
    logError('sendEmail', error);
    throw error;
  }
}

/**
 * Send email to firm (bypasses test mode)
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {Object} options - Additional options
 */
function sendEmailToFirm(subject, body, options = {}) {
  const firmEmail = getFirmEmail();
  sendEmail(firmEmail, subject, body, options);
}

function getFirmEmail() {
  try {
    return Session.getActiveUser().getEmail();
  } catch (error) {
    console.log("Warning: Could not get active user email, using fallback");
    // Try to get from settings first
    try {
      const settings = loadSettings();
      const firmEmail = settings[SETTINGS_KEYS.FIRM_EMAIL];
      if (firmEmail && typeof firmEmail === 'string' && firmEmail.includes('@')) {
        return firmEmail;
      }
    } catch (e) {
      console.log("Could not load settings for fallback email");
    }
    // Final fallback - use a placeholder that will cause a clear error
    throw new Error("Firm Email not configured. Please set your email address in the Welcome sheet under 'Firm Email' setting.");
  }
}

function sendLowBalanceEmail(clientID, email, clientName, balance, targetBalance, paymentLink, lastLawyerID, lawyerEmails, today) {
  logStart('sendLowBalanceEmail');
  
  const props = PropertiesService.getScriptProperties();
  const emailKey = `low_balance_${clientID}_${today}`;
  
  // Check if email already sent today
  if (props.getProperty(emailKey)) {
    log(`📧 Low balance email already sent today for ${clientName}`);
    logEnd('sendLowBalanceEmail');
    return false;
  }
  
  // Send to client using template
  const clientSubject = renderTemplate('LOW_BALANCE', 'CLIENT_SUBJECT');
  const clientBody = renderTemplate('LOW_BALANCE', 'CLIENT_BODY', clientName, balance, targetBalance, paymentLink);
  
  sendEmail(email, clientSubject, clientBody, { isHtml: true });
  
  // Send to firm (only if not in test mode) using template
  if (!isTestMode()) {
    const lastActivity = lawyerEmails[lastLawyerID] || 'Unknown';
    const ownerSubject = renderTemplate('LOW_BALANCE', 'OWNER_SUBJECT', clientName);
    const ownerBody = renderTemplate('LOW_BALANCE', 'OWNER_BODY', clientName, balance, targetBalance, lastActivity);
    
    sendEmailToFirm(ownerSubject, ownerBody, { isHtml: true });
  }
  
  // Mark as sent
  props.setProperty(emailKey, "1");
  logEnd('sendLowBalanceEmail');
  return true;
}

function sendDailyBalanceDigest() {
  logStart('sendDailyBalanceDigest');
  
  try {
    const sheets = getSheets();
    const data = loadSheetData(sheets);
    
    log("📊 Analyzing client balances...");
    const lawyerData = buildLawyerMaps(data.lawyers);
    const clientsById = buildClientMap(data.clientData);
    
    // Get low balance clients
    const lowBalanceClients = [];
    log(`📋 Checking ${Object.keys(clientsById).length} clients for low balances...`);
    
    for (const [clientID, row] of Object.entries(clientsById)) {
      const email = row[0];
      const clientName = row[1] || "Client";
      const targetBalance = parseFloat(row[2]) || 0;
      
      const balanceInfo = calculateClientBalance(clientID, email, data, lawyerData.rates);
      const balance = balanceInfo.totalPaid - balanceInfo.totalUsed;
      const topUp = Math.max(0, targetBalance - balance);
      
      if (topUp > 0) {
        lowBalanceClients.push({
          name: clientName,
          email: email,
          balance: balance,
          targetBalance: targetBalance,
          topUp: topUp,
          lastActivity: lawyerData.emails[balanceInfo.lastLawyerID] || 'Unknown'
        });
        log(`⚠️ Low balance detected for ${clientName}: $${balance.toFixed(2)} (needs $${topUp.toFixed(2)})`);
      }
    }
    
    if (lowBalanceClients.length === 0) {
      log("📧 No low balance clients to report");
      logEnd('sendDailyBalanceDigest');
      return;
    }
    
    // Sort by top-up amount (highest first)
    lowBalanceClients.sort((a, b) => b.topUp - a.topUp);
    
    log(`📧 Sending digest for ${lowBalanceClients.length} low balance clients...`);
    
    // Send digest using template
    const subject = renderTemplate('DAILY_DIGEST', 'SUBJECT');
    const body = renderTemplate('DAILY_DIGEST', 'BODY', lowBalanceClients);
    
    sendEmailToFirm(subject, body, { isHtml: true });
    
    log(`✅ Daily balance digest sent with ${lowBalanceClients.length} clients`);
  } catch (error) {
    logError('sendDailyBalanceDigest', error);
    throw error;
  }
  
  logEnd('sendDailyBalanceDigest');
}

function notifyServiceResumed(clientID, email, clientName, balance, today) {
  logStart('notifyServiceResumed');
  
  const props = PropertiesService.getScriptProperties();
  const emailKey = `service_resumed_${clientID}_${today}`;
  
  // Check if notification already sent today
  if (props.getProperty(emailKey)) {
    log(`📧 Service resumed notification already sent today for ${clientName}`);
    logEnd('notifyServiceResumed');
    return;
  }
  
  // Send to client using template
  const clientSubject = renderTemplate('SERVICE_RESUMED', 'CLIENT_SUBJECT');
  const clientBody = renderTemplate('SERVICE_RESUMED', 'CLIENT_BODY', clientName);
  
  sendEmail(email, clientSubject, clientBody, { isHtml: true });
  
  // Send to firm using template
  const ownerSubject = renderTemplate('SERVICE_RESUMED', 'OWNER_SUBJECT', clientName);
  const ownerBody = renderTemplate('SERVICE_RESUMED', 'OWNER_BODY', clientName);
  
  sendEmailToFirm(ownerSubject, ownerBody, { isHtml: true });
  
  // Mark as sent
  props.setProperty(emailKey, "1");
  logEnd('notifyServiceResumed');
}

/**
 * Sends a welcome email to the firm when the system is first set up
 */
function sendWelcomeEmail() {
  logStart('sendWelcomeEmail');
  
  try {
    const firmEmail = getFirmEmail();
    const subject = "🎉 Welcome to Blawby Legal Retainer Management";
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2c3e50;">🎉 Welcome to Blawby!</h1>
        
        <p>Your legal retainer management system is now set up and ready to use!</p>
        
        <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>✅ System Status</h3>
          <ul>
            <li><strong>Test Mode:</strong> ON (safe for testing)</li>
            <li><strong>Firm Email:</strong> ${firmEmail}</li>
            <li><strong>Email Templates:</strong> Loaded and validated</li>
            <li><strong>Sample Data:</strong> Ready for testing</li>
          </ul>
        </div>
        
        <h3>🚀 Next Steps</h3>
        <ol>
          <li><strong>Test the System:</strong> Click "Run Full Daily Sync" in the Blawby menu</li>
          <li><strong>Check Your Email:</strong> You'll receive test receipts and notifications</li>
          <li><strong>Review Results:</strong> Check the Clients sheet to see sample clients created</li>
          <li><strong>Customize Settings:</strong> Update the Welcome sheet with your preferences</li>
        </ol>
        
        <h3>📧 What You'll Receive</h3>
        <ul>
          <li>Payment receipts for sample clients</li>
          <li>Daily balance digest (if low balances detected)</li>
          <li>Low balance warnings (when applicable)</li>
        </ul>
        
        <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>💡 Pro Tips</h3>
          <ul>
            <li>All emails will be marked with [TEST] until you disable Test Mode</li>
            <li>Use "Send Test Email" to verify your configuration anytime</li>
            <li>Check the Welcome sheet for detailed setup instructions</li>
          </ul>
        </div>
        
        <p>If you have any questions, check the Welcome sheet or contact support@blawby.com</p>
        
        <p style="color: #7f8c8d; font-size: 14px; margin-top: 20px;">
          Best regards,<br>
          The Blawby Team
        </p>
      </div>
    `;
    
    sendEmail(firmEmail, subject, body, { isHtml: true });
    
    log(`✅ Welcome email sent to ${firmEmail}`);
  } catch (error) {
    logError('sendWelcomeEmail', error);
    throw error;
  }
  
  logEnd('sendWelcomeEmail');
} 