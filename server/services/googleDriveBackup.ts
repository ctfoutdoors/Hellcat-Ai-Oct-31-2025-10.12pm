/**
 * Google Drive Backup Service
 * Backs up email evidence and case documents to Google Drive
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: string;
}

interface BackupResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

/**
 * Upload file to Google Drive via MCP
 */
export async function uploadToGoogleDrive(params: {
  fileName: string;
  content: string;
  mimeType: string;
  folderId?: string;
}): Promise<BackupResult> {
  try {
    const input = {
      name: params.fileName,
      content: params.content,
      mimeType: params.mimeType,
      ...(params.folderId && { folderId: params.folderId }),
    };

    const { stdout } = await execAsync(
      `manus-mcp-cli tool call gdrive_upload_file --server google-drive --input '${JSON.stringify(input).replace(/'/g, "'\\''")}'`
    );

    const result = JSON.parse(stdout);

    if (result.success) {
      return {
        success: true,
        fileId: result.fileId,
        webViewLink: result.webViewLink,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to upload to Google Drive',
      };
    }
  } catch (error: any) {
    console.error('[GoogleDrive] Upload failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create folder in Google Drive
 */
export async function createDriveFolder(folderName: string, parentFolderId?: string): Promise<BackupResult> {
  try {
    const input = {
      name: folderName,
      ...(parentFolderId && { parentFolderId }),
    };

    const { stdout } = await execAsync(
      `manus-mcp-cli tool call gdrive_create_folder --server google-drive --input '${JSON.stringify(input).replace(/'/g, "'\\''")}'`
    );

    const result = JSON.parse(stdout);

    if (result.success) {
      return {
        success: true,
        fileId: result.folderId,
        webViewLink: result.webViewLink,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Failed to create folder',
      };
    }
  } catch (error: any) {
    console.error('[GoogleDrive] Create folder failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Backup email evidence to Google Drive
 */
export async function backupEmailToGoogleDrive(params: {
  caseId: number;
  messageId: string;
  emailData: {
    from?: string;
    to?: string[];
    subject?: string;
    body?: string;
    receivedAt?: string;
    sentAt?: string;
  };
}): Promise<BackupResult> {
  try {
    // Create case folder if it doesn't exist
    const caseFolderName = `Case-${params.caseId}`;
    const caseFolderResult = await createDriveFolder(caseFolderName);

    if (!caseFolderResult.success) {
      return caseFolderResult;
    }

    // Create email evidence JSON
    const emailEvidence = {
      messageId: params.messageId,
      caseId: params.caseId,
      from: params.emailData.from,
      to: params.emailData.to,
      subject: params.emailData.subject,
      body: params.emailData.body,
      receivedAt: params.emailData.receivedAt,
      sentAt: params.emailData.sentAt,
      backedUpAt: new Date().toISOString(),
    };

    // Upload email evidence to Drive
    const fileName = `email-${params.messageId}-${Date.now()}.json`;
    const uploadResult = await uploadToGoogleDrive({
      fileName,
      content: JSON.stringify(emailEvidence, null, 2),
      mimeType: 'application/json',
      folderId: caseFolderResult.fileId,
    });

    if (uploadResult.success) {
      console.log(`[GoogleDrive] Backed up email ${params.messageId} for case ${params.caseId}`);
    }

    return uploadResult;
  } catch (error: any) {
    console.error('[GoogleDrive] Backup failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Backup email thread to Google Drive
 */
export async function backupEmailThreadToGoogleDrive(params: {
  caseId: number;
  threadId: string;
  emails: Array<{
    messageId: string;
    from?: string;
    to?: string[];
    subject?: string;
    body?: string;
    timestamp?: string;
  }>;
}): Promise<BackupResult> {
  try {
    // Create case folder if it doesn't exist
    const caseFolderName = `Case-${params.caseId}`;
    const caseFolderResult = await createDriveFolder(caseFolderName);

    if (!caseFolderResult.success) {
      return caseFolderResult;
    }

    // Create email thread JSON
    const threadEvidence = {
      threadId: params.threadId,
      caseId: params.caseId,
      emailCount: params.emails.length,
      emails: params.emails,
      backedUpAt: new Date().toISOString(),
    };

    // Upload thread evidence to Drive
    const fileName = `email-thread-${params.threadId}-${Date.now()}.json`;
    const uploadResult = await uploadToGoogleDrive({
      fileName,
      content: JSON.stringify(threadEvidence, null, 2),
      mimeType: 'application/json',
      folderId: caseFolderResult.fileId,
    });

    if (uploadResult.success) {
      console.log(`[GoogleDrive] Backed up email thread ${params.threadId} for case ${params.caseId}`);
    }

    return uploadResult;
  } catch (error: any) {
    console.error('[GoogleDrive] Thread backup failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List files in Google Drive folder
 */
export async function listDriveFiles(folderId?: string): Promise<DriveFile[]> {
  try {
    const input = folderId ? { folderId } : {};

    const { stdout } = await execAsync(
      `manus-mcp-cli tool call gdrive_list_files --server google-drive --input '${JSON.stringify(input)}'`
    );

    const result = JSON.parse(stdout);

    if (result.success && result.files) {
      return result.files;
    }

    return [];
  } catch (error) {
    console.error('[GoogleDrive] List files failed:', error);
    return [];
  }
}

/**
 * Get Google Drive backup status for a case
 */
export async function getCaseBackupStatus(caseId: number): Promise<{
  hasBackup: boolean;
  folderId?: string;
  fileCount: number;
  lastBackupAt?: string;
}> {
  try {
    const caseFolderName = `Case-${caseId}`;
    
    // Try to find case folder
    const files = await listDriveFiles();
    const caseFolder = files.find(f => f.name === caseFolderName && f.mimeType === 'application/vnd.google-apps.folder');

    if (!caseFolder) {
      return {
        hasBackup: false,
        fileCount: 0,
      };
    }

    // List files in case folder
    const caseFiles = await listDriveFiles(caseFolder.id);

    return {
      hasBackup: true,
      folderId: caseFolder.id,
      fileCount: caseFiles.length,
      lastBackupAt: caseFiles[0]?.createdTime,
    };
  } catch (error) {
    console.error('[GoogleDrive] Get backup status failed:', error);
    return {
      hasBackup: false,
      fileCount: 0,
    };
  }
}
