/**
 * Clipboard Manager Service
 * 
 * Stores and manages clipboard history for quick access to frequently used data
 * Useful for copying tracking numbers, case numbers, and other repetitive data
 */

interface ClipboardItem {
  id: string;
  content: string;
  type: 'text' | 'tracking' | 'case_number' | 'amount' | 'address';
  timestamp: Date;
  userId: number;
  label?: string;
  pinned: boolean;
}

export class ClipboardManager {
  private static items: Map<number, ClipboardItem[]> = new Map();
  private static MAX_ITEMS = 50;
  private static MAX_PINNED = 10;

  /**
   * Add item to clipboard history
   */
  static addItem(params: {
    userId: number;
    content: string;
    type?: ClipboardItem['type'];
    label?: string;
  }): ClipboardItem {
    const item: ClipboardItem = {
      id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: params.content,
      type: params.type || this.detectType(params.content),
      timestamp: new Date(),
      userId: params.userId,
      label: params.label,
      pinned: false,
    };

    const userItems = this.items.get(params.userId) || [];
    
    // Check for duplicates
    const existingIndex = userItems.findIndex(i => i.content === item.content);
    if (existingIndex !== -1) {
      // Move to top
      const existing = userItems.splice(existingIndex, 1)[0];
      existing.timestamp = new Date();
      userItems.unshift(existing);
    } else {
      userItems.unshift(item);
    }

    // Keep only MAX_ITEMS (excluding pinned)
    const pinned = userItems.filter(i => i.pinned);
    const unpinned = userItems.filter(i => !i.pinned).slice(0, this.MAX_ITEMS);
    this.items.set(params.userId, [...pinned, ...unpinned]);

    return item;
  }

  /**
   * Get clipboard history for user
   */
  static getHistory(userId: number, limit?: number): ClipboardItem[] {
    const items = this.items.get(userId) || [];
    return limit ? items.slice(0, limit) : items;
  }

  /**
   * Pin/unpin item
   */
  static togglePin(userId: number, itemId: string): boolean {
    const items = this.items.get(userId) || [];
    const item = items.find(i => i.id === itemId);
    
    if (!item) return false;

    const pinnedCount = items.filter(i => i.pinned).length;
    
    if (!item.pinned && pinnedCount >= this.MAX_PINNED) {
      throw new Error(`Maximum ${this.MAX_PINNED} pinned items allowed`);
    }

    item.pinned = !item.pinned;
    
    // Resort: pinned first
    const pinned = items.filter(i => i.pinned);
    const unpinned = items.filter(i => !i.pinned);
    this.items.set(userId, [...pinned, ...unpinned]);

    return item.pinned;
  }

  /**
   * Delete item
   */
  static deleteItem(userId: number, itemId: string): boolean {
    const items = this.items.get(userId) || [];
    const index = items.findIndex(i => i.id === itemId);
    
    if (index === -1) return false;

    items.splice(index, 1);
    this.items.set(userId, items);
    return true;
  }

  /**
   * Clear all unpinned items
   */
  static clearHistory(userId: number): number {
    const items = this.items.get(userId) || [];
    const pinned = items.filter(i => i.pinned);
    const deletedCount = items.length - pinned.length;
    
    this.items.set(userId, pinned);
    return deletedCount;
  }

  /**
   * Search clipboard history
   */
  static search(userId: number, query: string): ClipboardItem[] {
    const items = this.items.get(userId) || [];
    const lowerQuery = query.toLowerCase();
    
    return items.filter(item =>
      item.content.toLowerCase().includes(lowerQuery) ||
      item.label?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get items by type
   */
  static getByType(userId: number, type: ClipboardItem['type']): ClipboardItem[] {
    const items = this.items.get(userId) || [];
    return items.filter(i => i.type === type);
  }

  /**
   * Auto-detect content type
   */
  private static detectType(content: string): ClipboardItem['type'] {
    // Tracking number patterns
    if (/^(1Z|T|92|94|03|93)[A-Z0-9]{15,}$/i.test(content)) {
      return 'tracking';
    }
    
    // Case number pattern
    if (/^CASE-\d{6}$/i.test(content)) {
      return 'case_number';
    }
    
    // Amount pattern
    if (/^\$?\d+(\.\d{2})?$/.test(content)) {
      return 'amount';
    }
    
    // Address pattern (contains street number and zip)
    if (/\d+.*\d{5}/.test(content)) {
      return 'address';
    }

    return 'text';
  }

  /**
   * Get statistics
   */
  static getStats(userId: number) {
    const items = this.items.get(userId) || [];
    
    return {
      total: items.length,
      pinned: items.filter(i => i.pinned).length,
      byType: {
        text: items.filter(i => i.type === 'text').length,
        tracking: items.filter(i => i.type === 'tracking').length,
        case_number: items.filter(i => i.type === 'case_number').length,
        amount: items.filter(i => i.type === 'amount').length,
        address: items.filter(i => i.type === 'address').length,
      },
      oldestItem: items[items.length - 1]?.timestamp,
      newestItem: items[0]?.timestamp,
    };
  }
}
