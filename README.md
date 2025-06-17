# Blawby - Automatic Lawyer Workflow System

A Google Apps Script-based system for managing lawyer workflows, including payments, time entry, retainer balances, and client reminders.

## Features

- **Client Management**
  - Automatic client tracking
  - Matter-based organization
  - Flexible retainer balance management

- **Payment Processing**
  - Automated payment tracking
  - Retainer balance calculations
  - Payment link generation

- **Time Entry**
  - Matter-based time logging
  - Lawyer rate management
  - Automated time tracking

- **Balance Management**
  - Automatic balance calculations
  - Low balance alerts
  - Service pause/resume based on balance

- **Email Notifications**
  - Low balance alerts
  - Service status updates
  - Daily balance digests
  - Customizable email templates

## Setup

1. Create a new Google Apps Script project
2. Copy the files from this repository into your project
3. Set up the required Google Sheets with the following sheets:
   - Payments
   - Clients
   - TimeLogs
   - Lawyers
   - Settings
   - LowBalanceWarnings
   - Invoices
   - Matters

4. Configure the settings in the Settings sheet:
   - Base payment URL
   - Default currency
   - Target balance percentage
   - Minimum target balance

## Usage

The system provides several automated functions:

- `dailySync()`: Runs daily to process client balances and send notifications
- `manualSyncClients()`: Manually trigger client synchronization
- `manualGenerateInvoices()`: Manually generate invoices

## File Structure

- `Main.gs`: Main entry points and manual triggers
- `Constants.gs`: System constants and configuration
- `UtilityFunctions.gs`: Helper functions
- `ClientSync.gs`: Client synchronization logic
- `EmailFunctions.gs`: Email notification system
- `EmailTemplates.gs`: HTML email templates
- `InvoiceGeneration.gs`: Invoice generation logic

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 