const fs = require('fs');
const path = require('path');

// Helper function to write CSV files
function writeCSV(filename, headers, data) {
    const csvContent = [
        headers.join(','),
        ...data.map(row => row.join(','))
    ].join('\n');
    
    fs.writeFileSync(path.join(__dirname, filename), csvContent);
    console.log(`Created ${filename}`);
}

// Generate test data
function generateTestData() {
    // Welcome Sheet
    writeCSV('welcome.csv', [
        'Section',
        'Content',
        'Details',
        'Value'
    ], [
        ['Title', 'Welcome to Your Blawby Retainer Tracker', '', ''],
        ['Description', 'Your all-in-one system to manage retainers, track time, bill clients, and stay compliant — all automatically.', '', ''],
        ['', '', '', ''],
        ['Configuration', '⚙️ System Settings (Edit These Values)', '', ''],
        ['Setting 1', 'Blawby Payment URL', 'Your Blawby payment page URL (e.g. https://app.blawby.com/...)', 'https://app.blawby.com/pay'],
        ['Setting 2', 'Default Currency', 'Default currency for all payments (USD, EUR, etc.)', 'USD'],
        ['Setting 3', 'Low Balance Threshold', 'Amount in default currency that triggers low balance alerts', '1000'],
        ['Setting 4', 'Daily Sync Time', 'Time for daily sync (24-hour format, e.g. 01:00)', '01:00'],
        ['Setting 5', 'Email Notifications', 'Send email notifications (true/false)', 'true'],
        ['Setting 6', 'Auto-Generate Invoices', 'Automatically generate monthly invoices (true/false)', 'true'],
        ['Setting 7', 'Invoice Day', 'Day of month to generate invoices (1-31)', '1'],
        ['Setting 8', 'Summary Email Time', 'Time to send daily summary (24-hour format)', '06:30'],
        ['', '', '', ''],
        ['Quick Start', '✅ Quick Start Setup (Do This Once)', '', ''],
        ['Step 1', 'Connect Blawby', 'Use your Blawby payment page URL from settings above. We\'ll use this to auto-generate top-up links.', ''],
        ['Step 2', 'Set Up the Zapier Webhook', 'Create a Zap that triggers on new Stripe payment → sends payment info to this sheet\'s Payments tab (columns: Date, Client Email, Amount, Method, Notes). This kicks off automation.', ''],
        ['Step 3', 'Add Your Legal Team', 'In the Lawyers tab, enter each lawyer\'s ID, name, hourly rate, email, and optionally a currency (USD, EUR, etc). This drives time tracking and email notifications.', ''],
        ['Step 4', 'Start Logging Time', 'Every task should be entered in the TimeLogs tab. One row per task: Date, Client Email, Lawyer ID, Hours, Notes. We\'ll do the rest.', ''],
        ['Step 5', 'Stay Hands-Off', 'The system auto-calculates balances, sends low-retainer emails to clients, creates invoices, and gives you daily summaries. You don\'t need to touch the math or email.', ''],
        ['', '', '', ''],
        ['Automation', '🧠 How Automation Works', '', ''],
        ['Flow 1', 'Payment Info', 'flows into the Payments tab (via Zapier).', ''],
        ['Flow 2', 'Time Entries', 'go into TimeLogs and are multiplied by lawyer rates.', ''],
        ['Flow 3', 'Balances', 'are calculated based on total paid vs. used.', ''],
        ['Flow 4', 'Low Balance Alerts', 'are automatically emailed to clients (and CC\'d to the lawyer).', ''],
        ['Flow 5', 'Invoices', 'are auto-generated monthly and logged in the Invoices tab.', ''],
        ['Flow 6', 'Daily Summary', 'email is sent to all lawyers at 6–7am with time totals, payments, and any warnings.', ''],
        ['', '', '', ''],
        ['Editable Tabs', '🛠 Tabs You Should Edit', '', ''],
        ['Tab 1', 'Lawyers', 'Add/edit lawyers with their ID, name, rate, email', ''],
        ['Tab 2', 'TimeLogs', 'Add work entries – 1 row per task', ''],
        ['Tab 3', 'Payments', 'Filled via Zapier – but you can manually add rows too', ''],
        ['', '', '', ''],
        ['Auto Tabs', '🔒 Tabs That Run Themselves', '', ''],
        ['Auto 1', 'Clients', 'All balances and links are calculated – don\'t edit manually', ''],
        ['Auto 2', 'Invoices', 'Generated automatically each month from logged time', ''],
        ['Auto 3', 'Summary', 'Tracks daily activity stats and email logs', ''],
        ['', '', '', ''],
        ['Tips', 'ℹ️ Notes & Tips', '', ''],
        ['Tip 1', 'Target balances', 'are auto-calculated based on your highest hourly rate if left blank.', ''],
        ['Tip 2', 'Payment links', 'are Blawby-hosted and prefilled with the client\'s top-up amount.', ''],
        ['Tip 3', 'Currency support', 'is coming from your Lawyers tab. If missing, defaults to USD.', ''],
        ['', '', '', ''],
        ['Example', '🧑‍💼 Example: A Typical Day', '', ''],
        ['Ex 1', 'Time Entry', 'Jane logs 2 hours for Client A in TimeLogs.', ''],
        ['Ex 2', 'Payment', 'Payment comes in via Stripe → Zapier logs it in Payments.', ''],
        ['Ex 3', 'Balance Update', 'Our script updates Client A\'s balance.', ''],
        ['Ex 4', 'Low Balance', 'If their balance drops below target, we email them (CC Jane).', ''],
        ['Ex 5', 'Summary', 'At 6:30am next day, Jane gets a summary email with totals + activity.', ''],
        ['', '', '', ''],
        ['Support', '💬 Need Help?', '', ''],
        ['Contact 1', 'Email', 'support@blawby.com', ''],
        ['Contact 2', 'Documentation', 'blawby.com/docs for full walkthroughs', '']
    ]);

    // Settings (now populated from welcome sheet)
    writeCSV('settings.csv', [
        'Key',
        'Value',
        'Description'
    ], [
        ['BASE_PAYMENT_URL', 'https://app.blawby.com/pay', 'Base URL for payment links'],
        ['DEFAULT_CURRENCY', 'USD', 'Default currency for payments'],
        ['LOW_BALANCE_THRESHOLD', '1000', 'Balance threshold for low balance warnings'],
        ['DAILY_SYNC_TIME', '01:00', 'Time for daily sync (24-hour format)'],
        ['EMAIL_NOTIFICATIONS', 'true', 'Send email notifications'],
        ['AUTO_GENERATE_INVOICES', 'true', 'Automatically generate monthly invoices'],
        ['INVOICE_DAY', '1', 'Day of month to generate invoices'],
        ['SUMMARY_EMAIL_TIME', '06:30', 'Time to send daily summary']
    ]);

    // Clients
    writeCSV('clients.csv', [
        'Client ID',
        'Email',
        'Name',
        'Target Balance',
        'Status',
        'Last Updated'
    ], [
        ['CLI001', 'client1@example.com', 'John Doe', '5000', 'ACTIVE', '2024-03-20'],
        ['CLI002', 'client2@example.com', 'Jane Smith', '3000', 'ACTIVE', '2024-03-20'],
        ['CLI003', 'client3@example.com', 'Bob Johnson', '2000', 'PAUSED', '2024-03-20']
    ]);

    // Payments
    writeCSV('payments.csv', [
        'Payment ID',
        'Client Email',
        'Amount',
        'Currency',
        'Date',
        'Status',
        'Payment Link'
    ], [
        ['PAY001', 'client1@example.com', '5000', 'USD', '2024-03-01', 'COMPLETED', 'https://example.com/pay/PAY001'],
        ['PAY002', 'client2@example.com', '3000', 'USD', '2024-03-05', 'COMPLETED', 'https://example.com/pay/PAY002'],
        ['PAY003', 'client3@example.com', '2000', 'USD', '2024-03-10', 'COMPLETED', 'https://example.com/pay/PAY003']
    ]);

    // Lawyers
    writeCSV('lawyers.csv', [
        'Lawyer ID',
        'Name',
        'Email',
        'Rate',
        'Status'
    ], [
        ['LAW001', 'Alice Brown', 'alice@example.com', '250', 'ACTIVE'],
        ['LAW002', 'Charlie Davis', 'charlie@example.com', '300', 'ACTIVE']
    ]);

    // Time Logs
    writeCSV('timelogs.csv', [
        'Date',
        'Client ID',
        'Matter ID',
        'Lawyer ID',
        'Hours',
        'Description'
    ], [
        ['2024-03-20', 'CLI001', 'MAT001', 'LAW001', '2.5', 'Initial consultation'],
        ['2024-03-20', 'CLI002', 'MAT002', 'LAW002', '1.5', 'Document review'],
        ['2024-03-20', 'CLI003', 'MAT003', 'LAW001', '3.0', 'Case strategy meeting']
    ]);

    // Matters
    writeCSV('matters.csv', [
        'Matter ID',
        'Client ID',
        'Client Name',
        'Description',
        'Value',
        'Status',
        'Created Date',
        'Last Updated'
    ], [
        ['MAT001', 'CLI001', 'John Doe', 'Corporate Formation', '10000', 'ACTIVE', '2024-03-01', '2024-03-20'],
        ['MAT002', 'CLI002', 'Jane Smith', 'Contract Review', '5000', 'ACTIVE', '2024-03-05', '2024-03-20'],
        ['MAT003', 'CLI003', 'Bob Johnson', 'Legal Consultation', '3000', 'ACTIVE', '2024-03-10', '2024-03-20']
    ]);

    // Invoices
    writeCSV('invoices.csv', [
        'Month',
        'Client Email',
        'Client Name',
        'Total Hours',
        'Total Used',
        'Lawyers Involved',
        'Matters',
        'Invoice ID',
        'Client ID',
        'Invoice Date',
        'Status'
    ], [
        ['2024-03', 'client1@example.com', 'John Doe', '2.5', '625', 'Alice Brown', 'Corporate Formation', 'INV001', 'CLI001', '2024-03-20', 'DRAFT'],
        ['2024-03', 'client2@example.com', 'Jane Smith', '1.5', '450', 'Charlie Davis', 'Contract Review', 'INV002', 'CLI002', '2024-03-20', 'DRAFT']
    ]);

    // Low Balance Warnings
    writeCSV('lowbalance.csv', [
        'Client ID',
        'Email',
        'Name',
        'Balance',
        'Target Balance',
        'Last Warning Date'
    ], [
        ['CLI003', 'client3@example.com', 'Bob Johnson', '500', '2000', '2024-03-20']
    ]);
}

// Run the generator
generateTestData(); 