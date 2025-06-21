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
| **Client Creation** | Run "Run Full Daily Sync" with sample payments | Clients sheet populated with client1@example.com and client2@example.com |
| **Low Balance Warnings** | Add time logs to reduce balance below threshold | Professional HTML email notifications sent to clients |
| **Matter Tracking** | Time logs are linked to matters by Matter ID | Matter breakdown shown in client records |
| **Email Notifications** | Set Email Notifications to TRUE and run sync | Low balance, service resumed, and digest emails sent to firm/clients |

---

## 📊 Sheet Overview

| Sheet     | Purpose                                   | Editable?      |
|-----------|-------------------------------------------|----------------|
| Lawyers (in Welcome) | Manage your legal team and their rates | Yes            |
| Clients   | Track client balances and payment links   | Auto-updated   |
| TimeLogs  | Record billable hours and activities      | Yes            |
| Payments  | Track client payments (Date, Email, Amount, Payment Method) | Auto-updated   |
| Matters   | Track client matters and case values      | Yes            |

> **Note:** Sample data is included in Payments, TimeLogs, and Matters sheets for testing. Delete these rows and add your real data.

---

## 💡 How Retainers Work

- **Automatic Client Creation** - Clients are created when they make their first payment
- **Time Tracking** - Time is logged against the retainer balance with lawyer rates
- **Smart Notifications** - Low balance warnings sent automatically with payment links
- **Service Resumed Alerts** - Clients are notified when their balance is topped up and service resumes
- **Payment Links** - Auto-generated payment links for easy client top-ups

---

## 📧 Email System Overview

Blawby includes a professional email system with HTML templates. All emails are automatically handled. In test mode, emails are redirected to your firm email with a [TEST] label.

### **Active Email Types & Triggers**

| Email Type | Trigger | Recipients | Template | Subject | Purpose |
|------------|---------|------------|----------|---------|---------|
| **Low Balance Warnings** | Balance below target | Client + Firm | `LOW_BALANCE` | `Low Balance Alert - [ClientName]` | Alert client to top up retainer |
| **Daily Balance Digest** | Daily sync runs | Firm only | `DAILY_DIGEST` | `Daily Low Balance Digest - Blawby` | Summary of all low balance clients |
| **Service Resumed** | Balance goes positive | Client + Firm | `SERVICE_RESUMED` | `Service Resumed - Blawby` | Notify when services can resume |
| **Test Email** | Manual trigger | Firm only | Custom | `Welcome to Blawby` | Validate email configuration |

### **Email Content Details**

#### **1. Low Balance Warnings** (Critical for Business)
- **When:** Client balance falls below target balance
- **Content:** Current balance, target balance, payment link
- **Action:** Client receives payment link for easy top-up

#### **2. Daily Balance Digest** (Firm Operations)
- **When:** Daily sync runs (automated or manual)
- **Content:** Summary of all clients with low balances
- **Purpose:** Keep firm informed of client payment status

#### **3. Service Resumed Notifications** (Client Satisfaction)
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
- **Send Test Email** - Validate email system configuration
- **Fix Firm Email** - Auto-detect and fix firm email setting
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
3. Check your email for test notifications
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
   - Track balances and send low balance alerts
   - Notify clients when service resumes

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
└── UtilityFunctions.gs  # Helper functions, logging, and sheet access
```