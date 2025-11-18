import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { fetchGoogleCalendarEvents, pushEventToGoogleCalendar } from "../services/calendarSync";
import { eq, and } from "drizzle-orm";

// Note: In production, these would be environment variables
// For now, users need to set up Google Cloud Console OAuth credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

export const calendarRouter = router({
  // List all calendar connections for the current user
  listConnections: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const result = await db.execute(`
      SELECT * FROM calendar_connections 
      WHERE user_id = ? 
      ORDER BY is_primary DESC, created_at DESC
    `, [ctx.user.id]);

    return result.rows.map((row: any) => ({
      id: row.id,
      provider: row.provider,
      providerAccountId: row.provider_account_id,
      providerAccountEmail: row.provider_account_email,
      isPrimary: Boolean(row.is_primary),
      syncEnabled: Boolean(row.sync_enabled),
      lastSyncAt: row.last_sync_at,
      calendarId: row.calendar_id,
      calendarName: row.calendar_name,
      createdAt: row.created_at,
    }));
  }),

  // Connect a new calendar (called after OAuth callback)
  connect: protectedProcedure
    .input(z.object({
      provider: z.enum(["google", "outlook", "apple"]),
      authCode: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      if (input.provider === "google") {
        // Exchange auth code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: input.authCode,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: `${process.env.VITE_APP_URL || "http://localhost:3001"}/calendar/oauth/callback`,
            grant_type: "authorization_code",
          }),
        });

        if (!tokenResponse.ok) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Failed to exchange auth code for tokens" 
          });
        }

        const tokens = await tokenResponse.json();

        // Get user's calendar info
        const calendarResponse = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList/primary", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const calendarData = await calendarResponse.json();

        // Get user info to get email
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        const userInfo = await userInfoResponse.json();

        // Check if this is the first calendar connection
        const existingConnections = await db.execute(`
          SELECT COUNT(*) as count FROM calendar_connections WHERE user_id = ?
        `, [ctx.user.id]);

        const isFirstConnection = existingConnections.rows[0].count === 0;

        // Store connection
        await db.execute(`
          INSERT INTO calendar_connections (
            user_id, provider, provider_account_id, provider_account_email,
            access_token, refresh_token, token_expires_at,
            is_primary, calendar_id, calendar_name
          ) VALUES (?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?), ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            access_token = VALUES(access_token),
            refresh_token = VALUES(refresh_token),
            token_expires_at = VALUES(token_expires_at),
            calendar_id = VALUES(calendar_id),
            calendar_name = VALUES(calendar_name),
            updated_at = CURRENT_TIMESTAMP
        `, [
          ctx.user.id,
          "google",
          userInfo.id,
          userInfo.email,
          tokens.access_token,
          tokens.refresh_token || null,
          Math.floor(Date.now() / 1000) + (tokens.expires_in || 3600),
          isFirstConnection ? 1 : 0,
          calendarData.id,
          calendarData.summary || "Primary Calendar",
        ]);

        return { success: true };
      }

      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: `${input.provider} not yet supported` });
    }),

  // Disconnect a calendar
  disconnect: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.execute(`
        DELETE FROM calendar_connections 
        WHERE id = ? AND user_id = ?
      `, [input.connectionId, ctx.user.id]);

      return { success: true };
    }),

  // Toggle sync for a calendar
  toggleSync: protectedProcedure
    .input(z.object({
      connectionId: z.number(),
      enabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.execute(`
        UPDATE calendar_connections 
        SET sync_enabled = ? 
        WHERE id = ? AND user_id = ?
      `, [input.enabled ? 1 : 0, input.connectionId, ctx.user.id]);

      return { success: true };
    }),

  // Set primary calendar
  setPrimary: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Unset all primary flags
      await db.execute(`
        UPDATE calendar_connections 
        SET is_primary = 0 
        WHERE user_id = ?
      `, [ctx.user.id]);

      // Set new primary
      await db.execute(`
        UPDATE calendar_connections 
        SET is_primary = 1 
        WHERE id = ? AND user_id = ?
      `, [input.connectionId, ctx.user.id]);

      return { success: true };
    }),

  // Manually trigger sync for a calendar
  syncNow: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get connection details
      const result = await db.execute(`
        SELECT * FROM calendar_connections 
        WHERE id = ? AND user_id = ?
      `, [input.connectionId, ctx.user.id]);

      if (result.rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Calendar connection not found" });
      }

      const connection = result.rows[0];

      // Fetch and sync events from Google Calendar
      await fetchGoogleCalendarEvents(input.connectionId);

      return { success: true, message: "Sync completed" };
    }),

  // Get calendar events for a specific entity (customer, vendor, lead)
  getEntityEvents: protectedProcedure
    .input(z.object({
      entityType: z.enum(["customer", "vendor", "lead", "contact"]),
      entityId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get calendar events linked to this entity
      const result = await db.execute(`
        SELECT 
          ce.*,
          cc.provider,
          cc.calendar_name,
          cc.provider_account_email
        FROM calendar_events ce
        JOIN calendar_connections cc ON ce.calendar_connection_id = cc.id
        WHERE ce.entity_type = ? AND ce.entity_id = ?
        AND cc.user_id = ?
        ORDER BY ce.start_time DESC
      `, [input.entityType, input.entityId, ctx.user.id]);

      return result.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        location: row.location,
        startTime: row.start_time,
        endTime: row.end_time,
        allDay: Boolean(row.all_day),
        attendees: row.attendees ? JSON.parse(row.attendees) : [],
        organizerEmail: row.organizer_email,
        status: row.status,
        provider: row.provider,
        calendarName: row.calendar_name,
        providerAccountEmail: row.provider_account_email,
      }));
    }),
});
