import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { DataExportService } from '../services/dataExportService';

export const dataExportRouter = router({
  /**
   * Export cases to CSV
   */
  exportCasesCSV: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        carrier: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const csv = await DataExportService.exportCasesToCSV(input);
      return {
        content: csv,
        filename: `cases-export-${new Date().toISOString().split('T')[0]}.csv`,
        mimeType: 'text/csv',
      };
    }),

  /**
   * Export cases to JSON
   */
  exportCasesJSON: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        carrier: z.string().optional(),
        includeActivity: z.boolean().optional(),
        includeDocuments: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const json = await DataExportService.exportCasesToJSON(input);
      return {
        content: json,
        filename: `cases-export-${new Date().toISOString().split('T')[0]}.json`,
        mimeType: 'application/json',
      };
    }),

  /**
   * Export cases to Excel
   */
  exportCasesExcel: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        carrier: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const buffer = await DataExportService.exportCasesToExcel(input);
      return {
        content: buffer.toString('base64'),
        filename: `cases-export-${new Date().toISOString().split('T')[0]}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };
    }),

  /**
   * Export contacts to CSV
   */
  exportContactsCSV: protectedProcedure.mutation(async () => {
    const csv = await DataExportService.exportContactsToCSV();
    return {
      content: csv,
      filename: `contacts-export-${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv',
    };
  }),

  /**
   * Export companies to CSV
   */
  exportCompaniesCSV: protectedProcedure.mutation(async () => {
    const csv = await DataExportService.exportCompaniesToCSV();
    return {
      content: csv,
      filename: `companies-export-${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv',
    };
  }),

  /**
   * Import cases from CSV
   */
  importCasesCSV: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input }) => {
      return await DataExportService.importCasesFromCSV(input.content);
    }),

  /**
   * Import cases from JSON
   */
  importCasesJSON: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input }) => {
      return await DataExportService.importCasesFromJSON(input.content);
    }),

  /**
   * Import cases from Excel
   */
  importCasesExcel: protectedProcedure
    .input(z.object({ content: z.string() })) // base64 encoded
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.content, 'base64');
      return await DataExportService.importCasesFromExcel(buffer);
    }),
});
