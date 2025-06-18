// ========== EMAIL FUNCTIONS ==========
function sendLowBalanceEmail(clientID, email, clientName, balance, targetBalance, paymentLink, lastLawyerID, lawyerEmails, today) {
  const props = PropertiesService.getScriptProperties();
  const emailKey = `low_balance_${clientID}_${today}`;
  
  // Check if email already sent today
  if (props.getProperty(emailKey)) {
    return false;
  }
  
  const settings = loadSettings(SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Welcome"));
  const isTestMode = settings[SETTINGS_KEYS.TEST_MODE] === "true";
  const firmEmail = Session.getActiveUser().getEmail();
  
  // Send to client (or firm in test mode)
  const clientSubject = isTestMode ? `[TEST] Low Balance Alert - ${clientName}` : "Low Balance Alert - Blawby";
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
  
  MailApp.sendEmail({
    to: isTestMode ? firmEmail : email,
    subject: clientSubject,
    body: clientBody
  });
  
  // Send to owner (only if not in test mode)
  if (!isTestMode) {
    const ownerSubject = `Low Balance Alert - ${clientName}`;
    const ownerBody = `
      Client: ${clientName}
      Email: ${email}
      Current Balance: $${balance.toFixed(2)}
      Target Balance: $${targetBalance.toFixed(2)}
      Last Active Lawyer: ${lawyerEmails[lastLawyerID] || 'Unknown'}
      
      Payment Link: ${paymentLink}
    `;
    
    MailApp.sendEmail({
      to: firmEmail,
      subject: ownerSubject,
      body: ownerBody
    });
  }
  
  // Mark as sent
  props.setProperty(emailKey, "1");
  return true;
}

function sendDailyBalanceDigest() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = getSheets(ss);
  const data = loadSheetData(sheets);
  const settings = loadSettings(sheets.settingsSheet);
  const isTestMode = settings[SETTINGS_KEYS.TEST_MODE] === "true";
  
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
  
  if (lowBalanceClients.length === 0) return;
  
  // Sort by top-up amount (highest first)
  lowBalanceClients.sort((a, b) => b.topUp - a.topUp);
  
  // Build email body
  let body = isTestMode ? "[TEST MODE] " : "";
  body += "Daily Low Balance Digest\n\n";
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
  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: isTestMode ? "[TEST] Daily Low Balance Digest - Blawby" : "Daily Low Balance Digest - Blawby",
    body: body
  });
}

function notifyServiceResumed(clientID, email, clientName, balance, today) {
  const props = PropertiesService.getScriptProperties();
  const emailKey = `service_resumed_${clientID}_${today}`;
  
  // Check if notification already sent today
  if (props.getProperty(emailKey)) {
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
  
  MailApp.sendEmail({
    to: email,
    subject: clientSubject,
    body: clientBody
  });
  
  // Send to owner
  const ownerSubject = `Service Resumed - ${clientName}`;
  const ownerBody = `
    Client: ${clientName}
    Email: ${email}
    Current Balance: $${balance.toFixed(2)}
    
    Service has been automatically resumed.
  `;
  
  MailApp.sendEmail({
    to: Session.getActiveUser().getEmail(),
    subject: ownerSubject,
    body: ownerBody
  });
  
  // Mark as sent
  props.setProperty(emailKey, "1");
} 