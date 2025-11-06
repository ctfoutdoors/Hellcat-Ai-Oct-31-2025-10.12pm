/**
 * Case Templates Service
 * Save and reuse case configurations as templates
 */

import { getDb } from "../db";
import { caseTemplates, cases } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface CaseTemplateData {
  carrier?: string;
  serviceType?: string;
  priority?: string;
  notes?: string;
  disputeReason?: string;
  // Add other fields that should be templated
}

export interface CreateTemplateInput {
  name: string;
  description?: string;
  carrier?: "FEDEX" | "UPS" | "USPS" | "DHL" | "OTHER";
  disputeType?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  templateData: CaseTemplateData;
  isPublic?: boolean;
  createdBy: number;
}

export class CaseTemplatesService {
  /**
   * Create a new template from a case
   */
  static async createFromCase(
    caseId: number,
    name: string,
    description: string | undefined,
    createdBy: number,
    isPublic: boolean = false
  ): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get case data
    const caseData = await db.query.cases.findFirst({
      where: eq(cases.id, caseId),
    });

    if (!caseData) {
      throw new Error(`Case ${caseId} not found`);
    }

    // Extract template data
    const templateData: CaseTemplateData = {
      carrier: caseData.carrier,
      serviceType: caseData.serviceType || undefined,
      priority: caseData.priority,
      notes: caseData.notes || undefined,
      disputeReason: caseData.notes?.substring(0, 100) || undefined,
    };

    // Create template
    const result = await db.insert(caseTemplates).values({
      name,
      description,
      carrier: caseData.carrier,
      disputeType: templateData.disputeReason || "General dispute",
      priority: caseData.priority,
      templateData: JSON.stringify(templateData),
      isPublic: isPublic ? 1 : 0,
      createdBy,
      usageCount: 0,
    });

    console.log(`[CaseTemplates] Created template "${name}" from case ${caseId}`);

    return Number(result.insertId);
  }

  /**
   * Create a template from scratch
   */
  static async createTemplate(input: CreateTemplateInput): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.insert(caseTemplates).values({
      name: input.name,
      description: input.description,
      carrier: input.carrier,
      disputeType: input.disputeType,
      priority: input.priority || "MEDIUM",
      templateData: JSON.stringify(input.templateData),
      isPublic: input.isPublic ? 1 : 0,
      createdBy: input.createdBy,
      usageCount: 0,
    });

    console.log(`[CaseTemplates] Created template "${input.name}"`);

    return Number(result.insertId);
  }

  /**
   * Get all templates (user's own + public)
   */
  static async getTemplates(userId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const templates = await db
      .select()
      .from(caseTemplates)
      .where(
        sql`${caseTemplates.createdBy} = ${userId} OR ${caseTemplates.isPublic} = 1`
      )
      .orderBy(desc(caseTemplates.usageCount), desc(caseTemplates.createdAt));

    return templates.map((t) => ({
      ...t,
      templateData: JSON.parse(t.templateData) as CaseTemplateData,
    }));
  }

  /**
   * Get a specific template
   */
  static async getTemplate(templateId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const template = await db.query.caseTemplates.findFirst({
      where: eq(caseTemplates.id, templateId),
    });

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return {
      ...template,
      templateData: JSON.parse(template.templateData) as CaseTemplateData,
    };
  }

  /**
   * Apply a template to create a new case
   */
  static async applyTemplate(templateId: number): Promise<CaseTemplateData> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const template = await this.getTemplate(templateId);

    // Increment usage count
    await db
      .update(caseTemplates)
      .set({
        usageCount: sql`${caseTemplates.usageCount} + 1`,
        lastUsed: new Date(),
      })
      .where(eq(caseTemplates.id, templateId));

    console.log(`[CaseTemplates] Applied template "${template.name}"`);

    return template.templateData;
  }

  /**
   * Update a template
   */
  static async updateTemplate(
    templateId: number,
    updates: Partial<CreateTemplateInput>
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const updateData: any = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.carrier) updateData.carrier = updates.carrier;
    if (updates.disputeType) updateData.disputeType = updates.disputeType;
    if (updates.priority) updateData.priority = updates.priority;
    if (updates.templateData) updateData.templateData = JSON.stringify(updates.templateData);
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic ? 1 : 0;

    updateData.updatedAt = new Date();

    await db
      .update(caseTemplates)
      .set(updateData)
      .where(eq(caseTemplates.id, templateId));

    console.log(`[CaseTemplates] Updated template ${templateId}`);
  }

  /**
   * Delete a template
   */
  static async deleteTemplate(templateId: number, userId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Only allow deletion of own templates
    await db
      .delete(caseTemplates)
      .where(
        and(
          eq(caseTemplates.id, templateId),
          eq(caseTemplates.createdBy, userId)
        )
      );

    console.log(`[CaseTemplates] Deleted template ${templateId}`);
  }

  /**
   * Get template statistics
   */
  static async getStats() {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const stats = await db
      .select({
        totalTemplates: sql<number>`COUNT(*)`,
        publicTemplates: sql<number>`SUM(CASE WHEN ${caseTemplates.isPublic} = 1 THEN 1 ELSE 0 END)`,
        totalUsage: sql<number>`SUM(${caseTemplates.usageCount})`,
      })
      .from(caseTemplates);

    return stats[0];
  }
}
