// ========== RECEIPT GENERATION ==========

function generateReceipt(paymentData, clientData) {
  const sheets = getSheets();
  
  const [date, email, amount, paymentMethod] = paymentData;
  
  // Generate a receipt ID automatically
  const receiptIdValue = `REC-${Date.now()}`;
  
  const clientName = clientData[1] || "Client";
  const clientId = clientData[9];
  
  // Calculate balance after payment
  const currentBalance = parseFloat(clientData[6]) || 0;
  const newBalance = currentBalance + parseFloat(amount);
  
  // Get time usage for the current month
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const timeLogs = sheets.timeLogsSheet.getDataRange().getValues();
  const monthlyTimeLogs = timeLogs.filter(log => {
    const logDate = new Date(log[0]);
    return log[1] === email && logDate >= firstOfMonth;
  });
  
  // Calculate hours used this month
  const hoursUsed = monthlyTimeLogs.reduce((sum, log) => sum + (parseFloat(log[4]) || 0), 0);
  
  // Get average rate used - get lawyers from Welcome sheet
  const lawyers = getLawyersFromWelcomeSheet(sheets.welcomeSheet);
  const lawyerData = buildLawyerMaps(lawyers);
  const rates = monthlyTimeLogs.map(log => lawyerData.rates[log[3]] || 0).filter(rate => rate > 0);
  const averageRate = rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;
  
  // Add receipt data to Payments sheet (not Invoices sheet)
  const receiptRow = [
    date,
    email,
    amount,
    `Retainer top-up payment - Receipt #${receiptIdValue}`
  ];
  
  sheets.paymentsSheet.appendRow(receiptRow);
  
  // Send receipt email
  sendReceiptEmail(email, clientName, receiptIdValue, date, amount, getSetting(SETTINGS_KEYS.DEFAULT_CURRENCY, "USD"), newBalance, hoursUsed, averageRate);
}

function sendReceiptEmail(email, clientName, receiptId, date, amount, currency, newBalance, hoursUsed, averageRate) {
  const subject = renderTemplate('RECEIPT', 'SUBJECT', receiptId);
  const body = renderTemplate('RECEIPT', 'BODY', clientName, receiptId, date, amount, currency, newBalance, hoursUsed, averageRate);
  
  sendEmail(email, subject, body, { isHtml: true, emailType: 'receipt' });
}