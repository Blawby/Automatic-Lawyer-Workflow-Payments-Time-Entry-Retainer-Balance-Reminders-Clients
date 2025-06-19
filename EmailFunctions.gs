// ========== EMAIL FUNCTIONS ==========

/**
 * Centralized email sending function that handles test mode automatically
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
  
  log(`📧 Sending email to ${finalRecipient}: ${finalSubject}`);
  
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
    } else {
      emailOptions.body = body;
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
  
  const sheets = getSheets();
  const data = loadSheetData(sheets);
  
  const lawyerData = buildLawyerMaps(data.lawyers);
  const clientsById = buildClientMap(data.clientData);
  
  // Get low balance clients
  const lowBalanceClients = [];
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
    }
  }
  
  if (lowBalanceClients.length === 0) {
    log("📧 No low balance clients to report");
    logEnd('sendDailyBalanceDigest');
    return;
  }
  
  // Sort by top-up amount (highest first)
  lowBalanceClients.sort((a, b) => b.topUp - a.topUp);
  
  // Send digest using template
  const subject = renderTemplate('DAILY_DIGEST', 'SUBJECT');
  const body = renderTemplate('DAILY_DIGEST', 'BODY', lowBalanceClients);
  
  sendEmailToFirm(subject, body, { isHtml: true });
  
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