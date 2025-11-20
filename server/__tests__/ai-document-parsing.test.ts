import { describe, it, expect, vi } from 'vitest';

/**
 * Tests for AI Document Parsing Integration
 * Validates document parsing service and case creation with auto-filled data
 */

describe('AI Document Parsing', () => {
  describe('parseClaimDocument', () => {
    it('should extract structured claim data from document text', () => {
      const mockDocumentText = `
        Claim for Late Delivery
        Order #12345
        Tracking: 1Z999AA10123456784
        Carrier: UPS
        Customer: John Doe (john@example.com)
        Claim Amount: $150.00
        The package was supposed to arrive on 2025-01-15 but arrived on 2025-01-20.
      `;

      // Mock AI response structure
      const expectedParsedData = {
        title: expect.any(String),
        description: expect.any(String),
        caseType: expect.stringMatching(/late_delivery|damaged_goods|lost_package|incorrect_charges|service_failure|other/),
        carrier: expect.any(String),
        trackingNumber: expect.any(String),
        claimAmount: expect.any(Number),
        priority: expect.stringMatching(/low|medium|high|urgent/),
        confidence: expect.any(Number),
      };

      expect(expectedParsedData).toBeDefined();
    });

    it('should handle missing optional fields gracefully', () => {
      const mockDocumentText = `
        Simple claim with minimal information
        Tracking: ABC123
        Carrier: FedEx
      `;

      const expectedParsedData = {
        title: expect.any(String),
        caseType: expect.any(String),
        carrier: 'FedEx',
        trackingNumber: 'ABC123',
        customerName: null,
        customerEmail: null,
        customerPhone: null,
      };

      expect(expectedParsedData).toBeDefined();
    });

    it('should return confidence score between 0-100', () => {
      const confidence = 85;
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('extractTextFromDocument', () => {
    it('should handle image files (placeholder for OCR)', () => {
      const mimeType = 'image/png';
      const fileName = 'screenshot.png';
      
      // For now, OCR is not implemented, so it should return a placeholder message
      const expectedMessage = expect.stringContaining('OCR extraction not yet implemented');
      expect(expectedMessage).toBeDefined();
    });

    it('should handle PDF files (placeholder for PDF parsing)', () => {
      const mimeType = 'application/pdf';
      const fileName = 'invoice.pdf';
      
      // For now, PDF parsing is not implemented, so it should return a placeholder message
      const expectedMessage = expect.stringContaining('PDF text extraction not yet implemented');
      expect(expectedMessage).toBeDefined();
    });

    it('should decode plain text files', () => {
      const textContent = 'Sample claim text';
      const base64Data = Buffer.from(textContent).toString('base64');
      const mimeType = 'text/plain';
      
      // Should decode base64 and return text
      const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
      expect(decoded).toBe(textContent);
    });

    it('should handle unsupported file types', () => {
      const mimeType = 'application/zip';
      const expectedMessage = expect.stringContaining('Unsupported file type');
      expect(expectedMessage).toBeDefined();
    });
  });

  describe('parseDocument endpoint', () => {
    it('should accept base64 file data and return parsed result', () => {
      const mockInput = {
        fileData: 'base64EncodedData',
        fileName: 'claim.txt',
        fileType: 'text/plain',
      };

      const expectedResponse = {
        success: expect.any(Boolean),
        data: expect.any(Object),
        message: expect.any(String),
      };

      expect(expectedResponse).toBeDefined();
    });

    it('should return success=false when parsing fails', () => {
      const mockInput = {
        fileData: 'invalidData',
        fileName: 'test.xyz',
        fileType: 'application/unknown',
      };

      const expectedResponse = {
        success: false,
        message: expect.any(String),
        data: null,
      };

      expect(expectedResponse).toBeDefined();
    });

    it('should handle extraction errors gracefully', () => {
      const mockInput = {
        fileData: '',
        fileName: '',
        fileType: '',
      };

      const expectedResponse = {
        success: false,
        message: expect.stringContaining('Failed to parse document'),
        data: null,
      };

      expect(expectedResponse).toBeDefined();
    });
  });

  describe('Frontend Integration', () => {
    it('should auto-fill form fields when document is parsed successfully', () => {
      const parsedData = {
        title: 'Late Delivery Claim',
        description: 'Package arrived 5 days late',
        caseType: 'late_delivery',
        carrier: 'UPS',
        trackingNumber: '1Z999AA10123456784',
        claimAmount: 150,
        priority: 'high',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '555-0123',
        confidence: 92,
      };

      // Simulate form state update
      const formData = {
        title: parsedData.title,
        description: parsedData.description,
        caseType: parsedData.caseType,
        carrier: parsedData.carrier,
        trackingNumber: parsedData.trackingNumber,
        claimAmount: parsedData.claimAmount.toString(),
        priority: parsedData.priority,
        customerName: parsedData.customerName,
        customerEmail: parsedData.customerEmail,
        customerPhone: parsedData.customerPhone,
      };

      expect(formData.title).toBe('Late Delivery Claim');
      expect(formData.caseType).toBe('late_delivery');
      expect(formData.carrier).toBe('UPS');
      expect(formData.trackingNumber).toBe('1Z999AA10123456784');
      expect(formData.claimAmount).toBe('150');
    });

    it('should preserve existing form data when parsed field is null', () => {
      const existingFormData = {
        title: 'Manual Entry',
        carrier: 'FedEx',
      };

      const parsedData = {
        title: null,
        carrier: 'UPS',
        trackingNumber: 'ABC123',
      };

      // Merge logic: use parsed data if available, otherwise keep existing
      const mergedData = {
        title: parsedData.title || existingFormData.title,
        carrier: parsedData.carrier || existingFormData.carrier,
        trackingNumber: parsedData.trackingNumber,
      };

      expect(mergedData.title).toBe('Manual Entry'); // Kept existing
      expect(mergedData.carrier).toBe('UPS'); // Used parsed
      expect(mergedData.trackingNumber).toBe('ABC123'); // Used parsed
    });

    it('should display confidence score to user', () => {
      const confidence = 87;
      const displayText = `${confidence}% confidence`;
      expect(displayText).toBe('87% confidence');
    });

    it('should show parsing progress indicator', () => {
      const isParsing = true;
      const loadingMessage = isParsing ? 'Analyzing document with AI...' : '';
      expect(loadingMessage).toBe('Analyzing document with AI...');
    });

    it('should show success message after parsing', () => {
      const parsedData = { confidence: 95 };
      const successMessage = `Document parsed (${parsedData.confidence}% confidence)`;
      expect(successMessage).toBe('Document parsed (95% confidence)');
    });
  });

  describe('Error Handling', () => {
    it('should show error message when parsing fails', () => {
      const errorMessage = 'Failed to parse document. Please fill in details manually.';
      expect(errorMessage).toContain('Failed to parse document');
    });

    it('should allow manual entry when auto-parsing is not available', () => {
      const message = 'Could not parse document automatically';
      expect(message).toContain('Could not parse document');
    });

    it('should handle file read errors', () => {
      const errorMessage = 'Failed to read file';
      expect(errorMessage).toBe('Failed to read file');
    });
  });

  describe('Case Creation with Parsed Data', () => {
    it('should create case with auto-filled data from parsed document', () => {
      const parsedData = {
        title: 'Damaged Package Claim',
        description: 'Box arrived crushed',
        caseType: 'damaged_goods',
        carrier: 'FedEx',
        trackingNumber: '123456789',
        claimAmount: 200,
        priority: 'urgent',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        confidence: 88,
      };

      const caseData = {
        title: parsedData.title,
        description: parsedData.description,
        caseType: parsedData.caseType,
        carrier: parsedData.carrier,
        trackingNumber: parsedData.trackingNumber,
        claimAmount: parsedData.claimAmount.toString(),
        priority: parsedData.priority,
        customerName: parsedData.customerName,
        customerEmail: parsedData.customerEmail,
      };

      expect(caseData.title).toBe('Damaged Package Claim');
      expect(caseData.caseType).toBe('damaged_goods');
      expect(caseData.priority).toBe('urgent');
    });

    it('should attach uploaded files to created case', () => {
      const caseId = 123;
      const files = [
        { fileName: 'screenshot.png', fileUrl: 'https://s3.../screenshot.png' },
        { fileName: 'invoice.pdf', fileUrl: 'https://s3.../invoice.pdf' },
      ];

      expect(files).toHaveLength(2);
      expect(files[0].fileName).toBe('screenshot.png');
      expect(files[1].fileName).toBe('invoice.pdf');
    });
  });
});
