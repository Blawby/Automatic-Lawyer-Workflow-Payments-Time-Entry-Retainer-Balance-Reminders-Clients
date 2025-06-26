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
    SUBJECT: "Your Daily Blawby Brief",
    BODY: (lowBalanceClients, paymentSummary, newClientsCount, todayRevenue, mattersNeedingTime, enhancedAnalytics, unassignedMatters) => {
      const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      let body = `Your Daily Blawby Brief – ${today}\n\n`;
      body += 'Here\'s your intelligent daily briefing. You have open tasks and matter updates that need review. Key action items are summarized below.\n\n';
      body += '─'.repeat(60) + '\n\n';
      
      // TODAY'S SNAPSHOT - Clean, scannable metrics
      body += '📊 TODAY\'S SNAPSHOT\n\n';
      body += `• New Clients: ${newClientsCount}\n`;
      body += `• New Matters: ${enhancedAnalytics.matterMovement.newMatters.length}\n`;
      body += `• Revenue Received: $${todayRevenue.toFixed(2)}\n`;
      body += `• Time Logged: ${enhancedAnalytics.timeTracking.totalHoursToday.toFixed(1)}h\n`;
      body += `• Lawyers Active Today: ${Object.keys(enhancedAnalytics.timeTracking.lawyersWithTimeToday).length}\n`;
      body += `• Matters Needing Time Entries: ${mattersNeedingTime.length}\n`;
      body += `• Unassigned Matters: ${unassignedMatters ? unassignedMatters.length : 0}\n\n`;
      
      // KEY ACTION ITEMS - Prioritized and actionable
      body += '🔔 KEY ACTION ITEMS\n\n';
      
      let hasActions = false;
      
      // Unassigned matters - high priority
      if (unassignedMatters && unassignedMatters.length > 0) {
        hasActions = true;
        body += `**Assign ${unassignedMatters.length === 1 ? 'Unassigned Matter' : 'Unassigned Matters'}**\n\n`;
        
        unassignedMatters.slice(0, 3).forEach(matter => {
          const openedDate = matter.openedDate ? new Date(matter.openedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
          const priority = matter.daysSinceOpened > 7 ? '🔥 **Urgent**' : matter.daysSinceOpened > 3 ? '⏳ **Pending**' : '🆕 **New**';
          
          body += `• ${priority} *${matter.matterDescription} – ${matter.clientName}*\n`;
          body += `  Practice Area: ${matter.practiceArea}\n`;
          body += `  Opened: ${openedDate} (${matter.daysSinceOpened} days ago)\n`;
          
          if (matter.suggestedLawyers.length > 0) {
            const suggestedNames = matter.suggestedLawyers.map(l => l.name).join(', ');
            body += `  Suggested: ${suggestedNames}\n`;
          } else {
            body += `  Suggested: *(No specialist available)*\n`;
          }
          
          body += `  🔗 **[Assign to Lawyer](${generateAssignMatterUrl(matter.matterID, matter.practiceArea)})**\n\n`;
        });
        
        if (unassignedMatters.length > 3) {
          body += `• ... and ${unassignedMatters.length - 3} more matters need assignment\n\n`;
        }
      }
      
      // Lawyers who need to log time
      if (enhancedAnalytics.timeTracking.lawyersWithNoTime.length > 0) {
        hasActions = true;
        body += `**Nudge Lawyers to Log Time**\n\n`;
        
        enhancedAnalytics.timeTracking.lawyersWithNoTime.forEach(lawyerID => {
          body += `• ⚠️ ${lawyerID} – No entry today\n`;
        });
        body += '\n';
      }
      
      // Matters needing time entries
      if (mattersNeedingTime.length > 0) {
        hasActions = true;
        body += `**Matters Needing Time Entries**\n\n`;
        
        mattersNeedingTime.slice(0, 3).forEach(matter => {
          const urgency = matter.daysSinceLastTimeEntry > 14 ? '🔥 **Overdue**' : matter.daysSinceLastTimeEntry > 7 ? '⚠️ **Needs Attention**' : '📝 **Due Soon**';
          
          body += `• ${urgency} *${matter.matterDescription} – ${matter.clientName}*\n`;
          body += `  Assigned: ${matter.lawyerName}\n`;
          body += `  Reason: ${matter.reason}\n`;
          body += `  Days since last entry: ${matter.daysSinceLastTimeEntry}\n`;
          body += `  🔗 **[Add Time Entry](${generateAddTimeEntryUrl(matter.matterID, matter.lawyerID)})** | **[Nudge Lawyer](${generateNudgeLawyerUrl(matter.matterID, matter.lawyerID)})**\n\n`;
        });
        
        if (mattersNeedingTime.length > 3) {
          body += `• ... and ${mattersNeedingTime.length - 3} more matters need time entries\n\n`;
        }
      }
      
      // Low balance clients
      if (lowBalanceClients.length > 0) {
        hasActions = true;
        body += `**Client Retainer Alert${lowBalanceClients.length > 1 ? 's' : ''}**\n\n`;
        
        lowBalanceClients.slice(0, 3).forEach(client => {
          const balance = parseFloat(client.balance);
          const status = balance <= 0 ? '🚫 **Services Paused**' : '💰 **Low Balance**';
          
          body += `• ${status} *${client.name}*\n`;
          body += `  Balance: $${client.balance} | Target: $${client.targetBalance}\n`;
          body += `  Top-up needed: $${client.topUp}\n`;
          body += `  🔗 **[Send Reminder](${generateSendEmailUrl(client.clientID, 'low_balance')})**\n\n`;
          
          // Email preview - cleaner format
          body += `📧 *Email Preview:*\n`;
          body += `> **Subject**: Retainer Balance Update – Action Needed\n\n`;
          body += `> Dear ${client.name},\n\n`;
          body += `> We hope you're doing well. Our records show your current retainer balance is $${client.balance}, `;
          body += `below your target of $${client.targetBalance}.\n\n`;
          body += `> Please top up by $${client.topUp} to continue uninterrupted services.\n\n`;
          body += `> Thank you,\n> Your Legal Team\n\n`;
        });
        
        if (lowBalanceClients.length > 3) {
          body += `• ... and ${lowBalanceClients.length - 3} more clients need attention\n\n`;
        }
      }
      
      if (!hasActions) {
        body += '✅ **All systems running smoothly** – No immediate actions needed today.\n\n';
      }
      
      // BULK ACTIONS - Only if multiple items
      const totalActions = (unassignedMatters ? unassignedMatters.length : 0) + 
                          enhancedAnalytics.timeTracking.lawyersWithNoTime.length + 
                          mattersNeedingTime.length + 
                          lowBalanceClients.length;
      
      if (totalActions > 3) {
        body += '📧 **BULK ACTIONS**\n\n';
        if (lowBalanceClients.length > 1) {
          body += `• Send all ${lowBalanceClients.length} low balance reminders: **[Send All](${generateSendAllEmailsUrl(lowBalanceClients.map(c => c.clientID))})**\n`;
        }
        body += '\n';
      }
      
      // RISK FLAGS - Only if there are actual risks
      const hasRisks = enhancedAnalytics.riskFlags.mattersWithNoRecentTime.length > 0 || 
                      enhancedAnalytics.riskFlags.clientsAtRisk.length > 0;
      
      if (hasRisks) {
        body += '⚠️ **RISK FLAGS**\n\n';
        if (enhancedAnalytics.riskFlags.mattersWithNoRecentTime.length > 0) {
          body += `• ${enhancedAnalytics.riskFlags.mattersWithNoRecentTime.length} matter${enhancedAnalytics.riskFlags.mattersWithNoRecentTime.length === 1 ? '' : 's'} overdue for time entries\n`;
        }
        if (enhancedAnalytics.riskFlags.clientsAtRisk.length > 0) {
          body += `• ${enhancedAnalytics.riskFlags.clientsAtRisk.length} client${enhancedAnalytics.riskFlags.clientsAtRisk.length === 1 ? '' : 's'} at risk of service interruption\n`;
        }
        body += '\n';
      }
      
      // TIME TRACKING INSIGHTS - Only if there's activity
      if (enhancedAnalytics.timeTracking.totalHoursToday > 0) {
        body += '⏱️ **TIME TRACKING INSIGHTS**\n\n';
        const lawyersWithEntries = Object.entries(enhancedAnalytics.timeTracking.lawyersWithTimeToday)
          .map(([lawyerID, hours]) => `${lawyerID} (${hours.toFixed(1)}h)`)
          .join(', ');
        body += `• Lawyers with time today: ${lawyersWithEntries}\n`;
        
        if (enhancedAnalytics.timeTracking.timeGaps.length > 0) {
          body += `• Time gaps detected: ${enhancedAnalytics.timeTracking.timeGaps.length} matter${enhancedAnalytics.timeTracking.timeGaps.length === 1 ? '' : 's'}\n`;
        }
        body += '\n';
      }
      
      // Warm, professional ending
      body += '─'.repeat(60) + '\n\n';
      body += '*Need changes to your summary? Let us know — Blawby is always learning.*\n\n';
      body += 'This briefing was generated automatically by your Blawby system. All action links are ready to use.';
      
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