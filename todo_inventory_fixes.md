# INVENTORY MANAGEMENT FIXES - MUST COMPLETE

## CRITICAL BUGS TO FIX
- [ ] Test Products page in browser and identify why it's not showing
- [ ] Fix any routing or component errors
- [ ] Verify database has product data

## PRODUCT IMAGES
- [ ] Import ALL product images from WooCommerce for existing products
- [ ] Verify images display in Products Management page
- [ ] Verify images display in WooCommerce Products Source page

## SKU & COST DISPLAY
- [ ] Verify SKU shows actual SKU (not WooCommerce ID)
- [ ] Verify cost column shows actual cost (not category)
- [ ] Test cost priority: manual → shipstation → base

## TIERED PRICING SYSTEM
- [ ] Create pricing management UI page
- [ ] Add endpoints to set public/wholesale/distributor prices
- [ ] Add endpoints to set customer-specific pricing by email
- [ ] Display correct price based on user role in Products page
- [ ] Test all pricing tiers

## CHANNEL INVENTORY TRACKING
- [ ] Sync ShipStation warehouse inventory to channel_inventory table
- [ ] Calculate total stock from all ShipStation warehouses
- [ ] Populate channel-specific stock (WooCommerce, Amazon, TikTok, eBay)
- [ ] Add buffer and zero-stock threshold per channel
- [ ] Enable manual quantity overrides per channel
- [ ] Update stock tooltip to show real channel breakdown
- [ ] Test hover tooltip displays correct data

## COST MANAGEMENT
- [ ] Enable ShipStation cost sync
- [ ] Enable manual cost entry per product
- [ ] Enable per-channel cost tracking
- [ ] Test cost display shows correct priority

## BROWSER TESTING
- [ ] Navigate to Products page and verify it loads
- [ ] Verify all 14 products display with images
- [ ] Verify SKU, cost, price, margin, stock all show correctly
- [ ] Test stock tooltip hover
- [ ] Test all filters and search
- [ ] Take screenshots of working features
