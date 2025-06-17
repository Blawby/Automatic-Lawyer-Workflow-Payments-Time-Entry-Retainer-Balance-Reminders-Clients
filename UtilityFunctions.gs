// ========== UTILITY FUNCTIONS ==========
function getSheets(ss) {
  return {
    paymentsSheet: ss.getSheetByName("Payments"),
    clientsSheet: ss.getSheetByName("Clients"),
    timeLogsSheet: ss.getSheetByName("TimeLogs"),
    lawyersSheet: ss.getSheetByName("Lawyers"),
    settingsSheet: ss.getSheetByName("Settings"),
    lowBalanceSheet: ss.getSheetByName("LowBalanceWarnings"),
    invoicesSheet: ss.getSheetByName("Invoices"),
    mattersSheet: ss.getSheetByName("Matters")
  };
}

function loadSheetData(sheets) {
  return {
    paymentData: sheets.paymentsSheet.getDataRange().getValues(),
    clientData: sheets.clientsSheet.getDataRange().getValues(),
    timeLogs: sheets.timeLogsSheet.getDataRange().getValues(),
    lawyers: sheets.lawyersSheet.getDataRange().getValues(),
    matters: sheets.mattersSheet.getDataRange().getValues()
  };
}

function loadSettings(settingsSheet) {
  const basePaymentURL = settingsSheet.getRange("A2").getValue().toString().trim();
  const defaultCurrency = settingsSheet.getRange("B2").getValue().toString().trim().toUpperCase() || "USD";
  const today = new Date().toDateString();
  
  console.log(`⚙️ Settings - Payment URL: ${basePaymentURL}, Currency: ${defaultCurrency}`);
  
  return { basePaymentURL, defaultCurrency, today };
}

function buildLawyerMaps(lawyers) {
  const rates = {};
  const emails = {};
  
  for (let i = 1; i < lawyers.length; i++) {
    const [lawyerID, , rate, email] = lawyers[i];
    if (!lawyerID) continue;
    
    rates[lawyerID] = parseFloat(rate) || 0;
    if (email) emails[lawyerID] = email;
  }
  
  return { rates, emails };
}

function buildClientMap(clientData) {
  const clientsById = {};
  
  for (let i = 1; i < clientData.length; i++) {
    const row = clientData[i];
    let clientID = row[9];
    
    if (!clientID) {
      clientID = Utilities.getUuid();
      row[9] = clientID;
    }
    
    clientsById[clientID] = row;
  }
  
  return clientsById;
}

function findClientByEmail(clientsById, email) {
  for (const [id, clientRow] of Object.entries(clientsById)) {
    if (clientRow[0] === email) return id;
  }
  return null;
} 