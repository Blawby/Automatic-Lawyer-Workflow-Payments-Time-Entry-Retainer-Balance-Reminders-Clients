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
    SUBJECT: "Your Daily Blawby Summary",
    BODY: (lowBalanceClients, paymentSummary, newClientsCount, todayRevenue, mattersNeedingTime, enhancedAnalytics) => {
      let body = 'Your Daily Blawby Summary\n\n';
      body += 'Here\'s your intelligent daily briefing with key insights and action items.\n\n';
      
      // TODAY'S ACTIVITY Section - Streamlined and focused
      body += '📊 TODAY\'S ACTIVITY\n';
      body += `• New Clients: ${newClientsCount}\n`;
      body += `• New Matters: ${enhancedAnalytics.matterMovement.newMatters.length}\n`;
      body += `• Revenue Received: $${todayRevenue.toFixed(2)}\n`;
      body += `• Time Logged: ${enhancedAnalytics.timeTracking.totalHoursToday.toFixed(1)} hours\n`;
      body += `• Lawyers Active: ${Object.keys(enhancedAnalytics.timeTracking.lawyersWithTimeToday).length}\n`;
      body += `• Matters Needing Time: ${mattersNeedingTime.length}\n\n`;
      
      // KEY ACTION ITEMS Section - New and actionable
      body += '🔔 KEY ACTION ITEMS\n';
      
      // Action items for lawyers who need to log time
      if (enhancedAnalytics.timeTracking.lawyersWithNoTime.length > 0) {
        body += `${enhancedAnalytics.timeTracking.lawyersWithNoTime.length} lawyer(s) need to log time today:\n`;
        enhancedAnalytics.timeTracking.lawyersWithNoTime.forEach(lawyerID => {
          body += `• Nudge ${lawyerID} to log time\n`;
        });
        body += '\n';
      }
      
      // Action items for matters needing time entries
      if (mattersNeedingTime.length > 0) {
        body += `${mattersNeedingTime.length} matter(s) need time entries:\n`;
        mattersNeedingTime.slice(0, 3).forEach(matter => { // Show top 3
          body += `• Nudge ${matter.lawyerName} for "${matter.matterDescription}"\n`;
        });
        if (mattersNeedingTime.length > 3) {
          body += `• ... and ${mattersNeedingTime.length - 3} more matters\n`;
        }
        body += '\n';
      }
      
      // Action items for low balance clients
      if (lowBalanceClients.length > 0) {
        body += `${lowBalanceClients.length} client(s) need top-up reminders:\n`;
        lowBalanceClients.slice(0, 3).forEach(client => { // Show top 3
          body += `• Send reminder to ${client.name} (Balance: $${client.balance})\n`;
        });
        if (lowBalanceClients.length > 3) {
          body += `• ... and ${lowBalanceClients.length - 3} more clients\n`;
        }
        body += '\n';
      }
      
      if (enhancedAnalytics.timeTracking.lawyersWithNoTime.length === 0 && 
          mattersNeedingTime.length === 0 && 
          lowBalanceClients.length === 0) {
        body += '• All systems running smoothly - no immediate actions needed\n\n';
      }
      
      // TIME TRACKING INSIGHTS - Condensed
      if (enhancedAnalytics.timeTracking.totalHoursToday > 0) {
        body += '⏱️ TIME TRACKING\n';
        const lawyersWithEntries = Object.entries(enhancedAnalytics.timeTracking.lawyersWithTimeToday)
          .map(([lawyerID, hours]) => `${lawyerID} (${hours.toFixed(1)}h)`)
          .join(', ');
        body += `• Lawyers with time: ${lawyersWithEntries}\n`;
        
        if (enhancedAnalytics.timeTracking.timeGaps.length > 0) {
          body += `• Time gaps detected: ${enhancedAnalytics.timeTracking.timeGaps.length} matters\n`;
        }
        body += '\n';
      }
      
      // RISK FLAGS - Only show if there are actual risks
      const hasRisks = enhancedAnalytics.riskFlags.mattersWithNoRecentTime.length > 0 || 
                      enhancedAnalytics.riskFlags.clientsAtRisk.length > 0;
      
      if (hasRisks) {
        body += '⚠️ RISK FLAGS\n';
        if (enhancedAnalytics.riskFlags.mattersWithNoRecentTime.length > 0) {
          body += `• ${enhancedAnalytics.riskFlags.mattersWithNoRecentTime.length} matter(s) overdue for time entries\n`;
        }
        if (enhancedAnalytics.riskFlags.clientsAtRisk.length > 0) {
          body += `• ${enhancedAnalytics.riskFlags.clientsAtRisk.length} client(s) at risk of service interruption\n`;
        }
        body += '\n';
      }
      
      // CLIENT RETAINER DETAILS - Enhanced with email previews
      if (lowBalanceClients.length > 0) {
        body += '📧 CLIENT RETAINER UPDATES\n\n';
        
        lowBalanceClients.forEach(client => {
          const balance = parseFloat(client.balance);
          const daysSinceActivity = client.lastActivity !== 'Unknown' ? 
            Math.ceil((new Date() - new Date(client.lastActivity)) / (1000 * 60 * 60 * 24)) : 'Unknown';
          
          body += `${client.name} (${client.email})\n`;
          body += `• Balance: $${client.balance} | Target: $${client.targetBalance}\n`;
          body += `• Top-up needed: $${client.topUp}\n`;
          body += `• Days since last activity: ${daysSinceActivity}\n`;
          body += `• Status: ${balance <= 0 ? 'Services Paused' : 'Low Balance'}\n\n`;
          
          // Email preview
          body += '📧 Email Preview:\n';
          body += `Subject: Retainer Balance Update – Action Needed\n\n`;
          body += `Dear ${client.name},\n\n`;
          body += `We hope you're doing well. Our records show your current retainer balance is $${client.balance}, `;
          body += `below your target of $${client.targetBalance}.\n\n`;
          body += `Please top up by $${client.topUp} to continue uninterrupted services.\n\n`;
          body += `Thank you,\nYour Legal Team\n\n`;
          
          body += `🔗 Send This Reminder: ${generateSendEmailUrl(client.clientID, 'low_balance')}\n`;
          body += '─'.repeat(50) + '\n\n';
        });
      }
      
      // MATTERS NEEDING TIME - Enhanced with action links
      if (mattersNeedingTime.length > 0) {
        body += '📋 MATTERS NEEDING TIME ENTRIES\n\n';
        
        mattersNeedingTime.forEach(matter => {
          body += `${matter.matterDescription} – ${matter.clientName}\n`;
          body += `• Matter ID: ${matter.matterID}\n`;
          body += `• Assigned Lawyer: ${matter.lawyerName} (${matter.lawyerEmail})\n`;
          body += `• Reason: ${matter.reason}\n`;
          body += `• Days since last time entry: ${matter.daysSinceLastTimeEntry}\n\n`;
          
          body += `🔗 Add Time Entry: ${generateAddTimeEntryUrl(matter.matterID, matter.lawyerID)}\n`;
          body += `🔗 Nudge Lawyer: ${generateNudgeLawyerUrl(matter.matterID, matter.lawyerID)}\n`;
          body += '─'.repeat(50) + '\n\n';
        });
      }
      
      // Send all emails option if there are multiple clients
      if (lowBalanceClients.length > 1) {
        body += '📧 BULK ACTIONS\n';
        body += `Send all ${lowBalanceClients.length} low balance reminders: ${generateSendAllEmailsUrl(lowBalanceClients.map(c => c.clientID))}\n\n`;
      }
      
      body += 'This summary was generated automatically by Blawby. All action links are ready to use.';
      
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