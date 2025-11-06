import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { InsuranceClaimService } from "../services/insuranceClaimService";

export const insuranceClaimsRouter = router({
  /**
   * File insurance claim
   */
  fileInsuranceClaim: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      insuranceProvider: z.string(),
      insurancePolicyNumber: z.string(),
      insuranceCoverage: z.number(),
      documents: z.array(z.string()),
      notes: z.string(),
    }))
    .mutation(async ({ input }) => {
      const result = await InsuranceClaimService.fileInsuranceClaim({
        ...input,
        claimType: 'insurance',
      });
      return result;
    }),

  /**
   * File carrier guarantee claim
   */
  fileCarrierGuaranteeClaim: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      documents: z.array(z.string()),
      notes: z.string(),
    }))
    .mutation(async ({ input }) => {
      const result = await InsuranceClaimService.fileCarrierGuaranteeClaim({
        ...input,
        claimType: 'carrier_guarantee',
      });
      return result;
    }),

  /**
   * File dual claim (insurance + carrier guarantee)
   */
  fileDualClaim: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      insuranceProvider: z.string(),
      insurancePolicyNumber: z.string(),
      insuranceCoverage: z.number(),
      documents: z.array(z.string()),
      notes: z.string(),
    }))
    .mutation(async ({ input }) => {
      const result = await InsuranceClaimService.fileDualClaim({
        ...input,
        claimType: 'both',
      });
      return result;
    }),

  /**
   * Update insurance claim status
   */
  updateInsuranceStatus: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      status: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await InsuranceClaimService.updateInsuranceClaimStatus(
        input.caseId,
        input.status,
        input.notes
      );
      return result;
    }),

  /**
   * Update carrier guarantee status
   */
  updateCarrierGuaranteeStatus: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      status: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await InsuranceClaimService.updateCarrierGuaranteeStatus(
        input.caseId,
        input.status,
        input.notes
      );
      return result;
    }),

  /**
   * Check insurance eligibility
   */
  checkInsuranceEligibility: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      const result = await InsuranceClaimService.checkEligibility(input.caseId);
      return result;
    }),

  /**
   * Check carrier guarantee eligibility
   */
  checkCarrierGuaranteeEligibility: protectedProcedure
    .input(z.object({ caseId: z.number() }))
    .query(async ({ input }) => {
      const result = await InsuranceClaimService.checkCarrierGuaranteeEligibility(input.caseId);
      return result;
    }),

  /**
   * Get claim statistics
   */
  getStatistics: protectedProcedure
    .query(async () => {
      const stats = await InsuranceClaimService.getStatistics();
      return stats;
    }),
});
