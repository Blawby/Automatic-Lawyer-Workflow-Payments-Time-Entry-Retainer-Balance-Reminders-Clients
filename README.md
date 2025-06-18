# Blawby Retainer Management

A simple, powerful spreadsheet system for managing legal retainers, built with Google Sheets and Apps Script.

## 🚀 Quick Start Guide

### 1. Make a Copy
1. Open this [template spreadsheet](https://docs.google.com/spreadsheets/d/your-template-id/copy)
2. Click "Make a Copy" to create your own version
3. Rename it to something like "Your Law Firm - Retainer Management"

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

### Daily Operations
- **Time Logging**: Record hours in the TimeLogs sheet
- **Matter Management**: Track cases and their values
- **Balance Monitoring**: Check client balances in the Clients sheet
- **Payment Tracking**: View all payments in the Payments sheet

## ⚙️ System Settings

All settings are managed in the Welcome sheet:

| Setting | Description | Default |
|---------|-------------|---------|
| Blawby Payment URL | Your payment page URL | https://app.blawby.com/pay |
| Default Currency | Currency for all payments | USD |
| Low Balance Threshold | Amount that triggers alerts | $1000 |
| Email Notifications | Enable/disable email alerts | true |

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
1. Deploy directly from the Apps Script editor
2. Set up triggers for automated functions
3. Verify deployment by running test functions

## 📝 License
MIT License - See LICENSE file for details 