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
   - Set your **Low Balance Threshold** (default $500 - this is the target balance for all clients)
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

### 4. Connect Your Payment System (5 minutes)
**Gmail Integration (Recommended & Automatic)**
1. Click **"Enable Gmail Trigger"** in the Blawby menu
2. System automatically checks Gmail every 15 minutes for payment notifications
3. **Daily sync automatically processes Gmail payments** - no manual intervention needed
4. No Zapier setup required - payment emails from Blawby are automatically detected and processed
5. Test with **"Process Gmail Payments"** menu item

### 5. Start Using (Ongoing)
1. Set **Test Mode** to "FALSE" when ready for production
2. Delete sample data and add your real clients
3. The system will automatically:
   - Create client records from payments
   - Create default matters for new clients
   - Track balances and send low balance alerts
   - Notify clients when service resumes

---

## 📊 Sheet Overview

| Sheet     | Purpose                                   | Editable?      |
|-----------|-------------------------------------------|----------------|
| Lawyers (in Welcome) | Manage your legal team and their rates | Yes            |
| Clients   | Track client balances and payment links   | Auto-updated   |
| TimeLogs  | Record billable hours and activities      | Yes            |
| Payments  | Track client payments (Date, Email, Amount, Payment Method, Payment ID, Message-ID) | Auto-updated   |
| Matters   | Track client matters and case values      | Auto-updated   |

> **Note:** Sample data is included in Payments, TimeLogs, and Matters sheets for testing. Delete these rows and add your real data.

---

## 🚀 **Gmail API Email System**

Blawby uses **Gmail API** for all email operations, providing:

### **📧 Massive Email Capacity**
- **Gmail API**: 1,000,000 emails/day (vs 100 with MailApp)
- **Perfect for multi-user systems** - no more quota issues
- **Automatic quota tracking** - monitors daily usage
- **Graceful error handling** - continues working even if limits are hit

### **🔧 How It Works**
1. **Gmail API Integration** - Uses Google's advanced email API
2. **Automatic Quota Management** - Tracks usage and warns before limits
3. **Seamless Migration** - All existing email functions work the same
4. **Better Reliability** - More stable than MailApp

### **📊 Email Quota Status**
- Click **"📊 Check Gmail API Quota"** in the Blawby menu
- Shows remaining emails, usage percentage, and limits
- Warns when approaching daily limits
- Displays comparison with old MailApp limits

### **🧪 Testing Gmail API**
- Click **"🧪 Test Gmail API Email"** to verify the new system
- Sends a test email using Gmail API
- Confirms the upgrade is working correctly

---

## 💡 How Retainers Work

- **Automatic Client Creation** - Clients are created when they make their first payment
- **Automatic Matter Creation** - Default matters are created for new clients
- **Simplified Target Balance** - All clients use the same target balance from Welcome sheet ($500 default)
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
| **Low Balance Warnings** | Balance below target | Client + Firm | `LOW_BALANCE` | `Your retainer needs a quick top-up, [ClientName]` | Alert client to top up retainer |
| **Daily Balance Digest** | Daily sync runs | Firm only | `DAILY_DIGEST` | `Your Blawby Daily Summary` | Summary of all low balance clients |
| **Service Resumed** | Balance goes positive | Client + Firm | `SERVICE_RESUMED` | `Great news! Your services are back up and running` | Notify when services can resume |
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

## 📧 **Gmail Payment Integration (Recommended)**

**No more Zapier needed!** Blawby automatically detects and processes payment emails from Gmail.

### **Key Features**
1. **Automatic Detection** - Monitors Gmail for Blawby payment notifications
2. **Smart Parsing** - Extracts payment amount, client email, payment method, and unique payment ID
3. **Duplicate Prevention** - Uses Message-ID to prevent processing the same payment twice
4. **Seamless Processing** - Automatically triggers full client sync and balance calculations
5. **Email Management** - Marks processed emails as read and archives them
6. **Automatic Matter Creation** - Creates default matters for new clients

### **Setup Gmail Integration**

1. Click **"Enable Gmail Trigger"** in the Blawby menu
2. System automatically sets up 15-minute monitoring
3. **Daily sync will automatically process Gmail payments** - no manual intervention needed
4. Test with **"Process Gmail Payments"** menu item
5. Monitor logs for payment processing status

### **Benefits Over Zapier**

- ✅ **No external dependencies** - Everything runs within Google Workspace
- ✅ **Fully integrated** - Works automatically with daily sync operations
- ✅ **Real-time processing** - 15-minute check intervals vs Zapier delays
- ✅ **Simplified setup** - One-click enable vs complex Zapier configuration
- ✅ **Cost effective** - No Zapier subscription required
- ✅ **Reliable** - Direct Gmail API integration
- ✅ **Automatic** - No manual payment processing required

### **Email Format Expected**

```
From: notifications@blawby.com
Subject: Payment of $1,250.00 received from [Client Name]
Body: HTML with payment details including:
- Payment Amount: $1,250.00
- Client Email: client@example.com (or "Not provided")
- Payment Method: card - 5565
- Payment ID: pay_123456789
```

### **Automatic Processing**

When a payment email is detected:
1. **Payment parsed** and added to Payments sheet
2. **Client created** if new (with auto-generated client ID)
3. **Default matter created** for new clients
4. **Balance calculated** and updated
5. **Low balance emails sent** if needed
6. **Email archived** to prevent reprocessing

---

## 🔧 **System Features**

### **Simplified Target Balance Logic**
- **All clients use the same target balance** from Welcome sheet ($500 default)
- **No complex calculations** - simple and predictable
- **Easy to adjust** - change one number in Welcome sheet
- **Consistent across all clients** - fair and transparent

### **Automatic Matter Creation**
- **New clients get default matters** automatically
- **Matter ID format**: M-YYYY-XXX (e.g., M-2025-001)
- **Default description**: "General Legal Matter"
- **Status**: "Active"
- **Client names updated** when client info is filled

### **Enhanced Payment Processing**
- **Message-ID deduplication** - prevents duplicate payments
- **Robust email parsing** - handles various email formats
- **Automatic client creation** - seamless new client onboarding
- **Balance tracking** - real-time balance calculations

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
| **Gmail Integration** | Click "Process Gmail Payments" in menu | System checks Gmail for payment notifications and processes them automatically |
| **Daily Sync with Gmail** | Run "Run Full Daily Sync" with Gmail payments present | Gmail payments automatically processed as part of daily sync workflow |
