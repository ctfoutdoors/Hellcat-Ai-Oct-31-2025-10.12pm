/**
 * Batch Operations Service
 * 
 * Handles bulk operations on multiple cases
 */

interface BatchUpdateOptions {
  caseIds: number[];
  updates: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    notes?: string;
  };
}

interface BatchActionResult {
  success: number;
  failed: number;
  errors: Array<{ caseId: number; error: string }>;
}

/**
 * Update multiple cases at once
 */
export async function batchUpdateCases(
  options: BatchUpdateOptions,
  updateFunction: (caseId: number, updates: any) => Promise<void>
): Promise<BatchActionResult> {
  const result: BatchActionResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const caseId of options.caseIds) {
    try {
      await updateFunction(caseId, options.updates);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        caseId,
        error: String(error),
      });
    }
  }

  return result;
}

/**
 * Generate documents for multiple cases
 */
export async function batchGenerateDocuments(
  caseIds: number[],
  generateFunction: (caseId: number) => Promise<{ url: string }>
): Promise<BatchActionResult & { documents: Array<{ caseId: number; url: string }> }> {
  const result: BatchActionResult & { documents: Array<{ caseId: number; url: string }> } = {
    success: 0,
    failed: 0,
    errors: [],
    documents: [],
  };

  for (const caseId of caseIds) {
    try {
      const doc = await generateFunction(caseId);
      result.success++;
      result.documents.push({ caseId, url: doc.url });
    } catch (error) {
      result.failed++;
      result.errors.push({
        caseId,
        error: String(error),
      });
    }
  }

  return result;
}

/**
 * Send emails to multiple cases
 */
export async function batchSendEmails(
  cases: Array<{ caseId: number; recipientEmail: string; subject: string; body: string }>,
  sendFunction: (email: any) => Promise<void>
): Promise<BatchActionResult> {
  const result: BatchActionResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const caseEmail of cases) {
    try {
      await sendFunction({
        to: caseEmail.recipientEmail,
        subject: caseEmail.subject,
        body: caseEmail.body,
      });
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        caseId: caseEmail.caseId,
        error: String(error),
      });
    }
  }

  return result;
}

/**
 * Close multiple cases at once
 */
export async function batchCloseCases(
  caseIds: number[],
  reason: string,
  closeFunction: (caseId: number, reason: string) => Promise<void>
): Promise<BatchActionResult> {
  const result: BatchActionResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const caseId of caseIds) {
    try {
      await closeFunction(caseId, reason);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        caseId,
        error: String(error),
      });
    }
  }

  return result;
}

/**
 * Export multiple cases to CSV
 */
export function exportCasesToCSV(cases: any[]): string {
  if (cases.length === 0) {
    return '';
  }

  // Get headers from first case
  const headers = Object.keys(cases[0]);
  
  // Create CSV content
  const csvRows = [
    headers.join(','), // Header row
    ...cases.map(caseData => 
      headers.map(header => {
        const value = caseData[header];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ];

  return csvRows.join('\n');
}

/**
 * Assign multiple cases to a user
 */
export async function batchAssignCases(
  caseIds: number[],
  assignedTo: string,
  assignFunction: (caseId: number, assignedTo: string) => Promise<void>
): Promise<BatchActionResult> {
  const result: BatchActionResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const caseId of caseIds) {
    try {
      await assignFunction(caseId, assignedTo);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        caseId,
        error: String(error),
      });
    }
  }

  return result;
}

/**
 * Add tags to multiple cases
 */
export async function batchTagCases(
  caseIds: number[],
  tags: string[],
  tagFunction: (caseId: number, tags: string[]) => Promise<void>
): Promise<BatchActionResult> {
  const result: BatchActionResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (const caseId of caseIds) {
    try {
      await tagFunction(caseId, tags);
      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        caseId,
        error: String(error),
      });
    }
  }

  return result;
}
