# WooCommerce Storage Analysis for 65,000 Orders

## Order Data Structure Analysis

Based on the WooCommerce API order interface, each order contains:

### Core Order Fields (~50 fields)
- Order metadata (id, number, status, dates, etc.)
- Financial data (totals, taxes, discounts, shipping)
- Customer information (billing & shipping addresses)
- Payment details
- Meta data arrays

### Related Data
- **Line Items**: Average 2-3 items per order
- **Tax Lines**: 1-2 entries per order  
- **Shipping Lines**: 1 entry per order
- **Meta Data**: 5-10 custom fields per order
- **Fee Lines, Coupon Lines, Refunds**: Occasional

## Storage Estimates

### JSON Storage (API Response Format)

**Typical Order Size:**
- Minimal order (1 item, basic info): ~3-4 KB
- Average order (2-3 items, standard fields): ~8-12 KB  
- Complex order (5+ items, extensive metadata): ~15-20 KB

**Conservative Estimate (10 KB average per order):**
- 65,000 orders × 10 KB = **650 MB** (0.63 GB)

**Realistic Estimate (12 KB average per order):**
- 65,000 orders × 12 KB = **780 MB** (0.76 GB)

### Database Storage (Normalized Tables)

**Orders Table:**
- ~2 KB per row (50+ columns with indexes)
- 65,000 rows = **130 MB**

**Line Items Table:**
- ~500 bytes per line item
- Assuming 2.5 items/order average = 162,500 line items
- 162,500 × 500 bytes = **81 MB**

**Order Meta Data:**
- ~200 bytes per meta entry
- Assuming 7 meta entries/order = 455,000 entries
- 455,000 × 200 bytes = **91 MB**

**Tax/Shipping/Fee Lines:**
- ~300 bytes per entry
- Assuming 3 entries/order = 195,000 entries
- 195,000 × 300 bytes = **59 MB**

**Database Indexes:**
- Approximately 20-30% overhead for indexes
- **~90 MB** for indexes

**Total Database Storage: ~450 MB**

## Total Storage Requirements

| Component | Size |
|-----------|------|
| JSON Cache/Backup | 780 MB |
| Database Tables | 450 MB |
| **Total Estimate** | **~1.2 GB** |

## Breakdown by Component (65,000 orders)

```
Orders table:           130 MB  (11%)
Line items:              81 MB  (7%)
Order metadata:          91 MB  (8%)
Tax/shipping/fees:       59 MB  (5%)
Database indexes:        90 MB  (8%)
JSON cache:             780 MB  (65%)
─────────────────────────────────
Total:                ~1.2 GB  (100%)
```

## Recommendations

1. **Initial Download**: Plan for **1.5 GB** of storage to account for overhead
2. **Incremental Sync**: After initial import, daily updates will be minimal (< 100 MB/day)
3. **Compression**: JSON data compresses well (50-70% reduction with gzip)
4. **Archival**: Consider archiving orders older than 2 years to separate storage

## Performance Considerations

- **Download Time**: At 10 Mbps, ~15-20 minutes for initial download
- **Database Import**: Expect 30-60 minutes for 65,000 orders with relations
- **Memory Usage**: Peak ~500 MB RAM during import process
- **Disk I/O**: Use SSD for optimal performance during bulk import

## Scalability

For every additional 10,000 orders:
- Add ~185 MB total storage
- Add ~120 MB JSON
- Add ~65 MB database

