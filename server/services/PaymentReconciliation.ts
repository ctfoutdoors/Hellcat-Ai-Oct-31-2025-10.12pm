import { getDb } from '../db';
import {
  paymentRecords,
  bankTransactions,
  paymentMatchingSuggestions,
  reconciliationRules,
  cases
} from '../../drizzle/schema';
import { eq, and, desc, isNull, gte, lte, sql } from 'drizzle-orm';

interface MatchCandidate {
  caseId: number;
  confidence: number;
  matchScore: number;
  amountMatch: number;
  dateMatch: number;
  carrierMatch: number;
  referenceMatch: number;
  matchReason: string;
  matchDetails: any;
}

export class PaymentReconciliationService {
  /**
   * Import bank transactions from CSV or API
   */
  async importBankTransactions(transactions: any[], batchId: string): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    let importedCount = 0;

    for (const txn of transactions) {
      // Check if transaction already exists
      const existing = await db
        .select()
        .from(bankTransactions)
        .where(eq(bankTransactions.bankTransactionId, txn.transactionId))
        .limit(1);

      if (existing.length > 0) {
        continue; // Skip duplicates
      }

      // Detect if this is a carrier payment
      const isCarrierPayment = this.detectCarrierPayment(txn.description);
      const detectedCarrier = this.detectCarrier(txn.description);

      await db.insert(bankTransactions).values({
        transactionDate: new Date(txn.date),
        amount: Math.round(txn.amount * 100), // Convert to cents
        description: txn.description,
        transactionType: txn.type,
        bankAccountId: txn.accountId,
        bankTransactionId: txn.transactionId,
        checkNumber: txn.checkNumber,
        category: txn.category,
        isCarrierPayment,
        detectedCarrier: detectedCarrier as any,
        importBatchId: batchId,
        rawData: JSON.stringify(txn),
      });

      importedCount++;
    }

    return importedCount;
  }

  /**
   * Detect if transaction description indicates carrier payment
   */
  private detectCarrierPayment(description: string): boolean {
    const lowerDesc = description.toLowerCase();
    const carrierKeywords = ['fedex', 'ups', 'usps', 'dhl', 'freight', 'shipping', 'carrier'];
    return carrierKeywords.some(keyword => lowerDesc.includes(keyword));
  }

  /**
   * Detect carrier from transaction description
   */
  private detectCarrier(description: string): string | null {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('fedex') || lowerDesc.includes('federal express')) return 'FEDEX';
    if (lowerDesc.includes('ups') || lowerDesc.includes('united parcel')) return 'UPS';
    if (lowerDesc.includes('usps') || lowerDesc.includes('postal service')) return 'USPS';
    if (lowerDesc.includes('dhl')) return 'DHL';
    
    return null;
  }

  /**
   * Create payment record from carrier response or manual entry
   */
  async createPaymentRecord(data: {
    caseId?: number;
    paymentAmount: number;
    paymentMethod: string;
    paymentDate: Date;
    checkNumber?: string;
    carrier?: string;
    carrierReference?: string;
    bankTransactionId?: string;
  }): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const result = await db.insert(paymentRecords).values({
      caseId: data.caseId,
      paymentAmount: Math.round(data.paymentAmount * 100), // Convert to cents
      paymentMethod: data.paymentMethod as any,
      paymentDate: data.paymentDate,
      checkNumber: data.checkNumber,
      carrier: data.carrier as any,
      carrierReference: data.carrierReference,
      bankTransactionId: data.bankTransactionId,
      reconciliationStatus: data.caseId ? 'MATCHED' : 'UNMATCHED',
      matchConfidence: data.caseId ? 100 : 0,
      matchMethod: data.caseId ? 'MANUAL' : undefined,
    });

    return result[0].insertId;
  }

  /**
   * Find matching cases for a payment
   */
  async findMatchingCases(paymentRecordId: number): Promise<MatchCandidate[]> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get payment record
    const paymentResult = await db
      .select()
      .from(paymentRecords)
      .where(eq(paymentRecords.id, paymentRecordId))
      .limit(1);

    if (paymentResult.length === 0) {
      throw new Error('Payment record not found');
    }

    const payment = paymentResult[0];

    // Get potential matching cases
    const potentialCases = await db
      .select()
      .from(cases)
      .where(
        and(
          payment.carrier ? eq(cases.carrier, payment.carrier) : sql`1=1`,
          // Look for cases filed within 90 days before payment
          gte(cases.filedDate, new Date(payment.paymentDate.getTime() - 90 * 24 * 60 * 60 * 1000))
        )
      );

    const candidates: MatchCandidate[] = [];

    for (const caseRecord of potentialCases) {
      const match = this.calculateMatchScore(payment, caseRecord);
      
      if (match.confidence >= 50) { // Only include matches with >50% confidence
        candidates.push({
          caseId: caseRecord.id,
          ...match,
        });
      }
    }

    // Sort by confidence descending
    candidates.sort((a, b) => b.confidence - a.confidence);

    return candidates;
  }

  /**
   * Calculate match score between payment and case
   */
  private calculateMatchScore(payment: any, caseRecord: any): {
    confidence: number;
    matchScore: number;
    amountMatch: number;
    dateMatch: number;
    carrierMatch: number;
    referenceMatch: number;
    matchReason: string;
    matchDetails: any;
  } {
    let matchScore = 0;
    const weights = {
      amount: 40,
      date: 20,
      carrier: 20,
      reference: 20,
    };

    // Amount matching (within 5% tolerance)
    const paymentAmount = payment.paymentAmount / 100;
    const claimedAmount = caseRecord.claimedAmount || 0;
    const amountDiff = Math.abs(paymentAmount - claimedAmount);
    const amountDiffPercent = claimedAmount > 0 ? (amountDiff / claimedAmount) * 100 : 100;
    
    let amountMatch = 0;
    if (amountDiffPercent <= 5) {
      amountMatch = 100;
    } else if (amountDiffPercent <= 10) {
      amountMatch = 80;
    } else if (amountDiffPercent <= 20) {
      amountMatch = 60;
    } else {
      amountMatch = Math.max(0, 100 - amountDiffPercent);
    }
    matchScore += (amountMatch / 100) * weights.amount;

    // Date matching (closer dates = higher score)
    const paymentDate = payment.paymentDate.getTime();
    const filedDate = caseRecord.filedDate ? new Date(caseRecord.filedDate).getTime() : 0;
    const daysDiff = Math.abs((paymentDate - filedDate) / (1000 * 60 * 60 * 24));
    
    let dateMatch = 0;
    if (daysDiff <= 7) {
      dateMatch = 100;
    } else if (daysDiff <= 30) {
      dateMatch = 80;
    } else if (daysDiff <= 60) {
      dateMatch = 60;
    } else {
      dateMatch = Math.max(0, 100 - daysDiff);
    }
    matchScore += (dateMatch / 100) * weights.date;

    // Carrier matching
    let carrierMatch = 0;
    if (payment.carrier && caseRecord.carrier) {
      carrierMatch = payment.carrier === caseRecord.carrier ? 100 : 0;
    } else {
      carrierMatch = 50; // Unknown
    }
    matchScore += (carrierMatch / 100) * weights.carrier;

    // Reference number matching
    let referenceMatch = 0;
    if (payment.carrierReference && caseRecord.confirmationNumber) {
      const refSimilarity = this.calculateStringSimilarity(
        payment.carrierReference,
        caseRecord.confirmationNumber
      );
      referenceMatch = refSimilarity * 100;
    } else {
      referenceMatch = 0;
    }
    matchScore += (referenceMatch / 100) * weights.reference;

    // Calculate overall confidence
    const confidence = Math.round(matchScore);

    // Generate match reason
    let matchReason = '';
    if (amountMatch >= 95) {
      matchReason += 'Exact amount match. ';
    } else if (amountMatch >= 80) {
      matchReason += 'Close amount match. ';
    }
    
    if (dateMatch >= 80) {
      matchReason += 'Recent payment. ';
    }
    
    if (carrierMatch === 100) {
      matchReason += 'Carrier matches. ';
    }
    
    if (referenceMatch >= 80) {
      matchReason += 'Reference number matches. ';
    }

    return {
      confidence,
      matchScore: Math.round(matchScore),
      amountMatch: Math.round(amountMatch),
      dateMatch: Math.round(dateMatch),
      carrierMatch: Math.round(carrierMatch),
      referenceMatch: Math.round(referenceMatch),
      matchReason: matchReason.trim() || 'Potential match based on available data',
      matchDetails: {
        paymentAmount,
        claimedAmount,
        amountDiff,
        daysDiff,
      },
    };
  }

  /**
   * Calculate string similarity (simple Levenshtein distance)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1.0;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    // Simple character overlap
    const chars1 = new Set(s1.split(''));
    const chars2 = new Set(s2.split(''));
    const intersection = new Set([...chars1].filter(x => chars2.has(x)));
    const union = new Set([...chars1, ...chars2]);
    
    return intersection.size / union.size;
  }

  /**
   * Auto-match payments to cases based on rules
   */
  async autoMatchPayments(): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Get unmatched payments
    const unmatchedPayments = await db
      .select()
      .from(paymentRecords)
      .where(eq(paymentRecords.reconciliationStatus, 'UNMATCHED'));

    let matchedCount = 0;

    for (const payment of unmatchedPayments) {
      const candidates = await this.findMatchingCases(payment.id);
      
      if (candidates.length > 0) {
        const bestMatch = candidates[0];
        
        // Create suggestion
        await db.insert(paymentMatchingSuggestions).values({
          paymentRecordId: payment.id,
          caseId: bestMatch.caseId,
          confidence: bestMatch.confidence,
          matchScore: bestMatch.matchScore,
          amountMatch: bestMatch.amountMatch,
          dateMatch: bestMatch.dateMatch,
          carrierMatch: bestMatch.carrierMatch,
          referenceMatch: bestMatch.referenceMatch,
          matchReason: bestMatch.matchReason,
          matchDetails: JSON.stringify(bestMatch.matchDetails),
        });

        // Auto-match if confidence is very high (>90%)
        if (bestMatch.confidence >= 90) {
          await this.confirmMatch(payment.id, bestMatch.caseId, 1, 'AUTO');
          matchedCount++;
        }
      }
    }

    return matchedCount;
  }

  /**
   * Confirm a payment match
   */
  async confirmMatch(
    paymentRecordId: number,
    caseId: number,
    userId: number,
    method: 'AUTO' | 'MANUAL' | 'AI_SUGGESTED' = 'MANUAL'
  ): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Update payment record
    await db
      .update(paymentRecords)
      .set({
        caseId,
        reconciliationStatus: 'MATCHED',
        matchedAt: new Date(),
        matchedBy: userId,
        matchMethod: method,
      })
      .where(eq(paymentRecords.id, paymentRecordId));

    // Update case with recovered amount
    const paymentResult = await db
      .select()
      .from(paymentRecords)
      .where(eq(paymentRecords.id, paymentRecordId))
      .limit(1);

    if (paymentResult.length > 0) {
      const payment = paymentResult[0];
      
      await db
        .update(cases)
        .set({
          recoveredAmount: payment.paymentAmount / 100,
          status: 'RESOLVED',
        })
        .where(eq(cases.id, caseId));
    }

    // Mark suggestion as accepted
    await db
      .update(paymentMatchingSuggestions)
      .set({
        status: 'ACCEPTED',
        reviewedBy: userId,
        reviewedAt: new Date(),
      })
      .where(
        and(
          eq(paymentMatchingSuggestions.paymentRecordId, paymentRecordId),
          eq(paymentMatchingSuggestions.caseId, caseId)
        )
      );
  }

  /**
   * Get reconciliation statistics
   */
  async getReconciliationStats(): Promise<{
    totalPayments: number;
    matchedPayments: number;
    unmatchedPayments: number;
    totalAmount: number;
    matchedAmount: number;
    unmatchedAmount: number;
    averageMatchTime: number;
  }> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const allPayments = await db.select().from(paymentRecords);

    const matched = allPayments.filter(p => p.reconciliationStatus === 'MATCHED');
    const unmatched = allPayments.filter(p => p.reconciliationStatus === 'UNMATCHED');

    const totalAmount = allPayments.reduce((sum, p) => sum + p.paymentAmount, 0) / 100;
    const matchedAmount = matched.reduce((sum, p) => sum + p.paymentAmount, 0) / 100;
    const unmatchedAmount = unmatched.reduce((sum, p) => sum + p.paymentAmount, 0) / 100;

    // Calculate average match time
    const matchedWithTime = matched.filter(p => p.matchedAt);
    const avgMatchTime = matchedWithTime.length > 0
      ? matchedWithTime.reduce((sum, p) => {
          const diff = p.matchedAt!.getTime() - p.createdAt.getTime();
          return sum + diff;
        }, 0) / matchedWithTime.length
      : 0;

    return {
      totalPayments: allPayments.length,
      matchedPayments: matched.length,
      unmatchedPayments: unmatched.length,
      totalAmount,
      matchedAmount,
      unmatchedAmount,
      averageMatchTime: avgMatchTime / (1000 * 60 * 60), // Convert to hours
    };
  }
}

// Singleton instance
export const paymentReconciliation = new PaymentReconciliationService();
