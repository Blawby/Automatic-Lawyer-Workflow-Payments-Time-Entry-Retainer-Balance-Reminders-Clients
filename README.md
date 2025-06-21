# 📊 Blawby - Free Open-Source Legal Retainer Management System

A professional, IOLTA-compliant Google Sheets solution for law firms to manage retainers, track time, and handle client payments. **No coding required!**

---

## ✅ Quick Start Guide

| Step | Action           | Details                                                                 |
|------|------------------|-------------------------------------------------------------------------|
| 1    | Test the System  | Click "Run Full Daily Sync" in the Blawby menu to process sample data |
| 2    | Send Test Email  | Use "Send Test Email" to validate your email configuration |
| 3    | Connect Blawby   | Enter your Blawby payment page URL in the settings above                 |
| 4    | Add Your Team    | Add your lawyers in the section above                                    |
| 5    | Set Up Zapier    | Create a Zap that triggers on new Stripe payments → sends payment info to this sheet |
| 6    | Replace Sample Data | Delete sample rows and add your real data                              |

---

## 🧪 Testing Features

| Feature | How to Test | Expected Result |
|---------|-------------|-----------------|
| **System Validation** | Click "Send Test Email" in menu | Test email sent to verify configuration |
| **Template Validation** | Click "Validate Email Templates" | Confirms all email templates are working |
| **Client Creation** | Run "Run Full Daily Sync" with sample payments | Clients sheet populated with client1@example.com and client2@example.com |
| **Low Balance Warnings** | Add time logs to reduce balance below threshold | Professional HTML email notifications sent to clients |
| **Matter Tracking** | Time logs are linked to matters by Matter ID | Matter breakdown shown in invoices |
| **Email Notifications** | Set Email Notifications to TRUE and run sync | Receipt emails sent to sample clients |
| **Template Cache** | Click "Clear Template Cache" to refresh templates | Useful when updating email templates |

---

## 📊 Sheet Overview

| Sheet     | Purpose                                   | Editable?      |
|-----------|-------------------------------------------|----------------|
| Lawyers (in Welcome) | Manage your legal team and their rates | Yes            |
| Clients   | Track client balances and payment links   | Auto-updated   |
| TimeLogs  | Record billable hours and activities      | Yes            |
| Payments  | Track client payments (Date, Email, Amount, Payment Method) | Auto-updated   |
| Invoices  | View payment receipts and monthly summaries | Auto-updated |
| Matters   | Track client matters and case values      | Yes            |

> **Note:** Sample data is included in Payments, TimeLogs, and Matters sheets for testing. Delete these rows and add your real data.

---

## 💡 How Retainers Work

- **Automatic Client Creation** - Clients are created when they make their first payment
- **Professional Receipts** - Each payment generates a beautiful HTML receipt with current balance
- **Time Tracking** - Time is logged against the retainer balance with lawyer rates
- **Monthly Summaries** - Professional monthly summaries show hours used vs. balance
- **Smart Notifications** - Low balance warnings sent automatically with payment links
- **Payment Links** - Auto-generated payment links for easy client top-ups

---

## 📧 Email System Overview

Blawby includes a comprehensive email system with professional HTML templates. All emails are automatically handled. In test mode emails will be redirected to your firm email with a [TEST] label.

### **Active Email Types & Triggers**

| Email Type | Trigger | Recipients | Template | Subject | Purpose |
|------------|---------|------------|----------|---------|---------|
| **Payment Receipts** | New payment processed | Client + Firm | `RECEIPT` | `Payment Receipt #[ID] - Blawby` | Payment confirmation with balance update |
| **Low Balance Warnings** | Balance below target | Client + Firm | `LOW_BALANCE` | `Low Balance Alert - Blawby` | Alert client to top up retainer |
| **Daily Balance Digest** | Daily sync runs | Firm only | `DAILY_DIGEST` | `Daily Low Balance Digest - Blawby` | Summary of all low balance clients |
| **Service Resumed** | Balance goes positive | Client + Firm | `SERVICE_RESUMED` | `Service Resumed - Blawby` | Notify when services can resume |
| **Test Email** | Manual trigger | Firm only | Custom | `Welcome to Blawby` | Validate email configuration |

### **Email Content Details**

#### **1. Payment Receipts** (Most Frequent)
- **When:** Every time a client makes a payment
- **Content:** Payment confirmation, new balance, monthly usage summary
- **Includes:** Receipt ID, date, amount, currency, hours used, average rate

#### **2. Low Balance Warnings** (Critical for Business)
- **When:** Client balance falls below target balance
- **Content:** Current balance, target balance, payment link
- **Action:** Client receives payment link for easy top-up

#### **3. Daily Balance Digest** (Firm Operations)
- **When:** Daily sync runs (automated or manual)
- **Content:** Summary of all clients with low balances
- **Purpose:** Keep firm informed of client payment status

#### **4. Service Resumed Notifications** (Client Satisfaction)
- **When:** Client balance goes from negative to positive
- **Content:** Service restoration confirmation
- **Purpose:** Maintain good client relationships

### **Test Mode Behavior**
- **All emails redirected** to your firm email address
- **Subject lines prefixed** with `[TEST]`
- **Email flags cleared** daily to allow repeated testing
- **No production emails sent** until Test Mode is disabled

### **Production Mode Behavior**
- **Client emails sent** directly to clients
- **Firm notifications sent** to your firm email
- **Email flags prevent** duplicate daily emails
- **Professional HTML formatting** for all emails

---

## 🎯 Menu Features

The **Blawby** menu provides easy access to all system features:

- **Run Full Daily Sync** - Complete system synchronization (requires Test Mode)
- **Sync Payments & Clients** - Process payments and update client data
- **Send Balance Digest** - Send daily low balance summary to firm
- **Generate Invoices** - Create invoices for all clients
- **Send Test Email** - Validate email system configuration
- **Validate Email Templates** - Check all email templates are working
- **Clear Template Cache** - Refresh email templates after updates
- **Setup System** - Initial system setup and trigger creation

---

## ❓ Need Help?

- **Email:** support@blawby.com
- **Documentation:** [blawby.com/docs](https://blawby.com/docs)
- **GitHub Issues:** [Report bugs or request features](https://github.com/Blawby/Automatic-Lawyer-Workflow-Payments-Time-Entry-Retainer-Balance-Reminders-Clients/issues)

---

## ⭐ Why Use This System?

- **100% Free & Open Source** - No monthly fees or subscriptions
- **IOLTA Compliant** - Properly track and manage client trust funds
- **Professional Email System** - Beautiful HTML emails with templates
- **Google Sheets Based** - Use familiar tools you already know
- **Fully Automated** - Reduce administrative work with smart notifications
- **Secure** - Your data stays in your Google Workspace
- **Highly Customizable** - Adapt it to your firm's needs
- **Production Ready** - Robust error handling and comprehensive logging
- **Easy Testing** - Built-in testing utilities and validation tools

---

## 🚀 Quick Start for Lawyers

### 1. Get Your Copy (2 minutes)
1. [Click here to make your copy](https://docs.google.com/spreadsheets/d/1DO0IOXluqBD6QZ7cIteS1clIz6dymNy4ODbcS4cxKjY/copy)
2. Name it something like "Your Law Firm - Retainer Management"
3. Click "Make a copy"

### 2. Initial Setup (5 minutes)
1. Open the **Welcome** sheet in your copy
2. Update the **System Settings** section:
   - Enter your **Blawby Payment URL** (get this from your Blawby account)
   - Set your **Default Currency** (USD, EUR, etc.)
   - Enter your **Firm Email** address
   - Keep **Test Mode** as "TRUE" for now
3. Add your lawyers in the **Lawyers** section:
   - Enter their email, name, hourly rate, and a unique Lawyer ID
4. Click **"Setup System"** in the Blawby menu

### 3. Test the System (3 minutes)
1. Click **"Send Test Email"** to verify your email configuration
2. Click **"Run Full Daily Sync"** to process the sample data
3. Check your email for test receipts and notifications
4. Review the **Clients** sheet to see sample clients created

### 4. Connect Your Payment System (10 minutes)
1. Set up a Zapier integration:
   - Trigger: New payment in Stripe/your payment processor
   - Action: Add row to Google Sheets (your Payments sheet)
   - Map: Date, Client Email, Amount, Payment Method
2. Test with a real payment
3. Run **"Sync Payments & Clients"** to process it

### 5. Start Using (Ongoing)
1. Set **Test Mode** to "FALSE" when ready for production
2. Delete sample data and add your real clients
3. The system will automatically:
   - Create client records from payments
   - Send professional receipts
   - Track balances and send low balance alerts
   - Generate monthly summaries

---

## 🛠️ Developer Documentation

### Project Structure
```
.
├── Code.gs              # Main entry points, triggers, and menu system
├── ClientSync.gs        # Client data synchronization and balance processing
├── Constants.gs         # System constants, settings, and configuration
├── EmailFunctions.gs    # Universal email system with test mode handling
├── EmailTemplates.gs    # Professional HTML email templates with caching
├── InvoiceGeneration.gs # Invoice creation and receipt generation
└── UtilityFunctions.gs  # Helper functions, logging, and sheet access
```

### Key Components
- **Welcome**: Configuration, settings, and lawyers management
- **Clients**: Client data and balances (auto-updated)
- **Payments**: Transaction records (simplified 4-column format)
- **TimeLogs**: Billable hours and activities
- **Matters**: Case tracking and matter management
- **Invoices**: Generated invoices and receipts

### Automation Features
- **Daily Balance Sync** - Automatic client balance updates
- **Low Balance Notifications** - Professional HTML email alerts
- **Invoice Generation** - Automated invoice creation
- **Receipt Creation** - Beautiful payment receipts
- **Client Creation** - Automatic client record creation
- **Balance Updates** - Real-time balance tracking
- **Template System** - Cached, validated email templates
- **Error Handling** - Graceful error recovery and logging

### Technical Features
- **Centralized Settings** - Single source of truth for configuration
- **Universal Email Wrapper** - Handles test mode automatically
- **Template Caching** - Fast template access with validation
- **Comprehensive Logging** - Detailed operation tracking
- **Error Resilience** - Individual operation isolation
- **Menu Integration** - Easy access to all features
- **Testing Utilities** - Built-in validation and testing tools

---

## 🤝 Contributing

We welcome contributions! The codebase is now clean, modular, and well-documented.

### Getting Started
1. Check out our open issues: [GitHub Issues](https://github.com/Blawby/Automatic-Lawyer-Workflow-Payments-Time-Entry-Retainer-Balance-Reminders-Clients/issues)
2. Fork the repository
3. Make your improvements
4. Submit a pull request

### Development Guidelines
- Follow the existing code structure and patterns
- Add comprehensive logging to new functions
- Include error handling for all operations
- Test thoroughly before submitting
- Update documentation for new features

---

## 📝 Changelog

### v2.0 (Latest)
- ✨ **Major refactoring** - Clean, modular architecture
- ✨ **Professional email system** - HTML templates with caching
- ✨ **Comprehensive logging** - Detailed monitoring and debugging
- ✨ **Error resilience** - Graceful error handling throughout
- ✨ **Testing utilities** - Built-in validation and testing tools
- ✨ **Menu integration** - Easy access to all features
- ✨ **Performance optimizations** - Cached templates and efficient operations

### v1.0
- 🎉 Initial release with basic retainer management

---

> For more help, see the Welcome sheet in your copy of the spreadsheet, or contact support@blawby.com. 