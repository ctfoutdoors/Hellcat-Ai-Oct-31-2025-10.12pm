# Complete Inventory Management Features

## Phase 1: Image Import ✅ IN PROGRESS
- [ ] Debug why productSync.syncAllImages mutation isn't triggering
- [ ] Test image import with a single product first
- [ ] Verify images display in Products page after import
- [ ] Test bulk image import for all products

## Phase 2: ShipStation Stock Sync
- [ ] Create endpoint to fetch all warehouse inventory from ShipStation
- [ ] Populate channel_inventory table with warehouse stock data
- [ ] Update Products page to show total stock from all warehouses
- [ ] Add hover tooltip showing per-warehouse breakdown
- [ ] Test with real ShipStation data

## Phase 3: Tiered Pricing Management
- [ ] Create pricing management page UI
- [ ] Add endpoints to set wholesale/distributor prices
- [ ] Add endpoint to set customer-specific pricing
- [ ] Display pricing tiers in Products page
- [ ] Test pricing calculations

## Phase 4: Final Testing
- [ ] Verify all images are imported
- [ ] Verify stock levels are accurate
- [ ] Verify pricing tiers work correctly
- [ ] Test all features in browser
- [ ] Save final checkpoint
