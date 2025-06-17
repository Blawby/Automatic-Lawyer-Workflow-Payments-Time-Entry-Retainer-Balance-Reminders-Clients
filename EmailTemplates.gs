// ========== EMAIL TEMPLATES ==========
const EMAIL_STYLES = {
  CONTAINER: "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;",
  HEADER: "color: #2c3e50; font-size: 24px; margin-bottom: 20px;",
  SUBHEADER: "color: #34495e; font-size: 18px; margin: 15px 0;",
  PARAGRAPH: "color: #333; font-size: 16px; line-height: 1.5; margin: 10px 0;",
  BUTTON: "display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;",
  ALERT: "background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; margin: 10px 0;",
  SUCCESS: "background-color: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin: 10px 0;",
  FOOTER: "color: #7f8c8d; font-size: 14px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;"
};

// Rename EMAIL_TEMPLATES to TEMPLATES
const TEMPLATES = {
  LOW_BALANCE: {
    CLIENT_SUBJECT: "Low Balance Alert - Blawby",
    CLIENT_BODY: (clientName, balance, targetBalance, paymentLink) => `
      <div style="${EMAIL_STYLES.CONTAINER}">
        <h1 style="${EMAIL_STYLES.HEADER}">Low Balance Alert</h1>
        <p style="${EMAIL_STYLES.PARAGRAPH}">Dear ${clientName},</p>
        <p style="${EMAIL_STYLES.PARAGRAPH}">Your Blawby account balance is currently low.</p>
        <div style="${EMAIL_STYLES.ALERT}">
          <p><strong>Current Balance:</strong> $${balance.toFixed(2)}</p>
          <p><strong>Target Balance:</strong> $${targetBalance.toFixed(2)}</p>
        </div>
        ${balance <= 0 ? `
          <div style="${EMAIL_STYLES.ALERT}">
            <p><strong>Important:</strong> Your balance is now zero. Services will be paused until your balance is topped up.</p>
          </div>
        ` : ''}
        <p style="${EMAIL_STYLES.PARAGRAPH}">To ensure uninterrupted service, please top up your balance.</p>
        <a href="${paymentLink}" style="${EMAIL_STYLES.BUTTON}">Top Up Balance</a>
        <p style="${EMAIL_STYLES.FOOTER}">Thank you for your prompt attention to this matter.</p>
      </div>
    `,
    OWNER_SUBJECT: (clientName) => `Low Balance Alert - ${clientName}`,
    OWNER_BODY: (clientName, balance, targetBalance, lastActivity) => `
      <div style="${EMAIL_STYLES.CONTAINER}">
        <h1 style="${EMAIL_STYLES.HEADER}">Low Balance Alert</h1>
        <p style="${EMAIL_STYLES.PARAGRAPH}">Client ${clientName} has a low balance.</p>
        <div style="${EMAIL_STYLES.ALERT}">
          <p><strong>Current Balance:</strong> $${balance.toFixed(2)}</p>
          <p><strong>Target Balance:</strong> $${targetBalance.toFixed(2)}</p>
          <p><strong>Last Activity:</strong> ${lastActivity || 'No recent activity'}</p>
        </div>
        <p style="${EMAIL_STYLES.PARAGRAPH}">Please follow up with the client to ensure their balance is topped up.</p>
      </div>
    `
  },
  SERVICE_RESUMED: {
    CLIENT_SUBJECT: "Service Resumed - Blawby",
    CLIENT_BODY: (clientName) => `
      <div style="${EMAIL_STYLES.CONTAINER}">
        <h1 style="${EMAIL_STYLES.HEADER}">Service Resumed</h1>
        <p style="${EMAIL_STYLES.PARAGRAPH}">Dear ${clientName},</p>
        <div style="${EMAIL_STYLES.SUCCESS}">
          <p>Your Blawby services have been resumed.</p>
        </div>
        <p style="${EMAIL_STYLES.PARAGRAPH}">Thank you for maintaining your balance. We're happy to continue providing our services.</p>
        <p style="${EMAIL_STYLES.FOOTER}">If you have any questions, please don't hesitate to contact us.</p>
      </div>
    `,
    OWNER_SUBJECT: (clientName) => `Service Resumed - ${clientName}`,
    OWNER_BODY: (clientName) => `
      <div style="${EMAIL_STYLES.CONTAINER}">
        <h1 style="${EMAIL_STYLES.HEADER}">Service Resumed</h1>
        <p style="${EMAIL_STYLES.PARAGRAPH}">Services have been resumed for client ${clientName}.</p>
        <div style="${EMAIL_STYLES.SUCCESS}">
          <p>The client's balance has been topped up and services are now active.</p>
        </div>
      </div>
    `
  },
  DAILY_DIGEST: {
    SUBJECT: "Daily Low Balance Digest - Blawby",
    BODY: (lowBalanceClients) => `
      <div style="${EMAIL_STYLES.CONTAINER}">
        <h1 style="${EMAIL_STYLES.HEADER}">Daily Low Balance Digest</h1>
        <p style="${EMAIL_STYLES.PARAGRAPH}">The following clients have low balances:</p>
        ${lowBalanceClients.map(client => `
          <div style="${EMAIL_STYLES.ALERT}">
            <h2 style="${EMAIL_STYLES.SUBHEADER}">${client.name}</h2>
            <p><strong>Current Balance:</strong> $${client.balance.toFixed(2)}</p>
            <p><strong>Target Balance:</strong> $${client.targetBalance.toFixed(2)}</p>
            <p><strong>Last Activity:</strong> ${client.lastActivity || 'No recent activity'}</p>
            ${client.balance <= 0 ? '<p><strong>Status:</strong> Services Paused</p>' : ''}
          </div>
        `).join('')}
        <p style="${EMAIL_STYLES.PARAGRAPH}">Please follow up with these clients to ensure their balances are topped up.</p>
      </div>
    `
  }
}; 