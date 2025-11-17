import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

/**
 * Mission Control WebSocket Service
 * Real-time updates for Mission Control dashboard
 */

let io: SocketIOServer | null = null;

export function initializeMissionControlWebSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/api/mission-control-ws",
  });

  io.on("connection", (socket) => {
    console.log("[Mission Control WS] Client connected:", socket.id);

    socket.on("subscribe_mission", (missionId: number) => {
      socket.join(`mission_${missionId}`);
      console.log(`[Mission Control WS] Client ${socket.id} subscribed to mission ${missionId}`);
    });

    socket.on("unsubscribe_mission", (missionId: number) => {
      socket.leave(`mission_${missionId}`);
      console.log(`[Mission Control WS] Client ${socket.id} unsubscribed from mission ${missionId}`);
    });

    socket.on("disconnect", () => {
      console.log("[Mission Control WS] Client disconnected:", socket.id);
    });
  });

  console.log("[Mission Control WS] WebSocket server initialized");
  return io;
}

/**
 * Broadcast readiness update to all clients watching a mission
 */
export function broadcastReadinessUpdate(missionId: number, readinessData: {
  overallScore: number;
  productScore: number;
  variantScore: number;
  inventoryScore: number;
  timestamp: Date;
}) {
  if (!io) return;

  io.to(`mission_${missionId}`).emit("readiness_update", {
    missionId,
    ...readinessData,
  });

  console.log(`[Mission Control WS] Broadcast readiness update for mission ${missionId}`);
}

/**
 * Broadcast status change to all clients watching a mission
 */
export function broadcastStatusChange(missionId: number, status: string, phase: string) {
  if (!io) return;

  io.to(`mission_${missionId}`).emit("status_change", {
    missionId,
    status,
    phase,
    timestamp: new Date(),
  });

  console.log(`[Mission Control WS] Broadcast status change for mission ${missionId}: ${status}`);
}

/**
 * Broadcast task completion to all clients watching a mission
 */
export function broadcastTaskCompletion(missionId: number, taskData: {
  taskName: string;
  category: string;
  completedBy: string;
}) {
  if (!io) return;

  io.to(`mission_${missionId}`).emit("task_completed", {
    missionId,
    ...taskData,
    timestamp: new Date(),
  });

  console.log(`[Mission Control WS] Broadcast task completion for mission ${missionId}`);
}

/**
 * Broadcast alert to all clients watching a mission
 */
export function broadcastAlert(missionId: number, alert: {
  severity: "info" | "warning" | "error" | "success";
  message: string;
  source: string;
}) {
  if (!io) return;

  io.to(`mission_${missionId}`).emit("alert", {
    missionId,
    ...alert,
    timestamp: new Date(),
  });

  console.log(`[Mission Control WS] Broadcast alert for mission ${missionId}: ${alert.severity}`);
}

/**
 * Get connected clients count for a mission
 */
export async function getConnectedClientsCount(missionId: number): Promise<number> {
  if (!io) return 0;

  const room = io.sockets.adapter.rooms.get(`mission_${missionId}`);
  return room ? room.size : 0;
}
