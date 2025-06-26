# Blawby - Google Sheets Legal Retainer Management System

A comprehensive legal practice management system built on Google Sheets that automates client payment tracking, time logging, email notifications, and practice area management with professional daily briefings and smart matter assignment.

## 🚀 Features

### 📊 **Daily Digest & Analytics**
- **Today's Activity Summary**: New clients, revenue, time entries, and matter updates
- **Unassigned Matters Detection**: Smart identification of matters needing lawyer assignment
- **Lawyer Suggestions**: Practice area-based recommendations for matter assignment
- **Email Previews**: See exactly what emails will be sent before taking action
- **Professional HTML Design**: Card-based layout with navy blue theme
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
- **Nudge System**: Professional reminder emails to lawyers with email previews

### 👩‍⚖️ **Practice Area Management**
- **Lawyer Specializations**: Track practice areas for each lawyer
- **Smart Matter Assignment**: Suggest appropriate lawyers based on practice area
- **Enhanced Time Entry**: Context-aware forms with matter and client details

### 🎯 **Unassigned Matters Management**
- **Automatic Detection**: Identifies matters without time entries (unassigned)
- **Practice Area Matching**: Suggests lawyers based on matter practice area
- **Assignment Forms**: Professional web forms for matter assignment
- **Assignment Logging**: Complete audit trail of matter assignments
- **Lawyer Notifications**: Automatic emails to assigned lawyers

### 📧 **Email Automation**
- **Service Resumption**: Automatic notifications when clients top up
- **Manual Email Control**: Owner-controlled low balance reminders
- **Professional HTML Templates**: Modern, responsive email design
- **Lawyer Nudges**: Automated reminders with direct time entry links
- **Email Previews**: Full preview of emails before sending

## 🏗️ System Architecture

### **Core Sheets**
- **Welcome**: System settings and lawyer configuration
- **Clients**: Client information and balance tracking
- **Matters**: Matter details with practice area assignment
- **TimeLogs**: Time entry tracking with lawyer and matter association
- **Payments**: Payment processing and history
- **LowBalanceWarnings**: Automated low balance detection
- **Assignment Log**: Audit trail of matter assignments (auto-created)

### **Web App Integration**
- **Action Buttons**: Direct links for email sending and time entry
- **Professional Forms**: Enhanced time entry with context
- **Matter Assignment**: Complete assignment workflow with forms
- **Lawyer Nudges**: Automated reminder system with email previews
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
4. Update script ID in the code for all action links

## 🔄 Daily Workflow

### **Automated Processes**
1. **Payment Sync**: New payments automatically create clients/matters
2. **Balance Calculation**: Real-time balance updates
3. **Service Resumption**: Automatic notifications when clients top up
4. **Matter Detection**: Identify matters needing time entries
5. **Unassigned Matter Detection**: Find matters without lawyer assignments

### **Manual Actions (Daily Digest)**
1. **Review Today's Activity**: New clients, revenue, time entries
2. **Assign Unassigned Matters**: Use practice area suggestions to assign lawyers
3. **Send Low Balance Emails**: Manual control over client reminders with email previews
4. **Nudge Lawyers**: Professional reminders for time entries with email previews
5. **Add Time Entries**: Direct access to time entry forms

## 📧 Email Templates

### **Daily Digest (HTML)**
- Professional card-based design with navy blue theme
- Today's activity summary in grid layout
- Unassigned matters with lawyer suggestions
- Low balance client list with email previews
- Matters needing time entries with email previews
- Revenue and client statistics
- Styled action buttons for all operations

### **Low Balance Reminders**
- Professional client communication
- Direct payment links
- Balance information and top-up amounts
- Email previews before sending

### **Lawyer Nudges**
- Matter context and client information
- Direct time entry links
- Practice area matching
- CC to firm owner for transparency
- Email previews before sending

### **Matter Assignment Notifications**
- New matter assignment details
- Matter description and client information
- Assignment notes and context
- Direct access to matter information

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
- `EmailFunctions.gs`: Email templates, web app functions, and assignment system
- `EmailTemplates.gs`: Email template system with HTML support
- `UtilityFunctions.gs`: Helper functions and sheet setup
- `Constants.gs`: System constants and column definitions

### **Web App Actions**
- `send_email`: Send individual low balance emails
- `send_all`: Send all low balance emails
- `add_time_entry`: Show time entry form
- `submit_time_entry`: Process time entry submission
- `nudge_lawyer`: Send lawyer reminder emails
- `assign_matter`: Show matter assignment form
- `submit_assignment`: Process matter assignment

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

## 🚀 Recent Enhancements

### **Professional Email Design**
- **HTML Email Templates**: Modern, responsive design with card-based layout
- **Email Previews**: See exactly what emails will be sent before taking action
- **Styled Action Buttons**: Professional buttons instead of plain links
- **Mobile-Responsive**: Optimized for all device sizes

### **Unassigned Matters System**
- **Automatic Detection**: Identifies matters without time entries
- **Practice Area Matching**: Smart lawyer suggestions based on matter type
- **Assignment Workflow**: Complete form-based assignment process
- **Assignment Logging**: Full audit trail of all assignments
- **Lawyer Notifications**: Automatic emails to assigned lawyers

### **Enhanced Daily Digest**
- **Professional Layout**: Card-based design with clear sections
- **Priority Indicators**: Visual urgency indicators (🔥 Urgent, ⏳ Pending, 🆕 New)
- **Email Previews**: Full preview of emails before sending
- **Action Context**: Complete context for each action item
- **Bulk Operations**: Efficient handling of multiple items