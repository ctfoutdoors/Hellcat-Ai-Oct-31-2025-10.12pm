/**
 * Export Presets Service
 * 
 * Save and reuse export configurations for cases, contacts, and other data
 * Supports CSV, JSON, Excel formats with custom field selection and filters
 */

interface ExportPreset {
  id: string;
  name: string;
  description?: string;
  entityType: 'cases' | 'contacts' | 'companies' | 'deals' | 'orders';
  format: 'csv' | 'json' | 'excel';
  fields: string[];
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeRelations?: string[];
  userId: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  lastUsed?: Date;
}

export class ExportPresetsService {
  private static presets: Map<string, ExportPreset> = new Map();
  private static userPresets: Map<number, string[]> = new Map();

  /**
   * Create new export preset
   */
  static createPreset(params: {
    name: string;
    description?: string;
    entityType: ExportPreset['entityType'];
    format: ExportPreset['format'];
    fields: string[];
    filters?: Record<string, any>;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeRelations?: string[];
    userId: number;
    isPublic?: boolean;
  }): ExportPreset {
    const id = `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const preset: ExportPreset = {
      id,
      name: params.name,
      description: params.description,
      entityType: params.entityType,
      format: params.format,
      fields: params.fields,
      filters: params.filters,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder || 'asc',
      includeRelations: params.includeRelations,
      userId: params.userId,
      isPublic: params.isPublic || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
    };

    this.presets.set(id, preset);

    // Add to user's presets
    const userPresetIds = this.userPresets.get(params.userId) || [];
    userPresetIds.push(id);
    this.userPresets.set(params.userId, userPresetIds);

    return preset;
  }

  /**
   * Get preset by ID
   */
  static getPreset(presetId: string): ExportPreset | undefined {
    return this.presets.get(presetId);
  }

  /**
   * Get all presets for user
   */
  static getUserPresets(userId: number, includePublic: boolean = true): ExportPreset[] {
    const userPresetIds = this.userPresets.get(userId) || [];
    const userPresets = userPresetIds
      .map(id => this.presets.get(id))
      .filter((p): p is ExportPreset => p !== undefined);

    if (includePublic) {
      // Add public presets from other users
      const publicPresets = Array.from(this.presets.values())
        .filter(p => p.isPublic && p.userId !== userId);
      
      return [...userPresets, ...publicPresets];
    }

    return userPresets;
  }

  /**
   * Get presets by entity type
   */
  static getPresetsByEntity(
    userId: number,
    entityType: ExportPreset['entityType']
  ): ExportPreset[] {
    const allPresets = this.getUserPresets(userId, true);
    return allPresets.filter(p => p.entityType === entityType);
  }

  /**
   * Update preset
   */
  static updatePreset(
    presetId: string,
    updates: Partial<Omit<ExportPreset, 'id' | 'userId' | 'createdAt' | 'usageCount'>>
  ): ExportPreset | undefined {
    const preset = this.presets.get(presetId);
    if (!preset) return undefined;

    const updated: ExportPreset = {
      ...preset,
      ...updates,
      updatedAt: new Date(),
    };

    this.presets.set(presetId, updated);
    return updated;
  }

  /**
   * Delete preset
   */
  static deletePreset(presetId: string, userId: number): boolean {
    const preset = this.presets.get(presetId);
    if (!preset || preset.userId !== userId) {
      return false;
    }

    this.presets.delete(presetId);

    // Remove from user's presets
    const userPresetIds = this.userPresets.get(userId) || [];
    const index = userPresetIds.indexOf(presetId);
    if (index > -1) {
      userPresetIds.splice(index, 1);
      this.userPresets.set(userId, userPresetIds);
    }

    return true;
  }

  /**
   * Duplicate preset
   */
  static duplicatePreset(presetId: string, userId: number, newName: string): ExportPreset | undefined {
    const original = this.presets.get(presetId);
    if (!original) return undefined;

    return this.createPreset({
      name: newName,
      description: original.description,
      entityType: original.entityType,
      format: original.format,
      fields: [...original.fields],
      filters: original.filters ? { ...original.filters } : undefined,
      sortBy: original.sortBy,
      sortOrder: original.sortOrder,
      includeRelations: original.includeRelations ? [...original.includeRelations] : undefined,
      userId,
      isPublic: false,
    });
  }

  /**
   * Record preset usage
   */
  static recordUsage(presetId: string): void {
    const preset = this.presets.get(presetId);
    if (!preset) return;

    preset.usageCount++;
    preset.lastUsed = new Date();
    this.presets.set(presetId, preset);
  }

  /**
   * Get popular presets
   */
  static getPopularPresets(limit: number = 10): ExportPreset[] {
    const publicPresets = Array.from(this.presets.values())
      .filter(p => p.isPublic);

    return publicPresets
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Search presets
   */
  static searchPresets(userId: number, query: string): ExportPreset[] {
    const allPresets = this.getUserPresets(userId, true);
    const lowerQuery = query.toLowerCase();

    return allPresets.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get default presets for entity type
   */
  static getDefaultPresets(entityType: ExportPreset['entityType']): Partial<ExportPreset>[] {
    const defaults: Record<ExportPreset['entityType'], Partial<ExportPreset>[]> = {
      cases: [
        {
          name: 'Basic Case Export',
          description: 'Essential case fields for quick review',
          format: 'csv',
          fields: ['caseNumber', 'trackingId', 'carrier', 'status', 'claimedAmount', 'createdAt'],
        },
        {
          name: 'Full Case Details',
          description: 'Complete case information with all fields',
          format: 'excel',
          fields: [
            'caseNumber',
            'trackingId',
            'carrier',
            'status',
            'priority',
            'originalAmount',
            'adjustedAmount',
            'claimedAmount',
            'customerName',
            'orderId',
            'serviceType',
            'actualDimensions',
            'carrierDimensions',
            'notes',
            'createdAt',
            'updatedAt',
          ],
        },
        {
          name: 'Financial Summary',
          description: 'Focus on amounts and financial data',
          format: 'excel',
          fields: [
            'caseNumber',
            'trackingId',
            'carrier',
            'originalAmount',
            'adjustedAmount',
            'claimedAmount',
            'status',
            'createdAt',
          ],
        },
      ],
      contacts: [
        {
          name: 'Contact List',
          description: 'Basic contact information',
          format: 'csv',
          fields: ['name', 'email', 'phone', 'company', 'status', 'createdAt'],
        },
        {
          name: 'Full Contact Details',
          description: 'Complete contact information with scores',
          format: 'excel',
          fields: [
            'name',
            'email',
            'phone',
            'company',
            'title',
            'status',
            'healthScore',
            'leadScore',
            'tags',
            'createdAt',
            'lastContactedAt',
          ],
        },
      ],
      companies: [
        {
          name: 'Company List',
          description: 'Basic company information',
          format: 'csv',
          fields: ['name', 'website', 'industry', 'size', 'status', 'createdAt'],
        },
      ],
      deals: [
        {
          name: 'Deal Pipeline',
          description: 'Deal status and values',
          format: 'csv',
          fields: ['title', 'value', 'stage', 'probability', 'expectedCloseDate', 'createdAt'],
        },
      ],
      orders: [
        {
          name: 'Order Summary',
          description: 'Order tracking and status',
          format: 'csv',
          fields: ['orderId', 'trackingNumber', 'carrier', 'status', 'amount', 'shipDate'],
        },
      ],
    };

    return defaults[entityType] || [];
  }

  /**
   * Validate preset configuration
   */
  static validatePreset(preset: Partial<ExportPreset>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!preset.name || preset.name.trim().length === 0) {
      errors.push('Preset name is required');
    }

    if (!preset.entityType) {
      errors.push('Entity type is required');
    }

    if (!preset.format) {
      errors.push('Export format is required');
    }

    if (!preset.fields || preset.fields.length === 0) {
      errors.push('At least one field must be selected');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get statistics
   */
  static getStats(userId: number) {
    const userPresets = this.getUserPresets(userId, false);
    const publicPresets = Array.from(this.presets.values()).filter(p => p.isPublic);

    return {
      totalPresets: userPresets.length,
      publicPresets: publicPresets.length,
      totalUsage: userPresets.reduce((sum, p) => sum + p.usageCount, 0),
      byFormat: {
        csv: userPresets.filter(p => p.format === 'csv').length,
        json: userPresets.filter(p => p.format === 'json').length,
        excel: userPresets.filter(p => p.format === 'excel').length,
      },
      byEntity: {
        cases: userPresets.filter(p => p.entityType === 'cases').length,
        contacts: userPresets.filter(p => p.entityType === 'contacts').length,
        companies: userPresets.filter(p => p.entityType === 'companies').length,
        deals: userPresets.filter(p => p.entityType === 'deals').length,
        orders: userPresets.filter(p => p.entityType === 'orders').length,
      },
      mostUsed: userPresets.sort((a, b) => b.usageCount - a.usageCount)[0],
      recentlyUsed: userPresets
        .filter(p => p.lastUsed)
        .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))[0],
    };
  }
}
