const assert = require('assert');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

// Import our test runner's mock environment
require('./test_runner');

// Import mock utilities and assign to global
const mockUtils = require('./mock_utils');
Object.entries(mockUtils).forEach(([k, v]) => { global[k] = v; });

// Import real sync logic
const {
    syncPaymentsAndClients
} = require('./real_logic');

async function testOnboardingFlow() {
    console.log('🧪 Starting onboarding flow test...');
    try {
        // 1. Check welcome sheet exists and has instructions
        const welcomePath = path.join(__dirname, 'welcome.csv');
        assert(fs.existsSync(welcomePath), 'Welcome sheet (welcome.csv) should exist');
        const welcomeContent = fs.readFileSync(welcomePath, 'utf8');
        const welcomeRows = csv.parse(welcomeContent, { columns: false });
        assert(welcomeRows.length > 5, 'Welcome sheet should have onboarding instructions');
        const hasQuickStart = welcomeRows.some(row => row.join(' ').toLowerCase().includes('quick start'));
        assert(hasQuickStart, 'Welcome sheet should mention Quick Start setup');
        console.log('✅ Welcome sheet present and contains onboarding instructions');

        // 2. Simulate editing settings in the settings sheet
        const settingsPath = path.join(__dirname, 'settings.csv');
        assert(fs.existsSync(settingsPath), 'Settings sheet (settings.csv) should exist');
        let settingsContent = fs.readFileSync(settingsPath, 'utf8');
        let settingsRows = csv.parse(settingsContent, { columns: false });
        // Simulate user entering a payment URL and currency
        let edited = false;
        for (let i = 1; i < settingsRows.length; i++) {
            if (settingsRows[i][0] === 'Payment Link') {
                settingsRows[i][1] = 'https://app.blawby.com/testuser/pay';
                edited = true;
            }
            if (settingsRows[i][0] === 'Default Currency') {
                settingsRows[i][1] = 'USD';
                edited = true;
            }
        }
        assert(edited, 'Settings should be editable by user');
        // Write back simulated edits (in-memory for test)
        // (In a real test, you might mock the sheet object to reflect these changes)
        console.log('✅ User can edit settings in the welcome/settings sheet');

        // 3. Run sheet setup logic
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheets = getSheets(ss);
        setupAllSheets(sheets);
        // Check that all required sheets exist and have headers
        const requiredSheets = [
            'paymentsSheet', 'clientsSheet', 'timeLogsSheet', 'lawyersSheet',
            'settingsSheet', 'lowBalanceSheet', 'invoicesSheet', 'mattersSheet'
        ];
        requiredSheets.forEach(sheetKey => {
            assert(sheets[sheetKey], `Sheet ${sheetKey} should exist after setup`);
            const headers = sheets[sheetKey].getDataRange().getValues()[0];
            assert(headers && headers.length > 2, `Sheet ${sheetKey} should have headers`);
        });
        console.log('✅ All required sheets are set up with headers');

        // 4. Run first sync
        const syncResult = syncPaymentsAndClients();
        assert(syncResult.clientsById, 'clientsById should be returned after first sync');
        assert(Object.keys(syncResult.clientsById).length > 0, 'There should be at least one client after first sync');
        console.log('✅ First sync completed and system is ready for use');

        console.log('\n✨ Onboarding flow test completed successfully!');
    } catch (error) {
        console.error('❌ Onboarding test failed:', error);
        process.exit(1);
    }
}

testOnboardingFlow(); 