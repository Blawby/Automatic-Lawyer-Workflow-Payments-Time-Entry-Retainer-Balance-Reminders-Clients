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
    MailApp.sendEmail({
      to: finalRecipient,
      subject: finalSubject,
      body: body,
      ...options
    });
    
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
      const settings = loadSettings(SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Welcome"));
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
  
  // Send to client
  const clientSubject = "Low Balance Alert - Blawby";
  const clientBody = `
    Dear ${clientName},
    
    Your Blawby account balance is currently low at $${balance.toFixed(2)}.
    Your target balance is $${targetBalance.toFixed(2)}.
    
    To continue receiving our services without interruption, please top up your balance using this link:
    ${paymentLink}
    
    If you have any questions, please don't hesitate to contact us.
    
    Best regards,
    The Blawby Team
  `;
  
  sendEmail(email, clientSubject, clientBody);
  
  // Send to firm (only if not in test mode)
  if (!isTestMode()) {
    const ownerSubject = `Low Balance Alert - ${clientName}`;
    const ownerBody = `
      Client: ${clientName}
      Email: ${email}
      Current Balance: $${balance.toFixed(2)}
      Target Balance: $${targetBalance.toFixed(2)}
      Last Active Lawyer: ${lawyerEmails[lastLawyerID] || 'Unknown'}
      
      Payment Link: ${paymentLink}
    `;
    
    sendEmailToFirm(ownerSubject, ownerBody);
  }
  
  // Mark as sent
  props.setProperty(emailKey, "1");
  logEnd('sendLowBalanceEmail');
  return true;
}

function sendDailyBalanceDigest() {
  logStart('sendDailyBalanceDigest');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = getSheets(ss);
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
        lastLawyer: lawyerData.emails[balanceInfo.lastLawyerID] || 'Unknown'
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
  
  // Build email body
  let body = "Daily Low Balance Digest\n\n";
  body += `Date: ${new Date().toLocaleDateString()}\n\n`;
  
  for (const client of lowBalanceClients) {
    body += `Client: ${client.name}\n`;
    body += `Email: ${client.email}\n`;
    body += `Current Balance: $${client.balance.toFixed(2)}\n`;
    body += `Target Balance: $${client.targetBalance.toFixed(2)}\n`;
    body += `Top-up Needed: $${client.topUp.toFixed(2)}\n`;
    body += `Last Active Lawyer: ${client.lastLawyer}\n\n`;
  }
  
  // Send digest
  const subject = "Daily Low Balance Digest - Blawby";
  sendEmailToFirm(subject, body);
  
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
  
  // Send to client
  const clientSubject = "Service Resumed - Blawby";
  const clientBody = `
    Dear ${clientName},
    
    Your Blawby account balance has been restored to $${balance.toFixed(2)}.
    Your service has been automatically resumed.
    
    Thank you for your continued trust in our services.
    
    Best regards,
    The Blawby Team
  `;
  
  sendEmail(email, clientSubject, clientBody);
  
  // Send to firm
  const ownerSubject = `Service Resumed - ${clientName}`;
  const ownerBody = `
    Client: ${clientName}
    Email: ${email}
    Current Balance: $${balance.toFixed(2)}
    
    Service has been automatically resumed.
  `;
  
  sendEmailToFirm(ownerSubject, ownerBody);
  
  // Mark as sent
  props.setProperty(emailKey, "1");
  logEnd('notifyServiceResumed');
} 