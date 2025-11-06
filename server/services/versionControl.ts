/**
 * Version Control Service for Cases
 * 
 * Tracks all changes to cases with full history and rollback capability
 * Implements event sourcing pattern for complete audit trail
 */

interface CaseVersion {
  id: string;
  caseId: number;
  version: number;
  snapshot: Record<string, any>;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  userId: number;
  userName: string;
  timestamp: Date;
  comment?: string;
  tags: string[];
}

interface VersionDiff {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'modified' | 'deleted';
}

export class VersionControlService {
  private static versions: Map<number, CaseVersion[]> = new Map();
  private static currentVersions: Map<number, number> = new Map();

  /**
   * Create initial version when case is created
   */
  static createInitialVersion(params: {
    caseId: number;
    snapshot: Record<string, any>;
    userId: number;
    userName: string;
  }): CaseVersion {
    const version: CaseVersion = {
      id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      caseId: params.caseId,
      version: 1,
      snapshot: params.snapshot,
      changes: [],
      userId: params.userId,
      userName: params.userName,
      timestamp: new Date(),
      comment: 'Initial version',
      tags: ['created'],
    };

    const versions = this.versions.get(params.caseId) || [];
    versions.push(version);
    this.versions.set(params.caseId, versions);
    this.currentVersions.set(params.caseId, 1);

    return version;
  }

  /**
   * Create new version when case is updated
   */
  static createVersion(params: {
    caseId: number;
    snapshot: Record<string, any>;
    previousSnapshot: Record<string, any>;
    userId: number;
    userName: string;
    comment?: string;
    tags?: string[];
  }): CaseVersion {
    const versions = this.versions.get(params.caseId) || [];
    const currentVersion = this.currentVersions.get(params.caseId) || 0;
    const newVersion = currentVersion + 1;

    // Calculate changes
    const changes = this.calculateDiff(params.previousSnapshot, params.snapshot);

    const version: CaseVersion = {
      id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      caseId: params.caseId,
      version: newVersion,
      snapshot: params.snapshot,
      changes: changes.map(c => ({
        field: c.field,
        oldValue: c.oldValue,
        newValue: c.newValue,
      })),
      userId: params.userId,
      userName: params.userName,
      timestamp: new Date(),
      comment: params.comment,
      tags: params.tags || [],
    };

    versions.push(version);
    this.versions.set(params.caseId, versions);
    this.currentVersions.set(params.caseId, newVersion);

    return version;
  }

  /**
   * Get all versions for a case
   */
  static getVersionHistory(caseId: number): CaseVersion[] {
    return this.versions.get(caseId) || [];
  }

  /**
   * Get specific version
   */
  static getVersion(caseId: number, version: number): CaseVersion | undefined {
    const versions = this.versions.get(caseId) || [];
    return versions.find(v => v.version === version);
  }

  /**
   * Get current version number
   */
  static getCurrentVersion(caseId: number): number {
    return this.currentVersions.get(caseId) || 0;
  }

  /**
   * Rollback to specific version
   */
  static rollbackToVersion(params: {
    caseId: number;
    targetVersion: number;
    userId: number;
    userName: string;
    comment?: string;
  }): { success: boolean; snapshot?: Record<string, any>; error?: string } {
    const versions = this.versions.get(params.caseId) || [];
    const targetVersion = versions.find(v => v.version === params.targetVersion);

    if (!targetVersion) {
      return {
        success: false,
        error: `Version ${params.targetVersion} not found`,
      };
    }

    const currentVersion = this.currentVersions.get(params.caseId) || 0;
    const currentSnapshot = versions.find(v => v.version === currentVersion)?.snapshot;

    // Create rollback version
    const rollbackVersion: CaseVersion = {
      id: `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      caseId: params.caseId,
      version: currentVersion + 1,
      snapshot: targetVersion.snapshot,
      changes: currentSnapshot 
        ? this.calculateDiff(currentSnapshot, targetVersion.snapshot).map(c => ({
            field: c.field,
            oldValue: c.oldValue,
            newValue: c.newValue,
          }))
        : [],
      userId: params.userId,
      userName: params.userName,
      timestamp: new Date(),
      comment: params.comment || `Rolled back to version ${params.targetVersion}`,
      tags: ['rollback', `from-v${currentVersion}`, `to-v${params.targetVersion}`],
    };

    versions.push(rollbackVersion);
    this.versions.set(params.caseId, versions);
    this.currentVersions.set(params.caseId, rollbackVersion.version);

    return {
      success: true,
      snapshot: targetVersion.snapshot,
    };
  }

  /**
   * Compare two versions
   */
  static compareVersions(
    caseId: number,
    versionA: number,
    versionB: number
  ): VersionDiff[] {
    const versions = this.versions.get(caseId) || [];
    const verA = versions.find(v => v.version === versionA);
    const verB = versions.find(v => v.version === versionB);

    if (!verA || !verB) {
      return [];
    }

    return this.calculateDiff(verA.snapshot, verB.snapshot);
  }

  /**
   * Get changes between versions
   */
  static getChangesSince(caseId: number, sinceVersion: number): VersionDiff[] {
    const versions = this.versions.get(caseId) || [];
    const currentVersion = this.currentVersions.get(caseId) || 0;

    if (sinceVersion >= currentVersion) {
      return [];
    }

    const startSnapshot = versions.find(v => v.version === sinceVersion)?.snapshot;
    const endSnapshot = versions.find(v => v.version === currentVersion)?.snapshot;

    if (!startSnapshot || !endSnapshot) {
      return [];
    }

    return this.calculateDiff(startSnapshot, endSnapshot);
  }

  /**
   * Search versions by tag
   */
  static searchByTag(caseId: number, tag: string): CaseVersion[] {
    const versions = this.versions.get(caseId) || [];
    return versions.filter(v => v.tags.includes(tag));
  }

  /**
   * Get statistics
   */
  static getStats(caseId: number) {
    const versions = this.versions.get(caseId) || [];
    const currentVersion = this.currentVersions.get(caseId) || 0;

    const users = new Set(versions.map(v => v.userName));
    const tags = new Set(versions.flatMap(v => v.tags));
    const totalChanges = versions.reduce((sum, v) => sum + v.changes.length, 0);

    return {
      totalVersions: versions.length,
      currentVersion,
      uniqueUsers: users.size,
      uniqueTags: tags.size,
      totalChanges,
      firstVersion: versions[0]?.timestamp,
      lastVersion: versions[versions.length - 1]?.timestamp,
    };
  }

  /**
   * Calculate diff between two snapshots
   */
  private static calculateDiff(
    oldSnapshot: Record<string, any>,
    newSnapshot: Record<string, any>
  ): VersionDiff[] {
    const diffs: VersionDiff[] = [];
    const allKeys = new Set([...Object.keys(oldSnapshot), ...Object.keys(newSnapshot)]);

    for (const key of allKeys) {
      const oldValue = oldSnapshot[key];
      const newValue = newSnapshot[key];

      if (oldValue === undefined && newValue !== undefined) {
        diffs.push({
          field: key,
          oldValue: null,
          newValue,
          type: 'added',
        });
      } else if (oldValue !== undefined && newValue === undefined) {
        diffs.push({
          field: key,
          oldValue,
          newValue: null,
          type: 'deleted',
        });
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        diffs.push({
          field: key,
          oldValue,
          newValue,
          type: 'modified',
        });
      }
    }

    return diffs;
  }

  /**
   * Export version history
   */
  static exportHistory(caseId: number): string {
    const versions = this.versions.get(caseId) || [];
    return JSON.stringify(versions, null, 2);
  }

  /**
   * Import version history
   */
  static importHistory(caseId: number, historyJson: string): boolean {
    try {
      const versions: CaseVersion[] = JSON.parse(historyJson);
      this.versions.set(caseId, versions);
      
      if (versions.length > 0) {
        const maxVersion = Math.max(...versions.map(v => v.version));
        this.currentVersions.set(caseId, maxVersion);
      }

      return true;
    } catch (error) {
      console.error('[VersionControl] Import failed:', error);
      return false;
    }
  }
}
