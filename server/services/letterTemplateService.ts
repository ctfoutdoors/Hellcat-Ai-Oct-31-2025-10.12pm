/**
 * Letter Template Service
 * Stores and manages successful letter patterns for reuse
 */

import * as db from '../db';

interface LetterTemplate {
  id: string;
  name: string;
  content: string;
  caseType: string;
  carrier: string;
  tone: string;
  successRate: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

// In-memory storage (should be moved to database in production)
const letterTemplates: Map<string, LetterTemplate> = new Map();

export class LetterTemplateService {
  /**
   * Save a successful letter as a template
   */
  static saveTemplate(params: {
    name: string;
    content: string;
    caseType: string;
    carrier: string;
    tone: string;
    tags?: string[];
  }): LetterTemplate {
    const template: LetterTemplate = {
      id: Date.now().toString(),
      name: params.name,
      content: params.content,
      caseType: params.caseType,
      carrier: params.carrier,
      tone: params.tone,
      successRate: 0,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: params.tags || [],
    };

    letterTemplates.set(template.id, template);
    return template;
  }

  /**
   * Get all templates
   */
  static getAllTemplates(): LetterTemplate[] {
    return Array.from(letterTemplates.values());
  }

  /**
   * Get templates by filters
   */
  static getTemplates(filters: {
    caseType?: string;
    carrier?: string;
    tone?: string;
    tags?: string[];
  }): LetterTemplate[] {
    let templates = Array.from(letterTemplates.values());

    if (filters.caseType) {
      templates = templates.filter(t => t.caseType === filters.caseType);
    }

    if (filters.carrier) {
      templates = templates.filter(t => t.carrier === filters.carrier);
    }

    if (filters.tone) {
      templates = templates.filter(t => t.tone === filters.tone);
    }

    if (filters.tags && filters.tags.length > 0) {
      templates = templates.filter(t =>
        filters.tags!.some(tag => t.tags.includes(tag))
      );
    }

    // Sort by success rate and usage count
    return templates.sort((a, b) => {
      const scoreA = a.successRate * 0.7 + (a.usageCount / 100) * 0.3;
      const scoreB = b.successRate * 0.7 + (b.usageCount / 100) * 0.3;
      return scoreB - scoreA;
    });
  }

  /**
   * Get template by ID
   */
  static getTemplate(id: string): LetterTemplate | null {
    return letterTemplates.get(id) || null;
  }

  /**
   * Update template
   */
  static updateTemplate(id: string, updates: Partial<LetterTemplate>): LetterTemplate | null {
    const template = letterTemplates.get(id);
    
    if (!template) {
      return null;
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    };

    letterTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  /**
   * Delete template
   */
  static deleteTemplate(id: string): boolean {
    return letterTemplates.delete(id);
  }

  /**
   * Record template usage
   */
  static recordUsage(id: string): void {
    const template = letterTemplates.get(id);
    
    if (template) {
      template.usageCount += 1;
      template.updatedAt = new Date();
      letterTemplates.set(id, template);
    }
  }

  /**
   * Update success rate based on case outcome
   */
  static updateSuccessRate(id: string, wasSuccessful: boolean): void {
    const template = letterTemplates.get(id);
    
    if (template) {
      // Calculate new success rate using exponential moving average
      const alpha = 0.2; // Weight for new data
      const newValue = wasSuccessful ? 1 : 0;
      template.successRate = alpha * newValue + (1 - alpha) * template.successRate;
      template.updatedAt = new Date();
      letterTemplates.set(id, template);
    }
  }

  /**
   * Get recommended template for a case
   */
  static getRecommendedTemplate(params: {
    caseType: string;
    carrier: string;
    tone: string;
  }): LetterTemplate | null {
    const templates = this.getTemplates(params);
    
    if (templates.length === 0) {
      return null;
    }

    // Return the highest-scoring template
    return templates[0];
  }

  /**
   * Export templates as JSON
   */
  static exportTemplates(): string {
    const templates = Array.from(letterTemplates.values());
    return JSON.stringify(templates, null, 2);
  }

  /**
   * Import templates from JSON
   */
  static importTemplates(jsonData: string): {
    imported: number;
    errors: string[];
  } {
    const errors: string[] = [];
    let imported = 0;

    try {
      const templates = JSON.parse(jsonData) as LetterTemplate[];

      for (const template of templates) {
        try {
          // Validate template structure
          if (!template.name || !template.content || !template.caseType) {
            errors.push(`Invalid template: ${template.name || 'unnamed'}`);
            continue;
          }

          // Generate new ID to avoid conflicts
          const newTemplate = {
            ...template,
            id: Date.now().toString() + Math.random(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          letterTemplates.set(newTemplate.id, newTemplate);
          imported++;
        } catch (error: any) {
          errors.push(`Error importing template: ${error.message}`);
        }
      }
    } catch (error: any) {
      errors.push(`JSON parse error: ${error.message}`);
    }

    return { imported, errors };
  }

  /**
   * Get template statistics
   */
  static getStatistics(): {
    totalTemplates: number;
    averageSuccessRate: number;
    totalUsage: number;
    topTemplates: LetterTemplate[];
  } {
    const templates = Array.from(letterTemplates.values());

    return {
      totalTemplates: templates.length,
      averageSuccessRate: templates.reduce((sum, t) => sum + t.successRate, 0) / templates.length || 0,
      totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0),
      topTemplates: templates
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5),
    };
  }
}
