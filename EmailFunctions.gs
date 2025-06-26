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
    
    // Always use plain text for better reliability
    emailOptions.body = body;
    
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
        'BODY': (lowBalanceClients, paymentSummary, newClientsCount, todayRevenue, mattersNeedingTime, enhancedAnalytics, unassignedMatters) => {
          let body = 'Your Daily Blawby Summary\n\n';
          body += 'Here\'s a snapshot of client retainer activity and balances today.\n\n';
          
          body += 'TODAY\'S ACTIVITY:\n';
          body += `- New Clients: ${newClientsCount || 0}\n`;
          body += `- Revenue: $${parseFloat(todayRevenue || 0).toFixed(2)}\n`;
          
          if (paymentSummary) {
            body += `- Total Payments Received: $${parseFloat(paymentSummary.total || 0).toFixed(2)}\n`;
            body += `- Clients Paid Today: ${paymentSummary.count}\n\n`;
          }
          
          if (lowBalanceClients.length === 0) {
            body += 'All client balances are in good standing. Great work!\n';
          } else {
            body += `CLIENTS NEEDING ATTENTION (${lowBalanceClients.length})\n\n`;
            lowBalanceClients.forEach(client => {
              const balance = parseFloat(client.balance || 0);
              const targetBalance = parseFloat(client.targetBalance || 0);
              const topUpNeeded = Math.max(0, targetBalance - balance);
              
              body += `${client.name} (${client.email})\n`;
              body += `  Balance: $${balance.toFixed(2)}\n`;
              body += `  Target: $${targetBalance.toFixed(2)}\n`;
              body += `  Top-up Needed: $${topUpNeeded.toFixed(2)}\n`;
              body += `  Last Activity: ${client.lastActivity || 'N/A'}\n`;
              body += `  Email Sent: ${client.emailSent ? 'Yes' : 'No'}\n`;
              body += `  Send Top-up Reminder: ${generateSendEmailUrl(client.clientID, 'low_balance')}\n`;
              if (balance <= 0) {
                body += `  Status: Services Paused\n`;
              } else {
                body += `  Status: Low Balance\n`;
              }
              body += '\n';
            });
            body += 'Action recommended: Follow up with clients who haven\'t responded or whose services are paused.\n';
          }
          
          if (mattersNeedingTime && mattersNeedingTime.length > 0) {
            body += '\nMATTERS NEEDING TIME ENTRIES:\n';
            mattersNeedingTime.forEach(matter => {
              body += `${matter.matterDescription} (${matter.clientName})\n`;
              body += `  Client: ${matter.clientName} (${matter.clientEmail})\n`;
              body += `  Matter ID: ${matter.matterID}\n`;
              body += `  Matter Date: ${matter.matterDate}\n`;
              body += `  Reason: ${matter.reason}\n`;
              body += `  Last Payment Date: ${matter.lastPaymentDate}\n`;
              body += `  Days Since Last Time Entry: ${matter.daysSinceLastTimeEntry}\n`;
              body += `  Lawyer: ${matter.lawyerName} (${matter.lawyerEmail})\n`;
              body += `  Add Time Entry: ${generateAddTimeEntryUrl(matter.matterID, matter.lawyerID)}\n`;
              body += '\n';
            });
            body += 'Action recommended: Follow up with matters needing time entries.\n';
          }
          
          body += '\nThis summary was generated automatically by Blawby.';
          return body;
        }
      },
      'SERVICE_RESUMED': {
        'CLIENT_SUBJECT': 'Great news! Your services are back up and running',
        'CLIENT_BODY': (clientName) => `Welcome back, ${clientName}!\n\nGreat news—your retainer has been topped up and your legal services are now fully active again!\n\nAll systems are go! We're ready to continue working on your matters.\n\nThanks for keeping your retainer current. This helps us provide you with the best possible service without any interruptions.\n\nIf you need anything or have questions about your case, don't hesitate to reach out. We're here to help!\n\nBest regards,\nYour Legal Team`,
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
function sendDailyDigest() {
  logStart('sendDailyDigest');
  
  try {
    const sheets = getSheets();
    const data = loadSheetData(sheets);
    const lawyerData = buildLawyerMaps(data.lawyers);
    const today = new Date().toISOString().split('T')[0];
    
    // Get basic summary data
    const paymentSummary = getPaymentSummary(data, today);
    const newClientsCount = getNewClientsCount(data, today);
    const todayRevenue = getTodayRevenue(data, today);
    const lowBalanceClients = getLowBalanceClients(data, lawyerData);
    const mattersNeedingTime = identifyMattersNeedingTimeEntries(data, lawyerData, today);
    
    // Get enhanced analytics
    const enhancedAnalytics = getEnhancedAnalytics(data, lawyerData, today);
    
    // Get unassigned matters
    const unassignedMatters = getUnassignedMatters(data, lawyerData);
    
    const subject = `Daily Balance Digest - ${today} (${lowBalanceClients.length} low balance clients, ${mattersNeedingTime.length} matters need time, ${unassignedMatters.length} unassigned matters)`;
    const body = renderTemplate('DAILY_DIGEST_HTML', 'BODY', lowBalanceClients, paymentSummary, newClientsCount, todayRevenue, mattersNeedingTime, enhancedAnalytics, unassignedMatters);
    
    // Send to spreadsheet owner
    const ownerEmail = getActiveSpreadsheet().getOwner().getEmail();
    
    MailApp.sendEmail({
      to: ownerEmail,
      subject: subject,
      htmlBody: body
    });
    
    log(`✅ Daily digest sent to ${ownerEmail}`);
    log(`📊 Summary: ${lowBalanceClients.length} low balance clients, ${mattersNeedingTime.length} matters need time`);
    
  } catch (error) {
    logError('sendDailyDigest', error);
    throw error;
  }
  
  logEnd('sendDailyDigest');
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
    sendEmail(email, clientSubject, clientBody, { emailType: 'service_resumed_client' });
    
    // Send to firm using template
    const ownerSubject = renderTemplate('SERVICE_RESUMED', 'OWNER_SUBJECT', clientName);
    const ownerBody = renderTemplate('SERVICE_RESUMED', 'OWNER_BODY', clientName);
    
    log(`📧 Sending service resumed notification to firm`);
    sendEmailToFirm(ownerSubject, ownerBody, { emailType: 'service_resumed_firm' });
    
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
  const scriptId = 'AKfycbyRlOh_7iVEsJXG5y4ZNrJ32l-vVCH82F2km_WLrv3C0M4fRVPGw7H5bNszqCTpQf34';
  const webAppUrl = `https://script.google.com/macros/s/${scriptId}/exec`;
  return `${webAppUrl}?action=send_email&client_id=${encodeURIComponent(clientID)}&email_type=${emailType}`;
}

/**
 * Generate URL for sending all low balance emails
 */
function generateSendAllEmailsUrl(clientIDs) {
  const scriptId = 'AKfycbyRlOh_7iVEsJXG5y4ZNrJ32l-vVCH82F2km_WLrv3C0M4fRVPGw7H5bNszqCTpQf34';
  const webAppUrl = `https://script.google.com/macros/s/${scriptId}/exec`;
  return `${webAppUrl}?action=send_all&client_ids=${encodeURIComponent(clientIDs.join(','))}`;
}

/**
 * Generate URL for adding time entry
 */
function generateAddTimeEntryUrl(matterID, lawyerID) {
  const scriptId = 'AKfycbyRlOh_7iVEsJXG5y4ZNrJ32l-vVCH82F2km_WLrv3C0M4fRVPGw7H5bNszqCTpQf34';
  const webAppUrl = `https://script.google.com/macros/s/${scriptId}/exec`;
  return `${webAppUrl}?action=add_time_entry&matter_id=${encodeURIComponent(matterID)}&lawyer_id=${encodeURIComponent(lawyerID)}`;
}

/**
 * Generate URL for nudging lawyer about time entry
 */
function generateNudgeLawyerUrl(matterID, lawyerID) {
  const scriptId = 'AKfycbyRlOh_7iVEsJXG5y4ZNrJ32l-vVCH82F2km_WLrv3C0M4fRVPGw7H5bNszqCTpQf34';
  const webAppUrl = `https://script.google.com/macros/s/${scriptId}/exec`;
  return `${webAppUrl}?action=nudge_lawyer&matter_id=${encodeURIComponent(matterID)}&lawyer_id=${encodeURIComponent(lawyerID)}`;
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
    const matterID = e.parameter.matter_id;
    const lawyerID = e.parameter.lawyer_id;
    const hours = e.parameter.hours;
    const description = e.parameter.description;
    
    if (action === 'send_email' && clientID && emailType === 'low_balance') {
      return sendLowBalanceEmailManual(clientID);
    } else if (action === 'send_all' && clientIDs) {
      return sendAllLowBalanceEmailsManual(clientIDs.split(','));
    } else if (action === 'add_time_entry' && matterID && lawyerID) {
      return addTimeEntryForm(matterID, lawyerID);
    } else if (action === 'submit_time_entry' && matterID && lawyerID && hours && description) {
      return submitTimeEntry(matterID, lawyerID, hours, description);
    } else if (action === 'nudge_lawyer' && matterID && lawyerID) {
      return nudgeLawyerForTimeEntry(matterID, lawyerID);
    } else if (action === 'assign_matter' && matterID) {
      return assignMatterForm(matterID, e.parameter.practice_area);
    } else if (action === 'submit_assignment' && matterID && e.parameter.lawyer_id) {
      return submitAssignment(matterID, e.parameter.lawyer_id, e.parameter.notes, e);
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
    
    // Send email
    const subject = renderTemplate('LOW_BALANCE', 'CLIENT_SUBJECT', clientName);
    const body = renderTemplate('LOW_BALANCE', 'CLIENT_BODY', clientName, balance, targetBalance, paymentLink);
    
    sendEmail(email, subject, body);
    
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
        
        // Send email
        const subject = renderTemplate('LOW_BALANCE', 'CLIENT_SUBJECT', clientName);
        const body = renderTemplate('LOW_BALANCE', 'CLIENT_BODY', clientName, balance, targetBalance, paymentLink);
        
        sendEmail(email, subject, body);
        
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

/**
 * Submit time entry (called from web app form)
 */
function submitTimeEntry(matterID, lawyerID, hours, description) {
  logStart('submitTimeEntry');
  
  try {
    // Get matter and lawyer info
    const sheets = getSheets();
    const data = loadSheetData(sheets);
    const lawyerData = buildLawyerMaps(data.lawyers);
    
    const matter = data.matters.find(m => m && Array.isArray(m) && m[0] === matterID);
    const lawyerName = lawyerData.names[lawyerID] || 'Unknown Lawyer';
    const matterDescription = matter ? matter[3] : 'Unknown Matter';
    const clientEmail = matter ? matter[1] : '';
    
    // Validate inputs
    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      throw new Error('Invalid hours value');
    }
    
    if (!description || description.trim() === '') {
      throw new Error('Description is required');
    }
    
    // Add time entry to TimeLogs sheet
    const timeLogsSheet = sheets.timeLogsSheet;
    const today = new Date().toISOString().split('T')[0];
    const newTimeEntry = [
      today,           // Date
      clientEmail,     // Client Email
      matterID,        // Matter ID
      lawyerID,        // Lawyer ID
      hoursNum         // Hours
    ];
    
    timeLogsSheet.appendRow(newTimeEntry);
    
    log(`✅ Time entry added: ${hoursNum} hours for matter ${matterID} by ${lawyerName}`);
    
    return HtmlService.createHtmlOutput(`
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Time Entry Added Successfully</h2>
        <p><strong>Matter:</strong> ${matterDescription}</p>
        <p><strong>Lawyer:</strong> ${lawyerName}</p>
        <p><strong>Hours:</strong> ${hoursNum}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p><strong>Date:</strong> ${today}</p>
        <br>
        <p>✅ Time entry has been added to the TimeLogs sheet.</p>
        <a href="javascript:window.close()">Close</a>
      </div>
    `);
    
  } catch (error) {
    logError('submitTimeEntry', error);
    return HtmlService.createHtmlOutput(`
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Error</h2>
        <p>Failed to add time entry: ${error.message}</p>
        <a href="javascript:window.close()">Close</a>
      </div>
    `);
  }
  
  logEnd('submitTimeEntry');
}

/**
 * Generate time entry form
 */
function addTimeEntryForm(matterID, lawyerID) {
  const sheets = getSheets();
  const data = loadSheetData(sheets);
  const lawyerData = buildLawyerMaps(data.lawyers);
  
  const matter = data.matters.find(m => m && Array.isArray(m) && m[0] === matterID);
  const lawyerName = lawyerData.names[lawyerID] || 'Unknown Lawyer';
  const lawyerEmail = lawyerData.emails[lawyerID] || 'No email found';
  const matterDescription = matter ? matter[3] : 'Unknown Matter';
  const clientEmail = matter ? matter[1] : '';
  const practiceArea = matter && matter[7] ? matter[7] : 'General';
  
  // Find client name from client data
  const client = data.clientData.find(c => c && Array.isArray(c) && c[0] === clientEmail);
  const clientName = client && client[1] ? client[1] : 'Client name not set';
  
  // Get suggested lawyers based on practice area
  const suggestedLawyers = suggestLawyersByPracticeArea(practiceArea, lawyerData);
  
  const scriptId = 'AKfycbww5kqg5J44np0mIuGk0aFC5Bg8nhCb9YeDpFUyBuJ87hIWz6YCQatp-eVHECY8hDQ';
  const webAppUrl = `https://script.google.com/macros/s/${scriptId}/exec`;
  
  // Build suggested lawyers HTML
  let suggestedLawyersHtml = '';
  if (suggestedLawyers.length > 0) {
    suggestedLawyersHtml = `
      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #333;">💡 Suggested Lawyers for ${practiceArea}</h3>
        ${suggestedLawyers.map(lawyer => `
          <div style="margin-bottom: 10px; padding: 8px; background-color: white; border-radius: 3px;">
            <strong>${lawyer.name}</strong> (${lawyer.id}) - $${lawyer.rate}/hour<br>
            <small style="color: #666;">${lawyer.email} | ${lawyer.practiceAreas}</small>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  return HtmlService.createHtmlOutput(`
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2>Add Time Entry</h2>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #333;">Matter Information</h3>
        <p><strong>Matter ID:</strong> ${matterID}</p>
        <p><strong>Matter Description:</strong> ${matterDescription}</p>
        <p><strong>Practice Area:</strong> ${practiceArea}</p>
        <p><strong>Status:</strong> ${matter ? matter[5] : 'Unknown'}</p>
      </div>
      
      <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #333;">Client Information</h3>
        <p><strong>Client Name:</strong> ${clientName}</p>
        <p><strong>Client Email:</strong> ${clientEmail}</p>
      </div>
      
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #333;">Assigned Lawyer</h3>
        <p><strong>Lawyer Name:</strong> ${lawyerName}</p>
        <p><strong>Lawyer ID:</strong> ${lawyerID}</p>
        <p><strong>Lawyer Email:</strong> ${lawyerEmail}</p>
        <p><strong>Hourly Rate:</strong> $${lawyerData.rates[lawyerID] || 'Not set'}/hour</p>
        <p><strong>Practice Areas:</strong> ${lawyerData.practiceAreas[lawyerID] || 'Not specified'}</p>
      </div>
      
      ${suggestedLawyersHtml}
      
      <form id="timeEntryForm">
        <input type="hidden" name="action" value="submit_time_entry">
        <input type="hidden" name="matter_id" value="${matterID}">
        <input type="hidden" name="lawyer_id" value="${lawyerID}">
        
        <div style="margin-bottom: 15px;">
          <label for="hours" style="display: block; margin-bottom: 5px;"><strong>Hours (6-minute increments):</strong></label>
          <select id="hours" name="hours" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            <option value="">Select hours...</option>
            <option value="0.1">0.1 (6 minutes)</option>
            <option value="0.2">0.2 (12 minutes)</option>
            <option value="0.3">0.3 (18 minutes)</option>
            <option value="0.4">0.4 (24 minutes)</option>
            <option value="0.5">0.5 (30 minutes)</option>
            <option value="0.6">0.6 (36 minutes)</option>
            <option value="0.7">0.7 (42 minutes)</option>
            <option value="0.8">0.8 (48 minutes)</option>
            <option value="0.9">0.9 (54 minutes)</option>
            <option value="1.0">1.0 (1 hour)</option>
            <option value="1.1">1.1 (1 hour 6 minutes)</option>
            <option value="1.2">1.2 (1 hour 12 minutes)</option>
            <option value="1.5">1.5 (1 hour 30 minutes)</option>
            <option value="2.0">2.0 (2 hours)</option>
            <option value="2.5">2.5 (2 hours 30 minutes)</option>
            <option value="3.0">3.0 (3 hours)</option>
            <option value="4.0">4.0 (4 hours)</option>
            <option value="5.0">5.0 (5 hours)</option>
            <option value="6.0">6.0 (6 hours)</option>
            <option value="7.0">7.0 (7 hours)</option>
            <option value="8.0">8.0 (8 hours)</option>
          </select>
          <small style="color: #666;">Legal billing standard: 6-minute increments (0.1 hours)</small>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label for="description" style="display: block; margin-bottom: 5px;"><strong>Description:</strong></label>
          <textarea id="description" name="description" required 
                    style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; height: 100px;"
                    placeholder="Describe the work performed (e.g., 'Client consultation regarding contract review', 'Document preparation for filing', 'Research on case law')"></textarea>
          <small style="color: #666;">Be specific about the work performed for accurate billing</small>
        </div>
        
        <button type="submit" style="background-color: #4CAF50; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
          Add Time Entry
        </button>
        <button type="button" onclick="window.close()" style="background-color: #f44336; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px; font-size: 16px;">
          Cancel
        </button>
      </form>
      
      <div id="result" style="margin-top: 20px;"></div>
      
      <script>
        document.getElementById('timeEntryForm').addEventListener('submit', function(e) {
          e.preventDefault();
          
          const hours = document.getElementById('hours').value;
          const description = document.getElementById('description').value;
          const matterID = '${matterID}';
          const lawyerID = '${lawyerID}';
          
          if (!hours || !description) {
            document.getElementById('result').innerHTML = '<p style="color: red;">Please fill in all fields.</p>';
            return;
          }
          
          const params = new URLSearchParams({
            action: 'submit_time_entry',
            matter_id: matterID,
            lawyer_id: lawyerID,
            hours: hours,
            description: description
          });
          
          const url = '${webAppUrl}?' + params.toString();
          
          // Open in new window/tab to avoid iframe issues
          window.open(url, '_blank');
          
          // Show success message
          document.getElementById('result').innerHTML = '<p style="color: green;">✅ Time entry submitted! Check the new tab for confirmation.</p>';
          
          // Clear form
          document.getElementById('hours').value = '';
          document.getElementById('description').value = '';
        });
      </script>
    </div>
  `);
}

/**
 * Identify matters that likely need time entries
 * @param {Object} data - Sheet data
 * @param {Object} lawyerData - Lawyer information
 * @param {string} today - Today's date in YYYY-MM-DD format
 * @return {Array} - Array of matters needing time entries
 */
function identifyMattersNeedingTimeEntries(data, lawyerData, today) {
  try {
    const mattersNeedingTime = [];
    const todayDate = new Date(today);
    const oneWeekAgo = new Date(todayDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(todayDate.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    // Validate lawyer data
    if (!lawyerData || !lawyerData.rates || !lawyerData.names || !lawyerData.emails) {
      log('⚠️ Lawyer data is incomplete, skipping matter time entry detection');
      return mattersNeedingTime;
    }
    
    // Get all active matters
    const activeMatters = data.matters.slice(1).filter(matter => 
      matter && Array.isArray(matter) && 
      matter[5] === 'Active' // Status column
    );
    
    for (const matter of activeMatters) {
      const matterID = matter[0];
      const clientEmail = matter[1];
      const clientName = matter[2] || 'Unknown Client';
      const matterDescription = matter[3] || 'General Legal Matter';
      const matterDate = new Date(matter[4]);
      
      // Find client info
      const client = data.clientData.find(c => c && Array.isArray(c) && c[0] === clientEmail);
      if (!client) continue;
      
      // Check if client has recent payments (within last 2 weeks)
      const hasRecentPayments = data.paymentData.slice(1).some(payment => {
        if (!payment || !Array.isArray(payment) || payment[1] !== clientEmail) return false;
        const paymentDate = parseZapierTimestamp(payment[0]);
        return paymentDate && paymentDate >= twoWeeksAgo;
      });
      
      // Check if matter has recent time entries (within last week)
      const hasRecentTimeEntries = data.timeLogs.slice(1).some(log => {
        if (!log || !Array.isArray(log) || log[2] !== matterID) return false;
        const logDate = new Date(log[0]);
        return logDate >= oneWeekAgo;
      });
      
      // Check if matter is relatively new (created within last month)
      const isNewMatter = matterDate >= new Date(todayDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Determine if matter needs time entry based on indicators
      let needsTimeEntry = false;
      let reason = '';
      
      if (hasRecentPayments && !hasRecentTimeEntries) {
        needsTimeEntry = true;
        reason = 'Recent payment but no time entries';
      } else if (isNewMatter && !hasRecentTimeEntries) {
        needsTimeEntry = true;
        reason = 'New matter with no time entries';
      } else if (hasRecentPayments && isNewMatter) {
        needsTimeEntry = true;
        reason = 'New matter with recent payment';
      }
      
      if (needsTimeEntry) {
        // Find assigned lawyer (default to first lawyer if none assigned)
        const assignedLawyer = data.timeLogs.slice(1).find(log => 
          log && Array.isArray(log) && log[2] === matterID
        );
        const availableLawyers = Object.keys(lawyerData.rates);
        const lawyerID = assignedLawyer ? assignedLawyer[3] : (availableLawyers.length > 0 ? availableLawyers[0] : null);
        
        if (lawyerID && lawyerData.names[lawyerID]) {
          const lawyerName = lawyerData.names[lawyerID];
          const lawyerEmail = lawyerData.emails[lawyerID] || '';
          
          mattersNeedingTime.push({
            matterID,
            clientEmail,
            clientName,
            matterDescription,
            matterDate: matterDate.toISOString().split('T')[0],
            lawyerID,
            lawyerName,
            lawyerEmail,
            reason,
            lastPaymentDate: getLastPaymentDate(clientEmail, data),
            daysSinceLastTimeEntry: getDaysSinceLastTimeEntry(matterID, data, todayDate)
          });
        }
      }
    }
    
    return mattersNeedingTime;
  } catch (error) {
    logError('identifyMattersNeedingTimeEntries', error);
    return [];
  }
}

/**
 * Get the last payment date for a client
 * @param {string} clientEmail - Client email
 * @param {Object} data - Sheet data
 * @return {string|null} - Last payment date or null
 */
function getLastPaymentDate(clientEmail, data) {
  const clientPayments = data.paymentData.slice(1)
    .filter(payment => payment && Array.isArray(payment) && payment[1] === clientEmail)
    .map(payment => parseZapierTimestamp(payment[0]))
    .filter(date => date)
    .sort((a, b) => b - a);
  
  return clientPayments.length > 0 ? clientPayments[0].toISOString().split('T')[0] : null;
}

/**
 * Get days since last time entry for a matter
 * @param {string} matterID - Matter ID
 * @param {Object} data - Sheet data
 * @param {Date} todayDate - Today's date
 * @return {number} - Days since last time entry
 */
function getDaysSinceLastTimeEntry(matterID, data, todayDate) {
  const matterTimeEntries = data.timeLogs.slice(1)
    .filter(log => log && Array.isArray(log) && log[2] === matterID)
    .map(log => new Date(log[0]))
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => b - a);
  
  if (matterTimeEntries.length === 0) {
    return 999; // No time entries ever
  }
  
  const lastEntryDate = matterTimeEntries[0];
  const diffTime = todayDate.getTime() - lastEntryDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Suggest lawyers based on practice area
 */
function suggestLawyersByPracticeArea(practiceArea, lawyerData) {
  if (!practiceArea || !lawyerData || !lawyerData.practiceAreas) {
    return [];
  }
  
  const suggestedLawyers = [];
  const practiceAreaLower = practiceArea.toLowerCase();
  
  for (const [lawyerID, practiceAreasStr] of Object.entries(lawyerData.practiceAreas)) {
    if (!practiceAreasStr) continue;
    
    const lawyerPracticeAreas = practiceAreasStr.toLowerCase().split(',').map(pa => pa.trim());
    
    // Check if any of the lawyer's practice areas match the matter's practice area
    const hasMatchingPracticeArea = lawyerPracticeAreas.some(pa => 
      pa.includes(practiceAreaLower) || practiceAreaLower.includes(pa)
    );
    
    if (hasMatchingPracticeArea) {
      suggestedLawyers.push({
        id: lawyerID,
        name: lawyerData.names[lawyerID] || 'Unknown',
        email: lawyerData.emails[lawyerID] || '',
        rate: lawyerData.rates[lawyerID] || 0,
        practiceAreas: practiceAreasStr
      });
    }
  }
  
  // Sort by rate (highest first) and then by name
  return suggestedLawyers.sort((a, b) => {
    if (b.rate !== a.rate) return b.rate - a.rate;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Nudge lawyer for time entry (called from web app)
 */
function nudgeLawyerForTimeEntry(matterID, lawyerID) {
  logStart('nudgeLawyerForTimeEntry');
  
  try {
    // Get matter and lawyer info
    const sheets = getSheets();
    const data = loadSheetData(sheets);
    const lawyerData = buildLawyerMaps(data.lawyers);
    
    const matter = data.matters.find(m => m && Array.isArray(m) && m[0] === matterID);
    const lawyerName = lawyerData.names[lawyerID] || 'Unknown Lawyer';
    const lawyerEmail = lawyerData.emails[lawyerID] || '';
    const matterDescription = matter ? matter[3] : 'Unknown Matter';
    const clientEmail = matter ? matter[1] : '';
    const practiceArea = matter && matter[7] ? matter[7] : 'General';
    
    // Find client name from client data
    const client = data.clientData.find(c => c && Array.isArray(c) && c[0] === clientEmail);
    const clientName = client && client[1] ? client[1] : 'Client name not set';
    
    // Get spreadsheet owner email
    const ownerEmail = getActiveSpreadsheet().getOwner().getEmail();
    
    // Generate time entry link
    const timeEntryUrl = generateAddTimeEntryUrl(matterID, lawyerID);
    
    // Create email content
    const subject = `Time Entry Reminder: ${matterDescription} - ${clientName}`;
    
    const emailBody = `Hi ${lawyerName},

This is a friendly reminder to log your time for the following matter:

Matter: ${matterDescription} (${matterID})
Client: ${clientName} (${clientEmail})
Practice Area: ${practiceArea}

Please log your time entries using the link below:
${timeEntryUrl}

If you have any questions about this matter or need assistance, please don't hesitate to reach out.

Best regards,
${ownerEmail.split('@')[0]} (Firm Owner)`;

    // Send email to lawyer and CC owner
    const emailOptions = {
      cc: ownerEmail,
      name: 'Blawby Time Entry Reminder'
    };
    
    MailApp.sendEmail(lawyerEmail, subject, emailBody, emailOptions);
    
    log(`✅ Nudge email sent to ${lawyerName} (${lawyerEmail}) for matter ${matterID}`);
    
    return HtmlService.createHtmlOutput(`
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>✅ Nudge Email Sent</h2>
        <p><strong>Lawyer:</strong> ${lawyerName} (${lawyerEmail})</p>
        <p><strong>Matter:</strong> ${matterDescription} (${matterID})</p>
        <p><strong>Client:</strong> ${clientName}</p>
        <p><strong>Practice Area:</strong> ${practiceArea}</p>
        <br>
        <p>✅ A reminder email has been sent to ${lawyerName} with the time entry link.</p>
        <p>The firm owner (${ownerEmail}) has been CC'd on the email.</p>
        <br>
        <a href="javascript:window.close()">Close</a>
      </div>
    `);
    
  } catch (error) {
    logError('nudgeLawyerForTimeEntry', error);
    return HtmlService.createHtmlOutput(`
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>❌ Error</h2>
        <p>Failed to send nudge email: ${error.message}</p>
        <a href="javascript:window.close()">Close</a>
      </div>
    `);
  }
  
  logEnd('nudgeLawyerForTimeEntry');
}

/**
 * Get enhanced analytics data for today's activity
 */
function getEnhancedAnalytics(data, lawyerData, today) {
  const todayDate = new Date(today);
  const yesterday = new Date(todayDate.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  return {
    timeTracking: getTimeTrackingInsights(data, lawyerData, today, yesterdayStr),
    matterMovement: getMatterMovement(data, today),
    clientInteractions: getClientInteractions(data, today),
    riskFlags: getRiskFlags(data, lawyerData, today)
  };
}

/**
 * Get time tracking insights
 */
function getTimeTrackingInsights(data, lawyerData, today, yesterday) {
  const todayTimeEntries = data.timeLogs.slice(1).filter(log => {
    if (!log || !Array.isArray(log) || log.length < 5) return false;
    const logDate = new Date(log[0]);
    return logDate.toISOString().split('T')[0] === today;
  });
  
  const yesterdayTimeEntries = data.timeLogs.slice(1).filter(log => {
    if (!log || !Array.isArray(log) || log.length < 5) return false;
    const logDate = new Date(log[0]);
    return logDate.toISOString().split('T')[0] === yesterday;
  });
  
  // Calculate total hours today
  const totalHoursToday = todayTimeEntries.reduce((sum, log) => {
    return sum + (parseFloat(log[4]) || 0);
  }, 0);
  
  // Get lawyers with time today
  const lawyersWithTimeToday = {};
  todayTimeEntries.forEach(log => {
    const lawyerID = log[3];
    const hours = parseFloat(log[4]) || 0;
    if (lawyerID) {
      lawyersWithTimeToday[lawyerID] = (lawyersWithTimeToday[lawyerID] || 0) + hours;
    }
  });
  
  // Get lawyers with no time today
  const allLawyerIDs = Object.keys(lawyerData.rates);
  const lawyersWithNoTime = allLawyerIDs.filter(lawyerID => 
    !lawyersWithTimeToday[lawyerID]
  );
  
  // Find matters active today with no time
  const mattersWithTimeToday = new Set(todayTimeEntries.map(log => log[2]).filter(Boolean));
  const activeMatters = data.matters.slice(1).filter(matter => 
    matter && Array.isArray(matter) && matter[5] === 'Active'
  );
  const mattersActiveTodayWithNoTime = activeMatters.filter(matter => 
    !mattersWithTimeToday.has(matter[0])
  );
  
  // Find time gaps (matters worked on yesterday, but no time today)
  const mattersWithTimeYesterday = new Set(yesterdayTimeEntries.map(log => log[2]).filter(Boolean));
  const timeGaps = Array.from(mattersWithTimeYesterday).filter(matterID => 
    !mattersWithTimeToday.has(matterID)
  );
  
  return {
    totalHoursToday,
    lawyersWithTimeToday,
    lawyersWithNoTime,
    mattersActiveTodayWithNoTime: mattersActiveTodayWithNoTime.length,
    timeGaps
  };
}

/**
 * Get matter movement data
 */
function getMatterMovement(data, today) {
  const todayDate = new Date(today);
  const todayStr = todayDate.toISOString().split('T')[0];
  
  // Find new matters opened today
  const newMatters = data.matters.slice(1).filter(matter => {
    if (!matter || !Array.isArray(matter) || !matter[4]) return false;
    const matterDate = new Date(matter[4]);
    return matterDate.toISOString().split('T')[0] === todayStr;
  });
  
  // Find matters with status changes (this would need to be tracked in a separate sheet)
  // For now, we'll return basic stats
  const activeMatters = data.matters.slice(1).filter(matter => 
    matter && Array.isArray(matter) && matter[5] === 'Active'
  );
  
  const completedMatters = data.matters.slice(1).filter(matter => 
    matter && Array.isArray(matter) && matter[5] === 'Completed'
  );
  
  return {
    newMatters,
    activeMatters: activeMatters.length,
    completedMatters: completedMatters.length
  };
}

/**
 * Get client interactions (placeholder for future Calendar API integration)
 */
function getClientInteractions(data, today) {
  // This would integrate with Calendar API and email tracking
  // For now, return placeholder data
  return {
    clientEmailsReceived: 0, // Would be populated from Gmail API
    callsScheduled: 0, // Would be populated from Calendar API
    meetingsToday: 0 // Would be populated from Calendar API
  };
}

/**
 * Get risk flags
 */
function getRiskFlags(data, lawyerData, today) {
  const todayDate = new Date(today);
  const sevenDaysAgo = new Date(todayDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(todayDate.getTime() - 5 * 24 * 60 * 60 * 1000);
  
  // Find matters with no time entry in 10+ days
  const mattersWithNoRecentTime = [];
  const activeMatters = data.matters.slice(1).filter(matter => 
    matter && Array.isArray(matter) && matter[5] === 'Active'
  );
  
  for (const matter of activeMatters) {
    const matterID = matter[0];
    const lastTimeEntry = data.timeLogs.slice(1)
      .filter(log => log && Array.isArray(log) && log[2] === matterID)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))[0];
    
    if (lastTimeEntry) {
      const lastEntryDate = new Date(lastTimeEntry[0]);
      const daysSinceLastEntry = Math.ceil((todayDate - lastEntryDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastEntry > 10) {
        mattersWithNoRecentTime.push({
          matterID,
          matterDescription: matter[3],
          clientName: matter[2],
          daysSinceLastEntry
        });
      }
    }
  }
  
  // Find clients with balance below $100 and no top-up in 5+ days
  const clientsAtRisk = [];
  for (const client of data.clientData.slice(1)) {
    if (!client || !Array.isArray(client)) continue;
    
    const balance = parseFloat(client[6]) || 0;
    if (balance < 100) {
      const lastPayment = data.paymentData.slice(1)
        .filter(p => p && Array.isArray(p) && p[1] === client[0])
        .sort((a, b) => new Date(b[0]) - new Date(a[0]))[0];
      
      if (lastPayment) {
        const lastPaymentDate = parseZapierTimestamp(lastPayment[0]);
        const daysSinceLastPayment = Math.ceil((todayDate - lastPaymentDate) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastPayment > 5) {
          clientsAtRisk.push({
            clientEmail: client[0],
            clientName: client[1],
            balance,
            daysSinceLastPayment
          });
        }
      }
    }
  }
  
  return {
    mattersWithNoRecentTime,
    clientsAtRisk
  };
}

/**
 * Get payment summary for today
 */
function getPaymentSummary(data, today) {
  const todayPayments = data.paymentData.slice(1).filter(payment => {
    if (!payment || !Array.isArray(payment) || payment.length < 3) return false;
    const paymentDate = parseZapierTimestamp(payment[0]);
    return paymentDate && paymentDate.toISOString().split('T')[0] === today;
  });
  
  const total = todayPayments.reduce((sum, payment) => {
    return sum + (parseFloat(payment[2]) || 0);
  }, 0);
  
  return {
    total,
    count: todayPayments.length
  };
}

/**
 * Get count of new clients today
 */
function getNewClientsCount(data, today) {
  // Count clients who made their first payment today
  const todayPayments = data.paymentData.slice(1).filter(payment => {
    if (!payment || !Array.isArray(payment) || payment.length < 3) return false;
    const paymentDate = parseZapierTimestamp(payment[0]);
    return paymentDate && paymentDate.toISOString().split('T')[0] === today;
  });
  
  const clientEmailsWithPaymentsToday = new Set(todayPayments.map(p => p[1]));
  let newClientsCount = 0;
  
  for (const clientEmail of clientEmailsWithPaymentsToday) {
    // Check if this is their first payment
    const allPaymentsForClient = data.paymentData.slice(1).filter(p => 
      p && Array.isArray(p) && p[1] === clientEmail
    );
    
    if (allPaymentsForClient.length === 1) {
      newClientsCount++;
    }
  }
  
  return newClientsCount;
}

/**
 * Get today's revenue
 */
function getTodayRevenue(data, today) {
  const todayPayments = data.paymentData.slice(1).filter(payment => {
    if (!payment || !Array.isArray(payment) || payment.length < 3) return false;
    const paymentDate = parseZapierTimestamp(payment[0]);
    return paymentDate && paymentDate.toISOString().split('T')[0] === today;
  });
  
  return todayPayments.reduce((sum, payment) => {
    return sum + (parseFloat(payment[2]) || 0);
  }, 0);
}

/**
 * Get low balance clients
 */
function getLowBalanceClients(data, lawyerData) {
  const lowBalanceClients = [];
  const defaultTargetBalance = getSetting('Low Balance Threshold', 500);
  
  for (const client of data.clientData.slice(1)) {
    if (!client || !Array.isArray(client) || client.length < 10) continue;
    
    const email = client[0];
    const clientName = client[1] || "Client";
    const clientID = client[9];
    let targetBalance = parseFloat(client[2]) || defaultTargetBalance;
    
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
        lastActivity: balanceInfo.lastActivityDate ? balanceInfo.lastActivityDate.toISOString().split('T')[0] : 'Unknown',
        emailSent: false // For now, always false since we're not tracking this yet
      });
    }
  }
  
  return lowBalanceClients;
}

/**
 * Get unassigned matters with lawyer suggestions
 */
function getUnassignedMatters(data, lawyerData) {
  const unassignedMatters = [];
  
  // Get all active matters
  const activeMatters = data.matters.slice(1).filter(matter => 
    matter && Array.isArray(matter) && matter[5] === 'Active'
  );
  
  for (const matter of activeMatters) {
    const matterID = matter[0];
    const clientEmail = matter[1];
    const clientName = matter[2] || 'Unknown Client';
    const matterDescription = matter[3] || 'General Legal Matter';
    const practiceArea = matter[7] || 'General';
    const openedDate = matter[4];
    
    // Check if matter has any time entries (indicates assignment)
    const hasTimeEntries = data.timeLogs.slice(1).some(log => 
      log && Array.isArray(log) && log[2] === matterID
    );
    
    // If no time entries, consider it unassigned
    if (!hasTimeEntries) {
      const suggestedLawyers = getSuggestedLawyers(practiceArea, lawyerData);
      
      unassignedMatters.push({
        matterID,
        clientEmail,
        clientName,
        matterDescription,
        practiceArea,
        openedDate,
        suggestedLawyers,
        daysSinceOpened: openedDate ? Math.ceil((new Date() - new Date(openedDate)) / (1000 * 60 * 60 * 24)) : 0
      });
    }
  }
  
  // Sort by days since opened (oldest first)
  return unassignedMatters.sort((a, b) => b.daysSinceOpened - a.daysSinceOpened);
}

/**
 * Generate URL for assigning matter to lawyer
 */
function generateAssignMatterUrl(matterID, practiceArea) {
  const scriptId = 'AKfycbyf3LSaFigy3zHlkJAU3E7w1LyDFyDnzrtTp_aSAbnP90U9_KJSkhXXIUyqWpi6YShg';
  const webAppUrl = `https://script.google.com/macros/s/${scriptId}/exec`;
  return `${webAppUrl}?action=assign_matter&matter_id=${encodeURIComponent(matterID)}&practice_area=${encodeURIComponent(practiceArea)}`;
}

/**
 * Generate matter assignment form
 */
function assignMatterForm(matterID, practiceArea) {
  const sheets = getSheets();
  const data = loadSheetData(sheets);
  const lawyerData = buildLawyerMaps(data.lawyers);
  
  const matter = data.matters.find(m => m && Array.isArray(m) && m[0] === matterID);
  const matterDescription = matter ? matter[3] : 'Unknown Matter';
  const clientEmail = matter ? matter[1] : '';
  const clientName = matter ? matter[2] : 'Unknown Client';
  const openedDate = matter && matter[4] ? new Date(matter[4]).toLocaleDateString() : 'Unknown';
  
  // Get suggested lawyers for this practice area
  const suggestedLawyers = getSuggestedLawyers(practiceArea, lawyerData);
  
  // Get all lawyers for the dropdown
  const allLawyers = [];
  for (const [lawyerID, name] of Object.entries(lawyerData.names)) {
    allLawyers.push({
      id: lawyerID,
      name: name,
      email: lawyerData.emails[lawyerID] || '',
      rate: lawyerData.rates[lawyerID] || 0,
      practiceAreas: lawyerData.practiceAreas[lawyerID] || ''
    });
  }
  
  // Sort by name
  allLawyers.sort((a, b) => a.name.localeCompare(b.name));
  
  const scriptId = 'AKfycbyf3LSaFigy3zHlkJAU3E7w1LyDFyDnzrtTp_aSAbnP90U9_KJSkhXXIUyqWpi6YShg';
  const webAppUrl = `https://script.google.com/macros/s/${scriptId}/exec`;
  
  // Build suggested lawyers HTML
  let suggestedLawyersHtml = '';
  if (suggestedLawyers.length > 0) {
    suggestedLawyersHtml = `
      <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #333;">💡 Suggested Lawyers for ${practiceArea}</h3>
        ${suggestedLawyers.map(lawyer => `
          <div style="margin-bottom: 10px; padding: 8px; background-color: white; border-radius: 3px;">
            <strong>${lawyer.name}</strong> (${lawyer.id}) - $${lawyer.rate}/hour<br>
            <small style="color: #666;">${lawyer.email} | ${lawyer.practiceAreas}</small>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  return HtmlService.createHtmlOutput(`
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
      <h2>Assign Matter to Lawyer</h2>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #333;">Matter Information</h3>
        <p><strong>Matter ID:</strong> ${matterID}</p>
        <p><strong>Description:</strong> ${matterDescription}</p>
        <p><strong>Client:</strong> ${clientName} (${clientEmail})</p>
        <p><strong>Practice Area:</strong> ${practiceArea}</p>
        <p><strong>Opened:</strong> ${openedDate}</p>
      </div>
      
      ${suggestedLawyersHtml}
      
      <form id="assignMatterForm">
        <input type="hidden" name="action" value="submit_assignment">
        <input type="hidden" name="matter_id" value="${matterID}">
        
        <div style="margin-bottom: 15px;">
          <label for="lawyer_id" style="display: block; margin-bottom: 5px;"><strong>Assign to Lawyer:</strong></label>
          <select id="lawyer_id" name="lawyer_id" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            <option value="">Select a lawyer...</option>
            ${allLawyers.map(lawyer => `
              <option value="${lawyer.id}" ${suggestedLawyers.some(s => s.id === lawyer.id) ? 'style="font-weight: bold; background-color: #e8f5e8;"' : ''}>
                ${lawyer.name} (${lawyer.id}) - $${lawyer.rate}/hour - ${lawyer.practiceAreas}
              </option>
            `).join('')}
          </select>
          <small style="color: #666;">Bold options are suggested based on practice area</small>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label for="notes" style="display: block; margin-bottom: 5px;"><strong>Assignment Notes (Optional):</strong></label>
          <textarea id="notes" name="notes" 
                    style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; height: 80px;"
                    placeholder="Any notes about this assignment..."></textarea>
        </div>
        
        <button type="submit" style="background-color: #4CAF50; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
          Assign Matter
        </button>
        <button type="button" onclick="window.close()" style="background-color: #f44336; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px; font-size: 16px;">
          Cancel
        </button>
      </form>
      
      <div id="result" style="margin-top: 20px;"></div>
      
      <script>
        document.getElementById('assignMatterForm').addEventListener('submit', function(e) {
          e.preventDefault();
          
          const lawyerID = document.getElementById('lawyer_id').value;
          const notes = document.getElementById('notes').value;
          const matterID = '${matterID}';
          
          if (!lawyerID) {
            document.getElementById('result').innerHTML = '<p style="color: red;">Please select a lawyer.</p>';
            return;
          }
          
          const params = new URLSearchParams({
            action: 'submit_assignment',
            matter_id: matterID,
            lawyer_id: lawyerID,
            notes: notes
          });
          
          const url = '${webAppUrl}?' + params.toString();
          
          // Open in new window/tab to avoid iframe issues
          window.open(url, '_blank');
          
          // Show success message
          document.getElementById('result').innerHTML = '<p style="color: green;">✅ Matter assignment submitted! Check the new tab for confirmation.</p>';
          
          // Clear form
          document.getElementById('lawyer_id').value = '';
          document.getElementById('notes').value = '';
        });
      </script>
    </div>
  `);
}

/**
 * Handle matter assignment submission: update sheet, log, notify
 */
function submitAssignment(matterID, lawyerID, notes, e) {
  try {
    const sheets = getSheets();
    const mattersSheet = sheets.mattersSheet;
    const data = loadSheetData(sheets);
    const lawyerData = buildLawyerMaps(data.lawyers);
    const ownerEmail = getActiveSpreadsheet().getOwner().getEmail();
    
    // Use spreadsheet owner as assigner to avoid permission issues
    const assigner = ownerEmail;
    
    const timestamp = new Date();

    // Find the matter row
    const matters = mattersSheet.getDataRange().getValues();
    const header = matters[0];
    const assignedLawyerCol = header.indexOf('Assigned Lawyer') + 1;
    const assignedLawyerEmailCol = header.indexOf('Assigned Lawyer Email') + 1;
    let rowIdx = -1;
    for (let i = 1; i < matters.length; i++) {
      if (matters[i][0] === matterID) {
        rowIdx = i + 1; // 1-based for Sheets
        break;
      }
    }
    if (rowIdx === -1 || assignedLawyerCol === 0) {
      return HtmlService.createHtmlOutput('<p style="color:red;">Error: Could not find matter or Assigned Lawyer column.</p>');
    }

    // Update the assigned lawyer in the sheet
    mattersSheet.getRange(rowIdx, assignedLawyerCol).setValue(lawyerData.names[lawyerID] || lawyerID);
    if (assignedLawyerEmailCol > 0) {
      mattersSheet.getRange(rowIdx, assignedLawyerEmailCol).setValue(lawyerData.emails[lawyerID] || '');
    }

    // Log the assignment (optional, if Assignment Log sheet exists)
    let logSheet;
    try {
      logSheet = sheets.assignmentLogSheet || SpreadsheetApp.getActive().getSheetByName('Assignment Log');
      if (!logSheet) {
        logSheet = SpreadsheetApp.getActive().insertSheet('Assignment Log');
        logSheet.appendRow(['Timestamp', 'Matter ID', 'Matter Description', 'Assigned Lawyer', 'Lawyer Email', 'Assigner', 'Notes']);
      }
    } catch (err) {}
    if (logSheet) {
      const matter = data.matters.find(m => m && Array.isArray(m) && m[0] === matterID);
      logSheet.appendRow([
        timestamp,
        matterID,
        matter ? matter[3] : '',
        lawyerData.names[lawyerID] || lawyerID,
        lawyerData.emails[lawyerID] || '',
        assigner,
        notes || ''
      ]);
    }

    // Send notification email
    const lawyerEmail = lawyerData.emails[lawyerID];
    const matter = data.matters.find(m => m && Array.isArray(m) && m[0] === matterID);
    const clientName = matter ? matter[2] : '';
    const matterDesc = matter ? matter[3] : '';
    const subject = `New Matter Assigned: ${matterDesc}`;
    let emailBody = `You have been assigned a new matter.\n\n`;
    emailBody += `Matter: ${matterDesc}\nClient: ${clientName}\nMatter ID: ${matterID}\n`;
    if (notes) emailBody += `\nNotes: ${notes}\n`;
    emailBody += `\nPlease log in to Blawby to review and begin work.`;
    if (lawyerEmail) {
      MailApp.sendEmail({
        to: lawyerEmail,
        cc: ownerEmail,
        subject: subject,
        body: emailBody
      });
    }

    return HtmlService.createHtmlOutput('<p style="color:green;">✅ Matter assigned and lawyer notified!</p>');
  } catch (error) {
    return HtmlService.createHtmlOutput(`<p style=\"color:red;\">Error: ${error.message}</p>`);
  }
}

/**
 * Get suggested lawyers for a practice area
 */
function getSuggestedLawyers(practiceArea, lawyerData) {
  if (!practiceArea || !lawyerData || !lawyerData.practiceAreas) {
    return [];
  }
  
  const suggestedLawyers = [];
  const practiceAreaLower = practiceArea.toLowerCase();
  
  for (const [lawyerID, practiceAreasStr] of Object.entries(lawyerData.practiceAreas)) {
    if (!practiceAreasStr) continue;
    
    const lawyerPracticeAreas = practiceAreasStr.toLowerCase().split(',').map(pa => pa.trim());
    
    // Check if any of the lawyer's practice areas match the matter's practice area
    const hasMatchingPracticeArea = lawyerPracticeAreas.some(pa => 
      pa.includes(practiceAreaLower) || practiceAreaLower.includes(pa)
    );
    
    if (hasMatchingPracticeArea) {
      suggestedLawyers.push({
        id: lawyerID,
        name: lawyerData.names[lawyerID] || lawyerID,
        email: lawyerData.emails[lawyerID] || '',
        rate: lawyerData.rates[lawyerID] || 0,
        practiceAreas: practiceAreasStr
      });
    }
  }
  
  // Sort by rate (highest first) and then by name
  return suggestedLawyers.sort((a, b) => {
    if (b.rate !== a.rate) return b.rate - a.rate;
    return a.name.localeCompare(b.name);
  });
}