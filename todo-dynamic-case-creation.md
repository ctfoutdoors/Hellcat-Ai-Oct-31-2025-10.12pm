# Dynamic Case Creation System - Implementation Checklist

## Phase 1: Database Schema Updates ✅ COMPLETE
- [x] Add customerIdentities table for identity resolution
- [x] Add customerIdentityMatches table for fuzzy match tracking
- [x] Add reamazeTickets table for support history
- [x] Add klaviyoProfiles table for marketing data
- [x] Add orderSources table for multi-channel orders
- [x] Add customerRiskScores table for AI scoring
- [x] Add dataEnrichmentLogs table for audit trail
- [x] Push all schema changes to database

## Phase 2: Customer Identity Resolution Engine ✅ COMPLETE
- [x] Build CustomerIdentityResolver service
- [x] Implement exact match algorithm (email, phone)
- [x] Implement fuzzy name matching (Levenshtein distance)
- [x] Implement address history tracking
- [x] Add confidence scoring (0-100%)
- [x] Build merge/split functionality with audit trail
- [x] Create identity conflict detection
- [x] Add manual review queue for low-confidence matches

## Phase 3: Reamaze Integration ✅ COMPLETE
- [x] Request Reamaze API credentials (email + key)
- [x] Build ReamazeService for API calls
- [x] Implement ticket fetching by customer email
- [x] Parse ticket data: status, subject, messages, satisfaction
- [x] Calculate support metrics: avg resolution time, ticket count
- [x] Add sentiment analysis for ticket content
- [ ] Create tRPC router for Reamaze data (integrated in dataEnrichment router)
- [ ] Build UI component for ticket display

## Phase 4: Klaviyo Integration ✅ COMPLETE
- [x] Request Klaviyo API private key
- [x] Build KlaviyoService for API calls
- [x] Fetch customer profile by email
- [x] Pull engagement metrics: opens, clicks, purchases
- [x] Fetch product reviews for customer
- [x] Calculate customer lifetime value from Klaviyo
- [x] Get customer segments and tags
- [ ] Create tRPC router for Klaviyo data (integrated in dataEnrichment router)
- [ ] Build UI component for marketing stats

## Phase 5: Multi-Channel Order Integration ✅ COMPLETE
- [x] Enhance ShipStation service for full order data
- [x] Build WooCommerce API integration
- [x] Build Amazon order fetching (via ShipStation or native)
- [x] Build eBay order fetching (via ShipStation or native)
- [x] Build TikTok Shop integration (via ShipStation or native)
- [x] Create unified order data model
- [x] Add channel detection logic
- [x] Create channel icon mapping (WooCommerce/Amazon/eBay/TikTok logos)

## Phase 6: AI Risk Scoring System ✅ COMPLETE
- [x] Build CustomerRiskScorer service
- [x] Define scoring factors and weights
- [x] Implement dispute history analysis
- [x] Implement support ticket volume scoring
- [x] Implement review sentiment scoring
- [x] Implement order frequency analysis
- [x] Implement engagement level scoring
- [x] Generate risk score breakdown with explanations
- [x] Add recommendations based on score
- [x] Create tRPC router for risk scoring (integrated in dataEnrichment router)

## Phase 7: Dynamic Case Creation UI
- [ ] Add Adjustment ID field to CreateCaseForm
- [ ] Add Adjustment Date field
- [ ] Add Reason/Description field
- [ ] Break down dimensions into length/width/height/unit
- [ ] Add cm to inches conversion
- [ ] Add Cost Breakdown section
- [ ] Enhance label analysis to extract all fields
- [ ] Add recipient address field with customer lookup

## Phase 8: Live Data Enrichment Flow
- [ ] Create DataEnrichmentFlow component
- [ ] Build Stage 1: Label upload and initial analysis
- [ ] Build Stage 2: ShipStation data pull with loading animation
- [ ] Build Stage 3: Order origin discovery with channel icons
- [ ] Build Stage 4: Reamaze ticket fetching
- [ ] Build Stage 5: Klaviyo profile enrichment
- [ ] Build Stage 6: Customer identity resolution
- [ ] Build Stage 7: AI risk scoring
- [ ] Add rich visual cards for each data source
- [ ] Show real-time progress indicators

## Phase 9: Skip & Background Processing
- [ ] Add "Skip" button to enrichment flow
- [ ] Implement background job queue for data fetching
- [ ] Build progress bar component
- [ ] Show status messages: "Fetching ShipStation... 40%"
- [ ] Update case fields as data arrives
- [ ] Handle partial data scenarios
- [ ] Add retry logic for failed API calls

## Phase 10: Unified Customer Profile Card
- [ ] Create CustomerProfileCard component
- [ ] Display customer avatar and name
- [ ] Show risk score with color coding
- [ ] Display lifetime value calculation
- [ ] Show order count and dispute count
- [ ] Display average review rating
- [ ] Show support ticket summary
- [ ] Display email engagement stats
- [ ] Add "View Full Profile" modal
- [ ] Build historical transaction timeline
- [ ] Show identity match confidence
- [ ] Add manual merge/split controls

## Phase 11: Testing & Polish
- [ ] Test label upload and analysis
- [ ] Test ShipStation integration
- [ ] Test WooCommerce integration
- [ ] Test Reamaze integration
- [ ] Test Klaviyo integration
- [ ] Test customer identity resolution
- [ ] Test AI risk scoring accuracy
- [ ] Test skip and background processing
- [ ] Test complete end-to-end flow
- [ ] Save checkpoint with all features


## FRONTEND IMPLEMENTATION - IN PROGRESS

### Phase 1: Enhanced CreateCaseForm
- [ ] Add Adjustment ID field
- [ ] Add Adjustment Date field with date picker
- [ ] Add Reason/Description textarea
- [ ] Break down Carrier Stated Dimensions into L/W/H fields
- [ ] Add unit selector (cm/in) with conversion display
- [ ] Add Recipient Address field
- [ ] Add Package Weight field
- [ ] Update AI label analysis to extract all fields
- [ ] Add visual confirmation after successful upload

### Phase 2: DynamicEnrichmentFlow Component
- [ ] Create multi-stage progress indicator
- [ ] Build stage cards for each data source
- [ ] Add loading animations
- [ ] Implement skip functionality
- [ ] Add error handling and retry
- [ ] Show real-time status updates
- [ ] Display enriched data as it arrives

### Phase 3: CustomerProfileCard Component
- [ ] Create customer avatar and header
- [ ] Display risk score badge with color coding
- [ ] Show LTV and order statistics
- [ ] Display support ticket summary
- [ ] Show review ratings
- [ ] Add email engagement metrics
- [ ] Build expandable details section
- [ ] Add identity match confidence indicator

### Phase 4: EnrichmentStageCard Components
- [ ] ShipStation data card
- [ ] Order source card with channel icon
- [ ] Reamaze tickets card
- [ ] Klaviyo profile card
- [ ] Risk score breakdown card
- [ ] Add loading skeletons
- [ ] Add error states

### Phase 5: Background Enrichment
- [ ] Create background job indicator
- [ ] Build progress bar component
- [ ] Show current step status
- [ ] Update case fields as data arrives
- [ ] Add completion notification
- [ ] Handle partial data scenarios

### Phase 6: Visual Polish
- [ ] Add channel icons (WooCommerce, Amazon, eBay, TikTok)
- [ ] Create risk level badges
- [ ] Add data source indicators
- [ ] Implement smooth transitions
- [ ] Add tooltips and help text
- [ ] Responsive design for all components

### Phase 7: Testing & Integration
- [ ] Test complete enrichment flow
- [ ] Test skip functionality
- [ ] Test background processing
- [ ] Test error handling
- [ ] Test with real API data
- [ ] Save checkpoint
