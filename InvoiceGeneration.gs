// ========== INVOICE GENERATION ==========
function setupInvoiceSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Invoices');
  
  // Create the sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet('Invoices');
  }
  
  const headers = [
    "Invoice Number",
    "Client Name",
    "Date",
    "Amount",
    "Currency",
    "Status",
    "Payment Link",
    "Notes"
  ];
  
  setupSheet(sheet, headers);
  
  // Add sample data if sheet is empty
  if (sheet.getLastRow() === 1) {
    const sampleData = [
      ["INV-001", "Sample Client", new Date(), 1000, "USD", "Paid", "https://app.blawby.com/pay", "Sample invoice"],
      ["INV-002", "Another Client", new Date(), 2000, "USD", "Pending", "https://app.blawby.com/pay", "Another sample"]
    ];
    
    sheet.getRange(2, 1, sampleData.length, headers.length).setValues(sampleData);
    
    // Format the sheet
    sheet.getRange(1, 1, 1, headers.length).setBackground('#4285f4')
          .setFontColor('white')
          .setFontWeight('bold');
    
    sheet.autoResizeColumns(1, headers.length);
  }
}

function generateReceipt(paymentData, clientData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = getSheets(ss);
  
  // Ensure invoice sheet is properly set up
  setupInvoiceSheet(sheets.invoicesSheet);
  
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
  
  // Get average rate used
  const lawyerData = buildLawyerMaps(sheets.lawyersSheet.getDataRange().getValues());
  const rates = monthlyTimeLogs.map(log => lawyerData.rates[log[3]] || 0).filter(rate => rate > 0);
  const averageRate = rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;
  
  const receiptRow = [
    date,
    email,
    clientName,
    "Top-up Payment",
    amount,
    getSetting(SETTINGS_KEYS.DEFAULT_CURRENCY, "USD"), // Use default currency from settings
    `Retainer top-up payment - Receipt #${receiptIdValue}`,
    receiptIdValue,
    clientId,
    "Completed", // Default status for all payments
    newBalance,
    `${firstOfMonth.toISOString().substring(0, 7)}`, // YYYY-MM format
    hoursUsed,
    averageRate
  ];
  
  sheets.invoicesSheet.appendRow(receiptRow);
  
  // Send receipt email
  sendReceiptEmail(email, clientName, receiptIdValue, date, amount, getSetting(SETTINGS_KEYS.DEFAULT_CURRENCY, "USD"), newBalance, hoursUsed, averageRate);
}

function sendReceiptEmail(email, clientName, receiptId, date, amount, currency, newBalance, hoursUsed, averageRate) {
  const subject = `Payment Receipt #${receiptId} - Blawby`;
  
  let body = `Dear ${clientName},\n\n`;
  body += `Thank you for your payment. Here is your receipt:\n\n`;
  body += `Receipt #: ${receiptId}\n`;
  body += `Date: ${date}\n`;
  body += `Amount: ${currency} ${amount}\n`;
  body += `New Balance: ${currency} ${newBalance.toFixed(2)}\n\n`;
  
  if (hoursUsed > 0) {
    body += `Monthly Summary:\n`;
    body += `Hours Used This Month: ${hoursUsed.toFixed(2)}\n`;
    body += `Average Rate: ${currency} ${averageRate.toFixed(2)}/hour\n`;
    body += `Estimated Monthly Usage: ${currency} ${(hoursUsed * averageRate).toFixed(2)}\n\n`;
  }
  
  body += "Thank you for your business.\n\n";
  body += "Best regards,\nThe Blawby Team";
  
  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body
  });
}

function generateMonthlySummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = getSheets(ss);
  
  // Get all clients
  const clients = sheets.clientsSheet.getDataRange().getValues();
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // For each client, generate a monthly summary
  for (let i = 1; i < clients.length; i++) {
    const client = clients[i];
    const email = client[0];
    const clientName = client[1] || "Client";
    const balance = parseFloat(client[6]) || 0;
    
    // Get time logs for this month
    const timeLogs = sheets.timeLogsSheet.getDataRange().getValues();
    const monthlyTimeLogs = timeLogs.filter(log => {
      const logDate = new Date(log[0]);
      return log[1] === email && logDate >= firstOfMonth;
    });
    
    if (monthlyTimeLogs.length === 0) continue;
    
    // Calculate monthly totals
    const hoursUsed = monthlyTimeLogs.reduce((sum, log) => sum + (parseFloat(log[4]) || 0), 0);
    const lawyerData = buildLawyerMaps(sheets.lawyersSheet.getDataRange().getValues());
    const rates = monthlyTimeLogs.map(log => lawyerData.rates[log[3]] || 0).filter(rate => rate > 0);
    const averageRate = rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;
    const estimatedUsage = hoursUsed * averageRate;
    
    // Generate summary row
    const summaryRow = [
      today.toISOString().split('T')[0],
      email,
      clientName,
      "Monthly Summary",
      estimatedUsage,
      getSetting(SETTINGS_KEYS.DEFAULT_CURRENCY, "USD"),
      `Monthly summary for ${firstOfMonth.toISOString().substring(0, 7)}`,
      "MONTHLY-" + firstOfMonth.toISOString().substring(0, 7),
      client[9], // Client ID
      "Completed",
      balance,
      firstOfMonth.toISOString().substring(0, 7),
      hoursUsed,
      averageRate
    ];
    
    sheets.invoicesSheet.appendRow(summaryRow);
    
    // Send monthly summary email
    sendMonthlySummaryEmail(email, clientName, firstOfMonth, hoursUsed, averageRate, estimatedUsage, balance);
  }
}

function sendMonthlySummaryEmail(email, clientName, month, hoursUsed, averageRate, estimatedUsage, balance) {
  const subject = `Monthly Summary - ${month.toISOString().substring(0, 7)} - Blawby`;
  
  let body = `Dear ${clientName},\n\n`;
  body += `Here is your monthly summary for ${month.toISOString().substring(0, 7)}:\n\n`;
  body += `Hours Used: ${hoursUsed.toFixed(2)}\n`;
  body += `Average Rate: $${averageRate.toFixed(2)}/hour\n`;
  body += `Estimated Usage: $${estimatedUsage.toFixed(2)}\n`;
  body += `Current Balance: $${balance.toFixed(2)}\n\n`;
  
  if (balance < estimatedUsage) {
    body += `Note: Your current balance is below the estimated monthly usage. `;
    body += `Consider topping up your retainer to ensure uninterrupted service.\n\n`;
  }
  
  body += "Thank you for your business.\n\n";
  body += "Best regards,\nThe Blawby Team";
  
  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body
  });
}

/**
 * Gets all clients from the clients sheet
 * @returns {Array} Array of client objects
 */
function getAllClients() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const clientSheet = ss.getSheetByName("Clients");
  if (!clientSheet) {
    console.log("Clients sheet not found");
    return [];
  }
  
  const clientData = clientSheet.getDataRange().getValues();
  if (clientData.length <= 1) {
    console.log("No client data found");
    return [];
  }
  
  // Skip header row, map to client objects
  return clientData.slice(1)
    .filter(row => {
      const email = row[0];
      // Skip empty rows
      if (!email || typeof email !== 'string') {
        return false;
      }
      // Validate email format
      if (!isValidEmail(email)) {
        Logger.log(`Invalid email format: ${email}`);
        return false;
      }
      return true;
    })
    .map(row => ({
      email: row[0],
      name: row[1] || "Client",
      targetBalance: parseFloat(row[2]) || 0,
      totalPaid: parseFloat(row[3]) || 0,
      totalHours: parseFloat(row[4]) || 0,
      totalUsed: parseFloat(row[5]) || 0,
      balance: parseFloat(row[6]) || 0,
      topUp: parseFloat(row[7]) || 0,
      paymentLink: row[8],
      id: row[9]
    }));
}

/**
 * Generates invoices for all clients
 * @returns {Object} Summary of invoice generation
 */
function generateInvoicesForAllClients() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = getSheets(ss);
  const settings = loadSettings(sheets.settingsSheet);
  const clients = getAllClients();
  const summary = {
    total: clients.length,
    generated: 0,
    skipped: 0,
    errors: 0
  };

  clients.forEach(client => {
    try {
      const result = generateInvoiceForClient(client.email);
      if (result === true) {
        summary.generated++;
      } else {
        summary.skipped++;
      }
    } catch (error) {
      console.error(`Error generating invoice for ${client.name}:`, error);
      summary.errors++;
    }
  });

  return summary;
}

function generateInvoiceForClient(clientEmail) {
  try {
    if (!clientEmail || typeof clientEmail !== 'string') {
      console.log('Invalid client email provided');
      return false;
    }

    const settings = loadSettings();
    if (!settings.auto_generate_invoices) {
      console.log(`Invoice generation is disabled for ${clientEmail}`);
      return false;
    }

    const today = new Date();
    const invoiceDay = parseInt(settings.invoice_day);
    
    // Only generate invoices on the specified day
    if (today.getDate() !== invoiceDay) {
      console.log(`Not invoice day for ${clientEmail}`);
      return false;
    }

    // Get client's time logs
    const timeLogs = getTimeLogsForClient(clientEmail);
    if (!timeLogs || timeLogs.length === 0) {
      console.log(`No time logs found for ${clientEmail}`);
      return false;
    }

    // Calculate total hours and amount
    let totalHours = 0;
    let totalAmount = 0;
    timeLogs.forEach(log => {
      if (log && log.hours) {
        totalHours += parseFloat(log.hours);
        const lawyerRate = getLawyerRate(log.lawyerId);
        totalAmount += parseFloat(log.hours) * lawyerRate;
      }
    });

    if (totalHours === 0) {
      console.log(`No billable hours found for ${clientEmail}`);
      return false;
    }

    // Create invoice record
    const invoice = {
      clientEmail: clientEmail,
      date: today,
      totalHours: totalHours,
      totalAmount: totalAmount,
      status: 'Pending'
    };

    // Save invoice
    const saved = saveInvoice(invoice);
    if (!saved) {
      console.log(`Failed to save invoice for ${clientEmail}`);
      return false;
    }

    // Send invoice email
    if (settings.email_notifications) {
      const emailSent = sendInvoiceEmail(invoice);
      if (!emailSent) {
        console.log(`Failed to send invoice email to ${clientEmail}`);
      }
    }

    console.log(`✅ Invoice generated for ${clientEmail}`);
    return true;
  } catch (error) {
    console.error(`Error generating invoice for ${clientEmail}: ${error.message}`);
    return false;
  }
}

function getTimeLogsForClient(clientEmail) {
  try {
    const timeLogsSheet = getSheet('TimeLogs');
    if (!timeLogsSheet) {
      console.log('TimeLogs sheet not found');
      return [];
    }
    
    const data = timeLogsSheet.getDataRange().getValues();
    if (data.length <= 1) {
      console.log('No time logs found in sheet');
      return [];
    }
    
    const headers = data[0];
    
    return data.slice(1)
      .filter(row => row && row[1] === clientEmail)
      .map(row => ({
        date: row[0],
        clientEmail: row[1],
        matterId: row[2],
        lawyerId: row[3],
        hours: row[4]
      }));
  } catch (error) {
    console.error(`Error getting time logs for ${clientEmail}: ${error.message}`);
    return [];
  }
}

function getLawyerRate(lawyerId) {
  try {
    if (!lawyerId) return 0;
    
    const welcomeSheet = getSheet('Welcome');
    if (!welcomeSheet) {
      console.log('Welcome sheet not found');
      return 0;
    }
    
    const data = welcomeSheet.getDataRange().getValues();
    if (data.length <= 1) {
      console.log('No lawyers found in sheet');
      return 0;
    }
    
    const lawyer = data.slice(1)
      .find(row => row && row[3] === lawyerId); // Lawyer ID is in column 4
    
    return lawyer ? parseFloat(lawyer[2]) : 0; // Rate is in column 3
  } catch (error) {
    console.error(`Error getting rate for lawyer ${lawyerId}: ${error.message}`);
    return 0;
  }
}

function saveInvoice(invoice) {
  try {
    if (!invoice || !invoice.clientEmail) {
      console.log('Invalid invoice data');
      return false;
    }

    const invoicesSheet = getSheet('Invoices');
    if (!invoicesSheet) {
      console.log('Invoices sheet not found');
      return false;
    }
    
    invoicesSheet.appendRow([
      invoice.date,
      invoice.clientEmail,
      invoice.totalHours,
      invoice.totalAmount,
      invoice.status
    ]);
    
    return true;
  } catch (error) {
    console.error(`Error saving invoice: ${error.message}`);
    return false;
  }
}

function sendInvoiceEmail(invoice) {
  try {
    if (!invoice || !invoice.clientEmail) {
      console.log('Invalid invoice data for email');
      return false;
    }

    const client = getClientByEmail(invoice.clientEmail);
    if (!client) {
      console.log(`Client not found for email ${invoice.clientEmail}`);
      return false;
    }

    const subject = `Invoice for ${client.name} - ${formatDate(invoice.date)}`;
    const body = `
      Dear ${client.name},

      Please find attached your invoice for ${formatDate(invoice.date)}.

      Total Hours: ${invoice.totalHours}
      Total Amount: ${formatCurrency(invoice.totalAmount)}

      Thank you for your business.

      Best regards,
      Your Law Firm
    `;

    MailApp.sendEmail({
      to: client.email,
      subject: subject,
      body: body
    });
    
    return true;
  } catch (error) {
    console.error(`Error sending invoice email: ${error.message}`);
    return false;
  }
} 