// ========== SYNC PAYMENTS AND CLIENTS ==========
function syncPaymentsAndClients() {
  logStart('syncPaymentsAndClients');
  
  try {
    const sheets = getSheets();
    const data = loadSheetData(sheets);
    
    log("📊 Processing payments and clients...");
    const lawyerData = buildLawyerMaps(data.lawyers);
    const clientsById = buildClientMap(data.clientData);
    
    // Process new payments and create clients if needed
    log("💳 Processing payments...");
    processPayments(sheets.paymentsSheet, clientsById);
    
    // Update matters sheet with client names
    log("📋 Updating matters with client names...");
    updateMattersWithClientNames(sheets.mattersSheet, clientsById);
    
    // Calculate balances and send low balance warnings
    log("💰 Calculating client balances...");
    const today = new Date().toISOString().split('T')[0];
    const { updatedClientRows, lowBalanceRows, emailsSent } = processClientBalances(
      clientsById, 
      data, 
      lawyerData, 
      today
    );
    
    // Update sheets
    log("📝 Updating client and low balance sheets...");
    updateClientsSheet(sheets.clientsSheet, updatedClientRows);
    updateLowBalanceSheet(sheets.lowBalanceSheet, lowBalanceRows);
    
    log(`✅ Processed ${updatedClientRows.length - 1} clients, sent ${emailsSent} emails`);
  } catch (error) {
    logError('syncPaymentsAndClients', error);
    throw error;
  }
  
  logEnd('syncPaymentsAndClients');
}

function processPayments(paymentsSheet, clientsById) {
  const payments = paymentsSheet.getDataRange().getValues();
  const headerRow = payments[0];
  
  // Known field values to skip (no longer includes instructions)
  const skipFields = new Set([
    "Format",
    "YYYY-MM-DD",
    "Number > 0",
    "USD/EUR/GBP/CAD/AUD",
    "Pending/Completed/Failed",
    "Any text",
    "Client's email address"
  ]);
  
  // Skip header row
  for (let i = 1; i < payments.length; i++) {
    const row = payments[i];
    const clientEmail = row[1]; // Client's email address column (now column 2)
    
    // Skip empty rows
    if (!clientEmail || 
        typeof clientEmail !== 'string' ||
        skipFields.has(clientEmail)) {
      continue;
    }

    // Validate email format
    if (!isValidEmail(clientEmail)) {
      Logger.log(`Invalid email format: ${clientEmail}`);
      continue;
    }

    // Process the payment
    const paymentAmount = parseFloat(row[2]); // Amount is now column 3
    if (isNaN(paymentAmount)) {
      continue;
    }

    // Parse the timestamp properly
    const paymentDate = parseZapierTimestamp(row[0]);
    
    // Create new client if not exists
    if (!clientsById[clientEmail]) {
      const newClient = createNewClient(clientEmail);
      clientsById[clientEmail] = newClient;
      console.log(`👤 Created new client: ${clientEmail}`);
    }
    
    // Note: Receipt generation removed - app.blawby.com handles receipts and sends payment data via webhook
  }
}

/**
 * Validates an email address using a regular expression
 * @param {string} email - The email address to validate
 * @return {boolean} - True if the email is valid, false otherwise
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function createMatterForNewClient(mattersSheet, clientEmail, clientID) {
  const today = new Date();
  const year = today.getFullYear();
  const matterCount = mattersSheet.getLastRow(); // Simple counter for matter ID
  const matterID = `M-${year}-${String(matterCount).padStart(3, '0')}`;
  
  const newMatterRow = [
    matterID,
    clientEmail,
    "", // Client Name - will be filled when they update client info
    "General Legal Matter", // Default description
    today.toDateString(),
    "Active"
  ];
  
  mattersSheet.appendRow(newMatterRow);
  console.log(`📋 Created matter ${matterID} for client ${clientEmail}`);
}

function processClientBalances(clientsById, data, lawyerData, today) {
  const updatedClientRows = [data.clientData[0]]; // Header row
  const lowBalanceRows = [];
  const props = PropertiesService.getScriptProperties();
  let emailsSent = 0;
  
  // Process all clients (both existing and newly created)
  for (const [clientID, row] of Object.entries(clientsById)) {
    const email = row[0];
    const clientName = row[1] || "Client";
    let targetBalance = parseFloat(row[2]) || 0;
    
    // Calculate target balance based on different factors
    if (!targetBalance) {
      // 1. Check if client has any matters with case values
      const clientMatters = data.matters.filter(m => m[1] === email);
      const totalCaseValue = clientMatters.reduce((sum, m) => {
        const caseValue = parseFloat(m[6]) || 0; // Assuming case value is in column 7
        return sum + caseValue;
      }, 0);
      
      if (totalCaseValue > 0) {
        // Set target as 10% of total case value, minimum $500
        targetBalance = Math.max(500, Math.round(totalCaseValue * 0.1));
      } else {
        // 2. Default to 5x highest lawyer rate
        const maxRate = Math.max(...Object.values(lawyerData.rates));
        targetBalance = Math.round(maxRate * 5);
      }
    }
    
    const balanceInfo = calculateClientBalance(clientID, email, data, lawyerData.rates);
    const balance = balanceInfo.totalPaid - balanceInfo.totalUsed;
    const topUp = Math.max(0, targetBalance - balance);
    const paymentLink = topUp > 0 ? `${getSetting(SETTINGS_KEYS.BASE_PAYMENT_URL)}?amount=${Math.round(topUp * 100)}` : "";
    
    const updatedRow = [
      email,
      clientName,
      targetBalance,
      balanceInfo.totalPaid,
      balanceInfo.totalHours,
      balanceInfo.totalUsed,
      balance,
      topUp,
      paymentLink,
      clientID
    ];
    updatedClientRows.push(updatedRow);
    
    // Handle low balance warnings
    if (topUp > 0) {
      log(`⚠️ LOW BALANCE DETECTED for ${clientName}:`);
      log(`   - Current balance: $${balance.toFixed(2)}`);
      log(`   - Target balance: $${targetBalance.toFixed(2)}`);
      log(`   - Top-up needed: $${topUp.toFixed(2)}`);
      log(`   - Payment link: ${paymentLink}`);
      
      lowBalanceRows.push([
        email,
        clientName,
        `$${balance.toFixed(2)}`,
        `Needs top-up of $${topUp.toFixed(2)}`
      ]);
      
      // Send email if not already sent today
      log(`📧 Attempting to send low balance email for ${clientName}...`);
      const emailSent = sendLowBalanceEmail(
        clientID, 
        email, 
        clientName, 
        balance, 
        targetBalance, 
        paymentLink, 
        balanceInfo.lastLawyerID, 
        lawyerData.emails, 
        today
      );
      
      if (emailSent) {
        emailsSent++;
        log(`✅ Low balance email sent successfully for ${clientName}`);
      } else {
        log(`❌ Low balance email was not sent for ${clientName} (likely already sent today)`);
      }
    } else {
      log(`✅ Balance OK for ${clientName}: $${balance.toFixed(2)} (target: $${targetBalance.toFixed(2)})`);
    }
    
    // Check for service resumption
    if (balance > 0 && topUp === 0) {
      notifyServiceResumed(clientID, email, clientName, balance, today);
    }
  }
  
  return { updatedClientRows, lowBalanceRows, emailsSent };
}

function calculateClientBalance(clientID, email, data, lawyerRates) {
  // Calculate total paid with validation
  const totalPaid = data.paymentData
    .filter(p => {
      // Validate payment data
      if (!p || !Array.isArray(p)) return false;
      
      // Match client by email and ID
      const matchClient = data.clientData.find(r => 
        r && Array.isArray(r) && 
        r[0] === p[1] && 
        r[9] === clientID
      );
      
      // Validate amount
      const amount = parseFloat(p[2]);
      return matchClient && !isNaN(amount) && amount > 0;
    })
    .reduce((sum, p) => sum + (parseFloat(p[2]) || 0), 0);
  
  // Calculate total hours and used based on new TimeLogs structure
  let totalHours = 0;
  let totalUsed = 0;
  let lastLawyerID = "";
  let lastActivityDate = null;
  let matterBreakdown = {};

  for (const log of data.timeLogs.slice(1)) {
    // Validate log data
    if (!log || !Array.isArray(log) || log.length < 5) continue;
    
    const [, logEmail, matterID, lawyerID, hours] = log;
    if (!logEmail || !lawyerID) continue;

    let matchedClient = false;
    let matchedMatter = null;

    // Match by Matter ID (preferred)
    if (matterID) {
      matchedMatter = data.matters.find(m => m && Array.isArray(m) && m[0] === matterID);
      if (matchedMatter && matchedMatter[1] === email) {
        matchedClient = true;
      }
    }

    // Fallback: Match by client email directly
    if (!matchedClient && logEmail === email) {
      matchedClient = true;
    }

    if (matchedClient) {
      const h = parseFloat(hours);
      if (isNaN(h) || h <= 0) continue;
      
      const rate = lawyerRates[lawyerID] || 0;
      const amount = h * rate;

      totalHours += h;
      totalUsed += amount;
      lastLawyerID = lawyerID;
      
      // Track last activity date
      const logDate = new Date(log[0]);
      if (!lastActivityDate || logDate > lastActivityDate) {
        lastActivityDate = logDate;
      }
      
      // Track matter breakdown
      const matterKey = matterID || 'General';
      if (!matterBreakdown[matterKey]) {
        matterBreakdown[matterKey] = {
          hours: 0,
          amount: 0,
          description: matchedMatter ? matchedMatter[3] : 'General Legal Services'
        };
      }
      matterBreakdown[matterKey].hours += h;
      matterBreakdown[matterKey].amount += amount;
    }
  }

  // Only return the needed fields
  return {
    totalPaid,
    totalHours,
    totalUsed,
    lastLawyerID,
    lastActivityDate,
    matterBreakdown,
    currentBalance: totalPaid - totalUsed
  };
}

function updateClientsSheet(clientsSheet, updatedClientRows) {
  clientsSheet.clearContents();
  clientsSheet.getRange(1, 1, updatedClientRows.length, 10).setValues(updatedClientRows);
}

function updateLowBalanceSheet(lowBalanceSheet, lowBalanceRows) {
  if (!lowBalanceSheet) return;
  
  lowBalanceSheet.clearContents();
  lowBalanceSheet.getRange(1, 1, 1, 4).setValues([["Client Email", "Client Name", "Balance ($)", "Warning"]]);
  
  if (lowBalanceRows.length > 0) {
    lowBalanceSheet.getRange(2, 1, lowBalanceRows.length, 4).setValues(lowBalanceRows);
  }
}

function updateMattersWithClientNames(mattersSheet, clientsById) {
  const mattersData = mattersSheet.getDataRange().getValues();
  
  for (let i = 1; i < mattersData.length; i++) {
    const row = mattersData[i];
    const clientEmail = row[1];
    const currentClientName = row[2];
    
    // Skip if client name is already filled
    if (currentClientName && currentClientName.trim() !== "") continue;
    
    // Find client by email and update name
    for (const [clientID, clientRow] of Object.entries(clientsById)) {
      if (clientRow[0] === clientEmail && clientRow[1]) { // Has client name
        mattersSheet.getRange(i + 1, 3).setValue(clientRow[1]); // Update client name in matters
        break;
      }
    }
  }
}

/**
 * Creates a new client object with default values
 * @param {string} clientEmail - The client's email address
 * @return {Array} - Client data row
 */
function createNewClient(clientEmail) {
  const clientID = generateClientID(clientEmail);
  return [
    clientEmail,           // Email
    "",                    // Client Name (empty, to be filled later)
    0,                     // Target Balance (will be calculated)
    0,                     // Total Paid (will be calculated from payments)
    0,                     // Total Hours (will be calculated from time logs)
    0,                     // Total Used (will be calculated from time logs)
    0,                     // Balance (will be calculated)
    0,                     // Top Up Needed (will be calculated)
    "",                    // Payment Link (will be generated)
    clientID               // Client ID
  ];
}

/**
 * Generates a unique client ID based on email
 * @param {string} clientEmail - The client's email address
 * @return {string} - Unique client ID
 */
function generateClientID(clientEmail) {
  const timestamp = new Date().getTime();
  const emailHash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, clientEmail)).substring(0, 8);
  return `C-${timestamp}-${emailHash}`;
} 