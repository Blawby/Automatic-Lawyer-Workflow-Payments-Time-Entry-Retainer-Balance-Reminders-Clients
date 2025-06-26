/**
 * DigestRenderer Module
 * Centralized rendering functions for digest components
 * Enables easy scaling to multiple output formats (email, Slack, web)
 */

/**
 * DigestData structure for organized digest content
 * Makes testing easier, future JSON APIs easier to return, and multiple render targets trivial to add
 * @typedef {Object} DigestData
 * @property {Array} clientsNeedingTopUp - Clients with low balances
 * @property {Array} mattersNeedingTime - Matters needing time entries
 * @property {Array} unassignedMatters - Matters without assigned lawyers
 * @property {Object} summaryStats - Summary statistics
 * @property {Array} actionRecommendations - Recommended actions
 */

/**
 * Generic digest section renderer
 * Eliminates redundancy across all section rendering functions
 * @param {string} title - Section title
 * @param {Array} items - Array of items to render
 * @param {Function} renderFn - Function to render each item
 * @param {boolean} isPreview - Whether this is for preview mode
 * @return {string} - Formatted section
 */
function renderDigestSection(title, items, renderFn, isPreview = false) {
  if (!items || items.length === 0) return '';
  
  const header = isPreview ? 
    `\n\n**${title}**\n` : 
    renderSectionHeader(title);
  
  const content = items.map(renderFn).join('\n\n');
  return `${header}${content}\n`;
}

/**
 * Render a client block for digest
 * @param {Object} client - Client data
 * @param {boolean} isPreview - Whether this is for preview mode
 * @return {string} - Formatted client block
 */
function renderClientBlock(client, isPreview = false) {
  const balance = parseFloat(client.balance || 0);
  const targetBalance = parseFloat(client.targetBalance || 0);
  const topUpNeeded = Math.max(0, targetBalance - balance);
  
  if (isPreview) {
    return `📧 **${client.name}** (${client.email})
• Balance: ${Format.money(balance)}
• Target: ${Format.money(targetBalance)}
• Top-up Needed: ${Format.money(topUpNeeded)}
• Status: ${balance <= 0 ? 'Services Paused' : 'Low Balance'}
• Last Activity: ${client.lastActivity || 'N/A'}`;
  }
  
  return `${client.name} (${client.email})
  Balance: ${Format.money(balance)}
  Target: ${Format.money(targetBalance)}
  Top-up Needed: ${Format.money(topUpNeeded)}
  Last Activity: ${client.lastActivity || 'N/A'}
  Email Sent: ${client.emailSent ? 'Yes' : 'No'}
  Send Top-up Reminder: ${generateSendEmailUrl(client.clientID, 'low_balance')}
  Status: ${balance <= 0 ? 'Services Paused' : 'Low Balance'}`;
}

/**
 * Render a matter block for digest
 * @param {Object} matter - Matter data
 * @param {boolean} isPreview - Whether this is for preview mode
 * @return {string} - Formatted matter block
 */
function renderMatterBlock(matter, isPreview = false) {
  if (isPreview) {
    return `📋 **${matter.matterDescription}** (${matter.clientName})
• Client: ${matter.clientName} (${matter.clientEmail})
• Matter ID: ${matter.matterID}
• Reason: ${matter.reason}
• Lawyer: ${matter.lawyerName} (${matter.lawyerEmail})
• Days Since Last Time: ${matter.daysSinceLastTimeEntry}`;
  }
  
  return `${matter.matterDescription} (${matter.clientName})
  Client: ${matter.clientName} (${matter.clientEmail})
  Matter ID: ${matter.matterID}
  Matter Date: ${matter.matterDate}
  Reason: ${matter.reason}
  Last Payment Date: ${matter.lastPaymentDate}
  Days Since Last Time Entry: ${matter.daysSinceLastTimeEntry}
  Lawyer: ${matter.lawyerName} (${matter.lawyerEmail})
  Add Time Entry: ${generateAddTimeEntryUrl(matter.matterID, matter.lawyerID)}`;
}

/**
 * Render an unassigned matter block for digest
 * @param {Object} matter - Unassigned matter data
 * @param {boolean} isPreview - Whether this is for preview mode
 * @return {string} - Formatted unassigned matter block
 */
function renderUnassignedMatterBlock(matter, isPreview = false) {
  if (isPreview) {
    return `🔔 **${matter.description}** (${matter.clientName})
• Client: ${matter.clientName} (${matter.clientEmail})
• Practice Area: ${matter.practiceArea}
• Days Since Opened: ${matter.daysSinceOpened}
• Suggested Lawyers: ${matter.suggestedLawyers.join(', ')}`;
  }
  
  return `${matter.description} (${matter.clientName})
  Client: ${matter.clientName} (${matter.clientEmail})
  Practice Area: ${matter.practiceArea}
  Days Since Opened: ${matter.daysSinceOpened}
  Suggested Lawyers: ${matter.suggestedLawyers.join(', ')}
  Assign to Lawyer: ${generateAssignMatterUrl(matter.matterID, matter.practiceArea)}`;
}

/**
 * Render a section with title and content
 * @param {string} title - Section title
 * @param {Array} contentArray - Array of content blocks
 * @param {boolean} isPreview - Whether this is for preview mode
 * @return {string} - Formatted section
 */
function renderSection(title, contentArray, isPreview = false) {
  if (!contentArray || contentArray.length === 0) {
    return '';
  }
  
  const sectionHeader = isPreview ? 
    `\n\n**${title}**\n` : 
    renderSectionHeader(title);
  
  const content = contentArray.join('\n\n');
  
  return `${sectionHeader}${content}\n`;
}

/**
 * Render summary statistics
 * @param {Object} stats - Summary statistics
 * @param {boolean} isPreview - Whether this is for preview mode
 * @return {string} - Formatted summary
 */
function renderSummaryStats(stats, isPreview = false) {
  if (isPreview) {
    return `📊 **Today's Activity**
• New Clients: ${stats.newClients}
• Revenue: ${Format.money(stats.revenue)}
• Low Balance Clients: ${stats.lowBalanceClients}
• Matters Needing Time: ${stats.mattersNeedingTime}
• Unassigned Matters: ${stats.unassignedMatters}`;
  }
  
  return `- New Clients: ${stats.newClients || 0}
- Revenue: ${Format.money(stats.revenue || 0)}
${stats.paymentSummary ? `- Total Payments Received: ${Format.money(stats.paymentSummary.total || 0)}
- Clients Paid Today: ${stats.paymentSummary.count}` : ''}`;
}

/**
 * Render action recommendations
 * @param {Object} data - Digest data
 * @param {boolean} isPreview - Whether this is for preview mode
 * @return {string} - Formatted action recommendations
 */
function renderActionRecommendations(data, isPreview = false) {
  const recommendations = [];
  
  if (data.lowBalanceClients && data.lowBalanceClients.length > 0) {
    recommendations.push('Follow up with clients who haven\'t responded or whose services are paused');
  }
  
  if (data.mattersNeedingTime && data.mattersNeedingTime.length > 0) {
    recommendations.push('Follow up with matters needing time entries');
  }
  
  if (data.unassignedMatters && data.unassignedMatters.length > 0) {
    recommendations.push('Assign lawyers to unassigned matters');
  }
  
  if (recommendations.length === 0) {
    return isPreview ? 
      '✅ All systems are running smoothly!' :
      'All client balances are in good standing. Great work!';
  }
  
  return isPreview ?
    `🎯 **Action Items**\n${recommendations.map(rec => `• ${rec}`).join('\n')}` :
    `Action recommended: ${recommendations.join('. ')}.`;
}

/**
 * Create digest data structure from raw data
 * @param {Object} data - Raw digest data
 * @return {DigestData} - Structured digest data
 */
function createDigestData(data) {
  return {
    clientsNeedingTopUp: data.lowBalanceClients || [],
    mattersNeedingTime: data.mattersNeedingTime || [],
    unassignedMatters: data.unassignedMatters || [],
    summaryStats: {
      newClients: data.newClients || 0,
      revenue: data.revenue || 0,
      lowBalanceClients: (data.lowBalanceClients || []).length,
      mattersNeedingTime: (data.mattersNeedingTime || []).length,
      unassignedMatters: (data.unassignedMatters || []).length,
      paymentSummary: data.paymentSummary
    },
    actionRecommendations: generateActionRecommendations(data)
  };
}

/**
 * Render full digest using structured data
 * @param {DigestData} digestData - Structured digest data
 * @param {boolean} isPreview - Whether this is for preview mode
 * @return {string} - Complete digest content
 */
function renderFullDigest(digestData, isPreview = false) {
  const sections = [
    renderDigestSection('Summary', [digestData.summaryStats], renderSummaryStats, isPreview),
    renderDigestSection('Clients Needing Top-Up', digestData.clientsNeedingTopUp, renderClientBlock, isPreview),
    renderDigestSection('Matters Needing Time Entries', digestData.mattersNeedingTime, renderMatterBlock, isPreview),
    renderDigestSection('Unassigned Matters', digestData.unassignedMatters, renderUnassignedMatterBlock, isPreview),
    renderDigestSection('Action Recommendations', [digestData.actionRecommendations], renderActionRecommendations, isPreview)
  ];
  
  return sections.filter(section => section).join('\n');
}

/**
 * Test edge cases for digest rendering
 * This function helps validate the digest system with various data scenarios
 */
function testDigestEdgeCases() {
  // Test 1: No matters, but clients with balance issues
  const testCase1 = {
    lowBalanceClients: [
      {
        name: 'John Smith',
        email: 'john@example.com',
        balance: 100,
        targetBalance: 500,
        lastActivity: '2024-01-15',
        emailSent: false,
        clientID: 'client1'
      }
    ],
    mattersNeedingTime: [],
    unassignedMatters: [],
    newClientsCount: 0,
    todayRevenue: 0
  };
  
  renderClientBlock(testCase1.lowBalanceClients[0], true);
  
  // Test 2: All lawyers logged time (no matters needing time)
  const testCase2 = {
    lowBalanceClients: [],
    mattersNeedingTime: [],
    unassignedMatters: [],
    newClientsCount: 2,
    todayRevenue: 1500
  };
  
  renderActionRecommendations(testCase2, true);
  
  // Test 3: Long client/matter names
  const testCase3 = {
    lowBalanceClients: [
      {
        name: 'Very Long Client Name That Might Cause Wrapping Issues In Email Templates And Digest Rendering',
        email: 'verylongclientname@verylongdomainname.com',
        balance: 50,
        targetBalance: 1000,
        lastActivity: '2024-01-15',
        emailSent: true,
        clientID: 'client2'
      }
    ],
    mattersNeedingTime: [
      {
        matterDescription: 'Extremely Long Matter Description That Could Potentially Cause Line Wrapping Issues In Various Email Clients And Digest Formats',
        clientName: 'Another Very Long Client Name',
        clientEmail: 'anotherlongclient@example.com',
        matterID: 'M-2024-001',
        matterDate: '2024-01-15',
        reason: 'Recent payment received but no time logged',
        lastPaymentDate: '2024-01-15',
        daysSinceLastTimeEntry: 5,
        lawyerName: 'Attorney With Very Long Name',
        lawyerEmail: 'longattorneyname@lawfirm.com',
        lawyerID: 'lawyer1'
      }
    ],
    unassignedMatters: [],
    newClientsCount: 1,
    todayRevenue: 500
  };
  
  renderClientBlock(testCase3.lowBalanceClients[0], true);
  renderMatterBlock(testCase3.mattersNeedingTime[0], true);
  
  // Test 4: Matter with multiple flags
  const testCase4 = {
    lowBalanceClients: [],
    mattersNeedingTime: [],
    unassignedMatters: [
      {
        description: 'Complex Matter with Multiple Issues',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        practiceArea: 'Corporate Law',
        daysSinceOpened: 10,
        suggestedLawyers: ['John Doe', 'Jane Smith', 'Bob Johnson'],
        matterID: 'M-2024-002'
      }
    ],
    newClientsCount: 0,
    todayRevenue: 0
  };
  
  renderUnassignedMatterBlock(testCase4.unassignedMatters[0], true);
} 