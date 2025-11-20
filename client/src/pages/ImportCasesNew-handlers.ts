/**
 * Handler functions for ImportCasesNew component
 * Separated for clarity and reusability
 */

/**
 * Parse uploaded files with AI to extract claim details
 * @param files - Array of File objects to parse
 * @param parseDocument - tRPC mutation for parsing
 * @param setIsParsing - State setter for parsing indicator
 * @param setParsedData - State setter for parsed data
 * @param setParseConfidence - State setter for confidence score
 * @param setNewCaseData - State setter for case form data
 */
export async function handleFilesSelected(
  files: File[],
  parseDocument: any,
  setIsParsing: (value: boolean) => void,
  setParsedData: (value: any) => void,
  setParseConfidence: (value: number) => void,
  setNewCaseData: (setter: (prev: any) => any) => void
) {
  if (files.length === 0) return;

  setIsParsing(true);
  
  try {
    // Parse the first file (for now, we'll parse one file at a time)
    const file = files[0];
    
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    
    // Call AI parsing endpoint
    const result = await parseDocument.mutateAsync({
      fileData: base64Data,
      fileName: file.name,
      fileType: file.type,
    });

    if (result.success && result.data) {
      const parsed = result.data;
      setParsedData(parsed);
      setParseConfidence(parsed.confidence || 0);
      
      // Auto-fill form fields with parsed data
      setNewCaseData((prev: any) => ({
        ...prev,
        title: parsed.title || prev.title,
        description: parsed.description || prev.description,
        caseType: parsed.caseType || prev.caseType,
        carrier: parsed.carrier || prev.carrier,
        trackingNumber: parsed.trackingNumber || prev.trackingNumber,
        claimAmount: parsed.claimAmount?.toString() || prev.claimAmount,
        priority: parsed.priority || prev.priority,
        customerName: parsed.customerName || prev.customerName,
        customerEmail: parsed.customerEmail || prev.customerEmail,
        customerPhone: parsed.customerPhone || prev.customerPhone,
      }));

      return {
        success: true,
        message: `Document parsed successfully (${parsed.confidence}% confidence)`,
        data: parsed,
      };
    } else {
      return {
        success: false,
        message: result.message || "Failed to parse document",
        data: null,
      };
    }
  } catch (error: any) {
    console.error("Document parsing error:", error);
    return {
      success: false,
      message: error.message || "Failed to parse document",
      data: null,
    };
  } finally {
    setIsParsing(false);
  }
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/png;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
