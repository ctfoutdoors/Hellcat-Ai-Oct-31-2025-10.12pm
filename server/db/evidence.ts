/**
 * Evidence Collection Database Helpers
 */

import { eq, and, desc } from "drizzle-orm";
import { getDb } from "../db";
import {
  evidenceItems,
  trackingEvents,
  facilityLocations,
  deliveryProofs,
  type InsertEvidenceItem,
  type InsertTrackingEvent,
  type InsertFacilityLocation,
  type InsertDeliveryProof,
} from "../../drizzle/schema";

// ============================================================================
// EVIDENCE ITEMS
// ============================================================================

export async function createEvidenceItem(data: InsertEvidenceItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [item] = await db.insert(evidenceItems).values(data).$returningId();
  return await getEvidenceItemById(item.id);
}

export async function getEvidenceItemById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [item] = await db.select().from(evidenceItems).where(eq(evidenceItems.id, id));
  return item;
}

export async function getEvidenceItemsByCase(caseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(evidenceItems)
    .where(eq(evidenceItems.caseId, caseId))
    .orderBy(desc(evidenceItems.uploadedAt));
}

export async function updateEvidenceItem(id: number, data: Partial<InsertEvidenceItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(evidenceItems).set(data).where(eq(evidenceItems.id, id));
  return await getEvidenceItemById(id);
}

// ============================================================================
// TRACKING EVENTS
// ============================================================================

export async function createTrackingEvent(data: InsertTrackingEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [event] = await db.insert(trackingEvents).values(data).$returningId();
  return await getTrackingEventById(event.id);
}

export async function getTrackingEventById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [event] = await db.select().from(trackingEvents).where(eq(trackingEvents.id, id));
  return event;
}

export async function getTrackingEventsByCase(caseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(trackingEvents)
    .where(eq(trackingEvents.caseId, caseId))
    .orderBy(trackingEvents.eventTimestamp);
}

export async function getTrackingEventsByTracking(trackingNumber: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(trackingEvents)
    .where(eq(trackingEvents.trackingNumber, trackingNumber))
    .orderBy(trackingEvents.eventTimestamp);
}

// ============================================================================
// FACILITY LOCATIONS
// ============================================================================

export async function createFacilityLocation(data: InsertFacilityLocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [facility] = await db.insert(facilityLocations).values(data).$returningId();
  return await getFacilityLocationById(facility.id);
}

export async function getFacilityLocationById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [facility] = await db.select().from(facilityLocations).where(eq(facilityLocations.id, id));
  return facility;
}

export async function getFacilityByName(carrier: string, facilityName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [facility] = await db
    .select()
    .from(facilityLocations)
    .where(
      and(
        eq(facilityLocations.carrier, carrier),
        eq(facilityLocations.facilityName, facilityName)
      )
    );
  return facility;
}

export async function updateFacilityLocation(id: number, data: Partial<InsertFacilityLocation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(facilityLocations).set(data).where(eq(facilityLocations.id, id));
  return await getFacilityLocationById(id);
}

export async function getProblematicFacilities(carrier?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db
    .select()
    .from(facilityLocations)
    .where(eq(facilityLocations.isAnomaly, true))
    .orderBy(desc(facilityLocations.delayIncidents));
  
  if (carrier) {
    query = query.where(eq(facilityLocations.carrier, carrier)) as any;
  }
  
  return await query;
}

// ============================================================================
// DELIVERY PROOFS
// ============================================================================

export async function createDeliveryProof(data: InsertDeliveryProof) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [proof] = await db.insert(deliveryProofs).values(data).$returningId();
  return await getDeliveryProofById(proof.id);
}

export async function getDeliveryProofById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [proof] = await db.select().from(deliveryProofs).where(eq(deliveryProofs.id, id));
  return proof;
}

export async function getDeliveryProofsByCase(caseId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select()
    .from(deliveryProofs)
    .where(eq(deliveryProofs.caseId, caseId))
    .orderBy(desc(deliveryProofs.capturedAt));
}

export async function getDeliveryProofByTracking(trackingNumber: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [proof] = await db
    .select()
    .from(deliveryProofs)
    .where(eq(deliveryProofs.trackingNumber, trackingNumber))
    .orderBy(desc(deliveryProofs.capturedAt));
  return proof;
}
