// ========== EMAIL FUNCTIONS ==========

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
 * Log email to EmailLog sheet for tracking
 * @param {string} recipient - Email recipient
 * @param {string} subject - Email subject
 * @param {string} type - Email type (e.g., 'digest', 'low_balance')
 */
function logEmail(recipient, subject, type = 'general') {
  try {
    const sheet = getOrCreateSheet("EmailLog");
    
    // Add headers if sheet is empty
    const data = sheet.getDataRange().getValues();
    if (data.length === 0) {
      sheet.getRange(1, 1, 1, 4).setValues([["Timestamp", "Recipient", "Subject", "Type"]]);
      sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#f3f3f3");
    }
    
    // Append email log entry
    sheet.appendRow([new Date(), recipient, subject, type]);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 4);
  } catch (error) {
    logError('logEmail', error);
  }
}

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
  
  // Enhanced logging for test mode
  if (isTest) {
    log(`🧪 TEST MODE: Redirecting email from ${recipient} → ${finalRecipient}`);
    log(`📧 Sending [TEST] email to: ${finalRecipient} | Subject: ${finalSubject}`);
  } else {
    log(`📧 Sending email to: ${finalRecipient} | Subject: ${finalSubject}`);
  }
  
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
    
    // Log the email
    const emailType = options.emailType || 'general';
    logEmail(finalRecipient, finalSubject, emailType);
    
    if (isTest) {
      log(`✅ [TEST] Email sent successfully to ${finalRecipient} (originally intended for ${recipient})`);
    } else {
      log(`✅ Email sent successfully to ${finalRecipient}`);
    }
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
  log(`   - Test mode: ${isTestMode() ? 'YES' : 'NO'}`);
  log(`   - Firm email: ${getFirmEmail()}`);
  
  // Check if email already sent today (skip this check in test mode)
  if (!isTestMode() && props.getProperty(emailKey)) {
    log(`📧 Low balance email already sent today for ${clientName}`);
    logEnd('sendLowBalanceEmail');
    return false;
  }
  
  // Log test mode behavior
  if (isTestMode()) {
    log(`🧪 Test mode active — allowing low balance email resend for ${clientName}`);
    log(`🧪 Email key: ${emailKey}`);
    log(`🧪 Current flag value: ${props.getProperty(emailKey) || 'not set'}`);
  }
  
  // Send to client using template
  const clientSubject = renderTemplate('LOW_BALANCE', 'CLIENT_SUBJECT', clientName);
  const clientBody = renderTemplate('LOW_BALANCE', 'CLIENT_BODY', clientName, balance, targetBalance, paymentLink);
  
  log(`📧 Sending low balance email to client: ${email}`);
  sendEmail(email, clientSubject, clientBody, { isHtml: true, emailType: 'low_balance_client' });
  
  // Send to firm using template (always send in test mode, optional in production)
  const lastActivity = lawyerEmails[lastLawyerID] || 'Unknown';
  const ownerSubject = renderTemplate('LOW_BALANCE', 'OWNER_SUBJECT', clientName);
  const ownerBody = renderTemplate('LOW_BALANCE', 'OWNER_BODY', clientName, balance, targetBalance, lastActivity);
  
  log(`📧 Sending low balance notification to firm`);
  sendEmailToFirm(ownerSubject, ownerBody, { isHtml: true, emailType: 'low_balance_firm' });
  
  // Mark as sent (only in production mode)
  if (!isTestMode()) {
    props.setProperty(emailKey, "1");
    log(`📧 Marked low balance email as sent for ${clientName}`);
  } else {
    log(`🧪 Test mode: Not setting email flag for ${clientName}`);
  }
  
  log(`✅ Low balance email process completed for ${clientName}`);
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
    
    // Calculate payment summary for today
    const today = new Date();
    const todayStr = today.toDateString();
    const props = PropertiesService.getScriptProperties();
    
    const paymentsToday = data.paymentData
      .filter(p => {
        if (!p || !Array.isArray(p) || p.length < 3) return false;
        const paymentDate = parseZapierTimestamp(p[0]);
        return paymentDate && paymentDate.toDateString() === todayStr;
      });
    
    const paymentSummary = {
      total: paymentsToday.reduce((sum, p) => sum + (parseFloat(p[2]) || 0), 0),
      count: new Set(paymentsToday.map(p => p[1])).size
    };
    
    log(`💰 Today's payments: $${paymentSummary.total.toFixed(2)} from ${paymentSummary.count} clients`);
    
    // Get low balance clients with email sent tracking
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
        // Check if low balance email was sent today
        const emailKey = `low_balance_${clientID}_${todayStr}`;
        const emailSent = !isTestMode() && props.getProperty(emailKey) === "1";
        
        lowBalanceClients.push({
          name: clientName,
          email: email,
          balance: balance,
          targetBalance: targetBalance,
          topUp: topUp,
          lastActivity: lawyerData.emails[balanceInfo.lastLawyerID] || 'Unknown',
          emailSent: emailSent
        });
        log(`⚠️ Low balance detected for ${clientName}: $${balance.toFixed(2)} (needs $${topUp.toFixed(2)}, email sent: ${emailSent})`);
      }
    }
    
    // Sort by top-up amount (highest first)
    lowBalanceClients.sort((a, b) => b.topUp - a.topUp);
    
    log(`📧 Sending digest for ${lowBalanceClients.length} low balance clients...`);
    
    // Send digest using template with both parameters
    const subject = renderTemplate('DAILY_DIGEST', 'SUBJECT');
    const body = renderTemplate('DAILY_DIGEST', 'BODY', lowBalanceClients, paymentSummary);
    
    sendEmailToFirm(subject, body, { isHtml: true, emailType: 'daily_digest' });
    
    log(`✅ Daily balance digest sent with ${lowBalanceClients.length} clients and payment summary`);
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
  
  // Check if notification already sent today (skip this check in test mode)
  if (!isTestMode() && props.getProperty(emailKey)) {
    log(`📧 Service resumed notification already sent today for ${clientName}`);
    logEnd('notifyServiceResumed');
    return;
  }
  
  // Log test mode behavior
  if (isTestMode()) {
    log(`🧪 Test mode active — allowing service resumed email resend for ${clientName}`);
    log(`🧪 Email key: ${emailKey}`);
    log(`🧪 Current flag value: ${props.getProperty(emailKey) || 'not set'}`);
  }
  
  // Send to client using template
  const clientSubject = renderTemplate('SERVICE_RESUMED', 'CLIENT_SUBJECT', clientName);
  const clientBody = renderTemplate('SERVICE_RESUMED', 'CLIENT_BODY', clientName);
  
  sendEmail(email, clientSubject, clientBody, { isHtml: true, emailType: 'service_resumed_client' });
  
  // Send to firm using template
  const ownerSubject = renderTemplate('SERVICE_RESUMED', 'OWNER_SUBJECT', clientName);
  const ownerBody = renderTemplate('SERVICE_RESUMED', 'OWNER_BODY', clientName);
  
  sendEmailToFirm(ownerSubject, ownerBody, { isHtml: true, emailType: 'service_resumed_firm' });
  
  // Mark as sent (only in production mode)
  if (!isTestMode()) {
    props.setProperty(emailKey, "1");
    log(`📧 Marked service resumed email as sent for ${clientName}`);
  } else {
    log(`🧪 Test mode: Not setting email flag for ${clientName}`);
  }
  
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
          <li><strong>Check Your Email:</strong> You'll receive test notifications</li>
          <li>Low balance warnings for sample clients</li>
          <li>Daily digest emails</li>
          <li>Service resumed notifications</li>
        </ol>
        
        <h3>📧 What You'll Receive</h3>
        <ul>
          <li>Low balance warnings (when applicable)</li>
          <li>Daily balance digest (if low balances detected)</li>
          <li>Service resumed notifications</li>
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
    
    sendEmail(firmEmail, subject, body, { isHtml: true, emailType: 'welcome' });
    
    log(`✅ Welcome email sent to ${firmEmail}`);
  } catch (error) {
    logError('sendWelcomeEmail', error);
    throw error;
  }
  
  logEnd('sendWelcomeEmail');
}