/**
 * Insurance Claim Service
 * Manages insurance and carrier guarantee claim filing workflows
 */

import * as db from '../db';

interface InsuranceClaimData {
  caseId: number;
  claimType: 'insurance' | 'carrier_guarantee' | 'both';
  
  // Insurance details
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceCoverage?: number;
  insuranceClaimNumber?: string;
  insuranceClaimStatus?: string;
  insuranceClaimDate?: Date;
  
  // Carrier guarantee details
  carrierGuaranteeClaimNumber?: string;
  carrierGuaranteeStatus?: string;
  carrierGuaranteeClaimDate?: Date;
  
  // Supporting documents
  documents: string[];
  notes: string;
}

export class InsuranceClaimService {
  /**
   * File insurance claim
   */
  static async fileInsuranceClaim(data: InsuranceClaimData): Promise<{
    success: boolean;
    claimNumber?: string;
    error?: string;
  }> {
    try {
      const caseRecord = await db.getCaseById(data.caseId);
      
      if (!caseRecord) {
        return {
          success: false,
          error: 'Case not found',
        };
      }

      // Generate claim number
      const claimNumber = `INS-${Date.now()}-${data.caseId}`;

      // Update case with insurance claim info
      await db.updateCase(data.caseId, {
        insuranceProvider: data.insuranceProvider,
        insurancePolicyNumber: data.insurancePolicyNumber,
        insuranceCoverage: data.insuranceCoverage,
        insuranceClaimNumber: claimNumber,
        insuranceClaimStatus: 'FILED',
        insuranceClaimDate: new Date(),
        hasInsuranceClaim: true,
      });

      return {
        success: true,
        claimNumber,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * File carrier guarantee claim
   */
  static async fileCarrierGuaranteeClaim(data: InsuranceClaimData): Promise<{
    success: boolean;
    claimNumber?: string;
    error?: string;
  }> {
    try {
      const caseRecord = await db.getCaseById(data.caseId);
      
      if (!caseRecord) {
        return {
          success: false,
          error: 'Case not found',
        };
      }

      // Generate claim number
      const claimNumber = `CG-${Date.now()}-${data.caseId}`;

      // Update case with carrier guarantee info
      await db.updateCase(data.caseId, {
        carrierGuaranteeClaimNumber: claimNumber,
        carrierGuaranteeStatus: 'FILED',
        carrierGuaranteeClaimDate: new Date(),
        hasCarrierGuaranteeClaim: true,
      });

      return {
        success: true,
        claimNumber,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * File dual claim (both insurance and carrier guarantee)
   */
  static async fileDualClaim(data: InsuranceClaimData): Promise<{
    success: boolean;
    insuranceClaimNumber?: string;
    carrierGuaranteeClaimNumber?: string;
    error?: string;
  }> {
    try {
      const insuranceResult = await this.fileInsuranceClaim(data);
      const carrierResult = await this.fileCarrierGuaranteeClaim(data);

      if (!insuranceResult.success || !carrierResult.success) {
        return {
          success: false,
          error: `Insurance: ${insuranceResult.error || 'OK'}, Carrier: ${carrierResult.error || 'OK'}`,
        };
      }

      return {
        success: true,
        insuranceClaimNumber: insuranceResult.claimNumber,
        carrierGuaranteeClaimNumber: carrierResult.claimNumber,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update insurance claim status
   */
  static async updateInsuranceClaimStatus(
    caseId: number,
    status: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await db.updateCase(caseId, {
        insuranceClaimStatus: status,
      });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update carrier guarantee claim status
   */
  static async updateCarrierGuaranteeStatus(
    caseId: number,
    status: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await db.updateCase(caseId, {
        carrierGuaranteeStatus: status,
      });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get insurance claim eligibility
   */
  static async checkEligibility(caseId: number): Promise<{
    eligible: boolean;
    reasons: string[];
    recommendations: string[];
  }> {
    const caseRecord = await db.getCaseById(caseId);
    
    if (!caseRecord) {
      return {
        eligible: false,
        reasons: ['Case not found'],
        recommendations: [],
      };
    }

    const reasons: string[] = [];
    const recommendations: string[] = [];
    let eligible = true;

    // Check if insurance info is available
    if (!caseRecord.insuranceProvider) {
      eligible = false;
      reasons.push('No insurance provider specified');
      recommendations.push('Add insurance provider information');
    }

    if (!caseRecord.insurancePolicyNumber) {
      eligible = false;
      reasons.push('No insurance policy number');
      recommendations.push('Add insurance policy number');
    }

    // Check if claim amount is within coverage
    if (caseRecord.insuranceCoverage && caseRecord.claimedAmount) {
      if (caseRecord.claimedAmount > caseRecord.insuranceCoverage) {
        reasons.push('Claimed amount exceeds insurance coverage');
        recommendations.push('Consider filing partial claim or carrier guarantee claim');
      }
    }

    // Check if already filed
    if (caseRecord.hasInsuranceClaim) {
      eligible = false;
      reasons.push('Insurance claim already filed');
    }

    if (eligible) {
      recommendations.push('Case is eligible for insurance claim filing');
    }

    return {
      eligible,
      reasons,
      recommendations,
    };
  }

  /**
   * Get carrier guarantee eligibility
   */
  static async checkCarrierGuaranteeEligibility(caseId: number): Promise<{
    eligible: boolean;
    reasons: string[];
    recommendations: string[];
  }> {
    const caseRecord = await db.getCaseById(caseId);
    
    if (!caseRecord) {
      return {
        eligible: false,
        reasons: ['Case not found'],
        recommendations: [],
      };
    }

    const reasons: string[] = [];
    const recommendations: string[] = [];
    let eligible = true;

    // Check if carrier is specified
    if (!caseRecord.carrier) {
      eligible = false;
      reasons.push('No carrier specified');
      recommendations.push('Add carrier information');
    }

    // Check if tracking number is available
    if (!caseRecord.trackingId) {
      eligible = false;
      reasons.push('No tracking number');
      recommendations.push('Add tracking number');
    }

    // Check if already filed
    if (caseRecord.hasCarrierGuaranteeClaim) {
      eligible = false;
      reasons.push('Carrier guarantee claim already filed');
    }

    // Check service type for guarantee eligibility
    const guaranteeEligibleServices = ['PRIORITY', 'EXPRESS', '2DAY', 'OVERNIGHT'];
    if (caseRecord.serviceType && !guaranteeEligibleServices.some(s => 
      caseRecord.serviceType?.toUpperCase().includes(s)
    )) {
      reasons.push('Service type may not be covered by carrier guarantee');
      recommendations.push('Verify carrier guarantee terms for this service type');
    }

    if (eligible) {
      recommendations.push('Case is eligible for carrier guarantee claim filing');
    }

    return {
      eligible,
      reasons,
      recommendations,
    };
  }

  /**
   * Get claim statistics
   */
  static async getStatistics(): Promise<{
    totalInsuranceClaims: number;
    totalCarrierGuaranteeClaims: number;
    totalDualClaims: number;
    insuranceClaimsByStatus: Record<string, number>;
    carrierGuaranteeClaimsByStatus: Record<string, number>;
  }> {
    const allCases = await db.getAllCases();

    const insuranceCases = allCases.filter(c => c.hasInsuranceClaim);
    const carrierGuaranteeCases = allCases.filter(c => c.hasCarrierGuaranteeClaim);
    const dualClaims = allCases.filter(c => c.hasInsuranceClaim && c.hasCarrierGuaranteeClaim);

    const insuranceClaimsByStatus: Record<string, number> = {};
    const carrierGuaranteeClaimsByStatus: Record<string, number> = {};

    for (const c of insuranceCases) {
      const status = c.insuranceClaimStatus || 'UNKNOWN';
      insuranceClaimsByStatus[status] = (insuranceClaimsByStatus[status] || 0) + 1;
    }

    for (const c of carrierGuaranteeCases) {
      const status = c.carrierGuaranteeStatus || 'UNKNOWN';
      carrierGuaranteeClaimsByStatus[status] = (carrierGuaranteeClaimsByStatus[status] || 0) + 1;
    }

    return {
      totalInsuranceClaims: insuranceCases.length,
      totalCarrierGuaranteeClaims: carrierGuaranteeCases.length,
      totalDualClaims: dualClaims.length,
      insuranceClaimsByStatus,
      carrierGuaranteeClaimsByStatus,
    };
  }
}
