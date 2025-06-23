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
  }
  logEnd('sendLowBalanceEmail');
  return true;
}

/**
 * Sends a daily balance digest email to the firm summarizing low balance clients
 */
function sendDailyBalanceDigest() {
  logStart('sendDailyBalanceDigest');
  try {
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
    
    // Only send if there are low balances or in test mode
    if (lowBalanceClients.length === 0 && !isTestMode()) {
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
    log('✅ Daily balance digest email sent to firm');
  } catch (error) {
    logError('sendDailyBalanceDigest', error);
    throw error;
  }
  logEnd('sendDailyBalanceDigest');
}