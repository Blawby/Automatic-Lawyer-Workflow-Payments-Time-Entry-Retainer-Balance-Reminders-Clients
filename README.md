# Blawby - Google Sheets Legal Retainer Management System

A comprehensive legal practice management system built on Google Sheets that automates client payment tracking, time logging, email notifications, and practice area management.

## 🚀 Features

### 📊 **Daily Digest & Analytics**
- **Today's Activity Summary**: New clients, revenue, time entries, and matter updates
- **Low Balance Alerts**: Automated detection and manual email sending
- **Matter Management**: Track matters needing time entries with practice area matching
- **Lawyer Performance**: Monitor time logging and suggest appropriate assignments

### 💰 **Payment & Retainer Management**
- **Automated Payment Processing**: Syncs with Blawby payment system
- **Balance Tracking**: Real-time client balance calculations
- **Top-up Reminders**: Manual email system for low balance notifications
- **Payment History**: Complete payment tracking and reporting

### ⏱️ **Time Entry System**
- **Web-based Time Entry**: Professional forms with practice area context
- **Legal Billing Standards**: 6-minute increments (0.1 hours)
- **Lawyer Suggestions**: Smart matching based on practice areas
- **Nudge System**: Professional reminder emails to lawyers

### 👩‍⚖️ **Practice Area Management**
- **Lawyer Specializations**: Track practice areas for each lawyer
- **Smart Matter Assignment**: Suggest appropriate lawyers based on practice area
- **Enhanced Time Entry**: Context-aware forms with matter and client details

### 📧 **Email Automation**
- **Service Resumption**: Automatic notifications when clients top up
- **Manual Email Control**: Owner-controlled low balance reminders
- **Professional Templates**: Clean, professional email formatting
- **Lawyer Nudges**: Automated reminders with direct time entry links

## 🏗️ System Architecture

### **Core Sheets**
- **Welcome**: System settings and lawyer configuration
- **Clients**: Client information and balance tracking
- **Matters**: Matter details with practice area assignment
- **TimeLogs**: Time entry tracking with lawyer and matter association
- **Payments**: Payment processing and history
- **LowBalanceWarnings**: Automated low balance detection

### **Web App Integration**
- **Action Buttons**: Direct links for email sending and time entry
- **Professional Forms**: Enhanced time entry with context
- **Lawyer Nudges**: Automated reminder system
- **Secure Access**: Google Apps Script web app deployment

## 📋 Setup Instructions

### **1. Initial Configuration**
1. Copy the Google Sheets template
2. Set up your Blawby payment URL in the Welcome sheet
3. Configure low balance threshold
4. Add lawyers with practice areas

### **2. Lawyer Setup**
In the Welcome sheet, add lawyers with:
- **Email**: Lawyer's email address
- **Name**: Full name
- **Rate**: Hourly billing rate
- **Lawyer ID**: Unique identifier
- **Practice Areas**: Comma-separated list (e.g., "Corporate Law, Contracts")

### **3. Practice Areas**
Common practice areas include:
- Corporate Law, Contracts
- Litigation, Family Law
- Real Estate, Property Law
- Criminal Defense
- Employment Law
- Intellectual Property
- Tax Law
- Bankruptcy
- Personal Injury
- Immigration Law

### **4. Web App Deployment**
1. Deploy as web app in Google Apps Script
2. Set "Execute as" to "Me"
3. Set "Who has access" to "Anyone"
4. Update script ID in the code

## 🔄 Daily Workflow

### **Automated Processes**
1. **Payment Sync**: New payments automatically create clients/matters
2. **Balance Calculation**: Real-time balance updates
3. **Service Resumption**: Automatic notifications when clients top up
4. **Matter Detection**: Identify matters needing time entries

### **Manual Actions (Daily Digest)**
1. **Review Today's Activity**: New clients, revenue, time entries
2. **Send Low Balance Emails**: Manual control over client reminders
3. **Nudge Lawyers**: Professional reminders for time entries
4. **Add Time Entries**: Direct access to time entry forms

## 📧 Email Templates

### **Daily Digest**
- Today's activity summary
- Low balance client list with action buttons
- Matters needing time entries with lawyer suggestions
- Revenue and client statistics

### **Low Balance Reminders**
- Professional client communication
- Direct payment links
- Balance information and top-up amounts

### **Lawyer Nudges**
- Matter context and client information
- Direct time entry links
- Practice area matching
- CC to firm owner for transparency

## ⚙️ Configuration

### **System Settings (Welcome Sheet)**
- **Blawby Payment URL**: Your payment page URL
- **Default Currency**: USD, EUR, GBP, CAD, AUD
- **Low Balance Threshold**: Target balance for all clients

### **Lawyer Configuration**
- **Practice Areas**: Comma-separated specialties
- **Hourly Rates**: Individual billing rates
- **Email Addresses**: For notifications and nudges

## 🔧 Technical Details

### **File Structure**
- `Code.gs`: Main entry points and validation
- `ClientSync.gs`: Payment and client processing
- `EmailFunctions.gs`: Email templates and web app functions
- `EmailTemplates.gs`: Email template system
- `UtilityFunctions.gs`: Helper functions and sheet setup
- `Constants.gs`: System constants and column definitions

### **Web App Actions**
- `send_email`: Send individual low balance emails
- `send_all`: Send all low balance emails
- `add_time_entry`: Show time entry form
- `submit_time_entry`: Process time entry submission
- `nudge_lawyer`: Send lawyer reminder emails

### **Data Validation**
- Email format validation
- Payment amount validation
- Lawyer data completeness checks
- Matter status tracking

## 🎯 Best Practices

### **Daily Operations**
1. **Review Daily Digest**: Check for low balance clients and matters needing attention
2. **Send Reminders**: Use manual email control for client communications
3. **Nudge Lawyers**: Send professional reminders for time entries
4. **Monitor Practice Areas**: Ensure matters are assigned to appropriate lawyers

### **Client Management**
1. **Set Target Balances**: Configure appropriate thresholds per client
2. **Track Payment History**: Monitor client payment patterns
3. **Update Client Information**: Keep client names and details current
4. **Review Matter Status**: Track active vs. completed matters

### **Time Entry Management**
1. **Use Practice Area Matching**: Assign matters to appropriate lawyers
2. **Regular Time Logging**: Encourage consistent time entry
3. **Professional Nudges**: Use automated reminders for missing entries
4. **Review Time Patterns**: Monitor lawyer productivity and matter progress

## 🚀 Future Enhancements

### **Planned Features**
1. **Enhanced Today's Activity**: More detailed analytics and insights
2. **Calendar Integration**: Meeting and call tracking
3. **Risk Management**: Automated risk flagging and alerts
4. **Advanced Reporting**: Detailed performance and financial reports
5. **Client Portal**: Direct client access to balances and payments

### **Analytics Improvements**
- Time tracking insights and gaps
- Matter movement and status changes
- Client interaction tracking
- Risk flagging and follow-up automation

## 📞 Support

For questions or issues:
1. Check the Welcome sheet configuration
2. Review the daily digest for system status
3. Validate email templates and web app deployment
4. Ensure all required sheets are properly set up

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Blawby** - Streamlining legal practice management with Google Sheets automation.

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
