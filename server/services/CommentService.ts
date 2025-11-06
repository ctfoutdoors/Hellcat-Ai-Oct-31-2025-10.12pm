import { getDb } from '../db';
import {
  caseComments,
  commentMentions,
  commentReactions,
  commentAttachments,
  users,
} from '../../drizzle/schema';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';

export class CommentService {
  /**
   * Create a new comment
   */
  async createComment(data: {
    caseId: number;
    content: string;
    authorId: number;
    authorName: string;
    parentCommentId?: number;
    isInternal?: boolean;
    attachmentUrls?: string[];
  }): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Calculate thread depth
    let threadDepth = 0;
    if (data.parentCommentId) {
      const parentResult = await db
        .select()
        .from(caseComments)
        .where(eq(caseComments.id, data.parentCommentId))
        .limit(1);

      if (parentResult.length > 0) {
        threadDepth = (parentResult[0].threadDepth || 0) + 1;
      }
    }

    // Extract @mentions from content
    const mentionedUserIds = this.extractMentions(data.content);

    // Create comment
    const result = await db.insert(caseComments).values({
      caseId: data.caseId,
      content: data.content,
      authorId: data.authorId,
      authorName: data.authorName,
      parentCommentId: data.parentCommentId,
      threadDepth,
      isInternal: data.isInternal ?? true,
      mentionedUserIds: mentionedUserIds.length > 0 ? JSON.stringify(mentionedUserIds) : null,
      attachmentUrls: data.attachmentUrls ? JSON.stringify(data.attachmentUrls) : null,
    });

    const commentId = result[0].insertId;

    // Create mention records
    if (mentionedUserIds.length > 0) {
      await this.createMentions(commentId, data.caseId, mentionedUserIds, data.authorId);
    }

    return commentId;
  }

  /**
   * Extract @mentions from comment content
   */
  private extractMentions(content: string): number[] {
    // Match @[userId] or @[username]
    const mentionRegex = /@\[(\d+)\]/g;
    const matches = content.matchAll(mentionRegex);
    const userIds: number[] = [];

    for (const match of matches) {
      const userId = parseInt(match[1]);
      if (!isNaN(userId) && !userIds.includes(userId)) {
        userIds.push(userId);
      }
    }

    return userIds;
  }

  /**
   * Create mention records and trigger notifications
   */
  private async createMentions(
    commentId: number,
    caseId: number,
    mentionedUserIds: number[],
    mentionedBy: number
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    for (const userId of mentionedUserIds) {
      // Don't create mention if user mentions themselves
      if (userId === mentionedBy) continue;

      await db.insert(commentMentions).values({
        commentId,
        caseId,
        mentionedUserId: userId,
        mentionedByUserId: mentionedBy,
      });

      // TODO: Trigger notification
      // await notificationService.sendMentionNotification(userId, commentId, caseId);
    }
  }

  /**
   * Get comments for a case
   */
  async getComments(caseId: number, includeDeleted = false): Promise<any[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    let query = db
      .select()
      .from(caseComments)
      .where(eq(caseComments.caseId, caseId))
      .orderBy(desc(caseComments.createdAt));

    if (!includeDeleted) {
      query = query.where(isNull(caseComments.deletedAt)) as any;
    }

    const comments = await query;

    // Parse JSON fields
    return comments.map(c => ({
      ...c,
      mentionedUserIds: c.mentionedUserIds ? JSON.parse(c.mentionedUserIds) : [],
      attachmentUrls: c.attachmentUrls ? JSON.parse(c.attachmentUrls) : [],
      reactionCounts: c.reactionCounts ? JSON.parse(c.reactionCounts) : {},
    }));
  }

  /**
   * Get comment thread (parent + all replies)
   */
  async getCommentThread(commentId: number): Promise<any[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get parent comment
    const parentResult = await db
      .select()
      .from(caseComments)
      .where(eq(caseComments.id, commentId))
      .limit(1);

    if (parentResult.length === 0) {
      return [];
    }

    const parent = parentResult[0];

    // Get all replies
    const replies = await db
      .select()
      .from(caseComments)
      .where(eq(caseComments.parentCommentId, commentId))
      .orderBy(caseComments.createdAt);

    return [parent, ...replies].map(c => ({
      ...c,
      mentionedUserIds: c.mentionedUserIds ? JSON.parse(c.mentionedUserIds) : [],
      attachmentUrls: c.attachmentUrls ? JSON.parse(c.attachmentUrls) : [],
      reactionCounts: c.reactionCounts ? JSON.parse(c.reactionCounts) : {},
    }));
  }

  /**
   * Update comment
   */
  async updateComment(commentId: number, content: string, userId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Verify ownership
    const comment = await db
      .select()
      .from(caseComments)
      .where(eq(caseComments.id, commentId))
      .limit(1);

    if (comment.length === 0) {
      throw new Error('Comment not found');
    }

    if (comment[0].authorId !== userId) {
      throw new Error('Unauthorized');
    }

    // Extract new mentions
    const mentionedUserIds = this.extractMentions(content);

    await db
      .update(caseComments)
      .set({
        content,
        isEdited: true,
        editedAt: new Date(),
        mentionedUserIds: mentionedUserIds.length > 0 ? JSON.stringify(mentionedUserIds) : null,
      })
      .where(eq(caseComments.id, commentId));

    // Update mentions (simplified - just recreate them)
    if (mentionedUserIds.length > 0) {
      await this.createMentions(commentId, comment[0].caseId, mentionedUserIds, userId);
    }
  }

  /**
   * Delete comment (soft delete)
   */
  async deleteComment(commentId: number, userId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Verify ownership
    const comment = await db
      .select()
      .from(caseComments)
      .where(eq(caseComments.id, commentId))
      .limit(1);

    if (comment.length === 0) {
      throw new Error('Comment not found');
    }

    if (comment[0].authorId !== userId) {
      throw new Error('Unauthorized');
    }

    await db
      .update(caseComments)
      .set({ deletedAt: new Date() })
      .where(eq(caseComments.id, commentId));
  }

  /**
   * Add reaction to comment
   */
  async addReaction(commentId: number, userId: number, emoji: string): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Check if reaction already exists
    const existing = await db
      .select()
      .from(commentReactions)
      .where(
        and(
          eq(commentReactions.commentId, commentId),
          eq(commentReactions.userId, userId),
          eq(commentReactions.emoji, emoji)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Remove reaction (toggle)
      await db
        .delete(commentReactions)
        .where(eq(commentReactions.id, existing[0].id));
    } else {
      // Add reaction
      await db.insert(commentReactions).values({
        commentId,
        userId,
        emoji,
      });
    }

    // Update reaction counts on comment
    await this.updateReactionCounts(commentId);
  }

  /**
   * Update reaction counts on comment
   */
  private async updateReactionCounts(commentId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get all reactions for this comment
    const reactions = await db
      .select()
      .from(commentReactions)
      .where(eq(commentReactions.commentId, commentId));

    // Count by emoji
    const counts: Record<string, number> = {};
    reactions.forEach(r => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    });

    // Update comment
    await db
      .update(caseComments)
      .set({ reactionCounts: JSON.stringify(counts) })
      .where(eq(caseComments.id, commentId));
  }

  /**
   * Get user's unread mentions
   */
  async getUnreadMentions(userId: number): Promise<any[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const mentions = await db
      .select()
      .from(commentMentions)
      .where(
        and(
          eq(commentMentions.mentionedUserId, userId),
          eq(commentMentions.isRead, false)
        )
      )
      .orderBy(desc(commentMentions.createdAt));

    return mentions;
  }

  /**
   * Mark mention as read
   */
  async markMentionRead(mentionId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db
      .update(commentMentions)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(eq(commentMentions.id, mentionId));
  }

  /**
   * Pin/unpin comment
   */
  async togglePin(commentId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const comment = await db
      .select()
      .from(caseComments)
      .where(eq(caseComments.id, commentId))
      .limit(1);

    if (comment.length === 0) {
      throw new Error('Comment not found');
    }

    await db
      .update(caseComments)
      .set({ isPinned: !comment[0].isPinned })
      .where(eq(caseComments.id, commentId));
  }

  /**
   * Search comments
   */
  async searchComments(caseId: number, query: string): Promise<any[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const comments = await db
      .select()
      .from(caseComments)
      .where(
        and(
          eq(caseComments.caseId, caseId),
          isNull(caseComments.deletedAt),
          sql`${caseComments.content} LIKE ${`%${query}%`}`
        )
      )
      .orderBy(desc(caseComments.createdAt));

    return comments.map(c => ({
      ...c,
      mentionedUserIds: c.mentionedUserIds ? JSON.parse(c.mentionedUserIds) : [],
      attachmentUrls: c.attachmentUrls ? JSON.parse(c.attachmentUrls) : [],
      reactionCounts: c.reactionCounts ? JSON.parse(c.reactionCounts) : {},
    }));
  }
}

// Singleton instance
export const commentService = new CommentService();
