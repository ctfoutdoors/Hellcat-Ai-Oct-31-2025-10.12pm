import { drizzle } from "drizzle-orm/mysql2";
import { certifications } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

const standardTubes = [
  {
    name: "Standard Tube 9x2x2 - Yazoo Manufacturer Specification",
    dimensions_inches: "9 x 2 x 2",
    dimensions_cm: "22.86 x 5.08 x 5.08",
    diameter: "2 inches",
  },
  {
    name: "Standard Tube 9x3.45x3.45 - Yazoo Manufacturer Specification",
    dimensions_inches: "9 x 3.45 x 3.45",
    dimensions_cm: "22.86 x 8.76 x 8.76",
    diameter: "3.45 inches",
  },
  {
    name: "Standard Tube 9x4x4 - Yazoo Manufacturer Specification",
    dimensions_inches: "9 x 4 x 4",
    dimensions_cm: "22.86 x 10.16 x 10.16",
    diameter: "4 inches",
  },
  {
    name: "Standard Tube 9x5x5 - Yazoo Manufacturer Specification",
    dimensions_inches: "9 x 5 x 5",
    dimensions_cm: "22.86 x 12.70 x 12.70",
    diameter: "5 inches",
  },
  {
    name: "Standard Tube 9x6x6 - Yazoo Manufacturer Specification",
    dimensions_inches: "9 x 6 x 6",
    dimensions_cm: "22.86 x 15.24 x 15.24",
    diameter: "6 inches",
  },
];

async function populateCertifications() {
  console.log("Populating standard tube certifications...");

  for (const tube of standardTubes) {
    const specifications = {
      dimensions_inches: tube.dimensions_inches,
      dimensions_cm: tube.dimensions_cm,
      shape: "cylindrical",
      material: "plastic tube",
      manufacturer: "Yazoo",
      "3pl_provider": "Pitman Creek Distribution",
      "3pl_address": "213 Tech Way, Stanford KY",
      cross_section: `circular (${tube.diameter} diameter)`,
      length: "9 inches",
      diameter: tube.diameter,
    };

    await db.insert(certifications).values({
      certificationType: "ROD_TUBE",
      productId: null,
      certificationName: tube.name,
      specifications: JSON.stringify(specifications),
      attachments: JSON.stringify([]),
      certificationDate: new Date("2025-10-29"),
      expiryDate: new Date("2030-10-29"),
      status: "ACTIVE",
      notes: `Standard fishing line tube packaging. Cylindrical shape with ${tube.diameter} diameter circular cross-section. Manufacturer: Yazoo. Fulfillment: Pitman Creek Distribution.`,
      createdBy: 1,
    });

    console.log(`✓ Created certification: ${tube.name}`);
  }

  console.log("\n✅ All certifications created successfully!");
  process.exit(0);
}

populateCertifications().catch((error) => {
  console.error("Error populating certifications:", error);
  process.exit(1);
});
