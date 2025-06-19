# 📊 Free Open-Source Legal Retainer Management System

A free, IOLTA-compliant Google Sheets solution for law firms to manage retainers, track time, and handle client payments. No coding required!

---

## ⚙️ System Settings

| Setting                | Value                                | Description                                    |
|------------------------|--------------------------------------|------------------------------------------------|
| Blawby Payment URL     | https://app.blawby.com/pay           | Your Blawby payment page URL (e.g. https://app.blawby.com/...) |
| Default Currency       | USD                                  | Default currency for all payments (USD, EUR, etc.) |
| Low Balance Threshold  | 1000                                 | Amount in default currency that triggers low balance alerts |
| Email Notifications    | TRUE                                 | Send email notifications (true/false)          |
| Test Mode              | TRUE                                 | Enable test mode to try the system safely (true/false) |

> **Note:** Edit the Value column to configure your system. All settings are pre-filled with recommended defaults.

---

## ✅ Quick Start Guide

| Step | Action           | Details                                                                 |
|------|------------------|-------------------------------------------------------------------------|
| 1    | Connect Blawby   | Enter your Blawby payment page URL in the settings above                 |
| 2    | Add Your Team    | Go to the Lawyers tab and add your legal team members                    |
| 3    | Set Up Zapier    | Create a Zap that triggers on new Stripe payments → sends payment info to this sheet |
| 4    | Start Logging Time | Use the TimeLogs tab to record billable hours                          |
| 5    | Monitor Activity | Check the daily summary emails for updates                               |

---

## 📊 Sheet Overview

| Sheet     | Purpose                                   | Editable?      |
|-----------|-------------------------------------------|----------------|
| Lawyers   | Manage your legal team and their rates    | Yes            |
| Clients   | Track client balances and payment links   | Auto-updated   |
| TimeLogs  | Record billable hours and activities      | Yes            |
| Payments  | Track client payments and receipts        | Auto-updated   |
| Invoices  | View payment receipts and monthly summaries | Auto-updated |
| Matters   | Track client matters and case values      | Yes            |

---

## 💡 How Retainers Work

- Clients are automatically created when they make their first payment
- Each payment generates an automatic receipt with current balance
- Time is logged against the retainer balance
- Monthly summaries show hours used vs. balance
- Low balance warnings are sent automatically
- Payment links are auto-generated for easy top-ups

---

## ❓ Need Help?

- Email: support@blawby.com
- Docs: [blawby.com/docs](https://blawby.com/docs)

---

## ⭐ Why Use This System?

- **100% Free & Open Source**: No monthly fees or subscriptions
- **IOLTA Compliant**: Properly track and manage client trust funds
- **Google Sheets Based**: Use familiar tools you already know
- **Automated**: Reduce administrative work with automatic notifications and tracking
- **Secure**: Your data stays in your Google Workspace
- **Customizable**: Adapt it to your firm's needs

---

## 🛠️ Developer Documentation

### Project Structure
```
.
├── Code.gs              # Main entry points and triggers
├── ClientSync.gs        # Client data synchronization
├── Constants.gs         # System constants and config
├── EmailFunctions.gs    # Email notifications
├── EmailTemplates.gs    # Email templates
├── InvoiceGeneration.gs # Invoice creation
└── UtilityFunctions.gs  # Helper functions
```

### Key Components
- **Welcome**: Configuration and settings
- **Clients**: Client data and balances
- **Payments**: Transaction records
- **TimeLogs**: Billable hours
- **Lawyers**: Team member data
- **Matters**: Case tracking
- **Invoices**: Generated invoices

### Automation Features
- Daily balance sync
- Low balance notifications
- Invoice generation
- Receipt creation
- Client creation
- Balance updates

---

> For more help, see the Welcome sheet in your copy of the spreadsheet, or contact support@blawby.com. 