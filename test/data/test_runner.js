const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

// Mock Google Apps Script environment
global.SpreadsheetApp = {
    getActiveSpreadsheet: () => ({
        getSheetByName: (sheetName) => {
            const filename = sheetName.toLowerCase().replace(/\s+/g, '') + '.csv';
            const filePath = path.join(__dirname, filename);
            
            if (!fs.existsSync(filePath)) {
                console.error(`Sheet ${sheetName} not found in test data`);
                return null;
            }

            const content = fs.readFileSync(filePath, 'utf-8');
            const records = csv.parse(content, {
                columns: true,
                skip_empty_lines: true
            });

            return {
                getDataRange: () => ({
                    getValues: () => {
                        const headers = Object.keys(records[0]);
                        return [
                            headers,
                            ...records.map(record => headers.map(header => record[header]))
                        ];
                    }
                }),
                getRange: (row, col, numRows, numCols) => ({
                    setValues: (values) => {
                        console.log(`Setting values in ${sheetName}:`, values);
                    }
                })
            };
        }
    })
};

global.MailApp = {
    sendEmail: (to, subject, body) => {
        console.log('Sending email:', { to, subject, body });
    }
};

global.Utilities = {
    formatDate: (date, timeZone, format) => {
        return date.toISOString().split('T')[0];
    }
};

// Load and run test functions
function runTests() {
    console.log('Running tests...');
    
    // Example test: Check client balances
    const clientsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Clients');
    const clientsData = clientsSheet.getDataRange().getValues();
    console.log('Clients data:', clientsData);

    // Example test: Check payments
    const paymentsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Payments');
    const paymentsData = paymentsSheet.getDataRange().getValues();
    console.log('Payments data:', paymentsData);

    // Add more test cases here
}

// Run the tests
runTests(); 