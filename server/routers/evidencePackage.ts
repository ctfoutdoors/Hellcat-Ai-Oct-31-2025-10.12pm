import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { EvidencePackageService } from "../services/evidencePackage";

export const evidencePackageRouter = router({
  /**
   * Build and download evidence package for a case
   */
  build: publicProcedure
    .input(z.object({ caseId: z.number() }))
    .mutation(async ({ input }) => {
      const packageBuffer = await EvidencePackageService.buildEvidencePackage(input.caseId);
      
      // Convert buffer to base64 for transmission
      const base64 = packageBuffer.toString("base64");
      
      return {
        success: true,
        filename: `evidence-package-case-${input.caseId}.zip`,
        data: base64,
        size: packageBuffer.length,
      };
    }),
});
