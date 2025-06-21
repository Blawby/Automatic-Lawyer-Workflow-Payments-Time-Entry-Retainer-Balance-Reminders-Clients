// ========== EMAIL TEMPLATES ==========
const EMAIL_STYLES = {
  CONTAINER: "font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;",
  HEADER: "color: #2c3e50; font-size: 24px; margin-bottom: 20px;",
  SUBHEADER: "color: #34495e; font-size: 18px; margin: 15px 0;",
  PARAGRAPH: "color: #333; font-size: 16px; line-height: 1.5; margin: 10px 0;",
  BUTTON: "display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;",
  ALERT: "background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; margin: 10px 0;",
  SUCCESS: "background-color: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin: 10px 0;",
  FOOTER: "color: #7f8c8d; font-size: 14px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;",
  ALERT_BOX: "background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #f5c6cb;",
  BUTTON_CONTAINER: "text-align: center; margin-top: 20px;"
};

// Rename EMAIL_TEMPLATES to TEMPLATES
const TEMPLATES = {
  LOW_BALANCE: {
    SUBJECT: (clientName) => `Low Balance Alert - ${clientName}`,
    BODY: (clientName, balance, targetBalance, paymentLink) => `
      <div style="${EMAIL_STYLES.CONTAINER}">
        <h1 style="${EMAIL_STYLES.HEADER}">Low Balance Alert</h1>
        
        <p style="${EMAIL_STYLES.PARAGRAPH}">Dear ${clientName},</p>
        
        <p style="${EMAIL_STYLES.PARAGRAPH}">Your retainer balance is currently low and needs to be topped up to continue receiving our services.</p>
        
        <div style="${EMAIL_STYLES.ALERT_BOX}">
          <h2 style="${EMAIL_STYLES.SUBHEADER}">Current Balance Status</h2>
          <p><strong>Current Balance:</strong> $${balance.toFixed(2)}</p>
          <p><strong>Target Balance:</strong> $${targetBalance.toFixed(2)}</p>
          <p><strong>Top-up Needed:</strong> $${(targetBalance - balance).toFixed(2)}</p>
        </div>
        
        <p style="${EMAIL_STYLES.PARAGRAPH}">To continue receiving our services without interruption, please top up your retainer using the link below:</p>
        
        <div style="${EMAIL_STYLES.BUTTON_CONTAINER}">
          <a href="${paymentLink}" style="${EMAIL_STYLES.BUTTON}">Top Up Retainer</a>
        </div>
        
        <p style="${EMAIL_STYLES.PARAGRAPH}">If you have any questions about your retainer or our services, please don't hesitate to contact us.</p>
        
        <p style="${EMAIL_STYLES.PARAGRAPH}">Thank you for your business.</p>
        
        <p style="${EMAIL_STYLES.SIGNATURE}">
          Best regards,<br>
          Your Legal Team
        </p>
      </div>
    `,
    OWNER_SUBJECT: (clientName) => `Low Balance Alert - ${clientName}`,
    OWNER_BODY: (clientName, balance, targetBalance, lastActivity) => `
      <div style="${EMAIL_STYLES.CONTAINER}">
        <h1 style="${EMAIL_STYLES.HEADER}">Low Balance Alert</h1>
        
        <p style="${EMAIL_STYLES.PARAGRAPH}">Client ${clientName} has a low retainer balance.</p>
        
        <div style="${EMAIL_STYLES.ALERT_BOX}">
          <h2 style="${EMAIL_STYLES.SUBHEADER}">Balance Status</h2>
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Current Balance:</strong> $${balance.toFixed(2)}</p>
          <p><strong>Target Balance:</strong> $${targetBalance.toFixed(2)}</p>
          <p><strong>Top-up Needed:</strong> $${(targetBalance - balance).toFixed(2)}</p>
          <p><strong>Last Activity:</strong> ${lastActivity}</p>
        </div>
        
        <p style="${EMAIL_STYLES.PARAGRAPH}">A low balance notification has been sent to the client. Consider following up if no payment is received within 24 hours.</p>
        
        <p style="${EMAIL_STYLES.FOOTER}">This is an automated notification from your Blawby system.</p>
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
  },
  RECEIPT: {
    SUBJECT: (receiptId) => `Payment Receipt #${receiptId} - Blawby`,
    BODY: (clientName, receiptId, date, amount, currency, newBalance, hoursUsed, averageRate) => `
      <div style="${EMAIL_STYLES.CONTAINER}">
        <h1 style="${EMAIL_STYLES.HEADER}">Payment Receipt</h1>
        <p style="${EMAIL_STYLES.PARAGRAPH}">Dear ${clientName},</p>
        <p style="${EMAIL_STYLES.PARAGRAPH}">Thank you for your payment. Here is your receipt:</p>
        
        <div style="${EMAIL_STYLES.SUCCESS}">
          <p><strong>Receipt #:</strong> ${receiptId}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Amount:</strong> ${currency} ${amount}</p>
          <p><strong>New Balance:</strong> ${currency} ${newBalance.toFixed(2)}</p>
        </div>
        
        ${hoursUsed > 0 ? `
          <h2 style="${EMAIL_STYLES.SUBHEADER}">Monthly Summary</h2>
          <p><strong>Hours Used This Month:</strong> ${hoursUsed.toFixed(2)}</p>
          <p><strong>Average Rate:</strong> ${currency} ${averageRate.toFixed(2)}/hour</p>
          <p><strong>Estimated Monthly Usage:</strong> ${currency} ${(hoursUsed * averageRate).toFixed(2)}</p>
        ` : ''}
        
        <p style="${EMAIL_STYLES.FOOTER}">Thank you for your business.</p>
      </div>
    `
  },
  MONTHLY_SUMMARY: {
    SUBJECT: (month) => `Monthly Summary - ${month} - Blawby`,
    BODY: (clientName, month, hoursUsed, averageRate, estimatedUsage, balance) => `
      <div style="${EMAIL_STYLES.CONTAINER}">
        <h1 style="${EMAIL_STYLES.HEADER}">Monthly Summary</h1>
        <p style="${EMAIL_STYLES.PARAGRAPH}">Dear ${clientName},</p>
        <p style="${EMAIL_STYLES.PARAGRAPH}">Here is your monthly summary for ${month}:</p>
        
        <div style="${EMAIL_STYLES.SUCCESS}">
          <p><strong>Hours Used:</strong> ${hoursUsed.toFixed(2)}</p>
          <p><strong>Average Rate:</strong> $${averageRate.toFixed(2)}/hour</p>
          <p><strong>Estimated Usage:</strong> $${estimatedUsage.toFixed(2)}</p>
          <p><strong>Current Balance:</strong> $${balance.toFixed(2)}</p>
        </div>
        
        ${balance < estimatedUsage ? `
          <div style="${EMAIL_STYLES.ALERT}">
            <p><strong>Note:</strong> Your current balance is below the estimated monthly usage. Consider topping up your retainer to ensure uninterrupted service.</p>
          </div>
        ` : ''}
        
        <p style="${EMAIL_STYLES.FOOTER}">Thank you for your business.</p>
      </div>
    `
  }
};

// ========== TEMPLATE LOADER SYSTEM ==========

/**
 * Template loader class for managing email templates
 */
class TemplateLoader {
  constructor() {
    this.templates = TEMPLATES;
    this.cache = new Map();
    this._templateMap = null; // Cached template map for performance
  }

  /**
   * Get a template by type and subtype
   * @param {string} type - Template type (e.g., 'LOW_BALANCE', 'SERVICE_RESUMED')
   * @param {string} subtype - Template subtype (e.g., 'CLIENT_SUBJECT', 'OWNER_BODY')
   * @return {Function|string} - The template function or string
   */
  getTemplate(type, subtype) {
    const cacheKey = `${type}.${subtype}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    if (!this.templates[type]) {
      throw new Error(`Template type '${type}' not found`);
    }
    
    if (!this.templates[type][subtype]) {
      throw new Error(`Template subtype '${subtype}' not found for type '${type}'`);
    }
    
    const template = this.templates[type][subtype];
    this.cache.set(cacheKey, template);
    return template;
  }

  /**
   * Get template by name (for backward compatibility)
   * @param {string} name - Template name
   * @return {Function|string} - The template
   */
  getTemplateByName(name) {
    if (!this._templateMap) {
      // Build template map on first access
      this._templateMap = {};
      for (const [type, subtypes] of Object.entries(this.templates)) {
        for (const [subtype, template] of Object.entries(subtypes)) {
          this._templateMap[`${type}_${subtype}`] = template;
        }
      }
    }
    
    if (!this._templateMap[name]) {
      throw new Error(`Template '${name}' not found`);
    }
    
    return this._templateMap[name];
  }

  /**
   * Render a template with parameters
   * @param {string} type - Template type
   * @param {string} subtype - Template subtype
   * @param {...any} params - Parameters to pass to the template function
   * @return {string} - Rendered template
   */
  render(type, subtype, ...params) {
    const template = this.getTemplate(type, subtype);
    
    if (typeof template === 'function') {
      return template(...params);
    }
    
    return template;
  }

  /**
   * Validate that all required templates exist
   * @return {boolean} - True if all templates are valid
   */
  validateTemplates() {
    const requiredTemplates = [
      ['LOW_BALANCE', 'SUBJECT'],
      ['LOW_BALANCE', 'BODY'],
      ['SERVICE_RESUMED', 'SUBJECT'],
      ['SERVICE_RESUMED', 'BODY'],
      ['DAILY_DIGEST', 'SUBJECT'],
      ['DAILY_DIGEST', 'BODY'],
      ['MONTHLY_SUMMARY', 'SUBJECT'],
      ['MONTHLY_SUMMARY', 'BODY']
    ];

    for (const [type, subtype] of requiredTemplates) {
      try {
        this.getTemplate(type, subtype);
      } catch (error) {
        logError('TemplateLoader.validateTemplates', error);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get all available template types
   * @return {Array} - Array of template type names
   */
  getTemplateTypes() {
    return Object.keys(this.templates);
  }

  /**
   * Get all subtypes for a template type
   * @param {string} type - Template type
   * @return {Array} - Array of subtype names
   */
  getTemplateSubtypes(type) {
    if (!this.templates[type]) {
      throw new Error(`Template type '${type}' not found`);
    }
    return Object.keys(this.templates[type]);
  }

  /**
   * Clear the template cache (useful for testing or updates)
   */
  clearCache() {
    this.cache.clear();
    this._templateMap = null;
    log("🧹 Template cache cleared");
  }
}

// Global template loader instance
const templateLoader = new TemplateLoader();

/**
 * Get the global template loader instance
 * @return {TemplateLoader} - The template loader instance
 */
function getTemplateLoader() {
  return templateLoader;
}

/**
 * Render a template with parameters (convenience function)
 * @param {string} type - Template type
 * @param {string} subtype - Template subtype
 * @param {...any} params - Parameters to pass to the template function
 * @return {string} - Rendered template
 */
function renderTemplate(type, subtype, ...params) {
  return templateLoader.render(type, subtype, ...params);
}

/**
 * Validate all email templates
 * @return {boolean} - True if all templates are valid
 */
function validateEmailTemplates() {
  return templateLoader.validateTemplates();
} 