/**
 * Internal Notes Service
 * 
 * Private notes visible only to team members (not customers)
 * Supports mentions, attachments, and threaded discussions
 */

interface InternalNote {
  id: string;
  caseId: number;
  authorId: number;
  authorName: string;
  content: string;
  mentions: number[]; // User IDs mentioned in note
  attachments: string[]; // URLs to attached files
  parentNoteId?: string; // For threaded replies
  isPrivate: boolean; // If true, only visible to author and mentions
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  editedBy?: number;
  pinned: boolean;
}

interface NoteThread {
  rootNote: InternalNote;
  replies: InternalNote[];
  totalReplies: number;
  lastReplyAt?: Date;
}

export class InternalNotesService {
  private static notes: Map<string, InternalNote> = new Map();
  private static caseNotes: Map<number, string[]> = new Map(); // caseId -> noteIds

  /**
   * Create new note
   */
  static createNote(params: {
    caseId: number;
    authorId: number;
    authorName: string;
    content: string;
    mentions?: number[];
    attachments?: string[];
    parentNoteId?: string;
    isPrivate?: boolean;
    tags?: string[];
  }): InternalNote {
    const id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Extract mentions from content (@userId)
    const mentionMatches = params.content.match(/@(\d+)/g) || [];
    const extractedMentions = mentionMatches.map(m => parseInt(m.substring(1)));
    const allMentions = [
      ...new Set([...(params.mentions || []), ...extractedMentions]),
    ];

    const note: InternalNote = {
      id,
      caseId: params.caseId,
      authorId: params.authorId,
      authorName: params.authorName,
      content: params.content,
      mentions: allMentions,
      attachments: params.attachments || [],
      parentNoteId: params.parentNoteId,
      isPrivate: params.isPrivate || false,
      tags: params.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: false,
    };

    this.notes.set(id, note);

    // Add to case notes
    const caseNoteIds = this.caseNotes.get(params.caseId) || [];
    caseNoteIds.push(id);
    this.caseNotes.set(params.caseId, caseNoteIds);

    return note;
  }

  /**
   * Get note by ID
   */
  static getNote(noteId: string): InternalNote | undefined {
    return this.notes.get(noteId);
  }

  /**
   * Get all notes for case
   */
  static getCaseNotes(params: {
    caseId: number;
    userId?: number;
    includePrivate?: boolean;
  }): InternalNote[] {
    const noteIds = this.caseNotes.get(params.caseId) || [];
    let notes = noteIds
      .map(id => this.notes.get(id))
      .filter((n): n is InternalNote => n !== undefined);

    // Filter private notes
    if (!params.includePrivate && params.userId) {
      notes = notes.filter(n =>
        !n.isPrivate ||
        n.authorId === params.userId ||
        n.mentions.includes(params.userId)
      );
    }

    // Sort: pinned first, then by date
    return notes.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * Get threaded notes
   */
  static getThreadedNotes(params: {
    caseId: number;
    userId?: number;
  }): NoteThread[] {
    const allNotes = this.getCaseNotes({
      caseId: params.caseId,
      userId: params.userId,
    });

    // Separate root notes and replies
    const rootNotes = allNotes.filter(n => !n.parentNoteId);
    const threads: NoteThread[] = [];

    for (const rootNote of rootNotes) {
      const replies = allNotes.filter(n => n.parentNoteId === rootNote.id);
      const lastReply = replies.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )[0];

      threads.push({
        rootNote,
        replies,
        totalReplies: replies.length,
        lastReplyAt: lastReply?.createdAt,
      });
    }

    return threads;
  }

  /**
   * Update note
   */
  static updateNote(params: {
    noteId: string;
    content?: string;
    tags?: string[];
    editedBy: number;
  }): InternalNote | undefined {
    const note = this.notes.get(params.noteId);
    if (!note) return undefined;

    if (params.content !== undefined) {
      note.content = params.content;

      // Re-extract mentions
      const mentionMatches = params.content.match(/@(\d+)/g) || [];
      note.mentions = mentionMatches.map(m => parseInt(m.substring(1)));
    }

    if (params.tags !== undefined) {
      note.tags = params.tags;
    }

    note.updatedAt = new Date();
    note.editedBy = params.editedBy;

    this.notes.set(params.noteId, note);
    return note;
  }

  /**
   * Delete note
   */
  static deleteNote(noteId: string, userId: number): boolean {
    const note = this.notes.get(noteId);
    if (!note || note.authorId !== userId) {
      return false;
    }

    this.notes.delete(noteId);

    // Remove from case notes
    const caseNoteIds = this.caseNotes.get(note.caseId) || [];
    const index = caseNoteIds.indexOf(noteId);
    if (index > -1) {
      caseNoteIds.splice(index, 1);
      this.caseNotes.set(note.caseId, caseNoteIds);
    }

    // Delete replies
    const replies = Array.from(this.notes.values()).filter(
      n => n.parentNoteId === noteId
    );
    for (const reply of replies) {
      this.deleteNote(reply.id, userId);
    }

    return true;
  }

  /**
   * Toggle pin status
   */
  static togglePin(noteId: string): boolean {
    const note = this.notes.get(noteId);
    if (!note) return false;

    note.pinned = !note.pinned;
    this.notes.set(noteId, note);

    return note.pinned;
  }

  /**
   * Add attachment to note
   */
  static addAttachment(noteId: string, attachmentUrl: string): boolean {
    const note = this.notes.get(noteId);
    if (!note) return false;

    note.attachments.push(attachmentUrl);
    note.updatedAt = new Date();
    this.notes.set(noteId, note);

    return true;
  }

  /**
   * Search notes
   */
  static searchNotes(params: {
    caseId?: number;
    query: string;
    userId?: number;
    tags?: string[];
  }): InternalNote[] {
    let notes = Array.from(this.notes.values());

    // Filter by case
    if (params.caseId) {
      const caseNoteIds = this.caseNotes.get(params.caseId) || [];
      notes = notes.filter(n => caseNoteIds.includes(n.id));
    }

    // Filter private notes
    if (params.userId) {
      notes = notes.filter(n =>
        !n.isPrivate ||
        n.authorId === params.userId ||
        n.mentions.includes(params.userId)
      );
    }

    // Search content
    const lowerQuery = params.query.toLowerCase();
    notes = notes.filter(n =>
      n.content.toLowerCase().includes(lowerQuery) ||
      n.authorName.toLowerCase().includes(lowerQuery)
    );

    // Filter by tags
    if (params.tags && params.tags.length > 0) {
      notes = notes.filter(n =>
        params.tags!.some(tag => n.tags.includes(tag))
      );
    }

    return notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get notes mentioning user
   */
  static getMentions(userId: number): InternalNote[] {
    return Array.from(this.notes.values())
      .filter(n => n.mentions.includes(userId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get notes by author
   */
  static getNotesByAuthor(authorId: number): InternalNote[] {
    return Array.from(this.notes.values())
      .filter(n => n.authorId === authorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get notes by tag
   */
  static getNotesByTag(tag: string): InternalNote[] {
    return Array.from(this.notes.values())
      .filter(n => n.tags.includes(tag))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get statistics
   */
  static getStats(caseId?: number) {
    let notes = Array.from(this.notes.values());

    if (caseId) {
      const caseNoteIds = this.caseNotes.get(caseId) || [];
      notes = notes.filter(n => caseNoteIds.includes(n.id));
    }

    const authors = new Set(notes.map(n => n.authorId));
    const tags = new Set(notes.flatMap(n => n.tags));
    const mentions = notes.reduce((sum, n) => sum + n.mentions.length, 0);
    const attachments = notes.reduce((sum, n) => sum + n.attachments.length, 0);

    return {
      totalNotes: notes.length,
      privateNotes: notes.filter(n => n.isPrivate).length,
      pinnedNotes: notes.filter(n => n.pinned).length,
      threaded: notes.filter(n => n.parentNoteId).length,
      uniqueAuthors: authors.size,
      uniqueTags: tags.size,
      totalMentions: mentions,
      totalAttachments: attachments,
      oldestNote: notes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]?.createdAt,
      newestNote: notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt,
    };
  }
}
