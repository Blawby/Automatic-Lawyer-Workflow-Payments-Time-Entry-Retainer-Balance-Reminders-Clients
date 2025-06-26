// ========== EMAIL FUNCTIONS (Gmail API) ==========

/**
 * Send email using Gmail API (replaces MailApp)
 * @param {string} recipient - Email recipient
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {Object} options - Additional options
 */
function sendEmailViaGmailAPI(recipient, subject, body, options = {}) {
  const firmEmail = getFirmEmail();
  
  // Validate email address
  if (!recipient || !recipient.includes('@') || recipient === 'your-email@example.com') {
    const errorMsg = `Invalid email recipient: "${recipient}". Please set your email address in the Welcome sheet under 'Firm Email' setting.`;
    logError('sendEmailViaGmailAPI', new Error(errorMsg));
    throw new Error(errorMsg);
  }
  
  log(`📧 Sending email to: ${recipient} | Subject: ${subject}`);
  
  try {
    // Create email message using Gmail API
    const message = createGmailMessage(recipient, subject, body, options);
    
    // Log email format
    if (options.isHtml) {
      log("📧 Using HTML email format");
    } else {
      log("📧 Using plain text email format");
    }
    
    // Send via Gmail API
    Gmail.Users.Messages.send(message, 'me');
    
    log(`✅ Email sent successfully to ${recipient}`);
  } catch (error) {
    logError('sendEmailViaGmailAPI', error);
    throw error;
  }
}

/**
 * Create a Gmail API message object
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {Object} options - Additional options
 * @return {Object} - Gmail API message object
 */
function createGmailMessage(to, subject, body, options = {}) {
  // Create the email content
  let emailContent = '';
  
  if (options.isHtml) {
    // HTML email
    emailContent = [
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\n');
  } else {
    // Plain text email
    emailContent = [
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\n');
  }
  
  // Encode the email content
  const encodedEmail = Utilities.base64Encode(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  
  return {
    raw: encodedEmail
  };
}

/**
 * Universal email sending function that uses Gmail API
 * @param {string} recipient - Email recipient
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {Object} options - Additional options
 */
function sendEmail(recipient, subject, body, options = {}) {
  return sendEmailViaGmailAPI(recipient, subject, body, options);
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

/**
 * Check Gmail API quota (much higher than MailApp)
 * @return {Object} - Object with quota info
 */
function checkEmailQuota() {
  try {
    // Gmail API has much higher limits - 1M emails/day for most users
    // We'll use a conservative estimate and track our own usage
    const props = PropertiesService.getScriptProperties();
    const today = new Date().toISOString().split('T')[0];
    const emailCountKey = `gmail_api_emails_${today}`;
    const emailCount = parseInt(props.getProperty(emailCountKey) || '0');
    
    // Conservative daily limit (can be increased)
    const dailyLimit = 10000; // 10K emails per day
    const remaining = Math.max(0, dailyLimit - emailCount);
    const percentageUsed = (emailCount / dailyLimit) * 100;
    
    return {
      remaining: remaining,
      used: emailCount,
      total: dailyLimit,
      percentageUsed: percentageUsed,
      canSend: remaining > 0,
      isNearLimit: percentageUsed >= 90
    };
  } catch (error) {
    logError('checkEmailQuota', error);
    return {
      remaining: 10000,
      used: 0,
      total: 10000,
      percentageUsed: 0,
      canSend: true,
      isNearLimit: false
    };
  }
}

/**
 * Track email usage for quota management
 */
function trackEmailUsage() {
  try {
    const props = PropertiesService.getScriptProperties();
    const today = new Date().toISOString().split('T')[0];
    const emailCountKey = `gmail_api_emails_${today}`;
    const currentCount = parseInt(props.getProperty(emailCountKey) || '0');
    props.setProperty(emailCountKey, (currentCount + 1).toString());
  } catch (error) {
    logError('trackEmailUsage', error);
  }
}

/**
 * Log current email quota status
 */
function logEmailQuotaStatus() {
  const quota = checkEmailQuota();
  log(`📧 Gmail API Email Quota Status:`);
  log(`   - Remaining: ${quota.remaining}/${quota.total}`);
  log(`   - Used: ${quota.used}/${quota.total} (${quota.percentageUsed.toFixed(1)}%)`);
  log(`   - Can send: ${quota.canSend ? '✅ Yes' : '❌ No'}`);
  if (quota.isNearLimit) {
    log(`   - ⚠️ WARNING: Near daily limit!`);
  }
}

/**
 * Simple fallback renderTemplate function for when the main one is not accessible
 * @param {string} type - Template type
 * @param {string} subtype - Template subtype
 * @param {...any} params - Parameters to pass to the template function
 * @return {string} - Rendered template
 */
function renderTemplate(type, subtype, ...params) {
  try {
    // Try to use the new template system first
    if (typeof getTemplateLoader === 'function') {
      const loader = getTemplateLoader();
      return loader.render(type, subtype, ...params);
    }
    
    // Fallback to simple templates if new system not available
    const templates = {
      'LOW_BALANCE': {
        'CLIENT_SUBJECT': (clientName) => `Your retainer needs a quick top-up, ${clientName}`,
        'CLIENT_BODY': (clientName, balance, targetBalance, paymentLink) => 
          `Hi ${clientName}! 👋\n\nWe wanted to give you a friendly heads up about your retainer balance.\n\nYour Current Balance:\n- Available: $${balance.toFixed(2)}\n- Recommended: $${targetBalance.toFixed(2)}\n- To add: $${(targetBalance - balance).toFixed(2)}\n\nTo keep your legal services running smoothly, we recommend topping up your retainer. This helps us continue working on your matters without any interruptions.\n\nAdd funds here: ${paymentLink}\n\nNo rush—you can add funds whenever it's convenient for you. If you have any questions, just reply to this email or give us a call.\n\nThanks for choosing us!\n\nBest regards,\nYour Legal Team`,
        'OWNER_SUBJECT': (clientName) => `Low Balance Alert - ${clientName}`,
        'OWNER_BODY': (clientName, balance, targetBalance, lastActivity) => 
          `Client ${clientName} has a low balance of $${balance.toFixed(2)}. Target balance is $${targetBalance.toFixed(2)}. Last activity: ${lastActivity || 'No recent activity'}`
      },
      'DAILY_DIGEST': {
        'SUBJECT': 'Your Blawby Daily Summary',
        'BODY': (lowBalanceClients, paymentSummary) => {
          let body = '📬 Your Daily Blawby Summary\n\n';
          body += 'Here\'s a snapshot of client retainer activity and balances today.\n\n';
          
          if (paymentSummary) {
            body += `💰 Total Payments Received: $${paymentSummary.total.toFixed(2)}\n`;
            body += `👥 Clients Paid Today: ${paymentSummary.count}\n\n`;
          }
          
          if (lowBalanceClients.length === 0) {
            body += '🎉 All client balances are in good standing. Great work!\n';
          } else {
            body += `🔔 Clients Needing Attention (${lowBalanceClients.length}):\n\n`;
            lowBalanceClients.forEach(client => {
              body += `${client.name}:\n`;
              body += `  Balance: $${client.balance.toFixed(2)}\n`;
              body += `  Target: $${client.targetBalance.toFixed(2)}\n`;
              body += `  Last Activity: ${client.lastActivity || 'N/A'}\n`;
              body += `  Email Sent: ${client.emailSent ? '✅ Yes' : '❌ No'}\n`;
              if (client.balance <= 0) {
                body += `  Status: 🚫 Services Paused\n`;
              } else {
                body += `  Status: ⚠️ Low Balance\n`;
              }
              body += '\n';
            });
            body += '📝 Action recommended: Follow up with clients who haven\'t responded or whose services are paused.\n';
          }
          
          body += '\nThis summary was generated automatically by Blawby.';
          return body;
        }
      },
      'SERVICE_RESUMED': {
        'CLIENT_SUBJECT': 'Great news! Your services are back up and running',
        'CLIENT_BODY': (clientName) => `Welcome back, ${clientName}! 🎉\n\nGreat news—your retainer has been topped up and your legal services are now fully active again!\n\n✅ All systems are go! We're ready to continue working on your matters.\n\nThanks for keeping your retainer current. This helps us provide you with the best possible service without any interruptions.\n\nIf you need anything or have questions about your case, don't hesitate to reach out. We're here to help!\n\nBest regards,\nYour Legal Team`,
        'OWNER_SUBJECT': (clientName) => `Service Resumed - ${clientName}`,
        'OWNER_BODY': (clientName) => `Services have been resumed for client ${clientName}.`
      },
    };
    
    if (!templates[type] || !templates[type][subtype]) {
      throw new Error(`Template ${type}.${subtype} not found`);
    }
    
    const template = templates[type][subtype];
    if (typeof template === 'function') {
      return template(...params);
    }
    return template;
  } catch (error) {
    logError('renderTemplate', error);
    // Return a simple fallback message
    return `Template rendering failed: ${error.message}`;
  }
}

function sendLowBalanceEmail(clientID, email, clientName, balance, targetBalance, paymentLink, lastLawyerID, lawyerEmails, today) {
  logStart('sendLowBalanceEmail');
  
  const props = PropertiesService.getScriptProperties();
  const emailKey = `low_balance_${clientID}_${today}`;
  
  // Enhanced logging for debugging
  log(`🔍 Low balance check for ${clientName} (${email}):`);
  log(`   - Current balance: $${balance.toFixed(2)}`);
  log(`   - Target balance: $${targetBalance.toFixed(2)}`);
  log(`   - Top-up needed: $${(targetBalance - balance).toFixed(2)}`);
  log(`   - Payment link: ${paymentLink}`);
  log(`   - Live emails enabled: ${isLiveEmailsEnabled() ? 'YES' : 'NO'}`);
  log(`   - Firm email: ${getFirmEmail()}`);
  
  // Check if email already sent today
  if (props.getProperty(emailKey)) {
    log(`📧 Low balance email already sent today for ${clientName}`);
    logEnd('sendLowBalanceEmail');
    return false;
  }
  
  // Check if live emails are enabled
  if (!isLiveEmailsEnabled()) {
    log(`🔒 Live emails disabled - skipping low balance email for ${clientName}`);
    logEnd('sendLowBalanceEmail');
    return false;
  }
  
  // Check email quota before sending
  const quota = checkEmailQuota();
  if (!quota.canSend) {
    log(`❌ Cannot send low balance email to ${clientName}: Email quota exceeded (${quota.used}/${quota.total} emails used)`);
    logEnd('sendLowBalanceEmail');
    return false;
  }
  
  try {
    // Send to client using template
    const clientSubject = renderTemplate('LOW_BALANCE', 'CLIENT_SUBJECT', clientName);
    const clientBody = renderTemplate('LOW_BALANCE', 'CLIENT_BODY', clientName, balance, targetBalance, paymentLink);
    
    log(`📧 Sending low balance email to client: ${email}`);
    sendEmail(email, clientSubject, clientBody, { isHtml: true, emailType: 'low_balance_client' });
    trackEmailUsage();
    
    // Send to firm using template (always send in test mode, optional in production)
    const lastActivity = lawyerEmails[lastLawyerID] || 'Unknown';
    const ownerSubject = renderTemplate('LOW_BALANCE', 'OWNER_SUBJECT', clientName);
    const ownerBody = renderTemplate('LOW_BALANCE', 'OWNER_BODY', clientName, balance, targetBalance, lastActivity);
    
    log(`📧 Sending low balance notification to firm`);
    sendEmailToFirm(ownerSubject, ownerBody, { isHtml: true, emailType: 'low_balance_firm' });
    trackEmailUsage();
    
    // Mark as sent (only in production mode)
    if (isLiveEmailsEnabled()) {
      props.setProperty(emailKey, "1");
    }
    
    logEnd('sendLowBalanceEmail');
    return true;
  } catch (error) {
    // Handle quota errors gracefully
    if (error.message && error.message.includes('quota exceeded')) {
      log(`❌ Low balance email not sent to ${clientName}: ${error.message}`);
      logEnd('sendLowBalanceEmail');
      return false;
    }
    
    logError('sendLowBalanceEmail', error);
    logEnd('sendLowBalanceEmail');
    return false;
  }
}

/**
 * Sends a daily balance digest email to the firm summarizing low balance clients
 */
function sendDailyBalanceDigest() {
  logStart('sendDailyBalanceDigest');
  try {
    // Check email quota first
    const quota = checkEmailQuota();
    if (!quota.canSend) {
      log(`❌ Cannot send daily digest: Email quota exceeded (${quota.used}/${quota.total} emails used)`);
      logEnd('sendDailyBalanceDigest');
      return;
    }
    
    // Log quota status
    logEmailQuotaStatus();
    
    // Load all relevant data
    const sheets = getSheets();
    const data = loadSheetData(sheets);
    const lawyerData = buildLawyerMaps(data.lawyers);
    const clientsById = buildClientMap(data.clientData);
    
    // Gather low balance clients
    const lowBalanceClients = [];
    let paymentTotal = 0;
    let paymentCount = 0;
    
    for (const [clientID, row] of Object.entries(clientsById)) {
      const email = row[0];
      const clientName = row[1] || "Client";
      const targetBalance = parseFloat(row[2]) || 0;
      const balanceInfo = calculateClientBalance(clientID, email, data, lawyerData.rates);
      const balance = balanceInfo.totalPaid - balanceInfo.totalUsed;
      const lastActivity = balanceInfo.lastActivityDate ? balanceInfo.lastActivityDate.toISOString().split('T')[0] : null;
      
      // Payment summary
      if (balanceInfo.totalPaid > 0) {
        paymentTotal += balanceInfo.totalPaid;
        paymentCount++;
      }
      
      // Low balance detection
      if (balance < targetBalance) {
        lowBalanceClients.push({
          name: clientName,
          balance,
          targetBalance,
          lastActivity,
          emailSent: false // Not tracked here
        });
      }
    }
    
    // Only send if there are low balances
    if (lowBalanceClients.length === 0) {
      log('✅ No low balance clients, skipping daily digest email');
      logEnd('sendDailyBalanceDigest');
      return;
    }
    
    // Prepare payment summary
    const paymentSummary = {
      total: paymentTotal,
      count: paymentCount
    };
    
    // Render email content
    const subject = renderTemplate('DAILY_DIGEST', 'SUBJECT');
    const body = renderTemplate('DAILY_DIGEST', 'BODY', lowBalanceClients, paymentSummary);
    
    // Send to firm
    sendEmailToFirm(subject, body, { isHtml: true, emailType: 'daily_digest' });
    trackEmailUsage();
    log('✅ Daily balance digest email sent to firm');
  } catch (error) {
    // Handle quota errors gracefully
    if (error.message && error.message.includes('quota exceeded')) {
      log(`❌ Daily digest not sent: ${error.message}`);
    } else {
      logError('sendDailyBalanceDigest', error);
      throw error;
    }
  }
  logEnd('sendDailyBalanceDigest');
}

/**
 * Notifies when a client's service has been resumed after topping up their balance
 * @param {string} clientID - The client ID
 * @param {string} email - The client's email address
 * @param {string} clientName - The client's name
 * @param {number} balance - The current balance
 * @param {string} today - Today's date in YYYY-MM-DD format
 */
function notifyServiceResumed(clientID, email, clientName, balance, today) {
  logStart('notifyServiceResumed');
  
  try {
    const props = PropertiesService.getScriptProperties();
    const emailKey = `service_resumed_${clientID}_${today}`;
    
    // Check if notification already sent today
    if (props.getProperty(emailKey)) {
      log(`📧 Service resumed notification already sent today for ${clientName}`);
      logEnd('notifyServiceResumed');
      return;
    }
    
    // Check if live emails are enabled
    if (!isLiveEmailsEnabled()) {
      log(`🔒 Live emails disabled - skipping service resumed notification for ${clientName}`);
      logEnd('notifyServiceResumed');
      return;
    }
    
    // Check email quota before sending
    const quota = checkEmailQuota();
    if (!quota.canSend) {
      log(`❌ Cannot send service resumed notification to ${clientName}: Email quota exceeded (${quota.used}/${quota.total} emails used)`);
      logEnd('notifyServiceResumed');
      return;
    }
    
    // Send to client using template
    const clientSubject = renderTemplate('SERVICE_RESUMED', 'CLIENT_SUBJECT');
    const clientBody = renderTemplate('SERVICE_RESUMED', 'CLIENT_BODY', clientName);
    
    log(`📧 Sending service resumed notification to client: ${email}`);
    sendEmail(email, clientSubject, clientBody, { isHtml: true, emailType: 'service_resumed_client' });
    trackEmailUsage();
    
    // Send to firm using template
    const ownerSubject = renderTemplate('SERVICE_RESUMED', 'OWNER_SUBJECT', clientName);
    const ownerBody = renderTemplate('SERVICE_RESUMED', 'OWNER_BODY', clientName);
    
    log(`📧 Sending service resumed notification to firm`);
    sendEmailToFirm(ownerSubject, ownerBody, { isHtml: true, emailType: 'service_resumed_firm' });
    trackEmailUsage();
    
    // Mark as sent (only in production mode)
    if (isLiveEmailsEnabled()) {
      props.setProperty(emailKey, "1");
    }
    
    log(`✅ Service resumed notifications sent for ${clientName}`);
  } catch (error) {
    // Handle quota errors gracefully
    if (error.message && error.message.includes('quota exceeded')) {
      log(`❌ Service resumed notification not sent to ${clientName}: ${error.message}`);
    } else {
      logError('notifyServiceResumed', error);
    }
    // Don't throw error - this is a non-critical notification
  }
  
  logEnd('notifyServiceResumed');
}