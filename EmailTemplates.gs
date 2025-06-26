// ========== EMAIL TEMPLATES ==========

// Rename EMAIL_TEMPLATES to TEMPLATES
const TEMPLATES = {
  LOW_BALANCE: {
    CLIENT_SUBJECT: (clientName) => `Your retainer needs a quick top-up, ${clientName}`,
    CLIENT_BODY: (clientName, balance, targetBalance, paymentLink) => `
Hi ${clientName}!

We wanted to give you a friendly heads up about your retainer balance.

Your Current Balance:
- Available: $${balance.toFixed(2)}
- Recommended: $${targetBalance.toFixed(2)}
- To add: $${(targetBalance - balance).toFixed(2)}

To keep your legal services running smoothly, we recommend topping up your retainer. This helps us continue working on your matters without any interruptions.

Add Funds to Retainer: ${paymentLink}

No rush—you can add funds whenever it's convenient for you. If you have any questions about your retainer or our services, just reply to this email or give us a call.

Thanks for choosing us!

Best regards,
Your Legal Team
    `,
    OWNER_SUBJECT: (clientName) => `Low Balance Alert - ${clientName}`,
    OWNER_BODY: (clientName, balance, targetBalance, lastActivity) => `
Low Balance Alert

Client ${clientName} has a low retainer balance.

Balance Status:
- Client: ${clientName}
- Current Balance: $${balance.toFixed(2)}
- Target Balance: $${targetBalance.toFixed(2)}
- Top-up Needed: $${(targetBalance - balance).toFixed(2)}
- Last Activity: ${lastActivity}

A low balance notification has been sent to the client. Consider following up if no payment is received within 24 hours.

This is an automated notification from your Blawby system.
    `
  },
  SERVICE_RESUMED: {
    CLIENT_SUBJECT: "Great news! Your services are back up and running",
    CLIENT_BODY: (clientName) => `
Welcome back, ${clientName}!

Great news—your retainer has been topped up and your legal services are now fully active again!

All systems are go! We're ready to continue working on your matters.

Thanks for keeping your retainer current. This helps us provide you with the best possible service without any interruptions.

If you need anything or have questions about your case, don't hesitate to reach out. We're here to help!

Best regards,
Your Legal Team
    `,
    OWNER_SUBJECT: (clientName) => `Service Resumed - ${clientName}`,
    OWNER_BODY: (clientName) => `
Service Resumed

Services have been resumed for client ${clientName}.

The client's balance has been topped up and services are now active.
    `
  },
  DAILY_DIGEST: {
    SUBJECT: "Your Blawby Daily Summary",
    BODY: (lowBalanceClients, paymentSummary, newClientsCount, todayRevenue, mattersNeedingTime) => `
Your Daily Blawby Summary

Here's a snapshot of client retainer activity and balances today.

TODAY'S ACTIVITY:
- New Clients: ${newClientsCount}
- Revenue: $${parseFloat(todayRevenue || 0).toFixed(2)}
- Total Payments Received: $${parseFloat(paymentSummary.total || 0).toFixed(2)}
- Clients Paid Today: ${paymentSummary.count}

${lowBalanceClients.length === 0
  ? `All client balances are in good standing. Great work!`
  : `
CLIENTS NEEDING ATTENTION (${lowBalanceClients.length})

${lowBalanceClients.map(client => {
  const balance = parseFloat(client.balance || 0);
  const targetBalance = parseFloat(client.targetBalance || 0);
  const topUpNeeded = Math.max(0, targetBalance - balance);
  
  return `
${client.name} (${client.email})
- Balance: $${balance.toFixed(2)}
- Target: $${targetBalance.toFixed(2)}
- Top-up Needed: $${topUpNeeded.toFixed(2)}
- Last Activity: ${client.lastActivity || 'N/A'}
- Email Sent: ${client.emailSent ? 'Yes' : 'No'}
- Send Top-up Reminder: ${generateSendEmailUrl(client.clientID, 'low_balance')}
${balance <= 0
  ? '- Status: Services Paused'
  : '- Status: Low Balance'}

`;
}).join('')}
Action recommended: Follow up with clients who haven't responded or whose services are paused.
`}

${mattersNeedingTime.length > 0 ? `
MATTERS NEEDING TIME ENTRIES (${mattersNeedingTime.length})

${mattersNeedingTime.map(matter => `
${matter.matterDescription} - ${matter.clientName} (${matter.clientEmail})
- Matter ID: ${matter.matterID}
- Client: ${matter.clientName} (${matter.clientEmail})
- Assigned Lawyer: ${matter.lawyerName} (${matter.lawyerEmail})
- Reason: ${matter.reason}
- Last Payment: ${matter.lastPaymentDate || 'None'}
- Days Since Last Time Entry: ${matter.daysSinceLastTimeEntry}
- Add Time Entry: ${generateAddTimeEntryUrl(matter.matterID, matter.lawyerID)}
- Nudge Lawyer: ${generateNudgeLawyerUrl(matter.matterID, matter.lawyerID)}

`).join('')}
Action recommended: Lawyers should add time entries for these matters. Use "Nudge Lawyer" to send a reminder email.
` : ''}

This summary was generated automatically by Blawby. Let us know if you'd like to tweak what you see here.
    `
  },
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
      ['LOW_BALANCE', 'CLIENT_SUBJECT'],
      ['LOW_BALANCE', 'CLIENT_BODY'],
      ['LOW_BALANCE', 'OWNER_SUBJECT'],
      ['LOW_BALANCE', 'OWNER_BODY'],
      ['SERVICE_RESUMED', 'CLIENT_SUBJECT'],
      ['SERVICE_RESUMED', 'CLIENT_BODY'],
      ['SERVICE_RESUMED', 'OWNER_SUBJECT'],
      ['SERVICE_RESUMED', 'OWNER_BODY'],
      ['DAILY_DIGEST', 'SUBJECT'],
      ['DAILY_DIGEST', 'BODY'],
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