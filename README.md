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
| 1    | Test the System  | Run dailySync() to process sample data and see emails working          |
| 2    | Connect Blawby   | Enter your Blawby payment page URL in the settings above                 |
| 3    | Add Your Team    | Add your lawyers in the section above                                    |
| 4    | Set Up Zapier    | Create a Zap that triggers on new Stripe payments → sends payment info to this sheet |
| 5    | Replace Sample Data | Delete sample rows and add your real data                              |

---

## 🧪 Testing Features

| Feature | How to Test | Expected Result |
|---------|-------------|-----------------|
| Client Creation | Run dailySync() with sample payments | Clients sheet populated with client1@example.com and client2@example.com |
| Low Balance Warnings | Add time logs to reduce balance below threshold | Email notifications sent to clients |
| Matter Tracking | Time logs are linked to matters by Matter ID | Matter breakdown shown in invoices |
| Email Notifications | Set Email Notifications to TRUE and run dailySync() | Receipt emails sent to sample clients |

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
- **Welcome**: Configuration, settings, and lawyers management
- **Clients**: Client data and balances
- **Payments**: Transaction records (simplified 4-column format)
- **TimeLogs**: Billable hours
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

## 🤝 Contributing

We welcome contributions! To get started, check out our open issues: [GitHub Issues](https://github.com/Blawby/Automatic-Lawyer-Workflow-Payments-Time-Entry-Retainer-Balance-Reminders-Clients/issues)

Feel free to open new issues or submit pull requests to help improve the project.

---

> For more help, see the Welcome sheet in your copy of the spreadsheet, or contact support@blawby.com. 