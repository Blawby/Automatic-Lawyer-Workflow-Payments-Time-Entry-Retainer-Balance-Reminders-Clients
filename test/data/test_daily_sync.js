const assert = require('assert');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

// Import our test runner's mock environment
require('./test_runner');

// Import mock utilities
const mockUtils = require('./mock_utils');
// Assign all mock utility functions/constants to global
Object.entries(mockUtils).forEach(([k, v]) => { global[k] = v; });

// Import real sync logic
const {
    syncPaymentsAndClients,
    generateInvoices,
    sendDailyBalanceDigest
} = require('./real_logic');

// Mock ScriptApp for triggers
global.ScriptApp = {
    getProjectTriggers: () => [],
    newTrigger: () => ({
        timeBased: () => ({
            atHour: () => ({
                nearMinute: () => ({
                    everyDays: () => ({
                        create: () => ({})
                    })
                })
            })
        })
    })
};

// Mock PropertiesService
global.PropertiesService = {
    getScriptProperties: () => ({
        getProperty: () => null,
        setProperty: () => {}
    })
};

// Mock Session
global.Session = {
    getActiveUser: () => ({
        getEmail: () => 'test@example.com'
    })
};

// Test daily sync process
async function testDailySync() {
    console.log('🧪 Starting daily sync test...');
    try {
        // 1. Test sheet setup
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheets = getSheets(ss);
        assert(sheets.clientsSheet, 'Clients sheet should exist');
        assert(sheets.paymentsSheet, 'Payments sheet should exist');
        assert(sheets.timeLogsSheet, 'TimeLogs sheet should exist');
        assert(sheets.lawyersSheet, 'Lawyers sheet should exist');
        assert(sheets.settingsSheet, 'Settings sheet should exist');
        assert(sheets.invoicesSheet, 'Invoices sheet should exist');
        assert(sheets.mattersSheet, 'Matters sheet should exist');
        console.log('✅ Sheets initialized:', Object.keys(sheets));

        // 2. Test settings loading
        const settings = loadSettings(sheets.settingsSheet);
        assert(settings[SETTINGS_KEYS.DEFAULT_CURRENCY], 'Default currency should be set');
        assert(settings[SETTINGS_KEYS.BASE_PAYMENT_URL], 'Base payment URL should be set');
        console.log('✅ Settings loaded:', settings);

        // 3. Test data loading
        const data = loadSheetData(sheets);
        assert(data.clientData.length > 1, 'There should be at least one client');
        assert(data.paymentData.length > 1, 'There should be at least one payment');
        console.log('✅ Data loaded:');
        console.log('- Payments:', data.paymentData.length - 1, 'records');
        console.log('- Clients:', data.clientData.length - 1, 'records');
        console.log('- Time Logs:', data.timeLogs.length - 1, 'records');
        console.log('- Lawyers:', data.lawyers.length - 1, 'records');
        console.log('- Matters:', data.matters.length - 1, 'records');

        // 4. Test client sync (real logic)
        const syncResult = syncPaymentsAndClients();
        assert(syncResult.clientsById, 'clientsById should be returned');
        assert(Object.keys(syncResult.clientsById).length > 0, 'There should be at least one client in clientsById');
        console.log('✅ Client sync completed');

        // 5. Test invoice generation (real logic)
        const invoiceResult = generateInvoices();
        assert(invoiceResult === true, 'Invoice generation should return true');
        console.log('✅ Invoice generation completed');

        // 6. Test email notifications (real logic)
        const digestResult = sendDailyBalanceDigest();
        assert(digestResult === true, 'Daily balance digest should return true');
        console.log('✅ Email notifications completed');

        console.log('\n✨ All tests completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testDailySync(); 