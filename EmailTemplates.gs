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
    BODY: (lowBalanceClients, paymentSummary, newClientsCount, todayRevenue, mattersNeedingTime, enhancedAnalytics) => {
      let body = 'Your Daily Blawby Summary\n\n';
      body += 'Here\'s a snapshot of client retainer activity and balances today.\n\n';
      
      // TODAY'S ACTIVITY Section
      body += '📅 TODAY\'S ACTIVITY\n';
      body += `New Clients: ${newClientsCount}\n`;
      body += `New Matters Opened: ${enhancedAnalytics.matterMovement.newMatters.length}\n`;
      body += `Total Revenue Received: $${todayRevenue.toFixed(2)}\n`;
      body += `Clients Who Made Payments: ${paymentSummary.count}\n`;
      body += `Time Entries Logged Today: ${enhancedAnalytics.timeTracking.totalHoursToday.toFixed(1)} hours\n`;
      
      // Lawyers with entries today
      const lawyersWithEntries = Object.entries(enhancedAnalytics.timeTracking.lawyersWithTimeToday)
        .map(([lawyerID, hours]) => `${lawyerID} (${hours.toFixed(1)}h)`)
        .join(', ');
      body += `Lawyers With Entries Today: ${lawyersWithEntries || 'None'}\n`;
      body += `Time Entries Missing (Matters Needing Work): ${enhancedAnalytics.timeTracking.mattersActiveTodayWithNoTime}\n\n`;
      
      // TIME TRACKING INSIGHTS Section
      body += '⏱️ TIME TRACKING INSIGHTS\n';
      body += `- Total Time Logged Today: ${enhancedAnalytics.timeTracking.totalHoursToday.toFixed(1)}h\n`;
      body += `- Lawyers With No Time Logged: ${enhancedAnalytics.timeTracking.lawyersWithNoTime.length}\n`;
      body += `- Matters Active Today With No Time: ${enhancedAnalytics.timeTracking.mattersActiveTodayWithNoTime}\n`;
      
      if (enhancedAnalytics.timeTracking.timeGaps.length > 0) {
        body += `- Time Gaps (worked yesterday, no time today): ${enhancedAnalytics.timeTracking.timeGaps.length} matters\n`;
      }
      body += '\n';
      
      // MATTER UPDATES Section
      body += '📋 MATTER UPDATES\n';
      if (enhancedAnalytics.matterMovement.newMatters.length > 0) {
        body += `- ${enhancedAnalytics.matterMovement.newMatters.length} new matter(s) opened:\n`;
        enhancedAnalytics.matterMovement.newMatters.forEach(matter => {
          body += `  • ${matter[3]} – ${matter[2] || 'Unknown Client'}\n`;
        });
      } else {
        body += '- No new matters opened today\n';
      }
      body += `- Active matters: ${enhancedAnalytics.matterMovement.activeMatters}\n`;
      body += `- Completed matters: ${enhancedAnalytics.matterMovement.completedMatters}\n\n`;
      
      // CLIENT INTERACTIONS Section (placeholder for future API integration)
      body += '📞 CLIENT INTERACTIONS\n';
      body += `- Client emails received: ${enhancedAnalytics.clientInteractions.clientEmailsReceived}\n`;
      body += `- Calls scheduled: ${enhancedAnalytics.clientInteractions.callsScheduled}\n`;
      body += `- Meetings today: ${enhancedAnalytics.clientInteractions.meetingsToday}\n\n`;
      
      // RISK & FOLLOW-UP Section
      body += '⚠️ RISK & FOLLOW-UP\n';
      if (enhancedAnalytics.riskFlags.mattersWithNoRecentTime.length > 0) {
        body += `- ${enhancedAnalytics.riskFlags.mattersWithNoRecentTime.length} matter(s) with no time entry in 10+ days:\n`;
        enhancedAnalytics.riskFlags.mattersWithNoRecentTime.forEach(matter => {
          body += `  • ${matter.matterDescription} – ${matter.clientName} (${matter.daysSinceLastEntry} days)\n`;
        });
      }
      
      if (enhancedAnalytics.riskFlags.clientsAtRisk.length > 0) {
        body += `- ${enhancedAnalytics.riskFlags.clientsAtRisk.length} client(s) with balance below $100 and no top-up in 5+ days:\n`;
        enhancedAnalytics.riskFlags.clientsAtRisk.forEach(client => {
          body += `  • ${client.clientName} – $${client.balance.toFixed(2)} (${client.daysSinceLastPayment} days)\n`;
        });
      }
      
      if (enhancedAnalytics.riskFlags.mattersWithNoRecentTime.length === 0 && enhancedAnalytics.riskFlags.clientsAtRisk.length === 0) {
        body += '- No immediate risks identified\n';
      }
      body += '\n';
      
      // LOW BALANCE CLIENTS Section
      if (lowBalanceClients.length > 0) {
        body += `LOW BALANCE CLIENTS (${lowBalanceClients.length})\n\n`;
        body += lowBalanceClients.map(client => `
${client.name} (${client.email})
- Balance: $${client.balance} | Target: $${client.targetBalance} | Top-up needed: $${client.topUp}
- Last Activity: ${client.lastActivity}
- Email Sent: ${client.emailSent ? 'Yes' : 'No'}
- Send Top-up Reminder: ${generateSendEmailUrl(client.clientID, 'low_balance')}
${parseFloat(client.balance) <= 0
  ? '- Status: Services Paused'
  : '- Status: Low Balance'}

`).join('');
        body += 'Action recommended: Follow up with clients who haven\'t responded or whose services are paused.\n\n';
      }
      
      // MATTERS NEEDING TIME ENTRIES Section
      if (mattersNeedingTime.length > 0) {
        body += `MATTERS NEEDING TIME ENTRIES (${mattersNeedingTime.length})\n\n`;
        body += mattersNeedingTime.map(matter => `
${matter.matterDescription} - ${matter.clientName} (${matter.clientEmail})
- Matter ID: ${matter.matterID}
- Client: ${matter.clientName} (${matter.clientEmail})
- Assigned Lawyer: ${matter.lawyerName} (${matter.lawyerEmail})
- Reason: ${matter.reason}
- Last Payment: ${matter.lastPaymentDate || 'None'}
- Days Since Last Time Entry: ${matter.daysSinceLastTimeEntry}
- Add Time Entry: ${generateAddTimeEntryUrl(matter.matterID, matter.lawyerID)}
- Nudge Lawyer: ${generateNudgeLawyerUrl(matter.matterID, matter.lawyerID)}

`).join('');
        body += 'Action recommended: Lawyers should add time entries for these matters. Use "Nudge Lawyer" to send a reminder email.\n\n';
      }
      
      body += 'This summary was generated automatically by Blawby. Let us know if you\'d like to tweak what you see here.';
      
      return body;
    }
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