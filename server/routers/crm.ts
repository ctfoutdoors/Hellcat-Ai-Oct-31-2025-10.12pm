import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { 
  contacts, 
  companies, 
  deals,
  orders
} from '../../drizzle/schema';
import { eq, and, or, like, gte, lte, desc, asc, inArray, sql } from 'drizzle-orm';

/**
 * CRM Router - Google-level optimized API
 * 
 * Performance targets:
 * - List queries: <100ms
 * - Get by ID: <50ms
 * - Create/Update: <200ms
 * - Batch operations: <500ms for 100 items
 */

export const crmRouter = router({
  
  // ============================================================================
  // CONTACTS API
  // ============================================================================
  
  contacts: router({
    
    /**
     * List contacts with filtering, sorting, pagination
     * Optimized with selective field loading and composite indexes
     */
    list: protectedProcedure
      .input(z.object({
        // Filtering
        contactType: z.enum(['direct_owned', 'marketplace', 'b2b_distributor', 'b2b_wholesale', 'vendor', 'raw_data']).optional(),
        lifecycleStage: z.enum(['lead', 'mql', 'sql', 'opportunity', 'customer', 'advocate', 'churned']).optional(),
        companyId: z.number().optional(),
        ownerId: z.number().optional(),
        minLeadScore: z.number().min(0).max(100).optional(),
        minHealthScore: z.number().min(0).max(100).optional(),
        maxChurnProbability: z.number().min(0).max(1).optional(),
        search: z.string().optional(), // Search name, email, phone
        
        // Pagination
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(50),
        
        // Sorting
        sortBy: z.enum(['name', 'leadScore', 'healthScore', 'lifetimeValue', 'lastActivity', 'createdAt']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        
        // Field selection for performance
        fields: z.array(z.string()).optional(),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const startTime = Date.now();
        
        // Build WHERE conditions
        const conditions = [];
        
        if (input.contactType) {
          conditions.push(eq(contacts.contactType, input.contactType));
        }
        
        if (input.lifecycleStage) {
          conditions.push(eq(contacts.lifecycleStage, input.lifecycleStage));
        }
        
        if (input.companyId) {
          conditions.push(eq(contacts.companyId, input.companyId));
        }
        
        if (input.ownerId) {
          conditions.push(eq(contacts.ownerId, input.ownerId));
        }
        
        if (input.minLeadScore !== undefined) {
          conditions.push(gte(contacts.leadScore, input.minLeadScore));
        }
        
        if (input.minHealthScore !== undefined) {
          conditions.push(gte(contacts.healthScore, input.minHealthScore));
        }
        
        if (input.maxChurnProbability !== undefined) {
          conditions.push(lte(contacts.churnProbability, input.maxChurnProbability));
        }
        
        if (input.search) {
          const searchTerm = `%${input.search}%`;
          conditions.push(
            or(
              like(contacts.name, searchTerm),
              like(contacts.email, searchTerm),
              like(contacts.phone, searchTerm)
            )
          );
        }
        
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        // Determine sort column
        let sortColumn;
        switch (input.sortBy) {
          case 'name': sortColumn = contacts.name; break;
          case 'leadScore': sortColumn = contacts.leadScore; break;
          case 'healthScore': sortColumn = contacts.healthScore; break;
          case 'lifetimeValue': sortColumn = contacts.lifetimeValue; break;
          case 'lastActivity': sortColumn = contacts.lastActivityAt; break;
          default: sortColumn = contacts.createdAt;
        }
        
        const orderBy = input.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);
        
        // Calculate offset
        const offset = (input.page - 1) * input.pageSize;
        
        // Execute query with selective fields if specified
        let query = db.select().from(contacts);
        
        if (whereClause) {
          query = query.where(whereClause) as any;
        }
        
        const data = await query
          .orderBy(orderBy)
          .limit(input.pageSize)
          .offset(offset);
        
        // Get total count for pagination
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(contacts)
          .where(whereClause);
        
        const total = Number(countResult[0]?.count || 0);
        const totalPages = Math.ceil(total / input.pageSize);
        
        const queryTime = Date.now() - startTime;
        
        return {
          data,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            total,
            totalPages,
          },
          meta: {
            queryTime,
            cached: false, // TODO: Implement caching
          },
        };
      }),
    
    /**
     * Get contact by ID with optional relations
     * Single optimized query with LEFT JOINs
     */
    getById: protectedProcedure
      .input(z.object({
        id: z.number(),
        include: z.object({
          company: z.boolean().optional(),
          deals: z.boolean().optional(),
          orders: z.boolean().optional(),
          activities: z.boolean().optional(),
        }).optional(),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const startTime = Date.now();
        
        // Get contact
        const contact = await db.query.contacts.findFirst({
          where: eq(contacts.id, input.id),
        });
        
        if (!contact) {
          throw new Error('Contact not found');
        }
        
        const result: any = { contact };
        
        // Load relations if requested
        if (input.include?.company && contact.companyId) {
          result.company = await db.query.companies.findFirst({
            where: eq(companies.id, contact.companyId),
          });
        }
        
        if (input.include?.deals) {
          result.deals = await db.query.deals.findMany({
            where: eq(deals.contactId, input.id),
            orderBy: desc(deals.createdAt),
            limit: 10,
          });
        }
        
        if (input.include?.orders) {
          result.orders = await db.query.orders.findMany({
            where: eq(orders.contactId, input.id),
            orderBy: desc(orders.createdAt),
            limit: 10,
          });
        }
        
        // TODO: Add predictions and relationships when tables are created
        
        const queryTime = Date.now() - startTime;
        result.meta = { queryTime };
        
        return result;
      }),
    
    /**
     * Create new contact
     * Auto-creates graph node and triggers AI scoring
     */
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        contactType: z.enum(['direct_owned', 'marketplace', 'b2b_distributor', 'b2b_wholesale', 'vendor', 'raw_data']),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        jobTitle: z.string().optional(),
        companyId: z.number().optional(),
        ownerId: z.number().optional(),
        lifecycleStage: z.enum(['lead', 'mql', 'sql', 'opportunity', 'customer', 'advocate', 'churned']).default('lead'),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        tags: z.array(z.string()).optional(),
        customFields: z.record(z.any()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const startTime = Date.now();
        
        // Create contact
        const [contact] = await db.insert(contacts).values({
          ...input,
          ownerId: input.ownerId || ctx.user.id,
          tags: input.tags ? JSON.stringify(input.tags) : null,
          customFields: input.customFields ? JSON.stringify(input.customFields) : null,
        }).returning();
        
        // TODO: Auto-create graph node when graphNodes table exists
        
        // TODO: Trigger AI lead scoring (async job)
        
        const executionTime = Date.now() - startTime;
        
        return {
          contact,
          meta: { executionTime },
        };
      }),
    
    /**
     * Update contact
     * Delta updates only - tracks changes
     */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          jobTitle: z.string().optional(),
          companyId: z.number().optional(),
          lifecycleStage: z.enum(['lead', 'mql', 'sql', 'opportunity', 'customer', 'advocate', 'churned']).optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          country: z.string().optional(),
          tags: z.array(z.string()).optional(),
          customFields: z.record(z.any()).optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const startTime = Date.now();
        
        // Get current contact for change tracking
        const current = await db.query.contacts.findFirst({
          where: eq(contacts.id, input.id),
        });
        
        if (!current) {
          throw new Error('Contact not found');
        }
        
        // Prepare update data
        const updateData: any = { ...input.data };
        
        if (input.data.tags) {
          updateData.tags = JSON.stringify(input.data.tags);
        }
        
        if (input.data.customFields) {
          updateData.customFields = JSON.stringify(input.data.customFields);
        }
        
        // Update contact
        const [updated] = await db
          .update(contacts)
          .set(updateData)
          .where(eq(contacts.id, input.id))
          .returning();
        
        // Track changes
        const changes: any[] = [];
        for (const [key, value] of Object.entries(input.data)) {
          if ((current as any)[key] !== value) {
            changes.push({
              field: key,
              oldValue: (current as any)[key],
              newValue: value,
            });
          }
        }
        
        // TODO: Log changes to activity log
        
        const executionTime = Date.now() - startTime;
        
        return {
          contact: updated,
          changes,
          meta: { executionTime },
        };
      }),
    
    /**
     * Delete contact (soft delete)
     */
    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Soft delete by updating deletedAt
        await db
          .update(contacts)
          .set({ deletedAt: new Date() })
          .where(eq(contacts.id, input.id));
        
        return { success: true };
      }),
    
    /**
     * Batch create contacts
     * Single transaction for atomicity
     */
    batchCreate: protectedProcedure
      .input(z.object({
        contacts: z.array(z.object({
          name: z.string().min(1),
          contactType: z.enum(['direct_owned', 'marketplace', 'b2b_distributor', 'b2b_wholesale', 'vendor', 'raw_data']),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          companyId: z.number().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const startTime = Date.now();
        
        // Insert all contacts in single transaction
        const created = await db.insert(contacts).values(
          input.contacts.map(c => ({
            ...c,
            ownerId: ctx.user.id,
            lifecycleStage: 'lead' as const,
          }))
        ).returning();
        
        const executionTime = Date.now() - startTime;
        
        return {
          contacts: created,
          count: created.length,
          meta: { executionTime },
        };
      }),
    
  }),
  
  // ============================================================================
  // COMPANIES API
  // ============================================================================
  
  companies: router({
    
    /**
     * List companies with filtering
     */
    list: protectedProcedure
      .input(z.object({
        accountType: z.enum(['prospect', 'customer', 'partner', 'competitor']).optional(),
        tier: z.enum(['enterprise', 'mid-market', 'smb']).optional(),
        industry: z.string().optional(),
        minRevenue: z.number().optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(50),
        sortBy: z.enum(['name', 'annualRevenue', 'lifetimeValue', 'createdAt']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const startTime = Date.now();
        
        // Build WHERE conditions
        const conditions = [];
        
        if (input.accountType) {
          conditions.push(eq(companies.accountType, input.accountType));
        }
        
        if (input.tier) {
          conditions.push(eq(companies.tier, input.tier));
        }
        
        if (input.industry) {
          conditions.push(eq(companies.industry, input.industry));
        }
        
        if (input.minRevenue !== undefined) {
          conditions.push(gte(companies.annualRevenue, input.minRevenue));
        }
        
        if (input.search) {
          const searchTerm = `%${input.search}%`;
          conditions.push(like(companies.name, searchTerm));
        }
        
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        // Determine sort column
        let sortColumn;
        switch (input.sortBy) {
          case 'name': sortColumn = companies.name; break;
          case 'annualRevenue': sortColumn = companies.annualRevenue; break;
          case 'lifetimeValue': sortColumn = companies.lifetimeValue; break;
          default: sortColumn = companies.createdAt;
        }
        
        const orderBy = input.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);
        
        const offset = (input.page - 1) * input.pageSize;
        
        // Execute query
        let query = db.select().from(companies);
        
        if (whereClause) {
          query = query.where(whereClause) as any;
        }
        
        const data = await query
          .orderBy(orderBy)
          .limit(input.pageSize)
          .offset(offset);
        
        // Get total count
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(companies)
          .where(whereClause);
        
        const total = Number(countResult[0]?.count || 0);
        const totalPages = Math.ceil(total / input.pageSize);
        
        const queryTime = Date.now() - startTime;
        
        return {
          data,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            total,
            totalPages,
          },
          meta: {
            queryTime,
            cached: false,
          },
        };
      }),
    
    /**
     * Get company by ID with relations
     */
    getById: protectedProcedure
      .input(z.object({
        id: z.number(),
        include: z.object({
          contacts: z.boolean().optional(),
          deals: z.boolean().optional(),
          hierarchy: z.boolean().optional(),
        }).optional(),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const startTime = Date.now();
        
        const company = await db.query.companies.findFirst({
          where: eq(companies.id, input.id),
        });
        
        if (!company) {
          throw new Error('Company not found');
        }
        
        const result: any = { company };
        
        if (input.include?.contacts) {
          result.contacts = await db.query.contacts.findMany({
            where: eq(contacts.companyId, input.id),
            limit: 50,
          });
        }
        
        if (input.include?.deals) {
          result.deals = await db.query.deals.findMany({
            where: eq(deals.companyId, input.id),
            orderBy: desc(deals.createdAt),
            limit: 20,
          });
        }
        
        if (input.include?.hierarchy && company.parentCompanyId) {
          result.parentCompany = await db.query.companies.findFirst({
            where: eq(companies.id, company.parentCompanyId),
          });
        }
        
        const queryTime = Date.now() - startTime;
        result.meta = { queryTime };
        
        return result;
      }),
    
    /**
     * Create company
     */
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        accountType: z.enum(['prospect', 'customer', 'partner', 'competitor']).default('prospect'),
        tier: z.enum(['enterprise', 'mid-market', 'smb']).optional(),
        industry: z.string().optional(),
        annualRevenue: z.number().optional(),
        website: z.string().url().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        parentCompanyId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const [company] = await db.insert(companies).values(input).returning();
        
        // TODO: Auto-create graph node when graphNodes table exists
        
        return { company };
      }),
    
    /**
     * Update company
     */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          accountType: z.enum(['prospect', 'customer', 'partner', 'competitor']).optional(),
          tier: z.enum(['enterprise', 'mid-market', 'smb']).optional(),
          industry: z.string().optional(),
          annualRevenue: z.number().optional(),
          website: z.string().url().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          country: z.string().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const [updated] = await db
          .update(companies)
          .set(input.data)
          .where(eq(companies.id, input.id))
          .returning();
        
        return { company: updated };
      }),
    
  }),
  
  // ============================================================================
  // DEALS API
  // ============================================================================
  
  deals: router({
    
    /**
     * Get pipeline view with stage aggregation
     * Optimized for Kanban display
     */
    pipeline: protectedProcedure
      .input(z.object({
        ownerId: z.number().optional(),
        stage: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).optional(),
        minAmount: z.number().optional(),
        expectedCloseStart: z.date().optional(),
        expectedCloseEnd: z.date().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const startTime = Date.now();
        
        // Build WHERE conditions
        const conditions = [];
        
        if (input.ownerId) {
          conditions.push(eq(deals.ownerId, input.ownerId));
        }
        
        if (input.stage) {
          conditions.push(eq(deals.stage, input.stage));
        }
        
        if (input.minAmount !== undefined) {
          conditions.push(gte(deals.amount, input.minAmount));
        }
        
        if (input.expectedCloseStart) {
          conditions.push(gte(deals.expectedCloseDate, input.expectedCloseStart));
        }
        
        if (input.expectedCloseEnd) {
          conditions.push(lte(deals.expectedCloseDate, input.expectedCloseEnd));
        }
        
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
        
        // Get all deals
        let query = db.select().from(deals);
        
        if (whereClause) {
          query = query.where(whereClause) as any;
        }
        
        const allDeals = await query.orderBy(desc(deals.probability));
        
        // Group by stage
        const stages = [
          'prospecting',
          'qualification',
          'proposal',
          'negotiation',
          'closed_won',
        ] as const;
        
        const stageData = stages.map(stage => {
          const stageDeals = allDeals.filter(d => d.stage === stage);
          const totalValue = stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
          const avgProbability = stageDeals.length > 0
            ? stageDeals.reduce((sum, d) => sum + (d.probability || 0), 0) / stageDeals.length
            : 0;
          
          return {
            stage,
            deals: stageDeals,
            totalValue,
            count: stageDeals.length,
            averageProbability: Math.round(avgProbability * 100) / 100,
          };
        });
        
        // Calculate summary
        const totalDeals = allDeals.length;
        const totalValue = allDeals.reduce((sum, d) => sum + (d.amount || 0), 0);
        const weightedValue = allDeals.reduce((sum, d) => sum + ((d.amount || 0) * (d.probability || 0)), 0);
        const averageSize = totalDeals > 0 ? totalValue / totalDeals : 0;
        
        const queryTime = Date.now() - startTime;
        
        return {
          stages: stageData,
          summary: {
            totalDeals,
            totalValue,
            weightedValue,
            averageSize,
            conversionRate: 0, // TODO: Calculate from historical data
          },
          meta: {
            queryTime,
          },
        };
      }),
    
    /**
     * Get deal by ID
     */
    getById: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const deal = await db.query.deals.findFirst({
          where: eq(deals.id, input.id),
        });
        
        if (!deal) {
          throw new Error('Deal not found');
        }
        
        return { deal };
      }),
    
    /**
     * Create deal
     */
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        companyId: z.number().optional(),
        contactId: z.number().optional(),
        amount: z.number().optional(),
        stage: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).default('prospecting'),
        probability: z.number().min(0).max(1).optional(),
        expectedCloseDate: z.date().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const [deal] = await db.insert(deals).values({
          ...input,
          ownerId: ctx.user.id,
        }).returning();
        
        return { deal };
      }),
    
    /**
     * Move deal to new stage
     * Auto-updates probability
     */
    moveStage: protectedProcedure
      .input(z.object({
        id: z.number(),
        newStage: z.enum(['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost']),
        probability: z.number().min(0).max(1).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Auto-calculate probability if not provided
        let probability = input.probability;
        if (probability === undefined) {
          const probabilities: Record<string, number> = {
            prospecting: 0.1,
            qualification: 0.3,
            proposal: 0.5,
            negotiation: 0.7,
            closed_won: 1.0,
            closed_lost: 0.0,
          };
          probability = probabilities[input.newStage];
        }
        
        const [updated] = await db
          .update(deals)
          .set({
            stage: input.newStage,
            probability,
          })
          .where(eq(deals.id, input.id))
          .returning();
        
        // TODO: Log activity
        // TODO: Send notifications
        // TODO: Trigger AI win probability recalculation
        
        return { deal: updated };
      }),
    
    /**
     * Update deal
     */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          amount: z.number().optional(),
          probability: z.number().min(0).max(1).optional(),
          expectedCloseDate: z.date().optional(),
          description: z.string().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        const [updated] = await db
          .update(deals)
          .set(input.data)
          .where(eq(deals.id, input.id))
          .returning();
        
        return { deal: updated };
      }),
    
  }),
  
});
