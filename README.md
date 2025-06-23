# 📊 Blawby - Free Open-Source Legal Retainer Management System

A professional, IOLTA-compliant Google Sheets solution for law firms to manage retainers, track time, and handle client payments. **No coding required!**

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
1. **Option A: Zapier Integration**
   - Set up a Zapier integration:
   - Trigger: New payment in Stripe/your payment processor
   - Action: Add row to Google Sheets (your Payments sheet)
   - Map: Date, Client Email, Amount, Payment Method, Payment ID
   - Test with a real payment
   - Run **"Sync Payments & Clients"** to process it

2. **Option B: Gmail Integration (Recommended)**
   - Click **"Enable Gmail Trigger"** in the Blawby menu
   - System automatically checks Gmail every 15 minutes for payment notifications
   - No Zapier setup required - payment emails from Blawby are automatically detected and processed
   - Test with **"Check Gmail for Payments"** menu item

### 5. Start Using (Ongoing)
1. Set **Test Mode** to "FALSE" when ready for production
2. Delete sample data and add your real clients
3. The system will automatically:
   - Create client records from payments
   - Track balances and send low balance alerts
   - Notify clients when service resumes

---

## 📊 Sheet Overview

| Sheet     | Purpose                                   | Editable?      |
|-----------|-------------------------------------------|----------------|
| Lawyers (in Welcome) | Manage your legal team and their rates | Yes            |
| Clients   | Track client balances and payment links   | Auto-updated   |
| TimeLogs  | Record billable hours and activities      | Yes            |
| Payments  | Track client payments (Date, Email, Amount, Payment Method, Payment ID) | Auto-updated   |
| Matters   | Track client matters and case values      | Yes            |

> **Note:** Sample data is included in Payments, TimeLogs, and Matters sheets for testing. Delete these rows and add your real data.

---

## 🆕 Gmail Payment Integration

Blawby now includes **built-in Gmail payment detection** as an alternative to Zapier integration. This feature automatically monitors your Gmail for payment notification emails from Blawby and processes them seamlessly.

### **How Gmail Integration Works**

1. **Automatic Monitoring** - Checks Gmail every 15 minutes for payment notifications
2. **Smart Parsing** - Extracts payment amount, client email, payment method, and unique payment ID
3. **Duplicate Prevention** - Uses payment ID to prevent processing the same payment twice
4. **Seamless Processing** - Automatically triggers full client sync and balance calculations
5. **Email Management** - Marks processed emails as read and archives them

### **Setup Gmail Integration**

1. Click **"Enable Gmail Trigger"** in the Blawby menu
2. System automatically sets up 15-minute monitoring
3. Test with **"Check Gmail for Payments"** menu item
4. Monitor logs for payment processing status

### **Benefits Over Zapier**

- ✅ **No external dependencies** - Everything runs within Google Workspace
- ✅ **Real-time processing** - 15-minute check intervals vs Zapier delays
- ✅ **Simplified setup** - One-click enable vs complex Zapier configuration
- ✅ **Cost effective** - No Zapier subscription required
- ✅ **Reliable** - Direct Gmail API integration

### **Email Format Expected**

```
From: notifications@blawby.com
Subject: Payment of $1,250.00
Body: HTML with payment details including:
- Payment Amount: $1,250.00
- Client Email: client@example.com
- Payment Method: card
- Payment ID: pay_123456789
```

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
└── UtilityFunctions.gs  # Helper functions, logging, and sheet access
```

---

## 🧪 Testing Features

| Feature | How to Test | Expected Result |
|---------|-------------|-----------------|
| **System Validation** | Click "Send Test Email" in menu | Test email sent to verify configuration |
| **Client Creation** | Run "Run Full Daily Sync" with sample payments | Clients sheet populated with client1@example.com and client2@example.com |
| **Low Balance Warnings** | Add time logs to reduce balance below threshold | Professional HTML email notifications sent to clients |
| **Matter Tracking** | Time logs are linked to matters by Matter ID | Matter breakdown shown in client records |
| **Email Notifications** | Set Email Notifications to TRUE and run sync | Low balance, service resumed, and digest emails sent to firm/clients |
| **Gmail Integration** | Click "Check Gmail for Payments" in menu | System checks Gmail for payment notifications and processes them |
