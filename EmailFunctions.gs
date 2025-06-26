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
  logStart('sendEmail');
  
  try {
    // Validate email address
    if (!recipient || !recipient.includes('@')) {
      throw new Error(`Invalid email address: ${recipient}`);
    }
    
    // Prepare email options
    const emailOptions = {
      name: 'Blawby Legal System',
      noReply: true
    };
    
    // Add HTML formatting if specified
    if (options.isHtml) {
      emailOptions.htmlBody = body;
    } else {
      emailOptions.body = body;
    }
    
    // Send email via Gmail API
    log(`📧 Sending email to: ${recipient}`);
    log(`📧 Subject: ${subject}`);
    
    GmailApp.sendEmail(recipient, subject, body, emailOptions);
    
    log(`✅ Email sent successfully to ${recipient}`);
    logEnd('sendEmail');
    return true;
    
  } catch (error) {
    logError('sendEmail', error);
    logEnd('sendEmail');
    return false;
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

/**
 * Send daily balance digest with action buttons for manual email sending
 * This replaces the old automatic email sending system
 */
function sendDailyBalanceDigest() {
  logStart('sendDailyBalanceDigest');
  
  try {
    log('📧 Sending daily balance digest with action buttons...');
    
    const firmEmail = getFirmEmail();
    if (!firmEmail || !firmEmail.includes('@') || firmEmail === 'your-email@example.com') {
      log('❌ Firm email not configured - cannot send daily digest');
      logEnd('sendDailyBalanceDigest');
      return;
    }
    
    // Get current data
    const sheets = getSheets();
    const data = loadSheetData(sheets);
    const lawyerData = buildLawyerMaps(data.lawyers);
    const clientsById = buildClientMap(data.clientData);
    const today = new Date().toISOString().split('T')[0];
    
    // Find clients with low balances
    const lowBalanceClients = [];
    const defaultTargetBalance = getSetting('Low Balance Threshold', 500);
    
    for (const [clientID, row] of Object.entries(clientsById)) {
      const email = row[0];
      const clientName = row[1] || "Client";
      let targetBalance = parseFloat(row[2]) || defaultTargetBalance;
      
      const balanceInfo = calculateClientBalance(clientID, email, data, lawyerData.rates);
      const balance = balanceInfo.totalPaid - balanceInfo.totalUsed;
      const topUp = Math.max(0, targetBalance - balance);
      
      if (topUp > 0) {
        const paymentLink = `${getSetting(SETTINGS_KEYS.BASE_PAYMENT_URL)}?amount=${Math.round(topUp * 100)}`;
        lowBalanceClients.push({
          clientID,
          email,
          name: clientName,
          balance: balance.toFixed(2),
          targetBalance: targetBalance.toFixed(2),
          topUp: topUp.toFixed(2),
          paymentLink,
          lastActivity: balanceInfo.lastActivityDate ? balanceInfo.lastActivityDate.toISOString().split('T')[0] : 'Unknown'
        });
      }
    }
    
    // Generate action buttons for each low balance client
    const actionButtons = lowBalanceClients.map(client => {
      const sendUrl = generateSendEmailUrl(client.clientID, 'low_balance');
      return `
        <div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
          <strong>${client.name}</strong> (${client.email})<br>
          Balance: $${client.balance} | Target: $${client.targetBalance} | Top-up needed: $${client.topUp}<br>
          <a href="${sendUrl}" style="background: #4285f4; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 5px;">Send Low Balance Email</a>
        </div>
      `;
    }).join('');
    
    // Generate "Send All" button if there are low balance clients
    const sendAllButton = lowBalanceClients.length > 0 ? `
      <div style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px;">
        <strong>Send All Low Balance Emails:</strong><br>
        <a href="${generateSendAllEmailsUrl(lowBalanceClients.map(c => c.clientID))}" style="background: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 5px;">Send All (${lowBalanceClients.length} emails)</a>
      </div>
    ` : '';
    
    // Create digest content
    const subject = `📊 Daily Balance Digest - ${today} (${lowBalanceClients.length} low balance clients)`;
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4285f4;">📊 Daily Balance Digest</h2>
        <p><strong>Date:</strong> ${today}</p>
        <p><strong>Low Balance Clients:</strong> ${lowBalanceClients.length}</p>
        
        ${lowBalanceClients.length > 0 ? `
          <h3 style="color: #dc3545;">⚠️ Clients Needing Top-up</h3>
          ${actionButtons}
          ${sendAllButton}
        ` : `
          <h3 style="color: #28a745;">✅ All Clients Have Sufficient Balance</h3>
        `}
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          💡 Click the action buttons above to send low balance emails to clients.<br>
          Service resumed emails are still sent automatically when balances become positive.
        </p>
      </div>
    `;
    
    // Send digest to firm
    sendEmail(firmEmail, subject, body, { isHtml: true });
    log(`✅ Daily balance digest sent to ${firmEmail} with ${lowBalanceClients.length} low balance clients`);
    
  } catch (error) {
    logError('sendDailyBalanceDigest', error);
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
    
    // Send to client using template
    const clientSubject = renderTemplate('SERVICE_RESUMED', 'CLIENT_SUBJECT');
    const clientBody = renderTemplate('SERVICE_RESUMED', 'CLIENT_BODY', clientName);
    
    log(`📧 Sending service resumed notification to client: ${email}`);
    sendEmail(email, clientSubject, clientBody, { isHtml: true, emailType: 'service_resumed_client' });
    
    // Send to firm using template
    const ownerSubject = renderTemplate('SERVICE_RESUMED', 'OWNER_SUBJECT', clientName);
    const ownerBody = renderTemplate('SERVICE_RESUMED', 'OWNER_BODY', clientName);
    
    log(`📧 Sending service resumed notification to firm`);
    sendEmailToFirm(ownerSubject, ownerBody, { isHtml: true, emailType: 'service_resumed_firm' });
    
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

/**
 * Generate URL for sending individual low balance email
 */
function generateSendEmailUrl(clientID, emailType) {
  const scriptId = ScriptApp.getScriptId();
  const webAppUrl = `https://script.google.com/macros/s/${scriptId}/exec`;
  return `${webAppUrl}?action=send_email&client_id=${encodeURIComponent(clientID)}&email_type=${emailType}`;
}

/**
 * Generate URL for sending all low balance emails
 */
function generateSendAllEmailsUrl(clientIDs) {
  const scriptId = ScriptApp.getScriptId();
  const webAppUrl = `https://script.google.com/macros/s/${scriptId}/exec`;
  return `${webAppUrl}?action=send_all&client_ids=${encodeURIComponent(clientIDs.join(','))}`;
}

/**
 * Web app function to handle email sending from action buttons
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const clientID = e.parameter.client_id;
    const emailType = e.parameter.email_type;
    const clientIDs = e.parameter.client_ids;
    
    if (action === 'send_email' && clientID && emailType === 'low_balance') {
      return sendLowBalanceEmailManual(clientID);
    } else if (action === 'send_all' && clientIDs) {
      return sendAllLowBalanceEmailsManual(clientIDs.split(','));
    } else {
      return HtmlService.createHtmlOutput('Invalid request');
    }
  } catch (error) {
    logError('doGet', error);
    return HtmlService.createHtmlOutput(`Error: ${error.message}`);
  }
}

/**
 * Send low balance email manually (called from web app)
 */
function sendLowBalanceEmailManual(clientID) {
  logStart('sendLowBalanceEmailManual');
  
  try {
    // Get client data
    const sheets = getSheets();
    const data = loadSheetData(sheets);
    const lawyerData = buildLawyerMaps(data.lawyers);
    const clientsById = buildClientMap(data.clientData);
    
    const client = clientsById[clientID];
    if (!client) {
      throw new Error('Client not found');
    }
    
    const email = client[0];
    const clientName = client[1] || "Client";
    const targetBalance = parseFloat(client[2]) || getSetting('Low Balance Threshold', 500);
    
    const balanceInfo = calculateClientBalance(clientID, email, data, lawyerData.rates);
    const balance = balanceInfo.totalPaid - balanceInfo.totalUsed;
    const topUp = Math.max(0, targetBalance - balance);
    const paymentLink = `${getSetting(SETTINGS_KEYS.BASE_PAYMENT_URL)}?amount=${Math.round(topUp * 100)}`;
    
    // Check if email already sent today
    const props = PropertiesService.getScriptProperties();
    const today = new Date().toISOString().split('T')[0];
    const emailKey = `low_balance_${clientID}_${today}`;
    
    if (props.getProperty(emailKey)) {
      return HtmlService.createHtmlOutput(`
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Already Sent</h2>
          <p>Low balance email for ${clientName} was already sent today.</p>
          <a href="javascript:window.close()">Close</a>
        </div>
      `);
    }
    
    // Send email
    const subject = renderTemplate('LOW_BALANCE', 'CLIENT_SUBJECT', clientName);
    const body = renderTemplate('LOW_BALANCE', 'CLIENT_BODY', clientName, balance, targetBalance, paymentLink);
    
    sendEmail(email, subject, body, { isHtml: true });
    
    // Mark as sent
    props.setProperty(emailKey, "1");
    
    log(`✅ Low balance email sent manually to ${clientName} (${email})`);
    
    return HtmlService.createHtmlOutput(`
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Email Sent Successfully</h2>
        <p>Low balance email has been sent to ${clientName} (${email}).</p>
        <a href="javascript:window.close()">Close</a>
      </div>
    `);
    
  } catch (error) {
    logError('sendLowBalanceEmailManual', error);
    return HtmlService.createHtmlOutput(`
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Error</h2>
        <p>Failed to send email: ${error.message}</p>
        <a href="javascript:window.close()">Close</a>
      </div>
    `);
  }
  
  logEnd('sendLowBalanceEmailManual');
}

/**
 * Send all low balance emails manually (called from web app)
 */
function sendAllLowBalanceEmailsManual(clientIDs) {
  logStart('sendAllLowBalanceEmailsManual');
  
  try {
    let sentCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const clientID of clientIDs) {
      try {
        // Get client data
        const sheets = getSheets();
        const data = loadSheetData(sheets);
        const lawyerData = buildLawyerMaps(data.lawyers);
        const clientsById = buildClientMap(data.clientData);
        
        const client = clientsById[clientID];
        if (!client) {
          errors.push(`Client ${clientID} not found`);
          errorCount++;
          continue;
        }
        
        const email = client[0];
        const clientName = client[1] || "Client";
        const targetBalance = parseFloat(client[2]) || getSetting('Low Balance Threshold', 500);
        
        const balanceInfo = calculateClientBalance(clientID, email, data, lawyerData.rates);
        const balance = balanceInfo.totalPaid - balanceInfo.totalUsed;
        const topUp = Math.max(0, targetBalance - balance);
        const paymentLink = `${getSetting(SETTINGS_KEYS.BASE_PAYMENT_URL)}?amount=${Math.round(topUp * 100)}`;
        
        // Check if email already sent today
        const props = PropertiesService.getScriptProperties();
        const today = new Date().toISOString().split('T')[0];
        const emailKey = `low_balance_${clientID}_${today}`;
        
        if (props.getProperty(emailKey)) {
          continue; // Skip if already sent
        }
        
        // Send email
        const subject = renderTemplate('LOW_BALANCE', 'CLIENT_SUBJECT', clientName);
        const body = renderTemplate('LOW_BALANCE', 'CLIENT_BODY', clientName, balance, targetBalance, paymentLink);
        
        sendEmail(email, subject, body, { isHtml: true });
        
        // Mark as sent
        props.setProperty(emailKey, "1");
        
        sentCount++;
        log(`✅ Low balance email sent to ${clientName} (${email})`);
        
      } catch (error) {
        errorCount++;
        errors.push(`${clientID}: ${error.message}`);
        logError(`sendAllLowBalanceEmailsManual for ${clientID}`, error);
      }
    }
    
    log(`✅ Sent ${sentCount} low balance emails, ${errorCount} errors`);
    
    const errorList = errors.length > 0 ? `<h3>Errors:</h3><ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>` : '';
    
    return HtmlService.createHtmlOutput(`
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Bulk Email Results</h2>
        <p><strong>Successfully sent:</strong> ${sentCount} emails</p>
        <p><strong>Errors:</strong> ${errorCount}</p>
        ${errorList}
        <a href="javascript:window.close()">Close</a>
      </div>
    `);
    
  } catch (error) {
    logError('sendAllLowBalanceEmailsManual', error);
    return HtmlService.createHtmlOutput(`
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Error</h2>
        <p>Failed to send bulk emails: ${error.message}</p>
        <a href="javascript:window.close()">Close</a>
      </div>
    `);
  }
  
  logEnd('sendAllLowBalanceEmailsManual');
}