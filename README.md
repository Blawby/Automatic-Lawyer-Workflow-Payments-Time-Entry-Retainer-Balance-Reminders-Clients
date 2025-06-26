## 📊 [Blawby Sheets](https://blawby.com) - Free, Open-Source Legal Software for Lawyers

A professional, [IOLTA-compliant](https://blawby.com/docs) retainer management system for law firms—built in Google Sheets. Designed to track retainers, billable hours, and automate payment workflows.
**✅ 100% Free** | **✅ Open Source** | **✅ No Coding Needed**

---

## 🚀 Quick Start – Free Legal Software Setup (No Coding!)

### 1. Get Your Copy

1. 👉 [Click here to copy the template](https://docs.google.com/spreadsheets/d/1DO0IOXluqBD6QZ7cIteS1clIz6dymNy4ODbcS4cxKjY/copy)
2. Rename for your firm: e.g., "Smith Law - Retainer System"
3. Click "Make a copy"

> Uses only Google Sheets. No paid apps, subscriptions, or plugins required.

---

## 💼 What is Blawby Sheets?

Blawby Sheets is a **free and open-source legal software platform** for lawyers. Built using Google Sheets and Apps Script, it automates:

* Retainer tracking & trust accounting (IOLTA-compliant)
* Time logging & matter management
* Automated email reminders
* Payment intake & low balance alerts

Great for solo lawyers, boutique firms, and legal clinics.

---

## 💸 Payment Automation with [Blawby Payments](https://blawby.com)

### ✅ Using [Blawby Payments](https://blawby.com):

* Client payments are **auto-detected** via Gmail
* System **auto-generates payment links** for low balances
* Clients get notified when services resume
* **No manual input** needed

**Expected URL Pattern:** `https://app.blawby.com/YOUR_FIRM/pay`
* Example: `https://app.blawby.com/northcarolinalegalservices/pay`
* The system will validate this pattern and warn if incorrect

> For details, see [Blawby Payments pricing](https://blawby.com/pricing)

### ❗ Using Other Payment Methods?

* You must **manually enter payments** into the Payments sheet
* Payment links will **not** be generated
* Notifications will still be triggered daily as usual
* **No Gmail integration** - payments won't be auto-detected

> To unlock full automation, connect your [Blawby Payments link](https://blawby.com/payments) with the correct URL pattern.

---

## 📋 Sheet Overview

| Sheet    | Purpose                          | Editable?       |
| -------- | -------------------------------- | --------------- |
| Welcome  | Firm settings & lawyer config    | ✅ Yes           |
| Clients  | Retainer balances & payment info | ⚙️ Auto-updated |
| Payments | Track payment activity           | ⚙️ Auto-updated |
| TimeLogs | Log billable time                | ✅ Yes           |
| Matters  | Manage case and billing data     | ⚙️ Auto-updated |

---

## ✉️ Gmail Email Automation (No Zapier)

All emails are sent via Gmail API:

* **Low balance alerts** with payment links
* **Service resumed** confirmations
* **Daily firm summary** with client status
* **Test emails** via "Send Test Emails" menu (sends one of each email type)

> 💡 **Safe Mode**: By default, **Activate Live Emails** is set to `FALSE` to prevent accidental emails to clients. Enable it in the Welcome sheet when ready to send real emails. This is the **only setting** that controls all email automation.

---

## 🧠 Smart Features for Law Firms

* ⚖️ IOLTA trust compliance tracking
* 🔁 Auto-matter and client creation
* 📬 Automatic Gmail payment processing
* 📧 Email automation via Gmail API
* 🧾 HTML invoices and notifications

---

## 🆓 Why Use Blawby Sheets?

* ✅ **Free software for lawyers**
* ✅ **Open source legal tool** you can audit and adapt
* ✅ **Google Sheets-based** – simple and powerful
* ✅ **Email automation built-in**
* ✅ **No external platforms needed** – works in your Google Workspace
* ✅ **Secure** – all data stays in your account
* ✅ **Simplified setup** – only one toggle for email automation

---

## 🔌 Developer-Friendly

Blawby Sheets is fully open source and welcomes contributions from the community. If you encounter a bug or have a feature idea, please open an issue or submit a pull request on GitHub. We actively monitor [GitHub Issues](https://github.com/Blawby/Automatic-Lawyer-Workflow-Payments-Time-Entry-Retainer-Balance-Reminders-Clients/issues) and encourage collaboration.

```
.
├── Code.gs              # Triggers + Menu System
├── ClientSync.gs        # Balance & matter logic
├── Constants.gs         # Settings & metadata
├── EmailFunctions.gs    # Gmail API + test mode
├── EmailTemplates.gs    # HTML template engine
└── UtilityFunctions.gs  # Logging & helpers
```

Full source at: [github.com/Blawby](https://github.com/Blawby/Automatic-Lawyer-Workflow-Payments-Time-Entry-Retainer-Balance-Reminders-Clients)

---

## 🔗 Learn More

* [Website](https://blawby.com)
* [Documentation](https://blawby.com/docs)
* [Blawby Payments Pricing](https://blawby.com/pricing)
* [GitHub](https://github.com/Blawby/Automatic-Lawyer-Workflow-Payments-Time-Entry-Retainer-Balance-Reminders-Clients)
* [Contact Support](mailto:support@blawby.com)
