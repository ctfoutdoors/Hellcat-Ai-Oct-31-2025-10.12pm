/**
 * Evidence Collection tRPC Router
 * Handles evidence upload, screenshot capture, and tracking data collection
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createEvidenceItem,
  getEvidenceItemsByCase,
  createTrackingEvent,
  getTrackingEventsByCase,
  getTrackingEventsByTracking,
  createFacilityLocation,
  getFacilityByName,
  updateFacilityLocation,
  createDeliveryProof,
  getDeliveryProofsByCase,
  getDeliveryProofByTracking,
} from "../db/evidence";
import { captureFedExDeliveryProof, captureFedExTrackingTimeline } from "../services/fedexScreenshotCapture";

export const evidenceRouter = router({
  // ============================================================================
  // EVIDENCE ITEMS
  // ============================================================================
  
  addEvidence: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      evidenceType: z.string(),
      category: z.string().optional(),
      title: z.string(),
      description: z.string().optional(),
      fileUrl: z.string().optional(),
      fileName: z.string().optional(),
      fileType: z.string().optional(),
      fileSize: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return await createEvidenceItem({
        ...input,
        uploadedBy: ctx.user.id,
      });
    }),
  
  listEvidence: protectedProcedure
    .input(z.object({
      caseId: z.number(),
    }))
    .query(async ({ input }) => {
      return await getEvidenceItemsByCase(input.caseId);
    }),
  
  // ============================================================================
  // SCREENSHOT CAPTURE
  // ============================================================================
  
  captureFedExProof: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      trackingNumber: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Capture screenshot and delivery proof
      const proofData = await captureFedExDeliveryProof({
        trackingNumber: input.trackingNumber,
        caseId: input.caseId,
        userId: ctx.user.id,
      });
      
      // Save to database
      const deliveryProof = await createDeliveryProof({
        caseId: input.caseId,
        trackingNumber: input.trackingNumber,
        carrier: 'FEDEX',
        screenshotUrl: proofData.screenshotUrl,
        thumbnailUrl: proofData.thumbnailUrl,
        deliveryPhotoUrl: proofData.deliveryPhotoUrl,
        hasDeliveryPhoto: proofData.hasDeliveryPhoto,
        deliveryDate: proofData.deliveryDate,
        deliveryTime: proofData.deliveryTime,
        deliveryLocation: proofData.deliveryLocation,
        recipientName: proofData.recipientName,
        signatureRequired: proofData.signatureRequired,
        signatureObtained: proofData.signatureObtained,
        sourceUrl: `https://www.fedex.com/fedextrack/?trknbr=${input.trackingNumber}`,
        capturedBy: ctx.user.id,
      });
      
      // Also create evidence item
      await createEvidenceItem({
        caseId: input.caseId,
        evidenceType: 'screenshot',
        category: 'proof_of_delivery',
        title: `FedEx Delivery Proof - ${input.trackingNumber}`,
        description: `Automatically captured delivery proof screenshot${proofData.hasDeliveryPhoto ? ' with delivery photo' : ''}`,
        fileUrl: proofData.screenshotUrl,
        fileName: `fedex-proof-${input.trackingNumber}.png`,
        fileType: 'image/png',
        uploadedBy: ctx.user.id,
        capturedAt: new Date(),
        isVerified: false,
      });
      
      return deliveryProof;
    }),
  
  captureTrackingTimeline: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      trackingNumber: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const screenshots = await captureFedExTrackingTimeline(
        input.trackingNumber,
        input.caseId
      );
      
      // Create evidence items for each screenshot
      const evidenceItems = await Promise.all(
        screenshots.map((url, index) =>
          createEvidenceItem({
            caseId: input.caseId,
            evidenceType: 'screenshot',
            category: 'tracking_timeline',
            title: `FedEx Tracking Timeline ${index + 1} - ${input.trackingNumber}`,
            description: 'Automatically captured tracking timeline screenshot',
            fileUrl: url,
            fileName: `fedex-timeline-${input.trackingNumber}-${index + 1}.png`,
            fileType: 'image/png',
            uploadedBy: ctx.user.id,
            capturedAt: new Date(),
          })
        )
      );
      
      return evidenceItems;
    }),
  
  // ============================================================================
  // TRACKING EVENTS
  // ============================================================================
  
  addTrackingEvent: protectedProcedure
    .input(z.object({
      caseId: z.number(),
      trackingNumber: z.string(),
      carrier: z.string(),
      eventType: z.string(),
      eventDescription: z.string(),
      eventTimestamp: z.date(),
      eventCode: z.string().optional(),
      locationName: z.string().optional(),
      locationAddress: z.string().optional(),
      locationCity: z.string().optional(),
      locationState: z.string().optional(),
      locationZip: z.string().optional(),
      locationCountry: z.string().optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      rawData: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      return await createTrackingEvent(input);
    }),
  
  getTrackingEvents: protectedProcedure
    .input(z.object({
      caseId: z.number().optional(),
      trackingNumber: z.string().optional(),
    }))
    .query(async ({ input }) => {
      if (input.caseId) {
        return await getTrackingEventsByCase(input.caseId);
      } else if (input.trackingNumber) {
        return await getTrackingEventsByTracking(input.trackingNumber);
      }
      return [];
    }),
  
  // ============================================================================
  // FACILITY LOCATIONS
  // ============================================================================
  
  addFacility: protectedProcedure
    .input(z.object({
      carrier: z.string(),
      facilityName: z.string(),
      facilityType: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      confidenceLabel: z.enum(['Known', 'Suspected', 'Unverified', 'Investigating']),
      verificationSources: z.array(z.string()).optional(),
      verificationNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Check if facility already exists
      const existing = await getFacilityByName(input.carrier, input.facilityName);
      if (existing) {
        return existing;
      }
      
      return await createFacilityLocation({
        ...input,
        geocodedAt: input.latitude && input.longitude ? new Date() : undefined,
      });
    }),
  
  updateFacility: protectedProcedure
    .input(z.object({
      id: z.number(),
      confidenceLabel: z.enum(['Known', 'Suspected', 'Unverified', 'Investigating']).optional(),
      verificationSources: z.array(z.string()).optional(),
      verificationNotes: z.string().optional(),
      isAnomaly: z.boolean().optional(),
      anomalyReason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return await updateFacilityLocation(id, {
        ...data,
        lastVerified: new Date(),
        verifiedBy: ctx.user.id,
      });
    }),
  
  // ============================================================================
  // DELIVERY PROOFS
  // ============================================================================
  
  getDeliveryProofs: protectedProcedure
    .input(z.object({
      caseId: z.number().optional(),
      trackingNumber: z.string().optional(),
    }))
    .query(async ({ input }) => {
      if (input.caseId) {
        return await getDeliveryProofsByCase(input.caseId);
      } else if (input.trackingNumber) {
        const proof = await getDeliveryProofByTracking(input.trackingNumber);
        return proof ? [proof] : [];
      }
      return [];
    }),
});
