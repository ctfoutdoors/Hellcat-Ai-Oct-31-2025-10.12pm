import { eq, and, sql, desc } from "drizzle-orm";
import { getDb } from "../db";
import { launchMissions, missionEvents } from "../../drizzle/schema";

/**
 * Launch Orchestrator Service
 * Mission creation, phase management, and launch coordination
 */

export type MissionStatus = "planning" | "preparation" | "review" | "go_decision" | "active" | "completed" | "aborted";
export type MissionPhase = "pre_launch" | "launch_day" | "post_launch";

export interface LaunchMission {
  id: number;
  productId: number;
  missionName: string;
  status: MissionStatus;
  currentPhase: MissionPhase;
  launchDate: Date;
  missionConfig: {
    phases?: { name: string; tasks: string[]; deadline: string }[];
    checklists?: { category: string; items: { name: string; completed: boolean }[] }[];
    notifications?: { event: string; recipients: string[]; template: string }[];
  };
  readinessSnapshot: {
    overallScore?: number;
    productScore?: number;
    variantScore?: number;
    inventoryScore?: number;
    lastCalculated?: Date;
  };
  collaborators: {
    internal?: { userId: number; role: string }[];
    external?: { name: string; email: string; role: string }[];
  };
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Create new launch mission
 */
export async function createMission(data: {
  productId: number;
  missionName: string;
  launchDate: Date;
  createdBy: number;
}): Promise<LaunchMission> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(launchMissions).values({
    productId: data.productId,
    missionName: data.missionName,
    status: "planning",
    currentPhase: "pre_launch",
    launchDate: data.launchDate,
    missionConfig: {},
    readinessSnapshot: {},
    collaborators: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Log event
  await db.insert(intelligenceEvents).values({
    eventType: "mission_created",
    entityType: "mission",
    entityId: result.insertId,
    userId: data.createdBy,
    eventData: { missionName: data.missionName, productId: data.productId },
    createdAt: new Date(),
  });

  const missions = await db
    .select()
    .from(launchMissions)
    .where(eq(launchMissions.id, result.insertId))
    .limit(1);

  return missions[0] as LaunchMission;
}

/**
 * Get all missions
 */
export async function getAllMissions(): Promise<LaunchMission[]> {
  const db = await getDb();
  if (!db) return [];

  const missions = await db
    .select()
    .from(launchMissions)
    .orderBy(desc(launchMissions.createdAt));

  return missions as LaunchMission[];
}

/**
 * Get mission by ID
 */
export async function getMissionById(missionId: number): Promise<LaunchMission | null> {
  const db = await getDb();
  if (!db) return null;

  const missions = await db
    .select()
    .from(launchMissions)
    .where(eq(launchMissions.id, missionId))
    .limit(1);

  return missions[0] as LaunchMission || null;
}

/**
 * Update mission status
 */
export async function updateMissionStatus(
  missionId: number,
  status: MissionStatus,
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(launchMissions)
    .set({
      status,
      updatedAt: new Date(),
      ...(status === "completed" ? { completedAt: new Date() } : {}),
    })
    .where(eq(launchMissions.id, missionId));

  // Log event
  await db.insert(intelligenceEvents).values({
    eventType: "mission_status_changed",
    entityType: "mission",
    entityId: missionId,
    userId,
    eventData: { newStatus: status },
    createdAt: new Date(),
  });

  return true;
}

/**
 * Update mission phase
 */
export async function updateMissionPhase(
  missionId: number,
  phase: MissionPhase,
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(launchMissions)
    .set({
      currentPhase: phase,
      updatedAt: new Date(),
    })
    .where(eq(launchMissions.id, missionId));

  // Log event
  await db.insert(intelligenceEvents).values({
    eventType: "mission_phase_changed",
    entityType: "mission",
    entityId: missionId,
    userId,
    eventData: { newPhase: phase },
    createdAt: new Date(),
  });

  return true;
}

/**
 * Update readiness snapshot
 */
export async function updateReadinessSnapshot(
  missionId: number,
  snapshot: {
    overallScore: number;
    productScore: number;
    variantScore: number;
    inventoryScore: number;
  }
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(launchMissions)
    .set({
      readinessSnapshot: {
        ...snapshot,
        lastCalculated: new Date(),
      },
      updatedAt: new Date(),
    })
    .where(eq(launchMissions.id, missionId));

  return true;
}

/**
 * Add collaborator to mission
 */
export async function addCollaborator(
  missionId: number,
  collaborator: { userId?: number; name?: string; email?: string; role: string },
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const mission = await getMissionById(missionId);
  if (!mission) return false;

  const collaborators = mission.collaborators || {};

  if (collaborator.userId) {
    // Internal collaborator
    const internal = collaborators.internal || [];
    internal.push({ userId: collaborator.userId, role: collaborator.role });
    collaborators.internal = internal;
  } else if (collaborator.email) {
    // External collaborator
    const external = collaborators.external || [];
    external.push({ name: collaborator.name || "", email: collaborator.email, role: collaborator.role });
    collaborators.external = external;
  }

  await db
    .update(launchMissions)
    .set({
      collaborators,
      updatedAt: new Date(),
    })
    .where(eq(launchMissions.id, missionId));

  // Log event
  await db.insert(intelligenceEvents).values({
    eventType: "collaborator_added",
    entityType: "mission",
    entityId: missionId,
    userId,
    eventData: collaborator,
    createdAt: new Date(),
  });

  return true;
}

/**
 * Update mission config (tasks, checklists, notifications)
 */
export async function updateMissionConfig(
  missionId: number,
  config: {
    phases?: { name: string; tasks: string[]; deadline: string }[];
    checklists?: { category: string; items: { name: string; completed: boolean }[] }[];
    notifications?: { event: string; recipients: string[]; template: string }[];
  },
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const mission = await getMissionById(missionId);
  if (!mission) return false;

  const updatedConfig = {
    ...(mission.missionConfig || {}),
    ...config,
  };

  await db
    .update(launchMissions)
    .set({
      missionConfig: updatedConfig,
      updatedAt: new Date(),
    })
    .where(eq(launchMissions.id, missionId));

  // Log event
  await db.insert(intelligenceEvents).values({
    eventType: "mission_config_updated",
    entityType: "mission",
    entityId: missionId,
    userId,
    eventData: { configKeys: Object.keys(config) },
    createdAt: new Date(),
  });

  return true;
}

/**
 * Get missions by status
 */
export async function getMissionsByStatus(status: MissionStatus): Promise<LaunchMission[]> {
  const db = await getDb();
  if (!db) return [];

  const missions = await db
    .select()
    .from(launchMissions)
    .where(eq(launchMissions.status, status))
    .orderBy(desc(launchMissions.launchDate));

  return missions as LaunchMission[];
}

/**
 * Get active missions (not completed or aborted)
 */
export async function getActiveMissions(): Promise<LaunchMission[]> {
  const db = await getDb();
  if (!db) return [];

  const missions = await db
    .select()
    .from(launchMissions)
    .where(
      and(
        sql`${launchMissions.status} != 'completed'`,
        sql`${launchMissions.status} != 'aborted'`
      )
    )
    .orderBy(launchMissions.launchDate);

  return missions as LaunchMission[];
}
