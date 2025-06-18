# 📊 Free Open-Source Legal Retainer Management System

A free, IOLTA-compliant Google Sheets solution for law firms to manage retainers, track time, and handle client payments. No coding required!

## ⭐ Why Use This System?

- **100% Free & Open Source**: No monthly fees or subscriptions
- **IOLTA Compliant**: Properly track and manage client trust funds
- **Google Sheets Based**: Use familiar tools you already know
- **Automated**: Reduce administrative work with automatic notifications and tracking
- **Secure**: Your data stays in your Google Workspace
- **Customizable**: Adapt it to your firm's needs

## 🚀 Quick Start for Lawyers

### 1. Get Your Copy (2 minutes)
1. [Click here to make your copy](https://docs.google.com/spreadsheets/d/1DO0IOXluqBD6QZ7cIteS1clIz6dymNy4ODbcS4cxKjY/copy)
2. Name it something like "Your Law Firm - Retainer Management"
3. Click "Make a copy"

### 2. Initial Setup (5 minutes)
1. Open the "Welcome" sheet
2. Fill in your settings:

| Setting | Value | Description | Default | Required? |
|---------|-------|-------------|---------|-----------|
| Blawby Payment URL | Your URL | Your payment page URL | https://app.blawby.com/pay | Yes |
| Default Currency | USD | Currency for all payments | USD | Yes |
| Low Balance Threshold | 1000 | Amount that triggers alerts | 1000 | Yes |
| Email Notifications | true | Send email notifications | true | Yes |
| Test Mode | true | Enable test mode to try the system | false | Yes |
| Target Balance % | 10 | % of case value for target balance | 10 | Optional |
| Min Target Balance | 500 | Minimum target balance | 500 | Optional |
| Invoice Day | 1 | Day of month to generate invoices | 1 | Optional |

3. Enable "Test Mode" to safely try the system

### 3. Add Your Team (5 minutes)
1. Go to the "Lawyers" sheet
2. For each lawyer, add:
   - Email address
   - Full name
   - Hourly rate (e.g., 250)
   - Unique ID (usually initials, e.g., "JDS")

### 4. Test the System (15 minutes)
With Test Mode ON, follow these steps in order:

1. **Add a Test Client**
   - Go to "Clients" sheet
   - Add a row with:
     - Email: your-test@email.com
     - Name: Test Client
     - Target Balance: 2500

2. **Record a Test Payment**
   - Go to "Payments" sheet
   - Add a row with:
     - Date: Today's date
     - Client Email: your-test@email.com
     - Amount: 2500
     - Currency: USD
     - Status: Completed
     - Receipt ID: TEST-001

3. **Create a Test Matter**
   - Go to "Matters" sheet
   - Add a row with:
     - Matter ID: M-2024-001
     - Client Email: your-test@email.com
     - Description: Test Legal Matter
     - Status: Active

4. **Log Some Time**
   - Go to "TimeLogs" sheet
   - Add a row with:
     - Date: Today's date
     - Client Email: your-test@email.com
     - Matter ID: M-2024-001
     - Lawyer ID: (use ID from Lawyers sheet)
     - Hours: 2.5

5. **Run the Sync**
   - Click "Blawby" menu → "Run Daily Sync"
   - Check your email for test notifications
   - Verify in "Clients" sheet that:
     - Balance updated (Payment - Time logged)
     - Payment link generated if below target

### 5. Set Up Payment Integration (10 minutes)
Choose one:

**Option A: Zapier Integration (Recommended)**
1. Create a new Zap in Zapier
2. Trigger: "New Payment" in your payment system
   - Works with Stripe, PayPal, LawPay, etc.
3. Action: "Create Spreadsheet Row" in Google Sheets
4. Connect to your copy of the spreadsheet
5. Select "Payments" sheet
6. Map the fields:
   - Date → Payment date
   - Client Email → Customer email
   - Amount → Payment amount
   - Currency → Payment currency
   - Status → "Completed"
   - Receipt ID → Payment/Invoice ID

**Option B: Manual Entry**
1. Go to "Payments" sheet
2. Add new row for each payment received
3. System will automatically:
   - Create new client if needed
   - Update balances
   - Send receipt
   - Generate payment link if needed

### 6. Go Live! (5 minutes)
Once everything is tested:
1. Turn off Test Mode in Welcome sheet
2. Clear any test data from sheets
3. Start using with real clients
4. Monitor daily digest emails

## 📱 Daily Usage Guide

### Managing Clients
- **New Clients**: Add them to the "Clients" sheet or let the system create them automatically with first payment
- **Retainer Tracking**: System automatically tracks balances
- **Low Balance Alerts**: Automatic notifications when funds run low

### Time Entry
1. Open "TimeLogs" sheet
2. Enter:
   - Date
   - Client Email
   - Matter ID
   - Hours
3. System automatically:
   - Updates client balance
   - Tracks billable hours
   - Sends alerts if balance gets low

### Payment Processing
1. Record payments in "Payments" sheet
2. System automatically:
   - Updates client balance
   - Generates receipt
   - Sends confirmation email
   - Creates new client if needed

### Reports & Monitoring
- **Client Balances**: Always current in "Clients" sheet
- **Monthly Summaries**: Automatically generated
- **Payment History**: Tracked in "Payments" sheet
- **Time Reports**: Available in "TimeLogs"

## ❓ Common Questions

### Is this really free?
Yes! This is an open-source project to help law firms manage retainers without expensive software.

### Is it IOLTA compliant?
Yes, the system is designed to properly track client trust funds and maintain clear records of all transactions.

### What if I need help?
- Email: support@blawby.com
- Documentation: blawby.com/docs
- Community Support: [GitHub Issues](https://github.com/Blawby/google-sheet-blawby/issues)

### Can I customize it?
Yes! The system is open source and built on Google Sheets. You can modify it to fit your needs.

---

# 🛠️ Developer Documentation

## Technical Overview
This is an open-source Google Apps Script project that turns Google Sheets into a legal practice management system.

### Core Features
- Client trust accounting
- Time tracking
- Payment processing
- Automated notifications
- Invoice generation
- Balance monitoring

### Project Structure
```
.
├── Code.gs              # Main entry points and triggers
├── ClientSync.gs        # Client data synchronization
├── Constants.gs         # System constants and config
├── EmailFunctions.gs    # Email notifications
├── EmailTemplates.gs    # Email templates
├── InvoiceGeneration.gs # Invoice creation
└── UtilityFunctions.gs # Helper functions
```

### Key Components

#### Sheets Structure
1. **Welcome**: Configuration and settings
2. **Clients**: Client data and balances
3. **Payments**: Transaction records
4. **TimeLogs**: Billable hours
5. **Lawyers**: Team member data
6. **Matters**: Case tracking
7. **Invoices**: Generated invoices

#### Automation Features
- Daily balance sync
- Low balance notifications
- Invoice generation
- Receipt creation
- Client creation
- Balance updates

### Development Setup

1. Clone the repository
2. Open in Google Apps Script editor
3. Set up test environment:
   ```javascript
   // Enable test mode in Welcome sheet
   // Use test email addresses
   // Set lower thresholds for testing
   ```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Security Considerations

- OAuth scopes are limited
- Data validation on all inputs
- Protected instruction rows
- Email verification
- Test mode for safe testing

### API Documentation

#### Key Functions
- `manualDailySync()`: Triggers daily processing
- `processNewPayments()`: Handles payment records
- `generateInvoices()`: Creates client invoices
- `sendNotifications()`: Manages email alerts

#### Configuration
All system settings are managed in the Welcome sheet:
- Payment URLs
- Thresholds
- Email settings
- Automation toggles

### Testing

1. Enable test mode
2. Use sample data
3. Verify email notifications
4. Check balance calculations
5. Validate invoice generation

### License
MIT License - See LICENSE file for details 