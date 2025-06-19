# 📊 Blawby - Free Open-Source Legal Retainer Management System

A professional, IOLTA-compliant Google Sheets solution for law firms to manage retainers, track time, and handle client payments. **No coding required!**

---

## ✨ What's New in v2.0

### 🚀 **Major Improvements**
- **Centralized Settings Management** - All configuration in one place
- **Universal Email System** - Professional HTML emails with templates
- **Comprehensive Logging** - Detailed monitoring and debugging
- **Error Resilience** - Graceful error handling throughout
- **Template System** - Beautiful, customizable email templates
- **Testing Utilities** - Built-in testing and validation tools
- **Performance Optimizations** - Cached templates and efficient operations

### 🛠️ **Technical Enhancements**
- **Modular Architecture** - Clean, maintainable code structure
- **Sheet Access Helpers** - Eliminated repetitive spreadsheet calls
- **Centralized Email Logic** - Single wrapper handles test mode automatically
- **Template Caching** - Fast template loading with validation
- **Menu Integration** - Easy access to all features

---

## ⚙️ System Settings

| Setting                | Value                                | Description                                    |
|------------------------|--------------------------------------|------------------------------------------------|
| Blawby Payment URL     | https://app.blawby.com/pay           | Your Blawby payment page URL (e.g. https://app.blawby.com/...) |
| Default Currency       | USD                                  | Default currency for all payments (USD, EUR, etc.) |
| Low Balance Threshold  | 1000                                 | Amount in default currency that triggers low balance alerts |
| Email Notifications    | TRUE                                 | Send email notifications (true/false)          |
| Firm Email             | admin@blawby.com                     | Email address for system notifications (fallback when user session unavailable) |
| Test Mode              | TRUE                                 | Enable test mode to try the system safely (true/false) |

> **Note:** Edit the Value column to configure your system. All settings are pre-filled with recommended defaults.

---

## 👩‍⚖️ Lawyers

| Email | Name | Rate | Lawyer ID |
|-------|------|------|-----------|
| lawyer1@email.com | Jane Smith | 250 | JS |
| lawyer2@email.com | John Doe | 300 | JD |

> **Note:** Add your legal team members here. The Lawyer ID is used for time logging.

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