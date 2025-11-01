import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { radialMenuSettings } from "../../drizzle/schema";

export interface RadialMenuAction {
  id: string;
  label: string;
  icon: string; // Lucide icon name
  color: string;
  actionType: "navigate" | "api" | "quickEdit" | "export" | "custom";
  actionConfig: any; // Configuration specific to action type
  order: number;
  enabled: boolean;
  shortcut?: string;
}

export interface RadialMenuContext {
  casesPage?: RadialMenuAction[];
  caseDetail?: RadialMenuAction[];
  dashboard?: RadialMenuAction[];
  ordersPage?: RadialMenuAction[];
  productsPage?: RadialMenuAction[];
  auditsPage?: RadialMenuAction[];
  reportsPage?: RadialMenuAction[];
}

// Default action presets for each context
// Comprehensive action library with 80+ pre-built actions
export const actionLibrary = {
  navigation: [
    { id: "viewDetails", label: "View Details", icon: "Eye", actionType: "navigate", description: "Open detailed view" },
    { id: "editCase", label: "Edit Case", icon: "Edit", actionType: "navigate", description: "Edit case information" },
    { id: "createCase", label: "Create Case", icon: "Plus", actionType: "navigate", description: "Create new case" },
    { id: "formFiller", label: "Form Filler", icon: "Monitor", actionType: "navigate", description: "Open form filler tool" },
    { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", actionType: "navigate", description: "Go to dashboard" },
    { id: "reports", label: "Reports", icon: "BarChart3", actionType: "navigate", description: "View reports" },
    { id: "orders", label: "Orders", icon: "Package", actionType: "navigate", description: "View orders" },
    { id: "products", label: "Products", icon: "Box", actionType: "navigate", description: "View products" },
    { id: "audits", label: "Audits", icon: "SearchCheck", actionType: "navigate", description: "View audits" },
    { id: "templates", label: "Templates", icon: "FileStack", actionType: "navigate", description: "View templates" },
    { id: "settings", label: "Settings", icon: "Settings", actionType: "navigate", description: "Open settings" },
    { id: "integrations", label: "Integrations", icon: "Plug", actionType: "navigate", description: "Manage integrations" },
  ],
  api: [
    { id: "duplicate", label: "Duplicate", icon: "Copy", actionType: "api", description: "Create a copy" },
    { id: "archive", label: "Archive", icon: "Archive", actionType: "api", description: "Move to archive" },
    { id: "delete", label: "Delete", icon: "Trash2", actionType: "api", description: "Permanently delete" },
    { id: "updateStatus", label: "Update Status", icon: "RefreshCw", actionType: "api", description: "Change status" },
    { id: "updatePriority", label: "Set Priority", icon: "Flag", actionType: "api", description: "Change priority level" },
    { id: "assignUser", label: "Assign User", icon: "UserPlus", actionType: "api", description: "Assign to team member" },
    { id: "addTags", label: "Add Tags", icon: "Tag", actionType: "api", description: "Add tags" },
    { id: "addNote", label: "Add Note", icon: "StickyNote", actionType: "api", description: "Add internal note" },
    { id: "markResolved", label: "Mark Resolved", icon: "CheckCircle", actionType: "api", description: "Mark as resolved" },
    { id: "markPending", label: "Mark Pending", icon: "Clock", actionType: "api", description: "Mark as pending" },
    { id: "bulkUpdate", label: "Bulk Update", icon: "Layers", actionType: "api", description: "Update multiple items" },
    { id: "merge", label: "Merge Cases", icon: "Merge", actionType: "api", description: "Merge with another case" },
  ],
  export: [
    { id: "exportPDF", label: "Export PDF", icon: "FileDown", actionType: "export", description: "Download as PDF" },
    { id: "exportCSV", label: "Export CSV", icon: "FileSpreadsheet", actionType: "export", description: "Download as CSV" },
    { id: "exportJSON", label: "Export JSON", icon: "FileJson", actionType: "export", description: "Download as JSON" },
    { id: "exportExcel", label: "Export Excel", icon: "FileSpreadsheet", actionType: "export", description: "Download as Excel" },
    { id: "exportWord", label: "Export Word", icon: "FileText", actionType: "export", description: "Download as Word" },
    { id: "print", label: "Print", icon: "Printer", actionType: "export", description: "Print document" },
    { id: "share", label: "Share Link", icon: "Share2", actionType: "export", description: "Generate share link" },
  ],
  communication: [
    { id: "sendEmail", label: "Send Email", icon: "Mail", actionType: "custom", description: "Send email" },
    { id: "sendSMS", label: "Send SMS", icon: "MessageSquare", actionType: "custom", description: "Send text message" },
    { id: "slackMessage", label: "Send to Slack", icon: "MessageCircle", actionType: "custom", description: "Post to Slack", integration: "slack" },
    { id: "teamsMessage", label: "Send to Teams", icon: "MessageCircle", actionType: "custom", description: "Post to Teams", integration: "teams" },
    { id: "discordMessage", label: "Send to Discord", icon: "MessageCircle", actionType: "custom", description: "Post to Discord", integration: "discord" },
    { id: "scheduleCall", label: "Schedule Call", icon: "Phone", actionType: "custom", description: "Schedule phone call" },
    { id: "createMeeting", label: "Create Meeting", icon: "Video", actionType: "custom", description: "Schedule meeting" },
  ],
  documents: [
    { id: "generateLetter", label: "Generate Letter", icon: "FileText", actionType: "api", description: "Generate dispute letter" },
    { id: "uploadDrive", label: "Upload to Drive", icon: "HardDrive", actionType: "custom", description: "Upload to Google Drive", integration: "drive" },
    { id: "uploadDropbox", label: "Upload to Dropbox", icon: "Cloud", actionType: "custom", description: "Upload to Dropbox", integration: "dropbox" },
    { id: "scanDocument", label: "Scan Document", icon: "Scan", actionType: "custom", description: "Scan and attach" },
    { id: "attachFile", label: "Attach File", icon: "Paperclip", actionType: "custom", description: "Attach file" },
    { id: "createFolder", label: "Create Folder", icon: "FolderPlus", actionType: "api", description: "Create new folder" },
  ],
  taskManagement: [
    { id: "createJira", label: "Create Jira Ticket", icon: "TicketCheck", actionType: "custom", description: "Create Jira ticket", integration: "jira" },
    { id: "createAsana", label: "Create Asana Task", icon: "CheckSquare", actionType: "custom", description: "Create Asana task", integration: "asana" },
    { id: "createTrello", label: "Create Trello Card", icon: "Trello", actionType: "custom", description: "Create Trello card", integration: "trello" },
    { id: "createTodo", label: "Create To-Do", icon: "ListTodo", actionType: "api", description: "Add to to-do list" },
    { id: "setReminder", label: "Set Reminder", icon: "Bell", actionType: "api", description: "Schedule reminder" },
    { id: "setDeadline", label: "Set Deadline", icon: "Calendar", actionType: "api", description: "Set deadline date" },
  ],
  crm: [
    { id: "updateSalesforce", label: "Update Salesforce", icon: "Database", actionType: "custom", description: "Update Salesforce record", integration: "salesforce" },
    { id: "updateHubspot", label: "Update HubSpot", icon: "Database", actionType: "custom", description: "Update HubSpot contact", integration: "hubspot" },
    { id: "createLead", label: "Create Lead", icon: "UserPlus", actionType: "custom", description: "Create CRM lead" },
    { id: "logActivity", label: "Log Activity", icon: "Activity", actionType: "api", description: "Log CRM activity" },
    { id: "updateContact", label: "Update Contact", icon: "User", actionType: "api", description: "Update contact info" },
  ],
  analytics: [
    { id: "trackEvent", label: "Track Event", icon: "TrendingUp", actionType: "api", description: "Track analytics event" },
    { id: "logActivity", label: "Log Activity", icon: "Activity", actionType: "api", description: "Log user activity" },
    { id: "sendGA", label: "Send to GA", icon: "BarChart", actionType: "custom", description: "Send to Google Analytics" },
    { id: "createReport", label: "Create Report", icon: "FileBarChart", actionType: "api", description: "Generate analytics report" },
  ],
  automation: [
    { id: "triggerZapier", label: "Trigger Zapier", icon: "Zap", actionType: "custom", description: "Trigger Zapier zap", integration: "zapier" },
    { id: "triggerMake", label: "Trigger Make.com", icon: "Workflow", actionType: "custom", description: "Trigger Make scenario", integration: "make" },
    { id: "webhook", label: "Send Webhook", icon: "Webhook", actionType: "api", description: "Send webhook payload" },
    { id: "runScript", label: "Run Script", icon: "Code", actionType: "custom", description: "Execute custom script" },
  ],
  carrier: [
    { id: "trackShipment", label: "Track Shipment", icon: "MapPin", actionType: "api", description: "Track carrier shipment" },
    { id: "fileClaim", label: "File Claim", icon: "Send", actionType: "navigate", description: "File carrier claim" },
    { id: "checkStatus", label: "Check Status", icon: "Info", actionType: "api", description: "Check claim status" },
    { id: "contactCarrier", label: "Contact Carrier", icon: "Phone", actionType: "custom", description: "Contact carrier support" },
  ],
  custom: [
    { id: "quickEdit", label: "Quick Edit", icon: "Edit", actionType: "quickEdit", description: "Quick edit mode" },
    { id: "openDialog", label: "Open Dialog", icon: "MessageSquare", actionType: "custom", description: "Open custom dialog" },
    { id: "refresh", label: "Refresh", icon: "RefreshCw", actionType: "custom", description: "Refresh data" },
    { id: "filter", label: "Filter", icon: "Filter", actionType: "custom", description: "Apply filters" },
    { id: "sort", label: "Sort", icon: "ArrowUpDown", actionType: "custom", description: "Sort items" },
    { id: "search", label: "Search", icon: "Search", actionType: "custom", description: "Search items" },
  ],
};

export const defaultActionPresets: RadialMenuContext = {
  casesPage: [
    {
      id: "edit",
      label: "Quick Edit",
      icon: "Edit",
      color: "text-blue-400",
      actionType: "quickEdit",
      actionConfig: {},
      order: 0,
      enabled: true,
    },
    {
      id: "view",
      label: "View Details",
      icon: "Eye",
      color: "text-green-400",
      actionType: "navigate",
      actionConfig: { path: "/cases/:id" },
      order: 1,
      enabled: true,
    },
    {
      id: "duplicate",
      label: "Duplicate",
      icon: "Copy",
      color: "text-purple-400",
      actionType: "api",
      actionConfig: { endpoint: "cases.duplicate" },
      order: 2,
      enabled: true,
    },
    {
      id: "export",
      label: "Export PDF",
      icon: "FileDown",
      color: "text-orange-400",
      actionType: "export",
      actionConfig: { format: "pdf" },
      order: 3,
      enabled: true,
    },
    {
      id: "template",
      label: "Save as Template",
      icon: "FileStack",
      color: "text-cyan-400",
      actionType: "api",
      actionConfig: { endpoint: "caseTemplates.createFromCase" },
      order: 4,
      enabled: true,
    },
    {
      id: "priority",
      label: "Mark Priority",
      icon: "Flag",
      color: "text-yellow-400",
      actionType: "api",
      actionConfig: { endpoint: "cases.updatePriority", params: { priority: "HIGH" } },
      order: 5,
      enabled: true,
    },
    {
      id: "archive",
      label: "Archive",
      icon: "Archive",
      color: "text-gray-400",
      actionType: "api",
      actionConfig: { endpoint: "cases.archive" },
      order: 6,
      enabled: true,
    },
    {
      id: "delete",
      label: "Delete",
      icon: "Trash2",
      color: "text-red-400",
      actionType: "api",
      actionConfig: { endpoint: "cases.delete" },
      order: 7,
      enabled: true,
    },
  ],
  caseDetail: [
    {
      id: "edit",
      label: "Edit Case",
      icon: "Edit",
      color: "text-blue-400",
      actionType: "custom",
      actionConfig: { action: "toggleEditMode" },
      order: 0,
      enabled: true,
    },
    {
      id: "generateLetter",
      label: "Generate Letter",
      icon: "FileText",
      color: "text-green-400",
      actionType: "api",
      actionConfig: { endpoint: "cases.generateLetter" },
      order: 1,
      enabled: true,
    },
    {
      id: "fileClaim",
      label: "File Claim",
      icon: "Send",
      color: "text-purple-400",
      actionType: "navigate",
      actionConfig: { path: "/cases/:id/form-filler" },
      order: 2,
      enabled: true,
    },
    {
      id: "addEvidence",
      label: "Add Evidence",
      icon: "Paperclip",
      color: "text-orange-400",
      actionType: "custom",
      actionConfig: { action: "openEvidenceDialog" },
      order: 3,
      enabled: true,
    },
    {
      id: "sendEmail",
      label: "Send Email",
      icon: "Mail",
      color: "text-cyan-400",
      actionType: "custom",
      actionConfig: { action: "openEmailDialog" },
      order: 4,
      enabled: true,
    },
    {
      id: "reminder",
      label: "Schedule Reminder",
      icon: "Bell",
      color: "text-yellow-400",
      actionType: "custom",
      actionConfig: { action: "openReminderDialog" },
      order: 5,
      enabled: true,
    },
    {
      id: "export",
      label: "Export",
      icon: "Download",
      color: "text-gray-400",
      actionType: "export",
      actionConfig: { format: "pdf" },
      order: 6,
      enabled: true,
    },
    {
      id: "close",
      label: "Close Case",
      icon: "CheckCircle",
      color: "text-green-400",
      actionType: "api",
      actionConfig: { endpoint: "cases.updateStatus", params: { status: "CLOSED" } },
      order: 7,
      enabled: true,
    },
  ],
  dashboard: [
    {
      id: "viewDetails",
      label: "View Details",
      icon: "Eye",
      color: "text-blue-400",
      actionType: "navigate",
      actionConfig: { path: "/reports" },
      order: 0,
      enabled: true,
    },
    {
      id: "export",
      label: "Export Report",
      icon: "Download",
      color: "text-green-400",
      actionType: "export",
      actionConfig: { format: "pdf" },
      order: 1,
      enabled: true,
    },
    {
      id: "filter",
      label: "Filter Cases",
      icon: "Filter",
      color: "text-purple-400",
      actionType: "custom",
      actionConfig: { action: "openFilterDialog" },
      order: 2,
      enabled: true,
    },
    {
      id: "create",
      label: "Create Case",
      icon: "Plus",
      color: "text-orange-400",
      actionType: "navigate",
      actionConfig: { path: "/cases/new" },
      order: 3,
      enabled: true,
    },
    {
      id: "refresh",
      label: "Refresh Data",
      icon: "RefreshCw",
      color: "text-cyan-400",
      actionType: "custom",
      actionConfig: { action: "refreshDashboard" },
      order: 4,
      enabled: true,
    },
  ],
};

export class RadialMenuService {
  /**
   * Get user's radial menu settings
   */
  static async getSettings(userId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const settings = await db
      .select()
      .from(radialMenuSettings)
      .where(eq(radialMenuSettings.userId, userId))
      .limit(1);

    if (settings.length === 0) {
      // Return defaults if no settings exist
      return {
        enabled: true,
        animationSpeed: 300,
        radius: 120,
        bubbleSize: 56,
        ...defaultActionPresets,
      };
    }

    const setting = settings[0];
    return {
      enabled: setting.enabled,
      animationSpeed: setting.animationSpeed,
      radius: setting.radius,
      bubbleSize: setting.bubbleSize,
      casesPage: setting.casesPageActions ? JSON.parse(setting.casesPageActions) : defaultActionPresets.casesPage,
      caseDetail: setting.caseDetailActions ? JSON.parse(setting.caseDetailActions) : defaultActionPresets.caseDetail,
      dashboard: setting.dashboardActions ? JSON.parse(setting.dashboardActions) : defaultActionPresets.dashboard,
      ordersPage: setting.ordersPageActions ? JSON.parse(setting.ordersPageActions) : [],
      productsPage: setting.productsPageActions ? JSON.parse(setting.productsPageActions) : [],
      auditsPage: setting.auditsPageActions ? JSON.parse(setting.auditsPageActions) : [],
      reportsPage: setting.reportsPageActions ? JSON.parse(setting.reportsPageActions) : [],
    };
  }

  /**
   * Update user's radial menu settings
   */
  static async updateSettings(userId: number, updates: any) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const existing = await db
      .select()
      .from(radialMenuSettings)
      .where(eq(radialMenuSettings.userId, userId))
      .limit(1);

    const data: any = {
      userId,
    };

    // Handle global settings
    if (updates.enabled !== undefined) data.enabled = updates.enabled;
    if (updates.animationSpeed !== undefined) data.animationSpeed = updates.animationSpeed;
    if (updates.radius !== undefined) data.radius = updates.radius;
    if (updates.bubbleSize !== undefined) data.bubbleSize = updates.bubbleSize;

    // Handle context-specific actions
    if (updates.casesPage) data.casesPageActions = JSON.stringify(updates.casesPage);
    if (updates.caseDetail) data.caseDetailActions = JSON.stringify(updates.caseDetail);
    if (updates.dashboard) data.dashboardActions = JSON.stringify(updates.dashboard);
    if (updates.ordersPage) data.ordersPageActions = JSON.stringify(updates.ordersPage);
    if (updates.productsPage) data.productsPageActions = JSON.stringify(updates.productsPage);
    if (updates.auditsPage) data.auditsPageActions = JSON.stringify(updates.auditsPage);
    if (updates.reportsPage) data.reportsPageActions = JSON.stringify(updates.reportsPage);

    if (existing.length === 0) {
      // Insert new settings
      await db.insert(radialMenuSettings).values(data);
    } else {
      // Update existing settings
      await db
        .update(radialMenuSettings)
        .set(data)
        .where(eq(radialMenuSettings.userId, userId));
    }

    return this.getSettings(userId);
  }

  /**
   * Reset settings to defaults for a specific context
   */
  static async resetContext(userId: number, context: keyof RadialMenuContext) {
    const contextFieldMap: Record<keyof RadialMenuContext, string> = {
      casesPage: "casesPageActions",
      caseDetail: "caseDetailActions",
      dashboard: "dashboardActions",
      ordersPage: "ordersPageActions",
      productsPage: "productsPageActions",
      auditsPage: "auditsPageActions",
      reportsPage: "reportsPageActions",
    };

    const updates: any = {};
    updates[context] = defaultActionPresets[context] || [];

    return this.updateSettings(userId, updates);
  }

  /**
   * Reset all settings to defaults
   */
  static async resetAll(userId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .delete(radialMenuSettings)
      .where(eq(radialMenuSettings.userId, userId));

    return this.getSettings(userId);
  }
}
