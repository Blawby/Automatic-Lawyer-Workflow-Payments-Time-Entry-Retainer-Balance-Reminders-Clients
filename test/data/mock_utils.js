// Mock utility functions
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
    const settingsData = settingsSheet.getDataRange().getValues();
    const settings = {
        [SETTINGS_KEYS.BASE_PAYMENT_URL]: "https://app.blawby.com/pay",
        [SETTINGS_KEYS.DEFAULT_CURRENCY]: "USD",
        [SETTINGS_KEYS.LOW_BALANCE_THRESHOLD]: "1000",
        [SETTINGS_KEYS.DAILY_SYNC_TIME]: "01:00",
        [SETTINGS_KEYS.EMAIL_NOTIFICATIONS]: true,
        [SETTINGS_KEYS.AUTO_GENERATE_INVOICES]: true,
        [SETTINGS_KEYS.INVOICE_DAY]: "1",
        [SETTINGS_KEYS.SUMMARY_EMAIL_TIME]: "06:30"
    };
    
    // Process each setting row
    for (let i = 1; i < settingsData.length; i++) {
        const [key, value] = settingsData[i];
        if (!key) continue;
        
        // Map the key to our settings
        const settingKey = Object.entries(SETTINGS_KEYS).find(([_, v]) => v === key)?.[0];
        if (settingKey) {
            settings[settingKey] = value;
        }
    }
    
    return settings;
}

function buildLawyerMaps(lawyers) {
    const rates = {};
    const emails = {};
    
    for (let i = 1; i < lawyers.length; i++) {
        const [email, name, rate, lawyerID] = lawyers[i];
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
        const clientID = row[0];
        if (!clientID) continue;
        
        clientsById[clientID] = row;
    }
    
    return clientsById;
}

// Mock constants
const SETTINGS_KEYS = {
    BASE_PAYMENT_URL: "Payment Link",
    DEFAULT_CURRENCY: "Default Currency",
    LOW_BALANCE_THRESHOLD: "Low Balance Threshold",
    DAILY_SYNC_TIME: "Daily Sync Time",
    EMAIL_NOTIFICATIONS: "Email Notifications",
    AUTO_GENERATE_INVOICES: "Auto Generate Invoices",
    INVOICE_DAY: "Invoice Day",
    SUMMARY_EMAIL_TIME: "Summary Email Time"
};

// Export all functions and constants
module.exports = {
    getSheets,
    loadSheetData,
    loadSettings,
    buildLawyerMaps,
    buildClientMap,
    SETTINGS_KEYS
}; 