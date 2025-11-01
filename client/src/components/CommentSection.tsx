import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  MessageSquare,
  Send,
  ThumbsUp,
  Heart,
  Smile,
  Pin,
  Edit2,
  Trash2,
  Reply,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface CommentSectionProps {
  caseId: number;
}

function Comment({ comment, onReply, currentUserId }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplyBox, setShowReplyBox] = useState(false);

  const utils = trpc.useUtils();

  const updateMutation = trpc.comments.update.useMutation({
    onSuccess: () => {
      toast.success('Comment updated');
      setIsEditing(false);
      utils.comments.list.invalidate();
    },
  });

  const deleteMutation = trpc.comments.delete.useMutation({
    onSuccess: () => {
      toast.success('Comment deleted');
      utils.comments.list.invalidate();
    },
  });

  const reactionMutation = trpc.comments.addReaction.useMutation({
    onSuccess: () => {
      utils.comments.list.invalidate();
    },
  });

  const pinMutation = trpc.comments.togglePin.useMutation({
    onSuccess: () => {
      toast.success(comment.isPinned ? 'Comment unpinned' : 'Comment pinned');
      utils.comments.list.invalidate();
    },
  });

  const handleUpdate = () => {
    if (!editContent.trim()) return;
    updateMutation.mutate({
      commentId: comment.id,
      content: editContent,
    });
  };

  const handleDelete = () => {
    if (confirm('Delete this comment?')) {
      deleteMutation.mutate({ commentId: comment.id });
    }
  };

  const handleReaction = (emoji: string) => {
    reactionMutation.mutate({
      commentId: comment.id,
      emoji,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isOwner = comment.authorId === currentUserId;

  return (
    <div className={`flex gap-3 ${comment.threadDepth > 0 ? 'ml-12' : ''}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">
          {getInitials(comment.authorName || 'U')}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-2">
        <Card className={comment.isPinned ? 'border-primary' : ''}>
          <CardContent className="p-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-semibold text-sm">{comment.authorName}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {comment.isEdited && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Edited
                  </Badge>
                )}
                {comment.isPinned && (
                  <Pin className="inline h-3 w-3 ml-2 text-primary" />
                )}
              </div>

              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => pinMutation.mutate({ commentId: comment.id })}>
                      <Pin className="h-4 w-4 mr-2" />
                      {comment.isPinned ? 'Unpin' : 'Pin'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdate} disabled={updateMutation.isPending}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm whitespace-pre-wrap">{comment.content}</div>
            )}

            {comment.attachmentUrls && comment.attachmentUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {comment.attachmentUrls.map((url: string, idx: number) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Attachment {idx + 1}
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reactions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleReaction('👍')}
          >
            <ThumbsUp className="h-3 w-3 mr-1" />
            {comment.reactionCounts?.['👍'] || 0}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleReaction('❤️')}
          >
            <Heart className="h-3 w-3 mr-1" />
            {comment.reactionCounts?.['❤️'] || 0}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleReaction('😄')}
          >
            <Smile className="h-3 w-3 mr-1" />
            {comment.reactionCounts?.['😄'] || 0}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowReplyBox(!showReplyBox)}
          >
            <Reply className="h-3 w-3 mr-1" />
            Reply
          </Button>
        </div>

        {/* Reply box */}
        {showReplyBox && (
          <div className="mt-2">
            <CommentInput
              caseId={comment.caseId}
              parentCommentId={comment.id}
              onSuccess={() => setShowReplyBox(false)}
              placeholder="Write a reply..."
              compact
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CommentInput({
  caseId,
  parentCommentId,
  onSuccess,
  placeholder = 'Write a comment...',
  compact = false,
}: any) {
  const [content, setContent] = useState('');
  const utils = trpc.useUtils();

  const createMutation = trpc.comments.create.useMutation({
    onSuccess: () => {
      toast.success('Comment added');
      setContent('');
      utils.comments.list.invalidate();
      onSuccess?.();
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;

    createMutation.mutate({
      caseId,
      content,
      parentCommentId,
    });
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className={compact ? 'min-h-[60px]' : 'min-h-[100px]'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSubmit();
          }
        }}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          Tip: Use @[userId] to mention someone
        </span>
        <Button
          onClick={handleSubmit}
          disabled={!content.trim() || createMutation.isPending}
          size={compact ? 'sm' : 'default'}
        >
          <Send className="h-4 w-4 mr-2" />
          {parentCommentId ? 'Reply' : 'Comment'}
        </Button>
      </div>
    </div>
  );
}

export default function CommentSection({ caseId }: CommentSectionProps) {
  const { data: comments, isLoading } = trpc.comments.list.useQuery({ caseId });
  const { data: user } = trpc.auth.me.useQuery();

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-8">Loading comments...</div>;
  }

  // Group comments by thread
  const topLevelComments = comments?.filter((c: any) => !c.parentCommentId) || [];
  const replies = comments?.filter((c: any) => c.parentCommentId) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Comments ({comments?.length || 0})
        </h3>
      </div>

      <CommentInput caseId={caseId} />

      <div className="space-y-4">
        {topLevelComments.map((comment: any) => (
          <div key={comment.id} className="space-y-3">
            <Comment comment={comment} currentUserId={user?.id} />
            {/* Render replies */}
            {replies
              .filter((r: any) => r.parentCommentId === comment.id)
              .map((reply: any) => (
                <Comment key={reply.id} comment={reply} currentUserId={user?.id} />
              ))}
          </div>
        ))}

        {topLevelComments.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
}
