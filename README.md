# Blawby Google Sheets Integration

A Google Apps Script integration for managing legal retainers, client payments, and invoicing through Google Sheets.

## Template Access

- **Template Spreadsheet**: [Blawby Retainer Management Template](https://docs.google.com/spreadsheets/d/e/2PACX-1vTkw4BXHelve9SssCVKzkSRI2ElldT6BmkfKhCv9v8VEC8t6IYOIV8EaB0--EmTkB7GJXaoSMjboxp7/pubhtml)
- **Web App URL**: https://script.google.com/macros/s/AKfycbyoXtrqgStstN_h0jwHLePeSs9N3YUFOa5pVMGoU1q828sHoGzx_iLY0nk-wTygHs2u/exec
- **Library URL**: https://script.google.com/macros/library/d/1cumtsBoAthgsWi2RJZK9JlDXa_dJJWHgDZl7aJ6o1Vc-tjTNrc1qygLO/1

## Project Structure

```
.
├── Code.gs              # Main entry points and core functionality
├── ClientSync.gs        # Client data synchronization
├── Constants.gs         # System constants and configuration
├── EmailFunctions.gs    # Email handling and notifications
├── EmailTemplates.gs    # Email template definitions
├── InvoiceGeneration.gs # Invoice creation and processing
└── UtilityFunctions.gs # Helper functions and utilities
```

## Features

- **Client Management**: Track client information, balances, and payment history
- **Payment Processing**: Automatically process and record client payments
- **Invoice Generation**: Automated invoice generation on specified days
- **Time Tracking**: Record and manage billable hours
- **Balance Monitoring**: Track retainer balances and notify when top-up is needed
- **Email Notifications**: Automated email notifications for invoices and low balances

## Sheet Structure

The system uses multiple sheets:

1. **Clients**: Tracks client information and balances
   - Email
   - Name
   - Target Balance
   - Total Paid
   - Total Hours
   - Total Used
   - Balance
   - Top Up Amount
   - Payment Link
   - Client ID

2. **Payments**: Records all payment transactions
   - Date
   - Description
   - Client Email
   - Amount
   - Currency
   - Status
   - Receipt ID

3. **Time Logs**: Records billable hours
   - Date
   - Client Email
   - Matter ID
   - Hours
   - Description

4. **Settings**: System configuration
   - Payment Link
   - Default Currency
   - Target Balance Percentage
   - Minimum Target Balance
   - Low Balance Threshold
   - Email Notifications Toggle
   - Auto Invoice Generation Toggle
   - Invoice Day
   - Test Mode Toggle

## Setup Instructions

1. Open the [template spreadsheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vTkw4BXHelve9SssCVKzkSRI2ElldT6BmkfKhCv9v8VEC8t6IYOIV8EaB0--EmTkB7GJXaoSMjboxp7/pubhtml)
2. Make a copy for your own use
3. Go to Extensions > Apps Script
4. The script files will be automatically included
5. Deploy as a web app:
   - Click "Deploy" > "New deployment"
   - Choose "Web app"
   - Set "Execute as" to your account
   - Set "Who has access" to appropriate level
   - Click "Deploy"

## Usage

The system runs automatically based on the configured triggers. Each sheet includes instruction rows that explain the required format and valid values for each column.

### Adding New Clients

1. Add client information to the Clients sheet
2. The system will automatically generate a client ID
3. Client will be tracked for payments and time logs

### Recording Payments

1. Add payment information to the Payments sheet
2. System will automatically:
   - Update client balance
   - Create new client if not exists
   - Track payment status

### Recording Time

1. Add time entries to the Time Logs sheet
2. System will automatically:
   - Update client's used hours
   - Adjust balance based on hourly rate
   - Track remaining retainer balance

## Maintenance

The system includes data validation and instruction rows in each sheet. These rows are protected and provide guidance for data entry. The system automatically skips these rows during processing.

## Error Handling

- Invalid email addresses are logged and skipped
- Invalid payment amounts are ignored
- Instruction rows are automatically filtered out
- Data validation ensures proper format for critical fields

## Security

- Email validation prevents invalid addresses
- Sheet protection prevents accidental modification of instruction rows
- OAuth scopes limited to required functionality
- No sensitive data stored in script properties

## Support

For issues or questions:
- Email: support@blawby.com
- Documentation: blawby.com/docs

## 🚀 Quick Start Guide

### 1. Make a Copy
To get started with your own copy of the template:

**Option 1: Direct Link**
1. Visit [https://docs.google.com/spreadsheets/d/YOUR-TEMPLATE-ID/copy](https://docs.google.com/spreadsheets/d/YOUR-TEMPLATE-ID/copy)
2. Click "Make a Copy" when prompted
3. Choose a name for your copy (e.g., "Your Law Firm - Retainer Management")

**Option 2: Web App Link (If Direct Link Doesn't Work)**
1. Visit [https://script.google.com/macros/s/YOUR-DEPLOYMENT-ID/exec](https://script.google.com/macros/s/YOUR-DEPLOYMENT-ID/exec)
2. You'll be automatically redirected to make a copy
3. Follow the prompts to create your copy

> Note: If you get a "Script function not found: doGet" error, please use Option 1 or contact support for the correct link.

### 2. Set Up Your Firm
1. Open the "Welcome" sheet
2. In the System Settings section:
   - Enter your Blawby payment page URL
   - Set your default currency (e.g., USD)
   - Set your low balance threshold (e.g., $1000)
   - Enable/disable email notifications
   - Enable Test Mode to try the system safely

### 3. Test Mode
When Test Mode is enabled:
- All emails will be sent to your firm's email instead of clients
- You can safely test all features without affecting real clients
- Sample data will be generated automatically
- Real payments won't be processed
- All automated functions will work but in a safe way
- Use the "Blawby" menu to manually trigger the daily sync process
  - Click "Blawby" in the menu bar
  - Select "Run Daily Sync" to test the full process
  - Check your email for the test digest

### 4. Add Your Team
1. Go to the "Lawyers" sheet
2. Add each lawyer with their:
   - Email address
   - Full name
   - Hourly rate
   - A unique ID (e.g., their initials)

### 5. Connect Payments
1. Set up a Zapier integration:
   - Trigger: New payment in Stripe
   - Action: Add row to Google Sheet
   - Map the payment data to the "Payments" sheet columns

### 6. Start Using
- Clients are automatically created when they make their first payment
- Time logs are recorded in the "TimeLogs" sheet
- Monthly summaries are generated automatically
- Low balance alerts are sent automatically
- Payment links are generated for easy top-ups

## 📊 Sheet Overview

| Sheet | Purpose | Editable? |
|-------|---------|-----------|
| Lawyers | Manage your legal team and rates | Yes |
| Clients | Track client balances and payments | Auto-updated |
| TimeLogs | Record billable hours | Yes |
| Payments | Track client payments | Auto-updated |
| Invoices | View receipts and summaries | Auto-updated |
| Matters | Track client matters | Yes |

## 💡 How It Works

### Automatic Features
- **Client Creation**: New clients are added automatically with their first payment
- **Balance Tracking**: Client balances are updated in real-time
- **Receipts**: Automatic receipts are generated for each payment
- **Monthly Summaries**: Sent automatically at the start of each month
- **Low Balance Alerts**: Sent when client balance falls below threshold
- **Payment Links**: Generated automatically for easy client top-ups
- **Invoice Generation**: Automatic invoice generation on specified days with data validation
- **Data Validation**: Built-in validation for all input fields to ensure data integrity

### Daily Operations
- **Time Logging**: Record hours in the TimeLogs sheet with validated inputs
- **Matter Management**: Track cases and their values with automatic client name updates
- **Balance Monitoring**: Check client balances in the Clients sheet
- **Payment Tracking**: View all payments in the Payments sheet
- **Invoice Management**: View and manage invoices with automatic generation

## ⚙️ System Settings

All settings are managed in the Welcome sheet:

| Setting | Description | Default |
|---------|-------------|---------|
| Blawby Payment URL | Your payment page URL | https://app.blawby.com/pay |
| Default Currency | Currency for all payments | USD |
| Low Balance Threshold | Amount that triggers alerts | $1000 |
| Email Notifications | Enable/disable email alerts | true |
| Auto Generate Invoices | Enable/disable automatic invoice generation | true |
| Invoice Day | Day of month to generate invoices | 1 |
| Target Balance Percentage | Percentage of case value for target balance | 10% |
| Minimum Target Balance | Minimum target balance amount | $500 |

## ❓ Need Help?

- **Email**: support@blawby.com
- **Documentation**: blawby.com/docs
- **Video Tutorials**: Coming soon!

---

## 🛠️ For Developers

### Project Structure
```
.
├── Code.gs              # Main entry points and triggers
├── ClientSync.gs        # Client and payment sync functionality
├── Constants.gs         # Constants and configurations
├── EmailFunctions.gs    # Email functionality
├── EmailTemplates.gs    # Email templates
├── InvoiceGeneration.gs # Invoice generation
├── UtilityFunctions.gs  # Utility functions
└── README.md           # This file
```

### Development Setup
1. Open the Google Apps Script editor
2. Copy all `.gs` files into the project
3. Set up the spreadsheet with the Welcome sheet

### Key Features
- Daily sync at 6 AM
- Automatic client creation
- Real-time balance tracking
- Email notifications
- Monthly summaries
- Low balance alerts

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Testing
- Use the Apps Script debugger
- Add `console.log()` statements for debugging
- Test functions manually in the Apps Script editor

### Deployment
1. Deploy as a web app:
   - Open the Apps Script editor
   - Click "Deploy" > "New deployment"
   - Choose "Web app" as the type
   - Set "Execute as" to "Me"
   - Set "Who has access" to "Anyone"
   - Click "Deploy"
2. Update the template ID in `doGet()` function
3. Share the deployment URL or direct spreadsheet copy link
4. Test both access methods before sharing with users

## 📝 License
MIT License - See LICENSE file for details 