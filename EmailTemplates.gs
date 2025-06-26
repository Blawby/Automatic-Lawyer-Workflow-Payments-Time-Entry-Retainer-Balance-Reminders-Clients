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
      
      // Build summary statistics
      const stats = {
        newClients: newClientsCount,
        revenue: todayRevenue,
        lowBalanceCount: lowBalanceClients.length,
        mattersNeedingTime: mattersNeedingTime.length,
        unassignedMatters: unassignedMatters ? unassignedMatters.length : 0
      };
      
      // Build sections using template literals and section builders
      const summarySection = renderSummaryStats(stats);
      
      // Build unassigned matters section
      let unassignedSection = '';
      if (unassignedMatters && unassignedMatters.length > 0) {
        const unassignedContent = unassignedMatters
          .slice(0, 3)
          .map(matter => renderUnassignedMatterBlock(matter))
          .join('');
        
        if (unassignedMatters.length > 3) {
          unassignedContent += `\n• ... and ${unassignedMatters.length - 3} more matters need assignment\n`;
        }
        
        unassignedSection = renderDigestSection(
          `Assign ${unassignedMatters.length === 1 ? 'Unassigned Matter' : 'Unassigned Matters'}`,
          unassignedContent
        );
      }
      
      // Build matters needing time section
      let timeEntrySection = '';
      if (mattersNeedingTime.length > 0) {
        const timeEntryContent = mattersNeedingTime
          .slice(0, 3)
          .map(matter => renderMatterBlock(matter))
          .join('');
        
        if (mattersNeedingTime.length > 3) {
          timeEntryContent += `\n• ... and ${mattersNeedingTime.length - 3} more matters need time entries\n`;
        }
        
        timeEntrySection = renderDigestSection('Matters Needing Time Entries', timeEntryContent);
      }
      
      // Build low balance section
      let lowBalanceSection = '';
      if (lowBalanceClients.length > 0) {
        const lowBalanceContent = lowBalanceClients
          .slice(0, 3)
          .map(client => renderClientBlock(client))
          .join('');
        
        if (lowBalanceClients.length > 3) {
          lowBalanceContent += `\n• ... and ${lowBalanceClients.length - 3} more clients need attention\n`;
        }
        
        lowBalanceSection = renderDigestSection(
          `Client Retainer Alert${lowBalanceClients.length > 1 ? 's' : ''}`,
          lowBalanceContent
        );
      }
      
      // Build lawyer nudge section
      let lawyerNudgeSection = '';
      if (enhancedAnalytics.timeTracking.lawyersWithNoTime.length > 0) {
        const lawyerContent = enhancedAnalytics.timeTracking.lawyersWithNoTime
          .map(lawyerID => `• ⚠️ ${lawyerID} – No entry today`)
          .join('\n');
        
        lawyerNudgeSection = renderDigestSection('Nudge Lawyers to Log Time', lawyerContent);
      }
      
      // Check if there are any actions
      const hasActions = unassignedSection || timeEntrySection || lowBalanceSection || lawyerNudgeSection;
      
      // Build the complete digest using template literals
      return `
Your Daily Blawby Brief – ${today}

Here's your intelligent daily briefing. You have open tasks and matter updates that need review. Key action items are summarized below.

${'─'.repeat(60)}

${summarySection}

🔔 KEY ACTION ITEMS

${hasActions ? 
  `${unassignedSection}${timeEntrySection}${lowBalanceSection}${lawyerNudgeSection}` : 
  '✅ **All systems running smoothly** – No immediate actions needed today.\n'
}

${'─'.repeat(60)}

*Need changes to your summary? Let us know — Blawby is always learning.*

This briefing was generated automatically by your Blawby system. All action links are ready to use.`.trim();
    }
  },
  DAILY_DIGEST_HTML: {
    SUBJECT: "Your Daily Blawby Brief",
    BODY: (lowBalanceClients, paymentSummary, newClientsCount, todayRevenue, mattersNeedingTime, enhancedAnalytics, unassignedMatters) => {
      const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      let body = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Blawby Brief - ${today}</title>
</head>
<body style="font-family: 'Proxima Nova', Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b;">
<div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; box-sizing: border-box;">
    
    <!-- Header -->
    <div style="text-align: center; padding: 20px 0;">
        <h1 style="color: #1e3a8a; font-size: 28px; font-weight: 600; margin: 0;">Your Daily Blawby Brief</h1>
        <p style="color: #64748b; font-size: 16px; margin: 8px 0 0 0;">${today}</p>
    </div>
    
    <!-- Intro -->
    <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
            Here's your intelligent daily briefing. You have open tasks and matter updates that need review. Key action items are summarized below.
        </p>
    </div>
    
    <!-- Today's Snapshot Card -->
    <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #1e3a8a; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">📊 Today's Snapshot</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="padding: 12px; background-color: #f8fafc; border-radius: 8px;">
                <div style="color: #64748b; font-size: 14px; font-weight: 500;">New Clients</div>
                <div style="color: #1e293b; font-size: 18px; font-weight: 600;">${newClientsCount}</div>
            </div>
            <div style="padding: 12px; background-color: #f8fafc; border-radius: 8px;">
                <div style="color: #64748b; font-size: 14px; font-weight: 500;">New Matters</div>
                <div style="color: #1e293b; font-size: 18px; font-weight: 600;">${enhancedAnalytics.matterMovement.newMatters.length}</div>
            </div>
            <div style="padding: 12px; background-color: #f8fafc; border-radius: 8px;">
                <div style="color: #64748b; font-size: 14px; font-weight: 500;">Revenue Received</div>
                <div style="color: #1e293b; font-size: 18px; font-weight: 600;">$${todayRevenue.toFixed(2)}</div>
            </div>
            <div style="padding: 12px; background-color: #f8fafc; border-radius: 8px;">
                <div style="color: #64748b; font-size: 14px; font-weight: 500;">Time Logged</div>
                <div style="color: #1e293b; font-size: 18px; font-weight: 600;">${enhancedAnalytics.timeTracking.totalHoursToday.toFixed(1)}h</div>
            </div>
            <div style="padding: 12px; background-color: #f8fafc; border-radius: 8px;">
                <div style="color: #64748b; font-size: 14px; font-weight: 500;">Lawyers Active</div>
                <div style="color: #1e293b; font-size: 18px; font-weight: 600;">${Object.keys(enhancedAnalytics.timeTracking.lawyersWithTimeToday).length}</div>
            </div>
            <div style="padding: 12px; background-color: #f8fafc; border-radius: 8px;">
                <div style="color: #64748b; font-size: 14px; font-weight: 500;">Matters Needing Time</div>
                <div style="color: #1e293b; font-size: 18px; font-weight: 600;">${mattersNeedingTime.length}</div>
            </div>
        </div>
    </div>`;
      
      // Key Action Items Section
      let hasActions = false;
      
      // Unassigned Matters
      if (unassignedMatters && unassignedMatters.length > 0) {
        hasActions = true;
        body += `
    <!-- Unassigned Matters Card -->
    <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #1e3a8a; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">🔔 Assign Unassigned Matter${unassignedMatters.length > 1 ? 's' : ''}</h2>`;
        
        unassignedMatters.slice(0, 3).forEach(matter => {
          const openedDate = matter.openedDate ? new Date(matter.openedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
          const priority = matter.daysSinceOpened > 7 ? '🔥 Urgent' : matter.daysSinceOpened > 3 ? '⏳ Pending' : '🆕 New';
          const priorityColor = matter.daysSinceOpened > 7 ? '#dc2626' : matter.daysSinceOpened > 3 ? '#f59e0b' : '#059669';
          
          body += `
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                    <div style="color: ${priorityColor}; font-size: 14px; font-weight: 600; margin-bottom: 4px;">${priority}</div>
                    <div style="color: #1e293b; font-size: 16px; font-weight: 600;">${matter.matterDescription}</div>
                    <div style="color: #64748b; font-size: 14px;">Client: ${matter.clientName}</div>
                </div>
            </div>
            <div style="color: #64748b; font-size: 14px; margin-bottom: 12px;">
                <div>Practice Area: ${matter.practiceArea}</div>
                <div>Opened: ${openedDate} (${matter.daysSinceOpened} days ago)</div>
                <div>Suggested: ${matter.suggestedLawyers.length > 0 ? matter.suggestedLawyers.map(l => l.name).join(', ') : '(No specialist available)'}</div>
            </div>
            <a href="${generateAssignMatterUrl(matter.matterID, matter.practiceArea)}" 
               style="display: inline-block; padding: 12px 24px; background-color: #1e3a8a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                Assign to Lawyer
            </a>
        </div>`;
        });
        
        if (unassignedMatters.length > 3) {
          body += `
        <div style="text-align: center; color: #64748b; font-size: 14px;">
            ... and ${unassignedMatters.length - 3} more matters need assignment
        </div>`;
        }
        
        body += `
    </div>`;
      }
      
      // Matters Needing Time Entries
      if (mattersNeedingTime.length > 0) {
        hasActions = true;
        body += `
    <!-- Matters Needing Time Card -->
    <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #1e3a8a; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">📋 Matters Needing Time Entries</h2>`;
        
        mattersNeedingTime.slice(0, 3).forEach(matter => {
          const urgency = matter.daysSinceLastTimeEntry > 14 ? '🔥 Overdue' : matter.daysSinceLastTimeEntry > 7 ? '⚠️ Needs Attention' : '📝 Due Soon';
          const urgencyColor = matter.daysSinceLastTimeEntry > 14 ? '#dc2626' : matter.daysSinceLastTimeEntry > 7 ? '#f59e0b' : '#059669';
          
          // Email preview for nudge
          const nudgeSubject = `Time Entry Reminder - ${matter.matterDescription}`;
          const nudgeBody = `Hi ${matter.lawyerName},\n\nThis is a friendly reminder that the matter "${matter.matterDescription}" for client ${matter.clientName} needs a time entry.\n\nIt has been ${matter.daysSinceLastTimeEntry} days since the last time entry was logged.\n\nPlease log your time when convenient.\n\nBest regards,\nYour Legal Team`;
          
          body += `
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                    <div style="color: ${urgencyColor}; font-size: 14px; font-weight: 600; margin-bottom: 4px;">${urgency}</div>
                    <div style="color: #1e293b; font-size: 16px; font-weight: 600;">${matter.matterDescription}</div>
                    <div style="color: #64748b; font-size: 14px;">Client: ${matter.clientName}</div>
                </div>
            </div>
            <div style="color: #64748b; font-size: 14px; margin-bottom: 12px;">
                <div>Assigned: ${matter.lawyerName}</div>
                <div>Reason: ${matter.reason}</div>
                <div>Days since last entry: ${matter.daysSinceLastTimeEntry}</div>
            </div>
            
            <!-- Email Preview -->
            <div style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                <div style="color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 8px;">📧 Email Preview:</div>
                <div style="color: #1e293b; font-size: 13px; line-height: 1.4;">
                    <div style="font-weight: 600; margin-bottom: 4px;">Subject: ${nudgeSubject}</div>
                    <div style="color: #64748b; font-size: 12px; white-space: pre-line;">${nudgeBody.substring(0, 150)}${nudgeBody.length > 150 ? '...' : ''}</div>
                </div>
            </div>
            
            <div style="display: flex; gap: 8px;">
                <a href="${generateAddTimeEntryUrl(matter.matterID, matter.lawyerID)}" 
                   style="display: inline-block; padding: 10px 16px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 13px;">
                    Add Time Entry
                </a>
                <a href="${generateNudgeLawyerUrl(matter.matterID, matter.lawyerID)}" 
                   style="display: inline-block; padding: 10px 16px; background-color: #1e3a8a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 13px;">
                    Send Nudge
                </a>
            </div>
        </div>`;
        });
        
        if (mattersNeedingTime.length > 3) {
          body += `
        <div style="text-align: center; color: #64748b; font-size: 14px;">
            ... and ${mattersNeedingTime.length - 3} more matters need time entries
        </div>`;
        }
        
        body += `
    </div>`;
      }
      
      // Low Balance Clients
      if (lowBalanceClients.length > 0) {
        hasActions = true;
        body += `
    <!-- Low Balance Clients Card -->
    <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #1e3a8a; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">💰 Client Retainer Alert${lowBalanceClients.length > 1 ? 's' : ''}</h2>`;
        
        lowBalanceClients.slice(0, 3).forEach(client => {
          const balance = parseFloat(client.balance);
          const status = balance <= 0 ? '🚫 Services Paused' : '💰 Low Balance';
          const statusColor = balance <= 0 ? '#dc2626' : '#f59e0b';
          
          // Email preview for low balance reminder
          const reminderSubject = `Retainer Balance Update – Action Needed`;
          const reminderBody = `Dear ${client.name},\n\nWe hope you're doing well. Our records show your current retainer balance is $${client.balance}, below your target of $${client.targetBalance}.\n\nPlease top up by $${client.topUp} to continue uninterrupted services.\n\nThank you,\nYour Legal Team`;
          
          body += `
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                <div>
                    <div style="color: ${statusColor}; font-size: 14px; font-weight: 600; margin-bottom: 4px;">${status}</div>
                    <div style="color: #1e293b; font-size: 16px; font-weight: 600;">${client.name}</div>
                    <div style="color: #64748b; font-size: 14px;">${client.email}</div>
                </div>
            </div>
            <div style="color: #64748b; font-size: 14px; margin-bottom: 12px;">
                <div>Balance: $${client.balance} | Target: $${client.targetBalance}</div>
                <div>Top-up needed: $${client.topUp}</div>
            </div>
            
            <!-- Email Preview -->
            <div style="background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                <div style="color: #64748b; font-size: 12px; font-weight: 600; margin-bottom: 8px;">📧 Email Preview:</div>
                <div style="color: #1e293b; font-size: 13px; line-height: 1.4;">
                    <div style="font-weight: 600; margin-bottom: 4px;">Subject: ${reminderSubject}</div>
                    <div style="color: #64748b; font-size: 12px; white-space: pre-line;">${reminderBody.substring(0, 150)}${reminderBody.length > 150 ? '...' : ''}</div>
                </div>
            </div>
            
            <a href="${generateSendEmailUrl(client.clientID, 'low_balance')}" 
               style="display: inline-block; padding: 12px 24px; background-color: #1e3a8a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                Send Reminder
            </a>
        </div>`;
        });
        
        if (lowBalanceClients.length > 3) {
          body += `
        <div style="text-align: center; color: #64748b; font-size: 14px;">
            ... and ${lowBalanceClients.length - 3} more clients need attention
        </div>`;
        }
        
        body += `
    </div>`;
      }
      
      // All Systems Running Smoothly
      if (!hasActions) {
        body += `
    <!-- All Good Card -->
    <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <div style="text-align: center; color: #059669;">
            <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
            <h2 style="color: #059669; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;">All Systems Running Smoothly</h2>
            <p style="color: #64748b; font-size: 16px; margin: 0;">No immediate actions needed today.</p>
        </div>
    </div>`;
      }
      
      // Bulk Actions
      const totalActions = (unassignedMatters ? unassignedMatters.length : 0) + 
                          enhancedAnalytics.timeTracking.lawyersWithNoTime.length + 
                          mattersNeedingTime.length + 
                          lowBalanceClients.length;
      
      if (totalActions > 3 && lowBalanceClients.length > 1) {
        body += `
    <!-- Bulk Actions Card -->
    <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #1e3a8a; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">📧 Bulk Actions</h2>
        <a href="${generateSendAllEmailsUrl(lowBalanceClients.map(c => c.clientID))}" 
           style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
            Send All ${lowBalanceClients.length} Low Balance Reminders
        </a>
    </div>`;
      }
      
      // Footer
      body += `
    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
        <p style="margin: 0 0 8px 0;">Need changes to your summary? Let us know — Blawby is always learning.</p>
        <p style="margin: 0;">Powered by <a href="https://blawby.com" style="color: #1e3a8a;">Blawby</a></p>
    </div>
</div>
</body>
</html>`;
      
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

// ========== DIGEST SECTION BUILDERS ==========

/**
 * Render a client block for low balance section
 * @param {Object} client - Client data
 * @param {boolean} isPreview - Whether this is for preview
 * @return {string} - Formatted client block
 */
function renderClientBlock(client, isPreview = false) {
  const balance = Format.money(client.balance);
  const topUp = Format.money(client.topUp);
  const lastActivity = formatDate(client.lastActivity, 'relative');
  
  if (isPreview) {
    return `
• ${client.name} (${client.email})
  Balance: ${balance} | Top-up needed: ${topUp}
  Last activity: ${lastActivity}
  🔗 Send Top-up Reminder
`;
  }
  
  return `
• **${client.name}** (${client.email})
  Balance: ${balance} | Top-up needed: ${topUp}
  Last activity: ${lastActivity}
  🔗 **[Send Top-up Reminder](${generateSendEmailUrl(client.clientID, EMAIL_TYPES.LOW_BALANCE)})**
`;
}

/**
 * Render a matter block for time entry section
 * @param {Object} matter - Matter data
 * @param {boolean} isPreview - Whether this is for preview
 * @return {string} - Formatted matter block
 */
function renderMatterBlock(matter, isPreview = false) {
  const lastPayment = formatDate(matter.lastPaymentDate, 'short');
  const daysSince = matter.daysSinceLastTimeEntry;
  
  if (isPreview) {
    return `
• ${matter.matterDescription} – ${matter.clientName}
  Lawyer: ${matter.lawyerName} (${matter.lawyerID})
  Reason: ${matter.reason}
  Last payment: ${lastPayment} | No time entry for ${daysSince} days
  🔗 Add Time Entry | Nudge Lawyer
`;
  }
  
  return `
• **${matter.matterDescription}** – ${matter.clientName}
  Lawyer: ${matter.lawyerName} (${matter.lawyerID})
  Reason: ${matter.reason}
  Last payment: ${lastPayment} | No time entry for ${daysSince} days
  🔗 **[Add Time Entry](${generateAddTimeEntryUrl(matter.matterID, matter.lawyerID)})** | **[Nudge Lawyer](${generateNudgeLawyerUrl(matter.matterID, matter.lawyerID)})**
`;
}

/**
 * Render an unassigned matter block
 * @param {Object} matter - Unassigned matter data
 * @param {boolean} isPreview - Whether this is for preview
 * @return {string} - Formatted unassigned matter block
 */
function renderUnassignedMatterBlock(matter, isPreview = false) {
  const openedDate = formatDate(matter.openedDate, 'short');
  const priority = matter.daysSinceOpened > 7 ? '🔥 **Urgent**' : 
                   matter.daysSinceOpened > 3 ? '⏳ **Pending**' : '🆕 **New**';
  
  const suggestedNames = matter.suggestedLawyers.length > 0 
    ? matter.suggestedLawyers.map(l => l.name).join(', ')
    : '(No specialist available)';
  
  if (isPreview) {
    return `
• ${priority} ${matter.matterDescription} – ${matter.clientName}
  Practice Area: ${matter.practiceArea}
  Opened: ${openedDate} (${matter.daysSinceOpened} days ago)
  Suggested: ${suggestedNames}
  🔗 Assign to Lawyer
`;
  }
  
  return `
• ${priority} *${matter.matterDescription} – ${matter.clientName}*
  Practice Area: ${matter.practiceArea}
  Opened: ${openedDate} (${matter.daysSinceOpened} days ago)
  Suggested: ${suggestedNames}
  🔗 **[Assign to Lawyer](${generateAssignMatterUrl(matter.matterID, matter.practiceArea)})**
`;
}

/**
 * Render a digest section with title and content
 * @param {string} title - Section title
 * @param {string} content - Section content
 * @param {boolean} isPreview - Whether this is for preview
 * @return {string} - Formatted section
 */
function renderDigestSection(title, content, isPreview = false) {
  if (!content || content.trim() === '') return '';
  
  if (isPreview) {
    return `**${title}**\n\n${content}\n`;
  }
  
  return `**${title}**\n\n${content}\n`;
}

/**
 * Render summary statistics
 * @param {Object} stats - Statistics object
 * @param {boolean} isPreview - Whether this is for preview
 * @return {string} - Formatted statistics
 */
function renderSummaryStats(stats, isPreview = false) {
  const newClients = pluralize(stats.newClients, 'new client');
  const revenue = Format.money(stats.revenue);
  const lowBalanceCount = pluralize(stats.lowBalanceCount, 'client');
  const mattersNeedingTime = pluralize(stats.mattersNeedingTime, 'matter');
  const unassignedMatters = pluralize(stats.unassignedMatters, 'unassigned matter');
  
  if (isPreview) {
    return `
📊 **Daily Summary**
• ${newClients} added
• ${revenue} in revenue
• ${lowBalanceCount} need top-up reminders
• ${mattersNeedingTime} need time entries
• ${unassignedMatters} need assignment
`;
  }
  
  return `
📊 **Daily Summary**
• ${newClients} added
• ${revenue} in revenue  
• ${lowBalanceCount} need top-up reminders
• ${mattersNeedingTime} need time entries
• ${unassignedMatters} need assignment
`;
}

// ========== CENTRALIZED EMAIL GENERATION ==========

/**
 * Unified email template generator
 * Standardized interface for all email types with preview support
 * @param {string} type - Email type from EMAIL_TYPES
 * @param {Object} data - Email data
 * @param {Object} options - Options including preview mode
 * @return {Object} - Email object with subject and body
 */
function generateEmail(type, data, options = {}) {
  const { preview = false, recipient = 'CLIENT' } = options;
  
  switch (type) {
    case EMAIL_TYPES.LOW_BALANCE:
      return generateLowBalanceEmail(data, { preview, recipient });
    case EMAIL_TYPES.SERVICE_RESUMED:
      return generateServiceResumedEmail(data, { preview, recipient });
    case EMAIL_TYPES.MATTER_ASSIGNED:
      return generateMatterAssignedEmail(data, { preview });
    case EMAIL_TYPES.LAWYER_NUDGE:
      return generateLawyerNudgeEmail(data, { preview });
    case EMAIL_TYPES.DAILY_DIGEST:
      return generateDailyDigestEmail(data, { preview });
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

/**
 * Generate low balance warning email
 * @param {Object} data - Client data
 * @param {Object} options - Options including preview and recipient
 * @return {Object} - Email object with subject and body
 */
function generateLowBalanceEmail(data, options = {}) {
  const { preview = false, recipient = 'CLIENT' } = options;
  const client = data;
  
  const subject = preview ? 
    `[PREVIEW] Low Balance Warning - ${client.name}` :
    `Low Balance Warning - ${client.name}`;
  
  const balance = parseFloat(client.balance || 0);
  const targetBalance = parseFloat(client.targetBalance || 0);
  const topUpNeeded = Math.max(0, targetBalance - balance);
  
  const body = `Dear ${client.name},

Your retainer balance is currently ${Format.money(balance)}, which is below your target balance of ${Format.money(targetBalance)}.

To ensure uninterrupted service, please top up your retainer by ${Format.money(topUpNeeded)}.

You can make a payment by:
- Bank transfer to our trust account
- Credit card payment through our secure portal
- Check mailed to our office

If your balance falls to zero, we will need to pause services until payment is received.

Please contact us if you have any questions about your account or payment options.

Best regards,
Your Legal Team`;

  return { subject, body };
}

/**
 * Generate service resumed notification email
 * @param {Object} data - Client data
 * @param {Object} options - Options including preview and recipient
 * @return {Object} - Email object with subject and body
 */
function generateServiceResumedEmail(data, options = {}) {
  const { preview = false, recipient = 'CLIENT' } = options;
  const client = data;
  
  const subject = preview ? 
    `[PREVIEW] Services Resumed - ${client.name}` :
    `Services Resumed - ${client.name}`;
  
  const body = `Dear ${client.name},

Great news! Your retainer has been topped up and services have been resumed.

Your current balance is ${Format.money(client.balance)}.

We're ready to continue working on your legal matters. If you have any questions or need to discuss your case, please don't hesitate to reach out.

Best regards,
Your Legal Team`;

  return { subject, body };
}

/**
 * Generate matter assigned notification email
 * @param {Object} data - Matter and lawyer data
 * @param {Object} options - Options including preview
 * @return {Object} - Email object with subject and body
 */
function generateMatterAssignedEmail(data, options = {}) {
  const { preview = false } = options;
  const { matter, lawyer } = data;
  
  const subject = preview ? 
    `[PREVIEW] Matter Assigned - ${matter.description}` :
    `Matter Assigned - ${matter.description}`;
  
  const body = `Dear ${lawyer.name},

You have been assigned to the following matter:

Matter: ${matter.description}
Client: ${matter.clientName}
Practice Area: ${matter.practiceArea}
Matter ID: ${matter.matterID}

Please review the matter details and begin work as appropriate. You can add time entries through our system.

If you have any questions about this assignment, please contact the managing partner.

Best regards,
Management`;

  return { subject, body };
}

/**
 * Generate lawyer nudge email for time entries
 * @param {Object} data - Matter and lawyer data
 * @param {Object} options - Options including preview
 * @return {Object} - Email object with subject and body
 */
function generateLawyerNudgeEmail(data, options = {}) {
  const { preview = false } = options;
  const { matter, lawyer } = data;
  
  const subject = preview ? 
    `[PREVIEW] Time Entry Reminder - ${matter.description}` :
    `Time Entry Reminder - ${matter.description}`;
  
  const body = `Dear ${lawyer.name},

This is a friendly reminder to add time entries for the following matter:

Matter: ${matter.description}
Client: ${matter.clientName}
Days Since Last Time Entry: ${matter.daysSinceLastTimeEntry}

You can add time entries through our system. Please ensure all billable time is properly recorded.

Thank you for your attention to this matter.

Best regards,
Management`;

  return { subject, body };
}

/**
 * Generate daily digest email
 * @param {Object} data - Digest data
 * @param {boolean} previewOnly - Whether this is for preview
 * @return {Object} - Email object
 */
function generateDailyDigestEmail(data, previewOnly = false) {
  const { 
    lowBalanceClients, 
    paymentSummary, 
    newClientsCount, 
    todayRevenue, 
    mattersNeedingTime, 
    enhancedAnalytics, 
    unassignedMatters 
  } = data;
  
  const subject = "Your Daily Blawby Brief";
  
  // Use the existing digest template but with preview option
  const body = previewOnly ? 
    generateDailyDigestPreview(data) : 
    EmailTemplates.DAILY_DIGEST.BODY(
      lowBalanceClients, 
      paymentSummary, 
      newClientsCount, 
      todayRevenue, 
      mattersNeedingTime, 
      enhancedAnalytics, 
      unassignedMatters
    );
  
  return { subject, body };
}

/**
 * Generate daily digest preview (simplified version)
 * @param {Object} data - Digest data
 * @return {string} - Preview version of digest
 */
function generateDailyDigestPreview(data) {
  const { 
    lowBalanceClients, 
    newClientsCount, 
    todayRevenue, 
    mattersNeedingTime, 
    unassignedMatters 
  } = data;
  
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Build summary statistics
  const stats = {
    newClients: newClientsCount,
    revenue: todayRevenue,
    lowBalanceCount: lowBalanceClients.length,
    mattersNeedingTime: mattersNeedingTime.length,
    unassignedMatters: unassignedMatters ? unassignedMatters.length : 0
  };
  
  // Build sections using preview mode
  const summarySection = renderSummaryStats(stats, true);
  
  // Build unassigned matters section (preview)
  let unassignedSection = '';
  if (unassignedMatters && unassignedMatters.length > 0) {
    const unassignedContent = unassignedMatters
      .slice(0, 3)
      .map(matter => renderUnassignedMatterBlock(matter, true))
      .join('');
    
    if (unassignedMatters.length > 3) {
      unassignedContent += `\n• ... and ${unassignedMatters.length - 3} more matters need assignment\n`;
    }
    
    unassignedSection = renderDigestSection(
      `Assign ${unassignedMatters.length === 1 ? 'Unassigned Matter' : 'Unassigned Matters'}`,
      unassignedContent,
      true
    );
  }
  
  // Build matters needing time section (preview)
  let timeEntrySection = '';
  if (mattersNeedingTime.length > 0) {
    const timeEntryContent = mattersNeedingTime
      .slice(0, 3)
      .map(matter => renderMatterBlock(matter, true))
      .join('');
    
    if (mattersNeedingTime.length > 3) {
      timeEntryContent += `\n• ... and ${mattersNeedingTime.length - 3} more matters need time entries\n`;
    }
    
    timeEntrySection = renderDigestSection('Matters Needing Time Entries', timeEntryContent, true);
  }
  
  // Build low balance section (preview)
  let lowBalanceSection = '';
  if (lowBalanceClients.length > 0) {
    const lowBalanceContent = lowBalanceClients
      .slice(0, 3)
      .map(client => renderClientBlock(client, true))
      .join('');
    
    if (lowBalanceClients.length > 3) {
      lowBalanceContent += `\n• ... and ${lowBalanceClients.length - 3} more clients need attention\n`;
    }
    
    lowBalanceSection = renderDigestSection(
      `Client Retainer Alert${lowBalanceClients.length > 1 ? 's' : ''}`,
      lowBalanceContent,
      true
    );
  }
  
  // Check if there are any actions
  const hasActions = unassignedSection || timeEntrySection || lowBalanceSection;
  
  return `
Your Daily Blawby Brief – ${today}

Here's your intelligent daily briefing. You have open tasks and matter updates that need review. Key action items are summarized below.

${'─'.repeat(60)}

${summarySection}

🔔 KEY ACTION ITEMS

${hasActions ? 
  `${unassignedSection}${timeEntrySection}${lowBalanceSection}` : 
  '✅ **All systems running smoothly** – No immediate actions needed today.\n'
}

${'─'.repeat(60)}

*Need changes to your summary? Let us know — Blawby is always learning.*

This briefing was generated automatically by your Blawby system. All action links are ready to use.`.trim();
} 