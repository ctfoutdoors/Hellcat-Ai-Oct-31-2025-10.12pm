import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// Create database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log("🌱 Seeding Intelligence Suite sample products...\n");

// Sample products for commercial launches
const sampleProducts = [
  {
    sku: "FISH-LINE-PRO-20LB",
    name: "ProCast Fishing Line - 20lb Test",
    description: "Premium monofilament fishing line with enhanced abrasion resistance. Perfect for freshwater and light saltwater fishing.",
    category: "Fishing Line",
    weight: "0.5",
    dimensions: "4x4x1",
    standardDimensions: "Small Box",
    cost: "8.50",
    price: "24.99",
    margin: "16.49",
    supplier: "Fishing Gear Wholesale Inc",
    leadTimeDays: 14,
    isActive: true,
    lifecycleState: "development",
    intelligenceMetadata: JSON.stringify({
      assets: [
        { type: "product_images", status: "in_progress", url: null },
        { type: "packaging_design", status: "completed", url: "https://example.com/packaging.pdf" },
        { type: "marketing_copy", status: "completed", url: null }
      ],
      requirements: [
        { name: "Product Photography", completed: false },
        { name: "Packaging Design", completed: true },
        { name: "Marketing Copy", completed: true },
        { name: "Inventory Stocked", completed: false }
      ],
      readinessScore: 65,
      blockers: ["Awaiting product photography", "Initial inventory order pending"]
    }),
    variantSummary: JSON.stringify({
      total: 3,
      ready: 1,
      blocked: 2,
      avgReadiness: 55
    }),
    lastIntelligenceUpdate: new Date()
  },
  {
    sku: "TACKLE-BOX-ELITE",
    name: "Elite Tackle Storage System",
    description: "Professional-grade tackle box with 8 compartments, waterproof seals, and rust-resistant latches. Holds up to 200 pieces of tackle.",
    category: "Tackle Storage",
    weight: "3.2",
    dimensions: "14x9x8",
    standardDimensions: "Medium Box",
    cost: "22.00",
    price: "59.99",
    margin: "37.99",
    supplier: "Outdoor Gear Direct",
    leadTimeDays: 21,
    isActive: true,
    lifecycleState: "pre_launch",
    intelligenceMetadata: JSON.stringify({
      assets: [
        { type: "product_images", status: "completed", url: "https://example.com/images/tackle-box.jpg" },
        { type: "packaging_design", status: "completed", url: "https://example.com/packaging-tackle.pdf" },
        { type: "marketing_copy", status: "completed", url: null },
        { type: "instruction_manual", status: "completed", url: "https://example.com/manual.pdf" }
      ],
      requirements: [
        { name: "Product Photography", completed: true },
        { name: "Packaging Design", completed: true },
        { name: "Marketing Copy", completed: true },
        { name: "Inventory Stocked", completed: true },
        { name: "Listing Created", completed: false }
      ],
      readinessScore: 88,
      blockers: ["Awaiting final listing approval"]
    }),
    variantSummary: JSON.stringify({
      total: 2,
      ready: 2,
      blocked: 0,
      avgReadiness: 92
    }),
    lastIntelligenceUpdate: new Date()
  },
  {
    sku: "LURE-COMBO-BASS",
    name: "Bass Master Lure Collection",
    description: "Complete bass fishing lure set with 12 proven patterns. Includes crankbaits, spinnerbaits, and soft plastics in a premium storage case.",
    category: "Fishing Lures",
    weight: "1.8",
    dimensions: "10x7x3",
    standardDimensions: "Small Box",
    cost: "15.50",
    price: "44.99",
    margin: "29.49",
    supplier: "Lure Manufacturers Ltd",
    leadTimeDays: 28,
    isActive: true,
    lifecycleState: "concept",
    intelligenceMetadata: JSON.stringify({
      assets: [
        { type: "product_images", status: "not_started", url: null },
        { type: "packaging_design", status: "in_progress", url: null },
        { type: "marketing_copy", status: "not_started", url: null }
      ],
      requirements: [
        { name: "Product Photography", completed: false },
        { name: "Packaging Design", completed: false },
        { name: "Marketing Copy", completed: false },
        { name: "Inventory Stocked", completed: false },
        { name: "Supplier Contract", completed: true }
      ],
      readinessScore: 22,
      blockers: ["Awaiting prototype samples", "Packaging design not started", "No marketing materials"]
    }),
    variantSummary: JSON.stringify({
      total: 1,
      ready: 0,
      blocked: 1,
      avgReadiness: 20
    }),
    lastIntelligenceUpdate: new Date()
  }
];

// Insert products
for (const product of sampleProducts) {
  try {
    await db.execute(`
      INSERT INTO products (
        sku, name, description, category, weight, dimensions, standardDimensions,
        cost, price, margin, supplier, leadTimeDays, isActive, lifecycleState,
        intelligenceMetadata, variantSummary, lastIntelligenceUpdate, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        lifecycleState = VALUES(lifecycleState),
        intelligenceMetadata = VALUES(intelligenceMetadata),
        variantSummary = VALUES(variantSummary),
        lastIntelligenceUpdate = VALUES(lastIntelligenceUpdate),
        updatedAt = NOW()
    `, [
      product.sku,
      product.name,
      product.description,
      product.category,
      product.weight,
      product.dimensions,
      product.standardDimensions,
      product.cost,
      product.price,
      product.margin,
      product.supplier,
      product.leadTimeDays,
      product.isActive,
      product.lifecycleState,
      product.intelligenceMetadata,
      product.variantSummary,
      product.lastIntelligenceUpdate
    ]);
    
    console.log(`✅ Created/Updated: ${product.name} (${product.sku}) - ${product.lifecycleState}`);
  } catch (error) {
    console.error(`❌ Error creating ${product.sku}:`, error.message);
  }
}

console.log("\n✅ Sample products seeded successfully!");
console.log("\nProducts created:");
console.log("1. ProCast Fishing Line - 20lb Test (Development stage, 65% ready)");
console.log("2. Elite Tackle Storage System (Pre-Launch stage, 88% ready)");
console.log("3. Bass Master Lure Collection (Concept stage, 22% ready)");

await connection.end();
