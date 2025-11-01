import { Router } from "express";
import { FormGeneratorService } from "../services/formGenerator";
// Auth middleware not needed for now - will add later

const router = Router();

/**
 * Generate dispute form for a case
 * POST /api/forms/generate/:caseId
 */
router.post("/generate/:caseId", async (req, res) => {
  try {
    const caseId = parseInt(req.params.caseId);
    const { carrier } = req.body;

    if (!carrier) {
      return res.status(400).json({ error: "Carrier is required" });
    }

    const pdfBuffer = await FormGeneratorService.generateDisputeForm(caseId, carrier);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="dispute-form-${caseId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error("Form generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate form" });
  }
});

/**
 * Preview form data for a case
 * GET /api/forms/preview/:caseId
 */
router.get("/preview/:caseId", async (req, res) => {
  try {
    const caseId = parseInt(req.params.caseId);
    
    // This would return the form data structure for preview
    // Implementation would extract case data without generating PDF
    
    res.json({ message: "Form preview not yet implemented" });
  } catch (error: any) {
    console.error("Form preview error:", error);
    res.status(500).json({ error: error.message || "Failed to preview form" });
  }
});

export default router;
