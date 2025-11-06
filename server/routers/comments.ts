import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { commentService } from '../services/CommentService';
import { activityLogService } from '../services/ActivityLogService';

export const commentsRouter = router({
  // Create comment
  create: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      content: z.string().min(1),
      parentCommentId: z.number().optional(),
      isInternal: z.boolean().optional(),
      attachmentUrls: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const commentId = await commentService.createComment({
        ...input,
        authorId: ctx.user.id,
        authorName: ctx.user.name || 'Unknown',
      });

      // Log activity
      await activityLogService.logComment(
        input.caseId,
        ctx.user.id,
        ctx.user.name || 'Unknown',
        input.content
      );

      return { success: true, commentId };
    }),

  // Get comments for a case
  list: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      includeDeleted: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      const comments = await commentService.getComments(
        input.caseId,
        input.includeDeleted
      );
      return comments;
    }),

  // Get comment thread
  getThread: protectedProcedure
    .input(z.object({
      commentId: z.number(),
    }))
    .query(async ({ input }) => {
      const thread = await commentService.getCommentThread(input.commentId);
      return thread;
    }),

  // Update comment
  update: protectedProcedure
    .input(z.object({
      commentId: z.number(),
      content: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      await commentService.updateComment(
        input.commentId,
        input.content,
        ctx.user.id
      );
      return { success: true };
    }),

  // Delete comment
  delete: protectedProcedure
    .input(z.object({
      commentId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      await commentService.deleteComment(input.commentId, ctx.user.id);
      return { success: true };
    }),

  // Add reaction
  addReaction: protectedProcedure
    .input(z.object({
      commentId: z.number(),
      emoji: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      await commentService.addReaction(
        input.commentId,
        ctx.user.id,
        input.emoji
      );
      return { success: true };
    }),

  // Get unread mentions
  getUnreadMentions: protectedProcedure
    .query(async ({ ctx }) => {
      const mentions = await commentService.getUnreadMentions(ctx.user.id);
      return mentions;
    }),

  // Mark mention as read
  markMentionRead: protectedProcedure
    .input(z.object({
      mentionId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await commentService.markMentionRead(input.mentionId);
      return { success: true };
    }),

  // Toggle pin
  togglePin: protectedProcedure
    .input(z.object({
      commentId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await commentService.togglePin(input.commentId);
      return { success: true };
    }),

  // Search comments
  search: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      query: z.string(),
    }))
    .query(async ({ input }) => {
      const comments = await commentService.searchComments(
        input.caseId,
        input.query
      );
      return comments;
    }),
});
