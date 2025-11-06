/**
 * Voice Command Service - Comprehensive Command Registry
 * 
 * Handles voice command recognition, parsing, and execution for ALL system actions
 */

import { invokeLLM } from '../_core/llm';

export interface VoiceCommand {
  id: string;
  name: string;
  description: string;
  category: string;
  examples: string[];
  parameters?: {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    required: boolean;
    description: string;
  }[];
  action: string; // tRPC procedure path
}

// Comprehensive command registry covering ALL system actions
export const VOICE_COMMANDS: VoiceCommand[] = [
  
  // ============ NAVIGATION COMMANDS ============
  {
    id: 'nav_dashboard',
    name: 'Go to Dashboard',
    description: 'Navigate to the main dashboard',
    category: 'Navigation',
    examples: ['Go to dashboard', 'Show dashboard', 'Take me to dashboard', 'Open home'],
    action: 'navigation.dashboard',
  },
  {
    id: 'nav_cases',
    name: 'Go to Cases',
    description: 'Navigate to cases list',
    category: 'Navigation',
    examples: ['Go to cases', 'Show cases', 'Open cases', 'View all cases'],
    action: 'navigation.cases',
  },
  {
    id: 'nav_orders',
    name: 'Go to Orders',
    description: 'Navigate to order monitoring',
    category: 'Navigation',
    examples: ['Go to orders', 'Show orders', 'Open order monitoring'],
    action: 'navigation.orders',
  },
  {
    id: 'nav_inventory',
    name: 'Go to Inventory',
    description: 'Navigate to inventory management',
    category: 'Navigation',
    examples: ['Go to inventory', 'Show inventory', 'Open inventory'],
    action: 'navigation.inventory',
  },
  {
    id: 'nav_reports',
    name: 'Go to Reports',
    description: 'Navigate to reports and analytics',
    category: 'Navigation',
    examples: ['Go to reports', 'Show reports', 'Open analytics'],
    action: 'navigation.reports',
  },
  {
    id: 'nav_crm',
    name: 'Go to CRM',
    description: 'Navigate to CRM section',
    category: 'Navigation',
    examples: ['Go to CRM', 'Show contacts', 'Open CRM'],
    action: 'navigation.crm',
  },
  {
    id: 'nav_settings',
    name: 'Go to Settings',
    description: 'Navigate to settings',
    category: 'Navigation',
    examples: ['Go to settings', 'Open settings', 'Show preferences'],
    action: 'navigation.settings',
  },

  // ============ CASE MANAGEMENT COMMANDS ============
  {
    id: 'case_create',
    name: 'Create Case',
    description: 'Create a new dispute case',
    category: 'Cases',
    examples: ['Create new case', 'Start a new dispute', 'File a new claim', 'New case'],
    parameters: [
      { name: 'trackingNumber', type: 'string', required: false, description: 'Tracking number' },
      { name: 'carrier', type: 'string', required: false, description: 'Carrier name' },
      { name: 'amount', type: 'number', required: false, description: 'Claim amount' },
    ],
    action: 'cases.create',
  },
  {
    id: 'case_show',
    name: 'Show Case',
    description: 'Display a specific case',
    category: 'Cases',
    examples: ['Show case 12345', 'Open case CASE-001', 'Display case details for 12345', 'View case 12345'],
    parameters: [
      { name: 'caseNumber', type: 'string', required: true, description: 'Case number or ID' },
    ],
    action: 'cases.getById',
  },
  {
    id: 'case_update_status',
    name: 'Update Case Status',
    description: 'Update the status of a case',
    category: 'Cases',
    examples: [
      'Update case 12345 status to filed',
      'Mark case 12345 as resolved',
      'Change case status to awaiting response',
      'Set case 12345 to rejected',
    ],
    parameters: [
      { name: 'caseId', type: 'number', required: true, description: 'Case ID' },
      { name: 'status', type: 'string', required: true, description: 'New status (draft, filed, awaiting_response, resolved, rejected)' },
    ],
    action: 'cases.update',
  },
  {
    id: 'case_delete',
    name: 'Delete Case',
    description: 'Delete a case',
    category: 'Cases',
    examples: ['Delete case 12345', 'Remove case 12345', 'Cancel case 12345'],
    parameters: [
      { name: 'caseId', type: 'number', required: true, description: 'Case ID' },
    ],
    action: 'cases.delete',
  },
  {
    id: 'case_search',
    name: 'Search Cases',
    description: 'Search for cases',
    category: 'Cases',
    examples: [
      'Search for cases',
      'Find cases with FedEx',
      'Show all open cases',
      'Search cases by tracking number',
    ],
    parameters: [
      { name: 'query', type: 'string', required: false, description: 'Search query' },
      { name: 'status', type: 'string', required: false, description: 'Filter by status' },
      { name: 'carrier', type: 'string', required: false, description: 'Filter by carrier' },
    ],
    action: 'cases.list',
  },
  {
    id: 'case_export',
    name: 'Export Cases',
    description: 'Export cases to file',
    category: 'Cases',
    examples: ['Export cases', 'Download cases', 'Export to CSV', 'Save cases to file'],
    parameters: [
      { name: 'format', type: 'string', required: false, description: 'Export format (csv, excel, json)' },
    ],
    action: 'cases.export',
  },
  {
    id: 'case_import',
    name: 'Import Cases',
    description: 'Import cases from file',
    category: 'Cases',
    examples: ['Import cases', 'Upload cases', 'Import from file'],
    action: 'cases.import',
  },
  {
    id: 'case_bulk_update',
    name: 'Bulk Update Cases',
    description: 'Update multiple cases at once',
    category: 'Cases',
    examples: ['Bulk update cases', 'Update all selected cases', 'Change status for multiple cases'],
    parameters: [
      { name: 'caseIds', type: 'string', required: true, description: 'Comma-separated case IDs' },
      { name: 'status', type: 'string', required: false, description: 'New status' },
    ],
    action: 'cases.bulkUpdate',
  },

  // ============ EMAIL COMMANDS ============
  {
    id: 'email_send_dispute',
    name: 'Send Dispute Letter',
    description: 'Send dispute letter to carrier',
    category: 'Email',
    examples: [
      'Send dispute letter',
      'Email carrier about case 12345',
      'Send claim email',
      'File dispute via email',
    ],
    parameters: [
      { name: 'caseId', type: 'number', required: true, description: 'Case ID' },
    ],
    action: 'gmail.sendDisputeLetter',
  },
  {
    id: 'email_send_followup',
    name: 'Send Follow-up Email',
    description: 'Send follow-up email to carrier',
    category: 'Email',
    examples: ['Send follow-up', 'Follow up on case 12345', 'Send reminder email'],
    parameters: [
      { name: 'caseId', type: 'number', required: true, description: 'Case ID' },
    ],
    action: 'gmail.sendFollowUp',
  },
  {
    id: 'email_bulk_send',
    name: 'Bulk Send Emails',
    description: 'Send emails to multiple cases',
    category: 'Email',
    examples: ['Bulk send emails', 'Send emails to all cases', 'Mass email carriers'],
    parameters: [
      { name: 'caseIds', type: 'string', required: true, description: 'Comma-separated case IDs' },
    ],
    action: 'gmail.bulkSend',
  },

  // ============ GMAIL MONITORING COMMANDS ============
  {
    id: 'gmail_start',
    name: 'Start Gmail Monitoring',
    description: 'Start monitoring Gmail for carrier responses',
    category: 'Gmail Monitoring',
    examples: ['Start Gmail monitoring', 'Begin email monitoring', 'Monitor inbox', 'Start watching emails'],
    parameters: [
      { name: 'interval', type: 'number', required: false, description: 'Check interval in minutes (1-60)' },
    ],
    action: 'gmailMonitoring.start',
  },
  {
    id: 'gmail_stop',
    name: 'Stop Gmail Monitoring',
    description: 'Stop monitoring Gmail',
    category: 'Gmail Monitoring',
    examples: ['Stop Gmail monitoring', 'Stop email monitoring', 'Pause monitoring', 'Stop watching emails'],
    action: 'gmailMonitoring.stop',
  },
  {
    id: 'gmail_check_now',
    name: 'Check Gmail Now',
    description: 'Immediately check Gmail for new messages',
    category: 'Gmail Monitoring',
    examples: ['Check Gmail now', 'Check for new emails', 'Scan inbox now', 'Update emails'],
    action: 'gmailMonitoring.checkNow',
  },
  {
    id: 'gmail_show_status',
    name: 'Show Gmail Status',
    description: 'Show Gmail monitoring status',
    category: 'Gmail Monitoring',
    examples: ['Show Gmail status', 'Is monitoring active', 'Gmail monitoring status'],
    action: 'gmailMonitoring.getStatus',
  },
  {
    id: 'gmail_link_email',
    name: 'Link Email to Case',
    description: 'Manually link an email to a case',
    category: 'Gmail Monitoring',
    examples: ['Link email to case', 'Connect email to case 12345', 'Associate email with case'],
    parameters: [
      { name: 'emailId', type: 'number', required: true, description: 'Email ID' },
      { name: 'caseId', type: 'number', required: true, description: 'Case ID' },
    ],
    action: 'gmailMonitoring.linkEmail',
  },

  // ============ INVENTORY COMMANDS ============
  {
    id: 'inventory_check',
    name: 'Check Inventory',
    description: 'Check inventory levels',
    category: 'Inventory',
    examples: [
      'Check inventory',
      'Show stock levels',
      'How much inventory do we have',
      'Check stock for product 123',
    ],
    parameters: [
      { name: 'productId', type: 'number', required: false, description: 'Product ID' },
      { name: 'sku', type: 'string', required: false, description: 'Product SKU' },
    ],
    action: 'inventory.list',
  },
  {
    id: 'inventory_adjust',
    name: 'Adjust Inventory',
    description: 'Manually adjust inventory levels',
    category: 'Inventory',
    examples: ['Adjust inventory', 'Update stock levels', 'Change inventory count'],
    parameters: [
      { name: 'productId', type: 'number', required: true, description: 'Product ID' },
      { name: 'quantity', type: 'number', required: true, description: 'Quantity to add/subtract' },
      { name: 'reason', type: 'string', required: false, description: 'Adjustment reason' },
    ],
    action: 'inventory.adjust',
  },
  {
    id: 'inventory_transfer',
    name: 'Transfer Inventory',
    description: 'Transfer inventory between locations',
    category: 'Inventory',
    examples: ['Transfer inventory', 'Move stock to warehouse B', 'Transfer 100 units'],
    parameters: [
      { name: 'productId', type: 'number', required: true, description: 'Product ID' },
      { name: 'fromLocation', type: 'string', required: true, description: 'Source location' },
      { name: 'toLocation', type: 'string', required: true, description: 'Destination location' },
      { name: 'quantity', type: 'number', required: true, description: 'Quantity to transfer' },
    ],
    action: 'inventory.transfer',
  },
  {
    id: 'inventory_low_stock',
    name: 'Show Low Stock',
    description: 'Show products with low stock',
    category: 'Inventory',
    examples: ['Show low stock', 'What needs reordering', 'Low inventory alert', 'Products below reorder point'],
    action: 'inventory.getLowStock',
  },
  {
    id: 'inventory_valuation',
    name: 'Show Inventory Valuation',
    description: 'Show inventory valuation report',
    category: 'Inventory',
    examples: ['Show inventory value', 'What is our inventory worth', 'Inventory valuation', 'Total inventory value'],
    parameters: [
      { name: 'method', type: 'string', required: false, description: 'Valuation method (fifo, lifo, weighted_average)' },
    ],
    action: 'inventory.getValuation',
  },

  // ============ PURCHASE ORDER COMMANDS ============
  {
    id: 'po_create',
    name: 'Create Purchase Order',
    description: 'Create a new purchase order',
    category: 'Purchase Orders',
    examples: ['Create purchase order', 'New PO', 'Start a purchase order', 'Create PO for vendor'],
    parameters: [
      { name: 'vendorId', type: 'number', required: false, description: 'Vendor ID' },
    ],
    action: 'purchaseOrders.create',
  },
  {
    id: 'po_scan',
    name: 'Scan Purchase Order',
    description: 'Scan and process PO document with AI',
    category: 'Purchase Orders',
    examples: ['Scan purchase order', 'Upload PO', 'Process PO document', 'AI scan PO'],
    action: 'purchaseOrders.scanDocument',
  },
  {
    id: 'po_list',
    name: 'Show Purchase Orders',
    description: 'List all purchase orders',
    category: 'Purchase Orders',
    examples: ['Show purchase orders', 'List POs', 'View all POs', 'Show pending orders'],
    parameters: [
      { name: 'status', type: 'string', required: false, description: 'Filter by status' },
    ],
    action: 'purchaseOrders.list',
  },
  {
    id: 'po_approve',
    name: 'Approve Purchase Order',
    description: 'Approve a purchase order',
    category: 'Purchase Orders',
    examples: ['Approve PO 123', 'Approve purchase order', 'Confirm PO'],
    parameters: [
      { name: 'poId', type: 'number', required: true, description: 'PO ID' },
    ],
    action: 'purchaseOrders.approve',
  },
  {
    id: 'po_cancel',
    name: 'Cancel Purchase Order',
    description: 'Cancel a purchase order',
    category: 'Purchase Orders',
    examples: ['Cancel PO 123', 'Cancel purchase order', 'Void PO'],
    parameters: [
      { name: 'poId', type: 'number', required: true, description: 'PO ID' },
    ],
    action: 'purchaseOrders.cancel',
  },

  // ============ RECEIVING COMMANDS ============
  {
    id: 'receiving_create',
    name: 'Create Receiving',
    description: 'Create a new receiving record',
    category: 'Receiving',
    examples: ['Create receiving', 'Receive items', 'Start receiving', 'Receive PO 123'],
    parameters: [
      { name: 'poId', type: 'number', required: true, description: 'Purchase Order ID' },
    ],
    action: 'receiving.create',
  },
  {
    id: 'receiving_list',
    name: 'Show Receivings',
    description: 'List all receiving records',
    category: 'Receiving',
    examples: ['Show receivings', 'List receivings', 'View all receivings', 'Show pending receivings'],
    action: 'receiving.list',
  },
  {
    id: 'receiving_complete',
    name: 'Complete Inspection',
    description: 'Complete quality inspection for receiving',
    category: 'Receiving',
    examples: ['Complete inspection', 'Finish quality check', 'Approve receiving'],
    parameters: [
      { name: 'receivingId', type: 'number', required: true, description: 'Receiving ID' },
    ],
    action: 'receiving.completeInspection',
  },

  // ============ PRODUCT COMMANDS ============
  {
    id: 'product_create',
    name: 'Create Product',
    description: 'Create a new product',
    category: 'Products',
    examples: ['Create product', 'Add new product', 'New product', 'Add item to catalog'],
    parameters: [
      { name: 'name', type: 'string', required: true, description: 'Product name' },
      { name: 'sku', type: 'string', required: true, description: 'Product SKU' },
    ],
    action: 'products.create',
  },
  {
    id: 'product_list',
    name: 'Show Products',
    description: 'List all products',
    category: 'Products',
    examples: ['Show products', 'List products', 'View catalog', 'Show all items'],
    action: 'products.list',
  },
  {
    id: 'product_search',
    name: 'Search Products',
    description: 'Search for products',
    category: 'Products',
    examples: ['Search products', 'Find product', 'Search for SKU', 'Look up product'],
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Search query' },
    ],
    action: 'products.search',
  },
  {
    id: 'product_update',
    name: 'Update Product',
    description: 'Update product details',
    category: 'Products',
    examples: ['Update product', 'Edit product', 'Change product details'],
    parameters: [
      { name: 'productId', type: 'number', required: true, description: 'Product ID' },
    ],
    action: 'products.update',
  },
  {
    id: 'product_delete',
    name: 'Delete Product',
    description: 'Delete a product',
    category: 'Products',
    examples: ['Delete product', 'Remove product', 'Delete item'],
    parameters: [
      { name: 'productId', type: 'number', required: true, description: 'Product ID' },
    ],
    action: 'products.delete',
  },

  // ============ ORDER MONITORING COMMANDS ============
  {
    id: 'orders_list',
    name: 'Show Orders',
    description: 'List all orders',
    category: 'Orders',
    examples: ['Show orders', 'List orders', 'View all orders', 'Show pending orders'],
    parameters: [
      { name: 'status', type: 'string', required: false, description: 'Filter by status' },
    ],
    action: 'orders.list',
  },
  {
    id: 'orders_sync',
    name: 'Sync Orders',
    description: 'Sync orders from external sources',
    category: 'Orders',
    examples: ['Sync orders', 'Update orders', 'Refresh orders', 'Pull new orders'],
    action: 'orders.sync',
  },
  {
    id: 'orders_search',
    name: 'Search Orders',
    description: 'Search for orders',
    category: 'Orders',
    examples: ['Search orders', 'Find order', 'Look up order number'],
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Search query' },
    ],
    action: 'orders.search',
  },

  // ============ REPORT COMMANDS ============
  {
    id: 'report_generate',
    name: 'Generate Report',
    description: 'Generate a report',
    category: 'Reports',
    examples: ['Generate report', 'Create weekly report', 'Show analytics', 'Generate performance report'],
    parameters: [
      { name: 'type', type: 'string', required: false, description: 'Report type (weekly, monthly, performance)' },
    ],
    action: 'reports.generate',
  },
  {
    id: 'report_weekly',
    name: 'Generate Weekly Report',
    description: 'Generate weekly report',
    category: 'Reports',
    examples: ['Generate weekly report', 'Weekly summary', 'This week\'s report'],
    action: 'reports.generateWeekly',
  },
  {
    id: 'report_export',
    name: 'Export Report',
    description: 'Export report to file',
    category: 'Reports',
    examples: ['Export report', 'Download report', 'Save report to file'],
    parameters: [
      { name: 'reportId', type: 'number', required: true, description: 'Report ID' },
      { name: 'format', type: 'string', required: false, description: 'Export format (pdf, excel, csv)' },
    ],
    action: 'reports.export',
  },

  // ============ CRM COMMANDS ============
  {
    id: 'crm_contact_create',
    name: 'Create Contact',
    description: 'Create a new contact',
    category: 'CRM',
    examples: ['Create contact', 'Add new contact', 'New contact', 'Add person'],
    parameters: [
      { name: 'name', type: 'string', required: true, description: 'Contact name' },
      { name: 'email', type: 'string', required: false, description: 'Email address' },
    ],
    action: 'crm.contacts.create',
  },
  {
    id: 'crm_contact_list',
    name: 'Show Contacts',
    description: 'List all contacts',
    category: 'CRM',
    examples: ['Show contacts', 'List contacts', 'View all contacts'],
    action: 'crm.contacts.list',
  },
  {
    id: 'crm_company_create',
    name: 'Create Company',
    description: 'Create a new company',
    category: 'CRM',
    examples: ['Create company', 'Add new company', 'New company'],
    parameters: [
      { name: 'name', type: 'string', required: true, description: 'Company name' },
    ],
    action: 'crm.companies.create',
  },
  {
    id: 'crm_company_list',
    name: 'Show Companies',
    description: 'List all companies',
    category: 'CRM',
    examples: ['Show companies', 'List companies', 'View all companies'],
    action: 'crm.companies.list',
  },
  {
    id: 'crm_deal_create',
    name: 'Create Deal',
    description: 'Create a new deal',
    category: 'CRM',
    examples: ['Create deal', 'Add new deal', 'New opportunity'],
    parameters: [
      { name: 'title', type: 'string', required: true, description: 'Deal title' },
      { name: 'amount', type: 'number', required: false, description: 'Deal amount' },
    ],
    action: 'crm.deals.create',
  },
  {
    id: 'crm_deal_list',
    name: 'Show Deals',
    description: 'List all deals',
    category: 'CRM',
    examples: ['Show deals', 'List deals', 'View pipeline'],
    action: 'crm.deals.list',
  },
  {
    id: 'crm_activity_log',
    name: 'Log Activity',
    description: 'Log a CRM activity',
    category: 'CRM',
    examples: ['Log activity', 'Add note', 'Record call', 'Log meeting'],
    parameters: [
      { name: 'type', type: 'string', required: true, description: 'Activity type (call, email, meeting, note)' },
      { name: 'description', type: 'string', required: true, description: 'Activity description' },
    ],
    action: 'crm.activities.create',
  },

  // ============ SETTINGS COMMANDS ============
  {
    id: 'settings_email_template_create',
    name: 'Create Email Template',
    description: 'Create a new email template',
    category: 'Settings',
    examples: ['Create email template', 'New template', 'Add email template'],
    parameters: [
      { name: 'name', type: 'string', required: true, description: 'Template name' },
    ],
    action: 'settings.emailTemplates.create',
  },
  {
    id: 'settings_integration_connect',
    name: 'Connect Integration',
    description: 'Connect an external integration',
    category: 'Settings',
    examples: ['Connect integration', 'Add integration', 'Connect ShipStation', 'Link WooCommerce'],
    parameters: [
      { name: 'service', type: 'string', required: true, description: 'Service name' },
    ],
    action: 'settings.integrations.connect',
  },

  // ============ AI COMMANDS ============
  {
    id: 'ai_predictions',
    name: 'Show AI Predictions',
    description: 'Show AI predictions and insights',
    category: 'AI',
    examples: ['Show predictions', 'AI insights', 'What does AI predict', 'Show forecasts'],
    action: 'ai.predictions.list',
  },
  {
    id: 'ai_prescriptions',
    name: 'Show AI Prescriptions',
    description: 'Show AI recommendations',
    category: 'AI',
    examples: ['Show recommendations', 'AI suggestions', 'What should I do', 'Show prescriptions'],
    action: 'ai.prescriptions.list',
  },

  // ============ SEARCH & FILTER COMMANDS ============
  {
    id: 'search_global',
    name: 'Global Search',
    description: 'Search across all data',
    category: 'Search',
    examples: ['Search for', 'Find', 'Look up', 'Search everything'],
    parameters: [
      { name: 'query', type: 'string', required: true, description: 'Search query' },
    ],
    action: 'search.global',
  },
  {
    id: 'filter_apply',
    name: 'Apply Filter',
    description: 'Apply filter to current view',
    category: 'Search',
    examples: ['Filter by', 'Show only', 'Filter results'],
    parameters: [
      { name: 'field', type: 'string', required: true, description: 'Field to filter' },
      { name: 'value', type: 'string', required: true, description: 'Filter value' },
    ],
    action: 'filter.apply',
  },
  {
    id: 'filter_clear',
    name: 'Clear Filters',
    description: 'Clear all filters',
    category: 'Search',
    examples: ['Clear filters', 'Remove filters', 'Show all', 'Reset filters'],
    action: 'filter.clear',
  },

  // ============ VIEW COMMANDS ============
  {
    id: 'view_refresh',
    name: 'Refresh View',
    description: 'Refresh current view',
    category: 'View',
    examples: ['Refresh', 'Reload', 'Update view', 'Refresh page'],
    action: 'view.refresh',
  },
  {
    id: 'view_export',
    name: 'Export Current View',
    description: 'Export current view to file',
    category: 'View',
    examples: ['Export this', 'Download current view', 'Export to Excel'],
    parameters: [
      { name: 'format', type: 'string', required: false, description: 'Export format (csv, excel, pdf)' },
    ],
    action: 'view.export',
  },

  // ============ HELP COMMANDS ============
  {
    id: 'help_commands',
    name: 'Show Available Commands',
    description: 'Show all available voice commands',
    category: 'Help',
    examples: ['Show commands', 'What can I say', 'Help', 'Available commands'],
    action: 'help.commands',
  },
  {
    id: 'help_tutorial',
    name: 'Show Tutorial',
    description: 'Show voice command tutorial',
    category: 'Help',
    examples: ['Show tutorial', 'How to use voice', 'Voice help'],
    action: 'help.tutorial',
  },
];

/**
 * Parse voice input and match to command using AI
 */
export async function parseVoiceCommand(voiceInput: string): Promise<{
  command: VoiceCommand | null;
  parameters: Record<string, any>;
  confidence: number;
}> {
  try {
    // Group commands by category for better context
    const commandsByCategory = VOICE_COMMANDS.reduce((acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    }, {} as Record<string, VoiceCommand[]>);

    const prompt = `Parse this voice command and match it to one of the available commands.

Voice Input: "${voiceInput}"

Available Commands (${VOICE_COMMANDS.length} total):
${Object.entries(commandsByCategory).map(([category, commands]) => 
  `\n${category}:\n${commands.map(cmd => 
    `  - ${cmd.name}: ${cmd.description}\n    Examples: ${cmd.examples.slice(0, 2).join(', ')}\n    Params: ${cmd.parameters?.map(p => p.name).join(', ') || 'none'}`
  ).join('\n')}`
).join('\n')}

Extract:
1. Which command matches best (use command ID)
2. Any parameters mentioned in the voice input
3. Confidence score (0-1)

Return JSON with: { "commandId": "...", "parameters": {...}, "confidence": 0.0-1.0 }
If no match, return { "commandId": null, "confidence": 0 }`;

    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a voice command parser. Analyze the voice input and match it to the most appropriate command. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'command_parse',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              commandId: { type: ['string', 'null'] },
              parameters: { type: 'object', additionalProperties: true },
              confidence: { type: 'number' },
            },
            required: ['commandId', 'parameters', 'confidence'],
            additionalProperties: false,
          },
        },
      },
    });

    const result = JSON.parse(response.choices[0].message.content);

    if (!result.commandId || result.confidence < 0.6) {
      return {
        command: null,
        parameters: {},
        confidence: result.confidence,
      };
    }

    const command = VOICE_COMMANDS.find(cmd => cmd.id === result.commandId);

    return {
      command: command || null,
      parameters: result.parameters,
      confidence: result.confidence,
    };

  } catch (error) {
    console.error('[Voice Commands] Parse error:', error);
    return {
      command: null,
      parameters: {},
      confidence: 0,
    };
  }
}

/**
 * Get all available commands
 */
export function getAvailableCommands(): VoiceCommand[] {
  return VOICE_COMMANDS;
}

/**
 * Get commands by category
 */
export function getCommandsByCategory(): Record<string, VoiceCommand[]> {
  return VOICE_COMMANDS.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, VoiceCommand[]>);
}

/**
 * Get command by ID
 */
export function getCommandById(id: string): VoiceCommand | undefined {
  return VOICE_COMMANDS.find(cmd => cmd.id === id);
}

/**
 * Search commands
 */
export function searchCommands(query: string): VoiceCommand[] {
  const lowerQuery = query.toLowerCase();
  return VOICE_COMMANDS.filter(cmd =>
    cmd.name.toLowerCase().includes(lowerQuery) ||
    cmd.description.toLowerCase().includes(lowerQuery) ||
    cmd.examples.some(ex => ex.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Validate command parameters
 */
export function validateCommandParameters(
  command: VoiceCommand,
  parameters: Record<string, any>
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (command.parameters) {
    for (const param of command.parameters) {
      if (param.required && !parameters[param.name]) {
        missing.push(param.name);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
